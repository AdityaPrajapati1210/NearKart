const express = require("express");

const router = express.Router();

const {
    createRider,
    getRiders,
    getRider,
    updateRider,
    deleteRider
} = require("../controllers/riderController");

const { isLoggedIn , isShopkeeper} = require('../middleware/auth');
const { validateCreateRider,validateUpdateRider} = require("../middleware/validateSchema");

const wrapAsync = require("../utils/Wrapasync");
const getRiderOrders = require(
    "../controllers/riderOrderController/getRiderOrders"
);

// Create rider
// POST /api/riders
router.post("/",isLoggedIn,isShopkeeper,validateCreateRider,wrapAsync(createRider));

// Get all riders
// GET /api/riders
router.get("/",isLoggedIn,isShopkeeper,wrapAsync(getRiders));

// Get single rider
// GET /api/riders/:riderId
router.get("/:riderId",isLoggedIn,isShopkeeper,wrapAsync(getRider));

// Update rider
// PATCH /api/riders/:riderId
router.patch("/:riderId",isLoggedIn,isShopkeeper,validateUpdateRider,wrapAsync(updateRider));

// Deactivate rider
// DELETE /api/riders/:riderId
router.delete("/:riderId",isLoggedIn,isShopkeeper,wrapAsync(deleteRider));

router.get(
    "/orders",
    isLoggedIn,
    isShopkeeper,
    wrapAsync(getRiderOrders)
);

module.exports = router;