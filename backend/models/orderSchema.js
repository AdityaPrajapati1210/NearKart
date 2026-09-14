const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },
                name: {
                    type: String,
                    required: true,
                    trim: true
                },
                price: {
                    type: Number,
                    required: true,
                    min: 0
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },
                subtotal: {
                    type: Number,
                    required: true,
                    min: 0
                }
            }
        ],

        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        deliveryFee: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        discount: {
            type: Number,
            min: 0,
            default: 0
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        deliveryAddress: {
            label: {
                type: String,
                trim: true
            },

            address: {
                type: String,
                required: true,
                trim: true
            }
        },

        customerLocation: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
                default: "Point"
            },

            coordinates: {
                type: [Number],
                required: true
            }
        },

        shopLocation: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
                default: "Point"
            },

            coordinates: {
                type: [Number],
                required: true
            }
        },

        deliveryDistance: {
            type: Number,
            min: 0
        },

        paymentMethod: {
            type: String,
            enum: ["COD", "ONLINE"],
            required: true,
            default: "COD"
        },

        paymentStatus: {
            type: String,
            enum: [
                "PENDING",
                "PAID",
                "FAILED",
                "REFUNDED"
            ],
            default: "PENDING"
        },

        orderStatus: {
            type: String,
            enum: [
                "PENDING",
                "ACCEPTED",
                "PREPARING",
                "READY",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED",
                "REJECTED"
            ],
            default: "PENDING",
            index: true
        },

        deliveryOTPHash: {
            type: String
        },

        deliveryOTPExpiresAt: {
            type: Date
        },

        deliveryOTPAttempts: {
            type: Number,
            default: 0,
            min: 0
        },

        acceptedAt: Date,
        preparingAt: Date,
        readyAt: Date,
        outForDeliveryAt: Date,
        deliveredAt: Date,
        cancelledAt: Date,

        
        cancellationReason: {
            type: String,
            trim: true
        },

        rejectionReason: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);


// GeoJSON indexes
orderSchema.index({
    customerLocation: "2dsphere"
});

orderSchema.index({
    shopLocation: "2dsphere"
});


// Compound index for shopkeeper order management
orderSchema.index({
    orderStatus: 1,
    createdAt: -1
});


module.exports = mongoose.model("Order", orderSchema);