const ExpressError = require('../utils/ExpressError');
const User = require('../models/userSchema');
const Rider = require('../models/riderSchema');

const isLoggedIn = async (req, res, next) => {
    if (!req.session || (!req.session.userId && !req.session.riderId)) {
        throw new ExpressError(401, "Please login first");
    }

    const id = req.session.userId || req.session.riderId;
    let exists = await User.findById(id).select("_id role");
    if (!exists) {
        exists = await Rider.findById(id).select("_id");
    }

    if (!exists) {
        if (req.session) {
            req.session.destroy(() => {});
        }
        res.clearCookie('connect.sid');
        throw new ExpressError(401, "Please login first");
    }

    next();
};

const isShopkeeper = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        throw new ExpressError(401, "Please login first");
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
        if (req.session) {
            req.session.destroy(() => {});
        }
        res.clearCookie('connect.sid');
        throw new ExpressError(401, "Please login first");
    }

    if (user.role === "shopkeeper" || user.role === "admin") {
        req.user = user;
        return next();
    }

    // Auto-heal: Check if user owns a store or matches SHOPKEEPER_ID
    const Store = require('../models/storeSchema');
    const userStore = await Store.findOne({ shopkeeper: user._id });
    if (userStore || (process.env.SHOPKEEPER_ID && user._id.toString() === process.env.SHOPKEEPER_ID)) {
        user.role = "shopkeeper";
        await user.save();
        req.session.role = "shopkeeper";
        req.user = user;
        return next();
    }

    throw new ExpressError(403, "Access denied. Shopkeeper only");
};

const isRider = async (req, res, next) => {
    if (!req.session || (!req.session.riderId && req.session.role !== "rider")) {
        throw new ExpressError(401, "Rider authentication required");
    }

    const riderId = req.session.riderId || req.session.userId;
    const rider = await Rider.findById(riderId);

    if (!rider) {
        throw new ExpressError(404, "Rider not found");
    }

    if (!rider.isActive) {
        throw new ExpressError(403, "Rider account is inactive");
    }

    req.rider = rider;
    next();
};

const isShopkeeperOrRider = async (req, res, next) => {
    if (!req.session || (!req.session.userId && !req.session.riderId)) {
        throw new ExpressError(401, "Please login first");
    }

    // Check if rider
    if (req.session.role === "rider" || req.session.riderId) {
        const riderId = req.session.riderId || req.session.userId;
        const rider = await Rider.findById(riderId);
        if (rider && rider.isActive) {
            req.rider = rider;
            req.callerRole = "rider";
            return next();
        }
    }

    // Check if shopkeeper or admin
    if (req.session.userId) {
        const user = await User.findById(req.session.userId);
        if (user && (user.role === "shopkeeper" || user.role === "admin")) {
            req.user = user;
            req.callerRole = "shopkeeper";
            return next();
        }
        if (user) {
            const Store = require('../models/storeSchema');
            const userStore = await Store.findOne({ shopkeeper: user._id });
            if (userStore || req.session.role === "shopkeeper" || (process.env.SHOPKEEPER_ID && user._id.toString() === process.env.SHOPKEEPER_ID)) {
                user.role = "shopkeeper";
                await user.save();
                req.session.role = "shopkeeper";
                req.user = user;
                req.callerRole = "shopkeeper";
                return next();
            }
        }
    }

    throw new ExpressError(403, "Access denied. Shopkeeper or Rider only");
};

module.exports = { isLoggedIn, isShopkeeper, isRider, isShopkeeperOrRider };