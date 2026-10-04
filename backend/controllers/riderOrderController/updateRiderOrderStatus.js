const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Order = require("../../models/orderSchema");
const Rider = require("../../models/riderSchema");
const ExpressError = require("../../utils/ExpressError");

const updateRiderOrderStatus = async (req, res) => {

    const { orderId } = req.params;
    const { status } = req.body;

    // --------------------------------------------------
    // 1. Validate status
    // --------------------------------------------------

    if (!status) {
        throw new ExpressError(
            400,
            "Order status is required"
        );
    }

    // --------------------------------------------------
    // 2. Allowed rider statuses
    // --------------------------------------------------

    const allowedStatuses = [
        "OUT_FOR_DELIVERY"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new ExpressError(
            400,
            "Invalid rider order status"
        );
    }

    // --------------------------------------------------
    // 3. Get rider from session
    // --------------------------------------------------

    const riderId = req.session.riderId || req.session.userId;

    if (!riderId) {
        throw new ExpressError(
            401,
            "Rider authentication required"
        );
    }

    // --------------------------------------------------
    // 4. Find order
    // --------------------------------------------------

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ExpressError(
            404,
            "Order not found"
        );
    }

    // --------------------------------------------------
    // 5. Check rider assignment
    // --------------------------------------------------

    if (order.rider && order.rider.toString() !== riderId.toString()) {
        throw new ExpressError(
            403,
            "This order is assigned to another rider"
        );
    }

    // If order has no rider assigned yet, auto-assign this rider
    if (!order.rider) {
        order.rider = riderId;
    }

    // --------------------------------------------------
    // 6. Check current status
    // --------------------------------------------------

    if (order.orderStatus !== "READY") {
        throw new ExpressError(
            400,
            `Order cannot be moved to OUT_FOR_DELIVERY from ${order.orderStatus}`
        );
    }

    // --------------------------------------------------
    // 7. Update status & Generate Delivery OTP
    // --------------------------------------------------

    order.orderStatus = "OUT_FOR_DELIVERY";
    order.outForDeliveryAt = new Date();

    // Auto-generate 4-digit OTP if not already set
    let otp = order.plainOTP;
    if (!otp) {
        otp = crypto.randomInt(1000, 10000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        order.deliveryOTPHash = otpHash;
        order.deliveryOTPExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        order.deliveryOTPAttempts = 0;
        order.plainOTP = otp;
    }

    await order.save();

    console.log("\n" + "=".repeat(50));
    console.log(`🔑 [DELIVERY OTP] Order [${order._id}] -> OUT_FOR_DELIVERY`);
    console.log(`>>> OTP: ${otp} <<<`);
    console.log("=".repeat(50) + "\n");

    // Real-time broadcast to customer and active rooms
    try {
        const { getIO } = require("../../config/socket");
        const io = getIO();

        let riderLocation = null;
        if (order.rider) {
            const riderDoc = await Rider.findById(order.rider).select("currentLocation").lean();
            if (riderDoc?.currentLocation?.coordinates) {
                const coords = riderDoc.currentLocation.coordinates;
                if (coords[0] !== 0 || coords[1] !== 0) {
                    riderLocation = { lat: coords[1], lng: coords[0] };
                }
            }
        }

        const payload = {
            orderId: order._id,
            orderStatus: "OUT_FOR_DELIVERY",
            status: "OUT_FOR_DELIVERY",
            otp: otp,
            developmentOTP: otp,
            paymentStatus: order.paymentStatus,
            riderLocation
        };
        io.to(`order:${order._id}`).emit("ORDER_STATUS_CHANGED", payload);
        io.to(order._id.toString()).emit("ORDER_STATUS_CHANGED", payload);
        if (order.user) {
            io.to(`user_${order.user}`).emit("ORDER_STATUS_CHANGED", payload);
        }

        if (riderLocation) {
            const locPayload = {
                orderId: order._id,
                riderId: order.rider.toString(),
                lat: riderLocation.lat,
                lng: riderLocation.lng,
                location: { latitude: riderLocation.lat, longitude: riderLocation.lng },
                updatedAt: Date.now()
            };
            io.to(`order:${order._id}`).emit("RIDER_LOCATION_UPDATED", locPayload);
            io.to(order._id.toString()).emit("RIDER_LOCATION_UPDATED", locPayload);
            io.emit("RIDER_LOCATION_BROADCAST", locPayload);
        }
    } catch (sockErr) {
        console.warn("Socket broadcast error:", sockErr.message);
    }

    // --------------------------------------------------
    // 8. Response
    // --------------------------------------------------

    res.status(200).json({
        success: true,
        message: "Order is now out for delivery",
        order: {
            id: order._id,
            _id: order._id,
            orderStatus: order.orderStatus,
            rider: order.rider,
            outForDeliveryAt: order.outForDeliveryAt,
            otp: otp,
            developmentOTP: otp
        }
    });
};

module.exports = updateRiderOrderStatus;