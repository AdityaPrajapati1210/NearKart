import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { useNavigate, Link } from 'react-router-dom';
import { storeService } from '../services/storeService';
import { orderService } from '../services/orderService';
import { riderService } from '../services/riderService';
import {
  Store,
  Volume2,
  TrendingUp,
  PackageCheck,
  CheckCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  RefreshCw,
  LogOut,
  Sliders,
  DollarSign,
  ShoppingBag,
  ListOrdered,
  Map,
  Ban,
  AlertOctagon,
  X
} from 'lucide-react';

// Live Tracking Map Component for Shopkeeper utilizing Leaflet.js
const OrderMap = ({ order }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const socket = useContext(SocketContext);
  const [riderCoords, setRiderCoords] = useState(order.riderLocation || null);
  const [routePoints, setRoutePoints] = useState([]);
  const [leafletReady, setLeafletReady] = useState(!!window.L);

  // Store Coordinates (SPG Canteen)
  const storeLat = order.shopLocation?.coordinates?.[1] ?? order.store?.location?.lat ?? 28.4483;
  const storeLng = order.shopLocation?.coordinates?.[0] ?? order.store?.location?.lng ?? 76.7628;

  // Client Coordinates
  const clientLat = order.customerLocation?.coordinates?.[1] ?? order.deliveryLocation?.lat ?? 28.4500;
  const clientLng = order.customerLocation?.coordinates?.[0] ?? order.deliveryLocation?.lng ?? 76.7670;

  // Check for leaflet availability dynamically
  useEffect(() => {
    if (window.L) {
      setLeafletReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.L) {
        setLeafletReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // 1. Sync rider location state on order change or socket events
  useEffect(() => {
    if (order.riderLocation) {
      setRiderCoords(order.riderLocation);
    }
  }, [order]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join-order', order._id);

    const handleRiderLocationUpdate = (data) => {
      if (data.orderId === order._id) {
        const lat = data.lat ?? data.location?.latitude;
        const lng = data.lng ?? data.location?.longitude;
        if (lat && lng) {
          setRiderCoords({ lat, lng });
        }
      }
    };
    socket.on('RIDER_LOCATION_UPDATED', handleRiderLocationUpdate);
    socket.on('rider-location', handleRiderLocationUpdate);
    return () => {
      socket.off('RIDER_LOCATION_UPDATED', handleRiderLocationUpdate);
      socket.off('rider-location', handleRiderLocationUpdate);
    };
  }, [socket, order._id]);

  // 2. Fetch OSRM route from START (Store or Rider) to DESTINATION (Client)
  useEffect(() => {
    let active = true;
    const fetchRoute = async () => {
      try {
        const startLat = (order.orderStatus === 'OUT_FOR_DELIVERY' && riderCoords) ? riderCoords.lat : storeLat;
        const startLng = (order.orderStatus === 'OUT_FOR_DELIVERY' && riderCoords) ? riderCoords.lng : storeLng;

        const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${clientLng},${clientLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            if (active) {
              setRoutePoints(coords);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('OSRM routing failed, falling back to straight path:', err);
      }
      if (active) {
        const fallbackStart = (order.orderStatus === 'OUT_FOR_DELIVERY' && riderCoords) ? [riderCoords.lat, riderCoords.lng] : [storeLat, storeLng];
        setRoutePoints([fallbackStart, [clientLat, clientLng]]);
      }
    };

    fetchRoute();
    return () => {
      active = false;
    };
  }, [order.orderStatus, storeLat, storeLng, clientLat, clientLng, riderCoords]);

  // 3. Render Leaflet Map
  useEffect(() => {
    if (!leafletReady || !order || !mapContainerRef.current || routePoints.length === 0) return;

    // Clear previous map instance and DOM container parameters to prevent duplicate mount errors
    if (mapContainerRef.current) {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Error removing map instance:', e);
        }
        mapInstanceRef.current = null;
      }
      mapContainerRef.current._leaflet_id = null;
      mapContainerRef.current.innerHTML = '';
    }

    const map = window.L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    });

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    mapInstanceRef.current = map;

    const bounds = window.L.latLngBounds(routePoints);
    map.fitBounds(bounds, { padding: [20, 20] });

    // A. Store Pin
    const storeIcon = window.L.divIcon({
      html: `<div class="bg-green-600 border border-white text-white rounded-full px-1.5 py-0.5 font-bold text-3xs shadow-sm whitespace-nowrap">NearKart Store</div>`,
      className: '',
      iconSize: [85, 18],
    });
    window.L.marker([storeLat, storeLng], { icon: storeIcon }).addTo(map);

    // B. Client Pin
    const clientIcon = window.L.divIcon({
      html: `<div class="bg-blue-600 border border-white text-white rounded-full px-1.5 py-0.5 font-bold text-3xs shadow-sm whitespace-nowrap">Client Spot</div>`,
      className: '',
      iconSize: [65, 18],
    });
    window.L.marker([clientLat, clientLng], { icon: clientIcon }).addTo(map);

    // C. Route path line (OSRM road path)
    window.L.polyline(routePoints, {
      color: '#ef4444',
      weight: 3.5,
      opacity: 0.8,
    }).addTo(map);

    // D. Scooter Marker (Live Rider location or Store location if not dispatched yet)
    if (order.orderStatus === 'OUT_FOR_DELIVERY') {
      const activeRiderLat = riderCoords?.lat || storeLat;
      const activeRiderLng = riderCoords?.lng || storeLng;

      const riderIcon = window.L.divIcon({
        html: `<div class="w-8 h-8 bg-red-600 border border-white rounded-full flex items-center justify-center text-sm shadow-md animate-pulse">🛵</div>`,
        className: '',
        iconSize: [32, 32],
      });
      window.L.marker([activeRiderLat, activeRiderLng], { icon: riderIcon }).addTo(map);
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Error removing map in cleanup:', e);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [leafletReady, order, routePoints, riderCoords]);

  return (
    <div className="space-y-1">
      <div ref={mapContainerRef} className="w-full h-36 rounded-lg bg-gray-100 border border-gray-200 z-10" />
      <span className="text-4xs text-gray-400 font-bold uppercase tracking-wider block text-center mt-1">
        Delivery Routing Path Tracker
      </span>
    </div>
  );
};

const ShopkeeperDashboard = () => {
  const { token, user, loading: authLoading, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [currentTab, setCurrentTab] = useState('orders');
  const [orderFilter, setOrderFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // OTP inputs for order handovers
  const [otpInputs, setOtpInputs] = useState({});
  const [otpErrors, setOtpErrors] = useState({});

  // Cancellation Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState('');
  const [cancelStatus, setCancelStatus] = useState('REJECTED');
  const [cancelReason, setCancelReason] = useState('Item unavailable');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Delivery riders management states
  const [riders, setRiders] = useState([]);

  const fetchRiders = async () => {
    try {
      const riderList = await riderService.getRiders();
      setRiders(riderList || []);
    } catch (err) {
      console.error('Error fetching delivery riders list:', err);
    }
  };

  const handleAssignRider = async (orderId, riderId) => {
    if (!riderId) return;
    try {
      const updated = await orderService.assignRider(orderId, riderId);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...updated, deliveryRider: updated.deliveryRider || o.deliveryRider } : o));
      alert('Rider assigned successfully!');
    } catch (err) {
      alert(err.message || 'Failed to assign rider');
    }
  };

  const fetchAnalyticsData = async (ordersData) => {
    try {
      const data = await orderService.getShopkeeperDashboard(1, 20);
      const allOrders = ordersData || orders;
      const deliveredOrders = allOrders.filter(o => o.orderStatus === 'DELIVERED');
      const activeOrders = allOrders.filter(o => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.orderStatus));
      const cancelledOrders = allOrders.filter(o => ['CANCELLED', 'REJECTED'].includes(o.orderStatus));

      const grossSales = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const paymentMethodSales = {
        COD: deliveredOrders.filter(o => o.paymentMethod === 'COD').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        ONLINE: deliveredOrders.filter(o => o.paymentMethod === 'ONLINE').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      };

      const collegeMap = {};
      deliveredOrders.forEach(o => {
        const rawLoc = o.college || o.deliveryAddress || 'Campus Area';
        const cleanName = rawLoc.split(',')[0].trim() || 'Campus Hostel';
        if (!collegeMap[cleanName]) {
          collegeMap[cleanName] = { college: cleanName, revenue: 0, orders: 0 };
        }
        collegeMap[cleanName].revenue += (o.totalAmount || 0);
        collegeMap[cleanName].orders += 1;
      });
      const collegeSales = Object.values(collegeMap);

      const reasonMap = {};
      cancelledOrders.forEach(o => {
        const r = o.cancellationReason || o.rejectionReason || 'Item unavailable';
        reasonMap[r] = (reasonMap[r] || 0) + 1;
      });
      const cancellationReasons = Object.entries(reasonMap).map(([reason, count]) => ({ reason, count }));

      const topProducts = (data?.topSellingProducts && data.topSellingProducts.length > 0)
        ? data.topSellingProducts.map(p => ({
            name: p.name,
            quantity: p.totalQuantitySold || p.quantity || 0,
            price: p.price,
            image: typeof p.image === 'string' ? p.image : p.image?.url || '',
          }))
        : [];

      const lowStockAlerts = data?.lowStockProducts || [];

      setAnalytics({
        todaySales: data?.today?.sale || 0,
        todayOrders: data?.today?.totalOrders || 0,
        totalSales: grossSales,
        completedOrders: deliveredOrders.length,
        pendingOrders: activeOrders.length,
        cancelledOrders: cancelledOrders.length,
        lowStockAlerts,
        topProducts,
        paymentMethodSales,
        collegeSales,
        cancellationReasons,
      });
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
  };

  // Load store and active orders on mount
  const loadStoreAndOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const storeData = await storeService.getShopkeeperStore();
      setStore(storeData);

      // Join Socket Store room
      if (socket && storeData?._id) {
        socket.emit('join_store', storeData._id);
        console.log(`🔌 Joining socket room: store_${storeData._id}`);
      }

      // Load all shopkeeper orders
      const ordersData = await orderService.getShopkeeperOrders(1, 50);
      setOrders(ordersData || []);

      fetchRiders();

      // Trigger analytics fetch
      await fetchAnalyticsData(ordersData);

    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/shopkeeper/login');
      return;
    }

    if (user.role !== 'shopkeeper') {
      navigate('/');
      return;
    }

    loadStoreAndOrders();
  }, [user, authLoading]);

  useEffect(() => {
    if (currentTab === 'analytics' && user) {
      fetchAnalyticsData();
    }
  }, [currentTab, user]);

  // Socket.IO listeners
  useEffect(() => {
    if (!socket || !store) return;

    const handleNewOrder = (data) => {
      console.log('🔔 NEW ORDER RECEIVED:', data);
      
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2043/2043-100.wav');
        audio.volume = 0.8;
        audio.play();
      } catch (err) {
        console.log('Audio chime autoplay blocked');
      }

      loadStoreAndOrders();
    };

    const handleOrderExpiry = (data) => {
      console.log('⏱️ Order expired/timeout:', data);
      loadStoreAndOrders();
    };

    const handleOrderStatusChange = () => {
      loadStoreAndOrders();
    };

    socket.on('NEW_ORDER', handleNewOrder);
    socket.on('ORDER_EXPIRED', handleOrderExpiry);
    socket.on('ORDER_STATUS_CHANGED', handleOrderStatusChange);

    return () => {
      socket.off('NEW_ORDER', handleNewOrder);
      socket.off('ORDER_EXPIRED', handleOrderExpiry);
      socket.off('ORDER_STATUS_CHANGED', handleOrderStatusChange);
    };
  }, [socket, store]);

  // Update Store status (open, busy, closed)
  const handleStoreStatusChange = async (newStatus) => {
    try {
      const isOpen = newStatus === 'open';
      const updated = await storeService.updateStoreStatus(isOpen);
      setStore(prev => ({
        ...prev,
        isOpen: updated.isOpen,
        status: updated.isOpen ? 'open' : 'closed',
        acceptingOrders: updated.isOpen,
      }));
      alert(`Store status updated to: ${newStatus.toUpperCase()}`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Switch Accepting Orders toggle ("Close Shop" setting)
  const handleToggleAcceptingOrders = async () => {
    if (!store) return;
    try {
      const nextOpen = !store.isOpen;
      const updated = await storeService.updateStoreStatus(nextOpen);
      setStore(prev => ({
        ...prev,
        isOpen: updated.isOpen,
        status: updated.isOpen ? 'open' : 'closed',
        acceptingOrders: updated.isOpen,
      }));
      alert(`Orders toggle set to: ${updated.isOpen ? 'Accepting Orders' : 'Store Closed'}`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Modify Order Status lifecycle
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (newStatus === 'REJECTED' || newStatus === 'CANCELLED') {
      setCancelOrderId(orderId);
      setCancelStatus(newStatus);
      setCancelReason('Item unavailable');
      setShowCancelModal(true);
      return;
    }

    try {
      setOtpErrors(prev => ({ ...prev, [orderId]: '' }));

      let updated;
      if (newStatus === 'DELIVERED') {
        const enteredOtp = otpInputs[orderId];
        if (!enteredOtp || enteredOtp.length < 4 || enteredOtp.length > 6) {
          setOtpErrors(prev => ({ ...prev, [orderId]: 'Please enter a valid 4 to 6-digit OTP' }));
          return;
        }
        updated = await orderService.verifyDeliveryOTP(orderId, enteredOtp);
        setOtpInputs(prev => {
          const copy = { ...prev };
          delete copy[orderId];
          return copy;
        });
      } else {
        updated = await orderService.updateOrderStatus(orderId, newStatus);
      }

      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...updated, deliveryRider: updated.deliveryRider || o.deliveryRider } : o));
      fetchAnalyticsData();

    } catch (err) {
      setOtpErrors(prev => ({ ...prev, [orderId]: err.message }));
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setCancelLoading(true);
    try {
      const updated = await orderService.updateOrderStatus(cancelOrderId, cancelStatus, {
        cancellationReason: cancelReason,
        rejectionReason: cancelReason,
      });

      setOrders(prev => prev.map(o => o._id === cancelOrderId ? updated : o));
      setShowCancelModal(false);
      fetchAnalyticsData();
      alert('Order status updated successfully');
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleToggleBlockUser = async (customerId, currentBlockedStatus) => {
    const confirmation = window.confirm(
      `Are you sure you want to ${currentBlockedStatus ? 'unblock' : 'block'} this customer account? Blocked accounts are restricted from placing orders.`
    );
    if (!confirmation) return;

    try {
      alert(`Customer ${currentBlockedStatus ? 'unblocked' : 'blocked'} successfully!`);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const isPast = ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.orderStatus);
    return orderFilter === 'past' ? isPast : !isPast;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <RefreshCw className="animate-spin text-gray-800 mx-auto mb-4" size={32} />
        <p className="text-gray-500">Initializing Store Desk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-white p-8 rounded-xl border border-red-100 shadow-sm">
        <AlertTriangle className="text-red-500 mx-auto mb-4" size={36} />
        <h2 className="text-xl font-bold text-gray-800">Access Restricted</h2>
        <p className="text-gray-400 text-sm mt-1.5 mb-6">{error}</p>
        <button onClick={() => { logout(); navigate('/shopkeeper/login'); }} className="w-full bg-gray-800 text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-gray-900 transition">
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Panel */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col justify-between shrink-0">
        <div className="p-6 space-y-8">
          <div className="flex items-center gap-2">
            <Store className="text-green-500" size={24} />
            <span className="text-xl font-black tracking-tight text-white">NearKart Desk</span>
          </div>

          {store && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-800 space-y-3 font-semibold">
              <div>
                <p className="text-xxs text-gray-400 uppercase tracking-widest font-bold">Logged Store</p>
                <h3 className="font-extrabold text-white text-sm mt-1">{store.name}</h3>
                <p className="text-3xs text-gray-500 line-clamp-1 mt-0.5">{store.location.address}</p>
              </div>

              {/* Status Indicator */}
              <div className="flex justify-between items-center border-t border-gray-700/50 pt-2.5">
                <div className="flex gap-1.5 items-center">
                  <span className={`w-2 h-2 rounded-full ${
                    store.status === 'open' ? 'bg-green-500 animate-pulse' : store.status === 'busy' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <span className="text-2xs uppercase font-extrabold tracking-wide text-gray-300">{store.status}</span>
                </div>
                <span className="text-3xs text-gray-400">{store.estimatedDeliveryTime}</span>
              </div>

              {/* Order Toggles ON/OFF (Close Shop Button) */}
              <div className="border-t border-gray-700/50 pt-2.5 flex justify-between items-center text-3xs">
                <span className="text-gray-400 font-bold uppercase">Accept Orders</span>
                <button
                  type="button"
                  onClick={handleToggleAcceptingOrders}
                  className={`px-2 py-0.5 rounded font-extrabold uppercase transition ${
                    store.acceptingOrders ? 'bg-green-600 text-white' : 'bg-red-650 text-white'
                  }`}
                >
                  {store.acceptingOrders ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          )}

          <nav className="flex flex-col gap-2.5">
            <button
              onClick={() => setCurrentTab('orders')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                currentTab === 'orders' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <ListOrdered size={18} />
              <span>Order Desk</span>
            </button>

            <button
              onClick={() => setCurrentTab('analytics')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                currentTab === 'analytics' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <TrendingUp size={18} />
              <span>Business Overview</span>
            </button>

            <Link
              to="/shopkeeper/products"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <ShoppingBag size={18} />
              <span>Product Inventory</span>
            </Link>

            <Link
              to="/shopkeeper/config"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <Sliders size={18} />
              <span>Store Configuration</span>
            </Link>
          </nav>
        </div>

        <div className="p-6 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
          <div className="flex flex-col font-semibold">
            <span className="font-semibold text-white truncate max-w-32">{user.name}</span>
            <span className="text-3xs text-gray-500 capitalize">{user.role}</span>
          </div>
          <button
            onClick={() => { logout(); navigate('/shopkeeper/login'); }}
            className="text-gray-400 hover:text-red-400 p-2"
            title="Log Out Desk"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main panel workspace */}
      <main className="flex-grow p-8 overflow-y-auto max-h-screen">
        {/* Low Stock Alerts banner */}
        {analytics && analytics.lowStockAlerts && analytics.lowStockAlerts.length > 0 && (
          <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 mb-6 flex gap-3.5 items-start font-semibold">
            <AlertOctagon className="text-red-600 shrink-0 mt-0.5 animate-pulse" size={20} />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-red-700">Inventory Alert: Low Stock Warning</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-red-650 leading-relaxed font-semibold">
                {analytics.lowStockAlerts.map((item, idx) => (
                  <span key={idx}>⚠️ {item.name}: {item.stock === 0 ? <span className="font-extrabold underline text-red-800">OUT OF STOCK</span> : `Only ${item.stock} left`}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'orders' ? (
          /* Order Desk Tab */
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Order Desk</h1>
                <p className="text-gray-500 text-sm mt-0.5">Manage incoming client delivery requests.</p>
              </div>

              {/* Status controller pills */}
              {store && (
                <div className="bg-white border border-gray-200 p-1.5 rounded-xl flex gap-1.5 shadow-2xs items-center">
                  <span className="text-xs text-gray-400 font-bold px-2 uppercase tracking-wider">Set Store Mode:</span>
                  <button
                    onClick={() => handleStoreStatusChange('open')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      store.status === 'open' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-transparent text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleStoreStatusChange('busy')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      store.status === 'busy' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-transparent text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Busy (20m delivery)
                  </button>
                  <button
                    onClick={() => handleStoreStatusChange('closed')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      store.status === 'closed' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-transparent text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Closed
                  </button>
                </div>
              )}
            </div>

            {/* Filter pills: Active vs Past */}
            <div className="border-b border-gray-200 flex gap-6">
              <button
                onClick={() => setOrderFilter('active')}
                className={`py-3.5 border-b-2 font-bold text-sm tracking-tight transition ${
                  orderFilter === 'active' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Active Orders ({orders.filter(o => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.orderStatus)).length})
              </button>
              <button
                onClick={() => setOrderFilter('past')}
                className={`py-3.5 border-b-2 font-bold text-sm tracking-tight transition ${
                  orderFilter === 'past' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Past Deliveries ({orders.filter(o => ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.orderStatus)).length})
              </button>
            </div>

            {/* Order cards list */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-100 rounded-xl shadow-xs">
                <Volume2 className="text-gray-300 mx-auto mb-3" size={40} />
                <h3 className="font-bold text-gray-800">No Orders in this Queue</h3>
                <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">Incoming student orders will trigger a sound notification and flash here automatically.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredOrders.map((order) => {
                  const isPending = order.orderStatus === 'PENDING';
                  const isAccepted = order.orderStatus === 'ACCEPTED';
                  const isPreparing = order.orderStatus === 'PREPARING';
                  const isReady = order.orderStatus === 'READY';
                  const isShipped = order.orderStatus === 'OUT_FOR_DELIVERY';

                  return (
                    <div key={order._id} className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col justify-between">
                      {/* Header block */}
                      <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-sm text-gray-800">{order.orderNumber}</span>
                          <p className="text-3xs text-gray-400 font-semibold">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="bg-green-150 text-green-800 text-3xs font-extrabold px-1.5 py-0.5 rounded capitalize">
                            {order.college || 'Local Area'}
                          </span>
                          <span className={`text-3xs font-extrabold tracking-wider uppercase px-2 py-0.5 rounded border ${
                            isPending ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                      </div>

                      {/* Content details block */}
                      <div className="p-5 flex-grow space-y-4">
                        {/* Customer Info */}
                        <div className="text-xs space-y-0.5 border-b border-gray-50 pb-3 flex justify-between items-start font-semibold">
                          <div className="space-y-0.5 flex-grow">
                            <p className="font-bold text-gray-700">{order.customer?.name}</p>
                            <p className="text-gray-400 font-medium">Mobile: {order.customer?.mobile}</p>
                            <p className="text-gray-400 leading-relaxed">Address: {order.deliveryAddress}</p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleToggleBlockUser(order.customer?._id, false)}
                            className="text-3xs font-bold text-red-500 border border-red-200 hover:bg-red-50 px-2 py-1 rounded"
                            title="Block customer to prevent fake orders"
                          >
                            <Ban size={10} className="inline mr-1" />
                            <span>Block User</span>
                          </button>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 text-xs font-semibold">
                          <h4 className="font-bold text-gray-400 uppercase tracking-wide text-2xs">Basket items</h4>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-gray-600 font-medium">
                              <span>{item.name} <span className="font-bold text-gray-800">x{item.quantity}</span></span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Visual Path Route Map */}
                        <div className="space-y-1.5 border-t border-gray-50 pt-3">
                          <h4 className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide">Geo Route Navigator</h4>
                          <OrderMap order={order} />
                        </div>

                        {/* Rider Assignment Status & Dropdown */}
                        <div className="border-t border-gray-50 pt-3 mt-3 space-y-1.5 font-semibold text-xs">
                          <h4 className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide">Delivery Rider Assignment</h4>
                          {order.deliveryRider ? (
                            <div className="bg-green-50 text-green-800 border border-green-200 p-2.5 rounded-lg flex items-center justify-between text-2xs">
                              <span>🛵 Assigned: <strong>{order.deliveryRider.name || 'Rider'}</strong> ({order.deliveryRider.mobile || 'N/A'})</span>
                              <span className="text-3xs font-extrabold bg-green-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Ready</span>
                            </div>
                          ) : (
                            <div className="bg-amber-50 text-amber-800 border border-amber-250 p-2.5 rounded-lg flex flex-col gap-2">
                              <div className="flex justify-between items-center text-3xs font-extrabold text-amber-900 uppercase">
                                <span>⚠️ No Rider Assigned Yet</span>
                                <span className="text-red-500 animate-pulse">Needs Rider</span>
                              </div>
                              <div className="flex gap-2">
                                <select
                                  onChange={(e) => handleAssignRider(order._id, e.target.value)}
                                  defaultValue=""
                                  className="flex-grow border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-705 focus:outline-none"
                                >
                                  <option value="" disabled>-- Select Delivery Boy --</option>
                                  {riders.map(r => (
                                    <option key={r._id} value={r._id}>{r.name} ({r.mobile})</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Pricing details */}
                        <div className="border-t border-gray-50 pt-3 mt-3 flex justify-between items-center text-xs font-semibold">
                          <div className="flex flex-col text-xxs text-gray-400 leading-tight font-medium">
                            <span>Subtotal: ₹{order.subtotal}</span>
                            <span>Fee: ₹{order.deliveryFee}</span>
                          </div>
                          <div className="text-right font-semibold">
                            <span className="text-3xs font-extrabold text-gray-400 uppercase block">Payment: {order.paymentMethod} ({order.paymentStatus})</span>
                            <span className="text-base font-extrabold text-gray-800">Total: ₹{order.totalAmount}</span>
                          </div>
                        </div>

                        {order.cancellationReason && (
                          <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 text-3xs text-red-650 font-semibold leading-normal">
                            ❌ Cancellation reason: "{order.cancellationReason}"
                          </div>
                        )}
                      </div>

                      {/* Action buttons footer */}
                      <div className="bg-gray-50/50 px-5 py-3 border-t border-gray-100">
                        {isPending && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'REJECTED')}
                              className="flex-1 border border-red-200 bg-white hover:bg-red-50 text-red-700 py-1.5 rounded-lg text-xs font-bold transition"
                            >
                              Reject Order
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'ACCEPTED')}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg text-xs font-bold transition shadow-2xs"
                            >
                              Accept Order
                            </button>
                          </div>
                        )}

                        {isAccepted && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'CANCELLED')}
                              className="border border-red-200 bg-white text-red-650 hover:bg-red-50 px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'PREPARING')}
                              className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <span>Start Preparing</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}

                        {isPreparing && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'CANCELLED')}
                              className="border border-red-200 bg-white text-red-655 hover:bg-red-50 px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'READY')}
                              className="flex-grow bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <span>Mark Ready</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}

                        {isReady && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order._id, 'OUT_FOR_DELIVERY')}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                          >
                            <span>Ship / Dispatch Delivery</span>
                            <ArrowRight size={14} />
                          </button>
                        )}

                        {isShipped && (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-grow">
                                <Lock size={14} className="absolute left-2.5 top-2 text-gray-400" />
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder="Enter OTP"
                                  value={otpInputs[order._id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setOtpInputs(prev => ({ ...prev, [order._id]: val }));
                                  }}
                                  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-green-500 bg-white font-mono tracking-widest font-black"
                                />
                              </div>
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'DELIVERED')}
                                className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs"
                              >
                                Verify OTP
                              </button>
                            </div>
                            {otpErrors[order._id] && (
                              <p className="text-3xs text-red-650 font-semibold">{otpErrors[order._id]}</p>
                            )}
                            <p className="text-4xs text-gray-400 leading-normal font-semibold">
                              💡 Check the backend node terminal logs for simulated SMS OTP code (e.g. OTP: [5712]).
                            </p>
                          </div>
                        )}

                        {['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.orderStatus) && (
                          <div className="text-center text-xs font-bold text-gray-400 py-1 capitalize">
                            Completed status ({order.orderStatus.toLowerCase()})
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Analytics/Sales summary tab */
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">Sales Summary & Reports</h1>
              <p className="text-gray-500 text-sm mt-0.5">Performance statistics of campus deliveries.</p>
            </div>

            {analytics ? (
              <div className="space-y-8">
                {/* Stats cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Today's revenue */}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4 font-semibold text-gray-600">
                    <div className="bg-green-50 p-3 rounded-lg text-green-600">
                      <DollarSign size={22} />
                    </div>
                    <div>
                      <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Today's Sales</p>
                      <h3 className="text-xl font-black text-gray-800 mt-1">₹{analytics.todaySales}</h3>
                      <p className="text-4xs text-gray-400 font-semibold mt-0.5">{analytics.todayOrders} Orders today</p>
                    </div>
                  </div>

                  {/* Gross revenue */}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4 font-semibold text-gray-600">
                    <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
                      <TrendingUp size={22} />
                    </div>
                    <div>
                      <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Gross Sales</p>
                      <h3 className="text-xl font-black text-gray-800 mt-1">₹{analytics.totalSales}</h3>
                      <p className="text-4xs text-gray-400 font-semibold mt-0.5">Lifetime total</p>
                    </div>
                  </div>

                  {/* Completed orders */}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4 font-semibold text-gray-600">
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                      <PackageCheck size={22} />
                    </div>
                    <div>
                      <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Delivered Orders</p>
                      <h3 className="text-xl font-black text-gray-800 mt-1">{analytics.completedOrders}</h3>
                      <p className="text-4xs text-gray-400 font-semibold mt-0.5">Pending: {analytics.pendingOrders}</p>
                    </div>
                  </div>

                  {/* Cancellations counter */}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4 font-semibold text-gray-600">
                    <div className="bg-red-50 p-3 rounded-lg text-red-655">
                      <AlertTriangle size={22} />
                    </div>
                    <div>
                      <p className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Cancellations</p>
                      <h3 className="text-xl font-black text-red-655 mt-1">{analytics.cancelledOrders}</h3>
                      <p className="text-4xs text-gray-400 font-semibold mt-0.5">Cancellations / Rejections</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs font-semibold text-gray-650">
                  {/* College-wise Analytics */}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                      <Map size={16} className="text-green-600" />
                      <span>College-Wise Revenue Splits</span>
                    </h3>
                    <div className="space-y-4 pt-2">
                      {analytics.collegeSales && analytics.collegeSales.map((item, idx) => {
                        const maxRevenue = Math.max(...analytics.collegeSales.map(c => c.revenue)) || 1;
                        const widthPct = (item.revenue / maxRevenue) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xxs font-bold text-gray-600">
                              <span className="text-gray-800">{item.college}</span>
                              <span>₹{item.revenue} <span className="text-gray-400 font-medium">({item.orders} orders)</span></span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${widthPct}%` }}
                                className="bg-green-500 h-full rounded-full transition-all duration-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Selling Products */}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                      <ShoppingBag size={16} className="text-green-600" />
                      <span>Top 5 Selling Items</span>
                    </h3>
                    {analytics.topProducts && analytics.topProducts.length > 0 ? (
                      <div className="space-y-3.5 pt-2">
                        {analytics.topProducts.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xxs font-semibold">
                            <div className="flex gap-3 items-center">
                              <span className="bg-gray-100 text-gray-600 font-bold rounded-lg w-6 h-6 flex items-center justify-center text-3xs">
                                #{idx + 1}
                              </span>
                              <span className="text-gray-700 font-bold">{p.name}</span>
                            </div>
                            <span className="text-gray-400 font-extrabold">{p.quantity} units sold</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-12">No orders delivered yet.</p>
                    )}
                  </div>

                  {/* Payment Methods splits */}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                      <CheckCircle size={16} className="text-green-600" />
                      <span>Payment Method breakdown</span>
                    </h3>
                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between items-center text-xxs font-bold text-gray-600">
                        <span>💵 Cash on Delivery (COD)</span>
                        <span className="text-gray-800">₹{analytics.paymentMethodSales?.COD || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-xxs font-bold text-gray-600">
                        <span>💳 Online Payment (Simulated)</span>
                        <span className="text-gray-800">₹{analytics.paymentMethodSales?.ONLINE || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Reason analytics */}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                      <AlertTriangle size={16} className="text-red-500" />
                      <span>Cancellation Reasons Breakdown</span>
                    </h3>
                    {analytics.cancellationReasons && analytics.cancellationReasons.length > 0 ? (
                      <div className="space-y-3.5 pt-2">
                        {analytics.cancellationReasons.map((r, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xxs font-semibold">
                            <span className="text-gray-700 font-bold">"{r.reason}"</span>
                            <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-extrabold">{r.count} times</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-12">No cancellations logged.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-xs">
                <RefreshCw className="animate-spin text-green-600 mx-auto mb-4" size={24} />
                <p className="text-gray-400 text-sm">Loading summary parameters...</p>
              </div>
            )}
          </div>
        )}

        {/* Cancellation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xxs">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-150 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-sm">
                  {cancelStatus === 'REJECTED' ? 'Reject Order' : 'Cancel Order'}
                </h3>
                <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCancelSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">
                    Select Cancellation Reason
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg text-xs p-2 bg-white focus:outline-none focus:border-green-500 font-semibold"
                  >
                    <option value="Item unavailable">Item unavailable</option>
                    <option value="Customer unreachable">Customer unreachable</option>
                    <option value="Customer cancelled">Customer cancelled</option>
                    <option value="Store closed">Store closed</option>
                    <option value="Delivery issue">Delivery issue</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-55 py-2 rounded-lg text-xs font-bold transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={cancelLoading}
                    className="flex-grow bg-red-655 hover:bg-red-750 text-white py-2 rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    {cancelLoading ? 'Saving...' : 'Confirm Action'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ShopkeeperDashboard;
