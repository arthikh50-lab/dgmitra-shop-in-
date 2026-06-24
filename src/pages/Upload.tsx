import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload as UploadIcon, Sparkles, Scissors, Paintbrush, Printer, Check, Loader2, AlertCircle, RefreshCw, LogIn, Save, X, Zap, Search, Image as ImageIcon, Shirt, Package, ShoppingBag, ArrowRight, Move } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { detectFabricAndSuggestDesign, generateDesignPreview, createBaseLayer } from '../services/geminiService';
import DesignCustomizer from '../components/DesignCustomizer';

import { useAuth } from '../AuthContext';
import { db, loginWithGoogle, OperationType, handleFirestoreError, isQuotaError, uploadBase64ToStorage } from '../firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc, updateDoc, getDocFromCache, query, orderBy, getDocs, getDocsFromCache } from '../firebase';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { cn } from '../utils';
import SEO from '../components/SEO';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-gray-200 rounded-xl", className)} />
);

const AnalysisSkeleton = () => (
  <div className="glass-card p-8 rounded-3xl space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  </div>
);

const PreviewSkeleton = () => (
  <div className="w-full h-full p-8 flex flex-col items-center justify-center space-y-4">
    <Skeleton className="w-20 h-20 rounded-2xl" />
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-4 w-32" />
    <div className="w-full space-y-2 pt-8">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  </div>
);

