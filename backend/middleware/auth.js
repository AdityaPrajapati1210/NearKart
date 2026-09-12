const ExpressError = require('../utils/ExpressError');
const User = require('../models/userSchema');

const isLoggedIn = (req, res, next) => {

    if (!req.session || !req.session.userId) {
        throw new ExpressError(401, "Please login first");
    }

    next();
};

const isShopkeeper = async (req, res, next) => {

    const user = await User.findById(req.session.userId)
        .select("role");

    if (!user) {
        throw new ExpressError(404, "User not found");
    }

    if (user.role !== "shopkeeper") {
        throw new ExpressError(403, "Access denied. Shopkeeper only");
    }
    next();
};

module.exports = { isLoggedIn, isShopkeeper };