const Order = require("../../models/orderSchema");
const ExpressError = require("../../utils/ExpressError");

const getRiderOrders = async (req, res) => {

    const riderId = req.session.riderId || req.session.userId;

    if (!riderId) {
        throw new ExpressError(
            401,
            "Rider authentication required"
        );
    }

    const { status, type } = req.query;

    // --------------------------------------------------
    // 1. Get rider's assigned orders
    // --------------------------------------------------

    const assignedQuery = {
        rider: riderId
    };

    if (status) {
        assignedQuery.orderStatus = status;
    }

    const orders = await Order.find(assignedQuery)
        .select(
            "user items subtotal deliveryFee discount totalAmount deliveryAddress customerLocation orderStatus paymentMethod paymentStatus createdAt acceptedAt outForDeliveryAt deliveredAt"
        )
        .populate(
            "user",
            "name phone"
        )
        .sort({
            createdAt: -1
        })
        .lean();

    // --------------------------------------------------
    // 2. Get unassigned available orders ready for delivery
    // --------------------------------------------------

    const availableOrders = await Order.find({
        orderStatus: "READY",
        $or: [
            { rider: null },
            { rider: { $exists: false } }
        ],
        declinedRiders: { $ne: riderId }
    })
        .select(
            "user items subtotal deliveryFee discount totalAmount deliveryAddress customerLocation orderStatus paymentMethod paymentStatus createdAt readyAt"
        )
        .populate(
            "user",
            "name phone"
        )
        .sort({
            createdAt: -1
        })
        .lean();

    // --------------------------------------------------
    // 3. Order summary for rider
    // --------------------------------------------------

    const allAssigned = await Order.find({ rider: riderId }).select("orderStatus").lean();

    const summary = {
        totalAssigned: allAssigned.length,

        pending: allAssigned.filter(
            order =>
                order.orderStatus === "READY" ||
                order.orderStatus === "ACCEPTED" ||
                order.orderStatus === "PREPARING"
        ).length,

        outForDelivery: allAssigned.filter(
            order =>
                order.orderStatus === "OUT_FOR_DELIVERY"
        ).length,

        delivered: allAssigned.filter(
            order =>
                order.orderStatus === "DELIVERED"
        ).length,

        cancelled: allAssigned.filter(
            order =>
                order.orderStatus === "CANCELLED"
        ).length,

        availableToPickup: availableOrders.length
    };

    // If caller specifically requested only available orders (via query or /orders/available route)
    if (type === "available" || (req.path && req.path.includes("available"))) {
        return res.status(200).json({
            success: true,
            count: availableOrders.length,
            orders: availableOrders
        });
    }

    res.status(200).json({
        success: true,
        summary,
        orders,
        availableOrders
    });
};

module.exports = getRiderOrders;