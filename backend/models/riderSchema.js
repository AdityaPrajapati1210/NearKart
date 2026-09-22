const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: /^[6-9]\d{9}$/
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            sparse: true
        },

        passwordHash: {
            type: String,
            required: true
        },

        shopkeeper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        currentLocation: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },

            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },

        lastLocationUpdate: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

riderSchema.index({
    currentLocation: "2dsphere"
});

riderSchema.index({
    shopkeeper: 1,
    isActive: 1
});

const Rider = mongoose.model("Rider", riderSchema);

module.exports = Rider;