import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Sliders, ListOrdered, ShoppingBag, ArrowLeft, RefreshCw, MapPin, Compass, CheckCircle2 } from 'lucide-react';
import { storeService } from '../services/storeService';

const ShopkeeperConfig = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('');
  const [logo, setLogo] = useState('');
  const [phone, setPhone] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [minimumOrder, setMinimumOrder] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [codEnabled, setCodEnabled] = useState(true);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Map state hooks
  const [mapInstance, setMapInstance] = useState(null);
  const [shopMarker, setShopMarker] = useState(null);
  const [deliveryCircle, setDeliveryCircle] = useState(null);

  // Fetch store details on load
  useEffect(() => {
    if (!user) {
      navigate('/shopkeeper/login');
      return;
    }
    if (user.role !== 'shopkeeper') {
      navigate('/');
      return;
    }

    const fetchStoreConfig = async () => {
      try {
        const data = await storeService.getShopkeeperStore();
        
        setStore(data);
        setName(data.name);
        setDescription(data.description || '');
        setAddress(data.location?.address || 'Campus Store');
        setLat((data.location?.lat ?? 28.6139).toString());
        setLng((data.location?.lng ?? 77.2090).toString());
        setRadius((data.deliveryRadius || 10).toString());
        setLogo(data.logo || '');
        setPhone(data.phone || '');
        setOpeningTime(data.openingTime || '09:00 AM');
        setClosingTime(data.closingTime || '11:00 PM');
        setMinimumOrder(data.minimumOrder?.toString() || '50');
        setDeliveryFee(data.deliveryFee?.toString() || '10');
        setCodEnabled(data.codEnabled !== undefined ? data.codEnabled : true);
        setOnlinePaymentEnabled(data.onlinePaymentEnabled !== undefined ? data.onlinePaymentEnabled : true);

      } catch (err) {
        setError(err.message || 'Error fetching store config');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreConfig();
  }, [user, token]);

  // Initialize Config Map
  useEffect(() => {
    if (!window.L || !store) return;

    const mapDiv = document.getElementById('config-map');
    if (!mapDiv) return;

    const initialLat = parseFloat(lat) || 28.6139;
    const initialLng = parseFloat(lng) || 77.2090;
    const radiusMeters = (parseFloat(radius) || 1.5) * 1000;

    let map = mapInstance;
    if (!map) {
      map = window.L.map('config-map', {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([initialLat, initialLng], 14);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      setMapInstance(map);
    } else {
      map.eachLayer((layer) => {
        if (layer instanceof window.L.Marker || layer instanceof window.L.Circle) {
          map.removeLayer(layer);
        }
      });
    }

    const shopIcon = window.L.divIcon({
      html: `<div class="w-8 h-8 bg-emerald-600 border-2 border-white rounded-full flex items-center justify-center text-xs shadow-md animate-pulse">🏪</div>`,
      className: '',
      iconSize: [32, 32],
    });

    const marker = window.L.marker([initialLat, initialLng], {
      icon: shopIcon,
      draggable: true,
    }).addTo(map);

    const circle = window.L.circle([initialLat, initialLng], {
      color: '#059669',
      fillColor: '#10b981',
      fillOpacity: 0.15,
      radius: radiusMeters,
    }).addTo(map);

    setShopMarker(marker);
    setDeliveryCircle(circle);

    marker.on('dragend', function (event) {
      const pos = event.target.getLatLng();
      setLat(pos.lat.toString());
      setLng(pos.lng.toString());
    });

    map.on('click', function (event) {
      const pos = event.latlng;
      marker.setLatLng(pos);
      circle.setLatLng(pos);
      setLat(pos.lat.toString());
      setLng(pos.lng.toString());
    });

  }, [store]);

  useEffect(() => {
    if (deliveryCircle && shopMarker && mapInstance) {
      const currentLat = parseFloat(lat);
      const currentLng = parseFloat(lng);
      const currentRadius = parseFloat(radius) || 1.5;

      if (!isNaN(currentLat) && !isNaN(currentLng)) {
        const newLatLng = [currentLat, currentLng];
        shopMarker.setLatLng(newLatLng);
        deliveryCircle.setLatLng(newLatLng);
        deliveryCircle.setRadius(currentRadius * 1000);
        mapInstance.panTo(newLatLng);
      }
    }
  }, [lat, lng, radius]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaveSuccess(false);
    setSaveLoading(true);

    try {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusNum = parseFloat(radius);

      if (isNaN(latNum) || latNum < -90 || latNum > 90) throw new Error('Invalid Latitude (-90 to 90)');
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) throw new Error('Invalid Longitude (-180 to 180)');
      if (isNaN(radiusNum) || radiusNum <= 0) throw new Error('Radius must be a positive number');

      await storeService.updateStore({
        name,
        description,
        phone,
        deliveryRadius: radiusNum,
      });

      await storeService.updateStoreLocation({
        latitude: latNum,
        longitude: lngNum,
      });

      const updatedStore = await storeService.getShopkeeperStore();
      setStore(updatedStore);
      setSaveSuccess(true);
      alert('Store config saved successfully!');
    } catch (err) {
      setError(err.message || 'Error saving settings');
    } finally {
      setSaveLoading(false);
    }
  };

  const loadPresetCoordinate = (type) => {
    if (type === 'admin') {
      setAddress('Admin Block, Campus Plaza');
      setLat('28.6139');
      setLng('77.2090');
    } else if (type === 'library') {
      setAddress('Central Library Block');
      setLat('28.6145');
      setLng('77.2105');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-3" size={28} />
        <p className="text-xs text-slate-500 font-medium">Loading store settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Merchant Top Header (md:hidden) */}
      <header className="md:hidden bg-slate-900 text-white p-3.5 border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 font-bold">
              <Store size={16} />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-white">{store?.name || 'NearKart Desk'}</h2>
              <span className="text-3xs text-emerald-400 font-semibold">Store Settings</span>
            </div>
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-800/90 p-1 rounded-xl text-3xs font-bold text-center">
          <Link
            to="/shopkeeper/dashboard"
            className="py-1.5 rounded-lg text-slate-400 hover:text-white transition flex items-center justify-center gap-1"
          >
            <span>Orders</span>
          </Link>
          <Link
            to="/shopkeeper/products"
            className="py-1.5 rounded-lg text-slate-400 hover:text-white transition flex items-center justify-center gap-1"
          >
            <span>Inventory</span>
          </Link>
          <button
            disabled
            className="py-1.5 rounded-lg bg-emerald-600 text-white shadow-xs font-bold"
          >
            Config
          </button>
        </div>
      </header>

      {/* Sidebar Navigation (hidden on mobile) */}
      <aside className="hidden md:flex md:w-64 bg-slate-900 text-white flex-col justify-between shrink-0">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Store size={18} />
            </div>
            <span className="text-base font-extrabold tracking-tight text-white">NearKart Desk</span>
          </div>

          <nav className="flex flex-col gap-1.5">
            <Link
              to="/shopkeeper/dashboard"
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <ListOrdered size={16} />
              <span>Order Desk</span>
            </Link>

            <button
              onClick={() => navigate('/shopkeeper/dashboard')}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>

            <Link
              to="/shopkeeper/products"
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <ShoppingBag size={16} />
              <span>Product Inventory</span>
            </Link>

            <button
              disabled
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs w-full text-left"
            >
              <Sliders size={16} />
              <span>Store Configuration</span>
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800 text-xs text-slate-400">
          <p className="font-bold text-white text-xs">{store?.name || 'My Store'}</p>
          <p className="text-3xs text-emerald-400 font-semibold mt-0.5">Configuration Active</p>
        </div>
      </aside>

      {/* Main panel workdesk */}
      <main className="flex-grow p-3.5 sm:p-6 md:p-8 max-h-screen overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Store Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage operational settings, campus radius, and pricing boundaries.</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl border border-rose-200 mb-6 text-xs font-medium">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-200 mb-6 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Configuration updated successfully! Real-time radius and fees are synced.</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card max-w-2xl overflow-hidden p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <MapPin size={16} className="text-emerald-600" />
              <span>Canteen Base Location Pin</span>
            </h3>

            {/* Interactive Leaflet Map Wrapper */}
            <div className="space-y-2">
              <div id="config-map" className="w-full h-72 rounded-xl bg-slate-100 border border-slate-200 z-10" />
              <p className="text-3xs text-slate-400 font-medium text-center">
                💡 Drag the canteen marker or click on the map to set base coordinates and delivery radius.
              </p>
            </div>

            {/* Presets Helper */}
            <div className="bg-amber-50/70 rounded-xl p-3.5 border border-amber-200/70 text-xs text-amber-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-2xs text-amber-800">
                <Compass size={14} className="text-amber-700" />
                <span>Quick Coordinate Presets</span>
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => loadPresetCoordinate('admin')}
                  className="bg-white border border-amber-200 hover:bg-amber-100 px-3 py-1 rounded-lg text-2xs font-bold text-amber-900 transition shadow-xs"
                >
                  🏫 Admin Plaza
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetCoordinate('library')}
                  className="bg-white border border-amber-200 hover:bg-amber-100 px-3 py-1 rounded-lg text-2xs font-bold text-amber-900 transition shadow-xs"
                >
                  📚 Central Library
                </button>
              </div>
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
              <div className="md:col-span-2">
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Description / Tagline</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Logo URL</label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Opening Time</label>
                <input
                  type="text"
                  placeholder="09:00 AM"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Closing Time</label>
                <input
                  type="text"
                  placeholder="11:30 PM"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Base Location Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 font-semibold"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Latitude</label>
                <input
                  type="text"
                  required
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Longitude</label>
                <input
                  type="text"
                  required
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Delivery Radius (km)</label>
                <input
                  type="text"
                  required
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Delivery Fee (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Minimum Order (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={minimumOrder}
                  onChange={(e) => setMinimumOrder(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 font-bold text-emerald-700"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <span className="text-2xs font-bold text-slate-600 uppercase tracking-wider">Payment Gateways</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={codEnabled}
                      onChange={(e) => setCodEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>COD Enabled</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlinePaymentEnabled}
                      onChange={(e) => setOnlinePaymentEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Online Enabled</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs shadow-emerald-600/20 active:scale-98"
            >
              {saveLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ShopkeeperConfig;
