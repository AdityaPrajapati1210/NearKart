import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import { loginUser } from "../services/auth";
import {
    loginSuccess,
    setAuthLoading
} from "../store/authSlice";

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        identifier: "",
        password: ""
    });

    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        dispatch(setAuthLoading(true));

        try {
            const response = await loginUser(formData);

            dispatch(loginSuccess(response.user));

            navigate("/");
        } catch (error) {
            dispatch(setAuthLoading(false));
            setError(error.message);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">

                <div className="bg-white rounded-2xl shadow-lg p-8">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Welcome Back
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Login to your NearKart account
                        </p>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
                        >
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        <div>
                            <label
                                htmlFor="identifier"
                                className="block text-sm font-medium text-gray-700 mb-1.5"
                            >
                                Email or Phone
                            </label>

                            <input
                                id="identifier"
                                name="identifier"
                                type="text"
                                value={formData.identifier}
                                onChange={handleChange}
                                placeholder="Enter email or phone"
                                autoComplete="username"
                                required
                                disabled={loading}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-1.5"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                                disabled={loading}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>

                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Register
                        </Link>
                    </p>

                </div>

            </div>
        </main>
    );
}

export default Login;