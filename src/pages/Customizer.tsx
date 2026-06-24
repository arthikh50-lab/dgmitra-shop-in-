import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Stage, Layer, Image as KonvaImage, Transformer, Group, Text as KonvaText
} from 'react-konva';
import useImage from 'use-image';
import { 
  Upload, Sparkles, Scissors, Paintbrush, Check, 
  Loader2, X, Trash2, RotateCcw, Maximize2, 
  Type, Image as ImageIcon, Layout, ChevronLeft, Save, Plus
} from 'lucide-react';
import { doc, getDoc, getDocFromCache } from '../firebase';
import { db, OperationType, handleFirestoreError, isQuotaError } from '../firebase';
import { cn } from '../utils';
import { useAuth } from '../AuthContext';
import { QuotaErrorBanner } from '../components/QuotaErrorBanner';

// Pre-defined motifs
const MOTIFS = [
  { id: 'motif-1', name: 'Lotus', url: 'https://picsum.photos/seed/lotus/200/200' },
  { id: 'motif-2', name: 'Phoenix', url: 'https://picsum.photos/seed/phoenix/200/200' },
  { id: 'motif-3', name: 'Dragon', url: 'https://picsum.photos/seed/dragon/200/200' },
  { id: 'motif-4', name: 'Floral', url: 'https://picsum.photos/seed/floral/200/200' },
  { id: 'motif-5', name: 'Geometric', url: 'https://picsum.photos/seed/geo/200/200' },
  { id: 'motif-6', name: 'Minimalist', url: 'https://picsum.photos/seed/min/200/200' },
];

interface DesignElement {
  id: string;
  type: 'image' | 'text';
  url?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

const FONTS = [
  { name: 'Sans Serif', value: 'Inter, sans-serif' },
  { name: 'Serif', value: 'Georgia, serif' },
  { name: 'Monospace', value: 'JetBrains Mono, monospace' },
  { name: 'Display', value: 'Playfair Display, serif' },
  { name: 'Handwriting', value: 'Cormorant Garamond, serif' },
];

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#FF00FF', '#00FFFF', '#F27D26', '#5A5A40'
];

