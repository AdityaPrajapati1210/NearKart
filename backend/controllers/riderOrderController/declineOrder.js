const Order = require("../../models/orderSchema");
const ExpressError = require("../../utils/ExpressError");

// ======================================================
// RIDER DECLINES / REJECTS AN ORDER
// PATCH /api/riders/orders/:orderId/decline
// (Alias: PATCH /api/riders/orders/:orderId/reject)
// ======================================================

const declineOrder = async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body;
    const riderId = req.session.riderId || req.session.userId;

    if (!riderId) {
        throw new ExpressError(401, "Rider authentication required");
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ExpressError(404, "Order not found");
    }

    // 1. Cannot decline if order is already out for delivery or finished
    const nonDeclinableStatuses = ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REJECTED"];
    if (nonDeclinableStatuses.includes(order.orderStatus)) {
        throw new ExpressError(
            400,
            `Cannot decline order when status is ${order.orderStatus}`
        );
    }

    // 2. Check if rider has authority to decline
    // Rider can decline if:
    // a) The order is directly assigned to this rider, OR
    // b) The order is unassigned in READY state
    const isDirectlyAssigned = order.rider && order.rider.toString() === riderId.toString();
    const isUnassignedPool = !order.rider && order.orderStatus === "READY";

    if (!isDirectlyAssigned && !isUnassignedPool) {
        throw new ExpressError(
            403,
            "You are not assigned to this order, or it has already been claimed by another rider"
        );
    }

    // 3. Release rider assignment if it was assigned to this rider
    if (isDirectlyAssigned) {
        order.rider = null;
        order.riderAssignedAt = null;
    }

    // 4. Add this rider to declinedRiders list so it doesn't clutter their available list
    order.declinedRiders = order.declinedRiders || [];
    const alreadyDeclined = order.declinedRiders.some(
        id => id.toString() === riderId.toString()
    );
    if (!alreadyDeclined) {
        order.declinedRiders.push(riderId);
    }

    await order.save();

    res.status(200).json({
        success: true,
        message: "Order declined successfully and released back to available pool",
        order: {
            id: order._id,
            orderStatus: order.orderStatus,
            rider: null,
            reason: reason || "Rider declined"
        }
    });
};

module.exports = declineOrder;
