import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress
} from "../services/user";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

const initialForm = {
    label: "home",
    address: "",
    latitude: "",
    longitude: "",
    isDefault: false
};

function Addresses() {
    const [addresses, setAddresses] = useState([]);

    const [formData, setFormData] = useState(initialForm);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [editingId, setEditingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadAddresses = async () => {
        try {
            setError("");

            const response = await getAddresses();

            setAddresses(response.addresses || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAddresses();
    }, []);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));

        setError("");
        setSuccess("");
    };

    const resetForm = () => {
        setFormData(initialForm);
        setEditingId(null);
    };

    const handleEdit = (address) => {
        setEditingId(address._id);

        setFormData({
            label: address.label || "home",
            address: address.address || "",
            latitude:
                address.latitude !== undefined
                    ? String(address.latitude)
                    : "",
            longitude:
                address.longitude !== undefined
                    ? String(address.longitude)
                    : "",
            isDefault: Boolean(address.isDefault)
        });

        setError("");
        setSuccess("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.address.trim()) {
            setError("Please enter your complete address.");
            return;
        }

        const latitude = Number(formData.latitude);
        const longitude = Number(formData.longitude);

        if (
            formData.latitude !== "" &&
            (!Number.isFinite(latitude) ||
                latitude < -90 ||
                latitude > 90)
        ) {
            setError("Please enter a valid latitude.");
            return;
        }

        if (
            formData.longitude !== "" &&
            (!Number.isFinite(longitude) ||
                longitude < -180 ||
                longitude > 180)
        ) {
            setError("Please enter a valid longitude.");
            return;
        }

        const payload = {
            label: formData.label,
            address: formData.address.trim(),
            isDefault: formData.isDefault
        };

        if (formData.latitude !== "") {
            payload.latitude = latitude;
        }

        if (formData.longitude !== "") {
            payload.longitude = longitude;
        }

        try {
            setSaving(true);

            if (editingId) {
                await updateAddress(editingId, payload);

                setSuccess("Address updated successfully.");
            } else {
                await addAddress(payload);

                setSuccess("Address added successfully.");
            }

            resetForm();

            await loadAddresses();
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (addressId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this address?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");
            setDeletingId(addressId);

            await deleteAddress(addressId);

            setAddresses((previous) =>
                previous.filter(
                    (address) => address._id !== addressId
                )
            );

            if (editingId === addressId) {
                resetForm();
            }

            setSuccess("Address deleted successfully.");
        } catch (error) {
            setError(error.message);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center px-4">
                <Loader text="Loading addresses..." />
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">

                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/checkout"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        ← Back to Checkout
                    </Link>

                    <h1 className="mt-4 text-3xl font-bold text-gray-900">
                        My Addresses
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Manage your delivery addresses.
                    </p>
                </div>

                {/* Messages */}
                <ErrorMessage
                    message={error}
                    onClose={() => setError("")}
                />

                {success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {success}
                    </div>
                )}

                {/* Add / Edit Form */}
                <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            {editingId
                                ? "Edit Address"
                                : "Add New Address"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Add a location where you want your orders
                            delivered.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        {/* Label */}
                        <div>
                            <label
                                htmlFor="label"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Address Type
                            </label>

                            <select
                                id="label"
                                name="label"
                                value={formData.label}
                                onChange={handleChange}
                                disabled={saving}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            >
                                <option value="home">
                                    Home
                                </option>

                                <option value="college">
                                    College
                                </option>

                                <option value="hostel">
                                    Hostel
                                </option>

                                <option value="other">
                                    Other
                                </option>
                            </select>
                        </div>

                        {/* Address */}
                        <div>
                            <label
                                htmlFor="address"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Complete Address
                            </label>

                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="House/Room, Street, Area, City..."
                                rows={4}
                                required
                                disabled={saving}
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            />
                        </div>

                        {/* Coordinates */}
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="latitude"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Latitude
                                </label>

                                <input
                                    id="latitude"
                                    name="latitude"
                                    type="number"
                                    step="any"
                                    value={formData.latitude}
                                    onChange={handleChange}
                                    placeholder="e.g. 28.4595"
                                    disabled={saving}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="longitude"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Longitude
                                </label>

                                <input
                                    id="longitude"
                                    name="longitude"
                                    type="number"
                                    step="any"
                                    value={formData.longitude}
                                    onChange={handleChange}
                                    placeholder="e.g. 77.0266"
                                    disabled={saving}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                                />
                            </div>
                        </div>

                        {/* Default */}
                        <label className="flex cursor-pointer items-center gap-3">
                            <input
                                type="checkbox"
                                name="isDefault"
                                checked={formData.isDefault}
                                onChange={handleChange}
                                disabled={saving}
                                className="h-4 w-4 accent-blue-600"
                            />

                            <span className="text-sm font-medium text-gray-700">
                                Set as default address
                            </span>
                        </label>

                        {/* Buttons */}
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                      ? "Update Address"
                                      : "Add Address"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={saving}
                                    className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {/* Address List */}
                <section className="mt-8">
                    <div className="mb-5">
                        <h2 className="text-xl font-bold text-gray-900">
                            Saved Addresses
                        </h2>
                    </div>

                    {addresses.length === 0 ? (
                        <EmptyState
                            title="No saved addresses"
                            message="Add your first delivery address using the form above."
                        />
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2">
                            {addresses.map((address) => (
                                <article
                                    key={address._id}
                                    className="rounded-2xl bg-white p-6 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold capitalize text-gray-900">
                                                    {address.label}
                                                </h3>

                                                {address.isDefault && (
                                                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                        Default
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-3 text-sm leading-6 text-gray-600">
                                                {address.address}
                                            </p>
                                        </div>

                                        <span className="text-2xl">
                                            📍
                                        </span>
                                    </div>

                                    {(address.latitude !== undefined ||
                                        address.longitude !== undefined) && (
                                        <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                                            Location coordinates saved
                                        </div>
                                    )}

                                    <div className="mt-5 flex gap-3 border-t border-gray-100 pt-5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEdit(address)
                                            }
                                            disabled={
                                                deletingId === address._id
                                            }
                                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDelete(
                                                    address._id
                                                )
                                            }
                                            disabled={
                                                deletingId === address._id
                                            }
                                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {deletingId === address._id
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default Addresses;