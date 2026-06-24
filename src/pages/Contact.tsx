import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, Instagram, MapPin, Send, MessageSquare, Search, X, Loader2, AlertCircle } from 'lucide-react';
import { doc, getDoc, getDocFromCache } from '../firebase';
import { db, handleFirestoreError, OperationType, isQuotaError } from '../firebase';
import { QuotaErrorBanner } from '../components/QuotaErrorBanner';

interface TrackingInfo {
  id: string;
  status: string;
  estimatedDelivery: string;
}

export default function Contact() {
  const [orderId, setOrderId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingInfo | null>(null);
  const [showTracker, setShowTracker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setIsTracking(true);
    setError(null);
    setTrackingResult(null);
    setQuotaExceeded(false);

    try {
      const orderRef = doc(db, 'orders', orderId.trim());
      let orderSnap;
      try {
        orderSnap = await getDoc(orderRef);
      } catch (err) {
        if (isQuotaError(err)) {
          console.warn("Contact: Fetching order from cache due to quota.");
          orderSnap = await getDocFromCache(orderRef);
          setQuotaExceeded(true);
        } else throw err;
      }

      if (orderSnap.exists()) {
        const data = orderSnap.data();
        
        // Calculate estimated delivery (e.g., 3 days after creation)
        let estDate = 'TBD';
        if (data.createdAt) {
          const created = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          const delivery = new Date(created);
          delivery.setDate(delivery.getDate() + 3);
          estDate = delivery.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        setTrackingResult({
          id: orderSnap.id,
          status: data.status || 'Processing',
          estimatedDelivery: estDate
        });
      } else {
        setError('Order not found. Please check your Order ID and try again.');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `orders/${orderId}`);
      setError('An error occurred while tracking your order.');
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-bold mb-6"
          >
            Get in <span className="text-brand-green">Touch</span>
          </motion.h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Have questions about a design or your order? Our team is here to help you transform your wardrobe.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Contact Info */}
          <div>
            <h2 className="text-3xl font-display font-bold mb-10">Contact Information</h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center shrink-0 text-brand-green">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Email Us</h4>
                  <p className="text-gray-600">hello@dgmitra.com</p>
                  <p className="text-gray-400 text-sm">We reply within 24 hours</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center shrink-0 text-brand-green">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Call Us</h4>
                  <p className="text-gray-600">+91 98765 43210</p>
                  <p className="text-gray-400 text-sm">Mon-Sat, 10am - 7pm</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center shrink-0 text-brand-green">
                  <Instagram size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Instagram</h4>
                  <p className="text-gray-600">@dgmitra</p>
                  <p className="text-gray-400 text-sm">DM us for quick design tips</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center shrink-0 text-brand-green">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Our Studio</h4>
                  <p className="text-gray-600">123 Fashion Lane, Creative District</p>
                  <p className="text-gray-400 text-sm">Mumbai, Maharashtra 400001</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-gray-100">
            <h3 className="text-2xl font-display font-bold mb-8">Send us a Message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-green focus:bg-white transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="john@example.com"
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-green focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Subject</label>
                <select className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-green focus:bg-white transition-all outline-none appearance-none">
                  <option>General Inquiry</option>
                  <option>Design Question</option>
                  <option>Order Support</option>
                  <option>Collaboration</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Message</label>
                <textarea 
                  rows={5}
                  placeholder="How can we help you?"
                  className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-green focus:bg-white transition-all outline-none resize-none"
                ></textarea>
              </div>
              <button className="w-full btn-primary py-4 flex items-center justify-center gap-2">
                Send Message <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Dedicated Order Support Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-8 md:p-16 bg-brand-beige/30 rounded-[3rem] border border-brand-beige flex flex-col md:flex-row items-center justify-between gap-10"
        >
          <div className="max-w-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-brand-green text-white rounded-2xl flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <h2 className="text-3xl font-display font-bold">Order Support</h2>
            </div>
            <p className="text-gray-600 text-lg mb-8">
              Need help with an existing order? Our dedicated support team is ready to assist you with tracking, modifications, or returns.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setShowTracker(true)}
                className="btn-primary px-8 py-4 flex items-center gap-2"
              >
                <Search size={18} /> Track Your Order
              </button>
              <button className="btn-outline px-8 py-4">
                View FAQ
              </button>
            </div>
          </div>
          <div className="hidden lg:block w-px h-40 bg-brand-beige" />
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-4xl font-display font-bold text-brand-green mb-2">24h</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Response Time</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-display font-bold text-brand-green mb-2">100%</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Secure Tracking</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tracking Modal */}
      <AnimatePresence>
        {showTracker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTracker(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl"
            >
              <button 
                onClick={() => setShowTracker(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-green">
                  <Search size={32} />
                </div>
                <h3 className="text-2xl font-display font-bold">Track Your Order</h3>
                <p className="text-gray-500 text-sm">Enter your order ID to see the status</p>
              </div>

              {quotaExceeded && <QuotaErrorBanner className="mb-6" />}

              {!trackingResult ? (
                <form onSubmit={handleTrackOrder} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Order ID</label>
                    <input 
                      type="text" 
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g. MEKU-12345"
                      className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-brand-green focus:bg-white transition-all outline-none"
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-2xl text-sm">
                      <AlertCircle size={16} />
                      <p>{error}</p>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isTracking}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                  >
                    {isTracking ? <Loader2 className="animate-spin" size={20} /> : 'Track Status'}
                  </button>
                </form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="p-6 bg-brand-green/5 rounded-3xl border border-brand-green/10">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-brand-green/10">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Order ID</span>
                        <span className="font-mono font-bold text-brand-black">#{trackingResult.id}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-brand-green/10">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Status</span>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full capitalize ${
                          trackingResult.status.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-700' :
                          trackingResult.status.toLowerCase() === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {trackingResult.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Estimated Delivery</span>
                        <span className="text-sm font-bold text-brand-black">{trackingResult.estimatedDelivery}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button 
                      onClick={() => {
                        setTrackingResult(null);
                        setOrderId('');
                      }}
                      className="text-brand-green font-bold hover:underline text-sm"
                    >
                      Track another order
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
