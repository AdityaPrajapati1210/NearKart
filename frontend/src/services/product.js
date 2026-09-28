import api from "./api";

// Get products
export const getProducts = async (params = {}) => {
    const query = new URLSearchParams(params).toString();

    return await api(`/products${query ? `?${query}` : ""}`);
};