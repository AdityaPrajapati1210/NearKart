import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Package, Clock, ShieldCheck, CheckCircle2, ChevronRight, RefreshCw, AlertTriangle, HelpCircle } from 'lucide-react';
import { orderService } from '../services/orderService';

// Live Tracking Map Component utilizing Leaflet.js
const OrderMap = ({ order }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
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

  // 1. Initial live location fetch & sync on order change
  useEffect(() => {
    let active = true;
    if (order.riderLocation) {
      setRiderCoords(order.riderLocation);
    }

    const fetchLive = async () => {
      const live = await orderService.getLiveLocation(order._id);
      if (active && live) {
        setRiderCoords(live);
      }
    };

    fetchLive();
    return () => {
      active = false;
    };
  }, [order._id, order.riderLocation]);

  // 2. Real-time Socket Listener for Rider Location
  useEffect(() => {
    if (!socket) return;
    socket.emit('join-order', order._id);

    const handleRiderLocationUpdate = (data) => {
      const targetOrderId = data.orderId ? String(data.orderId) : null;
      const thisOrderId = String(order._id);
      const targetRiderId = data.riderId ? String(data.riderId) : null;
      const thisRiderId = (order.deliveryRider?._id || order.deliveryRider?.id || order.rider?._id || order.rider)
        ? String(order.deliveryRider?._id || order.deliveryRider?.id || order.rider?._id || order.rider)
        : null;

      const isMatch = (targetOrderId && targetOrderId === thisOrderId) ||
                      (targetRiderId && thisRiderId && targetRiderId === thisRiderId) ||
                      (!targetOrderId && !targetRiderId);

      if (isMatch) {
        const lat = Number(data.lat ?? data.latitude ?? data.location?.latitude ?? data.coordinates?.[1]);
        const lng = Number(data.lng ?? data.longitude ?? data.location?.longitude ?? data.coordinates?.[0]);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          console.log('📍 [OrderMap] Live rider location received:', { lat, lng });
          setRiderCoords({ lat, lng });
        }
      }
    };

    socket.on('RIDER_LOCATION_UPDATED', handleRiderLocationUpdate);
    socket.on('rider-location', handleRiderLocationUpdate);
    socket.on('RIDER_LOCATION_BROADCAST', handleRiderLocationUpdate);

    return () => {
      socket.off('RIDER_LOCATION_UPDATED', handleRiderLocationUpdate);
      socket.off('rider-location', handleRiderLocationUpdate);
      socket.off('RIDER_LOCATION_BROADCAST', handleRiderLocationUpdate);
    };
  }, [socket, order._id, order.deliveryRider?._id, order.rider]);

  // 3. Fetch OSRM route from START (Store or Rider) to DESTINATION (Client)
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
  }, [order.orderStatus, storeLat, storeLng, clientLat, clientLng, riderCoords?.lat, riderCoords?.lng]);

  // 4. Render and smoothly update Leaflet Map
  useEffect(() => {
    if (!leafletReady || !order || !mapContainerRef.current) return;

    // A. Initialize map instance if not created
    if (!mapInstanceRef.current) {
      mapContainerRef.current._leaflet_id = null;
      mapContainerRef.current.innerHTML = '';

      const map = window.L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      mapInstanceRef.current = map;

      // Store Pin
      const storeIcon = window.L.divIcon({
        html: `<div class="bg-green-600 border border-white text-white rounded-full px-1.5 py-0.5 font-bold text-3xs shadow-sm whitespace-nowrap">🏪 SPG Canteen</div>`,
        className: '',
        iconSize: [85, 18],
      });
      window.L.marker([storeLat, storeLng], { icon: storeIcon }).addTo(map);

      // Client Pin
      const clientIcon = window.L.divIcon({
        html: `<div class="bg-blue-600 border border-white text-white rounded-full px-1.5 py-0.5 font-bold text-3xs shadow-sm whitespace-nowrap">📍 Client Spot</div>`,
        className: '',
        iconSize: [75, 18],
      });
      window.L.marker([clientLat, clientLng], { icon: clientIcon }).addTo(map);

      // Route Polyline
      const initialRoute = routePoints.length > 0 ? routePoints : [[storeLat, storeLng], [clientLat, clientLng]];
      routeLineRef.current = window.L.polyline(initialRoute, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.85,
      }).addTo(map);

      const allPoints = [
        [storeLat, storeLng],
        [clientLat, clientLng],
        ...(riderCoords ? [[riderCoords.lat, riderCoords.lng]] : [])
      ];
      map.fitBounds(window.L.latLngBounds(allPoints), { padding: [30, 30], maxZoom: 16 });

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }

    // B. Smoothly update Route Polyline
    if (routeLineRef.current && routePoints.length > 0) {
      routeLineRef.current.setLatLngs(routePoints);
    }

    // C. Smoothly update or add Rider Scooter Marker
    const shouldShowRider = riderCoords || order.orderStatus === 'OUT_FOR_DELIVERY';
    if (shouldShowRider && mapInstanceRef.current) {
      const activeRiderLat = riderCoords?.lat || storeLat;
      const activeRiderLng = riderCoords?.lng || storeLng;

      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([activeRiderLat, activeRiderLng]);
      } else {
        const riderIcon = window.L.divIcon({
          html: `<div class="w-8 h-8 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-sm shadow-md animate-bounce">🛵</div>`,
          className: '',
          iconSize: [32, 32],
        });
        riderMarkerRef.current = window.L.marker([activeRiderLat, activeRiderLng], { icon: riderIcon }).addTo(mapInstanceRef.current);
      }
    }
  }, [leafletReady, order, routePoints, riderCoords?.lat, riderCoords?.lng, storeLat, storeLng, clientLat, clientLng]);

  // Clean up map only when OrderMap unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
        mapInstanceRef.current = null;
        riderMarkerRef.current = null;
        routeLineRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-1.5">
      <div ref={mapContainerRef} className="w-full h-44 rounded-xl bg-gray-100 border border-gray-250 z-10" />
      <div className="flex justify-between items-center text-4xs text-gray-400 font-bold uppercase tracking-wider px-1">
        <span>Start: SPG Canteen</span>
        {order.orderStatus === 'OUT_FOR_DELIVERY' ? (
          <span className="text-red-500 animate-pulse font-extrabold">🛵 Live Rider Out For Delivery...</span>
        ) : riderCoords ? (
          <span className="text-amber-600 font-semibold">🛵 Live Rider Active</span>
        ) : null}
        <span>Destination: Client Room</span>
      </div>
    </div>
  );
};

