const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const ExpressError = require("../../utils/ExpressError");


const clearCart = async (req, res) => {

    const user = await User.findById(req.session.userId);

    if (!user) {
        throw new ExpressError(404, "User not found");
    }

    user.cart = [];

    await user.save();

    res.status(200).json({
        success: true,
        message: "Cart cleared"
    });
};

module.exports = clearCart;