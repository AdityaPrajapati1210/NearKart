import {
    setAuthLoading,
    setUser,
    logoutSuccess
} from "./authSlice";

import {
    getCurrentUser,
    logoutUser
} from "../services/auth";

export const checkAuth = () => async (dispatch) => {
    dispatch(setAuthLoading(true));

    try {
        const response = await getCurrentUser();

        dispatch(setUser(response.user));
    } catch (error) {
        dispatch(setUser(null));
    } finally {
        dispatch(setAuthLoading(false));
    }
};

export const logout = () => async (dispatch) => {
    dispatch(setAuthLoading(true));

    try {
        await logoutUser();
    } finally {
        dispatch(logoutSuccess());
    }
};