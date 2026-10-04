const Order = require("../../models/orderSchema");

const ExpressError = require("../../utils/ExpressError");

const redis = require("../../config/redis");


const getLiveRiderLocation = async (req, res) => {

    // --------------------------------------------------
    // 1. Get logged-in customer
    // --------------------------------------------------

    const userId = req.session.userId;

    if (!userId) {

        throw new ExpressError(
            401,
            "Please login first"
        );

    }


    // --------------------------------------------------
    // 2. Get order ID
    // --------------------------------------------------

    const { orderId } = req.params;

    if (!orderId) {

        throw new ExpressError(
            400,
            "Order ID is required"
        );

    }


    // --------------------------------------------------
    // 3. Find customer's order
    // --------------------------------------------------

    const order = await Order.findOne({

        _id: orderId,

        user: userId

    })
        .select("_id rider orderStatus")
        .lean();


    if (!order) {

        throw new ExpressError(
            404,
            "Order not found"
        );

    }


    // --------------------------------------------------
    // 4. Check order status
    // --------------------------------------------------

    const activeStatuses = ["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"];
    if (!activeStatuses.includes(order.orderStatus)) {
        return res.status(200).json({
            success: true,
            tracking: false,
            message: `Tracking available once accepted (current status: ${order.orderStatus})`,
            location: null
        });
    }

    // --------------------------------------------------
    // 5. Check rider assignment
    // --------------------------------------------------

    if (!order.rider) {
        return res.status(200).json({
            success: true,
            tracking: false,
            message: "No rider is assigned to this order yet",
            location: null
        });
    }


    // --------------------------------------------------
    // 6. Get latest location from Redis or MongoDB fallback
    // --------------------------------------------------

    let location = null;

    try {
        const redisKey = `rider:${order.rider}:location`;
        const locationData = await redis.get(redisKey);
        if (locationData) {
            location = JSON.parse(locationData);
        }
    } catch (err) {
        // Fall back to MongoDB below
    }

    if (!location) {
        const Rider = require("../../models/riderSchema");
        const rider = await Rider.findById(order.rider).select("currentLocation lastLocationUpdate").lean();
        if (rider && rider.currentLocation?.coordinates && (rider.currentLocation.coordinates[0] !== 0 || rider.currentLocation.coordinates[1] !== 0)) {
            location = {
                latitude: rider.currentLocation.coordinates[1],
                longitude: rider.currentLocation.coordinates[0],
                updatedAt: rider.lastLocationUpdate ? new Date(rider.lastLocationUpdate).getTime() : Date.now()
            };
        }
    }

    // --------------------------------------------------
    // 7. Rider location unavailable
    // --------------------------------------------------

    if (!location) {
        return res.status(200).json({
            success: true,
            tracking: false,
            message: "Rider location is currently unavailable",
            location: null
        });
    }


    // --------------------------------------------------
    // 9. Send current location
    // --------------------------------------------------

    res.status(200).json({

        success: true,

        tracking: true,

        orderId: order._id,

        lat: location.latitude,

        lng: location.longitude,

        location

    });

};


module.exports = getLiveRiderLocation;