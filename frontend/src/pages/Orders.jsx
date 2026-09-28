import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getOrders } from "../services/order";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadOrders = async () => {
            try {
                setError("");

                const response = await getOrders();

                setOrders(response.orders || []);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case "DELIVERED":
                return "bg-green-100 text-green-700";

            case "CANCELLED":
            case "REJECTED":
                return "bg-red-100 text-red-700";

            case "OUT_FOR_DELIVERY":
                return "bg-blue-100 text-blue-700";

            case "ACCEPTED":
            case "PREPARING":
            case "READY":
                return "bg-yellow-100 text-yellow-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <Loader text="Loading orders..." />
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        My Orders
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        View and track your previous orders.
                    </p>
                </div>

                <ErrorMessage
                    message={error}
                    onClose={() => setError("")}
                />

                {orders.length === 0 && !error && (
                    <EmptyState
                        title="No orders yet"
                        message="Your placed orders will appear here."
                        action={
                            <Link
                                to="/products"
                                className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Start Shopping
                            </Link>
                        }
                    />
                )}

                {orders.length > 0 && (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <article
                                key={order._id}
                                className="rounded-2xl bg-white p-5 shadow-sm"
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Order ID
                                        </p>

                                        <p className="mt-1 break-all text-sm font-semibold text-gray-900">
                                            {order._id}
                                        </p>
                                    </div>

                                    <span
                                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                            order.orderStatus
                                        )}`}
                                    >
                                        {order.orderStatus?.replaceAll(
                                            "_",
                                            " "
                                        )}
                                    </span>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">

                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Total
                                        </p>

                                        <p className="mt-1 font-semibold text-gray-900">
                                            ₹{order.totalAmount ?? order.total ?? 0}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Items
                                        </p>

                                        <p className="mt-1 font-semibold text-gray-900">
                                            {order.items?.length ?? 0}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Date
                                        </p>

                                        <p className="mt-1 font-semibold text-gray-900">
                                            {order.createdAt
                                                ? new Date(
                                                      order.createdAt
                                                  ).toLocaleDateString(
                                                      "en-IN"
                                                  )
                                                : "—"}
                                        </p>
                                    </div>

                                </div>

                                <div className="mt-5 flex justify-end">
                                    <Link
                                        to={`/orders/${order._id}`}
                                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        View Order
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

export default Orders;