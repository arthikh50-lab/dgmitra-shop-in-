import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Paintbrush, Scissors, Recycle, Star, ChevronRight, ShoppingBag, ImageIcon, Upload, Loader2, CheckCircle2, MessageSquare, X, Smartphone, Wand2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { formatCurrency, cn } from '../utils';
import { useAuth } from '../AuthContext';
import { QuotaErrorBanner } from '../components/QuotaErrorBanner';
import SEO from '../components/SEO';

export default function Home() {
  const { user, profile } = useAuth();
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [featuredGallery, setFeaturedGallery] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [hasCompletedOrder, setHasCompletedOrder] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [productImage, setProductImage] = useState<string | null>(null);

  const fetchHomeData = async () => {
    setIsLoading(true);
    let hasQuotaError = false;
    try {
      // Fetch New Arrivals
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('isNewArrival', true)
        .order('createdAt', { ascending: false })
        .limit(4);
      
      if (productsError) throw productsError;
      setNewArrivals(productsData || []);

      // Fetch Featured Gallery
      const { data: galleryData, error: galleryError } = await supabase
        .from('gallery')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(4);
      
      if (galleryError) throw galleryError;
      setFeaturedGallery(galleryData || []);

      // Fetch Reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(6);
      
      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Check for completed orders
      if (user) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id')
          .eq('userId', user.id)
          .eq('status', 'delivered')
          .limit(1);
          
        if (ordersError) throw ordersError;
        setHasCompletedOrder(ordersData && ordersData.length > 0);
      }
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !productImage) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert([{
        userId: user.id,
        userName: profile?.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: profile?.photoURL || user?.user_metadata?.avatar_url || '',
        rating,
        comment,
        productImageUrl: productImage,
        createdAt: new Date().toISOString()
      }]);
      
      if (error) throw error;
      
      setSubmitSuccess(true);
      setComment('');
      setProductImage(null);
      setRating(5);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowReviewForm(false);
      }, 3000);
    } catch (error) {
       console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    {
      title: 'Embroidery Design',
      description: 'Premium thread embroidery on jackets, shirts, and hoodies.',
      icon: <Scissors className="w-6 h-6" />,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&h=400&auto=format&fit=crop',
      color: 'bg-blue-50'
    },
    {
      title: 'Painting',
      description: 'Custom artistic painting on denim jackets and shirts.',
      icon: <Paintbrush className="w-6 h-6" />,
      image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=600&h=400&auto=format&fit=crop',
      color: 'bg-orange-50'
    },
    {
      title: 'DTF Printing',
      description: 'High-quality digital prints for streetwear and modern fashion.',
      icon: <Sparkles className="w-6 h-6" />,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&h=400&auto=format&fit=crop',
      color: 'bg-purple-50'
    }
  ];

  return (
    <div className="pt-20">
      <SEO 
        title="Home" 
        description="DG MITRA FOR ALL | Premium Eco-Luxury Customization. Sustainable upcycling for your favorite clothes." 
      />
      {quotaExceeded && (
        <QuotaErrorBanner onRetry={fetchHomeData} />
      )}
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-brand-green/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-[-10%] w-[400px] h-[400px] bg-brand-beige/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 gap-12 items-center">
            <div className="col-span-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 text-brand-green font-medium text-sm mb-6">
                  <Recycle size={16} />
                  <span>Sustainable Fashion Revolution</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-7xl font-display font-bold leading-[1.1] mb-6 max-w-4xl mx-auto">
                  Your Wardrobe, <span className="text-brand-green">Re-imagined.</span> <br className="hidden sm:block" />
                  Bring Your Own Cloth.
                </h1>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Don't let your favorite clothes die. Give them a second life with our AI-driven transformation workflow. Premium customization for the conscious fashionista.
                </p>
              </motion.div>

              {/* How it Works Workflow */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                  {/* Segmented Progress Bar Background */}
                  <div className="absolute top-1/2 left-[15%] right-[15%] h-px bg-brand-green/20 -translate-y-1/2 hidden md:block z-0" />
                  
                  {/* Step 1: SCAN IT */}
                  <div className="relative z-10">
                    <div className="glass-card p-8 rounded-[2.5rem] h-full border border-brand-green/10 hover:border-brand-green/30 transition-all group bg-white/40 backdrop-blur-xl">
                      <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-6 text-brand-green group-hover:scale-110 transition-transform shadow-sm">
                        <Smartphone size={32} />
                      </div>
                      <div className="absolute -top-4 -left-4 w-10 h-10 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-lg shadow-xl shadow-brand-green/20">01</div>
                      <h3 className="font-display font-bold text-2xl mb-4 uppercase tracking-tight">SCAN IT</h3>
                      <p className="text-gray-500 leading-relaxed">
                        Use your camera to scan your old favorite piece. Our AI analyzes fabric texture & condition instantly.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: DESIGN IT */}
                  <div className="relative z-10">
                    <div className="glass-card p-8 rounded-[2.5rem] h-full border border-brand-green/10 hover:border-brand-green/30 transition-all group bg-white/40 backdrop-blur-xl">
                      <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-6 text-brand-green group-hover:scale-110 transition-transform shadow-sm">
                        <Paintbrush size={32} />
                      </div>
                      <div className="absolute -top-4 -left-4 w-10 h-10 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-lg shadow-xl shadow-brand-green/20">02</div>
                      <h3 className="font-display font-bold text-2xl mb-4 uppercase tracking-tight">DESIGN IT</h3>
                      <p className="text-gray-500 leading-relaxed">
                        Pick a design from our <Link to="/gallery" className="text-brand-green font-bold hover:underline">Premium Gallery</Link> or upload your own.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: PREVIEW IT */}
                  <div className="relative z-10">
                    <div className="glass-card p-8 rounded-[2.5rem] h-full border border-brand-green/10 hover:border-brand-green/30 transition-all group bg-white/40 backdrop-blur-xl">
                      <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-6 text-brand-green group-hover:scale-110 transition-transform shadow-sm">
                        <Wand2 size={32} />
                      </div>
                      <div className="absolute -top-4 -left-4 w-10 h-10 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-lg shadow-xl shadow-brand-green/20">03</div>
                      <h3 className="font-display font-bold text-2xl mb-4 uppercase tracking-tight flex items-center gap-2">
                        PREVIEW IT
                        <span className="text-[10px] bg-brand-green/20 text-brand-green px-2 py-0.5 rounded-full font-bold">LIVE</span>
                      </h3>
                      <p className="text-gray-500 leading-relaxed">
                        See a hyper-realistic AI preview of your old cloth with the new design, before you ship it!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-16 text-center">
                  <Link to="/upload" className="btn-primary inline-flex items-center gap-4 text-2xl px-16 py-6 shadow-2xl shadow-brand-green/20 rounded-full hover:scale-105 transition-transform">
                    Bring Your Own Cloth <ArrowRight size={28} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-24 bg-brand-beige/30 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Don't Let Your Favorite Clothes Die.</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Give them a second life in style. See how we turn ordinary, worn-out pieces into high-end designer streetwear.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group relative overflow-hidden rounded-3xl bg-white shadow-xl">
              <div className="flex h-[400px]">
                <div className="w-1/2 relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1542272263457-20487fa45728?q=80&w=400&h=600&auto=format&fit=crop" alt="Before" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">BEFORE</div>
                </div>
                <div className="w-1/2 relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=400&h=600&auto=format&fit=crop" alt="After" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 right-4 bg-brand-green text-white px-3 py-1 rounded-full text-xs font-bold">AFTER</div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-display font-bold text-xl mb-2">Vintage Denim Jacket → Meku Signature Redesign</h3>
                <p className="text-gray-500 text-sm">Transformed with intricate mandala embroidery and hand-painted accents.</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-white shadow-xl">
              <div className="h-[400px] relative overflow-hidden">
                <img 
                  src="https://lh3.googleusercontent.com/gg-dl/AOI_d__cebfXYF4kYWpu2DJolycoi9KIaRTqVobIu4B1QEoB7PGQ888uKq-5EHHJMLZfjWFqGWvcPoEnK9hxR9kojAYNHKipg4gmD_cPNUdRObzKjoTG7laSW3aEhFeQGp0mSKgGBK6zsLja9aWAVOWv-7-wLSxvUCwuVO-ydvUAAD9xX-uP=s1024-rj" 
                  alt="Meku Hand-Painted Masterpiece" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div className="p-6">
                <h3 className="font-display font-bold text-xl mb-2">Vintage Denim Vest → Meku Hand-Painted Masterpiece</h3>
                <p className="text-gray-500 text-sm">Custom abstract painting with vibrant turquoise and gold accents.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Design Studio CTA Section */}
      <section className="py-32 px-6 bg-brand-black overflow-hidden relative">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-green/10 blur-[120px] -z-0 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-blue-500/10 blur-[100px] -z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0,transparent_70%)] -z-0" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-10"
            >
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-brand-green/20 text-brand-green rounded-full text-sm font-bold uppercase tracking-widest border border-brand-green/30 backdrop-blur-sm">
                <Sparkles size={18} className="animate-spin-slow" />
                Next-Gen: AI Design Studio
              </div>
              <h2 className="text-6xl md:text-8xl font-display font-bold text-white leading-[0.85] tracking-tight">
                Your Words, <br />
                <span className="text-brand-green italic">Wearable Art.</span>
              </h2>
              <p className="text-gray-400 text-xl md:text-2xl max-w-xl leading-relaxed">
                Describe your dream design and watch our AI bring it to life. From minimalist sketches to hyper-realistic masterpieces, create something truly unique.
              </p>
              <div className="flex flex-wrap gap-6 pt-6">
                <Link to="/ai-studio" className="group relative px-10 py-5 bg-brand-green text-white rounded-full font-bold text-xl overflow-hidden shadow-2xl shadow-brand-green/40 hover:scale-105 transition-all">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative flex items-center gap-3">
                    Launch AI Studio <Wand2 size={24} />
                  </span>
                </Link>
                <Link to="/gallery" className="px-10 py-5 bg-white/5 text-white rounded-full font-bold text-xl hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 flex items-center gap-3 group">
                  Explore Gallery <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
              
              <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/10">
                <div>
                  <p className="text-3xl font-display font-bold text-white mb-1">10k+</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Designs Generated</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-white mb-1">4.9/5</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">User Rating</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-white mb-1">24/7</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">AI Availability</p>
                </div>
              </div>
            </motion.div>
 
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, type: 'spring' }}
              className="relative"
            >
              {/* Decorative elements */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-green/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />
              
              <div className="aspect-square rounded-[4rem] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-5 relative group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-brand-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-12">
                  <div className="space-y-4 transform translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#10B981" className="text-brand-green" />)}
                    </div>
                    <p className="text-white text-xl font-medium italic leading-relaxed">
                      "A futuristic cyberpunk tiger with neon orange stripes, high-detail digital art..."
                    </p>
                    <div className="flex items-center gap-3 pt-4">
                      <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm leading-none">Alex Rivera</p>
                        <p className="text-brand-green text-[10px] uppercase tracking-widest mt-1">Verified Creator</p>
                      </div>
                    </div>
                  </div>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&h=800&auto=format&fit=crop" 
                  alt="AI Generated Art Example" 
                  className="w-full h-full object-cover rounded-[3rem] transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating badge */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-8 -right-8 w-36 h-36 bg-brand-green rounded-full flex items-center justify-center border-[10px] border-brand-black rotate-12 shadow-2xl z-20"
                >
                  <div className="text-center">
                    <p className="text-white font-black text-2xl leading-none">AI</p>
                    <p className="text-white font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Studio</p>
                  </div>
                </motion.div>
              </div>
              
              {/* Secondary floating image */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-12 -left-12 w-48 h-48 rounded-3xl overflow-hidden border-4 border-brand-black shadow-2xl hidden md:block"
              >
                <img 
                  src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&h=400&auto=format&fit=crop" 
                  alt="AI Preview" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
              <div className="max-w-xl">
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">New Arrivals</h2>
                <p className="text-gray-600">Discover our latest custom pieces and ready-to-wear collection.</p>
              </div>
              <Link to="/shop" className="btn-ghost flex items-center gap-2 group">
                Shop All <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {newArrivals.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-6 bg-gray-100">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag size={48} />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-brand-green text-white text-xs font-bold px-3 py-1 rounded-full">
                      NEW
                    </div>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <button className="w-full bg-white text-brand-black font-bold py-3 rounded-xl hover:bg-brand-green hover:text-white transition-colors">
                        Quick View
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">{product.category}</p>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                    </div>
                    <p className="font-bold text-brand-green">{formatCurrency(product.price)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Gallery Section */}
      {featuredGallery.length > 0 && (
        <section className="py-24 px-6 bg-brand-black text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
              <div className="max-w-xl">
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Design <span className="text-brand-green">Showcase</span></h2>
                <p className="text-gray-400">Explore our favorite transformations from the DG MITRA community.</p>
              </div>
              <Link to="/gallery" className="text-brand-green flex items-center gap-2 group font-bold">
                View Full Gallery <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredGallery.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-lg"
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                    <p className="text-brand-green font-bold text-xs uppercase tracking-widest mb-1">{item.category}</p>
                    <h3 className="text-white font-display font-bold text-xl">{item.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="py-24 px-6 bg-brand-beige/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Our Customization Services</h2>
              <p className="text-gray-600">Choose the perfect technique to breathe new life into your favorite clothing items.</p>
            </div>
            <Link to="/services" className="btn-ghost flex items-center gap-2 group">
              Explore All Services <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="h-64 overflow-hidden">
                  <img src={service.image} alt={service.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="p-8">
                  <div className={`w-12 h-12 ${service.color} rounded-2xl flex items-center justify-center mb-6`}>
                    {service.icon}
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    {service.description}
                  </p>
                  <Link to="/upload" className="flex items-center gap-2 font-bold text-brand-black hover:text-brand-green transition-colors">
                    Get Started <ArrowRight size={18} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Customer <span className="text-brand-green">Reviews</span></h2>
              <p className="text-gray-600">See what our community is saying about their transformed pieces.</p>
            </div>
            {hasCompletedOrder && (
              <button 
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="btn-primary flex items-center gap-2"
              >
                {showReviewForm ? <X size={20} /> : <MessageSquare size={20} />}
                {showReviewForm ? 'Cancel' : 'Submit a Review'}
              </button>
            )}
          </div>

          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-16 overflow-hidden"
              >
                <div className="bg-brand-beige/20 rounded-[2.5rem] p-8 md:p-12 border border-brand-beige">
                  <h3 className="text-2xl font-display font-bold mb-8">Share Your Transformation</h3>
                  <form onSubmit={handleSubmitReview} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className={cn(
                                "p-2 rounded-xl transition-all",
                                rating >= star ? "text-yellow-500 bg-yellow-50" : "text-gray-300 bg-gray-50"
                              )}
                            >
                              <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Your Experience</label>
                        <textarea
                          required
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Tell us about your redesigned piece..."
                          className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-100 focus:ring-2 focus:ring-brand-green outline-none min-h-[150px] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Photo of Finished Product</label>
                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-white border-2 border-dashed border-gray-200 group hover:border-brand-green transition-all">
                          {productImage ? (
                            <>
                              <img src={productImage} alt="Preview" className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={() => setProductImage(null)}
                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                              <Upload className="text-gray-300 mb-4 group-hover:text-brand-green transition-colors" size={48} />
                              <span className="text-gray-400 font-medium">Click to upload photo</span>
                              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                          )}
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting || !productImage}
                        className="w-full py-5 bg-brand-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-green transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin" size={24} />
                        ) : submitSuccess ? (
                          <CheckCircle2 size={24} />
                        ) : (
                          'Submit Review'
                        )}
                        {submitSuccess ? 'Review Submitted!' : isSubmitting ? 'Submitting...' : ''}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-brand-beige/10 rounded-[2.5rem] p-8 border border-gray-50 flex flex-col"
              >
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={review.userPhoto || `https://i.pravatar.cc/100?u=${review.userId}`} 
                    alt={review.userName} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-bold text-brand-black">{review.userName}</h4>
                    <div className="flex text-yellow-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={12} fill={review.rating >= star ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic mb-8 flex-grow">"{review.comment}"</p>
                <div className="rounded-2xl overflow-hidden aspect-square">
                  <img 
                    src={review.productImageUrl} 
                    alt="Finished product" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-brand-black rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8">Ready to Bring Your Design to Life?</h2>
            <p className="text-gray-400 text-xl mb-12">
              Join the custom fashion movement. Upload your logo today and get it printed or embroidered on premium apparel within 48 hours.
            </p>
            <Link to="/upload" className="bg-brand-green text-white px-10 py-5 rounded-full text-xl font-bold hover:bg-white hover:text-brand-black transition-all inline-flex items-center gap-3">
              Upload Your Design <ArrowRight size={24} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
