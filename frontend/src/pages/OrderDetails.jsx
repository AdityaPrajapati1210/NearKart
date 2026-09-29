import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
    getOrder,
    cancelOrder
} from "../services/order";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";

const STATUS_STEPS = [
    {
        key: "PENDING",
        label: "Order Placed",
        description: "Your order has been placed."
    },
    {
        key: "ACCEPTED",
        label: "Accepted",
        description: "The store has accepted your order."
    },
    {
        key: "PREPARING",
        label: "Preparing",
        description: "Your order is being prepared."
    },
    {
        key: "READY",
        label: "Ready",
        description: "Your order is ready for delivery."
    },
    {
        key: "OUT_FOR_DELIVERY",
        label: "Out for Delivery",
        description: "Your rider is on the way."
    },
    {
        key: "DELIVERED",
        label: "Delivered",
        description: "Your order has been delivered."
    }
];

function OrderDetails() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);

    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadOrder = useCallback(async () => {
        try {
            setError("");

            const response = await getOrder(orderId);

            setOrder(response.order || response.data || null);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    const handleCancelOrder = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this order?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");
            setCancelling(true);

            const response = await cancelOrder(orderId);

            if (response.order) {
                setOrder(response.order);
            } else {
                await loadOrder();
            }

            setSuccess("Order cancelled successfully.");
        } catch (error) {
            setError(error.message);
        } finally {
            setCancelling(false);
        }
    };

    const currentStatusIndex = useMemo(() => {
        if (!order?.orderStatus) {
            return -1;
        }

        return STATUS_STEPS.findIndex(
            (step) => step.key === order.orderStatus
        );
    }, [order?.orderStatus]);

    const isCancelled =
        order?.orderStatus === "CANCELLED" ||
        order?.orderStatus === "REJECTED";

    const canCancel =
        order &&
        ["PENDING", "ACCEPTED", "PREPARING"].includes(
            order.orderStatus
        );

    const isLiveTracking =
        order?.orderStatus === "OUT_FOR_DELIVERY";

    const getItemProduct = (item) => {
        return item.product || item;
    };

    const getItemPrice = (item) => {
        const product = getItemProduct(item);

        return (
            item.price ??
            item.unitPrice ??
            (product.offerPrice > 0
                ? product.offerPrice
                : product.price) ??
            0
        );
    };

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center px-4">
                <Loader text="Loading order details..." />
            </main>
        );
    }

    if (!order) {
        return (
            <main className="min-h-[60vh] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl">
                    <ErrorMessage message={error || "Order not found"} />

                    <Link
                        to="/orders"
                        className="mt-5 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                        ← Back to Orders
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/orders"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        ← Back to Orders
                    </Link>

                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Order ID
                            </p>

                            <h1 className="mt-1 break-all text-xl font-bold text-gray-900 sm:text-2xl">
                                {order._id}
                            </h1>
                        </div>

                        <span className="w-fit rounded-full bg-blue-100 px-4 py-2 text-xs font-semibold text-blue-700">
                            {order.orderStatus?.replaceAll(
                                "_",
                                " "
                            )}
                        </span>
                    </div>
                </div>

                <ErrorMessage
                    message={error}
                    onClose={() => setError("")}
                />

                {success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {success}
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

                    {/* Main */}
                    <div className="space-y-6">

                        {/* Live Tracking */}
                        {isLiveTracking && (
                            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            Your rider is on the way
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-600">
                                            Track your rider's live location
                                            and delivery progress.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/orders/${orderId}/tracking`
                                            )
                                        }
                                        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        Track Rider
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* Order Status */}
                        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="text-lg font-bold text-gray-900">
                                Order Status
                            </h2>

                            {isCancelled ? (
                                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                                    <h3 className="font-semibold text-red-700">
                                        {order.orderStatus === "REJECTED"
                                            ? "Order Rejected"
                                            : "Order Cancelled"}
                                    </h3>

                                    <p className="mt-1 text-sm text-red-600">
                                        This order is no longer active.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-6">
                                    {STATUS_STEPS.map(
                                        (step, index) => {
                                            const completed =
                                                index <=
                                                currentStatusIndex;

                                            const current =
                                                index ===
                                                currentStatusIndex;

                                            return (
                                                <div
                                                    key={step.key}
                                                    className="flex gap-4"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <div
                                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                                                completed
                                                                    ? "bg-blue-600 text-white"
                                                                    : "bg-gray-200 text-gray-500"
                                                            }`}
                                                        >
                                                            {completed
                                                                ? "✓"
                                                                : index + 1}
                                                        </div>

                                                        {index <
                                                            STATUS_STEPS.length -
                                                                1 && (
                                                            <div
                                                                className={`h-12 w-0.5 ${
                                                                    index <
                                                                    currentStatusIndex
                                                                        ? "bg-blue-600"
                                                                        : "bg-gray-200"
                                                                }`}
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="pb-7">
                                                        <p
                                                            className={`font-semibold ${
                                                                current
                                                                    ? "text-blue-600"
                                                                    : completed
                                                                      ? "text-gray-900"
                                                                      : "text-gray-400"
                                                            }`}
                                                        >
                                                            {step.label}
                                                        </p>

                                                        <p className="mt-1 text-sm text-gray-500">
                                                            {
                                                                step.description
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Items */}
                        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="text-lg font-bold text-gray-900">
                                Order Items
                            </h2>

                            <div className="mt-5 divide-y divide-gray-100">
                                {(order.items || []).map(
                                    (item, index) => {
                                        const product =
                                            getItemProduct(item);

                                        const price =
                                            getItemPrice(item);

                                        return (
                                            <div
                                                key={
                                                    item._id ||
                                                    product._id ||
                                                    index
                                                }
                                                className="flex gap-4 py-5 first:pt-0 last:pb-0"
                                            >
                                                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                                                    {product.image?.url ? (
                                                        <img
                                                            src={
                                                                product
                                                                    .image
                                                                    .url
                                                            }
                                                            alt={
                                                                product.name
                                                            }
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl">
                                                            🛍️
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {
                                                            product.name
                                                        }
                                                    </h3>

                                                    <p className="mt-1 text-sm text-gray-500">
                                                        ₹{price} ×{" "}
                                                        {
                                                            item.quantity
                                                        }
                                                    </p>
                                                </div>

                                                <p className="font-semibold text-gray-900">
                                                    ₹
                                                    {price *
                                                        item.quantity}
                                                </p>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </section>

                        {/* Delivery Address */}
                        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="text-lg font-bold text-gray-900">
                                Delivery Address
                            </h2>

                            <div className="mt-4 rounded-xl bg-gray-50 p-4">
                                <p className="text-sm leading-6 text-gray-700">
                                    {order.deliveryAddress?.address ||
                                        order.address?.address ||
                                        order.deliveryAddress ||
                                        "Delivery address unavailable"}
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Summary */}
                    <aside className="h-fit space-y-5 lg:sticky lg:top-24">

                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900">
                                Order Summary
                            </h2>

                            <div className="mt-5 space-y-3 text-sm">
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">
                                        Items
                                    </span>

                                    <span className="font-medium text-gray-900">
                                        {order.items?.reduce(
                                            (total, item) =>
                                                total +
                                                (item.quantity || 0),
                                            0
                                        ) || 0}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">
                                        Payment
                                    </span>

                                    <span className="font-medium text-gray-900">
                                        {order.paymentMethod ||
                                            "COD"}
                                    </span>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between gap-4">
                                        <span className="font-semibold text-gray-900">
                                            Total
                                        </span>

                                        <span className="text-2xl font-bold text-gray-900">
                                            ₹
                                            {order.totalAmount ??
                                                order.total ??
                                                0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {order.createdAt && (
                            <section className="rounded-2xl bg-white p-6 shadow-sm">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Ordered On
                                </p>

                                <p className="mt-2 font-semibold text-gray-900">
                                    {new Date(
                                        order.createdAt
                                    ).toLocaleString("en-IN")}
                                </p>
                            </section>
                        )}

                        {canCancel && (
                            <section className="rounded-2xl bg-white p-6 shadow-sm">
                                <button
                                    type="button"
                                    onClick={handleCancelOrder}
                                    disabled={cancelling}
                                    className="w-full rounded-lg border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {cancelling
                                        ? "Cancelling..."
                                        : "Cancel Order"}
                                </button>
                            </section>
                        )}
                    </aside>
                </div>
            </div>
        </main>
    );
}

export default OrderDetails;