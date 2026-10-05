import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, Phone, User, KeyRound, Info, ShoppingCart, ArrowRight } from 'lucide-react';

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
        const assignedRole = isShopkeeperRoute ? 'shopkeeper' : 'customer';
        await register(name, email, mobile, password, assignedRole);
      } else {
        if (!identifier || !password) {
          throw new Error('Please enter credentials');
        }
        const loggedUser = await login(identifier, password);
        if (isShopkeeperRoute && loggedUser.role !== 'shopkeeper' && loggedUser.role !== 'admin') {
          throw new Error('This account is registered as a customer. Please log in through the student store.');
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
    <div className="max-w-md mx-auto my-10 px-4">
      <div className="bg-white p-7 sm:p-8 rounded-2xl shadow-card border border-slate-200/80">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 items-center justify-center text-white shadow-xs shadow-emerald-500/20 mb-3">
            <ShoppingCart size={22} className="stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {isShopkeeperRoute ? 'Merchant Store Desk' : 'Welcome to NearKart'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {isRegister
              ? `Create your ${isShopkeeperRoute ? 'merchant' : 'campus'} account`
              : `Sign in to access your ${isShopkeeperRoute ? 'store console' : 'college ordering'}`}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 px-4 py-2.5 rounded-xl text-xs mb-4 border border-rose-200 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              {/* Name */}
              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Aditya Prajapati"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 transition"
                  />
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 transition"
                  />
                </div>
              </div>
            </>
          )}

          {!isRegister && (
            <div>
              <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Email or Mobile</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="student@college.edu or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 transition"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-xl text-white font-bold transition text-xs shadow-xs active:scale-98 flex items-center justify-center gap-1.5 ${
              isShopkeeperRoute
                ? 'bg-slate-900 hover:bg-slate-800'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            } ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            <span>{loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Toggle Links */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {!isShopkeeperRoute ? (
            <div>
              {isRegister ? (
                <p>
                  Already have an account?{' '}
                  <Link to="/login" className="text-emerald-700 font-bold hover:underline">
                    Sign in here
                  </Link>
                </p>
              ) : (
                <p>
                  New to NearKart?{' '}
                  <Link to="/register" className="text-emerald-700 font-bold hover:underline">
                    Create student account
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <div>
              {isRegister ? (
                <p>
                  Already registered?{' '}
                  <Link to="/shopkeeper/login" className="text-slate-800 font-bold hover:underline">
                    Login here
                  </Link>
                </p>
              ) : (
                <p>
                  Store manager desk.{' '}
                  <Link to="/shopkeeper/login" className="text-slate-800 font-bold hover:underline">
                    Sign in above
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Quick Demo Credentials Box */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
            <div className="flex gap-2 items-center mb-2">
              <Info size={14} className="text-emerald-600 shrink-0" />
              <p className="text-2xs font-extrabold uppercase tracking-wide text-slate-700">Quick Test Autofill</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loadPreset('customer')}
                className="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 px-2 py-1.5 rounded-lg text-3xs font-bold transition shadow-xs"
              >
                👤 Customer
              </button>
              <button
                type="button"
                onClick={() => loadPreset('shopkeeper')}
                className="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 px-2 py-1.5 rounded-lg text-3xs font-bold transition shadow-xs"
              >
                🏪 Shopkeeper
              </button>
              <button
                type="button"
                onClick={() => loadPreset('delivery')}
                className="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 px-2 py-1.5 rounded-lg text-3xs font-bold transition shadow-xs"
              >
                🛵 Rider
              </button>
              <button
                type="button"
                onClick={() => loadPreset('admin')}
                className="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 px-2 py-1.5 rounded-lg text-3xs font-bold transition shadow-xs"
              >
                🛡️ Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
