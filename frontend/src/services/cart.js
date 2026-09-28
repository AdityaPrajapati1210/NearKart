import api from "./api";

// Get cart
export const getCart = async () => {
    return await api("/users/cart");
};

// Add product to cart
export const addToCart = async (productId, quantity = 1) => {
    return await api("/users/cart", {
        method: "POST",
        body: JSON.stringify({
            productId,
            quantity
        })
    });
};

// Update cart item quantity
export const updateCart = async (productId, quantity) => {
    return await api(`/users/cart/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({
            quantity
        })
    });
};

// Remove product from cart
export const removeFromCart = async (productId) => {
    return await api(`/users/cart/${productId}`, {
        method: "DELETE"
    });
};

// Clear cart
export const clearCart = async () => {
    return await api("/users/cart", {
        method: "DELETE"
    });
};