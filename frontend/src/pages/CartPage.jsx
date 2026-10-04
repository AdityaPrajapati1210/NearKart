import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Plus, Minus, MapPin, Navigation, ShoppingBag, CreditCard, ShieldAlert } from 'lucide-react';
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

  // 2. Trigger automatic Geolocation request on mount ("Jo bole on your location")
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
          setShowLocationModal(false); // Auto-dismiss popup on success
        },
        (err) => {
          let errorMsg = 'Failed to acquire location.';
          if (err.code === 1) {
            errorMsg = 'Location permission denied by browser. If testing on localhost, click the padlock icon next to the URL bar and select "Allow Location". (Note: Modern browsers block GPS on insecure HTTP domains).';
          } else if (err.code === 2) {
            errorMsg = 'Position unavailable. GPS hardware is offline or local Wi-Fi geolocation lookup failed.';
          } else if (err.code === 3) {
            errorMsg = 'Location query timed out.';
          }
          setGpsError(errorMsg);
          console.warn('Auto Geolocation declined/blocked on mount. Using default coordinates:', err.message);
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
      html: `<div class="w-7 h-7 bg-green-600 border-2 border-white rounded-full flex items-center justify-center text-xs shadow-md">🏪</div>`,
      className: '',
      iconSize: [28, 28],
    });
    window.L.marker([storeLat, storeLng], { icon: storeIcon })
      .addTo(mapRef.current)
      .bindPopup(`<b>${storeDetails.name}</b><br/>Shop Base Coordinates`)
      .openPopup();

    // B. Draw Store Delivery coverage boundary Circle
    window.L.circle([storeLat, storeLng], {
      color: '#22c55e',
      fillColor: '#86e4a4',
      fillOpacity: 0.15,
      radius: radiusMeters,
    }).addTo(mapRef.current);

    // C. Draw Draggable Client Pin
    const clientIcon = window.L.divIcon({
      html: `<div class="w-7 h-7 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-xs shadow-md animate-bounce">📍</div>`,
      className: '',
      iconSize: [28, 28],
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

    // Recalculate leaflet map sizes
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 250);

    // Cleanup on unmount or storeDetails changes
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
          errorMsg = 'Location permission denied by browser. If testing on localhost, click the padlock icon next to the URL bar and select "Allow Location". (Note: Modern browsers block GPS on insecure HTTP domains).';
        } else if (err.code === 2) {
          errorMsg = 'Position unavailable. GPS hardware is offline or local Wi-Fi geolocation lookup failed.';
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
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
          <ShoppingBag size={48} className="text-gray-300 mb-3" />
          <h2 className="text-xl font-bold text-gray-800">Your Cart is Empty</h2>
          <p className="text-gray-400 text-sm mt-1 mb-6">Explore the campus store directory to add snacks to your cart.</p>
          <Link to="/" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg text-sm transition">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight mb-8">Checkout Shopping Cart</h1>

      {isStoreClosed && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-150 mb-6 flex items-start gap-2.5">
          <ShieldAlert className="shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-bold">Store Closed</p>
            <p className="text-xs mt-0.5">This store is temporarily closed and not accepting orders. Please check back later.</p>
          </div>
        </div>
      )}

      {isOutOfRange && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-150 mb-6 flex items-start gap-2.5">
          <ShieldAlert className="shrink-0 mt-0.5 animate-pulse" size={18} />
          <div>
            <p className="text-sm font-bold">Location Out of Bounds</p>
            <p className="text-xs mt-0.5">
              You are **{currentDistance.toFixed(2)} km** away. The store circle radius is limited to **{storeDetails?.deliveryRadius} km**. Drag your pin closer or select a preset inside the circle!
            </p>
          </div>
        </div>
      )}

      {isMinimumNotMet && (
        <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-lg border border-amber-200 mb-6 flex items-start gap-2.5">
          <ShieldAlert className="shrink-0 mt-0.5 text-amber-600" size={18} />
          <div>
            <p className="text-sm font-bold">Minimum Order Limit Not Met</p>
            <p className="text-xs mt-0.5">
              The store requires a minimum order of **₹{storeMinimumOrder}**. You need to add **₹{storeMinimumOrder - subtotal}** more to place this order.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-150 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold">Checkout Error</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
          {error.includes('Outdated Cart Store') && (
            <button
              onClick={() => {
                clearCart();
                setError('');
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition shrink-0"
            >
              Reset / Clear Cart
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side: Cart Items & Live Map */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 text-sm">Order Items</h3>
              {storeDetails && (
                <span className="text-2xs text-gray-400 font-bold uppercase tracking-wider">
                  Store: {storeDetails.name}
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item._id} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg bg-gray-55 border border-gray-100"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                        {item.discount > 0 && (
                          <span className="bg-red-50 text-red-655 font-extrabold text-xxs px-1.5 py-0.5 rounded">
                            {item.discount}% OFF
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                      <p className="text-sm font-black text-green-600 mt-1">₹{item.price}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1, item.stock)}
                        className="p-1.5 hover:bg-gray-50 text-gray-500 transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-3 text-sm font-semibold text-gray-700 w-8 text-center bg-gray-50/20">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1, item.stock)}
                        className="p-1.5 hover:bg-gray-50 text-gray-500 transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="text-gray-400 hover:text-red-550 p-1.5 transition"
                      title="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Leaflet Map Wrapper */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-gray-800 text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin size={18} className="text-green-600" />
                <span>Geospatial Coverage Circle</span>
              </span>
              <span className={`text-xxs font-extrabold px-2 py-0.5 rounded-full ${isOutOfRange ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                Distance: {currentDistance.toFixed(2)} km
              </span>
            </h3>

            {/* Map Canvas div */}
            <div id="checkout-map" className="w-full h-80 rounded-xl bg-gray-100 border border-gray-250 z-10" />

            {gpsError && (
              <div className="bg-amber-50 text-amber-800 border border-amber-200 text-xxs p-3 rounded-lg leading-relaxed font-semibold">
                ⚠️ Browser GPS Block: {gpsError}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-center pt-1.5">
                <button
                  type="button"
                  onClick={handleGetGpsLocation}
                  disabled={fetchingGps}
                  className="flex items-center gap-2 border border-green-500 hover:bg-green-50 text-green-700 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xxs"
                >
                  <Navigation size={14} className={fetchingGps ? 'animate-bounce' : ''} />
                  <span>{fetchingGps ? 'Querying GPS...' : 'Get Current GPS Location'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xxs text-gray-500 bg-gray-55 p-2.5 rounded-lg border border-gray-100 font-semibold">
                <div>
                  <span className="font-extrabold">Lat:</span> {coordinates.lat.toFixed(5)}
                </div>
                <div>
                  <span className="font-extrabold">Lng:</span> {coordinates.lng.toFixed(5)}
                </div>
                <div className="text-right">
                  <span className="font-extrabold">Max Limit:</span> {storeDetails?.deliveryRadius} km
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="font-bold text-xs text-gray-700">Delivery Address Details</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Select College</label>
                    <select
                      value={collegeSelection}
                      onChange={(e) => setCollegeSelection(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg text-xs p-2.5 bg-white focus:outline-none focus:border-green-500 font-semibold"
                    >
                      <option value="College A">College A</option>
                      <option value="College B">College B</option>
                      <option value="College C">College C</option>
                      <option value="Other">Other (Type custom college/location)</option>
                    </select>
                  </div>

                  {collegeSelection === 'Other' && (
                    <div>
                      <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Type Location Name</label>
                      <input
                        type="text"
                        required
                        name="custom-delivery-address"
                        autoComplete="off"
                        placeholder="enter your location"
                        value={customCollege}
                        onChange={(e) => setCustomCollege(e.target.value)}
                        className="w-full border border-gray-250 rounded-lg text-xs p-2.5 focus:outline-none focus:border-green-500 bg-white font-semibold"
                      />
                    </div>
                  )}

                  <div className="bg-green-50/30 p-3 rounded-lg border border-green-100 text-xxs text-green-800 leading-normal font-semibold">
                    <span className="font-extrabold text-green-700 block mb-0.5">Selected College Location:</span>
                    {collegeSelection === 'Other' ? (customCollege || 'No custom name typed yet') : collegeSelection}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Payment & Summary */}
        <div className="space-y-6">
          {/* Payment Option */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-5 space-y-4 font-semibold">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <CreditCard size={18} className="text-green-600" />
              <span>Select Payment Mode</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={storeDetails && !storeDetails.codEnabled}
                onClick={() => setPaymentMethod('COD')}
                className={`p-3 rounded-lg border font-semibold text-xs flex flex-col gap-1 items-center transition ${
                  paymentMethod === 'COD'
                    ? 'border-green-600 bg-green-50/20 text-green-700'
                    : 'border-gray-200 hover:bg-gray-55 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <span className="text-sm">💵</span>
                <span>Cash on Delivery</span>
              </button>

              <button
                type="button"
                disabled={storeDetails && !storeDetails.onlinePaymentEnabled}
                onClick={() => setPaymentMethod('ONLINE')}
                className={`p-3 rounded-lg border font-semibold text-xs flex flex-col gap-1 items-center transition ${
                  paymentMethod === 'ONLINE'
                    ? 'border-green-600 bg-green-50/20 text-green-700'
                    : 'border-gray-200 hover:bg-gray-55 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <span className="text-sm">💳</span>
                <span>Simulated Online</span>
              </button>
            </div>
            
            {storeDetails && !storeDetails.codEnabled && (
              <p className="text-3xs text-red-500 font-semibold bg-red-50/40 p-1.5 rounded text-center">
                ⚠️ Cash on Delivery is disabled by this store.
              </p>
            )}
            {storeDetails && !storeDetails.onlinePaymentEnabled && (
              <p className="text-3xs text-red-500 font-semibold bg-red-50/40 p-1.5 rounded text-center">
                ⚠️ Online Payment is disabled by this store.
              </p>
            )}
          </div>

          {/* Pricing summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">Order Summary</h3>

            <div className="space-y-2.5 text-sm text-gray-600 font-semibold">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>{deliveryFee === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${deliveryFee}`}</span>
              </div>
              {subtotal <= 300 && (
                <p className="text-3xs text-gray-400 font-medium">💡 Tip: Add ₹{300 - subtotal} more for free delivery.</p>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-extrabold text-gray-800">
                <span>Grand Total</span>
                <span className="text-green-600">₹{total}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || isMinimumNotMet || isStoreClosed || isOutOfRange}
              className={`w-full text-white font-extrabold py-3 rounded-xl text-sm transition shadow-sm ${
                loading || isMinimumNotMet || isStoreClosed || isOutOfRange
                  ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'Processing Order...' : 'Confirm & Place Order'}
            </button>
          </div>
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xxs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto text-xl animate-bounce">
              📍
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-gray-805 text-base">Enable Location Access</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-semibold">
                SPG Canteen is a hyperlocal store. We need your coordinates to verify delivery range to your college hostel room.
              </p>
            </div>

            {gpsError ? (
              <div className="bg-amber-50 text-amber-800 border border-amber-200 text-3xs p-3 rounded-lg leading-relaxed text-left font-semibold space-y-1">
                <p className="font-bold">⚠️ GPS Blocked: {gpsError}</p>
                <p className="text-gray-500 font-medium">To fix: Click the padlock icon 🔒 next to URL bar, set Location to "Allow", and reload page.</p>
              </div>
            ) : (
              <p className="text-xxs text-green-700 font-bold">
                Please click "Allow Location" on the browser popup that appears.
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded-lg text-xs font-bold transition"
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
                        errorMsg = 'Location permission denied by browser. If testing on localhost, click the padlock/settings icon on URL bar and allow location access.';
                      } else if (err.code === 2) {
                        errorMsg = 'Position unavailable. GPS or Wi-Fi location services are offline.';
                      } else if (err.code === 3) {
                        errorMsg = 'Lookup timed out.';
                      }
                      setGpsError(errorMsg);
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                  );
                }}
                className="flex-grow bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-xs font-bold transition shadow-sm"
              >
                Allow GPS
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;
