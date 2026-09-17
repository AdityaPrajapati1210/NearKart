const Store = require("../../models/storeSchema");

const ExpressError = require("../../utils/ExpressError");

const {
    getTodayRangeIST
} = require("../../utils/indiaDateRange");

const {
    getCurrentOrders,
    getTodayStats,
    getLowStockProducts,
    getTopSellingProducts
} = require("../../services/shopkeeper/dashboardService");


/**
 * GET /api/shopkeeper/dashboard
 *
 * Main shopkeeper dashboard summary
 */
const getDashboard = async (req, res) => {

    // -----------------------------------
    // 1. Get main store
    // -----------------------------------

    const store = await Store.findOne({
        storeKey: "MAIN_STORE"
    })
        .select(
            "name isOpen deliveryRadius"
        )
        .lean();


    if (!store) {
        throw new ExpressError(
            404,
            "Store not initialized"
        );
    }


    // -----------------------------------
    // 2. Get today's IST date range
    // -----------------------------------

    const {
        startOfDay,
        endOfDay
    } = getTodayRangeIST();


    // -----------------------------------
    // 3. Fetch dashboard data
    // -----------------------------------

    const [
        currentOrders,
        todayStats,
        lowStockProducts,
        topSellingProducts
    ] = await Promise.all([

        getCurrentOrders(),

        getTodayStats(
            startOfDay,
            endOfDay
        ),

        getLowStockProducts(),

        getTopSellingProducts()

    ]);


    // -----------------------------------
    // 4. Send dashboard response
    // -----------------------------------

    res.status(200).json({

        success: true,

        message:
            "Dashboard data fetched successfully",


        store: {

            id: store._id,

            name: store.name,

            isOpen: store.isOpen,

            deliveryRadius:
                store.deliveryRadius

        },


        today: {

            totalOrders:
                todayStats.totalOrders,

            completedOrders:
                todayStats.completedOrders,

            cancelledOrders:
                todayStats.cancelledOrders,

            rejectedOrders:
                todayStats.rejectedOrders,

            pendingOrders:
                todayStats.pendingOrders,

            sale:
                todayStats.todaySale

        },


        currentOrders,


        lowStockProducts,


        topSellingProducts

    });

};


module.exports = {
    getDashboard
};