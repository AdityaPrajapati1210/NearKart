const Order = require("../../models/orderSchema");
const ExpressError = require("../../utils/ExpressError");

const getRiderOrders = async (req, res) => {

    // Rider login ke baad rider ID session mein hogi
    const riderId = req.session.riderId;

    if (!riderId) {
        throw new ExpressError(
            401,
            "Rider authentication required"
        );
    }

    // --------------------------------------------------
    // Get rider's orders
    // --------------------------------------------------

    const orders = await Order.find({
        rider: riderId
    })
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
    // Order summary
    // --------------------------------------------------

    const summary = {
        totalAssigned: orders.length,

        pending: orders.filter(
            order =>
                order.orderStatus === "READY" ||
                order.orderStatus === "ACCEPTED" ||
                order.orderStatus === "PREPARING"
        ).length,

        outForDelivery: orders.filter(
            order =>
                order.orderStatus === "OUT_FOR_DELIVERY"
        ).length,

        delivered: orders.filter(
            order =>
                order.orderStatus === "DELIVERED"
        ).length,

        cancelled: orders.filter(
            order =>
                order.orderStatus === "CANCELLED"
        ).length
    };

    res.status(200).json({
        success: true,
        summary,
        orders
    });
};

module.exports = getRiderOrders;