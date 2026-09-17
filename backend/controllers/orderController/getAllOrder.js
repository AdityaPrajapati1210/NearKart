const User = require('../../models/userSchema');
const ExpressError = require('../../utils/ExpressError');
const calculateDistance = require('../../utils/calculateDistance');
const Order = require('../../models/orderSchema');

const getAllOrder = async (req, res) => {

        let { page = 1, limit = 20 } = req.query;

        page = Number(page);
        limit = Number(limit);


        // Validate pagination
        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            throw new ExpressError(
                400,
                "Invalid pagination parameters"
            );
        }


        const skip = (page - 1) * limit;


        const [orders, totalOrders] = await Promise.all([

            Order.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select(
                    "-deliveryOTPHash " +
                    "-deliveryOTPExpiresAt " +
                    "-deliveryOTPAttempts"
                )
                .populate("user", "name phone email")
                .lean(),

            Order.countDocuments({})
        ]);


        return res.status(200).json({
            success: true,

            pagination: {
                page,
                limit,
                totalOrders,
                totalPages: Math.ceil(totalOrders / limit),
                hasNextPage: page * limit < totalOrders,
                hasPreviousPage: page > 1
            },

            orders
        });
    }

module.exports = getAllOrder;