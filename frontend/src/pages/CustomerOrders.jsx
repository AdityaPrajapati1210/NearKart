import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Package, Clock, ShieldCheck, CheckCircle2, RefreshCw, AlertTriangle, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';
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
        html: `<div class="bg-emerald-600 border border-white text-white rounded-full px-2 py-0.5 font-bold text-3xs shadow-sm whitespace-nowrap">🏪 Campus Store</div>`,
        className: '',
        iconSize: [90, 20],
      });
      window.L.marker([storeLat, storeLng], { icon: storeIcon }).addTo(map);

      // Client Pin
      const clientIcon = window.L.divIcon({
        html: `<div class="bg-blue-600 border border-white text-white rounded-full px-2 py-0.5 font-bold text-3xs shadow-sm whitespace-nowrap">📍 Delivery Spot</div>`,
        className: '',
        iconSize: [85, 20],
      });
      window.L.marker([clientLat, clientLng], { icon: clientIcon }).addTo(map);

      // Route Polyline
      const initialRoute = routePoints.length > 0 ? routePoints : [[storeLat, storeLng], [clientLat, clientLng]];
      routeLineRef.current = window.L.polyline(initialRoute, {
        color: '#059669',
        weight: 3.5,
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

    if (routeLineRef.current && routePoints.length > 0) {
      routeLineRef.current.setLatLngs(routePoints);
    }

    const shouldShowRider = riderCoords || order.orderStatus === 'OUT_FOR_DELIVERY';
    if (shouldShowRider && mapInstanceRef.current) {
      const activeRiderLat = riderCoords?.lat || storeLat;
      const activeRiderLng = riderCoords?.lng || storeLng;

      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([activeRiderLat, activeRiderLng]);
      } else {
        const riderIcon = window.L.divIcon({
          html: `<div class="w-8 h-8 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center text-sm shadow-md animate-bounce">🛵</div>`,
          className: '',
          iconSize: [32, 32],
        });
        riderMarkerRef.current = window.L.marker([activeRiderLat, activeRiderLng], { icon: riderIcon }).addTo(mapInstanceRef.current);
      }
    }
  }, [leafletReady, order, routePoints, riderCoords?.lat, riderCoords?.lng, storeLat, storeLng, clientLat, clientLng]);

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
      <div ref={mapContainerRef} className="w-full h-44 rounded-xl bg-slate-100 border border-slate-200 z-10" />
      <div className="flex justify-between items-center text-3xs text-slate-400 font-bold uppercase tracking-wider px-1">
        <span>Canteen Dispatch</span>
        {order.orderStatus === 'OUT_FOR_DELIVERY' ? (
          <span className="text-rose-600 animate-pulse font-extrabold">🛵 Live Rider on the way...</span>
        ) : riderCoords ? (
          <span className="text-amber-600 font-semibold">🛵 Live Rider Active</span>
        ) : null}
        <span>Hostel Room</span>
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
        console.log('Audio autoplay blocked by browser');
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

  // 4. Handle Cancel Order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await orderService.cancelCustomerOrder(orderId, 'Cancelled by customer');
      alert('Order successfully cancelled.');
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  // 5. Handle Reorder
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
    alert('Items added to cart! Redirecting to checkout.');
    window.location.href = '/cart';
  };

  // Helpers
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ACCEPTED': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'PREPARING': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'READY': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'OUT_FOR_DELIVERY': return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'DELIVERED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
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
        <span className="text-rose-600 font-semibold flex items-center gap-1 text-2xs">
          <Clock size={12} />
          <span>Expired</span>
        </span>
      );
    }

    const min = Math.floor(remainingMs / 60000);
    const sec = Math.floor((remainingMs % 60000) / 1000);

    return (
      <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 text-2xs">
        <Clock size={11} className="animate-pulse" />
        <span>Auto-expires: {min}:{sec < 10 ? '0' : ''}{sec}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-3" size={28} />
        <p className="text-xs text-slate-500 font-medium">Retrieving active orders...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <Package size={28} />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800">Track Your Orders</h2>
        <p className="text-slate-400 text-xs mt-1 mb-6 leading-relaxed">
          Please log in to your account to view live tracking and order passcodes.
        </p>
        <Link
          to="/login"
          className="inline-block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs shadow-emerald-600/20"
        >
          Sign In to Account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Order History & Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time status updates and live delivery tracking.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl border border-rose-200 mb-6 text-xs">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package size={24} />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm">No Orders Yet</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
            You haven't placed any orders yet. Visit the campus store directory to start ordering.
          </p>
          <Link
            to="/"
            className="inline-block mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs shadow-emerald-600/20"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const currentStep = getStatusStep(order.orderStatus);
            const isCompleted = ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.orderStatus);
            const isCancellable = order.orderStatus === 'PENDING';

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden transition"
              >
                {/* Header block */}
                <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200/60 flex flex-wrap justify-between items-center gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{order.orderNumber}</span>
                      <span className="text-2xs text-slate-400 font-medium">• {new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-2xs font-semibold text-slate-500">
                      Store: <span className="text-slate-700 font-bold">{order.store?.name || 'Campus Canteen'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {renderTimer(order)}
                    <span className={`text-2xs font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Body block */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: Products list & Routing Map */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h4 className="text-2xs font-bold text-slate-400 uppercase tracking-wider mb-2">Items Ordered</h4>
                      <div className="space-y-2 border-b border-slate-100 pb-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-700">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-3xs">
                                {item.quantity}x
                              </span>
                              <span className="font-medium text-slate-800">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-800">
                              ₹{item.price * item.quantity}{' '}
                              <span className="text-3xs text-slate-400 font-normal">(₹{item.price}/ea)</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Routing Tracking Map */}
                    <div className="space-y-2">
                      <h4 className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Live Route Map</h4>
                      <OrderMap order={order} />
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-end">
                      <div className="text-2xs text-slate-400 leading-normal font-medium">
                        <p><span className="font-semibold text-slate-600">Subtotal:</span> ₹{order.subtotal}</p>
                        <p><span className="font-semibold text-slate-600">Delivery:</span> ₹{order.deliveryFee}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">
                          Mode: {order.paymentMethod} ({order.paymentStatus})
                        </span>
                        <p className="text-base font-extrabold text-emerald-700">Total: ₹{order.totalAmount}</p>
                      </div>
                    </div>

                    {/* Address details */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-2xs text-slate-600">
                      <span className="font-bold text-slate-700 block mb-0.5">Delivery Address:</span>
                      <p className="text-slate-500">{order.deliveryAddress}</p>
                    </div>
                  </div>

                  {/* Right: OTP, Tracking & Actions */}
                  <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-5 flex flex-col justify-between">
                    <div>
                      {/* OTP Display if out for delivery */}
                      {order.orderStatus === 'OUT_FOR_DELIVERY' && (order.otp || order.plainOTP || order.developmentOTP) ? (
                        <div className="bg-emerald-50/70 text-emerald-900 border-2 border-emerald-400/60 rounded-2xl p-4 text-center shadow-xs mb-4">
                          <ShieldCheck size={22} className="mx-auto mb-1 text-emerald-600" />
                          <span className="text-3xs font-extrabold uppercase tracking-wider text-emerald-700 block">
                            Handover Delivery OTP
                          </span>
                          <span className="text-2xl sm:text-3xl font-black tracking-widest text-emerald-700 block mt-1 select-all font-mono">
                            {order.otp || order.plainOTP || order.developmentOTP}
                          </span>
                          <p className="text-3xs text-emerald-700 mt-1 leading-normal font-medium">
                            Share this passcode with the delivery rider to receive your order.
                          </p>
                        </div>
                      ) : order.orderStatus === 'OUT_FOR_DELIVERY' ? (
                        <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-3 text-center mb-4">
                          <span className="text-3xs font-bold uppercase tracking-wider text-amber-700 block">Delivery Passcode</span>
                          <span className="text-xs font-bold text-amber-600 block mt-1 animate-pulse">Generating OTP...</span>
                          <p className="text-3xs text-amber-600 mt-1">Please refresh if code doesn't show in a moment.</p>
                        </div>
                      ) : null}

                      {/* Expiry / Cancelled prompt */}
                      {(order.orderStatus === 'CANCELLED' || order.orderStatus === 'REJECTED') && (
                        <div className="bg-rose-50 text-rose-800 border border-rose-200 rounded-xl p-3 text-center text-xs mb-4">
                          <AlertTriangle size={16} className="mx-auto mb-1 text-rose-500" />
                          <p className="font-bold">{order.orderStatus === 'REJECTED' ? 'Order Rejected' : 'Order Cancelled'}</p>
                          <p className="text-3xs text-rose-600 mt-1 leading-relaxed">
                            {order.cancellationReason ? `Reason: "${order.cancellationReason}"` : 'Auto-cancelled due to response timeout.'}
                          </p>
                        </div>
                      )}

                      {/* Tracker Steps */}
                      {!isCompleted && currentStep !== -1 && (
                        <div className="space-y-3">
                          <h4 className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Live Status</h4>
                          <div className="relative pl-5 border-l-2 border-emerald-200 space-y-3.5 text-xs">
                            <div className={`relative ${currentStep >= 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                              <span className={`absolute -left-[27px] top-0.5 rounded-full w-4 h-4 flex items-center justify-center text-3xs ${currentStep >= 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                ✓
                              </span>
                              <span>Order Placed</span>
                            </div>
                            <div className={`relative ${currentStep >= 1 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                              <span className={`absolute -left-[27px] top-0.5 rounded-full w-4 h-4 flex items-center justify-center text-3xs ${currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {currentStep >= 1 ? '✓' : '2'}
                              </span>
                              <span>Store Accepted</span>
                            </div>
                            <div className={`relative ${currentStep >= 2 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                              <span className={`absolute -left-[27px] top-0.5 rounded-full w-4 h-4 flex items-center justify-center text-3xs ${currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {currentStep >= 2 ? '✓' : '3'}
                              </span>
                              <span>Packing Items</span>
                            </div>
                            <div className={`relative ${currentStep >= 4 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                              <span className={`absolute -left-[27px] top-0.5 rounded-full w-4 h-4 flex items-center justify-center text-3xs ${currentStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {currentStep >= 4 ? '✓' : '4'}
                              </span>
                              <span>Out for Delivery</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {order.orderStatus === 'DELIVERED' && (
                        <div className="flex flex-col items-center justify-center py-5 text-center">
                          <CheckCircle2 size={30} className="text-emerald-600 mb-1" />
                          <h5 className="font-bold text-slate-800 text-xs">Order Delivered</h5>
                          <p className="text-3xs text-slate-400 mt-0.5">
                            Delivered at: {order.deliveredAt ? new Date(order.deliveredAt).toLocaleTimeString() : 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      {isCancellable && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="w-full border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 py-2 rounded-xl text-xs font-bold transition"
                        >
                          Cancel Order
                        </button>
                      )}

                      {!isCancellable && !isCompleted && (
                        <div className="text-3xs text-slate-400 bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl flex gap-1.5 items-start leading-relaxed">
                          <HelpCircle size={13} className="shrink-0 mt-0.5 text-slate-400" />
                          <span>Cancellation is closed as the store has dispatched or prepared the order.</span>
                        </div>
                      )}

                      {isCompleted && (
                        <button
                          onClick={() => handleReorder(order)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold transition shadow-xs shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw size={13} />
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
