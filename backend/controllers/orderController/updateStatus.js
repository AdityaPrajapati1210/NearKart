const crypto = require("crypto");
const bcrypt = require("bcrypt");
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
                if (!order.plainOTP) {
                    const otp = crypto.randomInt(1000, 10000).toString();
                    order.deliveryOTPHash = await bcrypt.hash(otp, 10);
                    order.deliveryOTPExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    order.deliveryOTPAttempts = 0;
                    order.plainOTP = otp;
                }
                break;

            case "DELIVERED":
                order.deliveredAt = now;
                order.deliveryOTPHash = undefined;
                order.deliveryOTPExpiresAt = undefined;
                order.deliveryOTPAttempts = 0;
                order.plainOTP = undefined;
                if (order.paymentMethod === "COD") {
                    order.paymentStatus = "PAID";
                }
                break;

            case "REJECTED":
                order.rejectionReason =
                    req.body.reason?.trim() || "Order rejected by shopkeeper";
                break;
        }


        await order.save();

        try {
            const { getIO } = require("../../config/socket");
            const io = getIO();
            const payload = {
                orderId: order._id,
                orderStatus: order.orderStatus,
                status: order.orderStatus,
                otp: order.plainOTP,
                developmentOTP: order.plainOTP,
                paymentStatus: order.paymentStatus
            };
            io.to(`order:${order._id}`).emit("ORDER_STATUS_CHANGED", payload);
            io.to(order._id.toString()).emit("ORDER_STATUS_CHANGED", payload);
            if (order.user) {
                io.to(`user_${order.user}`).emit("ORDER_STATUS_CHANGED", payload);
            }
        } catch (sockErr) {
            console.warn("Socket broadcast error:", sockErr.message);
        }


        const populatedOrder = await Order.findById(order._id)
            .populate("user", "name phone email")
            .populate("rider", "name phone email")
            .select("-deliveryOTPHash -deliveryOTPExpiresAt -deliveryOTPAttempts")
            .lean();

        if (order.plainOTP) {
            populatedOrder.otp = order.plainOTP;
            populatedOrder.plainOTP = order.plainOTP;
            populatedOrder.developmentOTP = order.plainOTP;
        }

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            order: populatedOrder
        });
    }

module.exports = updateStatus;