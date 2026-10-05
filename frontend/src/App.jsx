import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import CustomerHome from './pages/CustomerHome';
import CustomerAuth from './pages/CustomerAuth';
import CartPage from './pages/CartPage';
import CustomerOrders from './pages/CustomerOrders';
import ShopkeeperDashboard from './pages/ShopkeeperDashboard';
import ShopkeeperProducts from './pages/ShopkeeperProducts';
import ShopkeeperConfig from './pages/ShopkeeperConfig';
import AdminPortal from './pages/AdminPortal';
import DeliveryDashboard from './pages/DeliveryDashboard';
import { ShoppingCart, User as UserIcon, LogOut, Package, Store as StoreIcon, ShieldAlert } from 'lucide-react';

const AppContent = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Local storage cart synchronization
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('nk_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('nk_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item._id === product._id);
      if (exists) {
        if (exists.quantity >= product.stock) {
          alert(`Cannot add more. Only ${product.stock} items left in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, store: 'MAIN_STORE' }];
    });
  };

  const updateQuantity = (productId, newQty, maxStock) => {
    if (newQty > maxStock) {
      alert(`Only ${maxStock} items left in stock.`);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, quantity: Math.max(1, newQty) } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

  // Enforce rider-only routing restriction
  useEffect(() => {
    if (user && user.role === 'delivery' && !location.pathname.startsWith('/delivery')) {
      navigate('/delivery/dashboard');
    }
  }, [user, location.pathname, navigate]);

  // Hide main navbar on shopkeeper, delivery, or admin portals for a dedicated business UI
  const isBusinessPortal = 
    location.pathname.startsWith('/shopkeeper') || 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/delivery') ||
    (user && user.role === 'delivery');

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      {!isBusinessPortal && (
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs sticky top-0 z-50 transition-all">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between h-16 items-center gap-4">
              {/* Logo & Campus Tag */}
              <div className="flex items-center gap-3">
                <Link to="/" className="flex items-center gap-2 group">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <ShoppingCart size={18} className="stroke-[2.5]" />
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-emerald-700 transition">Near</span>
                    <span className="text-xl font-extrabold text-emerald-600 tracking-tight">Kart</span>
                  </div>
                </Link>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-2xs font-bold px-2 py-0.5 rounded-full border border-emerald-200/60 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Campus Express
                </span>
              </div>

              {/* Navigation items */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    location.pathname === '/' ? 'text-emerald-700 bg-emerald-50/80 font-bold' : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
                  }`}
                >
                  Store
                </Link>

                {user && user.role !== 'delivery' && (
                  <Link
                    to="/orders"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      location.pathname === '/orders' ? 'text-emerald-700 bg-emerald-50/80 font-bold' : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
                    }`}
                  >
                    <Package size={15} />
                    <span>My Orders</span>
                  </Link>
                )}

                {/* Cart link */}
                <Link
                  to="/cart"
                  className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-200 transition shadow-2xs"
                >
                  <ShoppingCart size={16} className="text-emerald-600" />
                  <span className="hidden sm:inline">Cart</span>
                  {totalCartItems > 0 ? (
                    <span className="bg-emerald-600 text-white rounded-full text-3xs font-extrabold px-1.5 py-0.2 min-w-4 text-center">
                      {totalCartItems}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-2xs font-normal">0</span>
                  )}
                </Link>

                {/* Auth section */}
                {user ? (
                  <div className="flex items-center space-x-2 sm:space-x-3 pl-1 sm:pl-2 border-l border-slate-200">
                    <div className="hidden md:flex flex-col items-end text-right">
                      <span className="font-bold text-xs text-slate-800 leading-tight">{user.name}</span>
                      <span className="text-3xs text-emerald-700 font-semibold uppercase tracking-wider">{user.role}</span>
                    </div>

                    {user.role === 'shopkeeper' && (
                      <Link
                        to="/shopkeeper/dashboard"
                        className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                      >
                        <StoreIcon size={14} />
                        <span className="hidden sm:inline">Store Desk</span>
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                      >
                        <ShieldAlert size={14} />
                        <span className="hidden sm:inline">Admin Panel</span>
                      </Link>
                    )}
                    {user.role === 'delivery' && (
                      <Link
                        to="/delivery/dashboard"
                        className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                      >
                        <Package size={14} />
                        <span className="hidden sm:inline">Rider Console</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Logout"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs shadow-emerald-600/20"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Page Content */}
      <main className="flex-grow">
        <Routes>
          {/* Customer paths */}
          <Route path="/" element={<CustomerHome addToCart={addToCart} cart={cart} />} />
          <Route path="/login" element={<CustomerAuth />} />
          <Route path="/register" element={<CustomerAuth />} />
          <Route
            path="/cart"
            element={
              <CartPage
                cart={cart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                clearCart={clearCart}
              />
            }
          />
          <Route path="/orders" element={<CustomerOrders />} />

          {/* Shopkeeper business paths */}
          <Route path="/shopkeeper/login" element={<CustomerAuth />} />
          <Route path="/shopkeeper/dashboard" element={<ShopkeeperDashboard />} />
          <Route path="/shopkeeper/products" element={<ShopkeeperProducts />} />
          <Route path="/shopkeeper/config" element={<ShopkeeperConfig />} />

          {/* Admin panel */}
          <Route path="/admin" element={<AdminPortal />} />

          {/* Delivery console */}
          <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
        </Routes>
      </main>

      {/* Modern E-commerce Footer */}
      {!isBusinessPortal && (
        <footer className="bg-slate-900 text-slate-400 pt-10 pb-8 border-t border-slate-800 text-xs">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                    NK
                  </div>
                  <span className="text-base font-extrabold text-white tracking-tight">NearKart Express</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                  Campus-exclusive hyperlocal ordering ecosystem. Geofence-verified live delivery from campus canteen directly to student hostels.
                </p>
                <div className="flex items-center gap-3 text-2xs text-slate-400 pt-1">
                  <span className="inline-flex items-center gap-1 text-emerald-400">⚡ 10-15 min dispatch</span>
                  <span>•</span>
                  <span>🔒 OTP-secured handover</span>
                  <span>•</span>
                  <span>📍 Campus zoned</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-200 uppercase tracking-wider text-2xs">Quick Links</p>
                <ul className="space-y-1.5 text-xs">
                  <li><Link to="/" className="hover:text-emerald-400 transition">Store Catalog</Link></li>
                  <li><Link to="/orders" className="hover:text-emerald-400 transition">Order Tracking</Link></li>
                  <li><Link to="/cart" className="hover:text-emerald-400 transition">View Shopping Cart</Link></li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-200 uppercase tracking-wider text-2xs">Portals</p>
                <ul className="space-y-1.5 text-xs">
                  <li><Link to="/shopkeeper/login" className="hover:text-emerald-400 transition font-semibold text-emerald-400">Merchant Store Desk</Link></li>
                  <li><Link to="/delivery/dashboard" className="hover:text-emerald-400 transition">Delivery Console</Link></li>
                  <li><Link to="/admin" className="hover:text-emerald-400 transition">System Admin Panel</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-2xs text-slate-500">
              <p>&copy; {new Date().getFullYear()} NearKart Hyperlocal Inc. Built for college campuses.</p>
              <div className="flex gap-4">
                <span>Fast Dispatch</span>
                <span>•</span>
                <span>Verified Freshness</span>
                <span>•</span>
                <span>Student Friendly Pricing</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
