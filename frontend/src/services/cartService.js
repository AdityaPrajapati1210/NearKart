import api from './api';

export const cartService = {
  /**
   * Get user's cart from backend
   * Backend endpoint: GET /api/users/cart
   */
  async getCart() {
    try {
      const data = await api.get('/users/cart');
      return data.cart || [];
    } catch (err) {
      console.warn('Failed to fetch backend cart:', err.message);
      return [];
    }
  },

  /**
   * Add product to backend cart
   * Backend endpoint: POST /api/users/cart
   */
  async addToCart(productId, quantity = 1) {
    return await api.post('/users/cart', {
      productId,
      quantity: Number(quantity),
    });
  },

  /**
   * Update quantity of a product in backend cart
   * Backend endpoint: PATCH /api/users/cart/:productId
   */
  async updateCartItem(productId, quantity) {
    return await api.patch(`/users/cart/${productId}`, {
      quantity: Number(quantity),
    });
  },

  /**
   * Remove a single product from backend cart
   * Backend endpoint: DELETE /api/users/cart/:productId
   */
  async removeFromCart(productId) {
    return await api.delete(`/users/cart/${productId}`);
  },

  /**
   * Clear all items in backend cart
   * Backend endpoint: DELETE /api/users/cart
   */
  async clearCart() {
    try {
      return await api.delete('/users/cart');
    } catch (e) {
      console.warn('Clear backend cart notice:', e.message);
    }
  },

  /**
   * Synchronize the frontend localStorage cart with backend cart before checkout
   */
  async syncLocalCartToBackend(localCart) {
    if (!localCart || localCart.length === 0) return;

    // Clear backend cart first to prevent duplication
    await this.clearCart();

    // Sequentially add each item
    for (const item of localCart) {
      const productId = item._id || item.id || item.productId;
      const quantity = item.quantity || 1;
      await this.addToCart(productId, quantity);
    }
  },
};

export default cartService;
