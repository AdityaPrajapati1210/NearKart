import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false
};

const authSlice = createSlice({
    name: "auth",

    initialState,

    reducers: {
        setAuthLoading: (state, action) => {
            state.loading = action.payload;
        },

        loginSuccess: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.loading = false;
        },

        logoutSuccess: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
        },

        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = Boolean(action.payload);
        }
    }
});

export const {
    setAuthLoading,
    loginSuccess,
    logoutSuccess,
    setUser
} = authSlice.actions;

export default authSlice.reducer;