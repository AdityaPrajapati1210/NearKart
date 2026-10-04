import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { riderService } from '../services/riderService';
import {
  MapPin,
  Phone,
  User as UserIcon,
  Package,
  CheckCircle,
  AlertTriangle,
  Compass,
  Navigation,
  LogOut,
  Clock,
  ShieldCheck
} from 'lucide-react';

// Sub-component rendering each active order in its own isolated context
const ActiveOrderCard = ({ order, token, onComplete, riderCoords }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const clientMarkerRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [leafletReady, setLeafletReady] = useState(!!window.L);

  // OTP inputs
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Extract accurate coordinates from order with campus defaults
  const storeLat = order.shopLocation?.coordinates?.[1] ?? order.store?.location?.lat ?? 28.4483;
  const storeLng = order.shopLocation?.coordinates?.[0] ?? order.store?.location?.lng ?? 76.7628;
  const clientLat = order.customerLocation?.coordinates?.[1] ?? order.deliveryLocation?.lat ?? 28.4500;
  const clientLng = order.customerLocation?.coordinates?.[0] ?? order.deliveryLocation?.lng ?? 76.7670;

  // Active rider position: uses live GPS or defaults to Store location if GPS is acquiring
  const currentRiderPos = (riderCoords && Number.isFinite(riderCoords.lat) && Number.isFinite(riderCoords.lng))
    ? riderCoords
    : { lat: storeLat, lng: storeLng };

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

  // 1. Fetch OSRM Road Path route from Rider (if out for delivery) or Store to Client Spot
  useEffect(() => {
    let active = true;

    const fetchOSRMRoute = async () => {
      try {
        const startLat = order.orderStatus === 'OUT_FOR_DELIVERY' ? currentRiderPos.lat : storeLat;
        const startLng = order.orderStatus === 'OUT_FOR_DELIVERY' ? currentRiderPos.lng : storeLng;

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
        console.warn('Rider routing error, falling back to straight path:', err);
      }
      if (active) {
        // Fallback: straight path line
        const fallbackStart = order.orderStatus === 'OUT_FOR_DELIVERY' ? [currentRiderPos.lat, currentRiderPos.lng] : [storeLat, storeLng];
        setRoutePoints([fallbackStart, [clientLat, clientLng]]);
      }
    };

    fetchOSRMRoute();
    const intervalId = setInterval(fetchOSRMRoute, 30000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [order.orderStatus, storeLat, storeLng, clientLat, clientLng, currentRiderPos.lat, currentRiderPos.lng]);

  // 2. Draw & Update Leaflet Map for this active order card
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current) return;

    // A. Initialize Map if not present
    if (!mapInstanceRef.current) {
      if (mapContainerRef.current._leaflet_id) {
        mapContainerRef.current._leaflet_id = null;
        mapContainerRef.current.innerHTML = '';
      }

      const map = window.L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      });
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      mapInstanceRef.current = map;

      // Store Pin
      const storeIcon = window.L.divIcon({
        html: `<div class="bg-green-600 border border-white text-white rounded-full px-1.5 py-0.5 font-bold text-3xs shadow-sm whitespace-nowrap">🏪 Store</div>`,
        className: '',
        iconSize: [65, 18],
      });
      storeMarkerRef.current = window.L.marker([storeLat, storeLng], { icon: storeIcon }).addTo(map);

      // Client Pin
      const clientIcon = window.L.divIcon({
        html: `<div class="bg-blue-600 border border-white text-white rounded-full px-1.5 py-0.5 font-bold text-3xs shadow-sm whitespace-nowrap">📍 Client Spot</div>`,
        className: '',
        iconSize: [75, 18],
      });
      clientMarkerRef.current = window.L.marker([clientLat, clientLng], { icon: clientIcon }).addTo(map);

      // Rider Pin
      const riderIcon = window.L.divIcon({
        html: `<div class="w-8 h-8 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-sm shadow-md animate-bounce">🛵</div>`,
        className: '',
        iconSize: [32, 32],
      });
      riderMarkerRef.current = window.L.marker([currentRiderPos.lat, currentRiderPos.lng], { icon: riderIcon }).addTo(map);

      // Route Polyline
      routeLineRef.current = window.L.polyline(routePoints.length > 0 ? routePoints : [[storeLat, storeLng], [clientLat, clientLng]], {
        color: '#dc2626',
        weight: 4,
        opacity: 0.85
      }).addTo(map);

      // Fit bounds nicely with maxZoom so it doesn't overzoom
      const bounds = window.L.latLngBounds([
        [currentRiderPos.lat, currentRiderPos.lng],
        [storeLat, storeLng],
        [clientLat, clientLng]
      ]);
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    } else {
      // B. Smoothly update existing markers without tearing down the map
      if (storeMarkerRef.current) {
        storeMarkerRef.current.setLatLng([storeLat, storeLng]);
      }
      if (clientMarkerRef.current) {
        clientMarkerRef.current.setLatLng([clientLat, clientLng]);
      }
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([currentRiderPos.lat, currentRiderPos.lng]);
      }
      if (routeLineRef.current && routePoints.length > 0) {
        routeLineRef.current.setLatLngs(routePoints);
      }
    }
  }, [leafletReady, storeLat, storeLng, clientLat, clientLng, currentRiderPos.lat, currentRiderPos.lng, routePoints]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore cleanup error
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleUpdateStatus = async (status) => {
    try {
      await riderService.updateOrderStatus(order._id, status);
      onComplete();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.length < 4 || otpInput.length > 6) {
      setOtpError('Please enter a valid 4 to 6-digit passcode.');
      return;
    }

    setVerifying(true);
    setOtpError('');
    try {
      await riderService.verifyOtp(order._id, otpInput);
      setOtpSuccess(true);
      setTimeout(() => {
        setOtpInput('');
        setOtpSuccess(false);
        onComplete();
      }, 2000);
    } catch (err) {
      setOtpError(err.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
      {/* Left Column: Map and details */}
      <div className="flex-grow p-5 space-y-4 md:w-2/3">
        <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-gray-100">
          <div>
            <span className="text-3xs font-extrabold text-red-600 uppercase tracking-widest block">Active Order</span>
            <h4 className="font-extrabold text-gray-800 text-sm">{order.orderNumber}</h4>
          </div>
          <span className="text-3xs font-extrabold bg-red-600 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
            {order.orderStatus.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Contact details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1 text-3xs font-semibold">
            <span className="font-bold text-gray-400 block tracking-wider">Canteen Pickup Spot</span>
            <p className="text-2xs font-extrabold text-gray-800">{order.store?.name}</p>
            <p className="text-gray-500 leading-normal line-clamp-2">{order.store?.address}</p>
            {order.store?.phone && (
              <a href={`tel:${order.store.phone}`} className="flex items-center gap-0.5 text-green-600 hover:underline font-bold mt-1">
                <Phone size={10} /> Call Canteen: {order.store.phone}
              </a>
            )}
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1 text-3xs font-semibold">
            <span className="font-bold text-gray-400 block tracking-wider">Client Destination Spot</span>
            <p className="text-2xs font-extrabold text-gray-850">{order.customer?.name}</p>
            <p className="text-gray-550 leading-normal">
              College: {order.college} | Room: {order.roomNo || 'N/A'} {order.hostel ? `(${order.hostel})` : ''}
            </p>
            {order.customer?.mobile && (
              <a href={`tel:${order.customer.mobile}`} className="flex items-center gap-0.5 text-blue-600 hover:underline font-bold mt-1">
                <Phone size={10} /> Call Client: {order.customer.mobile}
              </a>
            )}
          </div>
        </div>

        {/* Location Routing Map */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-4xs font-bold text-gray-400">
            <span>Rider Live Navigator Map</span>
            <span className="flex items-center gap-1 font-semibold">
              <Clock size={10} className="animate-spin text-red-500" />
              <span>OSRM street path updates dynamically (30s)</span>
            </span>
          </div>
          <div ref={mapContainerRef} className="w-full h-48 bg-gray-100 rounded-lg border border-gray-250 z-10" />
        </div>

        {/* Items pick list */}
        <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100 space-y-1.5">
          <h5 className="text-3xs font-extrabold uppercase text-gray-400 tracking-wider">Items Check-list</h5>
          <div className="space-y-1 font-semibold text-3xs text-gray-650">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span>{item.name} <strong className="text-gray-800">x{item.quantity}</strong></span>
                <span className="text-gray-800 font-extrabold">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: OTP validation and progression actions */}
      <div className="p-5 md:w-1/3 flex flex-col justify-center space-y-4 bg-gray-50/20">
        <h5 className="text-3xs font-extrabold uppercase text-gray-400 tracking-wider text-center">Job Actions Control</h5>
        
        {order.orderStatus === 'PREPARING' || order.orderStatus === 'READY' ? (
          <button
            onClick={() => handleUpdateStatus('OUT_FOR_DELIVERY')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-2xs transition shadow-sm flex items-center justify-center gap-1"
          >
            <Navigation size={12} className="animate-pulse" />
            <span>Start Out for Delivery</span>
          </button>
        ) : null}

        {order.orderStatus === 'OUT_FOR_DELIVERY' ? (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <div className="bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-250 text-4xs font-bold uppercase tracking-wider block text-center animate-pulse">
              🛵 Out for delivery active
            </div>

            <div className="space-y-1 text-center font-semibold">
              <label className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide block">Customer Handover OTP</label>
              <input
                type="text"
                maxLength="6"
                placeholder="Enter customer OTP"
                value={otpInput}
                onChange={(e) => {
                  setOtpInput(e.target.value.replace(/\D/g, ''));
                  setOtpError('');
                }}
                disabled={verifying || otpSuccess}
                className="w-full text-center border border-gray-200 rounded-xl py-2.5 px-3 text-lg font-black tracking-widest focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
              />
            </div>

            {otpError && (
              <p className="text-3xs text-red-650 font-bold text-center bg-red-50 p-1.5 rounded border border-red-100">
                {otpError}
              </p>
            )}

            {otpSuccess && (
              <div className="flex flex-col items-center justify-center py-1 text-green-600 animate-pulse font-bold text-3xs">
                <CheckCircle size={16} className="mb-0.5" />
                <span>OTP Verified! Completing Handover...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying || otpSuccess}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-2xs transition shadow-sm flex items-center justify-center gap-1"
            >
              <ShieldCheck size={12} />
              <span>Verify & Complete Job</span>
            </button>
          </form>
        ) : null}

        {order.orderStatus !== 'OUT_FOR_DELIVERY' && (
          <p className="text-4xs text-gray-400 leading-normal text-center font-semibold">
            Once you pick up the packets from the canteen, click "Start Out for Delivery" to activate the customer live tracking map.
          </p>
        )}
      </div>
    </div>
  );
};

const DeliveryDashboard = () => {
  const { token, user, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // GPS Tracking States
  const [riderCoords, setRiderCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('initializing');
  const [gpsError, setGpsError] = useState('');

  // 1. Route Security: Redirect if user is not a delivery rider
  useEffect(() => {
    if (!loading && (!user || user.role !== 'delivery')) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // 2. Continuous GPS Tracking (Mandatory when assigned/active)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsStatus('error');
      return;
    }

    setGpsStatus('searching');

    // Immediate one-off position request for quick UI feedback
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setRiderCoords(coords);
        setGpsStatus('active');
        setGpsError('');
      },
      (err) => {
        // Fail quietly on initial ping, watchPosition handles continuous listening
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setRiderCoords(coords);
        setGpsStatus('active');
        setGpsError('');
      },
      (err) => {
        let msg = 'Access Denied. GPS coordinates are mandatory.';
        if (err.code === 1) {
          msg = 'GPS blocked. Click padlock in browser address bar and enable Location.';
        } else if (err.code === 2) {
          msg = 'GPS signal unavailable. Please ensure location services are active.';
        } else if (err.code === 3) {
          msg = 'GPS lookup timed out.';
        }
        setGpsError(msg);
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // 3. Fetch Available and Active Orders
  const fetchData = async () => {
    if (!token) return;
    try {
      // A. Fetch Active Orders assigned to this rider
      const assigned = await riderService.getRiderOrders();
      const active = (assigned || []).filter(o => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.orderStatus));
      setActiveOrders(active);

      // B. Fetch Available Jobs queue
      const avail = await riderService.getAvailableOrders();
      setAvailableOrders(avail || []);

      // C. Pre-load rider profile's saved location if riderCoords is null
      try {
        const profile = await riderService.getProfile();
        if (profile?.currentLocation?.coordinates) {
          const [lng, lat] = profile.currentLocation.coordinates;
          if (lat && lng && (lat !== 0 || lng !== 0)) {
            setRiderCoords((prev) => prev || { lat, lng });
            setGpsStatus((prev) => (prev === 'initializing' || prev === 'searching' ? 'active' : prev));
          }
        }
      } catch (profErr) {
        // ignore profile error
      }
    } catch (err) {
      console.error('Error fetching delivery jobs:', err);
      setError('Connection failure loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token || user) {
      fetchData();
    }
  }, [token, user]);

  // 4. Real-time Sockets Join Room & Status Change Listener
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('JOIN_USER_ROOM', `user_${user._id}`);

    const handleStatusUpdate = () => {
      fetchData(); // reload orders list instantly
    };

    socket.on('ORDER_STATUS_CHANGED', handleStatusUpdate);
    socket.on('NEW_ORDER', handleStatusUpdate);

    return () => {
      socket.off('ORDER_STATUS_CHANGED', handleStatusUpdate);
      socket.off('NEW_ORDER', handleStatusUpdate);
    };
  }, [socket, user]);

  // 5. Sync location coordinates to server for all active orders
  useEffect(() => {
    if (activeOrders.length === 0 || !riderCoords) return;

    const syncLocation = async () => {
      try {
        await riderService.updateLocation({ latitude: riderCoords.lat, longitude: riderCoords.lng });
      } catch (err) {
        console.error('Failed to sync coordinates for rider:', err);
      }
    };

    syncLocation();
    const intervalId = setInterval(syncLocation, 30000);

    return () => clearInterval(intervalId);
  }, [activeOrders.length, riderCoords]);

  // 6. Claim a Delivery Job
  const handleAcceptJob = async (orderId) => {
    if (!riderCoords) {
      alert('GPS is required. Please enable location permissions before claiming jobs.');
      return;
    }
    try {
      await riderService.acceptOrder(orderId);
      alert('Delivery job claimed successfully!');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Compass className="animate-spin text-green-600 mx-auto mb-4" size={40} />
        <p className="text-gray-500 font-semibold text-sm">Loading rider console dashboard...</p>
      </div>
    );
  }

  const isGpsActive = gpsStatus === 'active' && riderCoords;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gray-850 text-white rounded-2xl p-5 shadow-md flex justify-between items-center gap-4 flex-wrap bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700">
        <div className="space-y-1">
          <span className="text-3xs font-extrabold tracking-wider bg-green-600 text-white px-2 py-0.5 rounded-full uppercase">
            Rider Console Mode
          </span>
          <h1 className="text-xl font-black">{user?.name || 'Delivery Partner'}</h1>
          <div className="flex items-center gap-1.5 text-2xs text-gray-300 font-semibold">
            <span className={`w-2.5 h-2.5 rounded-full ${isGpsActive ? 'bg-green-500 animate-ping' : 'bg-red-500'}`} />
            <span>GPS Tracking: {isGpsActive ? `ACTIVE (Lat: ${riderCoords.lat.toFixed(5)}, Lng: ${riderCoords.lng.toFixed(5)})` : 'OFFLINE'}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 border border-gray-600 bg-gray-850 hover:bg-gray-800 text-gray-200 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>

      {/* 2. GPS Warning */}
      {!isGpsActive && (
        <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="shrink-0 text-red-600 mt-0.5 animate-pulse" size={20} />
          <div className="space-y-1 font-semibold">
            <p className="text-sm font-black">GPS Tracking Coordinates Required</p>
            <p className="text-xs text-red-700 leading-relaxed">
              To accept orders and perform delivery routing, your live location must be enabled. 
              {gpsError ? ` ${gpsError}` : ' Please click Allow Location on your browser popup.'}
            </p>
          </div>
        </div>
      )}

      {/* 3. Main Split View Layout */}
      {isGpsActive && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Active delivery cards arranged vertically one below another */}
          <div className="lg:col-span-2 space-y-6">
            {activeOrders.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={16} />
                  <span>My Active Delivery Jobs ({activeOrders.length})</span>
                </h3>
                <div className="space-y-6">
                  {activeOrders.map((order) => (
                    <ActiveOrderCard
                      key={order._id}
                      order={order}
                      token={token}
                      onComplete={fetchData}
                      riderCoords={riderCoords}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-xl border border-gray-100 flex flex-col items-center justify-center space-y-2">
                <Package className="text-gray-300" size={32} />
                <p className="text-gray-805 font-bold">No Active Deliveries Assigned</p>
                <p className="text-gray-400 text-xs max-w-xs font-semibold leading-relaxed">
                  You are not executing any delivery jobs currently. Claims details will load below.
                </p>
              </div>
            )}

            {/* Available Jobs list */}
            <div className="space-y-4 pt-8 border-t border-gray-100">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={16} />
                <span>Available Jobs Queue ({availableOrders.length})</span>
              </h3>
              
              {availableOrders.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-xl border border-gray-100 text-xs font-semibold text-gray-450 leading-relaxed">
                  No preparing canteens orders are ready for pickup. New items will load here instantly.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {availableOrders.map((order) => (
                    <div key={order._id} className="bg-white p-5 rounded-xl border border-gray-150 flex justify-between items-center gap-4 flex-wrap shadow-2xs font-semibold">
                      <div className="space-y-1">
                        <span className="text-3xs font-extrabold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200 uppercase block w-fit">
                          Ready for Pickup
                        </span>
                        <h4 className="font-extrabold text-sm text-gray-800">{order.orderNumber}</h4>
                        <p className="text-xs text-gray-500 font-bold">Store: {order.store?.name || 'SPG Canteen'}</p>
                        <p className="text-2xs text-gray-400">Destination: {order.college} | Amount: ₹{order.totalAmount}</p>
                      </div>
                      <button
                        onClick={() => handleAcceptJob(order._id)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs"
                      >
                        Accept Delivery
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Rider Overview Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-xs space-y-4">
              <h3 className="text-2xs font-black uppercase text-gray-400 tracking-wider">Rider Overview</h3>
              <div className="space-y-3.5 font-semibold text-xs">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-400">Active Jobs:</span>
                  <span className="text-gray-800 font-extrabold">{activeOrders.length} orders</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-400">Vehicle Type:</span>
                  <span className="text-gray-800">🛵 Campus E-Scooter</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Operating:</span>
                  <span className="text-green-600">On-Duty</span>
                </div>
              </div>
              <p className="text-4xs text-gray-400 leading-normal font-semibold">
                You can claim multiple orders concurrently from the jobs queue. Verify each customer with their unique 4-digit handover passcode.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
