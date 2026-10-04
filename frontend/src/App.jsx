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
    <div className="flex flex-col min-h-screen">
      {!isBusinessPortal && (
        <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between h-16 items-center">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl font-extrabold text-green-600 tracking-tight">Near</span>
                <span className="text-2xl font-extrabold text-gray-800 tracking-tight">Kart</span>
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">Hyperlocal</span>
              </Link>

              {/* Navigation items */}
              <div className="flex items-center space-x-6">
                <Link to="/" className="text-gray-600 hover:text-green-600 font-medium">Store</Link>
                {user && user.role !== 'delivery' && (
                  <Link to="/orders" className="text-gray-600 hover:text-green-600 font-medium flex items-center gap-1">
                    <Package size={18} />
                    <span>My Orders</span>
                  </Link>
                )}

                {/* Cart link */}
                <Link to="/cart" className="relative p-2 text-gray-600 hover:text-green-600">
                  <ShoppingCart size={22} />
                  {totalCartItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
                      {totalCartItems}
                    </span>
                  )}
                </Link>

                {/* Auth section */}
                {user ? (
                  <div className="flex items-center space-x-4">
                    <div className="hidden sm:flex flex-col items-end text-xs">
                      <span className="font-semibold text-gray-700">{user.name}</span>
                      <span className="text-gray-400 capitalize">{user.role}</span>
                    </div>
                    {user.role === 'shopkeeper' && (
                      <Link to="/shopkeeper/dashboard" className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-100 flex items-center gap-1">
                        <StoreIcon size={16} />
                        <span>Store Portal</span>
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-amber-100 flex items-center gap-1">
                        <ShieldAlert size={16} />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    {user.role === 'delivery' && (
                      <Link to="/delivery/dashboard" className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-100 flex items-center gap-1">
                        <Package size={16} />
                        <span>Rider Console</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="text-gray-500 hover:text-red-500 p-2"
                      title="Logout"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Page Content */}
      <main className="flex-grow">
        <Routes>
          {/* Customer paths */}
          <Route path="/" element={<CustomerHome addToCart={addToCart} />} />
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

      {/* Footer */}
      {!isBusinessPortal && (
        <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div>
              <p className="font-bold text-white text-lg">NearKart</p>
              <p className="text-xs text-gray-500 mt-1">Campus Hyperlocal Delivery System. Real-time, location-validated ordering.</p>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link to="/" className="hover:text-white">Store Directory</Link>
              <Link to="/shopkeeper/login" className="hover:text-white font-semibold text-green-400">Shopkeeper Login</Link>
              <Link to="/admin" className="hover:text-white">Admin Panel</Link>
            </div>
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} NearKart. All rights reserved.</p>
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
