import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import socket from "../config/socket";
import { getOrder, getLiveRiderLocation } from "../services/order";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";

function OrderTracking() {
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [location, setLocation] = useState(null);

    const [loading, setLoading] = useState(true);
    const [tracking, setTracking] = useState(false);

    const [error, setError] = useState("");
    const [socketConnected, setSocketConnected] = useState(false);

    const mountedRef = useRef(false);

    const loadInitialData = useCallback(async () => {
        try {
            setError("");

            const orderResponse = await getOrder(orderId);
            const currentOrder =
                orderResponse.order ||
                orderResponse.data ||
                null;

            if (!currentOrder) {
                throw new Error("Order not found");
            }

            setOrder(currentOrder);

            if (currentOrder.orderStatus !== "OUT_FOR_DELIVERY") {
                setTracking(false);
                return;
            }

            try {
                const locationResponse =
                    await getLiveRiderLocation(orderId);

                if (locationResponse.location) {
                    setLocation(locationResponse.location);
                    setTracking(
                        Boolean(locationResponse.tracking)
                    );
                }
            } catch (locationError) {
                // Initial location is optional.
                // Socket tracking can still start.
                console.warn(
                    "Initial rider location unavailable:",
                    locationError.message
                );
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        mountedRef.current = true;

        loadInitialData();

        return () => {
            mountedRef.current = false;
        };
    }, [loadInitialData]);

    useEffect(() => {
        if (!order || order.orderStatus !== "OUT_FOR_DELIVERY") {
            return;
        }

        const handleConnect = () => {
            if (!mountedRef.current) {
                return;
            }

            setSocketConnected(true);

            socket.emit("join-order", orderId);
        };

        const handleDisconnect = () => {
            if (!mountedRef.current) {
                return;
            }

            setSocketConnected(false);
        };

        const handleRoomJoined = (data) => {
            if (
                !mountedRef.current ||
                data?.orderId !== orderId
            ) {
                return;
            }

            setTracking(true);
        };

        const handleRiderLocation = (data) => {
            if (
                !mountedRef.current ||
                String(data?.orderId) !== String(orderId) ||
                !data?.location
            ) {
                return;
            }

            setLocation(data.location);
            setTracking(true);
        };

        const handleSocketError = (data) => {
            if (!mountedRef.current) {
                return;
            }

            console.warn(
                "Socket error:",
                data?.message || "Tracking error"
            );
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("order-room-joined", handleRoomJoined);
        socket.on("rider-location", handleRiderLocation);
        socket.on("socket-error", handleSocketError);

        if (socket.connected) {
            handleConnect();
        } else {
            socket.connect();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off(
                "order-room-joined",
                handleRoomJoined
            );
            socket.off(
                "rider-location",
                handleRiderLocation
            );
            socket.off("socket-error", handleSocketError);

            socket.emit("leave-order", orderId);
        };
    }, [order, orderId]);

    useEffect(() => {
        if (!order || order.orderStatus !== "OUT_FOR_DELIVERY") {
            return;
        }

        const refreshLocation = async () => {
            try {
                const response =
                    await getLiveRiderLocation(orderId);

                if (response.location) {
                    setLocation(response.location);
                    setTracking(
                        Boolean(response.tracking)
                    );
                }
            } catch (error) {
                console.warn(
                    "Location refresh failed:",
                    error.message
                );
            }
        };

        const interval = setInterval(
            refreshLocation,
            15000
        );

        return () => {
            clearInterval(interval);
        };
    }, [order, orderId]);

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center px-4">
                <Loader text="Loading live tracking..." />
            </main>
        );
    }

    if (error || !order) {
        return (
            <main className="min-h-[60vh] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl">
                    <ErrorMessage
                        message={error || "Order not found"}
                    />

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

    if (order.orderStatus !== "OUT_FOR_DELIVERY") {
        return (
            <main className="min-h-[60vh] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl">
                    <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                        <div className="text-5xl">
                            📦
                        </div>

                        <h1 className="mt-5 text-2xl font-bold text-gray-900">
                            Live tracking is not available
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            Live rider tracking becomes available
                            when your order is out for delivery.
                        </p>

                        <Link
                            to={`/orders/${orderId}`}
                            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            View Order
                        </Link>
                    </div>
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
                        to={`/orders/${orderId}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        ← Back to Order
                    </Link>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Track Your Rider
                            </h1>

                            <p className="mt-2 text-sm text-gray-500">
                                Your rider's location updates in real
                                time while the order is being delivered.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                    socketConnected
                                        ? "bg-green-500"
                                        : "bg-gray-400"
                                }`}
                            />

                            <span className="text-sm font-medium text-gray-600">
                                {socketConnected
                                    ? "Live"
                                    : "Connecting..."}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tracking Card */}
                <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

                    {/* Map Placeholder */}
                    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
                        <div className="relative flex min-h-[500px] items-center justify-center bg-gray-200">

                            {location ? (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-gray-100 to-green-50" />

                                    <div className="relative z-10 text-center">
                                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-4xl shadow-lg">
                                            🛵
                                        </div>

                                        <h2 className="mt-5 text-xl font-bold text-gray-900">
                                            Rider location
                                        </h2>

                                        <p className="mt-2 text-sm text-gray-500">
                                            Live location received
                                        </p>

                                        <div className="mt-5 rounded-xl bg-white px-5 py-4 text-left shadow-sm">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                                Coordinates
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                                {Number(
                                                    location.latitude
                                                ).toFixed(6)}
                                                {" , "}
                                                {Number(
                                                    location.longitude
                                                ).toFixed(6)}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="relative z-10 max-w-sm px-6 text-center">
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
                                        📍
                                    </div>

                                    <h2 className="mt-5 text-xl font-bold text-gray-900">
                                        Waiting for rider location
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-gray-500">
                                        The rider has not sent a location
                                        yet. Tracking will start
                                        automatically when a location is
                                        available.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Details */}
                    <aside className="space-y-5">

                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-xl">
                                    🛵
                                </div>

                                <div>
                                    <h2 className="font-bold text-gray-900">
                                        Rider is on the way
                                    </h2>

                                    <p className="text-sm text-gray-500">
                                        Your order is out for delivery.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-xl bg-gray-50 p-4">
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`h-3 w-3 rounded-full ${
                                            tracking
                                                ? "bg-green-500"
                                                : "bg-yellow-500"
                                        }`}
                                    />

                                    <p className="text-sm font-medium text-gray-700">
                                        {tracking
                                            ? "Tracking active"
                                            : "Waiting for location"}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900">
                                Delivery Status
                            </h2>

                            <div className="mt-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm text-green-600">
                                        ✓
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            Order prepared
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            Your order is ready.
                                        </p>
                                    </div>
                                </div>

                                <div className="h-6 border-l-2 border-dashed border-gray-300 ml-4" />

                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-600">
                                        🛵
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            Out for delivery
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            Rider is delivering your order.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {location?.updatedAt && (
                            <section className="rounded-2xl bg-white p-6 shadow-sm">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Last Updated
                                </p>

                                <p className="mt-2 text-sm font-semibold text-gray-900">
                                    {new Date(
                                        location.updatedAt
                                    ).toLocaleTimeString(
                                        "en-IN"
                                    )}
                                </p>
                            </section>
                        )}

                        <Link
                            to={`/orders/${orderId}`}
                            className="block w-full rounded-lg border border-gray-300 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                        >
                            View Order Details
                        </Link>
                    </aside>
                </div>
            </div>
        </main>
    );
}

export default OrderTracking;