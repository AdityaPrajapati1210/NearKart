import api from "./api";

// Get user profile
export const getProfile = async () => {
    return await api("/users/profile");
};

// Update user profile
export const updateProfile = async (userData) => {
    return await api("/users/profile", {
        method: "PATCH",
        body: JSON.stringify(userData)
    });
};

// Get all saved addresses
export const getAddresses = async () => {
    return await api("/users/addresses");
};

// Get single address
export const getAddress = async (addressId) => {
    return await api(`/users/addresses/${addressId}`);
};

// Add new address
export const addAddress = async (addressData) => {
    return await api("/users/addresses", {
        method: "POST",
        body: JSON.stringify(addressData)
    });
};

// Update address
export const updateAddress = async (addressId, addressData) => {
    return await api(`/users/addresses/${addressId}`, {
        method: "PATCH",
        body: JSON.stringify(addressData)
    });
};

// Delete address
export const deleteAddress = async (addressId) => {
    return await api(`/users/addresses/${addressId}`, {
        method: "DELETE"
    });
};

// Save current user location
export const updateLocation = async (locationData) => {
    return await api("/users/location", {
        method: "PATCH",
        body: JSON.stringify(locationData)
    });
};

// Get current user location
export const getLocation = async () => {
    return await api("/users/location");
};