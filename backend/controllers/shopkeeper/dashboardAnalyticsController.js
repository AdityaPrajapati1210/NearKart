const ExpressError = require("../../utils/ExpressError");

const {
    getMonthlyAnalytics,
    getYearlyAnalytics
} = require("../../services/shopkeeper/dashboardAnalyticsService");


/**
 * GET /api/shopkeeper/dashboard/analytics/month
 *
 * Query:
 * ?year=2026&month=9
 */
const getMonthlyDashboardAnalytics = async (req, res) => {

    // -----------------------------------
    // 1. Get query parameters
    // -----------------------------------

    const year = Number(req.query.year);
    const month = Number(req.query.month);


    // -----------------------------------
    // 2. Validate year
    // -----------------------------------

    if (
        !Number.isInteger(year) ||
        year < 2020 ||
        year > 2100
    ) {
        throw new ExpressError(
            400,
            "Invalid year"
        );
    }


    // -----------------------------------
    // 3. Validate month
    // -----------------------------------

    if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
    ) {
        throw new ExpressError(
            400,
            "Month must be between 1 and 12"
        );
    }


    // -----------------------------------
    // 4. Get analytics
    // -----------------------------------

    const analytics =
        await getMonthlyAnalytics(
            year,
            month
        );


    // -----------------------------------
    // 5. Send response
    // -----------------------------------

    res.status(200).json({

        success: true,

        message:
            "Monthly analytics fetched successfully",

        period: {
            type: "month",
            year,
            month
        },

        analytics: {
            totalOrders:
                analytics.totalOrders,

            deliveredOrders:
                analytics.deliveredOrders,

            cancelledOrders:
                analytics.cancelledOrders,

            rejectedOrders:
                analytics.rejectedOrders,

            pendingOrders:
                analytics.pendingOrders,

            sales:
                analytics.sales
        }
    });
};


/**
 * GET /api/shopkeeper/dashboard/analytics/year
 *
 * Query:
 * ?year=2026
 */
const getYearlyDashboardAnalytics = async (req, res) => {

    // -----------------------------------
    // 1. Get year
    // -----------------------------------

    const year = Number(req.query.year);


    // -----------------------------------
    // 2. Validate year
    // -----------------------------------

    if (
        !Number.isInteger(year) ||
        year < 2020 ||
        year > 2100
    ) {
        throw new ExpressError(
            400,
            "Invalid year"
        );
    }


    // -----------------------------------
    // 3. Get analytics
    // -----------------------------------

    const analytics =
        await getYearlyAnalytics(
            year
        );


    // -----------------------------------
    // 4. Send response
    // -----------------------------------

    res.status(200).json({

        success: true,

        message:
            "Yearly analytics fetched successfully",

        period: {
            type: "year",
            year
        },

        analytics
    });
};


module.exports = {
    getMonthlyDashboardAnalytics,
    getYearlyDashboardAnalytics
};