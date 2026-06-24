import { motion } from 'motion/react';
import { Check, ArrowRight, Zap, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  const plans = [
    {
      name: 'Basic DTF Print',
      price: '299',
      description: 'Perfect for simple logos and streetwear graphics.',
      features: [
        'One A4 size print',
        'High-durability ink',
        'Standard delivery',
        'Basic fabric check'
      ],
      cta: 'Choose Basic',
      popular: true
    },
    {
      name: 'Painting',
      price: '249',
      description: 'Artistic touch for your denim and cotton pieces.',
      features: [
        'Custom artistic painting',
        'Waterproof acrylics',
        'AI design suggestion',
        'Priority pickup'
      ],
      cta: 'Choose Painting',
      popular: false 
    },
    {
      name: 'Premium Embroidery',
      price: '499',
      description: 'Luxury thread work for a sophisticated look.',
      features: [
        'Up to 10,000 stitches',
        'Premium silk threads',
        'AI design suggestion',
        '3 Day- delivery'
      ],
      cta: 'Choose Embroidery',
      popular: true
    },
    {
      name: 'Full Transformation',
      price: '599',
      description: 'The ultimate designer experience for your clothes.',
      features: [
        'Mixed media (Print + Paint)',
        'Custom patchwork',
        'Unlimited AI iterations',
        'VIP express delivery'
      ],
      cta: 'Choose Designer',
      popular: false
    }
  ];

  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-bold mb-6"
          >
            Simple <span className="text-brand-green">Pricing</span>
          </motion.h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            No hidden fees. All prices include pickup, redesign, and delivery back to your doorstep.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative p-8 rounded-[2.5rem] border transition-all hover:shadow-2xl ${
                plan.popular 
                  ? 'bg-brand-black text-white border-brand-black scale-105 z-10' 
                  : 'bg-white text-brand-black border-gray-100'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-green text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="font-display font-bold text-xl mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">₹</span>
                  <span className="text-5xl font-bold">{plan.price}</span>
                </div>
                <p className={`text-sm mt-4 ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check size={18} className={plan.popular ? 'text-brand-green' : 'text-brand-green'} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link 
                to="/upload" 
                className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${
                  plan.popular 
                    ? 'bg-brand-green text-white hover:bg-white hover:text-brand-black' 
                    : 'bg-brand-black text-white hover:bg-brand-green'
                }`}
              >
                {plan.cta} <ArrowRight size={18} />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 bg-brand-beige/30 p-12 md:p-20 rounded-[3rem]">
          <div className="flex gap-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <Zap className="text-brand-green" />
            </div>
            <div>
              <h4 className="font-display font-bold text-xl mb-2">Express Turnaround</h4>
              <p className="text-gray-600 text-sm">Get your redesigned clothes back within 48 hours of pickup. Speed meets quality.</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <Shield className="text-brand-green" />
            </div>
            <div>
              <h4 className="font-display font-bold text-xl mb-2">Quality Guarantee</h4>
              <p className="text-gray-600 text-sm">We use premium materials and expert craftsmanship. Not happy? We'll fix it for free.</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="text-brand-green" />
            </div>
            <div>
              <h4 className="font-display font-bold text-xl mb-2">Free Pickup</h4>
              <p className="text-gray-600 text-sm">Schedule a pickup from your home or college at no extra cost. We come to you.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
