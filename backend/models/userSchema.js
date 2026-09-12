
const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 10
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["customer", "shopkeeper", "admin"],
        default: "customer"
    },
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },

            quantity: {
                type: Number,
                required: true,
                min: 1,
                default: 1,
            },
        },
    ],
    addresses: [
        {
            label: {
                type: String,
                enum: ["home", "college", "hostel", "other"],
                default: "other",
            },

            address: {
                type: String,
                required: true,
                trim: true,
            },

            latitude: {
                type: Number,
            },

            longitude: {
                type: Number,
            }
        },
    ],
    location: {
        latitude: {
            type: Number,
        },

        longitude: {
            type: Number,
        },

        updatedAt: {
            type: Date,
        },
    },
    orderHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
    ],

},
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);