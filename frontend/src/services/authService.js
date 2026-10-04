import api from './api';

export const authService = {
  /**
   * Login user (Customer, Shopkeeper, or Rider)
   * Backend endpoint: POST /api/users/login
   */
  async login(identifier, password) {
    const payload = {
      identifier: identifier.trim(),
      password,
    };

    // If identifier is email, pass email too for backward compatibility
    if (identifier.includes('@')) {
      payload.email = identifier.trim();
    } else {
      payload.phone = identifier.trim();
    }

    const data = await api.post('/users/login', payload);

    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }

    const rawUser = data.user || data.rider;
    const normalizedUser = {
      ...rawUser,
      _id: rawUser.id || rawUser._id,
      id: rawUser.id || rawUser._id,
      // Support both 'rider' and 'delivery' for frontend role checks
      role: rawUser.role === 'rider' ? 'delivery' : rawUser.role,
      backendRole: rawUser.role,
    };

    localStorage.setItem('nk_user', JSON.stringify(normalizedUser));
    localStorage.setItem('nk_token', 'session_active');

    return normalizedUser;
  },

  /**
   * Register new user (Customer or Shopkeeper)
   * Backend endpoint: POST /api/users/register
   */
  async register(name, email, phone, password, role = 'customer') {
    // 1. Register with backend
    const registerPayload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      CnfPassword: password,
      role,
    };

    const registerData = await api.post('/users/register', registerPayload);

    if (!registerData.success) {
      throw new Error(registerData.message || 'Registration failed');
    }

    // 2. Automatically log in after registration to establish session cookie
    try {
      return await this.login(email, password);
    } catch {
      const createdUser = {
        ...registerData.user,
        _id: registerData.user.id || registerData.user._id,
        role,
      };
      localStorage.setItem('nk_user', JSON.stringify(createdUser));
      localStorage.setItem('nk_token', 'session_active');
      return createdUser;
    }
  },

  /**
   * Get currently logged-in user profile from session
   * Backend endpoint: GET /api/users/profile
   */
  async getProfile() {
    try {
      const data = await api.get('/users/profile');
      if (data.success && data.user) {
        const rawUser = data.user;
        const normalizedUser = {
          ...rawUser,
          _id: rawUser.id || rawUser._id,
          id: rawUser.id || rawUser._id,
          role: rawUser.role === 'rider' ? 'delivery' : rawUser.role,
          backendRole: rawUser.role,
        };
        localStorage.setItem('nk_user', JSON.stringify(normalizedUser));
        return normalizedUser;
      }
      return null;
    } catch (err) {
      if (
        err.status === 401 ||
        err.status === 404 ||
        err.message?.includes('login') ||
        err.message?.includes('not found')
      ) {
        localStorage.removeItem('nk_user');
        localStorage.removeItem('nk_token');
        return null;
      }
      throw err;
    }
  },

  /**
   * Logout user and destroy backend session
   * Backend endpoint: POST /api/users/logout
   */
  async logout() {
    try {
      await api.post('/users/logout', {});
    } catch (err) {
      console.warn('Backend logout response error:', err.message);
    } finally {
      localStorage.removeItem('nk_user');
      localStorage.removeItem('nk_token');
    }
  },

  /**
   * Update user profile
   * Backend endpoint: PATCH /api/users/profile
   */
  async updateProfile(profileData) {
    const data = await api.patch('/users/profile', profileData);
    return data.user;
  },

  /**
   * Update customer GPS coordinates
   * Backend endpoint: PATCH /api/users/location
   */
  async saveLocation(coords) {
    const latitude = Number(coords.latitude ?? coords.lat);
    const longitude = Number(coords.longitude ?? coords.lng);

    return await api.patch('/users/location', { latitude, longitude });
  },

  /**
   * Get customer saved GPS coordinates
   * Backend endpoint: GET /api/users/location
   */
  async getLocation() {
    const data = await api.get('/users/location');
    return data.location;
  },

  /**
   * Get all user delivery addresses
   * Backend endpoint: GET /api/users/addresses
   */
  async getAddresses() {
    const data = await api.get('/users/addresses');
    return data.addresses || [];
  },

  /**
   * Add a new delivery address
   * Backend endpoint: POST /api/users/addresses
   */
  async addAddress(addressData) {
    const payload = {
      label: addressData.label || 'college',
      address: addressData.address,
      latitude: Number(addressData.latitude ?? addressData.lat ?? 28.6160),
      longitude: Number(addressData.longitude ?? addressData.lng ?? 77.2120),
      isDefault: addressData.isDefault !== undefined ? addressData.isDefault : true,
    };
    const data = await api.post('/users/addresses', payload);
    return data.address;
  },

  /**
   * Ensure user has at least one default address for order placement
   */
  async ensureDefaultAddress({ label = 'college', address, latitude, longitude }) {
    try {
      const addresses = await this.getAddresses();
      if (addresses.length > 0) {
        const defaultAddr = addresses.find((a) => a.isDefault);
        if (defaultAddr) return defaultAddr;
        return addresses[0];
      }
    } catch (e) {
      console.warn('Could not query addresses, attempting to create default:', e.message);
    }

    return await this.addAddress({
      label,
      address: address || 'Campus Main Block',
      latitude: latitude || 28.6160,
      longitude: longitude || 77.2120,
      isDefault: true,
    });
  },
};

export default authService;
