import api from "./api";

// Register customer
export const registerUser = async (userData) => {
    return await api("/users/register", {
        method: "POST",
        body: JSON.stringify(userData)
    });
};

// Login customer
export const loginUser = async (credentials) => {
    return await api("/users/login", {
        method: "POST",
        body: JSON.stringify(credentials)
    });
};

// Logout customer
export const logoutUser = async () => {
    return await api("/users/logout", {
        method: "POST"
    });
};

// Get current logged-in user
export const getCurrentUser = async () => {
    return await api("/users/profile");
};