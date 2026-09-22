const ExpressError = require('../utils/ExpressError');
const User = require('../models/userSchema');
const Rider = require('../models/riderSchema');

const isLoggedIn = (req, res, next) => {
    if (!req.session || (!req.session.userId && !req.session.riderId)) {
        throw new ExpressError(401, "Please login first");
    }

    next();
};

const isShopkeeper = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        throw new ExpressError(401, "Please login first");
    }

    const user = await User.findById(req.session.userId)
        .select("role");

    if (!user) {
        throw new ExpressError(404, "User not found");
    }

    if (user.role !== "shopkeeper") {
        throw new ExpressError(403, "Access denied. Shopkeeper only");
    }
    req.user = user;
    next();
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

    // Check if shopkeeper
    if (req.session.userId) {
        const user = await User.findById(req.session.userId).select("role");
        if (user && user.role === "shopkeeper") {
            req.user = user;
            req.callerRole = "shopkeeper";
            return next();
        }
    }

    throw new ExpressError(403, "Access denied. Shopkeeper or Rider only");
};

module.exports = { isLoggedIn, isShopkeeper, isRider, isShopkeeperOrRider };