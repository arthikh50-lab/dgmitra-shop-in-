import { Outlet, Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatBot from './ChatBot';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { X, Sparkles, MessageCircle } from 'lucide-react';

function AIStudioButton() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed bottom-44 right-6 z-50"
    >
      <Link to="/ai-studio">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className="relative group"
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-green to-purple-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
          
          <div className="relative w-10 h-10 md:w-12 md:h-12 bg-brand-black text-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
            <Sparkles size={20} className="md:w-6 md:h-6 text-brand-green animate-pulse" />
            
            {/* Tooltip */}
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-brand-black text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-brand-green/20">
              Try AI Studio ✨
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

function WhatsAppButton() {
  return (
    <motion.a
      href="https://wa.me/918506950476"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-28 right-6 z-50 w-10 h-10 md:w-12 md:h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-green-500/20 transition-all group"
    >
      <MessageCircle size={20} className="md:w-6 md:h-6" fill="currentColor" />
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
        1
      </span>
    </motion.a>
  );
}

function TopAnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const announcements = [
    { code: 'NEWLIFE10', text: 'Give your clothes a second life! Get 10% OFF on your first transformation.' },
    { code: 'REWEAR3', text: 'Save more by upcycling more! Flat ₹500 OFF on orders above 3 items.' },
    { code: 'FESTIVEGLOW', text: 'Refurbish your old ethnic wear. Get 15% OFF on all Embroidery services.' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-brand-black text-white py-2.5 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 flex justify-center items-center gap-3 text-sm font-medium">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Sparkles size={14} className="text-brand-green" />
              <span className="hidden sm:inline">{announcements[currentIndex].text}</span>
              <span className="sm:hidden">{announcements[currentIndex].text.substring(0, 40)}...</span>
              <span className="bg-brand-green text-brand-black px-2 py-0.5 rounded text-[10px] font-bold ml-2">
                CODE: {announcements[currentIndex].code}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white/10 rounded-full transition-colors ml-4"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopAnnouncementBar />
      <Navbar />
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-grow"
      >
        <Outlet />
      </motion.main>
      <Footer />
      <ChatBot />
      <AIStudioButton />
      <WhatsAppButton />
    </div>
  );
}
