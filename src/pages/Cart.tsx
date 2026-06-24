import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart, Sparkles, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="text-gray-300" size={40} />
          </div>
          <h2 className="text-3xl font-display font-bold mb-4">Your bag is empty</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Looks like you haven't added any custom magic to your bag yet. 
            Start exploring our collection and make it yours!
          </p>
          <Link 
            to="/shop" 
            className="inline-flex items-center gap-2 bg-brand-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-brand-green transition-colors"
          >
            Start Shopping <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center">
          <ShoppingCart className="text-brand-green" size={24} />
        </div>
        <h1 className="text-4xl font-display font-bold tracking-tight">Your <span className="text-brand-green">Bag</span></h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="popLayout">
            {cartItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 relative group"
              >
                {/* Product Image */}
                <div className="w-full sm:w-40 aspect-square rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 relative">
                  <img 
                    src={item.customization?.previewUrl || item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {item.customization && (
                    <div className="absolute top-2 left-2 bg-brand-green text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Sparkles size={10} /> CUSTOMIZED
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold group-hover:text-brand-green transition-colors">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">Size: {item.size}</span>
                      <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">Color: {item.color}</span>
                    </div>

                    {item.customization && (
                      <div className="bg-brand-green/5 border border-brand-green/10 rounded-2xl p-4 mb-4">
                        <div className="flex items-center gap-2 text-brand-green font-bold text-xs uppercase tracking-wider mb-2">
                          <Sparkles size={14} /> Customization Details
                        </div>
                        <p className="text-sm text-gray-600">
                          {item.customization.type === 'gallery' 
                            ? `Premium Gallery Design: ${item.customization.name}` 
                            : 'Custom Art Upload'}
                        </p>
                        {item.customization.technicalNote && (
                          <p className="text-[10px] text-gray-500 italic mt-2 border-l-2 border-brand-green/20 pl-2">
                            "{item.customization.technicalNote}"
                          </p>
                        )}
                        <p className="text-xs text-brand-green font-medium mt-2 flex items-center justify-between">
                          <span>Customization Fee:</span>
                          <span>{formatCurrency(item.customization.fee)}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400 line-through mb-1">
                        {formatCurrency((item.price + (item.customization?.fee || 0)) * item.quantity * 1.2)}
                      </p>
                      <p className="text-2xl font-display font-bold text-brand-black">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button 
            onClick={clearCart}
            className="text-sm text-gray-400 hover:text-brand-black font-medium flex items-center gap-2 transition-colors ml-auto"
          >
            <Trash2 size={16} /> Clear entire bag
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-brand-black text-white rounded-[2.5rem] p-8 sticky top-24 shadow-2xl overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/20 blur-3xl -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-green/10 blur-3xl -ml-16 -mb-16" />

            <h2 className="text-2xl font-display font-bold mb-8 relative">Order Summary</h2>
            
            <div className="space-y-4 mb-8 relative">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-white font-medium">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="text-brand-green font-bold uppercase text-xs tracking-widest">Calculated at next step</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tax</span>
                <span className="text-white font-medium">{formatCurrency(cartTotal * 0.12)}</span>
              </div>
              <div className="h-px bg-white/10 my-4" />
              <div className="flex justify-between items-end">
                <span className="text-lg font-medium">Total Amount</span>
                <span className="text-3xl font-display font-bold text-brand-green">
                  {formatCurrency(cartTotal * 1.12)}
                </span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-brand-green text-brand-black py-5 rounded-2xl font-bold text-lg hover:bg-white transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <span className="relative z-10">Proceed to Checkout</span>
              <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={20} />
            </button>

            <div className="mt-8 space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-green/20 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="text-brand-green" size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">100% Satisfaction Guarantee</p>
                  <p className="text-[10px] text-gray-400">If you're not happy with the transformation, we'll redo it for free.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} className="text-brand-green" />
                </div>
                <p>Custom items are made to order with love and care.</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={14} className="text-brand-green" />
                </div>
                <p>Free returns on all non-customized garments.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
