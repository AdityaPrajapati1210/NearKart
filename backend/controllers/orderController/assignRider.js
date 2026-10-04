const Rider = require("../../models/riderSchema");
const Order = require("../../models/orderSchema");
const ExpressError = require("../../utils/ExpressError");

// ======================================================
// ASSIGN RIDER TO ORDER
// PATCH /api/orders/:orderId/assign-rider
// ======================================================

const assignRider = async (req, res) => {

    const { orderId } = req.params;
    const { riderId } = req.body;

    // --------------------------------------------------
    // 1. Validate riderId
    // --------------------------------------------------

    if (!riderId) {
        throw new ExpressError(
            400,
            "Rider ID is required"
        );
    }

    // --------------------------------------------------
    // 2. Find rider
    // --------------------------------------------------

    const rider = await Rider.findById(riderId)
        .select("_id name phone isActive");

    if (!rider) {
        throw new ExpressError(
            404,
            "Rider not found"
        );
    }

    // --------------------------------------------------
    // 3. Rider must be active
    // --------------------------------------------------

    if (!rider.isActive) {
        throw new ExpressError(
            400,
            "Cannot assign an inactive rider"
        );
    }

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
    // 5. Check order status
    // --------------------------------------------------

    const allowedStatuses = [
        "PENDING",
        "ACCEPTED",
        "PREPARING",
        "READY"
    ];

    if (!allowedStatuses.includes(order.orderStatus)) {
        throw new ExpressError(
            400,
            `Rider cannot be assigned when order status is ${order.orderStatus}`
        );
    }

    // If order was still PENDING, auto-advance to ACCEPTED upon assigning rider
    if (order.orderStatus === "PENDING") {
        order.orderStatus = "ACCEPTED";
        order.acceptedAt = new Date();
    }

    // --------------------------------------------------
    // 6. Assign or Re-assign rider
    // --------------------------------------------------

    const isReassignment = !!order.rider;
    order.rider = rider._id;
    order.riderAssignedAt = new Date();

    // If this rider had previously declined, clear from declined list on manual assignment
    if (order.declinedRiders && order.declinedRiders.length > 0) {
        order.declinedRiders = order.declinedRiders.filter(
            id => id.toString() !== rider._id.toString()
        );
    }

    await order.save();

    // --------------------------------------------------
    // 7. Populate full order & broadcast socket event
    // --------------------------------------------------

    const updatedOrder = await Order.findById(order._id)
        .populate("user", "name phone email")
        .populate("rider", "name phone email currentLocation lastLocationUpdate")
        .select("-deliveryOTPHash -deliveryOTPExpiresAt -deliveryOTPAttempts")
        .lean();

    let riderLocation = null;
    if (rider.currentLocation?.coordinates) {
        const coords = rider.currentLocation.coordinates;
        if (coords[0] !== 0 || coords[1] !== 0) {
            riderLocation = { lat: coords[1], lng: coords[0] };
        }
    }

    try {
        const { getIO } = require("../../config/socket");
        const io = getIO();
        const payload = {
            orderId: order._id,
            orderStatus: order.orderStatus,
            status: order.orderStatus,
            rider: updatedOrder.rider,
            riderLocation,
            deliveryRider: {
                _id: rider._id,
                id: rider._id,
                name: rider.name,
                mobile: rider.phone,
                phone: rider.phone
            }
        };
        io.to(`order:${order._id}`).emit("ORDER_STATUS_CHANGED", payload);
        io.to(order._id.toString()).emit("ORDER_STATUS_CHANGED", payload);
        if (order.user) {
            io.to(`user_${order.user}`).emit("ORDER_STATUS_CHANGED", payload);
        }
        if (riderLocation) {
            const locPayload = {
                orderId: order._id,
                riderId: rider._id.toString(),
                lat: riderLocation.lat,
                lng: riderLocation.lng,
                location: { latitude: riderLocation.lat, longitude: riderLocation.lng },
                updatedAt: Date.now()
            };
            io.to(`order:${order._id}`).emit("RIDER_LOCATION_UPDATED", locPayload);
            io.to(order._id.toString()).emit("RIDER_LOCATION_UPDATED", locPayload);
            io.emit("RIDER_LOCATION_BROADCAST", locPayload);
        }
    } catch (sockErr) {
        console.warn("Socket broadcast error in assignRider:", sockErr.message);
    }

    res.status(200).json({
        success: true,
        message: isReassignment
            ? "Rider re-assigned successfully"
            : "Rider assigned successfully",
        order: updatedOrder
    });
};


module.exports = assignRider;