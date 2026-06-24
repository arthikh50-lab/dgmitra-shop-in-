import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Scissors, Paintbrush, Printer, Sparkles, ArrowRight, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Services() {
  const [calcGarment, setCalcGarment] = useState('T-shirt');
  const [calcSize, setCalcSize] = useState('Small');
  const [calcService, setCalcService] = useState('Embroidery Design');

  const estimatedPrice = useMemo(() => {
    const basePrices: Record<string, number> = {
      'T-shirt': 200,
      'Hoodie': 400,
      'Jacket': 600
    };

    const sizeMultipliers: Record<string, number> = {
      'Small': 1,
      'Medium': 1.5,
      'Large': 2
    };

    const serviceAddons: Record<string, number> = {
      'Embroidery Design': 150,
      'Painting': 100,
      'DTF Printing': 50
    };

    const base = basePrices[calcGarment] || 0;
    const multiplier = sizeMultipliers[calcSize] || 1;
    const addon = serviceAddons[calcService] || 0;

    return Math.round((base * multiplier) + addon);
  }, [calcGarment, calcSize, calcService]);

  const services = [
    {
      title: 'Embroidery Design',
      description: 'Premium thread embroidery on jackets, shirts, hoodies. We use high-quality silk and cotton threads to create intricate patterns that last a lifetime.',
      details: ['Custom patterns', '3D embroidery', 'Patchwork', 'Logo restoration'],
      icon: <Scissors className="w-8 h-8" />,
      image: 'https://images.unsplash.com/photo-1613852348851-df1739db8201?q=80&w=800&h=600&auto=format&fit=crop',
      price: 'From ₹299',
      recommendedFabric: 'Denim & Heavy Cotton'
    },
    {
      title: 'Painting',
      description: 'Custom artistic painting on denim jackets and shirts. Our artists use specialized fabric acrylics that are waterproof and flexible.',
      details: ['Portrait art', 'Abstract designs', 'Calligraphy', 'Distressed effects'],
      icon: <Paintbrush className="w-8 h-8" />,
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&h=600&auto=format&fit=crop',
      price: 'From ₹249',
      recommendedFabric: 'Denim & Leather'
    },
    {
      title: 'DTF Printing',
      description: 'High-quality digital prints for streetwear and modern fashion. Direct-to-Film technology ensures vibrant colors and extreme durability.',
      details: ['Full color prints', 'Photo-realistic', 'Glow in the dark', 'Reflective prints'],
      icon: <Printer className="w-8 h-8" />,
      image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=800&h=600&auto=format&fit=crop',
      price: 'From ₹200',
      recommendedFabric: 'Cotton & Polyester'
    }
  ];

  return (
    <div className="pt-32 pb-20">
      <section className="px-6 mb-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-bold mb-6"
          >
            Our <span className="text-brand-green">Customization</span> Options
          </motion.h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            From subtle embroidery to bold hand-painted masterpieces, we offer a range of services to transform your clothing into unique designer pieces.
          </p>
        </div>
      </section>

      <section className="px-6 space-y-32">
        {services.map((service, idx) => (
          <div key={idx} className={`max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
            <motion.div 
              initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={idx % 2 === 1 ? 'lg:order-2' : ''}
            >
              <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-8 text-brand-green">
                {service.icon}
              </div>
              <div className="inline-block px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                Recommended: {service.recommendedFabric}
              </div>
              <h2 className="text-4xl font-display font-bold mb-6">{service.title}</h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">{service.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-10">
                {service.details.map((detail, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                    {detail}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6">
                <div className="text-2xl font-display font-bold text-brand-green">{service.price}</div>
                <Link to="/upload" className="btn-primary flex items-center gap-2">
                  Get Started <ArrowRight size={18} />
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`relative ${idx % 2 === 1 ? 'lg:order-1' : ''}`}
            >
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl">
                <img src={service.image} alt={service.title} className="w-full h-auto" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-beige rounded-full -z-10" />
              <div className="absolute -top-6 -left-6 w-48 h-48 border-2 border-brand-green/20 rounded-full -z-10" />
            </motion.div>
          </div>
        ))}
      </section>

      {/* Customization Guide Section */}
      <section className="px-6 py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-6 mx-auto text-brand-green">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-display font-bold mb-4">Which Service is Best for You?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Not sure which customization to choose? Here's a quick guide based on your garment type.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                garment: 'Denim (Jackets/Jeans)',
                bestFor: 'Embroidery or Painting',
                reason: 'Thick denim provides a perfect canvas for heavy threadwork or bold artistic painting.',
                icon: '👖'
              },
              {
                garment: 'T-shirts / Lightweight Cotton',
                bestFor: 'DTF Printing',
                reason: 'DTF printing is perfect for thin fabrics, offering a smooth, vibrant, and durable finish.',
                icon: '👕'
              },
              {
                garment: 'Hoodies / Sweatshirts',
                bestFor: 'All Services',
                reason: 'Hoodies are versatile! Choose embroidery for logos, painting for art, or DTF for graphics.',
                icon: '🧥'
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2rem] border border-gray-100 bg-brand-beige/10 hover:border-brand-green/30 transition-all group"
              >
                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform inline-block">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3">{item.garment}</h3>
                <div className="text-brand-green font-bold mb-4 text-sm uppercase tracking-wider">Best: {item.bestFor}</div>
                <p className="text-gray-600 text-sm leading-relaxed">{item.reason}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Price Calculator Section */}
      <section className="px-6 py-24 bg-brand-beige/30 mt-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-6 mx-auto text-brand-green">
              <Calculator className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-display font-bold mb-4">Price Calculator</h2>
            <p className="text-gray-600">Get an instant estimate for your custom redesign.</p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-brand-green/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Garment Type</label>
                <div className="space-y-3">
                  {['T-shirt', 'Hoodie', 'Jacket'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setCalcGarment(type)}
                      className={`w-full py-3 px-6 rounded-xl text-sm font-bold transition-all ${
                        calcGarment === type 
                        ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Design Size</label>
                <div className="space-y-3">
                  {['Small', 'Medium', 'Large'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setCalcSize(size)}
                      className={`w-full py-3 px-6 rounded-xl text-sm font-bold transition-all ${
                        calcSize === size 
                        ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Service Type</label>
                <div className="space-y-3">
                  {['Embroidery Design', 'Painting', 'DTF Printing'].map((service) => (
                    <button
                      key={service}
                      onClick={() => setCalcService(service)}
                      className={`w-full py-3 px-6 rounded-xl text-sm font-bold transition-all ${
                        calcService === service 
                        ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {service.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <p className="text-gray-500 text-sm mb-1">Estimated Price</p>
                <div className="text-5xl font-display font-bold text-brand-green">₹{estimatedPrice}</div>
              </div>
              <Link to="/upload" className="btn-primary w-full md:w-auto px-12 py-4 text-lg flex items-center justify-center gap-2">
                Start Order <ArrowRight size={20} />
              </Link>
            </div>

            {/* Coupons below calculator */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-brand-green/5 border border-brand-green/10 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-green shadow-sm">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-black uppercase tracking-wider">New User Offer</p>
                  <p className="text-[10px] text-gray-500">10% OFF on your first order</p>
                  <code className="text-xs font-bold text-brand-green">NEWLIFE10</code>
                </div>
              </div>
              <div className="p-4 bg-brand-green/5 border border-brand-green/10 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-green shadow-sm">
                  <Scissors size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-black uppercase tracking-wider">Festive Glow</p>
                  <p className="text-[10px] text-gray-500">15% OFF on Embroidery</p>
                  <code className="text-xs font-bold text-brand-green">FESTIVEGLOW</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 px-6 bg-brand-black text-white mt-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">How It Works</h2>
            <p className="text-gray-400">Five simple steps to your new designer wardrobe.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              { step: '01', title: 'Upload', desc: 'Photo of your clothing' },
              { step: '02', title: 'Choose', desc: 'Select design style' },
              { step: '03', title: 'Pickup', desc: 'Schedule a pickup' },
              { step: '04', title: 'Redesign', desc: 'We work our magic' },
              { step: '05', title: 'Delivery', desc: 'Within 3 Days' }
            ].map((item, i) => (
              <div key={i} className="relative text-center group">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-brand-green transition-colors">
                  <span className="font-display font-bold text-xl">{item.step}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
                {i < 4 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-[1px] bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
