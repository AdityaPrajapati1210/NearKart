const User = require('../../models/userSchema');
const ExpressError = require('../../utils/ExpressError');
const calculateDistance = require('../../utils/calculateDistance');
const Order = require('../../models/orderSchema');

const getOrderDetails = async (req, res) => {

        const { orderId } = req.params;
        const userId = req.session.userId;


        // 1. Find order belonging to logged-in user
        const order = await Order.findOne({
            _id: orderId,
            user: userId
        })
            // 2. Don't expose sensitive OTP information
            .select(
                "-deliveryOTPHash " +
                "-deliveryOTPExpiresAt " +
                "-deliveryOTPAttempts"
            )
            .lean();


        // 3. Order not found
        if (!order) {
            throw new ExpressError(
                404,
                "Order not found"
            );
        }


        // 4. Send order details
        res.status(200).json({
            success: true,
            order
        });
    };

    module.exports = getOrderDetails;