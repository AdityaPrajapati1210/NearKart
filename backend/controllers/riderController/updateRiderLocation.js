const Rider = require("../../models/riderSchema");

const Order = require("../../models/orderSchema");

const ExpressError = require("../../utils/ExpressError");

const redis = require("../../config/redis");

const { getIO } = require("../../config/socket");


const updateRiderLocation = async (req, res) => {

    // --------------------------------------------------
    // 1. Get logged-in rider
    // --------------------------------------------------

    const riderId = req.session.riderId;

    if (!riderId) {

        throw new ExpressError(
            401,
            "Rider authentication required"
        );

    }


    // --------------------------------------------------
    // 2. Get location
    // --------------------------------------------------

    const { latitude, longitude } = req.body;

    if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
    ) {

        throw new ExpressError(
            400,
            "Valid latitude and longitude are required"
        );

    }


    // --------------------------------------------------
    // 3. Validate coordinates
    // --------------------------------------------------

    if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {

        throw new ExpressError(
            400,
            "Invalid coordinates"
        );

    }


    // --------------------------------------------------
    // 4. Check rider
    // --------------------------------------------------

    const rider = await Rider.findById(riderId)
        .select("_id isActive");

    if (!rider) {

        throw new ExpressError(
            404,
            "Rider not found"
        );

    }

    if (!rider.isActive) {

        throw new ExpressError(
            403,
            "Rider account is inactive"
        );

    }


    // --------------------------------------------------
    // 5. Store latest location in Redis
    // --------------------------------------------------

    const location = {

        latitude,

        longitude,

        updatedAt: Date.now()

    };


    await redis.set(

        `rider:${riderId}:location`,

        JSON.stringify(location),

        "EX",

        60

    );


    // --------------------------------------------------
    // 6. Update rider's current location in MongoDB
    // --------------------------------------------------

    await Rider.findByIdAndUpdate(

        riderId,

        {

            currentLocation: {

                type: "Point",

                coordinates: [

                    longitude,

                    latitude

                ]

            },

            lastLocationUpdate: new Date()

        }

    );


    // --------------------------------------------------
    // 7. Find active delivery orders
    // --------------------------------------------------

    const activeOrders = await Order.find({

        rider: riderId,

        orderStatus: "OUT_FOR_DELIVERY"

    })
        .select("_id")
        .lean();


    // --------------------------------------------------
    // 8. Send live location to customer
    // --------------------------------------------------

    if (activeOrders.length > 0) {

        const io = getIO();


        for (const order of activeOrders) {

            io.to(`order:${order._id}`).emit(

                "rider-location",

                {

                    orderId: order._id,

                    location: {

                        latitude,

                        longitude

                    },

                    updatedAt: location.updatedAt

                }

            );

        }

    }


    // --------------------------------------------------
    // 9. Response
    // --------------------------------------------------

    res.status(200).json({

        success: true,

        message: "Location updated successfully",

        location

    });

};


module.exports = updateRiderLocation;