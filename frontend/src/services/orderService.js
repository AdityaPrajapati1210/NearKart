import api from './api';
import authService from './authService';
import cartService from './cartService';

/**
 * Normalizes backend Order schema to match frontend component properties
 */
export function normalizeOrder(order) {
  if (!order) return order;

  const custLat = order.customerLocation?.coordinates?.[1] ?? order.deliveryLocation?.lat ?? 28.4500;
  const custLng = order.customerLocation?.coordinates?.[0] ?? order.deliveryLocation?.lng ?? 76.7670;

  const shopLat = order.shopLocation?.coordinates?.[1] ?? order.store?.location?.lat ?? 28.4483;
  const shopLng = order.shopLocation?.coordinates?.[0] ?? order.store?.location?.lng ?? 76.7628;

  const effectiveOtp = order.otp || order.plainOTP || order.developmentOTP || null;

  // Extract Rider Coordinates
  let riderLat = null;
  let riderLng = null;

  if (order.riderLocation?.lat && order.riderLocation?.lng) {
    riderLat = Number(order.riderLocation.lat);
    riderLng = Number(order.riderLocation.lng);
  } else if (order.rider?.currentLocation?.coordinates && Array.isArray(order.rider.currentLocation.coordinates)) {
    const coords = order.rider.currentLocation.coordinates;
    if (coords.length >= 2 && (coords[0] !== 0 || coords[1] !== 0)) {
      riderLng = Number(coords[0]);
      riderLat = Number(coords[1]);
    }
  } else if (order.currentLocation?.coordinates && Array.isArray(order.currentLocation.coordinates)) {
    const coords = order.currentLocation.coordinates;
    if (coords.length >= 2 && (coords[0] !== 0 || coords[1] !== 0)) {
      riderLng = Number(coords[0]);
      riderLat = Number(coords[1]);
    }
  }

  const effectiveRiderLocation = (riderLat && riderLng) ? { lat: riderLat, lng: riderLng } : null;

  return {
    ...order,
    _id: order._id,
    id: order._id,
    orderNumber: order.orderNumber || (order._id ? order._id.slice(-6).toUpperCase() : 'ORDER'),
    orderStatus: order.orderStatus,
    paymentMethod: order.paymentMethod || 'COD',
    paymentStatus: order.paymentStatus || 'PENDING',
    totalAmount: order.totalAmount,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee || 0,
    items: (order.items || []).map((item) => ({
      ...item,
      product: item.product?._id || item.product,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || item.product?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100',
    })),
    deliveryAddress: typeof order.deliveryAddress === 'string'
      ? order.deliveryAddress
      : order.deliveryAddress?.address || 'Campus Address',
    college: typeof order.deliveryAddress === 'string'
      ? order.deliveryAddress
      : order.deliveryAddress?.address || 'Campus Hostel / Room',
    roomNo: typeof order.deliveryAddress === 'object' ? (order.deliveryAddress?.label || '') : '',
    hostel: '',
    deliveryLocation: {
      lat: custLat,
      lng: custLng,
    },
    store: {
      _id: 'MAIN_STORE',
      name: 'NearKart Store',
      location: {
        lat: shopLat,
        lng: shopLng,
      },
      phone: '9876543210',
      address: 'Campus Central Store',
    },
    customer: {
      name: order.user?.name || order.customer?.name || 'Student Customer',
      mobile: order.user?.phone || order.customer?.mobile || '',
    },
    deliveryRider: order.deliveryRider || (order.rider && typeof order.rider === 'object' && order.rider.name ? {
      _id: order.rider._id || order.rider.id,
      id: order.rider._id || order.rider.id,
      name: order.rider.name,
      mobile: order.rider.phone || order.rider.mobile || '',
      phone: order.rider.phone || order.rider.mobile || '',
    } : null),
    riderLocation: effectiveRiderLocation,
    otp: effectiveOtp,
    plainOTP: effectiveOtp,
    developmentOTP: effectiveOtp,
  };
}

