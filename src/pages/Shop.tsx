import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ChevronRight, Filter, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { db, isQuotaError } from '../firebase';
import { collection, query, orderBy, getDocs, getDocsFromCache } from '../firebase';
import { formatCurrency } from '../utils';
import { QuotaErrorBanner } from '../components/QuotaErrorBanner';
import SEO from '../components/SEO';

export default function Shop() {
  const location = useLocation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (err) {
        if (isQuotaError(err)) {
          console.warn("Shop: Fetching from cache due to quota.");
          snapshot = await getDocsFromCache(q);
          setQuotaExceeded(true);
        } else throw err;
      }
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
      if (!quotaExceeded) setQuotaExceeded(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      if (isQuotaError(error)) {
        setQuotaExceeded(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const availableProducts = products.filter(p => p.isAvailable !== false);
  const filteredProducts = filter === 'All' ? availableProducts : availableProducts.filter(p => p.category === filter);

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <SEO 
        title="Shop" 
        description="Browse our collection of premium upcycled garments and customization options. Eco-luxury fashion at your fingertips." 
      />
      {quotaExceeded && (
        <div className="max-w-7xl mx-auto mb-8">
          <QuotaErrorBanner onRetry={fetchProducts} />
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">Shop <span className="text-brand-green">Collection</span></h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Discover our latest custom pieces, ready-to-wear collection, and exclusive new arrivals.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
          </div>
        ) : (
          <>
            {categories.length > 1 && (
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                      filter === cat ? 'bg-brand-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group cursor-pointer"
                >
                  <Link to={`/product/${product.id}`} state={location.state}>
                    <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-6 bg-gray-100">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag size={48} />
                        </div>
                      )}
                      {product.isNewArrival && (
                        <div className="absolute top-4 left-4 bg-brand-green text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                          NEW
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6">
                        <div className="bg-white text-brand-black font-bold py-3 px-6 rounded-xl hover:bg-brand-green hover:text-white transition-colors shadow-lg flex items-center gap-2">
                          View Details <ArrowRight size={18} />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">{product.category}</p>
                        <h3 className="font-bold text-lg leading-tight mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-green whitespace-nowrap">{formatCurrency(product.price)}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">+ Optional Customization</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-2xl font-bold mb-2">No products found</h3>
                <p className="text-gray-500">Check back later for new arrivals.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
