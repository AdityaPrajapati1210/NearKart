import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
    getCart,
    updateCart,
    removeFromCart,
    clearCart
} from "../services/cart";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

function Cart() {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingProduct, setUpdatingProduct] = useState(null);
    const [clearing, setClearing] = useState(false);
    const [error, setError] = useState("");

    const loadCart = async () => {
        try {
            setError("");

            const response = await getCart();

            setCart(response.cart || []);
        } catch (error) {
            setError(error.message || "Failed to load cart.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCart();
    }, []);

    const handleQuantityChange = async (productId, quantity) => {
        if (quantity < 1) {
            return;
        }

        try {
            setError("");
            setUpdatingProduct(productId);

            const response = await updateCart(
                productId,
                quantity
            );

            setCart(response.cart || []);
        } catch (error) {
            setError(
                error.message || "Failed to update cart."
            );
        } finally {
            setUpdatingProduct(null);
        }
    };

    const handleRemove = async (productId) => {
        try {
            setError("");
            setUpdatingProduct(productId);

            const response = await removeFromCart(productId);

            setCart(response.cart || []);
        } catch (error) {
            setError(
                error.message || "Failed to remove item."
            );
        } finally {
            setUpdatingProduct(null);
        }
    };

    const handleClearCart = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to clear your cart?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setClearing(true);

            await clearCart();

            setCart([]);
        } catch (error) {
            setError(
                error.message || "Failed to clear cart."
            );
        } finally {
            setClearing(false);
        }
    };

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

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <Loader text="Loading cart..." />
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">

                <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            My Cart
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Review your items before checkout.
                        </p>
                    </div>

                    {cart.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearCart}
                            disabled={clearing}
                            className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                            {clearing
                                ? "Clearing..."
                                : "Clear Cart"}
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mb-6">
                        <ErrorMessage
                            message={error}
                            onClose={() => setError("")}
                        />
                    </div>
                )}

                {cart.length === 0 ? (
                    <EmptyState
                        title="Your cart is empty"
                        message="Add some products to your cart and they will appear here."
                        action={
                            <Link
                                to="/products"
                                className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Browse Products
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

                        {/* Cart Items */}
                        <div className="space-y-4">
                            {cart.map((item) => {
                                const product = item.product || item;

                                const price =
                                    product.offerPrice > 0
                                        ? product.offerPrice
                                        : product.price;

                                const itemTotal =
                                    price * item.quantity;

                                const isUpdating =
                                    updatingProduct === product._id;

                                return (
                                    <div
                                        key={product._id}
                                        className="rounded-2xl bg-white p-5 shadow-sm"
                                    >
                                        <div className="flex gap-4">

                                            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                                                {product.image?.url ? (
                                                    <img
                                                        src={product.image.url}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-3xl">
                                                        🛍️
                                                    </span>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    to={`/products/${product._id}`}
                                                    className="font-semibold text-gray-900 hover:text-blue-600"
                                                >
                                                    {product.name}
                                                </Link>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    ₹{price} each
                                                </p>

                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">

                                                    <div className="flex items-center">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleQuantityChange(
                                                                    product._id,
                                                                    item.quantity - 1
                                                                )
                                                            }
                                                            disabled={
                                                                isUpdating ||
                                                                item.quantity <= 1
                                                            }
                                                            className="rounded-l-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            −
                                                        </button>

                                                        <span className="min-w-12 border-y border-gray-300 px-3 py-2 text-center text-sm font-medium">
                                                            {item.quantity}
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleQuantityChange(
                                                                    product._id,
                                                                    item.quantity + 1
                                                                )
                                                            }
                                                            disabled={isUpdating}
                                                            className="rounded-r-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <p className="font-bold text-gray-900">
                                                        ₹{itemTotal}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemove(
                                                            product._id
                                                        )
                                                    }
                                                    disabled={isUpdating}
                                                    className="mt-3 text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                                                >
                                                    {isUpdating
                                                        ? "Updating..."
                                                        : "Remove"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary */}
                        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-24">
                            <h2 className="text-lg font-bold text-gray-900">
                                Order Summary
                            </h2>

                            <div className="mt-5 space-y-3 border-b border-gray-200 pb-5">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Items</span>
                                    <span>{cart.length}</span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Delivery</span>
                                    <span>Calculated at checkout</span>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between">
                                <span className="font-semibold text-gray-900">
                                    Total
                                </span>

                                <span className="text-2xl font-bold text-gray-900">
                                    ₹{total}
                                </span>
                            </div>

                            <Link
                                to="/checkout"
                                className="mt-6 block w-full rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Proceed to Checkout
                            </Link>

                            <Link
                                to="/products"
                                className="mt-3 block w-full rounded-lg border border-gray-300 px-5 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                                Continue Shopping
                            </Link>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}

export default Cart;