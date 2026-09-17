const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
    {
        storeKey: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
            default: "MAIN_STORE"
        },

        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500
        },

        shopkeeper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        phone: {
            type: String,
            trim: true
        },

        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
                default: "Point"
            },

            coordinates: {
                type: [Number],
                required: true,

                validate: {
                    validator: function (value) {
                        return (
                            value.length === 2 &&
                            value[0] >= -180 &&
                            value[0] <= 180 &&
                            value[1] >= -90 &&
                            value[1] <= 90
                        );
                    },

                    message:
                        "Location coordinates must be [longitude, latitude]"
                }
            }
        },

        deliveryRadius: {
            type: Number,
            required: true,
            min: 0.1,
            max: 50,
            default: 5
        },

        isOpen: {
            type: Boolean,
            default: true
        }
    },

    {
        timestamps: true
    }
);


storeSchema.index({
    location: "2dsphere"
});


module.exports = mongoose.model(
    "Store",
    storeSchema
);