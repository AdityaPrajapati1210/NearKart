import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, Phone, User, KeyRound, Info } from 'lucide-react';

const CustomerAuth = () => {
  const { login, register, user, error: authError } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isShopkeeperRoute = location.pathname.startsWith('/shopkeeper');
  const isRegister = location.pathname.endsWith('/register');

  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState(''); // email or mobile for login
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (isShopkeeperRoute) {
        if (user.role === 'shopkeeper' || user.role === 'admin') {
          navigate('/shopkeeper/dashboard');
        } else {
          navigate('/');
        }
      } else {
        if (user.role === 'shopkeeper') {
          navigate('/shopkeeper/dashboard');
        } else if (user.role === 'delivery') {
          navigate('/delivery/dashboard');
        } else {
          navigate('/');
        }
      }
    }
  }, [user, navigate, isShopkeeperRoute]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name || !email || !mobile || !password) {
          throw new Error('All fields are required');
        }
        // Force register role based on portal context
        const assignedRole = isShopkeeperRoute ? 'shopkeeper' : 'customer';
        await register(name, email, mobile, password, assignedRole);
      } else {
        if (!identifier || !password) {
          throw new Error('Please enter credentials');
        }
        const loggedUser = await login(identifier, password);
        if (isShopkeeperRoute && loggedUser.role !== 'shopkeeper' && loggedUser.role !== 'admin') {
          throw new Error('This account is registered as a customer. Please use a store owner account or visit the Customer portal.');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (type) => {
    if (type === 'customer') {
      setIdentifier('rahul@example.com');
      setPassword('123456');
    } else if (type === 'shopkeeper') {
      setIdentifier('shopkeeper@nearkart.com');
      setPassword('123456');
    } else if (type === 'delivery') {
      setIdentifier('rider1@gmail.com');
      setPassword('123456');
    } else if (type === 'admin') {
      setIdentifier('test@example.com');
      setPassword('123456');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        {/* Banner */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            {isShopkeeperRoute ? 'Shopkeeper Portal' : 'NearKart Campus'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isRegister
              ? `Create your ${isShopkeeperRoute ? 'shopkeeper' : 'customer'} account`
              : `Sign in to access your ${isShopkeeperRoute ? 'store manager' : 'ordering'}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="E.g. Aditya Prajapati"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Mobile Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="10 digit number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            </>
          )}

          {!isRegister && (
            /* Identifier (Email/Mobile) */
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email or Mobile Number</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="customer@nearkart.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-white font-semibold transition text-sm ${
              isShopkeeperRoute
                ? 'bg-gray-800 hover:bg-gray-900'
                : 'bg-green-600 hover:bg-green-700'
            } ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle Links */}
        <div className="mt-6 text-center text-xs text-gray-500 space-y-2">
          {!isShopkeeperRoute ? (
            <div>
              {isRegister ? (
                <p>
                  Already have a student account?{' '}
                  <Link to="/login" className="text-green-600 font-semibold hover:underline">
                    Login here
                  </Link>
                </p>
              ) : (
                <p>
                  New customer?{' '}
                  <Link to="/register" className="text-green-600 font-semibold hover:underline">
                    Register here
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <div>
              {isRegister ? (
                <p>
                  Already have a shopkeeper account?{' '}
                  <Link to="/shopkeeper/login" className="text-gray-700 font-semibold hover:underline">
                    Login here
                  </Link>
                </p>
              ) : (
                <p>
                  Want to register a store? Store owner accounts are created via Admin Panel or{' '}
                  <Link to="/shopkeeper/login" className="text-gray-700 font-semibold hover:underline">
                    sign up here
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Development Helper Box */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="bg-amber-50 rounded-lg p-4 text-amber-800 border border-amber-100">
            <div className="flex gap-2 items-start mb-2.5">
              <Info size={16} className="mt-0.5 shrink-0" />
              <p className="text-xs font-bold uppercase tracking-wide">Developer Testing Helper</p>
            </div>
            <p className="text-xs text-amber-700 mb-3">
              NearKart seeds default testing accounts into the memory database. Click to autofill credentials:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loadPreset('customer')}
                className="bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 px-2 py-1.5 rounded text-xxs font-semibold shadow-xs"
              >
                Autofill Customer
              </button>
              <button
                type="button"
                onClick={() => loadPreset('shopkeeper')}
                className="bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 px-2 py-1.5 rounded text-xxs font-semibold shadow-xs"
              >
                Autofill Shop
              </button>
              <button
                type="button"
                onClick={() => loadPreset('delivery')}
                className="bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 px-2 py-1.5 rounded text-xxs font-semibold shadow-xs"
              >
                Autofill Rider
              </button>
              <button
                type="button"
                onClick={() => loadPreset('admin')}
                className="bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 px-2 py-1.5 rounded text-xxs font-semibold shadow-xs"
              >
                Autofill Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
