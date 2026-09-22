const Order = require("../../models/orderSchema");
const Rider = require("../../models/riderSchema");
const ExpressError = require("../../utils/ExpressError");

const updateRiderOrderStatus = async (req, res) => {

    const { orderId } = req.params;
    const { status } = req.body;

    // --------------------------------------------------
    // 1. Validate status
    // --------------------------------------------------

    if (!status) {
        throw new ExpressError(
            400,
            "Order status is required"
        );
    }

    // --------------------------------------------------
    // 2. Allowed rider statuses
    // --------------------------------------------------

    const allowedStatuses = [
        "OUT_FOR_DELIVERY"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new ExpressError(
            400,
            "Invalid rider order status"
        );
    }

    // --------------------------------------------------
    // 3. Get rider
    // --------------------------------------------------

    const rider = await Rider.findOne({
        // temporary/session-based rider identification
        // will depend on rider authentication
    });

    // --------------------------------------------------
    // 4. Find order
    // --------------------------------------------------

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ExpressError(
            404,
            "Order not found"
        );
    }

    // --------------------------------------------------
    // 5. Check rider assignment
    // --------------------------------------------------

    if (!order.rider) {
        throw new ExpressError(
            400,
            "No rider is assigned to this order"
        );
    }

    // --------------------------------------------------
    // 6. Check current status
    // --------------------------------------------------

    if (order.orderStatus !== "READY") {
        throw new ExpressError(
            400,
            `Order cannot be moved to OUT_FOR_DELIVERY from ${order.orderStatus}`
        );
    }

    // --------------------------------------------------
    // 7. Update status
    // --------------------------------------------------

    order.orderStatus = "OUT_FOR_DELIVERY";
    order.outForDeliveryAt = new Date();

    await order.save();

    // --------------------------------------------------
    // 8. Response
    // --------------------------------------------------

    res.status(200).json({
        success: true,
        message: "Order is now out for delivery",
        order: {
            id: order._id,
            orderStatus: order.orderStatus,
            rider: order.rider,
            outForDeliveryAt: order.outForDeliveryAt
        }
    });
};

module.exports = updateRiderOrderStatus;