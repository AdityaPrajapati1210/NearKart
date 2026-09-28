import api from "./api";

// Create order
export const createOrder = async (orderData) => {
    return await api("/orders", {
        method: "POST",
        body: JSON.stringify(orderData)
    });
};

// Get customer orders
export const getOrders = async (params = {}) => {
    const query = new URLSearchParams(params).toString();

    return await api(`/orders${query ? `?${query}` : ""}`);
};

// Get single order
export const getOrder = async (orderId) => {
    return await api(`/orders/${orderId}`);
};

// Cancel order
export const cancelOrder = async (orderId) => {
    return await api(`/orders/${orderId}/cancel`, {
        method: "PATCH"
    });
};

// Get live rider location
export const getLiveRiderLocation = async (orderId) => {
    return await api(`/orders/${orderId}/live-location`);
};