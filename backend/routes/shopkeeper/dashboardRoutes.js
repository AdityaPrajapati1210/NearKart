const express = require("express");

const router = express.Router();

const { getDashboard } = require("../../controllers/shopkeeper/dashboardController");

const { isLoggedIn, isShopkeeper } = require("../../middleware/auth");


// Main shopkeeper dashboard
router.get("/", isLoggedIn, isShopkeeper, getDashboard);


module.exports = router;