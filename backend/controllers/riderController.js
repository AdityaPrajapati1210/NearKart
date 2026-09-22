const bcrypt = require("bcrypt");

const Rider = require("../models/riderSchema");
const ExpressError = require("../utils/ExpressError");

// ======================================================
// CREATE RIDER
// POST /api/riders
// ======================================================

const createRider = async (req, res) => {
    const {
        name,
        phone,
        email,
        password
    } = req.body;

    // --------------------------------------------------
    // 1. Basic validation
    // --------------------------------------------------

    if (!name || !phone || !password) {
        throw new ExpressError(
            400,
            "Name, phone and password are required"
        );
    }

    // --------------------------------------------------
    // 2. Check shopkeeper session
    // --------------------------------------------------

    const shopkeeperId = req.session.userId;

    if (!shopkeeperId) {
        throw new ExpressError(
            401,
            "Unauthorized"
        );
    }

    // --------------------------------------------------
    // 3. Check duplicate phone
    // --------------------------------------------------

    const existingRider = await Rider.findOne({
        phone
    });

    if (existingRider) {
        throw new ExpressError(
            409,
            "Rider with this phone number already exists"
        );
    }

    // --------------------------------------------------
    // 4. Hash password
    // --------------------------------------------------

    const passwordHash = await bcrypt.hash(password, 12);

    // --------------------------------------------------
    // 5. Create rider
    // --------------------------------------------------

    const rider = await Rider.create({
        name,
        phone,
        email,
        passwordHash,
        shopkeeper: shopkeeperId
    });

    // --------------------------------------------------
    // 6. Never return passwordHash
    // --------------------------------------------------

    res.status(201).json({
        success: true,
        message: "Rider created successfully",
        rider: {
            id: rider._id,
            name: rider.name,
            phone: rider.phone,
            email: rider.email,
            shopkeeper: rider.shopkeeper,
            isActive: rider.isActive,
            createdAt: rider.createdAt
        }
    });
};


// ======================================================
// GET ALL RIDERS
// GET /api/riders
// ======================================================

const getRiders = async (req, res) => {

    const shopkeeperId = req.session.userId;

    if (!shopkeeperId) {
        throw new ExpressError(
            401,
            "Unauthorized"
        );
    }

    const riders = await Rider.find({
        shopkeeper: shopkeeperId
    })
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        success: true,
        count: riders.length,
        riders
    });
};


// ======================================================
// GET SINGLE RIDER
// GET /api/riders/:riderId
// ======================================================

const getRider = async (req, res) => {

    const { riderId } = req.params;
    const shopkeeperId = req.session.userId;

    if (!shopkeeperId) {
        throw new ExpressError(
            401,
            "Unauthorized"
        );
    }

    const rider = await Rider.findOne({
        _id: riderId,
        shopkeeper: shopkeeperId
    })
        .select("-passwordHash")
        .lean();

    if (!rider) {
        throw new ExpressError(
            404,
            "Rider not found"
        );
    }

    res.status(200).json({
        success: true,
        rider
    });
};


// ======================================================
// RIDER LOGIN
// POST /api/riders/login
// ======================================================

const loginRider = async (req, res) => {

    const {
        phone,
        password
    } = req.body;

    // --------------------------------------------------
    // 1. Basic validation
    // --------------------------------------------------

    if (!phone || !password) {
        throw new ExpressError(
            400,
            "Phone and password are required"
        );
    }

    // --------------------------------------------------
    // 2. Find rider
    // --------------------------------------------------

    const rider = await Rider.findOne({
        phone: phone.trim()
    });

    if (!rider) {
        throw new ExpressError(
            401,
            "Invalid phone or password"
        );
    }

    // --------------------------------------------------
    // 3. Check rider status
    // --------------------------------------------------

    if (!rider.isActive) {

        throw new ExpressError(
            403,
            "Rider account is inactive"
        );

    }

    // --------------------------------------------------
    // 4. Verify password
    // --------------------------------------------------

    const isPasswordValid = await bcrypt.compare(
        password,
        rider.passwordHash
    );

    if (!isPasswordValid) {

        throw new ExpressError(
            401,
            "Invalid phone or password"
        );

    }

    // --------------------------------------------------
    // 5. Create rider session
    // --------------------------------------------------

    req.session.riderId = rider._id.toString();

    req.session.riderRole = "rider";

    // --------------------------------------------------
    // 6. Save session
    // --------------------------------------------------

    req.session.save((err) => {

        if (err) {

            throw new ExpressError(
                500,
                "Failed to create rider session"
            );

        }

        res.status(200).json({

            success: true,

            message: "Rider login successful",

            rider: {

                id: rider._id,

                name: rider.name,

                phone: rider.phone,

                email: rider.email || null,

                isActive: rider.isActive

            }

        });

    });
};


