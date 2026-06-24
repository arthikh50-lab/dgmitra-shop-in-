import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, ArrowLeft, Star, Shield, Truck, 
  ChevronRight, ChevronLeft, Heart, Share2, Sparkles, Scissors, Paintbrush,
  Calculator, ArrowRight, Image as ImageIcon, Upload as UploadIcon, X, Loader2, Check, Copy, Mail, RefreshCw, Move
} from 'lucide-react';
import { 
  WhatsappShareButton, 
  FacebookShareButton, 
  TwitterShareButton, 
  EmailShareButton,
  WhatsappIcon,
  FacebookIcon,
  TwitterIcon,
  EmailIcon
} from 'react-share';
import { doc, getDoc, getDocFromCache, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, deleteDoc } from '../firebase';
import { db, OperationType, handleFirestoreError, isQuotaError } from '../firebase';
import { formatCurrency, cn } from '../utils';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { QuotaErrorBanner } from '../components/QuotaErrorBanner';
import SEO from '../components/SEO';
import { generateDesignPreview, createBaseLayer } from '../services/geminiService';
import imageCompression from 'browser-image-compression';
import DesignCustomizer from '../components/DesignCustomizer';
import { Maximize2 } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [compatibleDesigns, setCompatibleDesigns] = useState<any[]>([]);
  
  // Customization State
  const [selectedCustomization, setSelectedCustomization] = useState<any>(null);
  const [customizationPreview, setCustomizationPreview] = useState<string | null>(null);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [allGalleryItems, setAllGalleryItems] = useState<any[]>([]);
  const [userDesigns, setUserDesigns] = useState<any[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [baseLayer, setBaseLayer] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [technicalNote, setTechnicalNote] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isManualPlacement, setIsManualPlacement] = useState(false);
  const [placementData, setPlacementData] = useState<any>(null);
  const [resetKey, setResetKey] = useState(0);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const CUSTOMIZATION_FEE = 299;

  // Price Calculator State
  const [calcGarment, setCalcGarment] = useState('T-shirt');
  const [calcSize, setCalcSize] = useState('Small');
  const [calcService, setCalcService] = useState('Embroidery Design');

  const estimatedPrice = useMemo(() => {
    if (!product) return 0;
    
    const sizeMultipliers: Record<string, number> = {
      'Small': 1,
      'Medium': 1.1,
      'Large': 1.2
    };

    const serviceAddons: Record<string, number> = {
      'Embroidery Design': 150,
      'Painting': 100,
      'DTF Printing': 50
    };

    const base = product.price || 0;
    const multiplier = sizeMultipliers[calcSize] || 1;
    const addon = serviceAddons[calcService] || 0;

    return Math.round((base * multiplier) + addon);
  }, [product?.price, calcSize, calcService]);

  const fetchProduct = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'products', id);
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (err) {
        if (isQuotaError(err)) {
          console.warn("ProductDetail: Fetching from cache due to quota.");
          docSnap = await getDocFromCache(docRef);
          setQuotaExceeded(true);
        } else throw err;
      }
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProduct({ id: docSnap.id, ...data });
        if (!quotaExceeded) setQuotaExceeded(false);

        // Auto-select garment type if it matches
        const category = data.category?.toLowerCase() || '';
        if (category.includes('t-shirt') || category.includes('tee')) setCalcGarment('T-shirt');
        else if (category.includes('hoodie')) setCalcGarment('Hoodie');
        else if (category.includes('jacket')) setCalcGarment('Jacket');

        // Fetch compatible designs if any
        if (data.galleryDesignOptions && data.galleryDesignOptions.length > 0) {
          fetchCompatibleDesigns(data.galleryDesignOptions);
        }

        // Fetch user's previous designs for this product
        if (user) {
          fetchUserDesigns(docSnap.id);
        }
      } else {
        navigate('/shop');
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      if (isQuotaError(error)) {
        setQuotaExceeded(true);
      } else {
        handleFirestoreError(error, OperationType.GET, `products/${id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDesigns = async (productId: string) => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'user_designs'), 
        where('userId', '==', user.uid),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const designs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserDesigns(designs);
    } catch (error) {
      console.error("Error fetching user designs:", error);
    }
  };

  const fetchCompatibleDesigns = async (designIds: string[]) => {
    try {
      const q = query(collection(db, 'gallery'), where('id', 'in', designIds.slice(0, 10)));
      const snapshot = await getDocs(q);
      const designs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompatibleDesigns(designs);
    } catch (error) {
      console.error("Error fetching compatible designs:", error);
    }
  };

  const fetchAllGalleryItems = async () => {
    setGalleryLoading(true);
    try {
      const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllGalleryItems(items);
    } catch (error) {
      console.error("Error fetching gallery items:", error);
    } finally {
      setGalleryLoading(false);
    }
  };

  const compressImage = async (file: File): Promise<string> => {
    const options = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      initialQuality: 0.7
    };
    try {
      const compressedFile = await imageCompression(file, options);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
    } catch (error) {
      console.error("Compression failed:", error);
      return "";
    }
  };

  const generateAIPreview = async (designUrl: string, isGallery = false) => {
    if (!product) return;
    setIsGeneratingPreview(true);
    try {
      let currentBase = baseLayer;
      if (!currentBase) {
        currentBase = await createBaseLayer(product.imageUrl);
        setBaseLayer(currentBase);
      }
      
      if (currentBase) {
        const result = await generateDesignPreview(
          currentBase, 
          designUrl, 
          `Apply this design to the ${product.name}.`,
          isGallery
        );
        if (result?.imageUrl) {
          setPreviewUrl(result.imageUrl);
          setTechnicalNote(result.technicalNote);
        }
      }
    } catch (error) {
      console.error("Preview generation failed:", error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && product) {
      const compressed = await compressImage(file);
      setSelectedCustomization({ type: 'upload', url: compressed });
      setCustomizationPreview(compressed);
      generateAIPreview(compressed, false);

      // Save to Firestore if user is logged in
      if (user) {
        try {
          const docRef = await addDoc(collection(db, 'user_designs'), {
            userId: user.uid,
            productId: product.id,
            imageUrl: compressed,
            createdAt: serverTimestamp()
          });
          // Update local state
          setUserDesigns(prev => [{ id: docRef.id, imageUrl: compressed, createdAt: new Date() }, ...prev]);
        } catch (error) {
          console.error("Error saving user design:", error);
        }
      }
    }
  };

  const handleGallerySelect = (design: any) => {
    setSelectedCustomization({ type: 'gallery', id: design.id, name: design.title, url: design.imageUrl });
    setCustomizationPreview(design.imageUrl);
    setIsGalleryModalOpen(false);
    generateAIPreview(design.imageUrl, true);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || (product.images && product.images[0]) || '',
      images: product.images || (product.imageUrl ? [product.imageUrl] : []),
      quantity: 1,
      size: calcSize,
      customization: selectedCustomization ? {
        ...selectedCustomization,
        fee: CUSTOMIZATION_FEE,
        previewUrl: previewUrl || undefined,
        technicalNote: technicalNote || undefined
      } : undefined
    });
    
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: `DG MITRA FOR ALL - ${product.name}`,
      text: product.description || `Check out this amazing ${product.name} at DG MITRA FOR ALL!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          setIsShareMenuOpen(true);
        }
      }
    } else {
      setIsShareMenuOpen(!isShareMenuOpen);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id, navigate]);

  useEffect(() => {
    if (location.state?.selectedDesign && product) {
      const design = location.state.selectedDesign;
      setSelectedCustomization({ type: 'ai-studio', url: design.imageUrl });
      setCustomizationPreview(design.imageUrl);
      generateAIPreview(design.imageUrl, false);
    }
  }, [location.state, product]);

  useEffect(() => {
    if (previewContainerRef.current) {
      setContainerWidth(previewContainerRef.current.offsetWidth);
    }
  }, [previewContainerRef.current, loading, product]);

  if (loading) {
    return (
      <div className="pt-40 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images || (product.imageUrl ? [product.imageUrl] : []);

  return (
    <div className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <SEO 
        title={product.name} 
        description={product.description} 
      />
      {quotaExceeded && (
        <div className="mb-8">
          <QuotaErrorBanner onRetry={fetchProduct} />
        </div>
      )}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/shop" className="hover:text-brand-green">Shop</Link>
          <ChevronRight size={14} />
          <span className="text-gray-600 font-medium">{product.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Product Images */}
        <div className="space-y-6">
          <motion.div 
            ref={previewContainerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-[4/5] bg-brand-beige rounded-[3rem] overflow-hidden shadow-sm border border-gray-100 relative group"
          >
            <AnimatePresence mode="wait">
              {isGeneratingPreview ? (
                <motion.div 
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
                >
                  <Loader2 className="animate-spin text-brand-green mb-4" size={48} />
                  <p className="text-lg font-bold text-brand-black">Generating AI Preview...</p>
                  <p className="text-sm text-gray-500 mt-2">Applying your custom magic to the {product.name}</p>
                </motion.div>
              ) : isManualPlacement && customizationPreview ? (
                <motion.div
                  key="manual"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10"
                >
                  <DesignCustomizer
                    key={resetKey}
                    backgroundImage={images[activeImage]}
                    designImage={customizationPreview}
                    width={containerWidth}
                    height={containerWidth * 1.25} // aspect-[4/5]
                    onUpdate={setPlacementData}
                  />
                </motion.div>
              ) : (
                <motion.img 
                  key={previewUrl && !showOriginal ? previewUrl : images[activeImage]}
                  src={previewUrl && !showOriginal ? previewUrl : images[activeImage]} 
                  alt={product.name} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              )}
            </AnimatePresence>

            {customizationPreview && !isGeneratingPreview && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-xl z-20">
                <button
                  onClick={() => {
                    setShowOriginal(false);
                    setIsManualPlacement(false);
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5",
                    !showOriginal && !isManualPlacement ? "bg-brand-green text-white" : "text-gray-400 hover:text-brand-green"
                  )}
                >
                  <Sparkles size={12} />
                  AI RENDER
                </button>
                <button
                  onClick={() => {
                    setIsManualPlacement(true);
                    setShowOriginal(false);
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5",
                    isManualPlacement ? "bg-brand-green text-white" : "text-gray-400 hover:text-brand-green"
                  )}
                >
                  <Move size={12} />
                  PLACEMENT
                </button>
                {isManualPlacement && (
                  <button
                    onClick={() => setResetKey(prev => prev + 1)}
                    className="px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-400 hover:text-red-500 transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} />
                    RESET
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowOriginal(true);
                    setIsManualPlacement(false);
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all",
                    showOriginal ? "bg-brand-green text-white" : "text-gray-400 hover:text-brand-green"
                  )}
                >
                  ORIGINAL
                </button>
              </div>
            )}

            {/* Navigation Arrows */}
            {!previewUrl && images.length > 1 && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 backdrop-blur-sm text-brand-black opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-green hover:text-white shadow-lg z-20"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 backdrop-blur-sm text-brand-black opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-green hover:text-white shadow-lg z-20"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {product.isNewArrival && (
              <div className="absolute top-6 left-6 bg-brand-green text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                NEW ARRIVAL
              </div>
            )}
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className={cn(
                "absolute top-6 right-6 p-3 rounded-full shadow-lg transition-all",
                isFavorite ? "bg-red-500 text-white" : "bg-white/90 text-gray-400 hover:text-red-500"
              )}
            >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </motion.div>

          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0",
                    activeImage === idx ? "border-brand-green shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-6 sm:mb-8">
            <p className="text-brand-green font-bold text-[10px] sm:text-sm tracking-widest uppercase mb-2">{product.category}</p>
            <h1 className="text-3xl sm:text-5xl font-display font-bold mb-4 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} className="sm:w-[18px] sm:h-[18px]" fill="currentColor" />)}
              </div>
              <span className="text-xs sm:text-sm text-gray-400 font-medium">(4.9 • 128 Reviews)</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-brand-black">{formatCurrency(product.price)}</p>
          </div>

          <div className="prose prose-gray mb-8 sm:mb-10">
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              {product.description || "Experience premium quality and sustainable fashion with our carefully crafted pieces. This garment is designed for both style and durability, making it a perfect addition to your conscious wardrobe."}
            </p>
          </div>

          <div className="space-y-4 mb-10">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Shield size={18} className="text-brand-green" />
              <span>Sustainable & Ethical Production</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Truck size={18} className="text-brand-green" />
              <span>Free Express Shipping on orders over ₹2000</span>
            </div>
          </div>

          {product.customizableWith && product.customizableWith.length > 0 && (
            <div className="mb-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Available Customizations</p>
              <div className="flex flex-wrap gap-3">
                {product.customizableWith.map((method: string) => (
                  <div key={method} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    {method === 'embroidery' && <Scissors size={14} className="text-brand-green" />}
                    {method === 'painting' && <Paintbrush size={14} className="text-brand-green" />}
                    {method === 'printing' && <Sparkles size={14} className="text-brand-green" />}
                    <span className="text-sm font-bold capitalize">{method}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Customization Section */}
          <div className="mb-10 p-6 bg-brand-beige/30 rounded-[2rem] border border-brand-beige">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles size={20} className="text-brand-green" />
                Add Your Custom Magic <span className="text-xs font-normal text-gray-400">(Optional)</span>
              </h3>
              <div className="bg-brand-green/10 text-brand-green text-[10px] font-bold px-3 py-1 rounded-full border border-brand-green/20">
                AI POWERED
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setIsGalleryModalOpen(true);
                  if (allGalleryItems.length === 0) fetchAllGalleryItems();
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 group",
                  selectedCustomization?.type === 'gallery' 
                    ? "border-brand-green bg-brand-green/5" 
                    : "border-gray-100 bg-white hover:border-brand-green/30"
                )}
              >
                <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon className="text-brand-green" size={20} />
                </div>
                <span className="text-xs font-bold">Pick from Premium Gallery</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 group",
                  selectedCustomization?.type === 'upload' 
                    ? "border-brand-green bg-brand-green/5" 
                    : "border-gray-100 bg-white hover:border-brand-green/30"
                )}
              >
                <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadIcon className="text-brand-green" size={20} />
                </div>
                <span className="text-xs font-bold">Upload Your Own Art</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleCustomUpload} 
                  className="hidden" 
                  accept="image/*" 
                />
              </button>
            </div>

            {selectedCustomization && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center justify-between p-3 bg-white rounded-xl border border-brand-green/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100">
                    <img src={customizationPreview || ''} alt="Selected" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selected Art</p>
                    <p className="text-xs font-bold truncate max-w-[120px]">
                      {selectedCustomization.type === 'gallery' ? selectedCustomization.name : 'Your Upload'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-green">+{formatCurrency(CUSTOMIZATION_FEE)}</span>
                  <button 
                    onClick={() => {
                      setSelectedCustomization(null);
                      setCustomizationPreview(null);
                      setPreviewUrl(null);
                      setTechnicalNote(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {technicalNote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-brand-green" />
                  <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest">AI Technical Note</span>
                </div>
                <p className="text-xs text-gray-600 italic leading-relaxed">
                  "{technicalNote}"
                </p>
              </motion.div>
            )}

            {userDesigns.length > 0 && (
              <div className="mt-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Your Recent Uploads</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {userDesigns.map((design) => (
                    <div key={design.id} className="relative group shrink-0">
                      <button
                        onClick={() => {
                          setSelectedCustomization({ type: 'upload', url: design.imageUrl });
                          setCustomizationPreview(design.imageUrl);
                          generateAIPreview(design.imageUrl, false);
                        }}
                        className={cn(
                          "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                          selectedCustomization?.url === design.imageUrl 
                            ? "border-brand-green shadow-md" 
                            : "border-transparent hover:border-brand-green/30"
                        )}
                      >
                        <img src={design.imageUrl} alt="Recent Upload" className="w-full h-full object-cover" />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await deleteDoc(doc(db, 'user_designs', design.id));
                            setUserDesigns(prev => prev.filter(d => d.id !== design.id));
                            if (selectedCustomization?.url === design.imageUrl) {
                              setSelectedCustomization(null);
                              setCustomizationPreview(null);
                              setPreviewUrl(null);
                              setTechnicalNote(null);
                            }
                          } catch (error) {
                            console.error("Error deleting design:", error);
                          }
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
            <button 
              onClick={() => navigate(`/customize/${product.id}`)}
              className="btn-primary py-5 flex items-center justify-center gap-3 text-lg group"
            >
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
              Full Customizer
            </button>
            <button 
              onClick={handleAddToCart}
              disabled={addedToCart}
              className={cn(
                "py-5 flex items-center justify-center gap-3 text-lg transition-all rounded-2xl font-bold",
                addedToCart 
                  ? "bg-brand-green text-white" 
                  : "bg-brand-black text-white hover:bg-brand-green"
              )}
            >
              {addedToCart ? (
                <>
                  <Check size={20} />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBag size={20} />
                  Add to Cart
                </>
              )}
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-beige rounded-full flex items-center justify-center">
                <Scissors size={18} className="text-brand-black" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Technique</p>
                <p className="text-sm font-bold">Premium Embroidery</p>
              </div>
            </div>
            <div className="relative">
              <button 
                onClick={handleShare}
                className={cn(
                  "p-3 rounded-full transition-all group",
                  isShareMenuOpen ? "bg-brand-green text-white" : "hover:bg-gray-100 text-gray-400 hover:text-brand-green"
                )}
                title="Share Product"
              >
                <Share2 size={20} className="group-hover:scale-110 transition-transform" />
              </button>

              <AnimatePresence>
                {isShareMenuOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsShareMenuOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute bottom-full right-0 mb-4 p-4 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 flex items-center gap-3"
                    >
                      <WhatsappShareButton url={window.location.href} title={`Check out ${product.name} at DG MITRA FOR ALL!`}>
                        <WhatsappIcon size={32} round />
                      </WhatsappShareButton>
                      <FacebookShareButton url={window.location.href}>
                        <FacebookIcon size={32} round />
                      </FacebookShareButton>
                      <TwitterShareButton url={window.location.href} title={`Check out ${product.name} at DG MITRA FOR ALL!`}>
                        <TwitterIcon size={32} round />
                      </TwitterShareButton>
                      <EmailShareButton url={window.location.href} subject={`DG MITRA FOR ALL - ${product.name}`} body={`Check out this amazing ${product.name} at DG MITRA FOR ALL!`}>
                        <EmailIcon size={32} round />
                      </EmailShareButton>
                      <div className="w-px h-8 bg-gray-100 mx-1" />
                      <button 
                        onClick={copyToClipboard}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-brand-green hover:text-white transition-colors"
                        title="Copy Link"
                      >
                        <Copy size={14} />
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showShareTooltip && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-brand-black text-white text-[10px] font-bold rounded-lg whitespace-nowrap shadow-xl z-50"
                  >
                    Link Copied!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Price Calculator Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-24 pt-24 border-t border-gray-100"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-6 mx-auto text-brand-green font-bold">
              <Calculator className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-display font-bold mb-4 tracking-tight">Price Estimator</h2>
            <p className="text-gray-500 text-lg">Calculate the custom redesign cost for your {product.name.toLowerCase()}.</p>
          </div>

          <div className="bg-white p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-xl shadow-brand-green/5 border border-brand-green/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 mb-8 sm:mb-12">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Garment Type</label>
                <div className="space-y-3">
                  {['T-shirt', 'Hoodie', 'Jacket'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setCalcGarment(type)}
                      className={cn(
                        "w-full py-4 px-6 rounded-2xl text-sm font-bold transition-all duration-300",
                        calcGarment === type 
                        ? "bg-brand-green text-white shadow-lg shadow-brand-green/20 scale-[1.02]" 
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Design Size</label>
                <div className="space-y-3">
                  {['Small', 'Medium', 'Large'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setCalcSize(size)}
                      className={cn(
                        "w-full py-4 px-6 rounded-2xl text-sm font-bold transition-all duration-300",
                        calcSize === size 
                        ? "bg-brand-green text-white shadow-lg shadow-brand-green/20 scale-[1.02]" 
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Service Type</label>
                <div className="space-y-3">
                  {['Embroidery Design', 'Painting', 'DTF Printing'].filter(service => {
                    if (!product.customizableWith || product.customizableWith.length === 0) return true;
                    const s = service.split(' ')[0].toLowerCase();
                    const mapped = s === 'dtf' ? 'printing' : s;
                    return product.customizableWith.includes(mapped);
                  }).map((service) => (
                    <button
                      key={service}
                      onClick={() => setCalcService(service)}
                      className={cn(
                        "w-full py-4 px-6 rounded-2xl text-sm font-bold transition-all duration-300",
                        calcService === service 
                        ? "bg-brand-green text-white shadow-lg shadow-brand-green/20 scale-[1.02]" 
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      {service.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <p className="text-gray-400 text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-2">Estimated Customization Cost</p>
                <div className="text-4xl sm:text-6xl font-display font-bold text-brand-green">₹{estimatedPrice}</div>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-2 font-medium">*Final price may vary based on design complexity</p>
              </div>
              <button 
                onClick={() => navigate(`/customize/${product.id}`)}
                className="btn-primary w-full md:w-auto px-12 py-5 text-lg flex items-center justify-center gap-3 group"
              >
                Start Customizing <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {compatibleDesigns.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 pt-24 border-t border-gray-100"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4 tracking-tight">Recommended <span className="text-brand-green">Designs</span></h2>
            <p className="text-gray-500 text-lg">These gallery designs work perfectly with the {product.name}.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {compatibleDesigns.map((design, idx) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer"
              >
                <Link to="/upload" state={{ selectedDesign: design }}>
                  <div className="relative aspect-square rounded-3xl overflow-hidden mb-4 bg-gray-100">
                    <img 
                      src={design.imageUrl} 
                      alt={design.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white text-brand-black font-bold py-2 px-4 rounded-xl flex items-center gap-2">
                        Apply Design <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                  <h4 className="font-bold text-lg">{design.title}</h4>
                  <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">{design.category}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Gallery Selection Modal */}
      <AnimatePresence>
        {isGalleryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGalleryModalOpen(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold">Premium Design Gallery</h2>
                  <p className="text-sm text-gray-500">Select a design to apply to your {product.name}</p>
                </div>
                <button 
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {galleryLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-brand-green mb-4" size={32} />
                    <p className="text-gray-500 font-medium">Loading designs...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {allGalleryItems.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ y: -5 }}
                        onClick={() => handleGallerySelect(item)}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 border border-gray-100">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-brand-green/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white text-brand-green text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                              SELECT DESIGN
                            </div>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold truncate">{item.title}</h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{item.category}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
