const User = require('../../models/userSchema');
const ExpressError = require('../../utils/ExpressError');
const calculateDistance = require('../../utils/calculateDistance');
const Order = require('../../models/orderSchema');
const cancelOrder = async (req, res) => {

    const { orderId } = req.params;
    const userId = req.session.userId;

    // 1. Find order belonging to logged-in user
    const order = await Order.findOne({
        _id: orderId,
        user: userId
    });

    if (!order) {
        throw new ExpressError(
            404,
            "Order not found"
        );
    }


    // 2. Check whether order can be cancelled
    const cancellableStatuses = [
        "PENDING",
        "ACCEPTED"
    ];

    if (!nonCancellableStatuses.includes(order.orderStatus)) {
        throw new ExpressError(
            400,
            `Order cannot be cancelled because its status is ${order.orderStatus}`
        );
    }


    // 3. Cancel the order
    order.orderStatus = "CANCELLED";

    order.cancelledAt = new Date();

    // Optional cancellation reason
    if (req.body.reason) {
        order.cancellationReason = req.body.reason.trim();
    }

    await order.save();


    // 4. Response
    res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        order: {
            _id: order._id,
            orderStatus: order.orderStatus,
            cancellationReason: order.cancellationReason,
            cancelledAt: order.cancelledAt
        }
    });
}

module.exports = cancelOrder;