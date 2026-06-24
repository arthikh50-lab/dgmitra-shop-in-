import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, Truck, CreditCard, 
  MapPin, Phone, CheckCircle2, Loader2, Sparkles 
} from 'lucide-react';
import { formatCurrency, cn } from '../utils';
import { supabase } from '../supabase';
import SEO from '../components/SEO';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [address, setAddress] = useState({
    street: '',
    city: '',
    pincode: '',
    phone: ''
  });

  const tax = cartTotal * 0.12;
  const finalTotal = Math.round(cartTotal + tax);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleInitializePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to complete your purchase.");
      return;
    }

    if (!address.street || !address.city || !address.pincode || !address.phone) {
      setError("Please fill in all delivery details.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalTotal,
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
        description: "Order Checkout",
        order_id: orderData.id,
        handler: async function (response: any) {
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
      rzp1.on('payment.failed', function (response: any){
        setError(response.error.description);
      });
      rzp1.open();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    setLoading(true);
    try {
      const dateString = new Date().toISOString();
      const orderRecord = {
        userId: user?.id,
        status: 'paid',
        paymentIntentId: paymentId,
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          imageUrl: item.imageUrl,
          customization: item.customization || null
        })),
        subtotal: cartTotal,
        tax,
        total: finalTotal,
        deliveryAddress: address,
        createdAt: dateString,
        updatedAt: dateString,
        type: 'shop_order',
        designImageURL: null
      };

      const { data, error } = await supabase.from('orders').insert([orderRecord]).select().single();
      if (error) throw error;
      
      clearCart();
      navigate(`/order-success/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save order.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <SEO title="Checkout" description="Complete your purchase at DG MITRA FOR ALL." />
      
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={() => navigate('/cart')}
          className="p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-4xl font-display font-bold tracking-tight">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          {/* Delivery Address */}
          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center">
                <MapPin className="text-brand-green" size={20} />
              </div>
              <h2 className="text-2xl font-display font-bold">Delivery Details</h2>
            </div>

            <form id="checkout-form" onSubmit={handleInitializePayment} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Street Address</label>
                  <input 
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({...address, street: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                    placeholder="123, Green Street"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">City</label>
                    <input 
                      type="text"
                      required
                      value={address.city}
                      onChange={(e) => setAddress({...address, city: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Pincode</label>
                    <input 
                      type="text"
                      required
                      value={address.pincode}
                      onChange={(e) => setAddress({...address, pincode: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                      placeholder="400001"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="tel"
                      required
                      value={address.phone}
                      onChange={(e) => setAddress({...address, phone: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-5 text-lg flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                Proceed to Payment
              </button>
            </form>
          </section>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-brand-black text-white rounded-[2.5rem] p-8 sticky top-24 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/20 blur-3xl -mr-16 -mt-16" />
            
            <h2 className="text-2xl font-display font-bold mb-8 relative">Order Summary</h2>
            
            <div className="max-h-[40vh] overflow-y-auto mb-8 space-y-4 pr-2 scrollbar-hide">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 shrink-0">
                    <img src={item.customization?.previewUrl || item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity} • Size: {item.size}</p>
                    {item.customization && (
                      <p className="text-[10px] text-brand-green font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                        <Sparkles size={10} /> Customized
                      </p>
                    )}
                  </div>
                  <p className="font-bold">{formatCurrency(item.totalPrice)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 mb-8 relative border-t border-white/10 pt-8">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-white font-medium">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tax (12%)</span>
                <span className="text-white font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="text-brand-green font-bold uppercase text-xs tracking-widest">FREE</span>
              </div>
              <div className="h-px bg-white/10 my-4" />
              <div className="flex justify-between items-end">
                <span className="text-lg font-medium">Total Amount</span>
                <span className="text-3xl font-display font-bold text-brand-green">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <ShieldCheck className="text-brand-green" size={16} />
              <p>Secure checkout powered by Razorpay. Your data is encrypted.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
