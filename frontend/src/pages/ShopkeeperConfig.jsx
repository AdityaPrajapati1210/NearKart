import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Sliders, ListOrdered, ShoppingBag, ArrowLeft, RefreshCw, MapPin, Compass } from 'lucide-react';
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
      html: `<div class="w-8 h-8 bg-green-600 border-2 border-white rounded-full flex items-center justify-center text-xs shadow-md animate-pulse">🏪</div>`,
      className: '',
      iconSize: [32, 32],
    });

    const marker = window.L.marker([initialLat, initialLng], {
      icon: shopIcon,
      draggable: true,
    }).addTo(map);

    const circle = window.L.circle([initialLat, initialLng], {
      color: '#22c55e',
      fillColor: '#86e4a4',
      fillOpacity: 0.15,
      radius: radiusMeters,
    }).addTo(map);

    setShopMarker(marker);
    setDeliveryCircle(circle);

    // Marker drag moves pin and updates states
    marker.on('dragend', function (event) {
      const pos = event.target.getLatLng();
      setLat(pos.lat.toString());
      setLng(pos.lng.toString());
    });

    // Map click places pin manually and updates states
    map.on('click', function (event) {
      const pos = event.latlng;
      marker.setLatLng(pos);
      circle.setLatLng(pos);
      setLat(pos.lat.toString());
      setLng(pos.lng.toString());
    });

  }, [store]);

  // Sync map parameters reactively when inputs change
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
        <RefreshCw className="animate-spin text-gray-800 mx-auto mb-4" size={32} />
        <p className="text-gray-500">Loading Configuration Console...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col justify-between shrink-0">
        <div className="p-6 space-y-8">
          <div className="flex items-center gap-2">
            <Store className="text-green-500" size={24} />
            <span className="text-xl font-black tracking-tight text-white">NearKart Desk</span>
          </div>

          <nav className="flex flex-col gap-2.5">
            <Link
              to="/shopkeeper/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <ListOrdered size={18} />
              <span>Order Desk</span>
            </Link>

            <button
              onClick={() => navigate('/shopkeeper/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <ArrowLeft size={18} />
              <span>Back to Dashboard</span>
            </button>

            <Link
              to="/shopkeeper/products"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <ShoppingBag size={18} />
              <span>Product Inventory</span>
            </Link>

            <button
              disabled
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white shadow-sm w-full text-left"
            >
              <Sliders size={18} />
              <span>Store Configuration</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main panel workdesk */}
      <main className="flex-grow p-8 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Store Configuration</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage operational settings, coordinates, fees and options.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-100 mb-6 text-xs font-semibold">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-100 mb-6 text-xs font-semibold">
            Configuration successfully updated. Delivery thresholds and maps refreshed.
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-xs max-w-2xl overflow-hidden p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-150 pb-2 flex items-center gap-2">
              <MapPin size={18} className="text-green-600" />
              <span>Set Canteen Location Pin manually</span>
            </h3>

            {/* Interactive Leaflet Map Wrapper */}
            <div className="space-y-2">
              <div id="config-map" className="w-full h-72 rounded-xl bg-gray-100 border border-gray-250 z-10" />
              <p className="text-4xs text-gray-400 font-extrabold uppercase tracking-wide text-center">
                💡 Drag the canteen pin or click anywhere on the map above to select your shop coordinates.
              </p>
            </div>

            {/* Presets Helper */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 text-xs text-amber-800 space-y-2.5">
              <p className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-xxs">
                <Compass size={14} className="text-amber-700" />
                <span>Geospatial Coordinate Preset Quick-Pins</span>
              </p>
              <p className="text-amber-750 leading-normal">
                Click a presets quick-pin to load coordinates instantly onto the map:
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => loadPresetCoordinate('admin')}
                  className="bg-white border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded font-bold shadow-xxs text-amber-900 transition"
                >
                  🏫 Seed Plaza (Admin Block)
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetCoordinate('library')}
                  className="bg-white border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded font-bold shadow-xxs text-amber-900 transition"
                >
                  📚 Central Library
                </button>
              </div>
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
              <div className="md:col-span-2">
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Description / Tagline</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Logo URL</label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Opening Time</label>
                <input
                  type="text"
                  placeholder="09:00 AM"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Closing Time</label>
                <input
                  type="text"
                  placeholder="11:30 PM"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Base Location Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Latitude</label>
                <input
                  type="text"
                  required
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Longitude</label>
                <input
                  type="text"
                  required
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Delivery Radius Limit (km)</label>
                <input
                  type="text"
                  required
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 bg-white font-bold text-green-700"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Delivery Charge Fee (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 bg-white font-bold text-green-700"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Minimum Order Value (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={minimumOrder}
                  onChange={(e) => setMinimumOrder(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 bg-white font-bold text-green-700"
                />
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <span className="text-3xs font-bold text-gray-400 uppercase tracking-wide">Gateway Options</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-gray-650 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={codEnabled}
                      onChange={(e) => setCodEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span>COD Enabled</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-gray-650 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlinePaymentEnabled}
                      onChange={(e) => setOnlinePaymentEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span>Online Enabled</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-2.5 rounded-lg text-xs transition shadow-sm"
            >
              {saveLoading ? 'Saving config...' : 'Save Configuration Parameters'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ShopkeeperConfig;
