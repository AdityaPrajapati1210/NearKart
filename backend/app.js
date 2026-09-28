require("dotenv").config();

const express = require("express");
const http = require("http");
const { initializeSocket } = require("./config/socket");

const app = express();

const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const orderRoute = require("./routes/orderRoute");

const session = require("express-session");

const shopkeeperDashboardRoutes = require("./routes/shopkeeper/dashboardRoutes");
const shopkeeperDashboardAnalyticsRoutes = require("./routes/shopkeeper/dashboardAnalyticsRoutes");

const storeRoutes = require("./routes/storeRoutes");
const riderRoutes = require("./routes/riderRoute");



// <<<<<<< HEAD
// ======================================================
// DATABASE
// ======================================================

require("./models/mongoose");
require("./config/redis");


// ======================================================
// MIDDLEWARE
// ======================================================
// >>>>>>> 51a1824 (socket and redis setup)

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


const sessionMiddleware = session({

    secret: process.env.SESSION_SECRET || "mysecret",

    resave: false,

    saveUninitialized: true,

    cookie: {
        expires: Date.now() + 24 * 60 * 60 * 1000,

        maxAge: 24 * 60 * 60 * 1000,

        httpOnly: true
    }

});

app.use(sessionMiddleware);


// ======================================================
// ROUTES
// ======================================================

app.use("/api/users", userRoute);

app.use("/api/products", productRoute);

app.use("/api/orders", orderRoute);

app.use(
    "/api/shopkeeper/dashboard",
    shopkeeperDashboardRoutes
);

app.use("/api/shopkeeper/dashboard/analytics",
    shopkeeperDashboardAnalyticsRoutes
);

app.use(
    "/api/shopkeeper/store",
    storeRoutes
);

app.use(
    "/api/riders",
    riderRoutes
);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {

    res.send("working");

});


// ======================================================
// ERROR HANDLING
// ======================================================

app.use((err, req, res, next) => {

    const {
        statusCode = 500,
        message = "Something went wrong!"
    } = err;

    res.status(statusCode).json({

        success: false,

        message: message

    });

});


// ======================================================
// HTTP SERVER
// ======================================================

const server = http.createServer(app);

initializeSocket(
    server,
    sessionMiddleware
);

server.listen(3000, () => {

    console.log(
        "Backend + Socket.IO started on port 3000."
    );

});