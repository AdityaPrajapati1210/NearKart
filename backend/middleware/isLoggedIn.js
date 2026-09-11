const ExpressError = require('../utils/ExpressError');


const isLoggedIn = (req, res, next) => {

    if (!req.session || !req.session.userId) {
        throw new ExpressError(401, "Please login first");
    }

    next();
};

module.exports = isLoggedIn;