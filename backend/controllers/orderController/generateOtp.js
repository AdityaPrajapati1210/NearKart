const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require('../../models/userSchema');
const ExpressError = require('../../utils/ExpressError');
const calculateDistance = require('../../utils/calculateDistance');
const Order = require('../../models/orderSchema');

const generateOtp = async (req, res) => {

    const { orderId } = req.params;


    // 1. Find order
    const order = await Order.findById(orderId);

    if (!order) {
        throw new ExpressError(
            404,
            "Order not found"
        );
    }

    // Authorization: If rider, must be the assigned rider
    const isRiderCaller = req.session.role === "rider" || req.session.riderId;
    if (isRiderCaller) {
        const riderId = req.session.riderId || req.session.userId;
        if (!order.rider || order.rider.toString() !== riderId.toString()) {
            throw new ExpressError(
                403,
                "You are not the assigned rider for this order"
            );
        }
    }

    // 2. OTP can only be generated for out-for-delivery order
    if (order.orderStatus !== "OUT_FOR_DELIVERY") {
        throw new ExpressError(
            400,
            `OTP can only be generated when order status is OUT_FOR_DELIVERY`
        );
    }

    // 4. Generate 4-digit OTP
    const otp = crypto
        .randomInt(1000, 10000)
        .toString();

    // 5. Hash OTP before storing
    const otpHash = await bcrypt.hash(otp, 10);

    // 6. OTP expires after 24 hours
    const expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
    );

    // 7. Save OTP information
    order.deliveryOTPHash = otpHash;
    order.deliveryOTPExpiresAt = expiresAt;
    order.deliveryOTPAttempts = 0;
    order.plainOTP = otp;

    await order.save();

    console.log("\n" + "=".repeat(50));
    console.log(`🔑 [DEVELOPMENT] DELIVERY OTP FOR ORDER [${order._id}]`);
    console.log(`>>> OTP: ${otp} <<<`);
    console.log("=".repeat(50) + "\n");

    try {
        const { getIO } = require("../../config/socket");
        const io = getIO();
        const payload = {
            orderId: order._id,
            orderStatus: order.orderStatus,
            status: order.orderStatus,
            otp: otp,
            developmentOTP: otp,
            paymentStatus: order.paymentStatus
        };
        io.to(`order:${order._id}`).emit("ORDER_STATUS_CHANGED", payload);
        io.to(order._id.toString()).emit("ORDER_STATUS_CHANGED", payload);
        if (order.user) {
            io.to(`user_${order.user}`).emit("ORDER_STATUS_CHANGED", payload);
        }
    } catch (sockErr) {}

    return res.status(200).json({
        success: true,
        message: "Delivery OTP generated successfully",
        otp: otp,
        developmentOTP: otp,
        otpExpiresAt: expiresAt
    });
};

module.exports = generateOtp;