const TextElement = ({ element, isSelected, onSelect, onChange }: { 
  element: DesignElement; 
  isSelected: boolean; 
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaText
        text={element.text}
        x={element.x}
        y={element.y}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily}
        fill={element.fill}
        rotation={element.rotation}
        scaleX={element.scaleX}
        scaleY={element.scaleY}
        draggable
        ref={shapeRef}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...element,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...element,
            x: node.x(),
            y: node.y(),
            fontSize: Math.max(5, node.fontSize() * scaleX),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

const URLImage = ({ element, isSelected, onSelect, onChange }: { 
  element: DesignElement; 
  isSelected: boolean; 
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
}) => {
  const [img] = useImage(element.url || '', 'anonymous');
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        image={img}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        scaleX={element.scaleX}
        scaleY={element.scaleY}
        draggable
        ref={shapeRef}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...element,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...element,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default function Customizer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bgImage] = useImage(product?.imageUrl || '', 'anonymous');
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState<'motifs' | 'text' | 'upload'>('motifs');
  const stageRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (err) {
          if (isQuotaError(err)) {
            console.warn("Customizer: Fetching from cache due to quota.");
            docSnap = await getDocFromCache(docRef);
            setQuotaExceeded(true);
          } else throw err;
        }

        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
          if (!quotaExceeded) setQuotaExceeded(false);
        } else {
          navigate('/shop');
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        if (isQuotaError(error)) {
          setQuotaExceeded(true);
        } else {
          handleFirestoreError(error, OperationType.GET, `products/${id}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const addElement = (url: string) => {
    const newElement: DesignElement = {
      id: `element-${Date.now()}`,
      type: 'image',
      url,
      x: 150,
      y: 150,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const addTextElement = () => {
    if (!textInput.trim()) return;
    const newElement: DesignElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: textInput,
      fontSize: 30,
      fontFamily: 'Inter, sans-serif',
      fill: '#000000',
      x: 150,
      y: 150,
      width: 200,
      height: 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
    setTextInput('');
  };

  const updateSelectedElement = (attrs: Partial<DesignElement>) => {
    if (selectedId) {
      setElements(elements.map(el => el.id === selectedId ? { ...el, ...attrs } : el));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          addElement(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelected = () => {
    if (selectedId) {
      setElements(elements.filter(el => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  const finalizeDesign = async () => {
    if (!stageRef.current) return;
    setIsFinalizing(true);
    
    try {
      // Deselect before capturing
      setSelectedId(null);
      
      // Wait for a tick to ensure transformer is hidden
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      
      // Navigate to upload page with the customized design
      navigate('/upload', { 
        state: { 
          reorderData: {
            serviceType: 'Embroidery',
            originalImageUrl: product.imageUrl,
            designPreviewUrl: dataUrl,
            fabric: product.name,
            condition: 'New Product',
            technicalNote: `Customized ${product.name} from Shop`
          } 
        } 
      });
    } catch (error) {
      console.error("Finalization failed:", error);
    } finally {
      setIsFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-40 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold">Customize Your {product.name}</h1>
            <p className="text-gray-500 text-sm">Drag, resize, and rotate elements to create your perfect design.</p>
          </div>
        </div>
        <button 
          onClick={finalizeDesign}
          disabled={isFinalizing}
          className="btn-primary py-3 px-8 flex items-center gap-2 shadow-lg shadow-brand-green/20"
        >
          {isFinalizing ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
          Finalize Design
        </button>
      </div>

      {quotaExceeded && <QuotaErrorBanner className="mb-8" />}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden">
        {/* Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-6 px-2">
            <Layout size={20} className="text-brand-green" />
            <h3 className="font-bold">Design Tools</h3>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar overscroll-contain">
            {/* Tabs */}
            <div className="flex p-1 bg-gray-50 rounded-2xl mb-6">
              <button 
                onClick={() => setActiveTab('motifs')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-xl transition-all",
                  activeTab === 'motifs' ? "bg-white shadow-sm text-brand-green" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Motifs
              </button>
              <button 
                onClick={() => setActiveTab('text')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-xl transition-all",
                  activeTab === 'text' ? "bg-white shadow-sm text-brand-green" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Text
              </button>
              <button 
                onClick={() => setActiveTab('upload')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-xl transition-all",
                  activeTab === 'upload' ? "bg-white shadow-sm text-brand-green" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Upload
              </button>
            </div>

            {activeTab === 'upload' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Upload Artwork</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-100 rounded-2xl hover:border-brand-green hover:bg-brand-green/5 transition-all flex flex-col items-center gap-2 group"
                >
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-brand-green/10 transition-all">
                    <Upload size={20} className="text-gray-400 group-hover:text-brand-green" />
                  </div>
                  <span className="text-sm font-bold text-gray-500 group-hover:text-brand-green">Upload PNG/JPG</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*" 
                />
              </motion.div>
            )}

            {activeTab === 'motifs' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Embroidery Motifs</p>
                <div className="grid grid-cols-2 gap-3">
                  {MOTIFS.map((motif) => (
                    <button
                      key={motif.id}
                      onClick={() => addElement(motif.url)}
                      className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border-2 border-transparent hover:border-brand-green transition-all group relative"
                    >
                      <img src={motif.url} alt={motif.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Plus className="text-white" size={20} />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'text' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Add Custom Text</p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type something..."
                      className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-brand-green"
                      onKeyDown={(e) => e.key === 'Enter' && addTextElement()}
                    />
                    <button 
                      onClick={addTextElement}
                      className="p-3 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Selected Element Controls */}
            {selectedId && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-6 border-t border-gray-50 space-y-6"
              >
                {elements.find(e => e.id === selectedId)?.type === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Font Family</p>
                      <select 
                        className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-brand-green"
                        value={elements.find(e => e.id === selectedId)?.fontFamily}
                        onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                      >
                        {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Text Color</p>
                      <div className="flex flex-wrap gap-2">
                        {COLORS.map(c => (
                          <button 
                            key={c}
                            onClick={() => updateSelectedElement({ fill: c })}
                            className={cn(
                              "w-6 h-6 rounded-full border border-gray-200 transition-transform hover:scale-110",
                              elements.find(e => e.id === selectedId)?.fill === c && "ring-2 ring-brand-green ring-offset-2"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Font Size</p>
                      <input 
                        type="range"
                        min="10"
                        max="100"
                        value={elements.find(e => e.id === selectedId)?.fontSize}
                        onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) })}
                        className="w-full accent-brand-green"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Element Controls</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={removeSelected}
                      className="flex-1 p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                    <button 
                      onClick={() => {
                        const el = elements.find(e => e.id === selectedId);
                        if (el) {
                          const newElements = elements.map(e => 
                            e.id === selectedId ? { ...e, rotation: (e.rotation + 90) % 360 } : e
                          );
                          setElements(newElements);
                        }
                      }}
                      className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="lg:col-span-3 bg-brand-beige rounded-[3rem] overflow-hidden relative flex items-center justify-center p-8 border border-gray-100 shadow-inner">
          <div className="relative shadow-2xl rounded-2xl overflow-hidden bg-white">
            <Stage
              width={500}
              height={600}
              ref={stageRef}
              onMouseDown={(e) => {
                // deselect when clicked on empty area
                const clickedOnEmpty = e.target === e.target.getStage();
                if (clickedOnEmpty) {
                  setSelectedId(null);
                }
              }}
            >
              <Layer>
                {/* Background Image (Product) */}
                {bgImage && (
                  <KonvaImage
                    image={bgImage}
                    width={500}
                    height={600}
                    listening={false}
                  />
                )}
                
                {/* Design Elements */}
                {elements.map((el) => (
                  el.type === 'image' ? (
                    <URLImage
                      key={el.id}
                      element={el}
                      isSelected={el.id === selectedId}
                      onSelect={() => setSelectedId(el.id)}
                      onChange={(newAttrs) => {
                        const newElements = elements.map(item => 
                          item.id === el.id ? newAttrs : item
                        );
                        setElements(newElements);
                      }}
                    />
                  ) : (
                    <TextElement
                      key={el.id}
                      element={el}
                      isSelected={el.id === selectedId}
                      onSelect={() => setSelectedId(el.id)}
                      onChange={(newAttrs) => {
                        const newElements = elements.map(item => 
                          item.id === el.id ? newAttrs : item
                        );
                        setElements(newElements);
                      }}
                    />
                  )
                ))}
              </Layer>
            </Stage>
          </div>

          {/* Canvas Overlay Info */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/50 shadow-lg flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <Maximize2 size={14} /> 500 x 600 px
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <ImageIcon size={14} /> {elements.length} Elements
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
