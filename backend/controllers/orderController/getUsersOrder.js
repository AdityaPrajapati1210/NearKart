const User = require('../../models/userSchema');
const ExpressError = require('../../utils/ExpressError');
const calculateDistance = require('../../utils/calculateDistance');
const Order = require('../../models/orderSchema');

// current user ke orders ko hi find kerga...bole to meowwwwwww
const getUserOrder = async (req, res) => {

    const userId = req.session.userId;

    if (!userId) {
        throw new ExpressError(401, "You are not logged in");
    }


    // Query parameters
    const { status } = req.query;


    // Allowed order statuses
    const allowedStatuses = [
        "PENDING",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "REJECTED"
    ];


    // Validate status if provided
    if (status && !allowedStatuses.includes(status)) {
        throw new ExpressError(
            400,
            `Invalid order status. Allowed statuses: ${allowedStatuses.join(", ")}`
        );
    }


    // Base filter
    const filter = {
        user: userId
    };


    // Add status filter only when provided
    if (status) {
        filter.orderStatus = status;
    }


    // Fetch orders
    const orders = await Order.find(filter)
        .sort({
            createdAt: -1
        })
        .select(
            "-deliveryOTPHash " +
            "-deliveryOTPExpiresAt " +
            "-deliveryOTPAttempts"
        )
        .lean();


    res.status(200).json({
        success: true,
        count: orders.length,
        filters: {
            status: status || null
        },
        orders
    });
}

module.exports = getUserOrder;