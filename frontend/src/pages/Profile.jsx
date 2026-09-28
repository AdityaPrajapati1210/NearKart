import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
    getProfile,
    updateProfile
} from "../services/user";

import {
    logout
} from "../store/authThunks";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";

function Profile() {
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await getProfile();

                const profile = response.user;

                setFormData({
                    name: profile?.name || "",
                    email: profile?.email || "",
                    phone: profile?.phone || ""
                });
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setSuccess("");
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setSaving(true);

        try {
            const response = await updateProfile({
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            });

            const updatedUser = response.user;

            setFormData({
                name: updatedUser?.name || "",
                email: updatedUser?.email || "",
                phone: updatedUser?.phone || ""
            });

            setSuccess("Profile updated successfully.");
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await dispatch(logout());
    };

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <Loader text="Loading profile..." />
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        My Profile
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Manage your account information.
                    </p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">

                    <ErrorMessage
                        message={error}
                        onClose={() => setError("")}
                    />

                    {success && (
                        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                            {success}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
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
                                required
                                disabled={saving}
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
                                required
                                disabled={saving}
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
                                maxLength={10}
                                inputMode="numeric"
                                disabled={saving}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </form>

                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                            Logout
                        </button>
                    </div>

                </div>
            </div>
        </main>
    );
}

export default Profile;