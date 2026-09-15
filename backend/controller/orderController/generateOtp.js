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

    // 2. OTP can only be generated for out-for-delivery order
    if (order.orderStatus !== "OUT_FOR_DELIVERY") {
        throw new ExpressError(
            400,
            `OTP can only be generated when order status is OUT_FOR_DELIVERY`
        );
    }

    // 3. Prevent generating a new OTP before old one expires
    if (
        order.deliveryOTPExpiresAt &&
        order.deliveryOTPExpiresAt > new Date()
    ) {
        throw new ExpressError(
            400,
            "A delivery OTP is already active"
        );
    }

    // 4. Generate 6-digit OTP
    const otp = crypto
        .randomInt(100000, 1000000)
        .toString();

    // 5. Hash OTP before storing
    const otpHash = await bcrypt.hash(otp, 10);

    // 6. OTP expires after 5 minutes
    const expiresAt = new Date(
        Date.now() + 5 * 60 * 1000
    );

    // 7. Save OTP information
    order.deliveryOTPHash = otpHash;
    order.deliveryOTPExpiresAt = expiresAt;
    order.deliveryOTPAttempts = 0;

    await order.save();

    /*
        IMPORTANT:

        Production:
        Send `otp` through SMS / WhatsApp.
        Do NOT return the OTP in API response.

        Example:
        await sendDeliveryOTP(order.user, otp);
    */

    console.log(
        `Delivery OTP for Order ${order._id}: ${otp}`
    );

    return res.status(200).json({
        success: true,
        message: "Delivery OTP generated successfully",

        otpExpiresAt: expiresAt,

        // REMOVE THIS IN PRODUCTION
        developmentOTP: otp
    })
};

module.exports = generateOtp;