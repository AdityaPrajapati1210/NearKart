const express = require("express");
const router = express.Router();

const {
    getMonthlyDashboardAnalytics,
    getYearlyDashboardAnalytics
} = require("../../controllers/shopkeeper/dashboardAnalyticsController");

const { isLoggedIn, isShopkeeper } = require("../../middleware/auth");


// -----------------------------------
// Monthly Analytics
// GET /api/shopkeeper/dashboard/analytics/month
// ?year=2026&month=9
// -----------------------------------

router.get(
    "/month",
    isLoggedIn,
    isShopkeeper,
    getMonthlyDashboardAnalytics
);


// -----------------------------------
// Yearly Analytics
// GET /api/shopkeeper/dashboard/analytics/year
// ?year=2026
// -----------------------------------

router.get(
    "/year",
    isLoggedIn,
    isShopkeeper,
    getYearlyDashboardAnalytics
);


module.exports = router;