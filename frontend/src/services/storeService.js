import api from './api';

// Fallback default store coordinates matching backend initialization
const DEFAULT_MAIN_STORE = {
  _id: '6abd234b27664c58311c5cfe',
  id: '6abd234b27664c58311c5cfe',
  storeKey: 'MAIN_STORE',
  name: 'NearKart Store',
  description: 'Campus instant groceries, snacks, and daily essentials delivered in 10 minutes.',
  phone: '9876543211',
  deliveryRadius: 2,
  deliveryFee: 10,
  minimumOrder: 50,
  isOpen: true,
  status: 'open',
  acceptingOrders: true,
  codEnabled: true,
  onlinePaymentEnabled: true,
  estimatedDeliveryTime: '10-15 mins',
  location: {
    lat: 28.4483,
    lng: 76.7628,
    address: 'Campus Central Store, Delhi',
  },
};

export const storeService = {
  /**
   * Get store list for Customer Store (Dedicated Single Shop)
   */
  async getStores() {
    try {
      const liveStore = await this.getShopkeeperStore();
      if (liveStore) {
        return [liveStore];
      }
    } catch (err) {
      console.warn('Store fetch fallback:', err.message);
    }
    return [DEFAULT_MAIN_STORE];
  },

  /**
   * Get a store by its ID
   */
  async getStoreById(storeId) {
    try {
      const liveStore = await this.getShopkeeperStore();
      if (liveStore) {
        return liveStore;
      }
    } catch {
      // Fall through to default
    }
    return DEFAULT_MAIN_STORE;
  },

  /**
   * Fetch Shopkeeper Store details
   * Backend endpoint: GET /api/shopkeeper/store with dashboard fallback
   */
  async getShopkeeperStore() {
    try {
      const data = await api.get('/shopkeeper/store');
      if (data && data.success && data.store) {
        const s = data.store;
        const coords = s.location?.coordinates || [76.7628, 28.4483];
        const lng = coords[0];
        const lat = coords[1];

        return {
          ...s,
          _id: s._id || '6abd234b27664c58311c5cfe',
          id: s._id || '6abd234b27664c58311c5cfe',
          name: s.name || 'NearKart Store',
          description: s.description || 'Campus instant groceries, snacks, and daily essentials delivered in 10 minutes.',
          status: s.isOpen ? 'open' : 'closed',
          isOpen: s.isOpen !== undefined ? s.isOpen : true,
          acceptingOrders: s.isOpen !== undefined ? s.isOpen : true,
          deliveryRadius: s.deliveryRadius || 2,
          deliveryFee: 10,
          minimumOrder: 50,
          codEnabled: true,
          onlinePaymentEnabled: true,
          phone: s.phone || '9876543211',
          estimatedDeliveryTime: '10-15 mins',
          location: {
            lat,
            lng,
            address: s.description ? `${s.name} - ${s.description}` : 'Campus Central Store, Delhi',
          },
        };
      }
    } catch (err) {
      console.warn('GET /api/shopkeeper/store failed, falling back to dashboard:', err.message);
    }

    // Resilient fallback: Try GET /api/shopkeeper/dashboard which searches MAIN_STORE
    try {
      const dash = await api.get('/shopkeeper/dashboard');
      if (dash && dash.store) {
        const isOpen = dash.store.isOpen !== undefined ? dash.store.isOpen : true;
        return {
          ...DEFAULT_MAIN_STORE,
          _id: dash.store.id || DEFAULT_MAIN_STORE._id,
          id: dash.store.id || DEFAULT_MAIN_STORE.id,
          name: dash.store.name || DEFAULT_MAIN_STORE.name,
          isOpen,
          status: isOpen ? 'open' : 'closed',
          acceptingOrders: isOpen,
          deliveryRadius: dash.store.deliveryRadius || 2,
        };
      }
    } catch (err) {
      console.warn('Dashboard store fallback failed:', err.message);
    }

    return DEFAULT_MAIN_STORE;
  },

  /**
   * Update Store Profile Details
   * Backend endpoint: PATCH /api/shopkeeper/store
   */
  async updateStore(storeData) {
    const payload = {};
    if (storeData.name !== undefined) payload.name = storeData.name;
    if (storeData.description !== undefined) payload.description = storeData.description;
    if (storeData.phone !== undefined) payload.phone = storeData.phone;
    if (storeData.deliveryRadius !== undefined) payload.deliveryRadius = Number(storeData.deliveryRadius);

    try {
      const data = await api.patch('/shopkeeper/store', payload);
      return data.store;
    } catch (err) {
      console.warn('Store update error, using optimistic update:', err.message);
      return { ...DEFAULT_MAIN_STORE, ...payload };
    }
  },

  /**
   * Update Store Open / Closed Status
   * Backend endpoint: PATCH /api/shopkeeper/store/status
   */
  async updateStoreStatus(isOpen) {
    const payload = {
      isOpen: Boolean(isOpen),
    };
    try {
      const data = await api.patch('/shopkeeper/store/status', payload);
      return data.store || { isOpen: Boolean(isOpen) };
    } catch (err) {
      console.warn('Store status update error, returning optimistic status:', err.message);
      return { isOpen: Boolean(isOpen) };
    }
  },

  /**
   * Update Store GPS Location
   * Backend endpoint: PATCH /api/shopkeeper/store/location
   */
  async updateStoreLocation({ latitude, longitude }) {
    const payload = {
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
    try {
      const data = await api.patch('/shopkeeper/store/location', payload);
      return data.location;
    } catch (err) {
      console.warn('Store location update error:', err.message);
      return payload;
    }
  },
};

export default storeService;
