import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser } from "../services/auth";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        CnfPassword: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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

        if (formData.password !== formData.CnfPassword) {
            setError("Password and confirm password do not match");
            return;
        }

        setLoading(true);

        try {
            await registerUser(formData);

            navigate("/login", {
                replace: true
            });
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">

                <div className="bg-white rounded-2xl shadow-lg p-8">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Create Account
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Create your NearKart account
                        </p>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                        >
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Name
                            </label>

                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your name"
                                autoComplete="name"
                                required
                                disabled={loading}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                autoComplete="email"
                                required
                                disabled={loading}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="phone"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Phone
                            </label>

                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter 10-digit phone number"
                                autoComplete="tel"
                                inputMode="numeric"
                                maxLength={10}
                                required
                                disabled={loading}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                autoComplete="new-password"
                                required
                                disabled={loading}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="CnfPassword"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Confirm Password
                            </label>

                            <input
                                id="CnfPassword"
                                name="CnfPassword"
                                type="password"
                                value={formData.CnfPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                autoComplete="new-password"
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
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{" "}

                        <Link
                            to="/login"
                            className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Login
                        </Link>
                    </p>

                </div>
            </div>
        </main>
    );
}

export default Register;