const CustomerOrders = () => {
  const { token, user } = useContext(AuthContext);
  const socket = useContext(SocketContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tickerTime, setTickerTime] = useState(Date.now());

  // 1. Fetch Orders from Backend
  const fetchOrders = async () => {
    try {
      const orderList = await orderService.getCustomerOrders();
      setOrders(orderList);
    } catch (err) {
      setError(err.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token || user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [token, user]);

  // 2. Real-time Socket Listener
  useEffect(() => {
    if (!socket || !user) return;

    const handleStatusChange = (data) => {
      console.log('🔌 Socket Event: ORDER_STATUS_CHANGED', data);
      
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (String(order._id) === String(data.orderId)) {
            const updated = {
              ...order,
              orderStatus: data.status || data.orderStatus || order.orderStatus,
              paymentStatus: data.paymentStatus || order.paymentStatus,
            };
            if (data.riderLocation) {
              updated.riderLocation = data.riderLocation;
            }
            if (data.deliveryRider) {
              updated.deliveryRider = data.deliveryRider;
            }
            const incomingOtp = data.otp || data.plainOTP || data.developmentOTP;
            if (incomingOtp) {
              updated.otp = incomingOtp;
              updated.plainOTP = incomingOtp;
              updated.developmentOTP = incomingOtp;
            }
            return updated;
          }
          return order;
        })
      );

      // Play alert chime
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.play();
      } catch (err) {
        console.log('Audio autoplay blocked by browser sandbox');
      }
    };

    socket.on('ORDER_STATUS_CHANGED', handleStatusChange);

    return () => {
      socket.off('ORDER_STATUS_CHANGED', handleStatusChange);
    };
  }, [socket, user]);

  // 3. Real-time Countdown Timer update (re-renders every 1s)
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 4. Handle Cancel Order (Free cancellation when pending)
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await orderService.cancelCustomerOrder(orderId, 'Cancelled by customer');
      alert('Order successfully cancelled.');
      fetchOrders(); // Reload history
    } catch (err) {
      alert(err.message);
    }
  };

  // 5. Handle Reorder (Single-Click Buy Again)
  const handleReorder = (order) => {
    const cartItems = order.items.map(item => ({
      _id: item.product._id || item.product,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      store: order.store._id || order.store,
      image: item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100',
      stock: 100
    }));
    
    localStorage.setItem('nk_cart', JSON.stringify(cartItems));
    alert('Items loaded successfully! Redirecting to checkout.');
    window.location.href = '/cart';
  };

  // Helpers
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACCEPTED': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'PREPARING': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'READY': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OUT_FOR_DELIVERY': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-gray-150 text-gray-800 border-gray-255';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusStep = (status) => {
    const steps = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    return steps.indexOf(status);
  };

  const renderTimer = (order) => {
    if (order.orderStatus !== 'PENDING' || !order.expiresAt) return null;

    const expiresTime = new Date(order.expiresAt).getTime();
    const remainingMs = expiresTime - tickerTime;

    if (remainingMs <= 0) {
      return (
        <span className="text-red-500 font-semibold flex items-center gap-1 text-3xs">
          <Clock size={12} />
          <span>Expired (Cancelling...)</span>
        </span>
      );
    }

    const min = Math.floor(remainingMs / 60000);
    const sec = Math.floor((remainingMs % 60000) / 1000);

    return (
      <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1 text-3xs">
        <Clock size={12} className="animate-pulse" />
        <span>Auto-expires: {min}:{sec < 10 ? '0' : ''}{sec}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <RefreshCw className="animate-spin text-green-600 mx-auto mb-4" size={32} />
        <p className="text-gray-500">Retrieving your order logs...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
        <Package className="text-green-600 mx-auto mb-3" size={44} />
        <h2 className="text-xl font-bold text-gray-800">Track Your Orders</h2>
        <p className="text-gray-500 text-sm mt-1 mb-6">Please log in to your account to view and track your orders live.</p>
        <Link to="/login" className="inline-block w-full bg-green-600 text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-green-700 transition">
          Log In to Account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">My Order Tracker</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track orders live. Double chime alert sounds on status update.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-100 mb-6">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <Package className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="font-bold text-gray-800">No Orders Found</h3>
          <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">You have not placed any orders yet. Visit browse stores to start ordering.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const currentStep = getStatusStep(order.orderStatus);
            const isCompleted = ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.orderStatus);
            const isCancellable = order.orderStatus === 'PENDING';

            return (
              <div key={order._id} className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                {/* Header block */}
                <div className="bg-gray-50/60 px-5 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-gray-800 text-sm">{order.orderNumber}</span>
                      <span className="text-2xs text-gray-400 font-semibold">• {new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-500 flex items-center gap-1">
                      <span>Store:</span>
                      <span className="text-gray-700">{order.store?.name || 'SPG Canteen'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {renderTimer(order)}
                    <span className={`text-2xs font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Body block */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: Products list */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items Ordered</h4>
                    <div className="space-y-2.5 border-b border-gray-50 pb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm font-semibold text-gray-600">
                          <div className="flex gap-2">
                            <span className="text-gray-550">x{item.quantity}</span>
                            <span className="text-gray-800">{item.name}</span>
                          </div>
                          <span className="text-gray-500">₹{item.price * item.quantity} <span className="text-3xs text-gray-400">(₹{item.price}/ea)</span></span>
                        </div>
                      ))}
                    </div>

                    {/* Routing Tracking Map */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Route Map</h4>
                      <OrderMap order={order} />
                    </div>

                    <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-end">
                      <div className="text-xxs text-gray-400 leading-normal font-semibold">
                        <p><span className="font-bold">Subtotal:</span> ₹{order.subtotal}</p>
                        <p><span className="font-bold">Delivery Charge:</span> ₹{order.deliveryFee}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-400 uppercase">Paid: {order.paymentMethod} ({order.paymentStatus})</span>
                        <p className="text-lg font-black text-green-600">Total: ₹{order.totalAmount}</p>
                      </div>
                    </div>

                    {/* Address details */}
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-3xs text-gray-500 mt-2.5 font-semibold">
                      <span className="font-bold block text-gray-700">Delivery Address:</span>
                      <p className="mt-0.5">{order.deliveryAddress}</p>
                    </div>
                  </div>

                  {/* Right: OTP, Tracking & Actions */}
                  <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-6 flex flex-col justify-between">
                    <div>
                      {/* OTP Display if out for delivery */}
                      {order.orderStatus === 'OUT_FOR_DELIVERY' && (order.otp || order.plainOTP || order.developmentOTP) ? (
                        <div className="bg-green-50 text-green-800 border-2 border-green-300 rounded-xl p-4 text-center shadow-xs mb-4 animate-in fade-in">
                          <ShieldCheck size={24} className="mx-auto mb-1 text-green-600 animate-bounce" />
                          <span className="text-3xs font-extrabold uppercase tracking-wider text-green-700 block">Delivery OTP Passcode</span>
                          <span className="text-3xl font-black tracking-widest text-green-600 block mt-1 select-all font-mono">
                            {order.otp || order.plainOTP || order.developmentOTP}
                          </span>
                          <p className="text-4xs text-green-700 mt-1.5 leading-normal font-semibold">Share this secret OTP with the delivery rider at your doorstep for order handover.</p>
                        </div>
                      ) : order.orderStatus === 'OUT_FOR_DELIVERY' ? (
                        <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-3 text-center shadow-xs mb-4">
                          <span className="text-3xs font-bold uppercase tracking-wider text-amber-700 block">Delivery Passcode</span>
                          <span className="text-xs font-bold text-amber-600 block mt-1 animate-pulse">Generating OTP...</span>
                          <p className="text-4xs text-amber-600 mt-1">Please refresh if code doesn't show in a moment.</p>
                        </div>
                      ) : null}

                      {/* Expiry / Cancelled prompt */}
                      {(order.orderStatus === 'CANCELLED' || order.orderStatus === 'REJECTED') && (
                        <div className="bg-red-50 text-red-800 border border-red-100 rounded-xl p-3 text-center text-xs mb-4">
                          <AlertTriangle size={18} className="mx-auto mb-1 text-red-500" />
                          <p className="font-bold">{order.orderStatus === 'REJECTED' ? 'Order Rejected' : 'Order Cancelled'}</p>
                          <p className="text-3xs text-red-650 mt-1 leading-relaxed">
                            {order.cancellationReason ? `Reason: "${order.cancellationReason}"` : 'Auto-cancelled due to response timeout.'}
                          </p>
                        </div>
                      )}

                      {/* Tracker Steps */}
                      {!isCompleted && currentStep !== -1 && (
                        <div className="space-y-3.5">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Steps</h4>
                          <div className="relative pl-5 border-l border-green-100 space-y-4 text-xs">
                            <div className={`relative ${currentStep >= 0 ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                              <span className={`absolute -left-6.5 top-0.5 rounded-full w-3.5 h-3.5 flex items-center justify-center text-2xs ${currentStep >= 0 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                ✓
                              </span>
                              <span>Order Placed</span>
                            </div>
                            <div className={`relative ${currentStep >= 1 ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                              <span className={`absolute -left-6.5 top-0.5 rounded-full w-3.5 h-3.5 flex items-center justify-center text-2xs ${currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                                {currentStep >= 1 ? '✓' : '2'}
                              </span>
                              <span>Accepted by Store</span>
                            </div>
                            <div className={`relative ${currentStep >= 2 ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                              <span className={`absolute -left-6.5 top-0.5 rounded-full w-3.5 h-3.5 flex items-center justify-center text-2xs ${currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                                {currentStep >= 2 ? '✓' : '3'}
                              </span>
                              <span>Preparing snacks</span>
                            </div>
                            <div className={`relative ${currentStep >= 4 ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                              <span className={`absolute -left-6.5 top-0.5 rounded-full w-3.5 h-3.5 flex items-center justify-center text-2xs ${currentStep >= 4 ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                                {currentStep >= 4 ? '✓' : '4'}
                              </span>
                              <span>Out for Delivery</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {order.orderStatus === 'DELIVERED' && (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <CheckCircle2 size={32} className="text-green-600 mb-1.5" />
                          <h5 className="font-bold text-gray-800 text-sm">Order Completed</h5>
                          <p className="text-3xs text-gray-400 max-w-xs mt-0.5">Delivered on: {order.deliveredAt ? new Date(order.deliveredAt).toLocaleTimeString() : 'N/A'}</p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons footer on the card */}
                    <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                      {isCancellable && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="w-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 py-1.5 rounded-lg text-xs font-bold transition"
                        >
                          Cancel Order
                        </button>
                      )}

                      {!isCancellable && !isCompleted && (
                        <div className="text-4xs text-gray-400 bg-gray-50 border border-gray-100 p-2 rounded flex gap-1 items-start leading-normal font-semibold">
                          <HelpCircle size={12} className="shrink-0 mt-0.5 text-gray-400" />
                          <span>Cancellation is disabled because the shop has accepted your order. Please contact the store.</span>
                        </div>
                      )}

                      {isCompleted && (
                        <button
                          onClick={() => handleReorder(order)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg text-xs font-bold transition shadow-3xs flex items-center justify-center gap-1"
                        >
                          <span>Reorder (Buy Again)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
