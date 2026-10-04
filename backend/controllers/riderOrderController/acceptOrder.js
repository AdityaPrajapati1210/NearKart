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
    order.riderAssignedAt = new Date();

    // If rider had previously declined this order, remove from declinedRiders
    if (order.declinedRiders && order.declinedRiders.length > 0) {
        order.declinedRiders = order.declinedRiders.filter(
            id => id.toString() !== riderId.toString()
        );
    }

    await order.save();

    // Broadcast update to customer & rooms
    try {
        const { getIO } = require("../../config/socket");
        const Rider = require("../../models/riderSchema");
        const io = getIO();

        const riderDoc = await Rider.findById(riderId).select("name phone currentLocation").lean();
        let riderLocation = null;
        if (riderDoc?.currentLocation?.coordinates) {
            const coords = riderDoc.currentLocation.coordinates;
            if (coords[0] !== 0 || coords[1] !== 0) {
                riderLocation = { lat: coords[1], lng: coords[0] };
            }
        }

        const payload = {
            orderId: order._id,
            orderStatus: order.orderStatus,
            status: order.orderStatus,
            rider: riderDoc,
            riderLocation,
            deliveryRider: riderDoc ? {
                _id: riderDoc._id,
                id: riderDoc._id,
                name: riderDoc.name,
                mobile: riderDoc.phone,
                phone: riderDoc.phone
            } : null
        };

        io.to(`order:${order._id}`).emit("ORDER_STATUS_CHANGED", payload);
        io.to(order._id.toString()).emit("ORDER_STATUS_CHANGED", payload);
        if (order.user) {
            io.to(`user_${order.user}`).emit("ORDER_STATUS_CHANGED", payload);
        }
    } catch (sockErr) {
        console.warn("Socket broadcast error in acceptOrder:", sockErr.message);
    }

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
