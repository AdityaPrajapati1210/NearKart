const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");

const {
    getTodayRangeIST
} = require("../../utils/indiaDateRange");


// =====================================================
// CONSTANTS
// =====================================================

const ACTIVE_ORDER_STATUSES = [
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY"
];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;


// =====================================================
// GET CURRENT ACTIVE ORDERS
// =====================================================

/**
 * Get today's active orders with pagination.
 *
 * Active statuses:
 * PENDING
 * ACCEPTED
 * PREPARING
 * READY
 * OUT_FOR_DELIVERY
 *
 * Pagination:
 * page  = current page
 * limit = orders per page
 *
 * Example:
 * getCurrentOrders({
 *     page: 1,
 *     limit: 10
 * })
 */
const getCurrentOrders = async ({
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT
} = {}) => {

    // -----------------------------------
    // 1. Validate pagination
    // -----------------------------------

    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1) {
        page = DEFAULT_PAGE;
    }

    if (!Number.isInteger(limit) || limit < 1) {
        limit = DEFAULT_LIMIT;
    }

    // Maximum 50 orders per request
    if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
    }


    // -----------------------------------
    // 2. Calculate pagination
    // -----------------------------------

    const skip = (page - 1) * limit;


    // -----------------------------------
    // 3. Active orders filter
    // -----------------------------------

    // IMPORTANT:
    // No createdAt filter here.
    //
    // This means:
    // - today's pending orders
    // - yesterday's pending orders
    // - older pending orders
    //
    // all remain visible until they reach
    // a final status.

    const filter = {

        orderStatus: {
            $in: ACTIVE_ORDER_STATUSES
        }
    };


    // -----------------------------------
    // 4. Fetch orders + total count
    // -----------------------------------

    const [
        orders,
        totalOrders
    ] = await Promise.all([

        Order.find(filter)

            .select(
                [
                    "user",
                    "items",
                    "subtotal",
                    "deliveryFee",
                    "discount",
                    "totalAmount",
                    "deliveryAddress",
                    "customerLocation",
                    "shopLocation",
                    "deliveryDistance",
                    "paymentMethod",
                    "paymentStatus",
                    "orderStatus",
                    "createdAt",
                    "updatedAt"
                ].join(" ")
            )

            .populate(
                "user",
                "name phone"
            )

            // Latest active order first
            // _id provides stable ordering
            .sort({
                createdAt: -1,
                _id: -1
            })

            .skip(skip)

            .limit(limit)

            .lean(),

        Order.countDocuments(filter)
    ]);


    // -----------------------------------
    // 5. Pagination metadata
    // -----------------------------------

    const totalPages = Math.ceil(
        totalOrders / limit
    );

    const hasNextPage =
        page < totalPages;

    const hasPreviousPage =
        page > 1;


    // -----------------------------------
    // 6. Return result
    // -----------------------------------

    return {

        orders,

        pagination: {

            page,

            limit,

            totalOrders,

            totalPages,

            hasNextPage,

            hasPreviousPage
        }
    };
};

// =====================================================
// GET TODAY'S ORDER STATISTICS
// =====================================================

const getTodayStats = async (
    startOfDay,
    endOfDay
) => {

    const result = await Order.aggregate([

        {
            $match: {

                createdAt: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            }
        },

        {
            $group: {

                _id: null,

                totalOrders: {
                    $sum: 1
                },

                completedOrders: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$orderStatus",
                                    "DELIVERED"
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },

                cancelledOrders: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$orderStatus",
                                    "CANCELLED"
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },

                rejectedOrders: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$orderStatus",
                                    "REJECTED"
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },

                pendingOrders: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    "$orderStatus",
                                    ACTIVE_ORDER_STATUSES
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },

                todaySale: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$orderStatus",
                                    "DELIVERED"
                                ]
                            },
                            "$totalAmount",
                            0
                        ]
                    }
                }
            }
        }
    ]);


    return result[0] || {

        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        rejectedOrders: 0,
        pendingOrders: 0,
        todaySale: 0
    };
};


// =====================================================
// GET LOW-STOCK PRODUCTS
// =====================================================

const getLowStockProducts = async (
    threshold = 10
) => {

    threshold = Number(threshold);

    if (
        !Number.isFinite(threshold) ||
        threshold < 0
    ) {
        threshold = 10;
    }


    const products = await Product.find({

        stock: {
            $lt: threshold
        }

    })

        .select(
            "name price offerPrice stock isAvailable image"
        )

        .sort({
            stock: 1,
            name: 1
        })

        .lean();


    return products;
};


// =====================================================
// GET TOP 5 SELLING PRODUCTS
// =====================================================

/**
 * Calculates product sales from DELIVERED orders
 * during the last 7 days.
 */

const getTopSellingProducts = async () => {

    const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
    );


    const products = await Order.aggregate([

        // ---------------------------------------------
        // 1. Only delivered orders from last 7 days
        // ---------------------------------------------

        {
            $match: {

                orderStatus: "DELIVERED",

                createdAt: {
                    $gte: sevenDaysAgo
                }
            }
        },


        // ---------------------------------------------
        // 2. Break items into separate records
        // ---------------------------------------------

        {
            $unwind: "$items"
        },


        // ---------------------------------------------
        // 3. Group sales by product
        // ---------------------------------------------

        {
            $group: {

                _id: "$items.product",

                totalQuantitySold: {
                    $sum: "$items.quantity"
                }
            }
        },


        // ---------------------------------------------
        // 4. Highest selling products first
        // ---------------------------------------------

        {
            $sort: {
                totalQuantitySold: -1
            }
        },


        // ---------------------------------------------
        // 5. Only top 5
        // ---------------------------------------------

        {
            $limit: 5
        },


        // ---------------------------------------------
        // 6. Get product details
        // ---------------------------------------------

        {
            $lookup: {

                from: "products",

                localField: "_id",

                foreignField: "_id",

                as: "product"
            }
        },


        // ---------------------------------------------
        // 7. Convert product array to object
        // ---------------------------------------------

        {
            $unwind: {

                path: "$product",

                preserveNullAndEmptyArrays: false
            }
        },


        // ---------------------------------------------
        // 8. Select required fields
        // ---------------------------------------------

        {
            $project: {

                _id: 0,

                productId: "$product._id",

                name: "$product.name",

                image: "$product.image",

                price: "$product.price",

                offerPrice: "$product.offerPrice",

                totalQuantitySold: 1
            }
        }
    ]);


    return products;
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getCurrentOrders,

    getTodayStats,

    getLowStockProducts,

    getTopSellingProducts
};