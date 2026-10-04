import api from './api';
import { normalizeOrder } from './orderService';

export const riderService = {
  /**
   * Get all riders registered under this shopkeeper
   * Backend endpoint: GET /api/riders
   */
  async getRiders() {
    try {
      const data = await api.get('/riders');
      return data.riders || [];
    } catch (err) {
      console.warn('Could not fetch riders list:', err.message);
      return [];
    }
  },

  /**
   * Create a new delivery rider account (Shopkeeper)
   * Backend endpoint: POST /api/riders
   */
  async createRider(riderData) {
    const payload = {
      name: riderData.name.trim(),
      phone: riderData.phone.trim(),
      email: riderData.email ? riderData.email.trim().toLowerCase() : undefined,
      password: riderData.password,
    };
    const data = await api.post('/riders', payload);
    return data.rider;
  },

  /**
   * Fetch current rider profile
   * Backend endpoint: GET /api/riders/profile
   */
  async getProfile() {
    const data = await api.get('/riders/profile');
    return data.rider || data.user;
  },

  /**
   * Fetch all orders assigned to this rider
   * Backend endpoint: GET /api/riders/orders
   */
  async getRiderOrders() {
    const data = await api.get('/riders/orders');
    const rawOrders = data.orders || [];
    return rawOrders.map(normalizeOrder);
  },

  /**
   * Fetch all available unassigned orders waiting for pickup
   * Backend endpoint: GET /api/riders/orders/available
   */
  async getAvailableOrders() {
    const data = await api.get('/riders/orders/available');
    const rawOrders = data.orders || [];
    return rawOrders.map(normalizeOrder);
  },

  /**
   * Rider claims / accepts an available order
   * Backend endpoint: PATCH /api/riders/orders/:orderId/accept
   */
  async acceptOrder(orderId) {
    const data = await api.patch(`/riders/orders/${orderId}/accept`, {});
    return data;
  },

  /**
   * Rider declines an order
   * Backend endpoint: PATCH /api/riders/orders/:orderId/decline
   */
  async declineOrder(orderId) {
    const data = await api.patch(`/riders/orders/${orderId}/decline`, {});
    return data;
  },

  /**
   * Rider updates status to OUT_FOR_DELIVERY
   * Backend endpoint: PATCH /api/riders/orders/:orderId/status
   */
  async updateOrderStatus(orderId, status) {
    const data = await api.patch(`/riders/orders/${orderId}/status`, { status });
    return normalizeOrder(data.order);
  },

  /**
   * Update rider live GPS location and broadcast to active customer rooms
   * Backend endpoint: PATCH /api/riders/location
   */
  async updateLocation(coords) {
    const latitude = Number(coords.latitude ?? coords.lat);
    const longitude = Number(coords.longitude ?? coords.lng);

    return await api.patch('/riders/location', { latitude, longitude });
  },

  /**
   * Rider verifies customer OTP to complete handover
   * Backend endpoint: POST /api/riders/orders/:orderId/otp/verify
   */
  async verifyOtp(orderId, otp) {
    const data = await api.post(`/riders/orders/${orderId}/otp/verify`, {
      otp: otp.trim(),
    });
    return normalizeOrder(data.order);
  },
};

export default riderService;