export default function Upload() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  const [selectedPath, setSelectedPath] = useState<'own' | 'new' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [baseLayer, setBaseLayer] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [selectedGalleryDesign, setSelectedGalleryDesign] = useState<any>(null);
  const [technicalNote, setTechnicalNote] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number; aspect: number } | null>(null);
  const [customDimensions, setCustomDimensions] = useState<{ width: number; height: number; aspect: number } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{ original: number; compressed: number } | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isMockPayment, setIsMockPayment] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    pincode: '',
    phone: ''
  });
  const [isManualPlacement, setIsManualPlacement] = useState(false);
  const [placementData, setPlacementData] = useState<any>(null);
  const [resetKey, setResetKey] = useState(0);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showAddressModal || showPaymentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddressModal, showPaymentModal]);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState('All');
  const [gallerySearch, setGallerySearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customFileInputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const fetchGalleryItems = async () => {
    setGalleryLoading(true);
    try {
      const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (err) {
        if (isQuotaError(err)) {
          snapshot = await getDocsFromCache(q);
        } else throw err;
      }
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGalleryItems(itemsData);
    } catch (error) {
      console.error("Error fetching gallery items:", error);
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const compressImage = async (imageInput: File | string, maxSizeMB = 0.5): Promise<string> => {
    setIsCompressing(true);
    try {
      let fileToCompress: File | Blob;
      
      if (typeof imageInput === 'string') {
        const response = await fetch(imageInput);
        fileToCompress = await response.blob();
      } else {
        fileToCompress = imageInput;
      }

      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        initialQuality: 0.7
      };
      
      let compressedFile: File | Blob;
      try {
        compressedFile = await imageCompression(fileToCompress as File, options);
      } catch (libError) {
        console.warn("Library compression failed, using canvas fallback:", libError);
        // Canvas fallback for resizing
        const img = new Image();
        const url = URL.createObjectURL(fileToCompress);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(url);
        return dataUrl;
      }
      
      const originalSizeInBytes = typeof imageInput === 'string' ? fileToCompress.size : imageInput.size;
      const originalSize = Math.round(originalSizeInBytes / 1024);
      const compressedSize = Math.round(compressedFile.size / 1024);
      
      console.log(`Compressed image from ${originalSize}KB to ${compressedSize}KB`);
      setCompressionInfo({ original: originalSize, compressed: compressedSize });
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
    } catch (error) {
      console.error("Compression failed completely:", error);
      return typeof imageInput === 'string' ? imageInput : new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageInput as File);
      });
    } finally {
      setIsCompressing(false);
    }
  };

  useEffect(() => {
    if (location.state?.selectedDesign) {
      setSelectedGalleryDesign(location.state.selectedDesign);
      setCustomPreview(location.state.selectedDesign.imageUrl);
      setSelectedService(location.state.selectedDesign.category);
    }

    if (location.state?.reorderData) {
      setSelectedPath('own');
      const data = location.state.reorderData;
      setPreview(data.originalImageUrl);
      setBaseLayer(data.baseLayerUrl || data.originalImageUrl || null);
      setSelectedService(data.serviceType || null);
      setDesignPreview(data.designPreviewUrl || null);
      setCustomPreview(data.customLogoUrl || null);
      setTechnicalNote(data.technicalNote || null);
      
      if (data.fabric && data.condition) {
        setAiResult({
          fabric: data.fabric,
          condition: data.condition,
          suggestions: [
            { type: 'Embroidery', description: 'Custom embroidery based on your design.' },
            { type: 'Painting', description: 'Hand-painted details based on your design.' },
            { type: 'DTF Printing', description: 'High-quality print based on your design.' }
          ]
        });
      }
    }
  }, [location.state]);

  useEffect(() => {
    const loadDraft = async () => {
      if (!orderId || !user) return;
      
      setLoadingDraft(true);
      try {
        const docRef = doc(db, 'orders', orderId);
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (err) {
          if (isQuotaError(err)) {
            console.warn("Upload: Fetching draft from cache due to quota.");
            docSnap = await getDocFromCache(docRef);
          } else throw err;
        }
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.userId !== user.uid) {
            setError("You don't have permission to access this draft.");
            return;
          }
          
          if (data.status !== 'draft') {
            setError("This order is already being processed and cannot be edited.");
            return;
          }

          setSelectedPath('own');
          setPreview(data.originalImageUrl);
          setBaseLayer(data.baseLayerUrl || data.originalImageUrl || null);
          setSelectedService(data.serviceType || null);
          setDesignPreview(data.designPreviewUrl || null);
          setCustomPreview(data.customLogoUrl || null);
          setTechnicalNote(data.technicalNote || null);
          
          if (data.customLogoAdjustments) {
            setRotation(data.customLogoAdjustments.rotation ?? 0);
          }

          if (data.aiResult) {
            setAiResult(data.aiResult);
          } else if (data.fabric && data.condition) {
            setAiResult({
              fabric: data.fabric,
              condition: data.condition,
              suggestions: [
                { type: 'Embroidery', description: 'Custom embroidery based on your design.' },
                { type: 'Painting', description: 'Hand-painted details based on your design.' },
                { type: 'DTF Printing', description: 'High-quality print based on your design.' }
              ]
            });
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `orders/${orderId}`);
      } finally {
        setLoadingDraft(false);
      }
    };

    loadDraft();
  }, [orderId, user]);

  if (authLoading || loadingDraft) {
    return (
      <div className="pt-40 pb-20 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-green" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-32 pb-20 px-6 max-w-xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 bg-brand-green/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8"
        >
          <UploadIcon className="text-brand-green" size={48} />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-display font-bold mb-4"
        >
          Sign in to Upload
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 mb-8 text-lg leading-relaxed"
        >
          To ensure your designs are saved and associated with your account, please log in before uploading. This helps us track your orders and provide a personalized experience.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <button 
            onClick={() => navigate('/login', { state: { from: { pathname: location.pathname } } })}
            className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-lg"
          >
            <LogIn size={20} />
            Continue to Login
          </button>
          <p className="text-sm text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    );
  }

  const resetUpload = () => {
    setSelectedPath(null);
    setFile(null);
    setPreview(null);
    setAiResult(null);
    setBaseLayer(null);
    setError(null);
    setPreviewError(null);
    setSelectedService(null);
    setDesignPreview(null);
    setTechnicalNote(null);
    setCustomImage(null);
    setCustomPreview(null);
    setSelectedGalleryDesign(null);
    setRotation(0);
    setOriginalDimensions(null);
    setCustomDimensions(null);
    setCompressionInfo(null);
    setCouponCode('');
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (customFileInputRef.current) customFileInputRef.current.value = '';
  };

  const getImageDimensions = (url: string): Promise<{ width: number; height: number; aspect: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspect: img.width / img.height
        });
      };
      img.src = url;
    });
  };

  useEffect(() => {
    if (previewContainerRef.current) {
      setContainerWidth(previewContainerRef.current.offsetWidth);
    }
  }, [previewContainerRef.current, selectedPath, generatingPreview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const compressed = await compressImage(selectedFile, 0.08);
      setPreview(compressed);
      const dims = await getImageDimensions(compressed);
      setOriginalDimensions(dims);
    }
  };

  const handleCustomFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setCustomImage(selectedFile);
      setRotation(0);
      const compressed = await compressImage(selectedFile, 0.05); // Logos can be smaller
      setCustomPreview(compressed);
      const dims = await getImageDimensions(compressed);
      setCustomDimensions(dims);
    }
  };

  const getProcessedCustomImage = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!customPreview) return resolve(null);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(customPreview);

        // Handle rotation for canvas size
        const isRotated = rotation % 180 !== 0;
        canvas.width = isRotated ? img.height : img.width;
        canvas.height = isRotated ? img.width : img.height;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        const result = canvas.toDataURL('image/jpeg', 0.5);
        console.log(`Processed custom image: ${Math.round(result.length / 1024)}KB`);
        resolve(result);
      };
      img.src = customPreview;
    });
  };

  const analyzeClothing = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      // Stage 1: Create Base Layer (Background Removal)
      const baseLayerImg = await createBaseLayer(preview);
      if (baseLayerImg) {
        const compressedBase = await compressImage(baseLayerImg, 0.08);
        setBaseLayer(compressedBase);
      } else {
        // Fallback to original if background removal fails, but warn or log
        console.warn("Background removal failed, using original image as base layer.");
        setBaseLayer(preview);
      }

      // Analysis
      const result = await detectFabricAndSuggestDesign(preview);
      if (result) {
        setAiResult(result);
      } else {
        setError("We couldn't analyze your design. Please ensure the image is clear and try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred during analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async (description: string, customLogo?: string) => {
    if (!preview || !baseLayer) return;
    setGeneratingPreview(true);
    setPreviewError(null);
    
    try {
      let logoToUse = customLogo || customPreview || preview; // Fallback to original preview if no custom logo (using it as a design)
      
      // If we have a custom logo and it's been edited, process it
      if (customPreview && rotation !== 0) {
        const processed = await getProcessedCustomImage();
        if (processed) logoToUse = processed;
      }

      const result = await generateDesignPreview(baseLayer, logoToUse, description, !!selectedGalleryDesign);
      if (result?.imageUrl) {
        const compressedDesign = await compressImage(result.imageUrl, 0.08);
        setDesignPreview(compressedDesign);
        setTechnicalNote(result.technicalNote);
      } else {
        setPreviewError("Failed to generate design preview. Please try a different design or try again.");
      }
    } catch (err) {
      setPreviewError("An error occurred while generating the preview.");
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleManualPreview = () => {
    if (!selectedService || !aiResult) return;
    const suggestion = aiResult.suggestions.find((s: any) => s.type === selectedService);
    
    let description = '';
    if (selectedGalleryDesign) {
      description = `The user has manually selected the "${selectedGalleryDesign.title}" design from our Design Gallery. Please apply this specific design to the garment.`;
    } else if (suggestion) {
      description = `${suggestion.description}. Use ${suggestion.colorPalette?.join(', ') || 'matching'} colors with ${suggestion.textureDetails} texture at ${suggestion.placementTechnique}.`;
    }

    if (description) {
      generatePreview(description);
    }
  };

  const applyCoupon = () => {
    setCouponError(null);
    const code = couponCode.toUpperCase().trim();
    
    if (code === 'NEWLIFE10') {
      const basePrice = selectedService === 'Embroidery' ? 399 : selectedService === 'Painting' ? 249 : 299;
      setDiscount(Math.round(basePrice * 0.1));
      setAppliedCoupon(code);
    } else if (code === 'FESTIVEGLOW' && selectedService === 'Embroidery') {
      const basePrice = 399;
      setDiscount(Math.round(basePrice * 0.15));
      setAppliedCoupon(code);
    } else if (code === 'REWEAR3') {
      setCouponError("This coupon is valid for orders with 3+ items. Add more items to your cart!");
    } else {
      setCouponError("Invalid coupon code. Try NEWLIFE10 or FESTIVEGLOW.");
    }
  };

  const confirmOrder = () => {
    if (!user || !selectedService || !aiResult) return;
    setShowAddressModal(true);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedService || !aiResult) return;
    
    // Basic validation
    if (!address.street || !address.city || !address.pincode || !address.phone) {
      setError("Please fill in all delivery address details.");
      return;
    }

    setLoading(true);
    try {
      const basePrice = selectedService === 'Embroidery' ? 399 : selectedService === 'Painting' ? 249 : 299;
      const finalPrice = basePrice - discount;
      
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalPrice,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to initialize payment.");
      }

      const orderData = await response.json();

      if (orderData.isMock) {
        await handlePaymentSuccess(orderData.id);
        return;
      }

      const options = {
        key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID || '', // Enter the Key ID generated from the Dashboard
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DG MITRA FOR ALL",
        description: selectedService + " Service",
        order_id: orderData.id,
        handler: async function (response: any) {
          setShowPaymentModal(false);
          await handlePaymentSuccess(response.razorpay_payment_id);
        },
        prefill: {
          name: profile?.displayName || user.email?.split('@')[0] || "Customer",
          email: user.email,
          contact: address.phone
        },
        theme: {
          color: "#2F6A4F"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        setError(response.error.description);
      });
      setShowAddressModal(false);
      rzp1.open();
      
    } catch (error: any) {
      setError(error.message);
      console.error("Payment Init Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!user || !selectedService || !aiResult) return;
    
    setLoading(true);
    try {
      const basePrice = selectedService === 'Embroidery' ? 399 : selectedService === 'Painting' ? 249 : 299;
      const finalPrice = basePrice - discount;

      // Upload images to Storage to avoid Firestore 1MB limit
      const timestamp = Date.now();
      const uploadPromises = [];
      
      let finalPreviewUrl = preview;
      let finalBaseLayerUrl = baseLayer;
      let finalDesignPreviewUrl = designPreview;
      let finalCustomLogoUrl = customPreview;

      if (preview?.startsWith('data:')) {
        uploadPromises.push(uploadBase64ToStorage(preview, `orders/${user.id}/${timestamp}_original.jpg`).then(url => finalPreviewUrl = url));
      }
      if (baseLayer?.startsWith('data:') && baseLayer !== preview) {
        uploadPromises.push(uploadBase64ToStorage(baseLayer, `orders/${user.id}/${timestamp}_base.jpg`).then(url => finalBaseLayerUrl = url));
      }
      if (designPreview?.startsWith('data:') && designPreview !== preview && designPreview !== baseLayer) {
        uploadPromises.push(uploadBase64ToStorage(designPreview, `orders/${user.id}/${timestamp}_preview.jpg`).then(url => finalDesignPreviewUrl = url));
      }
      if (customPreview?.startsWith('data:') && customPreview !== preview) {
        uploadPromises.push(uploadBase64ToStorage(customPreview, `orders/${user.id}/${timestamp}_custom.jpg`).then(url => finalCustomLogoUrl = url));
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }
      
      const orderData = {
        userId: user.id,
        status: 'paid',
        paymentIntentId,
        serviceType: selectedService,
        fabric: aiResult.fabric,
        condition: aiResult.condition,
        price: finalPrice,
        discount: discount,
        appliedCoupon: appliedCoupon,
        originalImageUrl: finalPreviewUrl,
        baseLayerUrl: (finalBaseLayerUrl && finalBaseLayerUrl !== finalPreviewUrl) ? finalBaseLayerUrl : null,
        designPreviewUrl: (finalDesignPreviewUrl && finalDesignPreviewUrl !== finalPreviewUrl && finalDesignPreviewUrl !== finalBaseLayerUrl) ? finalDesignPreviewUrl : null,
        customLogoUrl: (finalCustomLogoUrl && finalCustomLogoUrl !== finalPreviewUrl) ? finalCustomLogoUrl : null,
        images: [
          finalPreviewUrl,
          (finalBaseLayerUrl && finalBaseLayerUrl !== finalPreviewUrl) ? finalBaseLayerUrl : null,
          (finalDesignPreviewUrl && finalDesignPreviewUrl !== finalPreviewUrl && finalDesignPreviewUrl !== finalBaseLayerUrl) ? finalDesignPreviewUrl : null,
          (finalCustomLogoUrl && finalCustomLogoUrl !== finalPreviewUrl) ? finalCustomLogoUrl : null
        ].filter(Boolean) as string[],
        selectedGalleryDesign: selectedGalleryDesign || null,
        designImageURL: finalDesignPreviewUrl || finalCustomLogoUrl || null,
        technicalNote: technicalNote || null,
        deliveryAddress: address,
        updatedAt: serverTimestamp()
      };

      if (orderId) {
        await updateDoc(doc(db, 'orders', orderId), orderData);
        if (saveToProfile) {
          const newAddress = {
            id: Math.random().toString(36).substring(7),
            label: `Order Address ${new Date().toLocaleDateString()}`,
            ...address
          };
          const updatedAddresses = [...(profile?.savedAddresses || []), newAddress];
          await updateDoc(doc(db, 'users', user.id), {
            savedAddresses: updatedAddresses
          });
        }
        navigate(`/order-success/${orderId}`);
      } else {
        const docRef = await addDoc(collection(db, 'orders'), {
          ...orderData,
          createdAt: serverTimestamp()
        });
        if (saveToProfile) {
          const newAddress = {
            id: Math.random().toString(36).substring(7),
            label: `Order Address ${new Date().toLocaleDateString()}`,
            ...address
          };
          const updatedAddresses = [...(profile?.savedAddresses || []), newAddress];
          await updateDoc(doc(db, 'users', user.id), {
            savedAddresses: updatedAddresses
          });
        }
        navigate(`/order-success/${docRef.id}`);
      }
    } catch (error) {
      handleFirestoreError(error, orderId ? OperationType.UPDATE : OperationType.CREATE, 'orders');
    } finally {
      setLoading(false);
      setShowPaymentModal(false);
    }
  };

  const saveProgress = async () => {
    if (!user || !preview) return;
    
    setSaving(true);
    setSaveSuccess(false);
    try {
      const basePrice = selectedService ? (selectedService === 'Embroidery' ? 399 : selectedService === 'Painting' ? 249 : 299) : 0;
      const finalPrice = basePrice > 0 ? basePrice - discount : 0;
      
      const orderData = {
        userId: user.uid,
        status: 'draft',
        serviceType: selectedService || null,
        fabric: aiResult?.fabric || null,
        condition: aiResult?.condition || null,
        price: finalPrice,
        discount: discount,
        appliedCoupon: appliedCoupon,
        originalImageUrl: preview,
        baseLayerUrl: (baseLayer && baseLayer !== preview) ? baseLayer : null,
        designPreviewUrl: (designPreview && designPreview !== preview && designPreview !== baseLayer) ? designPreview : null,
        customLogoUrl: (customPreview && customPreview !== preview) ? customPreview : null,
        images: [
          preview,
          (baseLayer && baseLayer !== preview) ? baseLayer : null,
          (designPreview && designPreview !== preview && designPreview !== baseLayer) ? designPreview : null,
          (customPreview && customPreview !== preview) ? customPreview : null
        ].filter(Boolean) as string[],
        selectedGalleryDesign: selectedGalleryDesign || null,
        designImageURL: designPreview || customPreview || null,
        technicalNote: technicalNote || null,
        customLogoAdjustments: {
          rotation
        },
        aiResult: aiResult || null,
        updatedAt: serverTimestamp()
      };

      // Log payload size
      const payloadSize = JSON.stringify(orderData).length;
      console.log(`Draft payload size: ${Math.round(payloadSize / 1024)}KB`);

      if (payloadSize > 1000 * 1024) {
        throw new Error("Draft data is too large for Firestore. Please try a smaller image.");
      }

      if (orderId) {
        await updateDoc(doc(db, 'orders', orderId), orderData);
      } else {
        const docRef = await addDoc(collection(db, 'orders'), {
          ...orderData,
          createdAt: serverTimestamp()
        });
        navigate(`/upload/${docRef.id}`, { replace: true });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, orderId ? OperationType.UPDATE : OperationType.CREATE, 'orders');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
      <SEO 
        title="Design Studio" 
        description="Upload your garment and use our AI-powered design studio to create a unique, upcycled masterpiece." 
      />
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">Step 1: What Are You Customizing?</h1>
        <p className="text-gray-600 mb-6">Choose how you want to start your customization journey.</p>
        
        {selectedPath === 'own' && (
          <button 
            onClick={resetUpload}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-black transition-colors"
          >
            <RefreshCw size={14} />
            Start Over
          </button>
        )}
      </div>

      {!selectedPath && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Path Card A */}
          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedPath('own')}
            className="glass-card p-10 rounded-[3rem] text-center border-2 border-transparent hover:border-brand-green transition-all group"
          >
            <div className="w-20 h-20 bg-brand-green/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <div className="relative">
                <Shirt className="text-brand-green" size={40} />
                <Package className="text-brand-green/40 absolute -bottom-2 -right-2" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">Bring Your Own Cloth</h3>
            <p className="text-gray-600 leading-relaxed">
              Upload a picture of your old favorite for our AI to scan.
            </p>
          </motion.button>

          {/* Path Card B */}
          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/shop', { state: location.state })}
            className="glass-card p-10 rounded-[3rem] text-center border-2 border-transparent hover:border-brand-green transition-all group"
          >
            <div className="w-20 h-20 bg-brand-green/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <ShoppingBag className="text-brand-green" size={40} />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">Shop New & Customize</h3>
            <p className="text-gray-600 leading-relaxed">
              Browse new premium jackets, hoodies, and tees and add your design during checkout.
            </p>
          </motion.button>
        </div>
      )}

      {selectedPath === 'own' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Upload */}
        <div className="space-y-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-[2rem] border-4 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-brand-green hover:bg-brand-green/5 transition-all group relative overflow-hidden"
          >
            {preview && (
              <img src={preview} alt="Preview" className={cn("w-full h-full object-cover", isCompressing && "opacity-50")} />
            )}
            {compressionInfo && !isCompressing && (
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 z-10">
                <Zap size={12} className="text-yellow-400" />
                <span>Optimized: {compressionInfo.original}KB → {compressionInfo.compressed}KB</span>
              </div>
            )}
            {isCompressing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 z-20">
                <Loader2 className="animate-spin text-brand-green mb-2" size={32} />
                <p className="text-sm font-bold text-brand-black">Optimizing Image...</p>
              </div>
            )}
            {baseLayer && baseLayer !== preview && (
              <div className="absolute bottom-4 right-4 w-24 h-24 rounded-2xl border-2 border-brand-green bg-white shadow-lg overflow-hidden z-10">
                <img src={baseLayer} alt="Base Layer" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-brand-green text-white text-[8px] font-bold text-center py-0.5">BASE LAYER</div>
              </div>
            )}
            {!preview && (
              <>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadIcon className="text-brand-black" />
                </div>
                <p className="font-bold text-lg">Click to upload photo</p>
                <p className="text-sm text-gray-500">JPG, PNG up to 20MB</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          {preview && !aiResult && !loading && !error && (
            <div className="flex gap-4">
              <button 
                onClick={analyzeClothing}
                className="flex-1 btn-primary py-4 flex items-center justify-center gap-2"
              >
                <Sparkles />
                Analyze with AI
              </button>
              <button 
                onClick={saveProgress}
                disabled={saving}
                className="px-6 btn-outline py-4 flex items-center justify-center gap-2"
                title="Save Draft"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : saveSuccess ? <Check className="text-brand-green" size={18} /> : <Save size={18} />}
              </button>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-red-50 border border-red-100 rounded-3xl space-y-4"
            >
              <div className="flex items-start gap-3 text-red-600">
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-bold">Analysis Failed</p>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
              <button 
                onClick={analyzeClothing}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </motion.div>
          )}

          {loading && !aiResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AnalysisSkeleton />
            </motion.div>
          )}

          {aiResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 rounded-3xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-xl">AI Analysis</h3>
                <div className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-xs font-bold uppercase">Success</div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Recommended Fabric</p>
                  <p className="font-bold">{aiResult.fabric}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Recommended Garment</p>
                  <p className="font-bold">{aiResult.condition}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold mb-4">Suggested Redesigns:</p>
                <div className="space-y-3">
                  {aiResult.suggestions.map((s: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedService(s.type);
                        if (!customPreview) {
                          generatePreview(`${s.description}. Use ${s.colorPalette?.join(', ') || 'matching'} colors with ${s.textureDetails} texture at ${s.placementTechnique}.`);
                        }
                        // Scroll to gallery
                        galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setGalleryFilter(s.type);
                      }}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all group ${
                        selectedService === s.type ? 'border-brand-green bg-brand-green/5' : 'border-gray-100 hover:border-brand-green/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold flex items-center gap-2">
                          {s.type === 'Embroidery' && <Scissors size={16} />}
                          {s.type === 'Painting' && <Paintbrush size={16} />}
                          {s.type === 'Printing' && <Printer size={16} />}
                          {s.type}
                        </p>
                        <div className="px-2 py-0.5 bg-brand-green/10 text-brand-green rounded-full text-[8px] font-bold uppercase tracking-wider">
                          {s.type === 'Embroidery' ? 'Denim & Heavy Cotton' : 
                           s.type === 'Painting' ? 'Denim & Leather' : 
                           'Cotton & Polyester'}
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedService === s.type ? 'bg-brand-green border-brand-green text-white' : 'border-gray-200'
                        }`}>
                          {selectedService === s.type && <Check size={14} />}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-3">{s.description}</p>
                      
                      <div className="space-y-2 pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {s.colorPalette?.map((color: string, ci: number) => (
                            <span key={ci} className="px-2 py-0.5 bg-white rounded-md text-[10px] border border-gray-100 font-medium text-gray-600">
                              {color}
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider font-bold">
                          <div>
                            <span className="text-gray-400 block mb-0.5">Texture</span>
                            <span className="text-brand-black">{s.textureDetails}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Placement</span>
                            <span className="text-brand-black">{s.placementTechnique}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Quick Guide for Users */}
                <div className="mt-6 p-4 bg-brand-beige/20 rounded-2xl border border-brand-green/10">
                  <div className="flex items-center gap-2 mb-3 text-brand-green">
                    <Sparkles size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Quick Selection Guide</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0">👖</span>
                      <p className="text-gray-600"><span className="font-bold text-brand-black">Denim:</span> Embroidery or Painting is best.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="shrink-0">👕</span>
                      <p className="text-gray-600"><span className="font-bold text-brand-black">T-shirts:</span> DTF Printing is perfect.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="shrink-0">🧥</span>
                      <p className="text-gray-600"><span className="font-bold text-brand-black">Hoodies:</span> All services work great!</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {aiResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              ref={galleryRef}
              className="glass-card p-8 rounded-3xl space-y-6 scroll-mt-32"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-xl">Select Your Art</h3>
                  <p className="text-xs text-gray-500 mt-1">Choose a design from our Premium Gallery to apply to your garment</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Embroidery', 'Painting', 'Printing'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setGalleryFilter(cat)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                        galleryFilter === cat 
                          ? "bg-brand-green text-white" 
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search designs..."
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-brand-green transition-all"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar overscroll-contain">
                {galleryLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-2xl" />
                  ))
                ) : (
                  galleryItems
                    .filter(item => (galleryFilter === 'All' || item.category === galleryFilter) && item.title.toLowerCase().includes(gallerySearch.toLowerCase()))
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedGalleryDesign(item);
                          setCustomPreview(item.imageUrl);
                          setSelectedService(item.category);
                          
                          // Trigger preview generation
                          const description = `The user has selected the "${item.title}" design from our Design Gallery. Please apply this specific design to the garment.`;
                          generatePreview(description, item.imageUrl);
                        }}
                        className={cn(
                          "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group",
                          selectedGalleryDesign?.id === item.id 
                            ? "border-brand-green ring-4 ring-brand-green/10" 
                            : "border-transparent hover:border-brand-green/30"
                        )}
                      >
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <p className="text-white text-[10px] font-bold truncate">{item.title}</p>
                        </div>
                        {selectedGalleryDesign?.id === item.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-brand-green text-white rounded-full flex items-center justify-center shadow-lg">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    ))
                )}
              </div>
            </motion.div>
          )}

          {aiResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 rounded-3xl space-y-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center text-brand-green">
                  <UploadIcon size={20} />
                </div>
                <h3 className="font-display font-bold text-xl">
                  {selectedGalleryDesign ? 'Selected Gallery Design' : 'Custom Logo / Design'}
                </h3>
              </div>
              
              {selectedGalleryDesign ? (
                <div className="p-4 bg-brand-green/5 border border-brand-green/20 rounded-2xl flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                    <img src={selectedGalleryDesign.imageUrl} alt={selectedGalleryDesign.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{selectedGalleryDesign.title}</p>
                    <p className="text-xs text-gray-500">{selectedGalleryDesign.category}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedGalleryDesign(null);
                      setCustomPreview(null);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-500 text-sm">
                    Want to use your own logo? Upload it here and our AI will incorporate it into the design preview.
                  </p>
                  <div className="p-4 bg-brand-green/5 border border-brand-green/10 rounded-2xl">
                    <p className="text-xs font-bold text-brand-green mb-2 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={12} />
                      No design yet?
                    </p>
                    <p className="text-[11px] text-gray-600 mb-3">
                      Use our AI Design Studio to generate a unique vision from just a text description.
                    </p>
                    <Link 
                      to="/ai-studio" 
                      className="inline-flex items-center gap-2 text-xs font-bold text-brand-black hover:text-brand-green transition-colors"
                    >
                      Go to AI Studio <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {customPreview && (
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                      <div 
                        className={cn(
                          "w-full h-full p-4 flex items-center justify-center transition-all duration-200",
                          isCompressing && "opacity-50"
                        )}
                        style={{ 
                          transform: `rotate(${rotation}deg)`
                        }}
                      >
                        <img src={customPreview} alt="Custom Design Preview" className="max-w-full max-h-full object-contain" />
                      </div>
                      {isCompressing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 z-20">
                          <Loader2 className="animate-spin text-brand-green mb-2" size={24} />
                          <p className="text-[10px] font-bold text-brand-black uppercase tracking-wider">Optimizing Image...</p>
                        </div>
                      )}
                      <button 
                        onClick={() => {
                          setCustomImage(null);
                          setCustomPreview(null);
                          setCustomDimensions(null);
                          setRotation(0);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-500 hover:bg-white transition-colors z-10"
                      >
                        <Check className="rotate-45" size={16} />
                      </button>
                    </div>

                    {/* Image Editing Tools */}
                    <div className="p-4 bg-gray-50 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Adjustments</span>
                        <button 
                          onClick={() => {
                            setRotation(0);
                          }}
                          className="text-[10px] font-bold text-brand-green hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pt-1">
                          <button 
                            onClick={() => setRotation(prev => (prev - 90) % 360)}
                            className="flex-1 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold hover:border-brand-green transition-colors flex items-center justify-center gap-1"
                          >
                            <RefreshCw size={10} className="-scale-x-100" />
                            Rotate Left
                          </button>
                          <button 
                            onClick={() => setRotation(prev => (prev + 90) % 360)}
                            className="flex-1 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold hover:border-brand-green transition-colors flex items-center justify-center gap-1"
                          >
                            <RefreshCw size={10} />
                            Rotate Right
                          </button>
                        </div>
                      </div>
                    </div>

                    {customDimensions && (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-2">
                        <div className="flex items-center gap-3">
                          <div className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                            {customDimensions.width} × {customDimensions.height} px
                          </div>
                          <div className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                            Ratio: {customDimensions.aspect.toFixed(2)}:1
                          </div>
                        </div>
                        
                        {originalDimensions && Math.abs(originalDimensions.aspect - customDimensions.aspect) > 0.5 && (
                          <motion.div 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1.5 text-orange-500 text-[10px] font-bold"
                          >
                            <AlertCircle size={12} />
                            <span>Aspect ratio mismatch</span>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {originalDimensions && customDimensions && Math.abs(originalDimensions.aspect - customDimensions.aspect) > 0.5 && (
                      <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-[11px] text-orange-700 leading-relaxed">
                        <p className="font-bold mb-1 flex items-center gap-1">
                          <Sparkles size={12} />
                          Optimization Tip
                        </p>
                        The aspect ratio of your logo ({customDimensions.aspect.toFixed(2)}) is quite different from the garment ({originalDimensions.aspect.toFixed(2)}). Consider cropping or using a transparent PNG for the best AI preview generation.
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <button 
                    onClick={() => customFileInputRef.current?.click()}
                    className="w-full btn-outline py-3 flex items-center justify-center gap-2 text-sm"
                  >
                    <UploadIcon size={16} />
                    {customPreview ? 'Change Custom Design' : 'Upload Custom Design'}
                  </button>

                  {customPreview && selectedService && (
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleManualPreview}
                      disabled={generatingPreview}
                      className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-green/20"
                    >
                      {generatingPreview ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Sparkles size={18} />
                      )}
                      Generate Preview
                    </motion.button>
                  )}
                </div>
                
                <input 
                  type="file" 
                  ref={customFileInputRef} 
                  onChange={handleCustomFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Preview & Checkout */}
        <div className="space-y-8">
          <div 
            ref={previewContainerRef}
            className="aspect-square rounded-[2rem] bg-brand-black flex flex-col items-center justify-center relative overflow-hidden"
          >
            {isCompressing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-30">
                <Loader2 className="animate-spin text-brand-green mb-2" size={32} />
                <p className="text-sm font-bold text-white">Optimizing Image...</p>
              </div>
            )}
            {generatingPreview ? (
              <PreviewSkeleton />
            ) : previewError ? (
              <div className="text-center text-white p-8 space-y-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="text-red-500" />
                </div>
                <p className="font-display text-xl font-bold">Preview Error</p>
                <p className="text-gray-400 text-sm">{previewError}</p>
                <button 
                  onClick={() => {
                    if (selectedService && aiResult) {
                      const suggestion = aiResult.suggestions.find((s: any) => s.type === selectedService);
                      if (suggestion) {
                        generatePreview(`${suggestion.description}. Use ${suggestion.colorPalette?.join(', ') || 'matching'} colors with ${suggestion.textureDetails} texture at ${suggestion.placementTechnique}.`);
                      }
                    }
                  }}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
                >
                  Retry Generation
                </button>
              </div>
            ) : isManualPlacement && customPreview && preview ? (
              <div className="absolute inset-0 z-10">
                <DesignCustomizer
                  key={resetKey}
                  backgroundImage={preview}
                  designImage={customPreview}
                  width={containerWidth}
                  height={containerWidth}
                  onUpdate={setPlacementData}
                />
              </div>
            ) : designPreview ? (
              <>
                <img src={designPreview} alt="AI Preview" className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-brand-green text-white px-3 py-1 rounded-full text-xs font-bold">AI GENERATED PREVIEW</div>
                {technicalNote && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md text-white p-3 rounded-2xl text-[10px] leading-tight border border-white/10">
                    <p className="font-bold text-brand-green mb-1 uppercase tracking-wider">Technical Note</p>
                    {technicalNote}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-white p-8">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="text-brand-green" />
                </div>
                <p className="font-display text-xl font-bold">Design Preview</p>
                <p className="text-gray-400 text-sm mt-2">Select a suggestion to see the AI-generated transformation</p>
              </div>
            )}

            {customPreview && !generatingPreview && preview && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-xl z-20">
                <button
                  onClick={() => setIsManualPlacement(false)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5",
                    !isManualPlacement ? "bg-brand-green text-white" : "text-gray-400 hover:text-brand-green"
                  )}
                >
                  <Sparkles size={12} />
                  AI RENDER
                </button>
                <button
                  onClick={() => setIsManualPlacement(true)}
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
              </div>
            )}
          </div>

          <AnimatePresence>
            {selectedService && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 rounded-3xl"
              >
                <h3 className="font-display font-bold text-xl mb-6">Order Summary</h3>
                <div className="space-y-4 mb-8">
                  {selectedGalleryDesign && (
                    <div className="p-3 bg-brand-green/5 border border-brand-green/10 rounded-2xl flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                        <img src={selectedGalleryDesign.imageUrl} alt={selectedGalleryDesign.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-brand-green uppercase tracking-widest mb-0.5">Selected Design</p>
                        <p className="font-bold text-sm truncate">{selectedGalleryDesign.title}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service: {selectedService}</span>
                    <span className="font-bold">
                      {selectedService === 'Embroidery' ? '₹399' : selectedService === 'Painting' ? '₹799' : '₹399'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pickup & Delivery</span>
                    <span className="text-brand-green font-bold">FREE</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-brand-green font-bold">
                      <span>Discount ({appliedCoupon})</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <hr className="border-gray-100" />
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-brand-green">
                      ₹{(selectedService === 'Embroidery' ? 399 : selectedService === 'Painting' ? 249 : 299) - discount}
                    </span>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1 mb-2 block">Apply Coupon</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter Code (e.g. NEWLIFE10)"
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-brand-green transition-all"
                    />
                    <button 
                      onClick={applyCoupon}
                      className="px-4 py-2 bg-brand-black text-white rounded-xl text-xs font-bold hover:bg-brand-green transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] text-red-500 mt-1 ml-1">{couponError}</p>}
                  {appliedCoupon && <p className="text-[10px] text-brand-green mt-1 ml-1 font-bold">Coupon applied successfully!</p>}
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-brand-beige/50 rounded-2xl flex gap-3">
                    <AlertCircle className="text-brand-green shrink-0" size={20} />
                    <p className="text-xs text-gray-600">
                      Pickup will be scheduled within 48 hours of order confirmation. Delivery guaranteed within 48 hours of pickup.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={saveProgress}
                      disabled={saving || loading}
                      className="w-full sm:flex-1 btn-outline py-4 flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="animate-spin" size={18} /> : saveSuccess ? <Check className="text-brand-green" size={18} /> : <Save size={18} />}
                      {saveSuccess ? 'Saved!' : 'Save Draft'}
                    </button>
                    <button 
                      onClick={confirmOrder}
                      disabled={loading || saving}
                      className="w-full sm:flex-[2] btn-primary py-4 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                      Confirm & Schedule Pickup
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      )}

      {/* Delivery Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddressModal(false)}
              className="absolute inset-0 bg-brand-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden overscroll-contain"
            >
              <div className="p-8 md:p-10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-display font-bold">Delivery Details</h2>
                    <p className="text-gray-500 text-sm mt-1">Where should we deliver your custom garment?</p>
                  </div>
                  <button 
                    onClick={() => setShowAddressModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-6">
                  {profile?.savedAddresses?.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Select Saved Address</label>
                      <div className="grid grid-cols-1 gap-2">
                        {profile.savedAddresses.map((addr: any) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => setAddress({
                              street: addr.street,
                              city: addr.city,
                              pincode: addr.pincode,
                              phone: addr.phone
                            })}
                            className={cn(
                              "p-3 rounded-xl border text-left transition-all text-sm",
                              address.street === addr.street && address.pincode === addr.pincode
                                ? "border-brand-green bg-brand-green/5 ring-1 ring-brand-green"
                                : "border-gray-100 bg-gray-50 hover:border-brand-green/30"
                            )}
                          >
                            <div className="font-bold">{addr.label}</div>
                            <div className="text-xs text-gray-500 truncate">{addr.street}, {addr.city}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Street Address</label>
                      <input 
                        required
                        type="text"
                        value={address.street}
                        onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="House No, Building, Street Name"
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">City</label>
                        <input 
                          required
                          type="text"
                          value={address.city}
                          onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Mumbai"
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Pincode</label>
                        <input 
                          required
                          type="text"
                          pattern="[0-9]{6}"
                          value={address.pincode}
                          onChange={(e) => setAddress(prev => ({ ...prev, pincode: e.target.value }))}
                          placeholder="400001"
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Phone Number</label>
                      <input 
                        required
                        type="tel"
                        pattern="[0-9]{10}"
                        value={address.phone}
                        onChange={(e) => setAddress(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="9876543210"
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
                      />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        saveToProfile ? "bg-brand-green border-brand-green text-white" : "border-gray-200 group-hover:border-brand-green/50"
                      )}>
                        {saveToProfile && <Check size={14} />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={saveToProfile}
                        onChange={(e) => setSaveToProfile(e.target.checked)}
                      />
                      <span className="text-sm text-gray-600">Save this address to my profile</span>
                    </label>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary py-5 flex items-center justify-center gap-2 text-lg shadow-xl shadow-brand-green/20"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                      Place Order
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">
                      Secure Checkout • 48h Delivery
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
