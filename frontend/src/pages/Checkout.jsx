import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCart } from "../services/cart";
import { getAddresses } from "../services/user";
import { createOrder } from "../services/order";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

function Checkout() {
    const navigate = useNavigate();

    const [cart, setCart] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState("");

    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadCheckoutData = async () => {
            try {
                setError("");

                const [cartResponse, addressResponse] =
                    await Promise.all([
                        getCart(),
                        getAddresses()
                    ]);

                const cartItems = cartResponse.cart || [];
                const userAddresses =
                    addressResponse.addresses || [];

                setCart(cartItems);
                setAddresses(userAddresses);

                const defaultAddress = userAddresses.find(
                    (address) => address.isDefault
                );

                if (defaultAddress) {
                    setSelectedAddress(defaultAddress._id);
                } else if (userAddresses.length > 0) {
                    setSelectedAddress(userAddresses[0]._id);
                }
            } catch (error) {
                setError(
                    error.message || "Failed to prepare checkout."
                );
            } finally {
                setLoading(false);
            }
        };

        loadCheckoutData();
    }, []);

    const total = useMemo(() => {
        return cart.reduce((sum, item) => {
            const product = item.product || item;

            const price =
                product.offerPrice > 0
                    ? product.offerPrice
                    : product.price;

            return sum + price * item.quantity;
        }, 0);
    }, [cart]);

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            setError("Please select a delivery address.");
            return;
        }

        if (cart.length === 0) {
            setError("Your cart is empty.");
            return;
        }

        try {
            setError("");
            setPlacingOrder(true);

            const response = await createOrder({
                addressId: selectedAddress,
                paymentMethod: "COD"
            });

            const orderId =
                response.order?._id ||
                response.order?.id;

            if (orderId) {
                navigate(`/orders/${orderId}`, {
                    replace: true
                });
            } else {
                navigate("/orders", {
                    replace: true
                });
            }
        } catch (error) {
            setError(
                error.message || "Failed to place order."
            );
        } finally {
            setPlacingOrder(false);
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <Loader text="Preparing checkout..." />
            </main>
        );
    }

    if (cart.length === 0) {
        return (
            <main className="min-h-[60vh] bg-gray-50 px-4 py-10">
                <div className="mx-auto max-w-2xl">
                    <EmptyState
                        title="Your cart is empty"
                        message="Add products to your cart before checkout."
                    />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Checkout
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Confirm your delivery details and place your order.
                    </p>
                </div>

                <ErrorMessage
                    message={error}
                    onClose={() => setError("")}
                />

                <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">

                    {/* Delivery Details */}
                    <div className="space-y-6">

                        {/* Address */}
                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900">
                                Delivery Address
                            </h2>

                            {addresses.length === 0 ? (
                                <div className="mt-5">
                                    <p className="text-sm text-gray-500">
                                        You don't have any saved addresses.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => navigate("/profile")}
                                        className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                                    >
                                        Add Address
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-5 space-y-3">
                                    {addresses.map((address) => (
                                        <label
                                            key={address._id}
                                            className={`block cursor-pointer rounded-xl border p-4 transition ${
                                                selectedAddress === address._id
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="flex gap-3">
                                                <input
                                                    type="radio"
                                                    name="address"
                                                    value={address._id}
                                                    checked={
                                                        selectedAddress ===
                                                        address._id
                                                    }
                                                    onChange={(event) =>
                                                        setSelectedAddress(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="mt-1 accent-blue-600"
                                                />

                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {address.label}
                                                    </p>

                                                    <p className="mt-1 text-sm leading-6 text-gray-600">
                                                        {address.address}
                                                    </p>

                                                    {address.isDefault && (
                                                        <span className="mt-2 inline-block text-xs font-semibold text-blue-600">
                                                            Default address
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Payment */}
                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900">
                                Payment Method
                            </h2>

                            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="radio"
                                        checked
                                        readOnly
                                        className="mt-1 accent-blue-600"
                                    />

                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Cash on Delivery
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
                                            Pay when your order is delivered.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Order Summary */}
                    <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-24">
                        <h2 className="text-lg font-bold text-gray-900">
                            Order Summary
                        </h2>

                        <div className="mt-5 space-y-4">
                            {cart.map((item) => {
                                const product =
                                    item.product || item;

                                const price =
                                    product.offerPrice > 0
                                        ? product.offerPrice
                                        : product.price;

                                return (
                                    <div
                                        key={product._id}
                                        className="flex justify-between gap-4 text-sm"
                                    >
                                        <span className="text-gray-600">
                                            {product.name} ×{" "}
                                            {item.quantity}
                                        </span>

                                        <span className="font-medium text-gray-900">
                                            ₹{price * item.quantity}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 border-t border-gray-200 pt-5">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900">
                                    Total
                                </span>

                                <span className="text-2xl font-bold text-gray-900">
                                    ₹{total}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handlePlaceOrder}
                            disabled={
                                placingOrder ||
                                !selectedAddress
                            }
                            className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {placingOrder
                                ? "Placing Order..."
                                : "Place Order"}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/cart")}
                            disabled={placingOrder}
                            className="mt-3 w-full rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                        >
                            Back to Cart
                        </button>
                    </aside>
                </div>
            </div>
        </main>
    );
}

export default Checkout;