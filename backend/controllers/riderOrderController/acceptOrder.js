const Order = require("../../models/orderSchema");
const ExpressError = require("../../utils/ExpressError");

// ======================================================
// RIDER ACCEPTS AN ORDER
// PATCH /api/riders/orders/:orderId/accept
// ======================================================

const acceptOrder = async (req, res) => {
    const { orderId } = req.params;
    const riderId = req.session.riderId || req.session.userId;

    if (!riderId) {
        throw new ExpressError(401, "Rider authentication required");
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ExpressError(404, "Order not found");
    }

    // Check status
    const allowedStatuses = ["ACCEPTED", "PREPARING", "READY"];
    if (!allowedStatuses.includes(order.orderStatus)) {
        throw new ExpressError(
            400,
            `Cannot accept order with status ${order.orderStatus}`
        );
    }

    // Check if already assigned
    if (order.rider && order.rider.toString() !== riderId.toString()) {
        throw new ExpressError(400, "This order is already assigned to another rider");
    }

    order.rider = riderId;
    await order.save();

    res.status(200).json({
        success: true,
        message: "Order accepted successfully",
        order: {
            id: order._id,
            orderStatus: order.orderStatus,
            rider: order.rider
        }
    });
};

module.exports = acceptOrder;
