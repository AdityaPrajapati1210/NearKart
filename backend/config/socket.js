const { Server } = require("socket.io");

const joinOrderRoom = require("../socket/orderRoom");

const socketAuth = require("../socket/socketAuth");

let io;


const initializeSocket = (server, sessionMiddleware) => {

    io = new Server(server, {

        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }

    });


    // ==================================================
    // Express session → Socket.IO
    // ==================================================

    io.engine.use(sessionMiddleware);


    // ==================================================
    // Socket authentication
    // ==================================================

    io.use(socketAuth);


    // ==================================================
    // Socket connection
    // ==================================================

    io.on("connection", (socket) => {

        console.log(
            `Socket connected: ${socket.id} (${socket.role})`
        );


        // ==================================================
        // Join customer order room
        // ==================================================

        socket.on("join-order", async (orderId) => {

            try {

                await joinOrderRoom(
                    socket,
                    orderId
                );

                socket.emit(
                    "order-room-joined",
                    {
                        success: true,
                        orderId
                    }
                );

            } catch (error) {

                console.error(
                    "Join order room error:",
                    error.message
                );

                socket.emit(
                    "socket-error",
                    {
                        success: false,
                        message: error.message
                    }
                );

            }

        });


        // ==================================================
        // Disconnect
        // ==================================================

        socket.on("disconnect", (reason) => {

            console.log(
                `Socket disconnected: ${socket.id}`,
                reason
            );

        });

    });


    return io;
};


const getIO = () => {

    if (!io) {

        throw new Error(
            "Socket.IO has not been initialized"
        );

    }

    return io;

};


module.exports = {
    initializeSocket,
    getIO
};