const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require('../../models/userSchema');
const ExpressError = require('../../utils/ExpressError');
const calculateDistance = require('../../utils/calculateDistance');
const Order = require('../../models/orderSchema');

// current user ke orders ko hi find kerga...bole to meowwwwwww
const getUserOrder = async (req, res) => {

    const user = await User.findById(req.session.userId)
        .select("role")
        .lean();

    if (!user) {
        if (req.session) {
            req.session.destroy(() => {});
        }
        res.clearCookie('connect.sid');
        throw new ExpressError(401, "Please login first");
    }



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
        .populate("rider", "name phone currentLocation lastLocationUpdate")
        .lean();


    const enrichedOrders = await Promise.all(orders.map(async (order) => {
        let riderLocation = null;
        if (order.rider && order.rider.currentLocation?.coordinates) {
            const coords = order.rider.currentLocation.coordinates;
            if (coords[0] !== 0 || coords[1] !== 0) {
                riderLocation = {
                    lat: coords[1],
                    lng: coords[0]
                };
            }
        }

        let updatedOrder = {
            ...order,
            riderLocation: riderLocation
        };

        if (order.orderStatus === "OUT_FOR_DELIVERY") {
            let plainOTP = order.plainOTP;
            if (!plainOTP) {
                plainOTP = crypto.randomInt(1000, 10000).toString();
                const otpHash = await bcrypt.hash(plainOTP, 10);
                await Order.findByIdAndUpdate(order._id, {
                    plainOTP: plainOTP,
                    deliveryOTPHash: otpHash,
                    deliveryOTPExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    deliveryOTPAttempts: 0
                });
            }
            updatedOrder = {
                ...updatedOrder,
                plainOTP: plainOTP,
                otp: plainOTP,
                developmentOTP: plainOTP
            };
        }
        return updatedOrder;
    }));

    res.status(200).json({
        success: true,
        count: enrichedOrders.length,
        filters: {
            status: status || null
        },
        orders: enrichedOrders
    });
}

module.exports = getUserOrder;