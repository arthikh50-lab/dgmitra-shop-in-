import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, FormEvent } from 'react';
import { Plus, X, Image as ImageIcon, Loader2, ArrowRight, Search } from 'lucide-react';
import { db, OperationType, handleFirestoreError, isQuotaError } from '../firebase';
import { collection, query, orderBy, getDocs, addDoc, getDocsFromCache } from '../firebase';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { QuotaErrorBanner } from '../components/QuotaErrorBanner';
import SEO from '../components/SEO';

import { cn } from '../utils';

export default function Gallery() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Embroidery',
    imageUrl: ''
  });

  const isAdmin = profile?.role === 'admin' || user?.email === 'manoj627k@gmail.com';
  const categories = ['All', 'Embroidery', 'Painting', 'Printing'];

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const fetchGalleryItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (err) {
        if (isQuotaError(err)) {
          console.warn("Gallery: Fetching from cache due to quota.");
          snapshot = await getDocsFromCache(q);
          setQuotaExceeded(true);
        } else throw err;
      }
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsData);
      if (!quotaExceeded) setQuotaExceeded(false);
    } catch (error) {
      console.error("Error fetching gallery items:", error);
      if (isQuotaError(error)) {
        setQuotaExceeded(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'All' || item.category === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.imageUrl) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'gallery'), {
        ...form,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setForm({ title: '', category: 'Embroidery', imageUrl: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'gallery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <SEO 
        title="Design Gallery" 
        description="Explore our curated gallery of premium upcycled designs. Get inspired for your next wardrobe transformation." 
      />
      {quotaExceeded && (
        <div className="max-w-7xl mx-auto mb-8">
          <QuotaErrorBanner onRetry={fetchGalleryItems} />
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 relative">
          {isAdmin && (
            <div className="absolute top-0 right-0">
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary flex items-center gap-2 py-3 px-6 rounded-2xl shadow-lg shadow-brand-green/20"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Upload Design</span>
              </button>
            </div>
          )}
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">Design <span className="text-brand-green">Gallery</span></h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">Explore our portfolio of transformed clothing. Each piece is unique and custom-made for our clients.</p>

          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-green transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Search designs by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-5 rounded-[2rem] bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all outline-none text-lg"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "px-8 py-3 rounded-full font-bold transition-all text-sm uppercase tracking-widest",
                  filter === cat 
                    ? "bg-brand-black text-white shadow-lg shadow-brand-black/20" 
                    : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
            {filteredItems.map((item, idx) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="break-inside-avoid group relative rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100"
              >
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                  <p className="text-brand-green font-bold text-[10px] uppercase tracking-[0.2em] mb-2">{item.category}</p>
                  <h3 className="text-white font-display font-bold text-2xl mb-6 leading-tight">{item.title}</h3>
                  
                  <button
                    onClick={() => navigate('/upload', { 
                      state: { 
                        selectedDesign: {
                          id: item.id,
                          imageUrl: item.imageUrl,
                          title: item.title,
                          category: item.category
                        } 
                      } 
                    })}
                    className="w-full py-4 px-6 bg-brand-green text-brand-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-lg"
                  >
                    Use This Design
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">No items found in this category.</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-display font-bold">Upload <span className="text-brand-green">Design</span></h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-widest">Design Title</label>
                  <input 
                    type="text" 
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-green transition-all"
                    placeholder="e.g., Floral Denim Jacket"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-widest">Category</label>
                  <select 
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-green transition-all appearance-none"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-widest">Image URL</label>
                  <div className="relative">
                    <input 
                      type="url" 
                      required
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-green transition-all"
                      placeholder="https://images.unsplash.com/..."
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <ImageIcon size={20} />
                    </div>
                  </div>
                </div>

                {form.imageUrl && (
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                    <img 
                      src={form.imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x600?text=Invalid+Image+URL')}
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full btn-primary py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  {submitting ? 'Uploading...' : 'Add to Gallery'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
