const Order = require("../models/orderSchema");

const joinOrderRoom = async (socket, orderId) => {

    // ==================================================
    // 1. Customer authentication
    // ==================================================

    const userId = socket.request.session?.userId;

    if (!userId) {
        throw new Error(
            "Customer authentication required"
        );
    }


    // ==================================================
    // 2. Validate order ID
    // ==================================================

    if (!orderId) {
        throw new Error(
            "Order ID is required"
        );
    }


    // ==================================================
    // 3. Find customer's order
    // ==================================================

    const order = await Order.findOne({
        _id: orderId,
        user: userId
    })
        .select("_id orderStatus")
        .lean();


    if (!order) {
        throw new Error(
            "Order not found"
        );
    }


    // ==================================================
    // 4. Live tracking only during delivery
    // ==================================================

    if (order.orderStatus !== "OUT_FOR_DELIVERY") {
        throw new Error(
            "Live tracking is available only when the order is out for delivery"
        );
    }


    // ==================================================
    // 5. Leave previous order rooms
    // ==================================================

    for (const room of socket.rooms) {

        if (room.startsWith("order:")) {
            socket.leave(room);
        }

    }


    // ==================================================
    // 6. Join current order room
    // ==================================================

    const roomName = `order:${order._id}`;

    socket.join(roomName);


    console.log(
        `Socket ${socket.id} joined ${roomName}`
    );


    return roomName;
};

module.exports = joinOrderRoom;