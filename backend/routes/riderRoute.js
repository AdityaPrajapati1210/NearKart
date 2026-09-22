const express = require("express");

const router = express.Router();

const {
    createRider,
    getRiders,
    getRider,
    updateRider,
    deleteRider,
    loginRider,
    getRiderProfile,
    updateRiderLocation,
    logoutRider
} = require("../controllers/riderController");

const { isLoggedIn, isShopkeeper, isRider } = require("../middleware/auth");
const { validateCreateRider, validateUpdateRider } = require("../middleware/validateSchema");

const wrapAsync = require("../utils/Wrapasync");
const getRiderOrders = require("../controllers/riderOrderController/getRiderOrders");
const updateRiderOrderStatus = require("../controllers/riderOrderController/updateRiderOrderStatus");
const acceptOrder = require("../controllers/riderOrderController/acceptOrder");
const generateOtp = require("../controllers/orderController/generateOtp");
const verifyOtp = require("../controllers/orderController/verifyOtp");
const getOrderDetails = require("../controllers/orderController/getOrderDetails");

// ======================================================
// 1. RIDER AUTH & PROFILE
// ======================================================

// Direct rider login (also supported via /api/users/login)
router.post("/login", wrapAsync(loginRider));

// Rider logout
router.post("/logout", isRider, logoutRider);

// Rider profile
router.get("/profile", isRider, wrapAsync(getRiderProfile));
router.get("/me", isRider, wrapAsync(getRiderProfile));

// Rider GPS location update
router.patch("/location", isRider, wrapAsync(updateRiderLocation));

// ======================================================
// 2. RIDER ORDER OPERATIONS (Must come before /:riderId)
// ======================================================

// View assigned & available orders
router.get("/orders", isRider, wrapAsync(getRiderOrders));
router.get("/orders/available", isRider, wrapAsync(getRiderOrders));

// View specific order details
router.get("/orders/:orderId", isRider, wrapAsync(getOrderDetails));

// Rider accepts an available order
router.patch("/orders/:orderId/accept", isRider, wrapAsync(acceptOrder));

// Rider marks order as OUT_FOR_DELIVERY
router.patch("/orders/:orderId/status", isRider, wrapAsync(updateRiderOrderStatus));

// Rider generates / sends delivery OTP to customer
router.post("/orders/:orderId/otp", isRider, wrapAsync(generateOtp));

// Rider verifies delivery OTP from customer
router.post("/orders/:orderId/otp/verify", isRider, wrapAsync(verifyOtp));

// ======================================================
// 3. SHOPKEEPER RIDER MANAGEMENT
// ======================================================

// Create rider
// POST /api/riders
router.post("/", isLoggedIn, isShopkeeper, validateCreateRider, wrapAsync(createRider));

// Get all riders of this shopkeeper
// GET /api/riders
router.get("/", isLoggedIn, isShopkeeper, wrapAsync(getRiders));

// Get single rider
// GET /api/riders/:riderId
router.get("/:riderId", isLoggedIn, isShopkeeper, wrapAsync(getRider));

// Update rider
// PATCH /api/riders/:riderId
router.patch("/:riderId", isLoggedIn, isShopkeeper, validateUpdateRider, wrapAsync(updateRider));

// Deactivate rider
// DELETE /api/riders/:riderId
router.delete("/:riderId", isLoggedIn, isShopkeeper, wrapAsync(deleteRider));

module.exports = router;