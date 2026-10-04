const socketAuth = (socket, next) => {
    try {
        const session = socket.request.session;
        const auth = socket.handshake.auth || {};
        const query = socket.handshake.query || {};

        const riderId = session?.riderId || auth.riderId || query.riderId;
        const userId = session?.userId || auth.userId || query.userId;

        if (riderId) {
            socket.riderId = riderId.toString();
            socket.role = "rider";
            return next();
        }

        if (userId) {
            socket.userId = userId.toString();
            socket.role = auth.role || "customer";
            return next();
        }

        // Allow guest / pre-authenticated connection so socket doesn't loop fail
        socket.role = "guest";
        return next();
    } catch (err) {
        return next();
    }
};

module.exports = socketAuth;