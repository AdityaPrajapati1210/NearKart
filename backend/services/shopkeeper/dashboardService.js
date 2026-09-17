const Order = require("../../models/orderSchema");

const Product = require("../../models/productSchema");



/**
 * Get current active orders
 */
const getCurrentOrders = async () => {

    const orders = await Order.find({

        orderStatus: {

            $in: [

                "PENDING",

                "ACCEPTED",

                "PREPARING",

                "READY",

                "OUT_FOR_DELIVERY"

            ]

        }

    })

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

                "orderStatus",

                "createdAt"

            ].join(" ")

        )

        .populate(

            "user",

            "name phone"

        )

        .sort({

            createdAt: -1

        })

        .lean();


    return orders;

};



/**
 * Get today's order statistics
 */
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

                                    [

                                        "PENDING",

                                        "ACCEPTED",

                                        "PREPARING",

                                        "READY",

                                        "OUT_FOR_DELIVERY"

                                    ]

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



/**
 * Get low-stock products
 */
const getLowStockProducts = async (

    threshold = 10

) => {

    const products = await Product.find({

        stock: {

            $lt: threshold

        }

    })

        .select(

            "name price offerPrice stock isAvailable image"

        )

        .sort({

            stock: 1

        })

        .lean();


    return products;

};



/**
 * Get top 5 selling products
 *
 * Calculates product sales from DELIVERED orders
 * during the last 7 days.
 */
const getTopSellingProducts = async () => {

    const sevenDaysAgo = new Date(

        Date.now() - 7 * 24 * 60 * 60 * 1000

    );


    const products = await Order.aggregate([

        // -----------------------------------
        // 1. Only delivered orders
        // -----------------------------------

        {

            $match: {

                orderStatus: "DELIVERED",

                createdAt: {

                    $gte: sevenDaysAgo

                }

            }

        },


        // -----------------------------------
        // 2. Break items into separate records
        // -----------------------------------

        {

            $unwind: "$items"

        },


        // -----------------------------------
        // 3. Group sales by product
        // -----------------------------------

        {

            $group: {

                _id: "$items.product",

                totalQuantitySold: {

                    $sum: "$items.quantity"

                }

            }

        },


        // -----------------------------------
        // 4. Highest selling products first
        // -----------------------------------

        {

            $sort: {

                totalQuantitySold: -1

            }

        },


        // -----------------------------------
        // 5. Only top 5
        // -----------------------------------

        {

            $limit: 5

        },


        // -----------------------------------
        // 6. Get product details
        // -----------------------------------

        {

            $lookup: {

                from: "products",

                localField: "_id",

                foreignField: "_id",

                as: "product"

            }

        },


        // -----------------------------------
        // 7. Convert product array to object
        // -----------------------------------

        {

            $unwind: {

                path: "$product",

                preserveNullAndEmptyArrays: false

            }

        },


        // -----------------------------------
        // 8. Select required product fields
        // -----------------------------------

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



module.exports = {

    getCurrentOrders,

    getTodayStats,

    getLowStockProducts,

    getTopSellingProducts

};