// ======================================================
// UPDATE RIDER
// PATCH /api/riders/:riderId
// ======================================================

const updateRider = async (req, res) => {

    const { riderId } = req.params;
    const shopkeeperId = req.session.userId;

    if (!shopkeeperId) {
        throw new ExpressError(
            401,
            "Unauthorized"
        );
    }

    const {
        name,
        phone,
        email,
        password,
        isActive
    } = req.body;

    // --------------------------------------------------
    // 1. Find rider belonging to this shopkeeper
    // --------------------------------------------------

    const rider = await Rider.findById(riderId)
        .select("-passwordHash");

    if (!rider) {
        throw new ExpressError(
            404,
            "Rider not found"
        );
    }

    // --------------------------------------------------
    // 2. Update allowed fields
    // --------------------------------------------------

    if (name !== undefined) {
        rider.name = name;
    }

    if (email !== undefined) {
        rider.email = email;
    }

    if (isActive !== undefined) {
        rider.isActive = isActive;
    }

    // --------------------------------------------------
    // 3. Phone update
    // --------------------------------------------------

    if (phone !== undefined && phone !== rider.phone) {

        const phoneExists = await Rider.findOne({
            phone,
            _id: { $ne: riderId }
        });

        if (phoneExists) {
            throw new ExpressError(
                409,
                "Phone number already belongs to another rider"
            );
        }

        rider.phone = phone;
    }

    // --------------------------------------------------
    // 4. Password update
    // --------------------------------------------------

    if (password !== undefined) {

        if (password.length < 6) {
            throw new ExpressError(
                400,
                "Password must be at least 6 characters"
            );
        }

        rider.passwordHash = await bcrypt.hash(
            password,
            12
        );
    }

    // --------------------------------------------------
    // 5. Save
    // --------------------------------------------------

    await rider.save();

    res.status(200).json({
        success: true,
        message: "Rider updated successfully",
        rider: {
            id: rider._id,
            name: rider.name,
            phone: rider.phone,
            email: rider.email,
            shopkeeper: rider.shopkeeper,
            isActive: rider.isActive,
            updatedAt: rider.updatedAt
        }
    });
};


// ======================================================
// DELETE / DEACTIVATE RIDER
// DELETE /api/riders/:riderId
// ======================================================

const deleteRider = async (req, res) => {

    const { riderId } = req.params;
    const shopkeeperId = req.session.userId;

    if (!shopkeeperId) {
        throw new ExpressError(
            401,
            "Unauthorized"
        );
    }

    // --------------------------------------------------
    // Don't physically delete rider.
    // Deactivate instead so old orders/history remain safe.
    // --------------------------------------------------

    const rider = await Rider.findOneAndUpdate(
        {
            _id: riderId,
            shopkeeper: shopkeeperId
        },
        {
            $set: {
                isActive: false
            }
        },
        {
            new: true
        }
    )
        .select("-passwordHash")
        .lean();

    if (!rider) {
        throw new ExpressError(
            404,
            "Rider not found"
        );
    }

    res.status(200).json({
        success: true,
        message: "Rider deactivated successfully",
        rider
    });
};


module.exports = {
    createRider,
    getRiders,
    getRider,
    updateRider,
    deleteRider,
    loginRider
};