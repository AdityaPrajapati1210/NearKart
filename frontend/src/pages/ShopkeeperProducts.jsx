import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ShoppingBag, Plus, Edit2, Trash2, Sliders, ListOrdered, ArrowLeft, RefreshCw, X } from 'lucide-react';
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
  const [editingProduct, setEditingProduct] = useState(null); // null means adding
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
      // Fetch store
      const storeData = await storeService.getShopkeeperStore();
      setStore(storeData);

      // Fetch products
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
      stock: '10',
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
      category: product.category,
      stock: product.stock.toString(),
      image: product.image || '',
      isActive: product.isActive,
    });
    setSubmitError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitLoading(true);

    try {
      const priceNum = parseFloat(formData.price);
      const stockNum = parseInt(formData.stock);

      if (isNaN(priceNum) || priceNum < 0) throw new Error('Invalid price value');
      if (isNaN(stockNum) || stockNum < 0) throw new Error('Invalid stock value');

      const payload = {
        ...formData,
        price: priceNum,
        stock: stockNum,
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, payload);
      } else {
        await productService.addProduct(payload);
      }

      // Success - reload products list
      setShowModal(false);
      loadStoreAndProducts();
      alert(editingProduct ? 'Product updated successfully' : 'Product added successfully');
    } catch (err) {
      setSubmitError(err.message || 'Error processing request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action is irreversible.')) {
      return;
    }

    try {
      await productService.deleteProduct(productId);
      alert('Product successfully removed');
      loadStoreAndProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <RefreshCw className="animate-spin text-gray-800 mx-auto mb-4" size={32} />
        <p className="text-gray-500">Loading Product Inventory...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar navigation */}
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

            <button
              disabled
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white shadow-sm"
            >
              <ShoppingBag size={18} />
              <span>Product Inventory</span>
            </button>

            <Link
              to="/shopkeeper/config"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <Sliders size={18} />
              <span>Delivery Radius</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-grow p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Product Inventory</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage details and stock availability of your items.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
          >
            <Plus size={16} />
            <span>Add New Item</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-100 mb-6">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-150 rounded-xl shadow-xs">
            <ShoppingBag className="text-gray-300 mx-auto mb-3" size={40} />
            <h3 className="font-bold text-gray-800">Inventory is Empty</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">Add your first campus product item to begin accepting orders.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-xxs">
                  <th className="p-4 w-16">Image</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-lg bg-gray-55 border border-gray-100"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100';
                        }}
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{product.name}</p>
                        <p className="text-gray-400 text-xxs mt-0.5 line-clamp-1 max-w-sm">{product.description}</p>
                      </div>
                    </td>
                    <td className="p-4 capitalize">{product.category}</td>
                    <td className="p-4 font-bold text-gray-900 text-sm">₹{product.price}</td>
                    <td className="p-4">
                      <span className={`font-bold ${product.stock <= 5 ? 'text-amber-500' : 'text-gray-700'}`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-3xs font-extrabold uppercase ${
                        product.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {product.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="text-gray-400 hover:text-green-600 p-1.5 rounded transition hover:bg-gray-100"
                          title="Edit Product"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded transition hover:bg-gray-100"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal form */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xxs">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-150 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-sm">
                  {editingProduct ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={18} />
                </button>
              </div>

              {submitError && (
                <div className="m-5 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg text-xs border border-red-100">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Maggi Noodles"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg text-xs p-2 focus:outline-none focus:border-green-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Describe snack contents / volume..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg text-xs p-2 focus:outline-none focus:border-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="30"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg text-xs p-2 focus:outline-none focus:border-green-500"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Initial Stock</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="15"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg text-xs p-2 focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Category & Image */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg text-xs p-2 bg-white focus:outline-none focus:border-green-500"
                    >
                      <option value="Snacks">Snacks</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Active Status</label>
                    <select
                      value={formData.isActive ? 'yes' : 'no'}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'yes' }))}
                      className="w-full border border-gray-200 rounded-lg text-xs p-2 bg-white focus:outline-none focus:border-green-500"
                    >
                      <option value="yes">Visible (Active)</option>
                      <option value="no">Hidden (Disabled)</option>
                    </select>
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg text-xs p-2 focus:outline-none focus:border-green-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-2.5 rounded-lg text-xs transition shadow-sm"
                >
                  {submitLoading ? 'Saving...' : editingProduct ? 'Save Modifications' : 'Create Item'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ShopkeeperProducts;
