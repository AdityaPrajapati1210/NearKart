const User = require('../../models/userSchema');
const ExpressError = require('../../utils/ExpressError');
const calculateDistance = require('../../utils/calculateDistance');
const Order = require('../../models/orderSchema');

const getOrderDetails = async (req, res) => {

        const { orderId } = req.params;
        const userId = req.session.userId;


        // 1. Find order
        const order = await Order.findById(orderId)
            .select(
                "-deliveryOTPHash " +
                "-deliveryOTPExpiresAt " +
                "-deliveryOTPAttempts"
            )
            .populate("user", "name phone email")
            .populate("rider", "name phone")
            .lean();

        // 2. Order not found
        if (!order) {
            throw new ExpressError(
                404,
                "Order not found"
            );
        }

        // 3. Authorization check
        const isRider = req.session.role === "rider" || req.session.riderId;
        const riderId = req.session.riderId || req.session.userId;
        const role = req.session.role;

        if (role === "customer" && order.user._id.toString() !== userId.toString()) {
            throw new ExpressError(403, "Access denied");
        }

        if (isRider && order.rider && order.rider._id.toString() !== riderId.toString()) {
            throw new ExpressError(403, "Access denied to other riders' orders");
        }

        // 4. Send order details
        res.status(200).json({
            success: true,
            order
        });
    };

    module.exports = getOrderDetails;