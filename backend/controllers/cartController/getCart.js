const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const ExpressError = require("../../utils/ExpressError");

const getCart = async (req, res) => {

    const user = await User.findById(req.session.userId)
        .select("cart")
        .populate({
            path: "cart.product",
            select: "name price offerPrice image stock category"
        });

    if (!user) {
        if (req.session) {
            req.session.destroy(() => {});
        }
        res.clearCookie('connect.sid');
        throw new ExpressError(401, "Please login first");
    }

    res.status(200).json({
        success: true,
        cart: user.cart
    });
};

module.exports = getCart;