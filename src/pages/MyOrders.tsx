import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Clock, CheckCircle, ChevronRight, ShoppingBag, 
  Calendar, CreditCard, AlertCircle, ArrowLeft, Truck, Search, RefreshCw, Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../AuthContext';
import { db, OperationType, handleFirestoreError, isQuotaError } from '../firebase';
import { collection, query, where, getDocs, orderBy, getDocsFromCache } from '../firebase';
import { formatCurrency, cn } from '../utils';
import { QuotaErrorBanner } from '../components/QuotaErrorBanner';

type OrderStatus = 'draft' | 'pending' | 'pickup_scheduled' | 'in_progress' | 'quality_check' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  serviceType: string;
  fabric: string;
  price: number;
  total?: number;
  createdAt: any;
  baseLayerUrl?: string;
  originalImageUrl?: string;
  designPreviewUrl?: string;
  type?: 'shop_order' | 'redesign_order';
  items?: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size: string;
    imageUrl: string;
    customization?: any;
  }[];
  deliveryAddress?: {
    street?: string;
    city?: string;
    pincode?: string;
    phone?: string;
    label?: string;
  };
}

const STEPPER_STAGES = [
  { id: 'pending', label: 'Order Placed', color: 'bg-yellow-500', icon: Clock },
  { id: 'cloth_received', label: 'Cloth Received', color: 'bg-blue-500', icon: Package },
  { id: 'in_transformation', label: 'In Transformation', color: 'bg-purple-500', icon: Sparkles },
  { id: 'quality_check', label: 'Quality Check', color: 'bg-orange-500', icon: Search },
  { id: 'shipped', label: 'Shipped', color: 'bg-green-500', icon: Truck },
];

const STATUS_MAP: Record<string, number> = {
  'draft': -1,
  'pending': 0,
  'order_placed': 0,
  'cloth_received': 1,
  'in_transformation': 2,
  'quality_check': 3,
  'shipped': 4,
  'delivered': 4,
  'cancelled': -1,
};

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;
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
          console.warn("MyOrders: Fetching from cache due to quota.");
          snapshot = await getDocsFromCache(q);
          setQuotaExceeded(true);
        } else throw err;
      }
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData.filter(o => o.status !== 'draft'));
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

  useEffect(() => {
    fetchOrders();
  }, [user]);

  if (authLoading || (user && loading)) {
    return (
      <div className="pt-40 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-40 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="text-gray-400" size={40} />
        </div>
        <h2 className="text-3xl font-display font-bold mb-4">Please Login</h2>
        <p className="text-gray-600 mb-8">You need to be logged in to view your orders.</p>
        <Link to="/" className="btn-primary">Go to Homepage</Link>
      </div>
    );
  }

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

  return (
    <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
      {quotaExceeded && (
        <div className="mb-8">
          <QuotaErrorBanner onRetry={fetchOrders} />
        </div>
      )}
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-4xl font-display font-bold">My Orders</h1>
          <p className="text-gray-500">Track your clothing transformations in real-time.</p>
        </div>
      </div>

      <div className="space-y-8">
        {orders.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center">
            <ShoppingBag className="mx-auto text-gray-200 mb-6" size={64} />
            <h4 className="text-2xl font-bold mb-2">No orders found</h4>
            <p className="text-gray-400 mb-8">You haven't placed any redesign orders yet.</p>
            <Link to="/upload" className="btn-primary">Start Your First Design</Link>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Order Header */}
              <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <img 
                      src={order.items?.[0]?.customization?.previewUrl || order.items?.[0]?.imageUrl || order.designPreviewUrl || order.baseLayerUrl || order.originalImageUrl} 
                      alt="Order Item" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Order ID: {order.id.substring(0, 8)}</p>
                    <h3 className="font-bold text-lg">
                      {order.type === 'shop_order' 
                        ? `${order.items?.[0]?.name}${order.items && order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}`
                        : order.fabric}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {order.type === 'shop_order' ? 'Shop Purchase' : order.serviceType}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-6 md:text-right">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center md:justify-end gap-1">
                      <Calendar size={10} /> Date
                    </p>
                    <p className="font-bold text-sm">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center md:justify-end gap-1">
                      <CreditCard size={10} /> Total
                    </p>
                    <p className="font-bold text-sm text-brand-green">
                      {formatCurrency(order.price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="p-8 md:p-12">
                <div className="relative">
                  {/* Progress Line Background */}
                  <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 rounded-full" />
                  
                  {/* Active Progress Line */}
                  <div 
                    className="absolute top-5 left-0 h-1 bg-brand-green rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.max(0, (STATUS_MAP[order.status] / (STEPPER_STAGES.length - 1)) * 100)}%` 
                    }}
                  />

                  <div className="relative flex justify-between items-start">
                    {STEPPER_STAGES.map((stage, index) => {
                      const currentStatusIndex = STATUS_MAP[order.status];
                      const isCompleted = index < currentStatusIndex;
                      const isActive = index === currentStatusIndex;
                      const isUpcoming = index > currentStatusIndex;
                      
                      return (
                        <div key={stage.id} className="flex flex-col items-center text-center w-1/5">
                          <div 
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 border-4 border-white shadow-sm",
                              isCompleted ? "bg-brand-green text-white" : 
                              isActive ? `${stage.color} text-white scale-110 shadow-lg` : 
                              "bg-gray-200 text-gray-400"
                            )}
                          >
                            {isCompleted ? <CheckCircle size={18} /> : <stage.icon size={18} />}
                          </div>
                          <div className="mt-4">
                            <p className={cn(
                              "text-[10px] font-bold uppercase tracking-widest transition-colors duration-500",
                              isActive ? "text-brand-black" : "text-gray-400"
                            )}>
                              {stage.label}
                            </p>
                            {isActive && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-1 inline-block px-2 py-0.5 bg-gray-100 rounded-full text-[8px] font-bold text-gray-500"
                              >
                                CURRENT
                              </motion.div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {order.deliveryAddress && (
                  <div className="mt-12 pt-8 border-t border-gray-50">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                        <Truck size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Delivery Address</p>
                        <p className="text-sm font-medium text-brand-black leading-relaxed">
                          {order.deliveryAddress.street}<br />
                          {order.deliveryAddress.city}, {order.deliveryAddress.pincode}<br />
                          <span className="text-gray-500">Phone: {order.deliveryAddress.phone}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">This order has been cancelled.</p>
                  </div>
                )}
              </div>

              {/* Order Footer Actions */}
              <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex justify-end gap-4">
                {order.status === 'delivered' && (
                  <button 
                    onClick={() => handleReorder(order)}
                    className="btn-primary py-2 px-6 text-sm flex items-center gap-2"
                  >
                    <RefreshCw size={16} /> Re-order Design
                  </button>
                )}
                <Link 
                  to={`/dashboard`} 
                  className="text-sm font-bold text-brand-green hover:underline flex items-center gap-1"
                >
                  View Details <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
