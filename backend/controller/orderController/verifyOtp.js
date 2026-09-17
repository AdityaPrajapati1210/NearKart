const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require('../../models/userSchema');
const ExpressError = require('../../utils/ExpressError');
const calculateDistance = require('../../utils/calculateDistance');
const Order = require('../../models/orderSchema');
const verifyOtp = async (req, res) => {

    const { orderId } = req.params;
    const { otp } = req.body;


    // 1. Validate OTP input
    if (!otp) {
        throw new ExpressError(
            400,
            "OTP is required"
        );
    }


    // OTP must contain exactly 6 digits
    if (!/^\d{6}$/.test(String(otp))) {
        throw new ExpressError(
            400,
            "OTP must be a 6-digit number"
        );
    }


    // 2. Find order
    const order = await Order.findById(orderId);

    if (!order) {
        throw new ExpressError(
            404,
            "Order not found"
        );
    }


    // 3. Check order status
    if (order.orderStatus !== "OUT_FOR_DELIVERY") {
        throw new ExpressError(
            400,
            `OTP verification is not allowed when order status is ${order.orderStatus}`
        );
    }


    // 4. Check whether OTP exists
    if (
        !order.deliveryOTPHash ||
        !order.deliveryOTPExpiresAt
    ) {
        throw new ExpressError(
            400,
            "No active delivery OTP found"
        );
    }


    // 5. Check OTP expiry
    if (
        order.deliveryOTPExpiresAt <= new Date()
    ) {

        // Invalidate expired OTP
        order.deliveryOTPHash = undefined;
        order.deliveryOTPExpiresAt = undefined;
        order.deliveryOTPAttempts = 0;

        await order.save();

        throw new ExpressError(
            400,
            "Delivery OTP has expired"
        );
    }


    // 6. Maximum attempts
    const MAX_ATTEMPTS = 5;

    if (
        order.deliveryOTPAttempts >= MAX_ATTEMPTS
    ) {
        throw new ExpressError(
            429,
            "Too many incorrect OTP attempts. Generate a new OTP."
        );
    }


    // 7. Compare entered OTP with stored hash
    const isValidOTP = await bcrypt.compare(
        String(otp),
        order.deliveryOTPHash
    );


    // 8. Invalid OTP
    if (!isValidOTP) {

        order.deliveryOTPAttempts += 1;

        await order.save();

        const remainingAttempts =
            MAX_ATTEMPTS - order.deliveryOTPAttempts;


        if (remainingAttempts <= 0) {
            throw new ExpressError(
                429,
                "Too many incorrect OTP attempts. Generate a new OTP."
            );
        }


        throw new ExpressError(
            400,
            `Invalid OTP. ${remainingAttempts} attempts remaining.`
        );
    }


    // 9. OTP is correct
    order.orderStatus = "DELIVERED";
    order.deliveredAt = new Date();


    // 10. Invalidate OTP immediately
    order.deliveryOTPHash = undefined;
    order.deliveryOTPExpiresAt = undefined;
    order.deliveryOTPAttempts = 0;
    
    // 11. Save order
    await order.save();

    const user = await User.findById(order.user);

    if (!user) {
        throw new ExpressError(404, "User not found");
    }

    if (!user.orderHistory.includes(order._id)) {
        user.orderHistory.push(order._id);
        await user.save();
    }


    // 12. Success response
    return res.status(200).json({
        success: true,
        message: "OTP verified. Order marked as delivered.",
        order: {
            _id: order._id,
            orderStatus: order.orderStatus,
            deliveredAt: order.deliveredAt
        }
    });
}

module.exports = verifyOtp;