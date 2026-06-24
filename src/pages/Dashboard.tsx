import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Clock, CheckCircle, ChevronRight, User, Settings, LogOut, 
  ShoppingBag, MapPin, Heart, Instagram, Globe, Edit2, Plus, Trash2, 
  RefreshCw, Camera, Save, X, Sparkles, Truck, Eye, Leaf, Recycle, Activity
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../AuthContext';
import { db, logout, loginWithGoogle, OperationType, handleFirestoreError, isQuotaError } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, serverTimestamp, getDocs, getDocsFromCache } from '../firebase';
import { formatCurrency, cn, formatDate } from '../utils';
import { QuotaErrorBanner } from '../components/QuotaErrorBanner';
import SEO from '../components/SEO';

type Tab = 'overview' | 'orders' | 'history' | 'wardrobe' | 'addresses' | 'preferences' | 'settings';

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  const upcycledCount = useMemo(() => {
    return orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
  }, [orders]);

  const totalImpact = useMemo(() => {
    // Each upcycled garment saves ~2.5kg of CO2
    return upcycledCount * 2.5;
  }, [upcycledCount]);

  const [viewingTransformation, setViewingTransformation] = useState<any>(null);

  // Form States
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    photoURL: '',
    bio: '',
    instagramUrl: '',
    portfolioUrl: ''
  });

  const [addressForm, setAddressForm] = useState({
    label: '',
    street: '',
    city: '',
    pincode: '',
    phone: ''
  });

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showAddressModal || !!viewingTransformation) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddressModal, viewingTransformation]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        displayName: profile.displayName || '',
        photoURL: profile.photoURL || '',
        bio: profile.bio || '',
        instagramUrl: profile.instagramUrl || '',
        portfolioUrl: profile.portfolioUrl || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        let snapshot;
        try {
          snapshot = await getDocs(q);
        } catch (err) {
          if (isQuotaError(err)) {
            console.warn("Dashboard: Fetching from cache due to quota.");
            snapshot = await getDocsFromCache(q);
            setQuotaExceeded(true);
          } else throw err;
        }
        
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
        if (!quotaExceeded) setQuotaExceeded(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
        if (isQuotaError(error)) {
          setQuotaExceeded(true);
        } else {
          handleFirestoreError(error, OperationType.LIST, 'orders');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...profileForm,
        updatedAt: serverTimestamp()
      });
      setIsEditingProfile(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setIsSaving(true);
    try {
      let updatedAddresses;
      if (editingAddressId) {
        updatedAddresses = profile.savedAddresses.map((a: any) => 
          a.id === editingAddressId ? { ...addressForm, id: a.id } : a
        );
      } else {
        const newAddress = {
          id: Math.random().toString(36).substring(7),
          ...addressForm
        };
        updatedAddresses = [...(profile.savedAddresses || []), newAddress];
      }

      await updateDoc(doc(db, 'users', user.uid), {
        savedAddresses: updatedAddresses
      });
      setAddressForm({ label: '', street: '', city: '', pincode: '', phone: '' });
      setEditingAddressId(null);
      setShowAddressModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAddress = (address: any) => {
    setAddressForm({
      label: address.label,
      street: address.street,
      city: address.city,
      pincode: address.pincode,
      phone: address.phone
    });
    setEditingAddressId(address.id);
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user || !profile) return;
    try {
      const updatedAddresses = profile.savedAddresses.filter((a: any) => a.id !== addressId);
      await updateDoc(doc(db, 'users', user.uid), {
        savedAddresses: updatedAddresses
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleTogglePreference = async (tech: string) => {
    if (!user || !profile) return;
    try {
      const currentPrefs = profile.stylePreferences || [];
      const updatedPrefs = currentPrefs.includes(tech)
        ? currentPrefs.filter((p: string) => p !== tech)
        : [...currentPrefs, tech];
      await updateDoc(doc(db, 'users', user.uid), {
        stylePreferences: updatedPrefs
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleReorder = (order: any) => {
    navigate('/upload', { 
      state: { 
        reorderData: {
          serviceType: order.serviceType,
          originalImageUrl: order.originalImageUrl,
          baseLayerUrl: order.baseLayerUrl,
          fabric: order.fabric,
          condition: order.condition,
          designPreviewUrl: order.designPreviewUrl,
          customLogoUrl: order.customLogoUrl,
          technicalNote: order.technicalNote
        } 
      } 
    });
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="pt-32 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-32 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h2 className="text-3xl font-display font-bold mb-4">Please Login</h2>
        <p className="text-gray-600 mb-8">You need to be logged in to view your dashboard.</p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={() => navigate('/login', { state: { from: { pathname: '/dashboard' } } })} 
            className="btn-primary flex items-center justify-center gap-2"
          >
            <User size={18} />
            Go to Login
          </button>
          <Link to="/" className="btn-ghost">Go to Homepage</Link>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'draft');
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed');
  const drafts = orders.filter(o => o.status === 'draft');

  const techniques = ['Embroidery', 'Painting', 'Printing', 'DTF Printing', 'Patchwork', 'Full Transformation'];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <SEO 
        title="Dashboard" 
        description="Manage your orders, track your upcycling impact, and customize your wardrobe preferences." 
      />
      {quotaExceeded && (
        <div className="mb-8">
          <QuotaErrorBanner message="We're having trouble loading your latest orders due to high traffic. Your data is safe and will be available soon." />
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">
            Welcome back, <span className="text-brand-green">{profile?.displayName?.split(' ')[0] || user.displayName?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-500">{profile?.bio || 'Manage your orders and track your clothing transformations.'}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/upload" className="btn-primary flex items-center gap-2">
            <ShoppingBag size={18} /> New Redesign
          </Link>
        </div>
      </div>

      {/* Sustainability Impact Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
            <Leaf className="text-brand-green w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Sustainability Score</p>
            <h3 className="text-3xl font-display font-bold text-brand-black">
              {Math.round(totalImpact * 10)} <span className="text-sm font-sans font-normal text-gray-400">Points</span>
            </h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
            <Recycle className="text-blue-500 w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Garments Upcycled</p>
            <h3 className="text-3xl font-display font-bold text-brand-black">
              {upcycledCount} <span className="text-sm font-sans font-normal text-gray-400">Items</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
            <Activity className="text-orange-500 w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">CO2 Saved</p>
            <h3 className="text-3xl font-display font-bold text-brand-black">
              {totalImpact.toFixed(1)} <span className="text-sm font-sans font-normal text-gray-400">kg</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative group mb-4">
                <div className="w-24 h-24 bg-brand-beige rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                  {profile?.photoURL || user.photoURL ? (
                    <img src={profile?.photoURL || user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="text-brand-black" size={40} />
                  )}
                </div>
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="absolute bottom-0 right-0 p-2 bg-brand-green text-white rounded-full shadow-lg hover:scale-110 transition-all"
                >
                  <Camera size={14} />
                </button>
              </div>
              <h3 className="font-bold text-lg">{profile?.displayName || user.displayName}</h3>
              <p className="text-xs text-gray-400 mb-4">{user.email}</p>
              
              {profile?.bio && (
                <p className="text-sm text-gray-500 italic mb-4">"{profile.bio}"</p>
              )}

              <div className="flex gap-3 mt-2">
                {profile?.instagramUrl && (
                  <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-brand-green transition-all">
                    <Instagram size={16} />
                  </a>
                )}
                {profile?.portfolioUrl && (
                  <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-brand-green transition-all">
                    <Globe size={16} />
                  </a>
                )}
              </div>
            </div>
            
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'orders', label: 'Active Orders', icon: Clock },
                { id: 'history', label: 'Order History', icon: Package },
                { id: 'wardrobe', label: 'My Wardrobe', icon: ShoppingBag },
                { id: 'addresses', label: 'Addresses', icon: MapPin },
                { id: 'preferences', label: 'Preferences', icon: Heart },
                { id: 'settings', label: 'Profile Settings', icon: Settings },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold",
                    activeTab === item.id 
                      ? "bg-brand-green/10 text-brand-green" 
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <item.icon size={18} /> {item.label}
                </button>
              ))}
              <button onClick={logout} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all mt-8">
                <LogOut size={18} /> Logout
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm mb-1">Drafts</p>
                    <p className="text-3xl font-display font-bold text-brand-black">{String(drafts.length).padStart(2, '0')}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm mb-1">Active</p>
                    <p className="text-3xl font-display font-bold">{String(activeOrders.length).padStart(2, '0')}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm mb-1">Completed</p>
                    <p className="text-3xl font-display font-bold">{String(completedOrders.length).padStart(2, '0')}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm mb-1">Impact</p>
                    <p className="text-3xl font-display font-bold text-brand-green">{totalImpact.toFixed(1)}kg CO2</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-display font-bold text-xl">Recent Active Orders</h3>
                    <button onClick={() => setActiveTab('orders')} className="text-sm font-bold text-brand-green hover:underline">View All</button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {activeOrders.length === 0 ? (
                      <div className="p-12 text-center">
                        <p className="text-gray-400">No active orders.</p>
                      </div>
                    ) : activeOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-brand-beige rounded-xl overflow-hidden">
                            <img src={order.baseLayerUrl || order.originalImageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{order.fabric}</h4>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{order.status.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <Link to="/my-orders" className="p-2 hover:bg-gray-50 rounded-full transition-all">
                          <ChevronRight size={18} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Profile Overview */}
                <div className="bg-brand-black text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-display font-bold mb-4">Complete your style profile</h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-md">Tell us more about your style to get better AI recommendations for your next transformation.</p>
                    <button onClick={() => setActiveTab('settings')} className="btn-primary">Edit Profile</button>
                  </div>
                  <Sparkles className="absolute top-1/2 right-8 -translate-y-1/2 text-brand-green/20 w-32 h-32" />
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Drafts Section */}
                {drafts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-xl px-2">Saved Drafts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {drafts.map((draft) => (
                        <div key={draft.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm group">
                          <div className="aspect-square rounded-2xl bg-brand-beige mb-4 overflow-hidden relative">
                            <img src={draft.baseLayerUrl || draft.originalImageUrl} alt="Draft" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-orange-500">DRAFT</div>
                          </div>
                          <h4 className="font-bold truncate mb-1">{draft.fabric || 'Untitled Design'}</h4>
                          <p className="text-xs text-gray-500 mb-4">{draft.serviceType || 'Service not selected'}</p>
                          <Link to={`/upload/${draft.id}`} className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-2">
                            Resume Design
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Orders */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-display font-bold text-xl">Active Tracking</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {activeOrders.length === 0 ? (
                      <div className="p-20 text-center">
                        <p className="text-gray-400">No active orders at the moment.</p>
                      </div>
                    ) : activeOrders.map((order) => (
                      <div key={order.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-16 h-16 bg-brand-beige rounded-2xl overflow-hidden shrink-0">
                            <img src={order.baseLayerUrl || order.originalImageUrl} alt="Item" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.id.substring(0, 8)}</p>
                            <h4 className="font-bold">{order.fabric}</h4>
                            <p className="text-xs text-gray-500">{order.serviceType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                          <div className="text-right flex flex-col items-end gap-2">
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Status</p>
                              <span className="text-xs font-bold text-blue-500 flex items-center gap-1">
                                <Clock size={12} /> {order.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <Link 
                              to="/my-orders" 
                              className="text-[10px] font-bold text-brand-green hover:underline flex items-center gap-1"
                            >
                              Track Order <ChevronRight size={10} />
                            </Link>
                          </div>
                          <button 
                            onClick={() => navigate('/my-orders')}
                            className="p-2 rounded-full bg-gray-100 hover:bg-brand-black hover:text-white transition-all"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="px-2">
                  <h3 className="font-display font-bold text-2xl mb-2">Order History</h3>
                  <p className="text-gray-500 text-sm">A complete record of all your transformations and purchases.</p>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {orders.filter(o => o.status !== 'draft').map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-beige rounded-lg overflow-hidden">
                                  <img src={order.baseLayerUrl || order.originalImageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{order.fabric || 'Shop Order'}</p>
                                  <p className="text-[10px] text-gray-400">#{order.id.substring(0, 8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                order.status === 'delivered' ? "bg-green-100 text-green-600" :
                                order.status === 'cancelled' ? "bg-red-100 text-red-600" :
                                "bg-blue-100 text-blue-600"
                              )}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-sm">
                              {formatCurrency(order.price || order.total)}
                            </td>
                            <td className="px-6 py-4">
                              <Link to="/my-orders" className="text-brand-green hover:underline text-xs font-bold">Details</Link>
                            </td>
                          </tr>
                        ))}
                        {orders.filter(o => o.status !== 'draft').length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No orders found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'wardrobe' && (
              <motion.div 
                key="wardrobe"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center px-2">
                  <h3 className="font-display font-bold text-2xl">My Wardrobe</h3>
                  <p className="text-sm text-gray-500">{completedOrders.length} Completed Designs</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {completedOrders.length === 0 ? (
                    <div className="col-span-full bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center">
                      <ShoppingBag className="mx-auto text-gray-200 mb-6" size={48} />
                      <h4 className="text-xl font-bold mb-2">Your wardrobe is empty</h4>
                      <p className="text-gray-400 mb-8">Complete your first redesign to see it here!</p>
                      <Link to="/upload" className="btn-primary">Start Designing</Link>
                    </div>
                  ) : completedOrders.map((order) => (
                    <motion.div 
                      key={order.id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group"
                    >
                      <div className="aspect-[4/5] relative overflow-hidden">
                        <img 
                          src={order.designPreviewUrl || order.baseLayerUrl || order.originalImageUrl} 
                          alt="Redesign" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 gap-2">
                          <button 
                            onClick={() => setViewingTransformation(order)}
                            className="w-full bg-brand-green text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white hover:text-brand-black transition-all"
                          >
                            <Eye size={18} /> View Transformation
                          </button>
                          <button 
                            onClick={() => handleReorder(order)}
                            className="w-full bg-white text-brand-black py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-green hover:text-white transition-all"
                          >
                            <RefreshCw size={18} /> Re-order Design
                          </button>
                        </div>
                        <div className="absolute top-4 right-4 bg-brand-green text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg">
                          DELIVERED
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="font-bold text-lg mb-1">{order.fabric}</h4>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">{order.serviceType}</p>
                          <p className="text-sm font-bold text-brand-green">{formatCurrency(order.price)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'addresses' && (
              <motion.div 
                key="addresses"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center px-2">
                  <h3 className="font-display font-bold text-2xl">Saved Addresses</h3>
                  <button 
                    onClick={() => {
                      setEditingAddressId(null);
                      setAddressForm({ label: '', street: '', city: '', pincode: '', phone: '' });
                      setShowAddressModal(true);
                    }}
                    className="flex items-center gap-2 text-brand-green font-bold text-sm hover:underline"
                  >
                    <Plus size={16} /> Add New
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(!profile?.savedAddresses || profile.savedAddresses.length === 0) ? (
                    <div className="col-span-full bg-gray-50 p-12 rounded-[2rem] text-center border-2 border-dashed border-gray-200">
                      <MapPin className="mx-auto text-gray-300 mb-4" size={32} />
                      <p className="text-gray-500">No saved addresses yet.</p>
                    </div>
                  ) : profile.savedAddresses.map((addr: any) => (
                    <div key={addr.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-brand-beige rounded-xl flex items-center justify-center shrink-0">
                          <MapPin className="text-brand-black" size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold mb-1">{addr.label}</h4>
                          <p className="text-sm text-gray-500 leading-relaxed">{addr.street}</p>
                          <p className="text-sm text-gray-500">{addr.city}, {addr.pincode}</p>
                          <p className="text-xs text-gray-400 mt-1">{addr.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditAddress(addr)}
                          className="p-2 text-gray-300 hover:text-brand-green transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div 
                key="preferences"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="px-2">
                  <h3 className="font-display font-bold text-2xl mb-2">Style Preferences</h3>
                  <p className="text-gray-500 text-sm">Select your favorite techniques to help the AI personalize your future redesigns.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {techniques.map((tech) => {
                    const isSelected = profile?.stylePreferences?.includes(tech);
                    return (
                      <button 
                        key={tech}
                        onClick={() => handleTogglePreference(tech)}
                        className={cn(
                          "p-6 rounded-3xl border-2 text-left transition-all group relative overflow-hidden",
                          isSelected 
                            ? "border-brand-green bg-brand-green/5" 
                            : "border-gray-100 bg-white hover:border-brand-green/30"
                        )}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            isSelected ? "bg-brand-green text-white" : "bg-gray-50 text-gray-400 group-hover:bg-brand-green/10 group-hover:text-brand-green"
                          )}>
                            <Heart size={20} fill={isSelected ? "currentColor" : "none"} />
                          </div>
                          {isSelected && <CheckCircle size={18} className="text-brand-green" />}
                        </div>
                        <h4 className={cn("font-bold transition-all", isSelected ? "text-brand-green" : "text-gray-700")}>{tech}</h4>
                        <p className="text-xs text-gray-400 mt-1">AI will prioritize this method</p>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-brand-beige/30 p-8 rounded-[2.5rem] border border-brand-beige/50 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="text-brand-green" size={32} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xl mb-2">AI Personalization Active</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Based on your preferences, our Gemini AI will now suggest more {profile?.stylePreferences?.length > 0 ? profile.stylePreferences?.join(', ') : 'customized'} options during your next upload.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="px-2">
                  <h3 className="font-display font-bold text-2xl mb-2">Account Settings</h3>
                  <p className="text-gray-500 text-sm">Manage your personal information and social links.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Display Name</label>
                        <input 
                          type="text"
                          value={profileForm.displayName}
                          onChange={(e) => setProfileForm({...profileForm, displayName: e.target.value})}
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Profile Photo URL</label>
                        <input 
                          type="text"
                          value={profileForm.photoURL}
                          onChange={(e) => setProfileForm({...profileForm, photoURL: e.target.value})}
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                          placeholder="https://example.com/photo.jpg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Bio / Style Description</label>
                      <textarea 
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all min-h-[100px]"
                        placeholder="e.g. Vintage Lover, Streetwear Creator..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                          <Instagram size={14} /> Instagram URL
                        </label>
                        <input 
                          type="text"
                          value={profileForm.instagramUrl}
                          onChange={(e) => setProfileForm({...profileForm, instagramUrl: e.target.value})}
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                          placeholder="https://instagram.com/username"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                          <Globe size={14} /> Portfolio URL
                        </label>
                        <input 
                          type="text"
                          value={profileForm.portfolioUrl}
                          onChange={(e) => setProfileForm({...profileForm, portfolioUrl: e.target.value})}
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                          placeholder="https://yourportfolio.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="btn-primary py-4 px-12 flex items-center gap-2 shadow-lg shadow-brand-green/20"
                    >
                      {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Transformation Modal */}
      <AnimatePresence>
        {viewingTransformation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingTransformation(null)}
              className="absolute inset-0 bg-brand-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] p-8 relative z-10 shadow-2xl overflow-hidden overscroll-contain"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-display font-bold">Transformation Result</h3>
                  <p className="text-sm text-gray-500">Order #{viewingTransformation.id.substring(0, 8)}</p>
                </div>
                <button onClick={() => setViewingTransformation(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-brand-beige relative">
                    <img 
                      src={viewingTransformation.originalImageUrl || viewingTransformation.baseLayerUrl} 
                      alt="Original" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-4 left-4 bg-brand-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold">
                      ORIGINAL PHOTO
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-brand-beige relative">
                    <img 
                      src={viewingTransformation.designPreviewUrl || viewingTransformation.baseLayerUrl} 
                      alt="Transformed" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-4 left-4 bg-brand-green text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg">
                      FINAL RESULT
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-brand-beige/20 rounded-3xl border border-brand-green/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Sparkles className="text-brand-green" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold">{viewingTransformation.serviceType}</h4>
                    <p className="text-xs text-gray-500">{viewingTransformation.fabric} transformation</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleReorder(viewingTransformation)}
                  className="btn-primary px-8 py-3 text-sm flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Re-order This Design
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddressModal(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl overscroll-contain"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-display font-bold">{editingAddressId ? 'Edit Address' : 'Add Address'}</h3>
                <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddAddress} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Label (e.g. Home, Office)</label>
                  <input 
                    required
                    type="text"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Street Address</label>
                  <input 
                    required
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                    placeholder="House No, Building, Street Name"
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">City</label>
                    <input 
                      required
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                      placeholder="Mumbai"
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Pincode</label>
                    <input 
                      required
                      type="text"
                      pattern="[0-9]{6}"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})}
                      placeholder="400001"
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                  <input 
                    required
                    type="tel"
                    pattern="[0-9]{10}"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                    placeholder="9876543210"
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-2"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={18} /> : (editingAddressId ? <Save size={18} /> : <Plus size={18} />)}
                  {editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal (Simplified) */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingProfile(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl overscroll-contain"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-display font-bold">Quick Edit</h3>
                <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="w-24 h-24 bg-brand-beige rounded-full overflow-hidden border-4 border-white shadow-md">
                    {(profileForm.photoURL || user.photoURL) && <img src={profileForm.photoURL || user.photoURL} alt="Preview" className="w-full h-full object-cover" />}
                  </div>
                  <p className="text-xs text-gray-400">Preview of your profile photo</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Display Name</label>
                    <input 
                      type="text"
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm({...profileForm, displayName: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Photo URL</label>
                    <input 
                      type="text"
                      value={profileForm.photoURL}
                      onChange={(e) => setProfileForm({...profileForm, photoURL: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-green transition-all"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-2"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                  Update Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
