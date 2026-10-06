import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store,
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  Sliders,
  ListOrdered,
  ArrowLeft,
  RefreshCw,
  X,
  Check,
  Upload,
  Image as ImageIcon,
  Tag,
  Search,
  Filter,
  AlertCircle,
  Percent,
  Layers,
  Sparkles
} from 'lucide-react';
import { storeService } from '../services/storeService';
import { productService } from '../services/productService';

// Comprehensive category list covering campus, grocery, daily essentials and retail
export const PRODUCT_CATEGORIES = [
  'Snacks & Munchies',
  'Beverages & Cold Drinks',
  'Tea, Coffee & Health Drinks',
  'Instant & Packaged Food',
  'Dairy, Bread & Eggs',
  'Fruits & Fresh Vegetables',
  'Sweets, Chocolates & Desserts',
  'Bakery, Cakes & Cookies',
  'Groceries & Kitchen Staples',
  'Stationery & Study Supplies',
  'Personal Care & Hygiene',
  'Pharmacy & First Aid',
  'Electronics & Mobile Accessories',
  'Cleaning & Household Essentials',
  'Hostel & Dorm Essentials',
  'Other / Custom Category'
];

const ShopkeeperProducts = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    offerPrice: '',
    category: 'Snacks & Munchies',
    customCategory: '',
    stock: '20',
    imageUrl: '',
    isActive: true,
  });

  // Image Upload States
  const [imageUploadMode, setImageUploadMode] = useState('file'); // 'file' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [existingImage, setExistingImage] = useState('');

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

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      offerPrice: '',
      category: 'Snacks & Munchies',
      customCategory: '',
      stock: '20',
      imageUrl: '',
      isActive: true,
    });
    setSelectedFile(null);
    setFilePreview(null);
    setExistingImage('');
    setImageUploadMode('file');
    setSubmitError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);

    // Check if category is standard or custom
    const isStandardCategory = PRODUCT_CATEGORIES.includes(product.category);

    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price ? product.price.toString() : '',
      offerPrice:
        product.offerPrice !== undefined && product.offerPrice !== null && product.offerPrice > 0
          ? product.offerPrice.toString()
          : '',
      category: isStandardCategory ? product.category : 'Other / Custom Category',
      customCategory: isStandardCategory ? '' : product.category || '',
      stock: product.stock !== undefined ? product.stock.toString() : '0',
      imageUrl: typeof product.image === 'string' ? product.image : product.image?.url || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
    });

    const currentImgUrl = typeof product.image === 'string' ? product.image : product.image?.url || '';
    setExistingImage(currentImgUrl);
    setSelectedFile(null);
    setFilePreview(null);
    setImageUploadMode('file');
    setSubmitError('');
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select a valid image file (JPG, PNG, WEBP, GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('Image size must be less than 10MB');
      return;
    }

    setSubmitError('');
    setSelectedFile(file);

    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
  };

  const handleRemoveSelectedFile = () => {
    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const regularPrice = parseFloat(formData.price);
    if (isNaN(regularPrice) || regularPrice <= 0) {
      setSubmitError('Please enter a valid regular price greater than 0');
      return;
    }

    let finalOfferPrice = regularPrice;
    if (formData.offerPrice && formData.offerPrice.trim() !== '') {
      const op = parseFloat(formData.offerPrice);
      if (isNaN(op) || op < 0) {
        setSubmitError('Offer price must be a valid positive number');
        return;
      }
      if (op > regularPrice) {
        setSubmitError(`Offer price (₹${op}) cannot be greater than regular price (₹${regularPrice})`);
        return;
      }
      finalOfferPrice = op;
    }

    const stockNum = parseInt(formData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setSubmitError('Stock must be 0 or greater');
      return;
    }

    const effectiveCategory =
      formData.category === 'Other / Custom Category'
        ? formData.customCategory.trim() || 'General'
        : formData.category;

    if (!effectiveCategory) {
      setSubmitError('Please specify a category for the product');
      return;
    }

    setSubmitLoading(true);

    try {
      // Use FormData to support multipart image upload seamlessly
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('description', formData.description.trim());
      data.append('price', regularPrice.toString());
      data.append('offerPrice', finalOfferPrice.toString());
      data.append('category', effectiveCategory);
      data.append('stock', stockNum.toString());
      data.append('isAvailable', formData.isActive.toString());

      if (imageUploadMode === 'file') {
        if (selectedFile) {
          data.append('image', selectedFile);
        } else if (editingProduct && existingImage) {
          data.append('image', existingImage);
        }
      } else {
        if (formData.imageUrl.trim()) {
          data.append('image', formData.imageUrl.trim());
        }
      }

      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, data);
        alert('Product updated successfully!');
      } else {
        await productService.createProduct(data);
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

  // Filter products based on search query, category, and stock
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'All' ||
      product.category?.toLowerCase() === categoryFilter.toLowerCase();

    let matchesStock = true;
    if (stockFilter === 'In Stock') {
      matchesStock = product.stock > 0;
    } else if (stockFilter === 'Low Stock') {
      matchesStock = product.stock > 0 && product.stock <= 5;
    } else if (stockFilter === 'Out of Stock') {
      matchesStock = product.stock === 0;
    } else if (stockFilter === 'On Discount') {
      matchesStock = product.offerPrice && product.offerPrice > 0 && product.offerPrice < product.price;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Calculate inventory metrics
  const totalItemsCount = products.length;
  const activeItemsCount = products.filter((p) => p.isActive && p.stock > 0).length;
  const discountedCount = products.filter((p) => p.offerPrice && p.offerPrice > 0 && p.offerPrice < p.price).length;
  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-3" size={32} />
        <p className="text-sm text-slate-500 font-semibold">Loading your inventory desk...</p>
      </div>
    );
  }

  // Live discount preview calculation inside modal
  const regPriceNum = parseFloat(formData.price) || 0;
  const offPriceNum = parseFloat(formData.offerPrice);
  const hasLiveDiscount =
    regPriceNum > 0 &&
    !isNaN(offPriceNum) &&
    offPriceNum > 0 &&
    offPriceNum < regPriceNum;
  const discountPercent = hasLiveDiscount ? Math.round(((regPriceNum - offPriceNum) / regPriceNum) * 100) : 0;
  const discountSavings = hasLiveDiscount ? (regPriceNum - offPriceNum).toFixed(1) : 0;
  const isInvalidOffer = regPriceNum > 0 && !isNaN(offPriceNum) && offPriceNum > regPriceNum;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Merchant Top Header (md:hidden) */}
      <header className="md:hidden bg-slate-900 text-white p-3.5 border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 font-bold shadow-xs">
              <Store size={16} />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-white truncate max-w-[170px]">{store?.name || 'NearKart Desk'}</h2>
              <span className="text-3xs text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Inventory Desk ({products.length} Items)
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-1.5 rounded-xl text-3xs font-extrabold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
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
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Store size={20} />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block">NearKart Desk</span>
              <span className="text-3xs text-emerald-400 font-semibold uppercase tracking-wider">Merchant Portal</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            <Link
              to="/shopkeeper/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <ListOrdered size={16} />
              <span>Order Desk</span>
            </Link>

            <button
              onClick={() => navigate('/shopkeeper/dashboard')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition text-left"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>

            <button
              disabled
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs text-left"
            >
              <ShoppingBag size={16} />
              <span>Product Inventory</span>
            </button>

            <Link
              to="/shopkeeper/config"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <Sliders size={16} />
              <span>Store Configuration</span>
            </Link>
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800 text-xs text-slate-400">
          <p className="font-extrabold text-white text-xs truncate">{store?.name || 'My Campus Store'}</p>
          <p className="text-3xs text-emerald-400 font-semibold mt-0.5">● Active Inventory Desk</p>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-grow p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* Top Header & Action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Product Inventory</span>
              <span className="text-2xs sm:text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {products.length} Items
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Add new campus products, set offer discounts, upload photos, and control stock.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition items-center gap-2 shadow-xs shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl border border-rose-200 mb-5 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Inventory Metrics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 text-3xs font-bold uppercase tracking-wider">
              <span>Total Catalog</span>
              <ShoppingBag size={14} className="text-slate-400" />
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">{totalItemsCount}</p>
            <span className="text-4xs sm:text-3xs text-slate-400 font-medium">All registered items</span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-emerald-600 text-3xs font-bold uppercase tracking-wider">
              <span>Active Items</span>
              <Check size={14} className="text-emerald-500" />
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-1">{activeItemsCount}</p>
            <span className="text-4xs sm:text-3xs text-emerald-600 font-medium">Visible to customers</span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-teal-600 text-3xs font-bold uppercase tracking-wider">
              <span>On Offer / Sale</span>
              <Percent size={14} className="text-teal-500" />
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-teal-700 mt-1">{discountedCount}</p>
            <span className="text-4xs sm:text-3xs text-teal-600 font-medium">Special offer pricing</span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-amber-600 text-3xs font-bold uppercase tracking-wider">
              <span>Low Stock Alerts</span>
              <AlertCircle size={14} className="text-amber-500" />
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-amber-700 mt-1">{lowStockCount}</p>
            <span className="text-4xs sm:text-3xs text-amber-600 font-medium">Stock ≤ 5 units</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-3 sm:p-4 mb-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search products by name, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 flex-grow sm:flex-grow-0">
                <Filter size={13} className="text-slate-400 shrink-0" />
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Stocks</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock (≤5)</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="On Discount">On Offer / Sale</option>
                </select>
              </div>

              {/* View Toggle (Table / Card) */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-3xs font-bold shrink-0">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Cards
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills (Scrollable horizontally) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-slate-100 text-3xs">
            <span className="text-slate-400 font-extrabold uppercase shrink-0 mr-1">Category:</span>
            <button
              onClick={() => setCategoryFilter('All')}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-bold transition ${
                categoryFilter === 'All'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              All ({products.length})
            </button>
            {PRODUCT_CATEGORIES.map((cat) => {
              const catCount = products.filter((p) => p.category?.toLowerCase() === cat.toLowerCase()).length;
              if (catCount === 0 && cat !== 'Other / Custom Category') return null;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 font-bold transition flex items-center gap-1 ${
                    categoryFilter.toLowerCase() === cat.toLowerCase()
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span>{cat}</span>
                  {catCount > 0 && <span className="opacity-70 text-4xs">({catCount})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl shadow-card p-8">
            <ShoppingBag className="text-slate-300 mx-auto mb-3" size={40} />
            <h3 className="font-extrabold text-slate-800 text-sm">No Products Found</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              {searchQuery || categoryFilter !== 'All' || stockFilter !== 'All'
                ? 'No items matched your current search and filter settings. Try clearing filters.'
                : 'Your store catalog is currently empty. Click Add New Product to get started!'}
            </p>
            {(searchQuery || categoryFilter !== 'All' || stockFilter !== 'All') ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('All');
                  setStockFilter('All');
                }}
                className="mt-4 text-xs font-bold text-emerald-600 hover:underline"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={handleOpenAddModal}
                className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Plus size={15} />
                <span>Add Your First Item</span>
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* Desktop & Tablet Table View */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-400 font-extrabold uppercase tracking-wider text-3xs">
                    <th className="p-3.5 sm:p-4">Photo</th>
                    <th className="p-3.5 sm:p-4">Product Details</th>
                    <th className="p-3.5 sm:p-4">Category</th>
                    <th className="p-3.5 sm:p-4">Price & Offer</th>
                    <th className="p-3.5 sm:p-4">In Stock</th>
                    <th className="p-3.5 sm:p-4">Status</th>
                    <th className="p-3.5 sm:p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredProducts.map((product) => {
                    const hasDiscount =
                      product.offerPrice &&
                      product.offerPrice > 0 &&
                      product.offerPrice < product.price;
                    const discount = hasDiscount
                      ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
                      : 0;

                    return (
                      <tr key={product._id} className="hover:bg-slate-50/70 transition">
                        {/* Image Preview */}
                        <td className="p-3.5 sm:p-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-xl bg-slate-50 border border-slate-200 shrink-0 shadow-2xs"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100';
                            }}
                          />
                        </td>

                        {/* Title and Description */}
                        <td className="p-3.5 sm:p-4 max-w-xs">
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-slate-400 text-3xs mt-0.5 line-clamp-1">
                              {product.description || 'No description provided.'}
                            </p>
                          </div>
                        </td>

                        {/* Category Tag */}
                        <td className="p-3.5 sm:p-4">
                          <span className="inline-block px-2 py-0.5 rounded-md text-3xs font-bold text-slate-700 bg-slate-100 border border-slate-200/60 max-w-[140px] truncate">
                            {product.category || 'General'}
                          </span>
                        </td>

                        {/* Price & Offer Price Display */}
                        <td className="p-3.5 sm:p-4">
                          {hasDiscount ? (
                            <div className="space-y-0.5">
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="font-black text-emerald-700 text-xs sm:text-sm">
                                  ₹{product.offerPrice}
                                </span>
                                <span className="text-3xs text-slate-400 line-through">
                                  ₹{product.price}
                                </span>
                              </div>
                              <span className="inline-flex items-center gap-0.5 text-4xs font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <Percent size={9} />
                                {discount}% OFF
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-black text-slate-900 text-xs sm:text-sm">
                                ₹{product.price}
                              </span>
                              <span className="block text-4xs text-slate-400 font-semibold mt-0.5">Regular</span>
                            </div>
                          )}
                        </td>

                        {/* Stock Counter */}
                        <td className="p-3.5 sm:p-4">
                          <span
                            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-3xs ${
                              product.stock === 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : product.stock <= 5
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
                          </span>
                        </td>

                        {/* Visibility Status */}
                        <td className="p-3.5 sm:p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase border ${
                              product.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {product.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(product)}
                              className="text-slate-500 hover:text-emerald-700 p-2 rounded-lg transition hover:bg-emerald-50"
                              title="Edit Product"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="text-slate-400 hover:text-rose-600 p-2 rounded-lg transition hover:bg-rose-50"
                              title="Delete Product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Mobile / Card Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const hasDiscount =
                product.offerPrice &&
                product.offerPrice > 0 &&
                product.offerPrice < product.price;
              const discount = hasDiscount
                ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
                : 0;

              return (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between space-y-3 hover:shadow-card transition"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-xl bg-slate-50 border border-slate-200 shrink-0 shadow-2xs"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100';
                      }}
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-4xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                          {product.category}
                        </span>
                        <span
                          className={`text-4xs font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm mt-1 line-clamp-1">
                        {product.name}
                      </h4>
                      <p className="text-slate-400 text-3xs mt-0.5 line-clamp-1">
                        {product.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Pricing and Stock Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      {hasDiscount ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-emerald-700 text-sm">₹{product.offerPrice}</span>
                          <span className="text-3xs text-slate-400 line-through">₹{product.price}</span>
                          <span className="text-4xs font-extrabold text-emerald-700 bg-emerald-50 px-1 rounded">
                            {discount}% OFF
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="font-black text-slate-900 text-sm">₹{product.price}</span>
                          <span className="text-4xs text-slate-400 font-semibold">Regular</span>
                        </div>
                      )}
                      <span
                        className={`text-4xs font-bold ${
                          product.stock <= 5 ? 'text-amber-600 font-extrabold' : 'text-slate-400'
                        }`}
                      >
                        {product.stock === 0 ? 'Out of stock' : `${product.stock} units in stock`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition border border-slate-200/80"
                        title="Edit Item"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition border border-slate-200/80"
                        title="Delete Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Responsive Add/Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200/80 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    {editingProduct ? <Edit2 size={14} /> : <Plus size={15} />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-tight">
                      {editingProduct ? 'Edit Product Item' : 'Add New Product to Store'}
                    </h3>
                    <p className="text-3xs text-slate-500">Configure prices, discounts, photos, and stock.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="mx-5 mt-4 bg-rose-50 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs border border-rose-200 flex items-center gap-2 shrink-0">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Scrollable Form Body */}
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
                {/* Product Name */}
                <div>
                  <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Product Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kurkure Masala Munch (80g)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 text-slate-900 font-medium"
                  />
                </div>

                {/* Category Selection with Comprehensive Options */}
                <div className="space-y-2">
                  <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Product Category *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl text-xs p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-800"
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Category Input if 'Other / Custom Category' is chosen */}
                  {formData.category === 'Other / Custom Category' && (
                    <div className="pt-1 animate-in fade-in duration-150">
                      <label className="block text-3xs font-extrabold text-emerald-700 uppercase tracking-wider mb-1">
                        Type Your Custom Category Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sports Equipment, Pet Essentials, Gifts..."
                        value={formData.customCategory}
                        onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                        className="w-full border border-emerald-300 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-emerald-50/30 text-slate-900 font-semibold"
                      />
                    </div>
                  )}
                </div>

                {/* Pricing: Regular Price & Offer Price */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag size={13} className="text-emerald-600" />
                      <span>Pricing & Special Offers</span>
                    </span>
                    <span className="text-3xs text-slate-400 font-semibold">Offer price is optional</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Regular Price */}
                    <div>
                      <label className="block text-3xs font-bold text-slate-600 uppercase mb-1">
                        Regular Price (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          required
                          min="0.5"
                          step="0.5"
                          placeholder="e.g. 50"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full pl-7 pr-3 py-2 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Offer Price */}
                    <div>
                      <label className="block text-3xs font-bold text-slate-600 uppercase mb-1">
                        Offer / Sale Price (₹) <span className="text-slate-400">(Discount)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="e.g. 40 (leave blank if no sale)"
                          value={formData.offerPrice}
                          onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                          className={`w-full pl-7 pr-3 py-2 rounded-xl text-xs border bg-white focus:outline-none font-bold text-slate-900 ${
                            isInvalidOffer
                              ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                              : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Real-time Discount Callout */}
                  {hasLiveDiscount && (
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-3xs text-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Sparkles size={14} className="text-amber-500 shrink-0" />
                        <span>
                          Customer saves ₹{discountSavings}! Selling at <span className="text-emerald-700 font-extrabold">₹{offPriceNum}</span> (was ₹{regPriceNum})
                        </span>
                      </div>
                      <span className="bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-md shadow-2xs">
                        {discountPercent}% OFF
                      </span>
                    </div>
                  )}

                  {isInvalidOffer && (
                    <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl text-3xs text-rose-700 font-bold flex items-center gap-1.5">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>Offer price (₹{offPriceNum}) cannot exceed regular price (₹{regPriceNum}).</span>
                    </div>
                  )}

                  {!hasLiveDiscount && !isInvalidOffer && (
                    <p className="text-4xs text-slate-400 italic">
                      💡 If set below regular price, customers see an offer badge with discounted checkout.
                    </p>
                  )}
                </div>

                {/* Stock & Visibility Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      Available Stock (Units) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      Visibility Status
                    </label>
                    <select
                      value={formData.isActive.toString()}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                      className="w-full border border-slate-200 rounded-xl text-xs p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-800"
                    >
                      <option value="true">Active (Visible to Shoppers)</option>
                      <option value="false">Hidden (Draft / Archived)</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Description & Specifications (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short product highlights, pack weight, flavor, ingredients..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 text-slate-800"
                  />
                </div>

                {/* IMAGE MANAGEMENT SECTION (File Upload with Previews) */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-emerald-600" />
                      <span>Product Photo</span>
                    </span>

                    {/* Mode Toggle: File Upload vs URL */}
                    <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-3xs font-bold">
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('file')}
                        className={`px-2 py-0.5 rounded-md transition ${
                          imageUploadMode === 'file' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        File Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('url')}
                        className={`px-2 py-0.5 rounded-md transition ${
                          imageUploadMode === 'url' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Image Link
                      </button>
                    </div>
                  </div>

                  {/* Mode A: Direct File Upload with Previews */}
                  {imageUploadMode === 'file' ? (
                    <div className="space-y-3">
                      {/* When Editing: Show Current/Previous Image Thumbnail */}
                      {editingProduct && existingImage && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-3">
                          <img
                            src={existingImage}
                            alt="Current Product"
                            className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100';
                            }}
                          />
                          <div className="flex-grow min-w-0">
                            <span className="inline-flex items-center gap-1 text-4xs font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              <Check size={10} className="text-emerald-600" />
                              Current Active Photo
                            </span>
                            <p className="text-3xs text-slate-500 mt-1 truncate">
                              {filePreview ? 'Will be replaced by new photo below' : 'Currently displayed in store'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* File Selection Dropzone */}
                      <div>
                        <label className="block text-3xs font-bold text-slate-600 uppercase mb-1.5">
                          {editingProduct ? 'Select New Photo (Optional replacement)' : 'Upload Product Photo'}
                        </label>
                        <label className="relative border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white transition hover:bg-emerald-50/30 group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <Upload className="text-slate-400 group-hover:text-emerald-600 mb-1.5 transition" size={24} />
                          <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                            {selectedFile ? 'Change Selected File' : 'Click to Browse or Take Photo'}
                          </span>
                          <span className="text-4xs text-slate-400 mt-0.5">
                            Supports JPG, PNG, WEBP, GIF (Up to 10MB)
                          </span>
                        </label>
                      </div>

                      {/* New Image Live Preview */}
                      {filePreview && (
                        <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={filePreview}
                              alt="New Upload Preview"
                              className="w-14 h-14 object-cover rounded-lg border-2 border-emerald-500 shrink-0 shadow-xs"
                            />
                            <div className="min-w-0">
                              <span className="text-4xs font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                                New Photo Preview
                              </span>
                              <p className="text-3xs font-bold text-slate-800 mt-1 truncate">
                                {selectedFile?.name || 'Selected image'}
                              </p>
                              <span className="text-4xs text-slate-400">
                                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleRemoveSelectedFile}
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition shrink-0"
                            title="Remove Selected File"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Mode B: Direct Image URL */
                    <div className="space-y-2">
                      <label className="block text-3xs font-bold text-slate-600 uppercase">
                        Image Web Address (URL)
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                      />
                      {formData.imageUrl && (
                        <div className="flex items-center gap-2 pt-1">
                          <img
                            src={formData.imageUrl}
                            alt="URL preview"
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100';
                            }}
                          />
                          <span className="text-3xs text-slate-500 font-medium">Link preview</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Form Action Buttons (Sticky & Mobile Friendly) */}
                <div className="pt-2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-1/3 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading || isInvalidOffer}
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold py-2.5 rounded-xl text-xs transition shadow-xs shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                  >
                    {submitLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Saving Item...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                      </>
                    )}
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
