import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ShoppingBag, Plus, Edit2, Trash2, Sliders, ListOrdered, ArrowLeft, RefreshCw, X, Check } from 'lucide-react';
import { storeService } from '../services/storeService';
import { productService } from '../services/productService';

const ShopkeeperProducts = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: '',
    isActive: true,
  });
  const [submitError, setSubmitError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // 1. Fetch store and products
  const loadStoreAndProducts = async () => {
    try {
      const storeData = await storeService.getShopkeeperStore();
      setStore(storeData);

      const productsData = await productService.getProducts();
      setProducts(productsData);

    } catch (err) {
      setError(err.message || 'Error loading inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/shopkeeper/login');
      return;
    }
    if (user.role !== 'shopkeeper') {
      navigate('/');
      return;
    }
    loadStoreAndProducts();
  }, [user, token]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Snacks',
      stock: '20',
      image: '',
      isActive: true,
    });
    setSubmitError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category || 'Snacks',
      stock: product.stock.toString(),
      image: product.image || '',
      isActive: product.isActive,
    });
    setSubmitError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock, 10),
        image: formData.image || undefined,
        isActive: formData.isActive,
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, payload);
        alert('Product updated successfully!');
      } else {
        await productService.createProduct(payload);
        alert('Product created successfully!');
      }

      setShowModal(false);
      loadStoreAndProducts();
    } catch (err) {
      setSubmitError(err.message || 'Failed to save product');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter((p) => p._id !== productId));
      alert('Product deleted successfully');
    } catch (err) {
      alert(err.message || 'Error deleting product');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-3" size={28} />
        <p className="text-xs text-slate-500 font-medium">Loading inventory...</p>
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
              <span className="text-3xs text-emerald-400 font-semibold">Inventory Manager</span>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-3xs font-extrabold transition flex items-center gap-1 shadow-xs"
          >
            <Plus size={13} />
            <span>Add Item</span>
          </button>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-800/90 p-1 rounded-xl text-3xs font-bold text-center">
          <Link
            to="/shopkeeper/dashboard"
            className="py-1.5 rounded-lg text-slate-400 hover:text-white transition flex items-center justify-center gap-1"
          >
            <span>Orders</span>
          </Link>
          <button
            disabled
            className="py-1.5 rounded-lg bg-emerald-600 text-white shadow-xs"
          >
            Inventory ({products.length})
          </button>
          <Link
            to="/shopkeeper/config"
            className="py-1.5 rounded-lg text-slate-400 hover:text-white transition flex items-center justify-center gap-1"
          >
            <span>Config</span>
          </Link>
        </div>
      </header>

      {/* Sidebar navigation (hidden on mobile) */}
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

            <button
              disabled
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs"
            >
              <ShoppingBag size={16} />
              <span>Product Inventory</span>
            </button>

            <Link
              to="/shopkeeper/config"
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <Sliders size={16} />
              <span>Store Configuration</span>
            </Link>
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800 text-xs text-slate-400">
          <p className="font-bold text-white text-xs">{store?.name || 'My Store'}</p>
          <p className="text-3xs text-emerald-400 font-semibold mt-0.5">Active Inventory Desk</p>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-grow p-3.5 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">Product Inventory</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage details and stock availability of your items.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition items-center gap-1.5 shadow-xs shadow-emerald-600/20 active:scale-98"
          >
            <Plus size={15} />
            <span>Add New Item</span>
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl border border-rose-200 mb-6 text-xs">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl shadow-card p-8">
            <ShoppingBag className="text-slate-300 mx-auto mb-3" size={36} />
            <h3 className="font-extrabold text-slate-800 text-sm">Inventory is Empty</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
              Add your first campus product item to begin accepting orders.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-400 font-extrabold uppercase tracking-wider text-3xs">
                    <th className="p-4">Item</th>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">In Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-11 h-11 object-cover rounded-xl bg-slate-50 border border-slate-200"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100';
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{product.name}</p>
                          <p className="text-slate-400 text-3xs mt-0.5 line-clamp-1 max-w-sm">{product.description}</p>
                        </div>
                      </td>
                      <td className="p-4 capitalize text-slate-600 font-semibold">{product.category}</td>
                      <td className="p-4 font-extrabold text-slate-900">₹{product.price}</td>
                      <td className="p-4">
                        <span className={`font-bold ${product.stock <= 5 ? 'text-amber-600' : 'text-slate-700'}`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase border ${
                          product.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {product.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="text-slate-400 hover:text-emerald-700 p-1.5 rounded-lg transition hover:bg-emerald-50"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200/80 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  {editingProduct ? 'Edit Product Item' : 'Add New Product'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                  <X size={18} />
                </button>
              </div>

              {submitError && (
                <div className="m-5 bg-rose-50 text-rose-700 px-4 py-2.5 rounded-xl text-xs border border-rose-200">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Masala Maggi Noodles"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Short summary of item..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.5"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Initial Stock</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl text-xs p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                    >
                      <option value="Snacks">Snacks</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Instant Food">Instant Food</option>
                      <option value="Stationery">Stationery</option>
                      <option value="Personal Care">Personal Care</option>
                      <option value="Dairy">Dairy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Active Status</label>
                    <select
                      value={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                      className="w-full border border-slate-200 rounded-xl text-xs p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                    >
                      <option value="true">Active (Visible)</option>
                      <option value="false">Hidden (Draft)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs shadow-emerald-600/20"
                  >
                    {submitLoading ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ShopkeeperProducts;
