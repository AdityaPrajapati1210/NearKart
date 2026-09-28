const socketAuth = (socket, next) => {

    const session = socket.request.session;

    // --------------------------------------------------
    // 1. Check session
    // --------------------------------------------------

    if (!session) {

        return next(
            new Error("Authentication required")
        );

    }


    // --------------------------------------------------
    // 2. Check customer or rider
    // --------------------------------------------------

    if (
        !session.userId &&
        !session.riderId
    ) {

        return next(
            new Error("Please login first")
        );

    }


    // --------------------------------------------------
    // 3. Store authenticated identity on socket
    // --------------------------------------------------

    if (session.riderId) {

        socket.riderId = session.riderId;

        socket.role = "rider";

    } else {

        socket.userId = session.userId;

        socket.role = "customer";

    }


    next();
};


module.exports = socketAuth;