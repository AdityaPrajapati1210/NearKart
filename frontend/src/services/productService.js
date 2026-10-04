import api from './api';

const FALLBACK_PRODUCTS = [
  {
    _id: '6abd234b27664c58311c5d03',
    id: '6abd234b27664c58311c5d03',
    name: 'Maggi 2-Minute Masala Noodles',
    description: 'Instant Masala Noodles, 70g pack',
    price: 14,
    offerPrice: 14,
    stock: 45,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400',
    store: 'MAIN_STORE',
    isActive: true,
  },
  {
    _id: '6abd234b27664c58311c5d04',
    id: '6abd234b27664c58311c5d04',
    name: 'Amul Taaza Toned Milk (500ml)',
    description: 'Fresh homogenised toned milk pouch',
    price: 28,
    offerPrice: 28,
    stock: 30,
    category: 'Dairy',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    store: 'MAIN_STORE',
    isActive: true,
  },
  {
    _id: '6abd234b27664c58311c5d05',
    id: '6abd234b27664c58311c5d05',
    name: 'Coca-Cola Can (300ml)',
    description: 'Refreshing carbonated soft drink can',
    price: 40,
    offerPrice: 35,
    stock: 60,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
    store: 'MAIN_STORE',
    isActive: true,
  },
  {
    _id: '6abd234b27664c58311c5d06',
    id: '6abd234b27664c58311c5d06',
    name: "Lay's India's Magic Masala Chips (50g)",
    description: 'Crispy spicy potato chips with Indian spices',
    price: 20,
    offerPrice: 20,
    stock: 45,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400',
    store: 'MAIN_STORE',
    isActive: true,
  },
  {
    _id: '6abd234b27664c58311c5d07',
    id: '6abd234b27664c58311c5d07',
    name: 'Cadbury Dairy Milk Silk Chocolate (60g)',
    description: 'Creamy smooth milk chocolate bar',
    price: 85,
    offerPrice: 80,
    stock: 35,
    category: 'Chocolates',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400',
    store: 'MAIN_STORE',
    isActive: true,
  },
  {
    _id: '6abd51a42601cbde90d8618a',
    id: '6abd51a42601cbde90d8618a',
    name: 'Parle-G Gold Biscuits',
    description: 'Bigger and crunchier classic glucose biscuits',
    price: 10,
    offerPrice: 10,
    stock: 50,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    store: 'MAIN_STORE',
    isActive: true,
  },
];

export const productService = {
  /**
   * Fetch products with pagination and optional filtering
   * Backend endpoint: GET /api/products
   */
  async getProducts(params = {}) {
    const page = params.page || 1;
    const limit = params.limit || 50;

    let rawProducts = [];

    try {
      const data = await api.get(`/products?page=${page}&limit=${limit}`);
      if (data && data.products) {
        rawProducts = data.products;
      }
    } catch (err) {
      console.warn('GET /api/products requires login, using fallback campus catalog:', err.message);
      rawProducts = FALLBACK_PRODUCTS;
    }

    // Normalize each product for frontend component consumption
    let normalized = rawProducts.map((p) => ({
      ...p,
      _id: p._id,
      id: p._id,
      store: p.store || 'MAIN_STORE',
      image: typeof p.image === 'string' ? p.image : p.image?.url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      isActive: p.stock > 0,
    }));

    // In-memory category and search filtering for frontend seamless UX
    if (params.category && params.category !== 'All') {
      normalized = normalized.filter(
        (p) => p.category?.toLowerCase() === params.category.toLowerCase()
      );
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      normalized = normalized.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    return normalized;
  },

  /**
   * Fetch a single product by ID
   * Backend endpoint: GET /api/products/:productId
   */
  async getProductById(productId) {
    try {
      const data = await api.get(`/products/${productId}`);
      const p = data.product;
      return {
        ...p,
        _id: p._id,
        image: typeof p.image === 'string' ? p.image : p.image?.url || '',
      };
    } catch {
      const found = FALLBACK_PRODUCTS.find((p) => p._id === productId);
      if (found) return found;
      throw new Error('Product not found');
    }
  },

  /**
   * Shopkeeper adds a new product
   * Backend endpoint: POST /api/products
   */
  async createProduct(formData) {
    let payload;
    let headers = {};

    if (formData instanceof FormData) {
      payload = formData;
    } else {
      payload = formData;
      headers['Content-Type'] = 'application/json';
    }

    const data = await api.post('/products', payload, { headers });
    return data.product;
  },

  /**
   * Shopkeeper updates an existing product
   * Backend endpoint: PATCH /api/products/:productId
   */
  async updateProduct(productId, formData) {
    let payload;
    let headers = {};

    if (formData instanceof FormData) {
      payload = formData;
    } else {
      payload = formData;
      headers['Content-Type'] = 'application/json';
    }

    const data = await api.patch(`/products/${productId}`, payload, { headers });
    return data.product;
  },

  /**
   * Shopkeeper deletes a product
   * Backend endpoint: DELETE /api/products/:productId
   */
  async deleteProduct(productId) {
    const data = await api.delete(`/products/${productId}`);
    return data;
  },
};

export default productService;
