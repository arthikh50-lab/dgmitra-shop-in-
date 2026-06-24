import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react'; 
import { Sparkles, Wand2, Download, RefreshCw, ArrowRight, Loader2, Image as ImageIcon, Send } from 'lucide-react';
import { generateDesignFromPrompt } from '../services/geminiService';
import SEO from '../components/SEO';
import { cn } from '../utils';

export default function AIDesignGenerator() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Digital Art');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateDesignFromPrompt(prompt, selectedStyle);
      if (result) {
        setGeneratedImage(result);
      } else {
        setError("Failed to generate design. Please try a more descriptive prompt.");
      }
    } catch (err) {
      setError("An error occurred during generation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `rewear-ai-design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseOnProduct = () => {
    if (!generatedImage) return;
    navigate('/upload', { 
      state: { 
        selectedDesign: { 
          imageUrl: generatedImage,
          title: 'AI Generated Design',
          category: 'AI Custom'
        } 
      } 
    });
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
      <SEO 
        title="AI Design Generator" 
        description="Describe your dream design and let our AI bring it to life for your next custom garment." 
      />
      
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-brand-green/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6"
        >
          <Sparkles className="text-brand-green" size={40} />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-display font-bold mb-4 tracking-tight"
        >
          AI Design Studio
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 text-lg max-w-2xl mx-auto"
        >
          Describe your vision in detail, and our AI will generate a unique graphic design ready for your custom clothing.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 rounded-[3rem] border border-gray-100 shadow-sm"
        >
          <div className="mb-8">
            <label htmlFor="prompt" className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              Describe Your Design
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A minimalist geometric wolf with neon blue accents, streetwear style, clean lines..."
              className="w-full h-40 p-6 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-brand-green focus:bg-white transition-all outline-none resize-none text-lg mb-6"
            />

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                Select Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Realistic Photo', icon: <ImageIcon size={16} />, desc: 'Crystal clear photo' },
                  { id: 'Portrait', icon: <Send size={16} />, desc: 'High-detail face' },
                  { id: 'Digital Art', icon: <Sparkles size={16} />, desc: 'Vibrant & crisp' }
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border-2 font-bold transition-all",
                      selectedStyle === style.id
                        ? "border-brand-green bg-brand-green/5 text-brand-green"
                        : "border-gray-100 bg-white text-gray-500 hover:border-brand-green/30"
                    )}
                  >
                    <div className="flex items-center gap-2 text-[10px]">
                      {style.icon}
                      {style.id}
                    </div>
                    <span className="text-[8px] font-normal opacity-60">{style.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={cn(
                "w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all",
                isGenerating || !prompt.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-brand-black text-white hover:bg-brand-green shadow-xl hover:shadow-brand-green/20"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Generate Design
                </>
              )}
            </button>

            <div className="flex flex-wrap gap-2">
              <p className="text-xs font-bold text-gray-400 w-full mb-1 uppercase tracking-widest">Try these:</p>
              {[
                { text: 'Cyberpunk Tiger', style: 'Digital Art' },
                { text: 'Vintage Floral Skull', style: 'Digital Art' },
                { text: 'A blue sports car on a city street', style: 'Realistic Photo' },
                { text: 'An old man with a beard', style: 'Portrait' },
                { text: 'A futuristic fantasy city', style: 'Digital Art' }
              ].map((suggestion) => (
                <button
                  key={suggestion.text}
                  onClick={() => {
                    setPrompt(suggestion.text);
                    setSelectedStyle(suggestion.style);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-brand-green/10 text-gray-600 hover:text-brand-green rounded-full text-xs font-bold transition-colors"
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 text-red-500 rounded-2xl text-sm flex items-center gap-3 border border-red-100"
            >
              <RefreshCw size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}
        </motion.div>

        {/* Result Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative aspect-square glass-card rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm flex flex-col items-center justify-center p-8"
        >
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 text-center"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-green animate-pulse" size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Creating Your Vision</h3>
                  <p className="text-gray-500 text-sm">Our AI is sketching, coloring, and refining your unique design...</p>
                </div>
              </motion.div>
            ) : generatedImage ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col items-center"
              >
                <div className="flex-1 w-full rounded-2xl overflow-hidden bg-white shadow-inner mb-6">
                  <img 
                    src={generatedImage} 
                    alt="Generated AI Design" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-4 bg-brand-green text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-green/90 transition-colors shadow-lg shadow-brand-green/20"
                  >
                    <Download size={18} />
                    Download Design
                  </button>
                  <button
                    onClick={handleUseOnProduct}
                    className="flex-1 py-4 bg-brand-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-black/90 transition-colors shadow-lg"
                  >
                    Use on Product
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 text-center text-gray-400"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-2">
                  <ImageIcon size={40} />
                </div>
                <p className="text-lg font-medium">Your design will appear here</p>
                <p className="text-sm max-w-xs">Enter a prompt and click generate to see the magic happen.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Info Section */}
      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: <Wand2 className="text-brand-green" />,
            title: "Unique Every Time",
            desc: "Each design is generated from scratch based on your specific description."
          },
          {
            icon: <ImageIcon className="text-brand-green" />,
            title: "Ready for Print",
            desc: "Designs are optimized for high-quality printing on various garment fabrics."
          },
          {
            icon: <Sparkles className="text-brand-green" />,
            title: "AI Powered",
            desc: "Leveraging the latest Gemini models for creative and artistic output."
          }
        ].map((item, idx) => (
          <div key={idx} className="glass-card p-8 rounded-3xl border border-gray-100">
            <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center mb-6">
              {item.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
