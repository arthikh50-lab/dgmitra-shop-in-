import { Link } from 'react-router-dom';
import { Leaf, Instagram, Twitter, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-black text-white pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center">
              <Leaf className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">
              DG MITRA <span className="text-brand-green">FOR ALL</span>
            </span>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Transforming old fashion into new luxury. We give your clothes a second life with premium embroidery, painting, and printing.
          </p>
          <div className="flex gap-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-green transition-colors">
              <Instagram size={20} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-green transition-colors">
              <Twitter size={20} />
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-green transition-colors">
              <Leaf size={20} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display font-bold text-lg mb-6">Services</h4>
          <ul className="flex flex-col gap-4 text-gray-400 text-sm">
            <li><Link to="/services" className="hover:text-white transition-colors">Embroidery Design</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors">Painting</Link></li>
            <li><Link to="/services" className="hover:text-white transition-colors">DTF Printing</Link></li>

          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold text-lg mb-6">Company</h4>
          <ul className="flex flex-col gap-4 text-gray-400 text-sm">
            <li><Link to="/sustainability" className="hover:text-white transition-colors">Sustainability</Link></li>
            <li><Link to="/gallery" className="hover:text-white transition-colors">Design Gallery</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold text-lg mb-6">Contact</h4>
          <ul className="flex flex-col gap-4 text-gray-400 text-sm">
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-brand-green" />
              <span>hello@dgmitra.com</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="text-brand-green" />
              <span>+8506950476</span>
            </li>
            <li className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-brand-green font-bold uppercase tracking-widest mb-2">Newsletter</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-transparent border-b border-white/20 pb-1 text-sm focus:outline-none focus:border-brand-green w-full"
                />
                <button className="text-brand-green hover:text-white transition-colors">Join</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-10 border-t border-white/10 flex flex-col md:row justify-between items-center gap-4 text-gray-500 text-xs">
        <p>© 2026 DG MITRA FOR ALL. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/admin" className="hover:text-white transition-colors">Admin Portal</Link>
          <Link to="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
          <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
