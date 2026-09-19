const Store = require("../models/storeSchema");
const ExpressError = require("../utils/ExpressError");


// -----------------------------------
// GET STORE
// GET /api/shopkeeper/store
// -----------------------------------

const getStore = async (req, res) => {

    const store = await Store.findOne({
        shopkeeper: req.session.userId
    });

    if (!store) {
        throw new ExpressError(404, "Store not found");
    }

    res.status(200).json({
        success: true,
        message: "Store fetched successfully",
        store
    });
};


// -----------------------------------
// UPDATE STORE
// PATCH /api/shopkeeper/store
// -----------------------------------

const updateStore = async (req, res) => {

    const {
        name,
        description,
        phone,
        deliveryRadius
    } = req.body;

    const store = await Store.findOne({
        shopkeeper: req.session.userId
    });

    if (!store) {
        throw new ExpressError(404, "Store not found");
    }

    if (name !== undefined) {
        store.name = name;
    }

    if (description !== undefined) {
        store.description = description;
    }

    if (phone !== undefined) {
        store.phone = phone;
    }

    if (deliveryRadius !== undefined) {
        store.deliveryRadius = deliveryRadius;
    }

    await store.save();

    res.status(200).json({
        success: true,
        message: "Store updated successfully",
        store
    });
};


// -----------------------------------
// UPDATE STORE STATUS
// PATCH /api/shopkeeper/store/status
// -----------------------------------

const updateStoreStatus = async (req, res) => {

        console.log("REQ BODY:", req.body);
    console.log("isOpen:", req.body.isOpen);
    console.log("TYPE:", typeof req.body.isOpen);

    const { isOpen } = req.body;

    if (typeof isOpen !== "boolean") {
        throw new ExpressError(
            400,
            "isOpen must be a boolean"
        );
    }


    const store = await Store.findOne({
        shopkeeper: req.session.userId
    });

    if (!store) {
        throw new ExpressError(404, "Store not found");
    }

    store.isOpen = isOpen;

    await store.save();

    res.status(200).json({
        success: true,
        message: isOpen
            ? "Store opened successfully"
            : "Store closed successfully",
        isOpen: store.isOpen
    });
};


// -----------------------------------
// UPDATE STORE LOCATION
// PATCH /api/shopkeeper/store/location
// -----------------------------------

const updateStoreLocation = async (req, res) => {

    const {
        longitude,
        latitude
    } = req.body;

    if (
        typeof longitude !== "number" ||
        typeof latitude !== "number"
    ) {
        throw new ExpressError(
            400,
            "Longitude and latitude must be numbers"
        );
    }

    if (
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
    ) {
        throw new ExpressError(
            400,
            "Invalid coordinates"
        );
    }

    const store = await Store.findOne({
        shopkeeper: req.session.userId
    });

    if (!store) {
        throw new ExpressError(404, "Store not found");
    }

    store.location = {
        type: "Point",
        coordinates: [
            longitude,
            latitude
        ]
    };

    await store.save();

    res.status(200).json({
        success: true,
        message: "Store location updated successfully",
        location: store.location
    });
};


module.exports = {
    getStore,
    updateStore,
    updateStoreStatus,
    updateStoreLocation
};