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

    if (order.orderStatus !== "OUT_FOR_DELIVERY") {

        throw new ExpressError(
            400,
            "Live tracking is available only when the order is out for delivery"
        );

    }


    // --------------------------------------------------
    // 5. Check rider assignment
    // --------------------------------------------------

    if (!order.rider) {

        throw new ExpressError(
            404,
            "No rider is assigned to this order"
        );

    }


    // --------------------------------------------------
    // 6. Get latest location from Redis
    // --------------------------------------------------

    const redisKey = `rider:${order.rider}:location`;

    const locationData = await redis.get(redisKey);


    // --------------------------------------------------
    // 7. Rider location unavailable
    // --------------------------------------------------

    if (!locationData) {

        return res.status(200).json({

            success: true,

            tracking: false,

            message: "Rider location is currently unavailable",

            location: null

        });

    }


    // --------------------------------------------------
    // 8. Parse location
    // --------------------------------------------------

    let location;

    try {

        location = JSON.parse(locationData);

    } catch (error) {

        throw new ExpressError(
            500,
            "Invalid rider location data"
        );

    }


    // --------------------------------------------------
    // 9. Send current location
    // --------------------------------------------------

    res.status(200).json({

        success: true,

        tracking: true,

        orderId: order._id,

        location

    });

};


module.exports = getLiveRiderLocation;