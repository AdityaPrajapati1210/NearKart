const User = require('../../models/userSchema');
const ExpressError = require('../../utils/ExpressError');
const calculateDistance = require('../../utils/calculateDistance');
const Order = require('../../models/orderSchema');
const updateStatus = async (req, res) => {

        const { orderId } = req.params;
        const { status } = req.body;


        // Allowed statuses
        const allowedStatuses = [
            "ACCEPTED",
            "PREPARING",
            "READY",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "REJECTED"
        ];


        // Validate status
        if (!status || !allowedStatuses.includes(status)) {
            throw new ExpressError(
                400,
                `Invalid status. Allowed statuses: ${allowedStatuses.join(", ")}`
            );
        }


        // Find order
        const order = await Order.findById(orderId);


        if (!order) {
            throw new ExpressError(
                404,
                "Order not found"
            );
        }


        // Current status
        const currentStatus = order.orderStatus;


        // Valid status transitions
        const allowedTransitions = {
            PENDING: [
                "ACCEPTED",
                "REJECTED"
            ],

            ACCEPTED: [
                "PREPARING"
            ],

            PREPARING: [
                "READY"
            ],

            READY: [
                "OUT_FOR_DELIVERY"
            ],

            OUT_FOR_DELIVERY: [
                "DELIVERED"
            ],

            DELIVERED: [],

            CANCELLED: [],

            REJECTED: []
        };


        // Check whether transition is allowed
        if (
            !allowedTransitions[currentStatus] ||
            !allowedTransitions[currentStatus].includes(status)
        ) {
            throw new ExpressError(
                400,
                `Cannot change order status from ${currentStatus} to ${status}`
            );
        }


        // Update status
        order.orderStatus = status;


        // Update corresponding timestamp
        const now = new Date();

        switch (status) {

            case "ACCEPTED":
                order.acceptedAt = now;
                break;

            case "PREPARING":
                order.preparingAt = now;
                break;

            case "READY":
                order.readyAt = now;
                break;

            case "OUT_FOR_DELIVERY":
                order.outForDeliveryAt = now;
                break;

            case "DELIVERED":
                order.deliveredAt = now;
                break;

            case "REJECTED":
                order.rejectionReason =
                    req.body.reason?.trim() || "Order rejected by shopkeeper";
                break;
        }


        await order.save();


        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            order: {
                _id: order._id,
                orderStatus: order.orderStatus,
                acceptedAt: order.acceptedAt,
                preparingAt: order.preparingAt,
                readyAt: order.readyAt,
                outForDeliveryAt: order.outForDeliveryAt,
                deliveredAt: order.deliveredAt,
                rejectionReason: order.rejectionReason
            }
        });
    }

module.exports = updateStatus;