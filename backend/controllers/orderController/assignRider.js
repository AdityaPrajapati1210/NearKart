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
        "ACCEPTED",
        "PREPARING",
        "READY"
    ];

    if(!allowedStatuses.includes(order.orderStatus)) {
        throw new ExpressError(
            400,
            `Rider cannot be assigned when order status is ${order.orderStatus}`
        );
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
    // 7. Response
    // --------------------------------------------------

    res.status(200).json({
        success: true,
        message: isReassignment
            ? "Rider re-assigned successfully"
            : "Rider assigned successfully",
        order: {
            id: order._id,
            orderStatus: order.orderStatus,
            rider: {
                id: rider._id,
                name: rider.name,
                phone: rider.phone
            }
        }
    });
};


module.exports = assignRider;