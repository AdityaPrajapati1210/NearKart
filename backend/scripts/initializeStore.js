require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/userSchema");
const Store = require("../models/storeSchema");

const initializeStore = async () => {
    try {
        // 1. Database connection
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        await mongoose.connect(mongoURI);

        console.log("MongoDB connected");

        // 2. Required environment variables
        const {
            SHOPKEEPER_ID,
            STORE_NAME,
            STORE_DESCRIPTION,
            STORE_PHONE,
            STORE_LATITUDE,
            STORE_LONGITUDE,
            STORE_DELIVERY_RADIUS
        } = process.env;

        if (!SHOPKEEPER_ID) {
            throw new Error("SHOPKEEPER_ID is required");
        }

        if (!STORE_NAME) {
            throw new Error("STORE_NAME is required");
        }

        if (!STORE_LATITUDE || !STORE_LONGITUDE) {
            throw new Error(
                "STORE_LATITUDE and STORE_LONGITUDE are required"
            );
        }

        // 3. Convert numeric values
        const latitude = Number(STORE_LATITUDE);
        const longitude = Number(STORE_LONGITUDE);
        const deliveryRadius = Number(
            STORE_DELIVERY_RADIUS || 5
        );

        // 4. Validate coordinates
        if (
            !Number.isFinite(latitude) ||
            latitude < -90 ||
            latitude > 90
        ) {
            throw new Error("Invalid store latitude");
        }

        if (
            !Number.isFinite(longitude) ||
            longitude < -180 ||
            longitude > 180
        ) {
            throw new Error("Invalid store longitude");
        }

        // 5. Validate delivery radius
        if (
            !Number.isFinite(deliveryRadius) ||
            deliveryRadius < 0.1 ||
            deliveryRadius > 50
        ) {
            throw new Error(
                "STORE_DELIVERY_RADIUS must be between 0.1 and 50 KM"
            );
        }

        // 6. Check shopkeeper
        const shopkeeper = await User.findById(SHOPKEEPER_ID).select(
            "_id name role phone"
        );

        if (!shopkeeper) {
            throw new Error("Shopkeeper not found");
        }

        if (shopkeeper.role !== "shopkeeper") {
            throw new Error(
                "Provided SHOPKEEPER_ID does not belong to a shopkeeper"
            );
        }

        // 7. Create/update the single main store
        const store = await Store.findOneAndUpdate(
            {
                storeKey: "MAIN_STORE"
            },
            {
                $setOnInsert: {
                    storeKey: "MAIN_STORE",
                    name: STORE_NAME,
                    description: STORE_DESCRIPTION || "",
                    shopkeeper: shopkeeper._id,
                    phone: STORE_PHONE || shopkeeper.phone || "",
                    location: {
                        type: "Point",
                        coordinates: [
                            longitude,
                            latitude
                        ]
                    },
                    deliveryRadius,
                    isOpen: true
                }
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
                runValidators: true
            }
        );

        console.log("\nStore initialized successfully\n");

        console.log({
            id: store._id.toString(),
            name: store.name,
            shopkeeper: shopkeeper.name,
            location: store.location.coordinates,
            deliveryRadius: `${store.deliveryRadius} KM`,
            isOpen: store.isOpen
        });

    } catch (error) {
        console.error("\nStore initialization failed:");
        console.error(error.message);

        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log("\nMongoDB disconnected");
    }
};

initializeStore();