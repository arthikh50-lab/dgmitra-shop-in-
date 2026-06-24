import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Package, Image as ImageIcon, ShoppingCart, Users, 
  Settings, LogOut, Plus, Search, Filter, Edit2, Trash2, CheckCircle, 
  XCircle, Clock, ChevronRight, Download, Upload as UploadIcon, 
  MoreVertical, Save, X, AlertCircle, Loader2, Camera, ExternalLink,
  ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Activity,
  RefreshCw, Trash
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db, storage, logout, OperationType, handleFirestoreError } from '../firebase';
import { 
  collection, query, onSnapshot, orderBy, updateDoc, doc, 
  deleteDoc, addDoc, serverTimestamp, getDocs, where 
} from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from '../firebase';
import { formatCurrency, cn, formatDate } from '../utils';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

type Tab = 'dashboard' | 'products' | 'gallery' | 'orders' | 'users' | 'settings';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  tags: string[];
  createdAt: any;
}

interface GalleryItem {
  id: string;
  url: string;
  title: string;
  category: string;
  createdAt: any;
}

interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
  shippingAddress: any;
  designImageURL?: string;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: any;
}

export default function AdminPanel() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [selectedDesignImage, setSelectedDesignImage] = useState<string | null>(null);

  // Form States
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Apparel',
    stock: 0,
    images: [] as string[],
    tags: [] as string[]
  });
  const [productFiles, setProductFiles] = useState<File[]>([]);

  const [galleryForm, setGalleryForm] = useState({
    title: '',
    category: 'Transformation',
    url: ''
  });
  const [galleryFile, setGalleryFile] = useState<File | null>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Check Admin Access
  useEffect(() => {
    if (!authLoading && (!user || (profile?.role !== 'admin' && user.email !== 'manoj627k@gmail.com'))) {
      navigate('/admin/login');
    }
  }, [user, profile, authLoading, navigate]);

  // Real-time Data Listeners
  useEffect(() => {
    if (!user || (profile?.role !== 'admin' && user.email !== 'manoj627k@gmail.com')) return;

    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'products')
    );

    const unsubGallery = onSnapshot(
      query(collection(db, 'gallery'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setGallery(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'gallery')
    );

    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
    );

    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
        setLoading(false);
      }
    );

    return () => {
      unsubProducts();
      unsubGallery();
      unsubOrders();
      unsubUsers();
    };
  }, [user, profile]);

  // Optimized Image Upload Logic
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setUploadProgress(0);

    try {
      let imageUrls = [...(editingProduct?.images || [])];

      if (productFiles.length > 0) {
        const totalFiles = productFiles.length;
        const uploadPromises = productFiles.map(async (file, index) => {
          setIsProcessingFile(true);
          // Compress image
          const options = {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 800,
            useWebWorker: true,
            initialQuality: 0.7
          };
          const compressedFile = await imageCompression(file, options);
          
          const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, compressedFile);
          const url = await getDownloadURL(snapshot.ref);
          
          setUploadProgress(Math.round(((index + 1) / totalFiles) * 100));
          setIsProcessingFile(false);
          return url;
        });

        const newUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...newUrls];
      }

      const productData = {
        ...productForm,
        images: imageUrls,
        updatedAt: serverTimestamp(),
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast.success('Product updated successfully');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
        });
        toast.success('Product created successfully');
      }

      setShowProductModal(false);
      setProductForm({ name: '', description: '', price: 0, category: 'Apparel', stock: 0, images: [], tags: [] });
      setProductFiles([]);
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setIsSaving(false);
      setIsProcessingFile(false);
      setUploadProgress(0);
    }
  };

  const processGalleryFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    setIsProcessingFile(true);
    setUploadProgress(0);

    try {
      const totalFiles = fileList.length;
      const uploadPromises = fileList.map(async (file, index) => {
        // Compress image
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 800,
          useWebWorker: true,
          initialQuality: 0.7
        };
        const compressedFile = await imageCompression(file, options);

        const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, compressedFile);
        const url = await getDownloadURL(snapshot.ref);
        
        setUploadProgress(Math.round(((index + 1) / totalFiles) * 100));
        return url;
      });

      const urls = await Promise.all(uploadPromises);
      
      // Add to gallery
      const batchPromises = urls.map(url => 
        addDoc(collection(db, 'gallery'), {
          url,
          title: 'New Gallery Item',
          category: 'Transformation',
          createdAt: serverTimestamp()
        })
      );
      await Promise.all(batchPromises);
      toast.success(`${urls.length} items added to gallery`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'gallery');
    } finally {
      setIsProcessingFile(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteProduct = async (id: string, images: string[] = []) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted successfully');
      // Optionally delete images from storage
      if (images && images.length > 0) {
        for (const url of images) {
          try {
            const imageRef = ref(storage, url);
            await deleteObject(imageRef);
          } catch (e) {
            console.warn("Failed to delete image from storage:", url);
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleDeleteProductImage = async (url: string, index: number) => {
    if (!window.confirm('Delete this image from storage?')) return;
    
    try {
      // 1. Remove from local state
      const newImages = productForm.images.filter((_, i) => i !== index);
      setProductForm({ ...productForm, images: newImages });

      // 2. Delete from Firebase Storage
      try {
        const imageRef = ref(storage, url);
        await deleteObject(imageRef);
        toast.success('Image deleted from storage');
      } catch (e) {
        console.warn("Failed to delete image from storage:", url);
        toast.info('Image removed from product (storage deletion failed)');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleDeleteGallery = async (id: string, url: string) => {
    if (!window.confirm('Are you sure you want to delete this gallery item?')) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
      toast.success('Gallery item deleted successfully');
      try {
        const imageRef = ref(storage, url);
        await deleteObject(imageRef);
      } catch (e) {
        console.warn("Failed to delete image from storage:", url);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
    }
  };

  const handleUpdateOrderStatus = async (order: Order, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`Order status updated to ${newStatus}`);

      if (order.customerEmail) {
        try {
          await fetch('/api/email/notify-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: order.customerEmail,
              customerName: order.customerName || 'Customer',
              orderId: order.id,
              status: newStatus
            })
          });
        } catch (emailError) {
          console.error("Failed to trigger email notification:", emailError);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
      toast.error('Failed to update order status');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      toast.error('Failed to update user role');
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, o) => acc + o.total, 0);
    const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const totalProducts = products.length;
    const totalUsers = users.length;

    return [
      { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Active Orders', value: activeOrdersCount, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Total Products', value: totalProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];
  }, [orders, products, users]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-green" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-brand-black text-white p-6 flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center">
            <Settings className="text-brand-black w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Admin Portal</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'gallery', label: 'Gallery', icon: ImageIcon },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm",
                activeTab === item.id 
                  ? "bg-brand-green text-brand-black" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-green/20 overflow-hidden">
              {user?.photoURL && <img src={user.photoURL} alt="Admin" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.displayName}</p>
              <p className="text-[10px] text-gray-500 truncate">Administrator</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-bold text-sm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-900 capitalize">{activeTab}</h2>
            <p className="text-gray-500 text-sm">Manage your store and monitor performance</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green transition-all w-64"
              />
            </div>
            <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-brand-green transition-all">
              <Filter size={18} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn("p-3 rounded-2xl", stat.bg)}>
                        <stat.icon className={stat.color} size={24} />
                      </div>
                      <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                        <TrendingUp size={14} /> +12%
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-display font-bold text-gray-900">{stat.value}</h3>
                  </div>
                ))}
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-display font-bold text-xl">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-brand-green font-bold text-sm hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(orders || []).slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-gray-500">#{order.id.substring(0, 8)}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm">{order.customerName}</p>
                            <p className="text-xs text-gray-400">{order.customerEmail}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              order.status === 'delivered' ? "bg-green-100 text-green-600" :
                              order.status === 'pending' ? "bg-orange-100 text-orange-600" :
                              "bg-blue-100 text-blue-600"
                            )}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-sm">{formatCurrency(order.total)}</td>
                          <td className="px-6 py-4 text-xs text-gray-400">
                            {formatDate(order.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div 
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  {['All', 'Apparel', 'Accessories', 'Custom'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        filterCategory === cat ? "bg-brand-green text-brand-black" : "bg-white text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({ name: '', description: '', price: 0, category: 'Apparel', stock: 0, images: [], tags: [] });
                    setShowProductModal(true);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={18} /> Add Product
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products
                  .filter(p => filterCategory === 'All' || p.category === filterCategory)
                  .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((product) => (
                    <div key={product.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group">
                      <div className="aspect-square relative overflow-hidden">
                        <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingProduct(product);
                              setProductForm({ ...product });
                              setShowProductModal(true);
                            }}
                            className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-gray-600 hover:text-brand-green transition-all shadow-lg"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id, product.images || [])}
                            className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-gray-600 hover:text-red-500 transition-all shadow-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-900 truncate">{product.name}</h4>
                          <span className="text-brand-green font-bold">{formatCurrency(product.price)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.category}</span>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            product.stock > 10 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          )}>
                            {product.stock} in stock
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'gallery' && (
            <motion.div 
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  {['All', 'Transformation', 'Client Work', 'Studio'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        filterCategory === cat ? "bg-brand-green text-brand-black" : "bg-white text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <label className="btn-ghost flex items-center gap-2 cursor-pointer">
                    <UploadIcon size={18} /> Bulk Upload
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => e.target.files && processGalleryFiles(e.target.files)}
                    />
                  </label>
                  <button 
                    onClick={() => {
                      setEditingGallery(null);
                      setGalleryForm({ title: '', category: 'Transformation', url: '' });
                      setShowGalleryModal(true);
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={18} /> Add Item
                  </button>
                </div>
              </div>

              {isProcessingFile && (
                <div className="bg-white p-6 rounded-3xl border border-brand-green/20 shadow-sm flex items-center gap-4 animate-pulse">
                  <Loader2 className="animate-spin text-brand-green" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-bold">Processing Images...</span>
                      <span className="text-sm font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-green h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {gallery
                  .filter(item => filterCategory === 'All' || item.category === filterCategory)
                  .map((item) => (
                    <div key={item.id} className="break-inside-avoid bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group relative">
                      <img src={item.url} alt={item.title} className="w-full h-auto" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                        <h4 className="text-white font-bold mb-1">{item.title}</h4>
                        <p className="text-white/60 text-xs mb-4">{item.category}</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDeleteGallery(item.id, item.url)}
                            className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-all"
                          >
                            Delete
                          </button>
                          <button 
                            onClick={() => {
                              setEditingGallery(item);
                              setGalleryForm({ ...item });
                              setShowGalleryModal(true);
                            }}
                            className="flex-1 bg-white text-brand-black py-2 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Design</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders
                        .filter(o => o.id.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-gray-500">#{order.id.substring(0, 8)}</td>
                            <td className="px-6 py-4 text-xs text-gray-500">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-sm">{order.customerName}</p>
                              <p className="text-xs text-gray-400">{order.customerEmail}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex -space-x-2">
                                {(order.items || []).slice(0, 3).map((item: any, i: number) => (
                                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                                    <img src={item.image} alt="item" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                                {(order.items || []).length > 3 && (
                                  <div className="w-8 h-8 rounded-full border-2 border-white bg-brand-green text-brand-black text-[10px] font-bold flex items-center justify-center">
                                    +{(order.items || []).length - 3}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {order.designImageURL ? (
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:ring-2 hover:ring-brand-green transition-all"
                                    onClick={() => setSelectedDesignImage(order.designImageURL!)}
                                  >
                                    <img src={order.designImageURL} alt="Design" className="w-full h-full object-cover" />
                                  </div>
                                  <button 
                                    onClick={() => handleDownload(order.designImageURL!, `design-${order.id}.png`)}
                                    className="p-2 text-gray-400 hover:text-brand-green transition-all"
                                    title="Download Design"
                                  >
                                    <Download size={16} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Standard Service</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <select 
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order, e.target.value)}
                                className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border-none focus:ring-2 focus:ring-brand-green cursor-pointer",
                                  order.status === 'delivered' ? "bg-green-100 text-green-600" :
                                  order.status === 'cancelled' ? "bg-red-100 text-red-600" :
                                  "bg-blue-100 text-blue-600"
                                )}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 font-bold text-sm">{formatCurrency(order.total)}</td>
                            <td className="px-6 py-4">
                              <button className="p-2 text-gray-400 hover:text-brand-green transition-all">
                                <MoreVertical size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users
                        .filter(u => (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-beige flex items-center justify-center text-brand-black font-bold">
                                  {u.displayName ? u.displayName[0] : '?'}
                                </div>
                                <span className="font-bold text-sm">{u.displayName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                            <td className="px-6 py-4">
                              <select 
                                value={u.role}
                                onChange={(e) => handleUpdateUserRole(u.id, e.target.value as 'admin' | 'user')}
                                className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-none focus:ring-2 focus:ring-brand-green transition-all cursor-pointer",
                                  u.role === 'admin' ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600"
                                )}
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-400">
                              {formatDate(u.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this user?')) {
                                    deleteDoc(doc(db, 'users', u.id))
                                      .then(() => toast.success('User deleted successfully'))
                                      .catch((err) => {
                                        handleFirestoreError(err, OperationType.DELETE, `users/${u.id}`);
                                        toast.error('Failed to delete user');
                                      });
                                  }
                                }}
                                className="text-xs font-bold text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedDesignImage && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDesignImage(null)}
              className="absolute inset-0 bg-brand-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] bg-white rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setSelectedDesignImage(null)}
                className="absolute top-4 right-4 p-2 bg-brand-black/10 hover:bg-brand-black/20 rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>
              <img 
                src={selectedDesignImage} 
                alt="Full Design" 
                className="w-full h-full object-contain"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProductModal(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-2xl font-display font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleProductSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Product Name</label>
                    <input 
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Price</label>
                    <input 
                      type="number"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Description</label>
                  <textarea 
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Category</label>
                    <select 
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                    >
                      <option value="Apparel">Apparel</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Stock</label>
                    <input 
                      type="number"
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: Number(e.target.value)})}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Product Images</label>
                  <div className="grid grid-cols-4 gap-4">
                    {productForm.images.map((url, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
                        <img src={url} alt="product" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => handleDeleteProductImage(url, i)}
                          className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand-green hover:text-brand-green transition-all cursor-pointer">
                      <Plus size={24} />
                      <span className="text-[10px] font-bold mt-1">Add Image</span>
                      <input 
                        type="file" 
                        multiple 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => e.target.files && setProductFiles([...productFiles, ...Array.from(e.target.files)])}
                      />
                    </label>
                  </div>
                  {productFiles.length > 0 && (
                    <div className="bg-brand-green/5 p-4 rounded-2xl flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-green">{productFiles.length} new files selected</span>
                      <button type="button" onClick={() => setProductFiles([])} className="text-xs text-red-500 hover:underline">Clear</button>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-50 flex justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowProductModal(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="btn-primary px-12 flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gallery Modal */}
      <AnimatePresence>
        {showGalleryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGalleryModal(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-2xl font-display font-bold">{editingGallery ? 'Edit Gallery' : 'Add to Gallery'}</h3>
                <button onClick={() => setShowGalleryModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (galleryFile) {
                    await processGalleryFiles([galleryFile]);
                  } else if (editingGallery) {
                    await updateDoc(doc(db, 'gallery', editingGallery.id), {
                      ...galleryForm,
                      updatedAt: serverTimestamp()
                    });
                  }
                  setShowGalleryModal(false);
                }} 
                className="p-8 space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Title</label>
                  <input 
                    type="text"
                    required
                    value={galleryForm.title}
                    onChange={(e) => setGalleryForm({...galleryForm, title: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Category</label>
                  <select 
                    value={galleryForm.category}
                    onChange={(e) => setGalleryForm({...galleryForm, category: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                  >
                    <option value="Transformation">Transformation</option>
                    <option value="Client Work">Client Work</option>
                    <option value="Studio">Studio</option>
                  </select>
                </div>
                {!editingGallery && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Image File</label>
                    <input 
                      type="file"
                      required
                      accept="image/*"
                      onChange={(e) => e.target.files && setGalleryFile(e.target.files[0])}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                    />
                  </div>
                )}
                <div className="pt-6 border-t border-gray-50 flex justify-end gap-4">
                  <button type="button" onClick={() => setShowGalleryModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" disabled={isSaving} className="btn-primary px-12">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : (editingGallery ? 'Update' : 'Upload')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
