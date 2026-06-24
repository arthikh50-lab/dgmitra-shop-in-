import { motion } from 'motion/react';
import { Leaf, Recycle, Globe, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sustainability() {
  return (
    <div className="pt-32 pb-20">
      {/* Hero */}
      <section className="px-6 mb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 text-brand-green font-medium text-sm mb-6">
              <Globe size={16} />
              <span>Our Mission</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 leading-tight">
              Fashion That Doesn't <span className="text-brand-green">Cost the Earth</span>
            </h1>
            <p className="text-gray-600 text-xl leading-relaxed mb-10">
              The fashion industry is one of the world's largest polluters. At DG MITRA FOR ALL, we believe the most sustainable garment is the one already in your closet.
            </p>
            <div className="flex gap-4">
              <Link to="/upload" className="btn-primary">Start Redesigning</Link>
              <Link to="/gallery" className="btn-outline">See the Impact</Link>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[3rem] overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&h=1000&auto=format&fit=crop" alt="Sustainable Fashion" className="w-full h-auto" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute -bottom-10 -left-10 glass-card p-8 rounded-3xl max-w-xs">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center text-white">
                  <Recycle />
                </div>
                <h3 className="font-bold text-lg">Circular Fashion</h3>
              </div>
              <p className="text-sm text-gray-600">We've saved over 5,000 garments from landfills this year alone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-brand-black text-white px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="text-6xl font-display font-bold text-brand-green mb-4">2.7k</div>
            <p className="text-gray-400 uppercase tracking-widest text-sm font-bold">Liters of Water Saved</p>
            <p className="text-xs text-gray-600 mt-2">Per cotton shirt redesigned</p>
          </div>
          <div>
            <div className="text-6xl font-display font-bold text-brand-green mb-4">15kg</div>
            <p className="text-gray-400 uppercase tracking-widest text-sm font-bold">CO2 Emissions Avoided</p>
            <p className="text-xs text-gray-600 mt-2">Per jacket given a second life</p>
          </div>
          <div>
            <div className="text-6xl font-display font-bold text-brand-green mb-4">100%</div>
            <p className="text-gray-400 uppercase tracking-widest text-sm font-bold">Eco-Friendly Materials</p>
            <p className="text-xs text-gray-600 mt-2">Non-toxic paints and recycled threads</p>
          </div>
        </div>
      </section>

      {/* Why Redesign? */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Why Redesign?</h2>
            <p className="text-gray-600">The impact of choosing upcycling over fast fashion.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="p-10 bg-brand-beige/30 rounded-[3rem]">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                <Recycle className="text-brand-green" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Reduce Textile Waste</h3>
              <p className="text-gray-600 leading-relaxed">
                Over 92 million tons of textile waste are produced every year. By redesigning your clothes, you directly prevent them from ending up in landfills or being incinerated.
              </p>
            </div>
            <div className="p-10 bg-brand-beige/30 rounded-[3rem]">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                <Heart className="text-brand-green" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Support Ethical Craft</h3>
              <p className="text-gray-600 leading-relaxed">
                We empower local artists and craftspeople. Every piece is hand-customized in our studio, ensuring fair wages and a creative working environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Leaf className="w-16 h-16 text-brand-green mx-auto mb-8" />
          <h2 className="text-4xl font-display font-bold mb-8">Be Part of the Solution</h2>
          <p className="text-gray-600 text-lg mb-12">
            Join thousands of others who are choosing creativity over consumption. Your old clothes are waiting for their next chapter.
          </p>
          <Link to="/upload" className="btn-primary inline-flex items-center gap-2 text-lg px-10">
            Start Your Sustainable Journey <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
