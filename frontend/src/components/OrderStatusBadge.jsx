const STATUS_CONFIG = {
    PENDING: {
        label: "Pending",
        className: "bg-gray-100 text-gray-700"
    },

    ACCEPTED: {
        label: "Accepted",
        className: "bg-blue-100 text-blue-700"
    },

    PREPARING: {
        label: "Preparing",
        className: "bg-yellow-100 text-yellow-700"
    },

    READY: {
        label: "Ready",
        className: "bg-orange-100 text-orange-700"
    },

    OUT_FOR_DELIVERY: {
        label: "Out for Delivery",
        className: "bg-indigo-100 text-indigo-700"
    },

    DELIVERED: {
        label: "Delivered",
        className: "bg-green-100 text-green-700"
    },

    CANCELLED: {
        label: "Cancelled",
        className: "bg-red-100 text-red-700"
    },

    REJECTED: {
        label: "Rejected",
        className: "bg-red-100 text-red-700"
    }
};

function OrderStatusBadge({ status }) {
    const config =
        STATUS_CONFIG[status] || {
            label: status
                ? status.replaceAll("_", " ")
                : "Unknown",
            className: "bg-gray-100 text-gray-700"
        };

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
        >
            {config.label}
        </span>
    );
}

export default OrderStatusBadge;