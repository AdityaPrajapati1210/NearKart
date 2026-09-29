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

function OrderStatusTimeline({ status }) {
    const currentIndex = STATUS_STEPS.findIndex(
        (step) => step.key === status
    );

    const isCancelled =
        status === "CANCELLED" ||
        status === "REJECTED";

    if (isCancelled) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <h3 className="font-semibold text-red-700">
                    {status === "REJECTED"
                        ? "Order Rejected"
                        : "Order Cancelled"}
                </h3>

                <p className="mt-1 text-sm text-red-600">
                    This order is no longer active.
                </p>
            </div>
        );
    }

    return (
        <div>
            {STATUS_STEPS.map((step, index) => {
                const completed =
                    currentIndex >= 0 &&
                    index <= currentIndex;

                const current =
                    index === currentIndex;

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
                                STATUS_STEPS.length - 1 && (
                                <div
                                    className={`h-12 w-0.5 ${
                                        index < currentIndex
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
                                {step.description}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default OrderStatusTimeline;