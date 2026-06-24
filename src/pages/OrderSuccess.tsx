import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, Package, Truck, Calendar, ArrowRight, ShoppingBag, MapPin, Sparkles, Download } from 'lucide-react';
import { db, isQuotaError } from '../firebase';
import { doc, getDoc, getDocFromCache } from '../firebase';
import { formatCurrency, cn } from '../utils';
import { useAuth } from '../AuthContext';
import { QuotaErrorBanner } from '../components/QuotaErrorBanner';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const docRef = doc(db, 'orders', orderId);
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (err) {
          if (isQuotaError(err)) {
            console.warn("OrderSuccess: Fetching from cache due to quota.");
            docSnap = await getDocFromCache(docRef);
            setQuotaExceeded(true);
          } else throw err;
        }

        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No such order!");
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (!order) return null;

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3); // 3 days from now

  return (
    <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
      {quotaExceeded && <QuotaErrorBanner className="mb-8" />}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-brand-green w-10 h-10" />
        </div>
        <h1 className="text-4xl font-display font-bold mb-4">Order Confirmed!</h1>
        <p className="text-gray-600">Thank you for choosing DG MITRA FOR ALL. Your sustainable redesign is underway.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
        >
          <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
            <Package className="text-brand-green" size={20} />
            Order Details
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono font-bold text-xs">{order.id.substring(0, 12)}...</span>
            </div>
            {order.type === 'shop_order' ? (
              <div className="space-y-3 mt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Items</p>
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <img src={item.customization?.previewUrl || item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-[10px] text-gray-500">Qty: {item.quantity} • Size: {item.size}</p>
                      </div>
                    </div>
                    <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service</span>
                  <span className="font-bold">{order.serviceType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Garment</span>
                  <span className="font-bold">{order.condition}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fabric</span>
                  <span className="font-bold">{order.fabric}</span>
                </div>
              </>
            )}
            <hr className="border-gray-100" />
            <div className="flex justify-between text-lg">
              <span className="font-bold">Total Paid</span>
              <span className="font-bold text-brand-green">{formatCurrency(order.total || order.price)}</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
        >
          <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
            <Truck className="text-brand-green" size={20} />
            Tracking Info
          </h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-brand-green/10 rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="text-brand-green" size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Estimated Delivery</p>
                <p className="font-bold">{estimatedDelivery.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-brand-green/10 rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="text-brand-green" size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status</p>
                <p className="font-bold capitalize">{order.status.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Our logistics partner will contact you within 24 hours to schedule the pickup of your garment.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Next Steps Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-brand-green/5 border border-brand-green/20 rounded-[2.5rem] p-8 md:p-10 mb-12"
      >
        <h3 className="font-display font-bold text-2xl mb-4 flex items-center gap-3">
          <Sparkles className="text-brand-green" size={24} />
          {order.type === 'shop_order' ? 'Delivery Timeline' : 'Next Steps for Transformation'}
        </h3>
        <div className="space-y-6">
          {order.type === 'shop_order' ? (
            <>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <span className="font-bold text-brand-green">01</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Your items are being prepared for shipping. You will receive a tracking number via email once the package is dispatched.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <span className="font-bold text-brand-green">02</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Standard delivery takes <span className="font-bold text-brand-black">3-5 business days</span>. Our courier partner will contact you on the day of delivery.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <span className="font-bold text-brand-green">01</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Our pickup agent will arrive within <span className="font-bold text-brand-black">24-48 hours</span>. Please pack your garment in a sealed bag to ensure it stays clean and safe during transit.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <span className="font-bold text-brand-green">02</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Print and attach the shipping label to your package. This helps us track your garment throughout its journey.
                  </p>
                  <button 
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 bg-white border border-brand-green/30 text-brand-green px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-green hover:text-white transition-all shadow-sm"
                  >
                    <Package size={16} />
                    Download Shipping Label
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Link to="/dashboard" className="btn-primary flex items-center justify-center gap-2 px-8 py-4">
          Go to Dashboard
          <ArrowRight size={18} />
        </Link>
        <Link to="/upload" className="btn-outline flex items-center justify-center gap-2 px-8 py-4">
          <ShoppingBag size={18} />
          Order Another Redesign
        </Link>
      </motion.div>
    </div>
  );
}