export const orderService = {
  /**
   * Fetch real-time live location of assigned delivery rider
   * GET /api/orders/:orderId/live-location
   */
  async getLiveLocation(orderId) {
    try {
      const data = await api.get(`/orders/${orderId}/live-location`);
      if (data.location?.latitude && data.location?.longitude) {
        return {
          lat: Number(data.location.latitude),
          lng: Number(data.location.longitude)
        };
      }
      if (data.lat && data.lng) {
        return {
          lat: Number(data.lat),
          lng: Number(data.lng)
        };
      }
      return null;
    } catch (err) {
      return null;
    }
  },
  /**
   * Complete checkout and place an order
   * Pre-configures user location, address, and backend cart before firing POST /api/orders
   */
  async placeOrder(params) {
    const {
      cart,
      deliveryLocation = { lat: 28.6160, lng: 77.2120 },
      deliveryAddress = 'Campus Main Block',
      paymentMethod = 'COD',
    } = params;

    // 1. Sync GPS location to backend
    await authService.saveLocation({
      latitude: deliveryLocation.lat,
      longitude: deliveryLocation.lng,
    });

    // 2. Ensure default address exists in backend
    await authService.ensureDefaultAddress({
      label: 'college',
      address: deliveryAddress,
      latitude: deliveryLocation.lat,
      longitude: deliveryLocation.lng,
    });

    // 3. Synchronize cart items to backend cart
    await cartService.syncLocalCartToBackend(cart);

    // 4. Fire order placement
    const data = await api.post('/orders', {
      paymentMethod,
    });

    if (!data.success || !data.order) {
      throw new Error(data.message || 'Failed to place order');
    }

    return normalizeOrder(data.order);
  },

  /**
   * Fetch customer order history
   * Backend endpoint: GET /api/orders
   */
  async getCustomerOrders() {
    const data = await api.get('/orders');
    const rawOrders = data.orders || [];
    return rawOrders.map(normalizeOrder);
  },

  /**
   * Customer cancels an order
   * Backend endpoint: PATCH /api/orders/:orderId/cancel
   */
  async cancelCustomerOrder(orderId, reason = 'Customer cancelled order') {
    const data = await api.patch(`/orders/${orderId}/cancel`, {
      reason,
    });
    return normalizeOrder(data.order);
  },

  /**
   * Fetch all orders for Shopkeeper dashboard
   * Backend endpoint: GET /api/orders/shopkeeper
   */
  async getShopkeeperOrders(page = 1, limit = 50) {
    const data = await api.get(`/orders/shopkeeper?page=${page}&limit=${limit}`);
    const rawOrders = data.orders || [];
    return rawOrders.map(normalizeOrder);
  },

  /**
   * Shopkeeper updates order status (ACCEPTED, PREPARING, READY, etc.)
   * Backend endpoint: PATCH /api/orders/:orderId/status
   */
  async updateOrderStatus(orderId, status, extra = {}) {
    const payload = {
      status,
      ...extra,
    };
    const data = await api.patch(`/orders/${orderId}/status`, payload);
    return normalizeOrder(data.order);
  },

  /**
   * Shopkeeper assigns a rider to an order
   * Backend endpoint: PATCH /api/orders/:orderId/assign-rider
   */
  async assignRider(orderId, riderId) {
    const data = await api.patch(`/orders/${orderId}/assign-rider`, {
      riderId,
    });
    return normalizeOrder(data.order);
  },

  /**
   * Generate delivery OTP (Shopkeeper or Rider)
   * Backend endpoint: POST /api/orders/:orderId/otp
   */
  async generateDeliveryOTP(orderId) {
    const data = await api.post(`/orders/${orderId}/otp`, {});
    return data.otp || data.developmentOTP;
  },

  /**
   * Verify delivery OTP (Shopkeeper or Rider)
   * Backend endpoint: POST /api/orders/:orderId/otp/verify
   */
  async verifyDeliveryOTP(orderId, otp) {
    const data = await api.post(`/orders/${orderId}/otp/verify`, {
      otp: otp.trim(),
    });
    return normalizeOrder(data.order);
  },

  /**
   * Fetch main shopkeeper dashboard statistics & active orders
   * Backend endpoint: GET /api/shopkeeper/dashboard
   */
  async getShopkeeperDashboard(page = 1, limit = 20) {
    return await api.get(`/shopkeeper/dashboard?page=${page}&limit=${limit}`);
  },

  /**
   * Fetch monthly analytics for shopkeeper
   * Backend endpoint: GET /api/shopkeeper/dashboard/analytics/month
   */
  async getShopkeeperMonthlyAnalytics(year, month) {
    return await api.get(`/shopkeeper/dashboard/analytics/month?year=${year}&month=${month}`);
  },

  /**
   * Fetch yearly analytics for shopkeeper
   * Backend endpoint: GET /api/shopkeeper/dashboard/analytics/year
   */
  async getShopkeeperYearlyAnalytics(year) {
    return await api.get(`/shopkeeper/dashboard/analytics/year?year=${year}`);
  },
};

export default orderService;
