const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

async function setup() {
    await mongoose.connect("mongodb://127.0.0.1:27017/Nearkart");
    console.log("Connected to MongoDB");

    const User = require("../models/userSchema");
    const Store = require("../models/storeSchema");
    const Rider = require("../models/riderSchema");

    // 1. Create or Find Shopkeeper
    const email = "shopkeeper@nearkart.com";
    const phone = "9876543210";
    const plainPassword = "password123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    let shopkeeper = await User.findOne({ email });
    if (!shopkeeper) {
        shopkeeper = await User.create({
            name: "NearKart Shopkeeper",
            email,
            phone,
            password: hashedPassword,
            role: "shopkeeper"
        });
        console.log("Created new Shopkeeper User:", shopkeeper._id.toString());
    } else {
        shopkeeper.role = "shopkeeper";
        shopkeeper.password = hashedPassword;
        await shopkeeper.save();
        console.log("Updated existing Shopkeeper User:", shopkeeper._id.toString());
    }

    const shopkeeperId = shopkeeper._id.toString();

    // 2. Re-assign or create MAIN_STORE
    let store = await Store.findOne({ storeKey: "MAIN_STORE" });
    if (!store) {
        store = await Store.create({
            storeKey: "MAIN_STORE",
            name: "NearKart Store",
            description: "NearKart Daily Essentials & Grocery Store",
            shopkeeper: shopkeeper._id,
            phone: phone,
            location: {
                type: "Point",
                coordinates: [77.2090, 28.6139]
            },
            deliveryRadius: 10,
            isOpen: true
        });
        console.log("Created new MAIN_STORE:", store._id.toString());
    } else {
        store.shopkeeper = shopkeeper._id;
        store.name = "NearKart Store";
        store.description = "NearKart Daily Essentials & Grocery Store";
        store.phone = phone;
        store.location = {
            type: "Point",
            coordinates: [77.2090, 28.6139]
        };
        store.deliveryRadius = 10;
        store.isOpen = true;
        await store.save();
        console.log("Updated and re-assigned MAIN_STORE to Shopkeeper:", shopkeeperId);
    }

    // 3. Re-assign existing riders to this new shopkeeper
    const riderUpdate = await Rider.updateMany({}, { shopkeeper: shopkeeper._id });
    console.log("Updated riders shopkeeper association count:", riderUpdate.modifiedCount);

    // 4. Update .env file
    const envPath = path.join(__dirname, "..", ".env");
    const envContent = [
        "PORT=3000",
        "MONGO_URI=mongodb://127.0.0.1:27017/Nearkart",
        "SESSION_SECRET=nearkart_session_secret_key_2026",
        "",
        "# Store & Shopkeeper Details",
        `SHOPKEEPER_ID=${shopkeeperId}`,
        "STORE_NAME=NearKart Store",
        "STORE_DESCRIPTION=NearKart Daily Essentials & Grocery Store",
        `STORE_PHONE=${phone}`,
        "STORE_LATITUDE=28.6139",
        "STORE_LONGITUDE=77.2090",
        "STORE_DELIVERY_RADIUS=10",
        "",
        "# Cloudinary Configuration",
        "CLOUDINARY_CLOUD_NAME=",
        "CLOUDINARY_API_KEY=",
        "CLOUDINARY_API_SECRET="
    ].join("\n");

    fs.writeFileSync(envPath, envContent, "utf-8");
    console.log(".env file updated successfully at:", envPath);

    await mongoose.disconnect();
    console.log("Done!");
}

setup().catch((err) => {
    console.error("Setup failed:", err);
    process.exit(1);
});
