import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, Leaf, LogOut, LayoutDashboard, Truck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { logoutFirebase } from '../firebaseAuth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, profile } = useAuth();
  const { cartCount } = useCart();
  const isAdmin = profile?.role === 'admin' || user?.email === 'manoj627k@gmail.com';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/', isExternal: false },
    { name: 'Shop', path: '/shop', isExternal: false },
    { name: 'AI Studio', path: '/ai-studio', isExternal: false },
    { name: 'Services', path: '/services', isExternal: false },
    { name: 'Gallery', path: '/gallery', isExternal: false },
    { name: 'Pricing', path: '/pricing', isExternal: false },
    { name: 'Sustainability', path: '/sustainability', isExternal: false },
    { name: 'My Orders', path: '/orders', isExternal: false },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
        scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-brand-black rounded-lg flex items-center justify-center group-hover:bg-brand-green transition-colors">
            <Leaf className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight">
            DG MITRA <span className="text-brand-green">FOR ALL</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            if (link.isExternal) {
              return (
                <a
                  key={link.path}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'text-sm font-bold transition-all px-4 py-2 rounded-full',
                    'bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white shadow-sm'
                  )}
                >
                  {link.name}
                </a>
              );
            }
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-brand-green',
                  location.pathname === link.path ? 'text-brand-green' : 'text-brand-black'
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="text-xs font-bold uppercase tracking-widest text-brand-green bg-brand-green/10 px-3 py-1.5 rounded-full hover:bg-brand-green hover:text-white transition-all"
                >
                  Admin Panel
                </Link>
              )}
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-brand-green transition-all bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="uppercase text-lg">{user.email?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-bold leading-none">{user.displayName || user.email}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{isAdmin ? 'Admin' : (profile?.role || 'User')}</p>
                </div>
              </Link>
              <button onClick={logoutFirebase} className="btn-ghost text-red-500">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-ghost flex items-center gap-2">
              <User size={18} />
              <span>Login</span>
            </Link>
          )}
          
          <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-all group">
            <ShoppingBag size={20} className="group-hover:text-brand-green" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-green text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </Link>

          <Link 
            to="/ai-studio" 
            className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-green to-emerald-600 text-white rounded-full font-bold text-sm shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40 hover:scale-105 transition-all group"
          >
            <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
            <span>AI Studio</span>
          </Link>

          <Link to="/upload" className="btn-primary flex items-center gap-2">
            <ShoppingBag size={18} />
            <span>Upload Design</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-brand-black p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 p-6 shadow-xl md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => {
                if (link.isExternal) {
                  return (
                    <a
                      key={link.path}
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-bold text-brand-green bg-brand-green/10 px-4 py-2 rounded-xl text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="text-lg font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <hr className="border-gray-100" />
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 text-lg font-bold text-brand-green"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard size={20} />
                  <span>Admin Panel</span>
                </Link>
              )}
              <Link
                to="/cart"
                className="flex items-center justify-between text-lg font-medium"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag size={20} />
                  <span>Your Bag</span>
                </div>
                {cartCount > 0 && (
                  <span className="bg-brand-green text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to="/orders"
                className="flex items-center gap-2 text-lg font-medium"
                onClick={() => setIsOpen(false)}
              >
                <Truck size={20} />
                <span>My Orders</span>
              </Link>
              {user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-lg font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <User size={20} />
                  <span>Dashboard</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-lg font-medium text-left"
                >
                  <User size={20} />
                  <span>Login</span>
                </Link>
              )}
              <Link
                to="/ai-studio"
                className="flex items-center gap-2 text-lg font-bold text-brand-green bg-brand-green/10 p-3 rounded-xl"
                onClick={() => setIsOpen(false)}
              >
                <Sparkles size={20} />
                <span>AI Design Studio</span>
              </Link>
              <Link
                to="/upload"
                className="btn-primary text-center"
                onClick={() => setIsOpen(false)}
              >
                Upload Design
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
