import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, UserPlus, Store, AlertTriangle, RefreshCw, Key, Landmark } from 'lucide-react';
import { authService } from '../services/authService';
import { storeService } from '../services/storeService';

const AdminPortal = () => {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [registeredStores, setRegisteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Add Shopkeeper Form
  const [skName, setSkName] = useState('');
  const [skEmail, setSkEmail] = useState('');
  const [skMobile, setSkMobile] = useState('');
  const [skPassword, setSkPassword] = useState('');
  const [skLoading, setSkLoading] = useState(false);
  const [skSuccess, setSkSuccess] = useState('');

  // 2. Add Store Form
  const [storeName, setStoreName] = useState('');
  const [storeOwnerId, setStoreOwnerId] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeLat, setStoreLat] = useState('28.6139');
  const [storeLng, setStoreLng] = useState('77.2090');
  const [storeRadius, setStoreRadius] = useState('2.0');
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState('');

  // List of shopkeepers that don't have stores yet
  const [eligibleOwners, setEligibleOwners] = useState([]);

  const loadAdminDesk = async () => {
    try {
      const storeList = await storeService.getStores();
      setRegisteredStores(storeList);
    } catch (err) {
      setError(err.message || 'Error loading Admin Desk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      setError('Unauthorized. Only system administrators can access this console.');
      setLoading(false);
      return;
    }
    loadAdminDesk();
  }, [user, token]);

  const handleRegisterShopkeeper = async (e) => {
    e.preventDefault();
    setSkSuccess('');
    setError('');
    setSkLoading(true);

    try {
      const data = await authService.register(skName, skEmail, skMobile, skPassword, 'shopkeeper');

      setSkSuccess(`Shopkeeper "${data.name}" created! OWNER ID: ${data._id || data.id}`);
      setStoreOwnerId(data._id || data.id); // Auto-fill Owner ID in the store creator form!
      
      // Clear fields
      setSkName('');
      setSkEmail('');
      setSkMobile('');
      setSkPassword('');

    } catch (err) {
      setError(err.message);
    } finally {
      setSkLoading(false);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setStoreSuccess('');
    setError('');
    setStoreLoading(true);

    try {
      const latNum = parseFloat(storeLat);
      const lngNum = parseFloat(storeLng);
      const radiusNum = parseFloat(storeRadius);

      if (!storeOwnerId) throw new Error('Store Owner ID is required');
      if (isNaN(latNum) || isNaN(lngNum) || isNaN(radiusNum)) throw new Error('Coordinates and radius must be valid numbers');

      await storeService.updateStore({
        name: storeName,
        description: storeDesc,
        deliveryRadius: radiusNum,
      });

      await storeService.updateStoreLocation({
        latitude: latNum,
        longitude: lngNum,
      });

      setStoreSuccess(`Store "${storeName}" registered successfully!`);
      setStoreName('');
      setStoreOwnerId('');
      setStoreDesc('');
      setStoreAddress('');

      // Reload lists
      loadAdminDesk();

    } catch (err) {
      setError(err.message);
    } finally {
      setStoreLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <RefreshCw className="animate-spin text-gray-800 mx-auto mb-4" size={32} />
        <p className="text-gray-500">Connecting Admin Console...</p>
      </div>
    );
  }

  if (error && registeredStores.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-white p-8 rounded-xl border border-red-100 shadow-sm">
        <AlertTriangle className="text-red-500 mx-auto mb-4" size={36} />
        <h2 className="text-xl font-bold text-gray-800">Access Restricted</h2>
        <p className="text-gray-400 text-sm mt-1.5 mb-6">{error}</p>
        <button onClick={() => { logout(); navigate('/login'); }} className="w-full bg-gray-800 text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-gray-900 transition">
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Top Banner */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-amber-500" size={32} />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">System Admin Panel</h1>
            <p className="text-gray-400 text-xs mt-0.5">Configure campus shopkeeper credentials and store circles.</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="border border-gray-700 hover:bg-gray-800 text-gray-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
        >
          Logout Admin
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-100 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs font-medium text-gray-700">
        {/* Left Side: Create Shopkeeper */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
            <UserPlus size={18} className="text-green-600" />
            <span>Create Shopkeeper Account</span>
          </h3>

          {skSuccess && (
            <div className="bg-green-50 text-green-700 px-4 py-2.5 rounded-lg border border-green-100 font-bold select-all leading-normal">
              {skSuccess}
            </div>
          )}

          <form onSubmit={handleRegisterShopkeeper} className="space-y-4">
            <div>
              <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Suresh Kumar"
                value={skName}
                onChange={(e) => setSkName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="suresh@campusmart.com"
                value={skEmail}
                onChange={(e) => setSkEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Mobile Phone</label>
              <input
                type="tel"
                required
                placeholder="9876543211"
                value={skMobile}
                onChange={(e) => setSkMobile(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Account Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={skPassword}
                onChange={(e) => setSkPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={skLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-2.5 rounded-lg text-xs transition shadow-sm"
            >
              {skLoading ? 'Registering...' : 'Register Shopkeeper Account'}
            </button>
          </form>
        </div>

        {/* Right Side: Create Store */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
            <Store size={18} className="text-green-600" />
            <span>Register Store Outlet</span>
          </h3>

          {storeSuccess && (
            <div className="bg-green-50 text-green-700 px-4 py-2.5 rounded-lg border border-green-100 font-bold">
              {storeSuccess}
            </div>
          )}

          <form onSubmit={handleCreateStore} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Campus Mart"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Store Owner ID (Shopkeeper User ID)</label>
                <input
                  type="text"
                  required
                  placeholder="Paste Owner ID returned above"
                  value={storeOwnerId}
                  onChange={(e) => setStoreOwnerId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 font-mono text-green-700"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="Late night grocery outlet..."
                  value={storeDesc}
                  onChange={(e) => setStoreDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Delivery Center Address</label>
                <input
                  type="text"
                  required
                  placeholder="Admin Block, Campus Plaza"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Latitude</label>
                <input
                  type="text"
                  required
                  value={storeLat}
                  onChange={(e) => setStoreLat(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Longitude</label>
                <input
                  type="text"
                  required
                  value={storeLng}
                  onChange={(e) => setStoreLng(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Delivery Radius (km)</label>
                <input
                  type="text"
                  required
                  value={storeRadius}
                  onChange={(e) => setStoreRadius(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-500 font-bold text-green-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={storeLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-2.5 rounded-lg text-xs transition shadow-sm"
            >
              {storeLoading ? 'Registering Store...' : 'Register Store Outlet'}
            </button>
          </form>
        </div>
      </div>

      {/* Directory List of Registered Stores */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-xs space-y-4 text-xs font-semibold">
        <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
          <Landmark size={18} className="text-green-600" />
          <span>Registered Campus Stores Directory</span>
        </h3>
        {registeredStores.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No stores registered yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registeredStores.map((s) => (
              <div key={s._id} className="border border-gray-100 p-4 rounded-xl shadow-2xs space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="font-extrabold text-sm text-gray-800">{s.name}</span>
                  <span className="text-3xs uppercase px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">
                    {s.status}
                  </span>
                </div>
                <p className="text-xxs text-gray-500 leading-normal">{s.description || 'No description'}</p>
                <div className="border-t border-gray-50 pt-2 mt-2 space-y-1 text-3xs text-gray-400">
                  <p><span className="font-bold text-gray-600">Owner ID:</span> <span className="font-mono text-gray-500 select-all">{s.owner?._id || s.owner}</span></p>
                  <p><span className="font-bold text-gray-600">Location:</span> {s.location.lat.toFixed(4)}, {s.location.lng.toFixed(4)}</p>
                  <p><span className="font-bold text-gray-600">Radius Limit:</span> {s.deliveryRadius} km</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortal;
