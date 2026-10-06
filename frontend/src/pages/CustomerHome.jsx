import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Compass, AlertCircle, ShoppingCart, Clock, Phone, ShieldCheck, CheckCircle2, Sparkles, ChevronRight, Store } from 'lucide-react';
import { storeService } from '../services/storeService';
import { productService } from '../services/productService';

const CustomerHome = ({ addToCart, cart = [] }) => {
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showStoreInfoModal, setShowStoreInfoModal] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [addedItemKey, setAddedItemKey] = useState(null);

  // 0. Location-based display filter parameters
  const [clientCoords, setClientCoords] = useState(() => {
    try {
      const saved = localStorage.getItem('nk_client_location');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Calculate live cart total for floating mobile bar
  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalCartPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

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

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedItemKey(product._id);
    setTimeout(() => {
      setAddedItemKey(null);
    }, 800);
  };

  const isStoreOpen = store?.isOpen ?? true;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-6 pb-24 md:pb-8">
      {/* Mobile Location & Store Quick Header (Visible only on mobile) */}
      <div className="lg:hidden flex items-center justify-between gap-2 bg-white rounded-xl p-2.5 mb-3 border border-slate-200/80 shadow-xs">
        <button
          onClick={() => setShowLocationModal(true)}
          className="flex items-center gap-1.5 text-left flex-grow min-w-0"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin size={14} />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1">
              <span className="text-2xs font-extrabold text-slate-800">Delivering to</span>
              <span className="text-3xs text-emerald-700 font-bold uppercase">Change ▾</span>
            </div>
            <p className="text-3xs text-slate-500 truncate">
              {clientCoords ? `${clientCoords.lat.toFixed(3)}, ${clientCoords.lng.toFixed(3)} (Active)` : 'Campus Central Zone'}
            </p>
          </div>
        </button>

        <button
          onClick={() => setShowStoreInfoModal(true)}
          className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg shrink-0 text-3xs font-bold text-slate-700"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isStoreOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span>{store?.name ? store.name.slice(0, 12) : 'Store'}</span>
          <span className="text-slate-400">ℹ️</span>
        </button>
      </div>

      {/* Hero Banner (Compact on mobile, expanded on desktop) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-4 sm:p-7 text-white shadow-card mb-4 sm:mb-6">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 sm:space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-emerald-900/60 text-emerald-200 text-3xs sm:text-2xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider backdrop-blur-md">
              <Sparkles size={11} className="text-amber-300" />
              <span>Campus Hyperlocal Express</span>
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-white">
              Instant Hostel Delivery in 10-15 Mins
            </h1>
            <p className="text-2xs sm:text-xs text-emerald-100/90 leading-relaxed line-clamp-2 sm:line-clamp-none">
              Order fresh canteen snacks, beverages, stationery, and daily hostel essentials with verified OTP handover.
            </p>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 text-3xs sm:text-2xs font-semibold text-emerald-100">
              <span className="bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-xs">
                ⚡ 10-15m
              </span>
              <span className="bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-xs">
                🛡️ OTP Secured
              </span>
              <span className="bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-xs">
                📍 Campus Geofence
              </span>
            </div>
          </div>

          <div className="hidden sm:flex bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-xs items-center gap-3 shrink-0">
            <Compass className="animate-spin text-emerald-200" size={24} />
            <div>
              <p className="font-bold text-white text-xs">Live Campus Zone</p>
              <p className="text-emerald-200 text-3xs font-medium">10-15 Min Express Delivery</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 px-3.5 py-2.5 rounded-xl border border-rose-200 mb-4 text-xs font-medium flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: On mobile, products come first! On desktop, 4-col with sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Desktop Sidebar (Hidden on mobile for fast shopping experience) */}
        <div className="hidden lg:block lg:col-span-1 space-y-4">
          {/* Shop Highlight Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-3.5">
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="text-3xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Official Merchant
                </span>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight mt-1">
                  {store?.name || 'NearKart Store'}
                </h3>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-2xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isStoreOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isStoreOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {isStoreOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {store?.description || 'Instant groceries, campus canteen snacks, cold drinks, and daily essentials.'}
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">{store?.location?.address || 'Campus Central Store, Delhi'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-emerald-600 shrink-0" />
                <span>{store?.estimatedDeliveryTime || '10-15 Mins Delivery'}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>Radius: {store?.deliveryRadius || 2} km Campus Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-emerald-600 shrink-0" />
                <span>Helpline: {store?.phone || '9876543211'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-3xs font-bold text-slate-600">
              <span className="bg-slate-100 px-2 py-0.5 rounded">💵 COD Available</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded">💳 UPI / Online</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">⚡ 10m Express</span>
            </div>
          </div>

          {/* Delivery Location Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-600" />
                <span>Delivery Spot</span>
              </h4>
              <button
                onClick={() => setShowLocationModal(true)}
                className="text-2xs text-emerald-700 hover:text-emerald-800 font-extrabold border border-emerald-200 hover:border-emerald-300 px-2 py-0.5 rounded-md bg-emerald-50/60 transition"
              >
                Change
              </button>
            </div>

            {clientCoords ? (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-2xs space-y-1 font-medium">
                <div className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 size={13} />
                  <span>Delivery Zone Active</span>
                </div>
                <p className="text-slate-500 font-mono text-3xs truncate">
                  {clientCoords.lat.toFixed(4)}, {clientCoords.lng.toFixed(4)}
                </p>
              </div>
            ) : (
              <div className="text-2xs text-slate-500 space-y-2">
                <p>Location not detected yet. Set location for instant range verification.</p>
                <button
                  onClick={handleUseGPS}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition shadow-xs"
                >
                  📡 Detect My Location
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products Catalog Area: Full width on mobile, 3-cols on desktop */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search bar & Store Status Header */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  {store?.name || 'NearKart Store'}
                </h2>
                <p className="text-3xs sm:text-xs text-slate-400">
                  {products.length} products available for campus delivery
                </p>
              </div>
              {!isStoreOpen && (
                <span className="flex items-center gap-1 text-3xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 font-bold shrink-0">
                  <AlertCircle size={11} />
                  <span>Closed</span>
                </span>
              )}
            </div>

            {/* Mobile-Friendly Search Bar */}
            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Maggi, chips, cold drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 transition"
              />
            </div>
          </div>

          {/* Category Filter Pills (Horizontal Scrollable on mobile) */}
          {categories.length > 1 && (
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-2xs sm:text-xs font-semibold whitespace-nowrap transition border shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Products List: MINIMUM 2 PER ROW ON MOBILE (grid-cols-2) */}
          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-52 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
              <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShoppingCart size={18} />
              </div>
              <p className="text-slate-600 text-xs font-bold">No products found</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="mt-3 text-2xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-bold border border-emerald-200"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
              {products.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isRecentlyAdded = addedItemKey === product._id;

                return (
                  <div
                    key={product._id}
                    className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card transition duration-200 overflow-hidden flex flex-col justify-between"
                  >
                    {/* Compact Image Frame */}
                    <div className="relative h-28 sm:h-36 md:h-40 bg-slate-50 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
                        }}
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center">
                          <span className="text-white font-extrabold text-3xs uppercase px-2 py-0.5 bg-rose-600 rounded">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      {!isOutOfStock && product.stock <= 5 && (
                        <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-4xs sm:text-3xs font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          {product.stock} left!
                        </span>
                      )}
                      {product.offerPrice && product.offerPrice < product.price && (
                        <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-4xs sm:text-3xs font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          {Math.round(((product.price - product.offerPrice) / product.price) * 100)}% OFF
                        </span>
                      )}
                    </div>

                    {/* Compact Details for 2-column mobile layout */}
                    <div className="p-2.5 sm:p-3 flex-grow flex flex-col justify-between space-y-2">
                      <div>
                        <span className="text-4xs sm:text-3xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          {product.category || 'General'}
                        </span>
                        <h4 className="font-bold text-slate-800 mt-1 line-clamp-1 text-xs sm:text-sm group-hover:text-emerald-700 transition">
                          {product.name}
                        </h4>
                        <p className="text-3xs text-slate-400 line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                      </div>

                      {/* Price and Add button */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 gap-1">
                        <div>
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-base font-extrabold text-slate-900">
                              ₹{product.offerPrice && product.offerPrice > 0 && product.offerPrice < product.price ? product.offerPrice : product.price}
                            </span>
                            {product.offerPrice && product.offerPrice > 0 && product.offerPrice < product.price && (
                              <span className="text-3xs text-slate-400 line-through">₹{product.price}</span>
                            )}
                          </div>
                        </div>

                        <button
                          disabled={isOutOfStock || !isStoreOpen}
                          onClick={() => handleAddToCart(product)}
                          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-2xs sm:text-xs font-bold transition active:scale-95 ${
                            isOutOfStock || !isStoreOpen
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : isRecentlyAdded
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20'
                          }`}
                        >
                          <ShoppingCart size={11} className="hidden sm:inline" />
                          <span>{isRecentlyAdded ? '✓ Added' : '+ ADD'}</span>
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

      {/* Floating Sticky Mobile Cart Bar (When Cart Has Items) */}
      {totalCartItems > 0 && (
        <div className="md:hidden fixed bottom-3 inset-x-3 z-40 animate-in slide-in-from-bottom duration-200">
          <Link
            to="/cart"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-3.5 shadow-hover flex items-center justify-between font-bold border border-emerald-500/30"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <ShoppingCart size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black">{totalCartItems} {totalCartItems === 1 ? 'Item' : 'Items'} • ₹{totalCartPrice}</p>
                <p className="text-3xs text-emerald-100 font-medium">Extra ₹10 campus delivery fee included</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs bg-white text-emerald-800 px-3 py-1.5 rounded-xl shadow-xs">
              <span>View Cart</span>
              <ChevronRight size={14} />
            </div>
          </Link>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 text-center space-y-3.5 border border-slate-100">
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-lg">
              📍
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-sm">Delivery Location</h3>
              <p className="text-slate-500 text-xs">
                NearKart verifies coordinates for instant campus hostel delivery.
              </p>
            </div>

            {gpsError && (
              <div className="bg-rose-50 text-rose-800 border border-rose-200 text-3xs p-2.5 rounded-xl text-left font-medium">
                <p className="font-bold">⚠️ GPS Note: {gpsError}</p>
                <p className="text-slate-500 mt-0.5">You can use Campus Central Hub below.</p>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                onClick={handleUseGPS}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition shadow-xs"
              >
                📡 Detect My Live GPS
              </button>
              <button
                onClick={handleUseCampusDefault}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl text-xs transition"
              >
                🏫 Campus Central Zone
              </button>
              <button
                onClick={() => setShowLocationModal(false)}
                className="w-full text-slate-400 hover:text-slate-600 font-semibold py-1 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Store Info Sheet Modal */}
      {showStoreInfoModal && store && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-3 border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-3xs font-extrabold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Official Merchant
                </span>
                <h3 className="text-base font-extrabold text-slate-800 mt-1">{store.name}</h3>
              </div>
              <span className={`text-3xs font-extrabold px-2 py-0.5 rounded-full uppercase ${
                isStoreOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isStoreOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">{store.description}</p>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">{store.location?.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-emerald-600 shrink-0" />
                <span>{store.estimatedDeliveryTime || '10-15 Mins'}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>Delivery Radius: {store.deliveryRadius} km</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-emerald-600 shrink-0" />
                <span>Helpline: {store.phone}</span>
              </div>
            </div>

            <button
              onClick={() => setShowStoreInfoModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerHome;
