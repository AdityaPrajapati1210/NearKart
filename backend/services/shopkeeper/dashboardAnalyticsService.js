const Order = require("../../models/orderSchema");
const Wrapasync = require('../../utils/Wrapasync')
const {
    getMonthRangeIST,
    getYearRangeIST
} = require("../../utils/indiaDateRange");


const ACTIVE_ORDER_STATUSES = [
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY"
];


// -----------------------------------
// Monthly Analytics
// -----------------------------------

const getMonthlyAnalytics = Wrapasync(async (year, month) => {

    const {
        startOfMonth,
        endOfMonth
    } = getMonthRangeIST(year, month);


    const result = await Order.aggregate([

        {
            $match: {
                createdAt: {
                    $gte: startOfMonth,
                    $lt: endOfMonth
                }
            }
        },

        {
            $group: {
                _id: null,
                totalOrders: {
                    $sum: 1
                },

                deliveredOrders: {
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

                sales: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$orderStatus",
                                    "DELIVERED"
                                ]
                            },
                            {
                                $ifNull: [
                                    "$totalAmount",
                                    0
                                ]
                            },
                            0
                        ]
                    }
                }
            }
        }
    ]);


    return result[0] || {
        totalOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        rejectedOrders: 0,
        pendingOrders: 0,
        sales: 0
    };
});

// -----------------------------------
// Yearly Analytics
// -----------------------------------

const getYearlyAnalytics = Wrapasync(async (year) => {

    const {
        startOfYear,
        endOfYear
    } = getYearRangeIST(year);


    const result = await Order.aggregate([

        {
            $match: {
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear
                }
            }
        },

        {
            $group: {

                _id: {
                    month: {
                        $month: {
                            date: "$createdAt",
                            timezone: "Asia/Kolkata"
                        }
                    }
                },

                totalOrders: {
                    $sum: 1
                },

                deliveredOrders: {
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

                sales: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$orderStatus",
                                    "DELIVERED"
                                ]
                            },
                            {
                                $ifNull: [
                                    "$totalAmount",
                                    0
                                ]
                            },
                            0
                        ]
                    }
                }
            }
        },

        {
            $sort: {
                "_id.month": 1
            }
        }
    ]);

    return result;
});


module.exports = {
    getMonthlyAnalytics,
    getYearlyAnalytics
};