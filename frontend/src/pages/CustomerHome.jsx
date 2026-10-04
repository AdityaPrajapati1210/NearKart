import React, { useState, useEffect } from 'react';
import { Search, MapPin, Compass, AlertCircle, ShoppingCart, Store, Clock, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { storeService } from '../services/storeService';
import { productService } from '../services/productService';

const CustomerHome = ({ addToCart }) => {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // 0. Location-based display filter parameters
  const [clientCoords, setClientCoords] = useState(() => {
    try {
      const saved = localStorage.getItem('nk_client_location');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 1. Fetch store info on load
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const storeData = await storeService.getShopkeeperStore();
        setStore(storeData);
      } catch (err) {
        console.warn('Store fetch error:', err);
      } finally {
        setLoadingStore(false);
      }
    };
    fetchStore();
  }, []);

  // 2. Fetch products whenever category or search changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const productList = await productService.getProducts({
          category: selectedCategory,
          search: searchQuery,
        });
        setProducts(productList);

        // Extract unique categories for filter menu
        if (selectedCategory === 'All' && !searchQuery) {
          const uniqueCats = ['All', ...new Set(productList.map((p) => p.category).filter(Boolean))];
          setCategories(uniqueCats);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Unable to load products. Please check server connection.');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const handleUseGPS = () => {
    setGpsError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setClientCoords(coords);
          localStorage.setItem('nk_client_location', JSON.stringify(coords));
          setGpsError('');
          setShowLocationModal(false);
        },
        (err) => {
          let errorMsg = 'Access Denied.';
          if (err.code === 1) {
            errorMsg = 'Location permission denied by browser. Click the URL padlock icon to allow location access.';
          } else if (err.code === 2) {
            errorMsg = 'Position unavailable. GPS or Wi-Fi location services are offline.';
          } else if (err.code === 3) {
            errorMsg = 'Lookup timed out.';
          }
          setGpsError(errorMsg);
        }
      );
    } else {
      setGpsError('Geolocation is not supported by your browser.');
    }
  };

  const handleUseCampusDefault = () => {
    const defaultCoords = { lat: 28.4483, lng: 76.7628 };
    setClientCoords(defaultCoords);
    localStorage.setItem('nk_client_location', JSON.stringify(defaultCoords));
    setShowLocationModal(false);
    setGpsError('');
  };

  const isStoreOpen = store?.isOpen ?? true;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-md mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
              Campus Hyperlocal Store
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Craving snacks or daily essentials?</h1>
          <p className="text-green-50 opacity-90 mt-1.5 max-w-md">
            Order directly from NearKart Store with instant campus delivery, live status verification, and secure OTP handovers.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-sm flex gap-3 items-center">
          <Compass className="animate-spin text-green-200 shrink-0" size={32} />
          <div>
            <p className="font-bold">Hyperlocal Campus Delivery</p>
            <p className="text-xs text-green-150">Fast 10-15 min hostel delivery right to your door!</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-100 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column: Single Shop Showcase & Location Details */}
        <div className="lg:col-span-1 space-y-4">
          {/* Shop Highlight Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-3xs font-extrabold uppercase tracking-wider text-green-600">Official Store</span>
                <h3 className="text-lg font-black text-gray-800 tracking-tight mt-0.5">
                  {store?.name || 'NearKart Store'}
                </h3>
              </div>
              <span
                className={`text-2xs font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isStoreOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {isStoreOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              {store?.description || 'Campus instant groceries, snacks, and daily essentials delivered in 10 minutes.'}
            </p>

            <div className="space-y-2.5 pt-2 border-t border-gray-100 text-xs font-semibold text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-green-600 shrink-0" />
                <span className="truncate">{store?.location?.address || 'Campus Central Store, Delhi'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-green-600 shrink-0" />
                <span>{store?.estimatedDeliveryTime || '10-15 Mins Delivery'}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-green-600 shrink-0" />
                <span>Radius: {store?.deliveryRadius || 2} km Campus Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-green-600 shrink-0" />
                <span>Helpline: {store?.phone || '9876543211'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
              <span className="bg-gray-100 text-gray-700 text-3xs font-bold px-2 py-0.5 rounded">💵 COD Available</span>
              <span className="bg-gray-100 text-gray-700 text-3xs font-bold px-2 py-0.5 rounded">💳 UPI / Online</span>
              <span className="bg-green-50 text-green-700 text-3xs font-bold px-2 py-0.5 rounded">⚡ 10m Express</span>
            </div>
          </div>

          {/* Delivery Location Status Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin size={14} className="text-green-600" />
                <span>Delivery Location</span>
              </h4>
              <button
                onClick={() => setShowLocationModal(true)}
                className="text-3xs text-green-600 hover:text-green-700 font-extrabold border border-green-200 hover:border-green-300 px-2 py-0.5 rounded-md bg-green-50/50 transition"
              >
                Change
              </button>
            </div>

            {clientCoords ? (
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-2xs space-y-1 font-semibold">
                <div className="flex items-center gap-1 text-green-700 font-bold">
                  <CheckCircle2 size={12} />
                  <span>Coordinates Active</span>
                </div>
                <p className="text-gray-500 font-mono text-3xs truncate">
                  {clientCoords.lat.toFixed(4)}, {clientCoords.lng.toFixed(4)}
                </p>
              </div>
            ) : (
              <div className="text-2xs text-gray-500 space-y-2">
                <p>Location not detected yet. Set location for accurate range verification.</p>
                <button
                  onClick={handleUseGPS}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded-lg text-3xs transition shadow-2xs"
                >
                  📡 Detect GPS
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Products Catalog */}
        <div className="lg:col-span-3 space-y-6">
          {/* Store header card & search */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between gap-4 md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-gray-800">{store?.name || 'NearKart Store'} Catalog</h2>
                {!isStoreOpen && (
                  <span className="flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 font-semibold">
                    <AlertCircle size={14} />
                    <span>Store Closed</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Browse fresh inventory, canteen snacks, and daily essentials.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search snacks, drinks, food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-gray-50/50"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                    selectedCategory === cat
                      ? 'bg-green-600 text-white border-green-600 shadow-2xs'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Products list */}
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm font-semibold">No products found matching your selection.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="mt-3 text-xs text-green-600 hover:text-green-700 font-bold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => {
                const isOutOfStock = product.stock <= 0;
                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200"
                  >
                    <div className="relative h-44 bg-gray-50 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
                        }}
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                          <span className="text-white font-extrabold text-xs uppercase px-3 py-1 bg-red-600 rounded-md">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      {!isOutOfStock && product.stock <= 5 && (
                        <span className="absolute top-2 right-2 bg-amber-500 text-white text-3xs font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                          Only {product.stock} left!
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <span className="text-3xs font-extrabold tracking-wider uppercase text-green-600">
                          {product.category || 'General'}
                        </span>
                        <h4 className="font-bold text-gray-800 mt-0.5 line-clamp-1 text-sm">{product.name}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-normal">{product.description}</p>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                        <div>
                          <span className="text-base font-black text-gray-900">₹{product.price}</span>
                          {product.offerPrice && product.offerPrice < product.price && (
                            <span className="ml-1.5 text-xs text-gray-400 line-through">₹{product.price}</span>
                          )}
                        </div>
                        <button
                          disabled={isOutOfStock || !isStoreOpen}
                          onClick={() => addToCart(product)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            isOutOfStock || !isStoreOpen
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white shadow-xs active:scale-95'
                          }`}
                        >
                          <ShoppingCart size={14} />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4 border border-gray-100">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto text-xl">
              📍
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-gray-800 text-base">Confirm Campus Location</h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                NearKart provides campus delivery for NearKart Store. Share your location to verify delivery range.
              </p>
            </div>

            {gpsError && (
              <div className="bg-red-50 text-red-800 border border-red-200 text-3xs p-3 rounded-lg text-left font-semibold">
                <p className="font-bold">⚠️ GPS Note: {gpsError}</p>
                <p className="text-gray-500 font-medium mt-1">You can also use the default campus location below.</p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={handleUseGPS}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
              >
                📡 Use Live GPS Location
              </button>
              <button
                onClick={handleUseCampusDefault}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs transition"
              >
                🏫 Use Campus Central Location
              </button>
              <button
                onClick={() => setShowLocationModal(false)}
                className="w-full text-gray-400 hover:text-gray-600 font-semibold py-1 text-xs transition"
              >
                Close & Browse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerHome;
