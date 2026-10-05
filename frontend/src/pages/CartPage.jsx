import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Plus, Minus, MapPin, Navigation, ShoppingBag, CreditCard, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { storeService } from '../services/storeService';
import { orderService } from '../services/orderService';

const CartPage = ({ cart, updateQuantity, removeFromCart, clearCart }) => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [storeDetails, setStoreDetails] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);

  // College Location Parameters
  const [collegeSelection, setCollegeSelection] = useState('College A');
  const [customCollege, setCustomCollege] = useState('');

  const [selectedHub, setSelectedHub] = useState('gps');
  const [coordinates, setCoordinates] = useState(() => {
    const saved = localStorage.getItem('nk_client_location');
    return saved ? JSON.parse(saved) : { lat: 28.6139, lng: 77.2090 };
  });
  const [fetchingGps, setFetchingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(() => {
    const saved = localStorage.getItem('nk_client_location');
    return saved ? false : true;
  });
  
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Map refs
  const mapRef = useRef(null);
  const clientMarkerRef = useRef(null);

  // Predefined campus hubs presets
  const CAMPUS_HUBS = {
    admin: { name: '🏫 Admin Block (Center - 0 km away)', lat: 28.6139, lng: 77.2090, college: 'College A', hostel: 'Admin Plaza', roomNo: 'Main Desk' },
    hostelA: { name: '🏢 Girls Hostel A (Within zone - 0.4 km away)', lat: 28.6160, lng: 77.2120, college: 'College A', hostel: 'Girls Hostel A', roomNo: 'Room 205' },
    hostelC: { name: '🏢 Boys Hostel C (Within zone - 1.2 km away)', lat: 28.6210, lng: 77.2190, college: 'College B', hostel: 'Boys Hostel C', roomNo: 'Room 104' },
    residential: { name: '🏡 Staff Quarters (OUT OF RANGE - 3.5 km away)', lat: 28.6400, lng: 77.2300, college: 'College C', hostel: 'Staff Quarters', roomNo: 'Villa 12' },
    metro: { name: '🚇 Metro Station (OUT OF RANGE - 5.2 km away)', lat: 28.6600, lng: 77.2500, college: 'Local Area', hostel: 'Metro Plaza', roomNo: 'Gate 2' },
  };

  // 1. Fetch Store details
  useEffect(() => {
    if (cart.length === 0) return;

    const fetchStoreSettings = async () => {
      try {
        const storeId = cart[0]?.store || 'MAIN_STORE';
        const data = await storeService.getStoreById(storeId);
        setStoreDetails(data);
        if (!data.codEnabled && data.onlinePaymentEnabled) {
          setPaymentMethod('ONLINE');
        }
        setError('');
      } catch (err) {
        console.error('Error loading store config:', err);
        setError('Error connecting to the store server.');
      } finally {
        setLoadingStore(false);
      }
    };
    fetchStoreSettings();
  }, [cart]);

  // 2. Trigger automatic Geolocation request on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setFetchingGps(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latVal = position.coords.latitude;
          const lngVal = position.coords.longitude;
          setCoordinates({ lat: latVal, lng: lngVal });
          setSelectedHub('gps');
          setCollegeSelection('Other');
          setCustomCollege('');
          setFetchingGps(false);
          setGpsError('');
          setShowLocationModal(false);
        },
        (err) => {
          let errorMsg = 'Failed to acquire location.';
          if (err.code === 1) {
            errorMsg = 'Location permission denied. Click padlock icon next to URL bar to allow location access.';
          } else if (err.code === 2) {
            errorMsg = 'Position unavailable. GPS hardware is offline.';
          } else if (err.code === 3) {
            errorMsg = 'Location query timed out.';
          }
          setGpsError(errorMsg);
          console.warn('Auto Geolocation declined on mount. Using default coordinates:', err.message);
          setSelectedHub('admin');
          setFetchingGps(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setGpsError('Browser does not support Geolocation API.');
    }
  }, []);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!window.L || !storeDetails) return;

    const mapDiv = document.getElementById('checkout-map');
    if (!mapDiv) return;

    const storeLat = storeDetails.location.lat;
    const storeLng = storeDetails.location.lng;
    const radiusMeters = storeDetails.deliveryRadius * 1000;

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = window.L.map('checkout-map', {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([storeLat, storeLng], 14);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([storeLat, storeLng], 14);
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof window.L.Marker || layer instanceof window.L.Circle) {
          mapRef.current.removeLayer(layer);
        }
      });
    }

    // A. Draw Canteen Marker
    const storeIcon = window.L.divIcon({
      html: `<div class="w-8 h-8 bg-emerald-600 border-2 border-white rounded-full flex items-center justify-center text-xs shadow-md">🏪</div>`,
      className: '',
      iconSize: [32, 32],
    });
    window.L.marker([storeLat, storeLng], { icon: storeIcon })
      .addTo(mapRef.current)
      .bindPopup(`<b>${storeDetails.name}</b><br/>Campus Base Store`)
      .openPopup();

    // B. Draw Store Delivery coverage boundary Circle
    window.L.circle([storeLat, storeLng], {
      color: '#059669',
      fillColor: '#10b981',
      fillOpacity: 0.15,
      radius: radiusMeters,
    }).addTo(mapRef.current);

    // C. Draw Draggable Client Pin
    const clientIcon = window.L.divIcon({
      html: `<div class="w-8 h-8 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-xs shadow-md animate-bounce">📍</div>`,
      className: '',
      iconSize: [32, 32],
    });
    
    const marker = window.L.marker([coordinates.lat, coordinates.lng], {
      icon: clientIcon,
      draggable: true,
    }).addTo(mapRef.current);

    marker.on('dragend', function (event) {
      const position = event.target.getLatLng();
      const coords = { lat: position.lat, lng: position.lng };
      setCoordinates(coords);
      localStorage.setItem('nk_client_location', JSON.stringify(coords));
      setSelectedHub('gps');
      setCollegeSelection('Other');
      setCustomCollege('');
    });

    clientMarkerRef.current = marker;

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [storeDetails, showLocationModal]);

  // 4. Move marker when coordinate state changes
  useEffect(() => {
    if (clientMarkerRef.current && coordinates) {
      clientMarkerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
      if (mapRef.current) {
        mapRef.current.panTo([coordinates.lat, coordinates.lng]);
      }
    }
  }, [coordinates]);

  // Sync preset coords if select value changes
  useEffect(() => {
    if (selectedHub !== 'gps') {
      const hub = CAMPUS_HUBS[selectedHub];
      if (hub) {
        setCoordinates({ lat: hub.lat, lng: hub.lng });
        setCollegeSelection(hub.college || 'College A');
        setCustomCollege('');
      }
    }
  }, [selectedHub]);

  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }
    setFetchingGps(true);
    setSelectedHub('gps');
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoordinates(coords);
        localStorage.setItem('nk_client_location', JSON.stringify(coords));
        setCollegeSelection('Other');
        setCustomCollege('');
        setFetchingGps(false);
        setGpsError('');
      },
      (err) => {
        let errorMsg = 'Failed to acquire location.';
        if (err.code === 1) {
          errorMsg = 'Location permission denied by browser. Click padlock icon next to URL bar to allow location access.';
        } else if (err.code === 2) {
          errorMsg = 'Position unavailable. GPS hardware is offline.';
        } else if (err.code === 3) {
          errorMsg = 'Location query timed out.';
        }
        setGpsError(errorMsg);
        console.error('GPS error:', err);
        setSelectedHub('admin');
        setFetchingGps(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const getDistanceFrontend = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      alert('Please log in as a customer to place orders');
      navigate('/login');
      return;
    }

    if (user.role !== 'customer') {
      setError('Only customers are allowed to place orders.');
      return;
    }

    if (cart.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    const finalCollege = collegeSelection === 'Other' ? customCollege : collegeSelection;

    if (!finalCollege.trim()) {
      setError('Please select or specify your college location.');
      return;
    }

    setLoading(true);

    try {
      const placedOrder = await orderService.placeOrder({
        cart,
        deliveryLocation: coordinates,
        deliveryAddress: finalCollege,
        paymentMethod,
      });

      clearCart();
      alert(`Order ${placedOrder.orderNumber} placed successfully!`);
      navigate('/orders');
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const storeDeliveryFee = storeDetails ? storeDetails.deliveryFee : 10;
  const storeMinimumOrder = storeDetails ? storeDetails.minimumOrder : 50;
  const isStoreClosed = storeDetails ? (!storeDetails.acceptingOrders || storeDetails.status === 'closed') : false;

  const currentDistance = storeDetails 
    ? getDistanceFrontend(storeDetails.location.lat, storeDetails.location.lng, coordinates.lat, coordinates.lng)
    : 0;

  const deliveryFee = cart.length === 0 ? 0 : subtotal > 300 ? 0 : storeDeliveryFee;
  const total = subtotal + deliveryFee;
  const isMinimumNotMet = subtotal < storeMinimumOrder;
  const isOutOfRange = storeDetails ? (currentDistance > storeDetails.deliveryRadius) : false;

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-card flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800">Your Cart is Empty</h2>
          <p className="text-slate-400 text-xs mt-1 mb-6 leading-relaxed">
            Looks like you haven't added anything to your cart yet. Explore campus snacks, instant beverages, and daily items.
          </p>
          <Link
            to="/"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs shadow-emerald-600/20"
          >
            Explore Store Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">Checkout Order</h1>
        <p className="text-2xs sm:text-xs text-slate-500 mt-0.5">Review items, verify delivery hotspot, and confirm order.</p>
      </div>

      {isStoreClosed && (
        <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl border border-rose-200 mb-6 flex items-start gap-2.5">
          <ShieldAlert className="shrink-0 mt-0.5 text-rose-600" size={16} />
          <div>
            <p className="text-xs font-bold">Store Closed</p>
            <p className="text-2xs mt-0.5">This store is temporarily closed and not accepting orders. Please check back shortly.</p>
          </div>
        </div>
      )}

      {isOutOfRange && (
        <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl border border-rose-200 mb-6 flex items-start gap-2.5">
          <ShieldAlert className="shrink-0 mt-0.5 text-rose-600 animate-pulse" size={16} />
          <div>
            <p className="text-xs font-bold">Location Out of Campus Delivery Zone</p>
            <p className="text-2xs mt-0.5">
              You are currently <span className="font-extrabold">{currentDistance.toFixed(2)} km</span> away. The campus store delivery zone is limited to <span className="font-extrabold">{storeDetails?.deliveryRadius} km</span>. Drag your location pin or select a campus preset block below.
            </p>
          </div>
        </div>
      )}

      {isMinimumNotMet && (
        <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-xl border border-amber-200 mb-6 flex items-start gap-2.5">
          <ShieldAlert className="shrink-0 mt-0.5 text-amber-600" size={16} />
          <div>
            <p className="text-xs font-bold">Minimum Order Limit</p>
            <p className="text-2xs mt-0.5">
              This store requires a minimum order of <span className="font-bold">₹{storeMinimumOrder}</span>. Please add <span className="font-bold">₹{storeMinimumOrder - subtotal}</span> more items to proceed.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl border border-rose-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="shrink-0 mt-0.5 text-rose-600" size={16} />
            <div>
              <p className="text-xs font-bold">Checkout Notice</p>
              <p className="text-2xs mt-0.5">{error}</p>
            </div>
          </div>
          {error.includes('Outdated Cart Store') && (
            <button
              onClick={() => {
                clearCart();
                setError('');
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shrink-0"
            >
              Reset Cart
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: Cart Items & Live Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200/60 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Order Items ({cart.length})
              </h3>
              {storeDetails && (
                <span className="text-2xs text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                  Store: {storeDetails.name}
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item._id} className="p-3 sm:p-5 flex items-center justify-between gap-2.5 sm:gap-4">
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl bg-slate-50 border border-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1">{item.name}</h4>
                        {item.discount > 0 && (
                          <span className="bg-rose-50 text-rose-700 font-extrabold text-3xs px-1.5 py-0.2 rounded">
                            {item.discount}% OFF
                          </span>
                        )}
                      </div>
                      <p className="text-3xs text-slate-400 capitalize">{item.category}</p>
                      <p className="text-xs sm:text-sm font-extrabold text-emerald-700 mt-0.5">₹{item.price}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1, item.stock)}
                        className="p-1 sm:p-1.5 hover:bg-slate-200 text-slate-600 transition"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800 w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1, item.stock)}
                        className="p-1 sm:p-1.5 hover:bg-slate-200 text-slate-600 transition"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="text-slate-400 hover:text-rose-600 p-1 sm:p-1.5 transition"
                      title="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Leaflet Map Wrapper */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <MapPin size={16} className="text-emerald-600" />
                <span>Campus Geofence Coverage</span>
              </h3>
              <span className={`text-2xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                isOutOfRange ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Distance: {currentDistance.toFixed(2)} km {isOutOfRange ? '(Out of Range)' : '(In Zone)'}
              </span>
            </div>

            {/* Map Canvas div */}
            <div id="checkout-map" className="w-full h-56 sm:h-72 rounded-xl bg-slate-100 border border-slate-200 z-10" />

            {gpsError && (
              <div className="bg-amber-50 text-amber-800 border border-amber-200 text-2xs p-3 rounded-xl font-medium">
                ⚠️ Browser GPS Note: {gpsError}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleGetGpsLocation}
                  disabled={fetchingGps}
                  className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Navigation size={13} className={fetchingGps ? 'animate-bounce' : ''} />
                  <span>{fetchingGps ? 'Detecting GPS...' : 'Auto-Detect My GPS Location'}</span>
                </button>

                <div className="text-3xs text-slate-500 font-mono">
                  Coordinates: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                </div>
              </div>

              {/* Delivery Address Details */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="font-bold text-xs text-slate-700 uppercase tracking-wide">Campus Hostel / Location Spot</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-2xs font-semibold text-slate-500 mb-1">Select Campus Block or Preset</label>
                    <select
                      value={collegeSelection}
                      onChange={(e) => setCollegeSelection(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl text-xs p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                    >
                      <option value="College A">Campus A - Academic Block</option>
                      <option value="College B">Campus B - Boys Hostel Quad</option>
                      <option value="College C">Campus C - Girls Hostel Quad</option>
                      <option value="Other">Other (Custom Room / Hostel Name)</option>
                    </select>
                  </div>

                  {collegeSelection === 'Other' && (
                    <div>
                      <label className="block text-2xs font-semibold text-slate-500 mb-1">Enter Exact Room / Location Description</label>
                      <input
                        type="text"
                        required
                        name="custom-delivery-address"
                        autoComplete="off"
                        placeholder="e.g. Block 4, Room 302, North Hostel"
                        value={customCollege}
                        onChange={(e) => setCustomCollege(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 font-semibold"
                      />
                    </div>
                  )}

                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-2xs text-emerald-800 leading-relaxed font-medium">
                    <span className="font-extrabold text-emerald-800 block mb-0.5">Destination Tag:</span>
                    {collegeSelection === 'Other' ? (customCollege || 'Please specify custom room name above') : collegeSelection}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Payment & Summary */}
        <div className="space-y-6">
          {/* Payment Option */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-3.5">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-600" />
              <span>Payment Mode</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={storeDetails && !storeDetails.codEnabled}
                onClick={() => setPaymentMethod('COD')}
                className={`p-3 rounded-xl border font-bold text-xs flex flex-col gap-1 items-center transition ${
                  paymentMethod === 'COD'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <span className="text-base">💵</span>
                <span>Cash on Delivery</span>
              </button>

              <button
                type="button"
                disabled={storeDetails && !storeDetails.onlinePaymentEnabled}
                onClick={() => setPaymentMethod('ONLINE')}
                className={`p-3 rounded-xl border font-bold text-xs flex flex-col gap-1 items-center transition ${
                  paymentMethod === 'ONLINE'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <span className="text-base">💳</span>
                <span>Simulated UPI</span>
              </button>
            </div>
            
            {storeDetails && !storeDetails.codEnabled && (
              <p className="text-3xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg text-center">
                ⚠️ Cash on Delivery disabled by store.
              </p>
            )}
            {storeDetails && !storeDetails.onlinePaymentEnabled && (
              <p className="text-3xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg text-center">
                ⚠️ Online Payment disabled by store.
              </p>
            )}
          </div>

          {/* Pricing summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5">
              Bill Details
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-800">₹{subtotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Delivery Charge</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-3xs">
                      FREE
                    </span>
                  ) : (
                    <span className="font-bold text-slate-800">₹{deliveryFee}</span>
                  )}
                </span>
              </div>

              {subtotal <= 300 && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-3xs text-slate-500 font-medium">
                  💡 Add ₹{300 - subtotal} more for <span className="text-emerald-700 font-bold">FREE Delivery</span>!
                </div>
              )}

              <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-extrabold text-slate-900">
                <span>To Pay</span>
                <span className="text-emerald-700 text-base">₹{total}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || isMinimumNotMet || isStoreClosed || isOutOfRange}
              className={`w-full font-bold py-3 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 ${
                loading || isMinimumNotMet || isStoreClosed || isOutOfRange
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-98'
              }`}
            >
              <span>{loading ? 'Processing Order...' : 'Confirm & Place Order'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl">
              📍
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base">Enable Location Access</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                NearKart needs your campus coordinates to verify range to your hostel room.
              </p>
            </div>

            {gpsError ? (
              <div className="bg-rose-50 text-rose-800 border border-rose-200 text-2xs p-3 rounded-xl text-left font-medium">
                <p className="font-bold">⚠️ GPS Blocked: {gpsError}</p>
                <p className="text-slate-500 mt-1">Click the browser padlock 🔒 icon next to URL bar, set Location to "Allow", or use campus presets.</p>
              </div>
            ) : (
              <p className="text-2xs text-emerald-700 font-semibold">
                Please click "Allow Location" on the browser prompt.
              </p>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-xs font-bold transition"
              >
                Use Presets
              </button>
              <button
                type="button"
                onClick={() => {
                  setGpsError('');
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const latVal = position.coords.latitude;
                      const lngVal = position.coords.longitude;
                      const coords = { lat: latVal, lng: lngVal };
                      setCoordinates(coords);
                      localStorage.setItem('nk_client_location', JSON.stringify(coords));
                      setSelectedHub('gps');
                      setCollegeSelection('Other');
                      setCustomCollege('');
                      setGpsError('');
                      setShowLocationModal(false);
                    },
                    (err) => {
                      let errorMsg = 'Access Denied.';
                      if (err.code === 1) {
                        errorMsg = 'Location permission denied by browser.';
                      } else if (err.code === 2) {
                        errorMsg = 'Position unavailable.';
                      } else if (err.code === 3) {
                        errorMsg = 'Lookup timed out.';
                      }
                      setGpsError(errorMsg);
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                  );
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-xs shadow-emerald-600/20"
              >
                Allow GPS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
