
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    offerPrice: {
        type: Number,
        default: 0
    },

    category: {
        type: String,
        required: true,
        trim: true
    },

    image: {
        type: String
    },

    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },

    isAvailable: {
        type: Boolean,
        default: true
    },
    salesCount: {
        type: Number,
        default: 0
    }
},
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Product", productSchema);