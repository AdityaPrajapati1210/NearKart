const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const ExpressError = require("../../utils/ExpressError");


const clearCart = async (req, res) => {

    const user = await User.findById(req.session.userId);

    if (!user) {
        if (req.session) {
            req.session.destroy(() => {});
        }
        res.clearCookie('connect.sid');
        throw new ExpressError(401, "Please login first");
    }

    user.cart = [];

    await user.save();

    res.status(200).json({
        success: true,
        message: "Cart cleared"
    });
};

module.exports = clearCart;