const Order = require("../models/orderSchema");

const joinOrderRoom = async (socket, orderId) => {

    // ==================================================
    // 1. Validate order ID
    // ==================================================

    if (!orderId) {
        throw new Error("Order ID is required");
    }

    // ==================================================
    // 2. Find order
    // ==================================================

    const order = await Order.findById(orderId)
        .select("_id user orderStatus rider")
        .lean();

    if (!order) {
        throw new Error("Order not found");
    }

    // ==================================================
    // 3. Join current order room (both standard & prefixed) + user room
    // ==================================================

    const roomName = `order:${order._id}`;

    socket.join(roomName);
    socket.join(order._id.toString());
    if (order.user) {
        socket.join(`user_${order.user.toString()}`);
    }

    console.log(
        `Socket ${socket.id} joined ${roomName}, ${order._id}, and user_${order.user}`
    );

    return roomName;
};

module.exports = joinOrderRoom;