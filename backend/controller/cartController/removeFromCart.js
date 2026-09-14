const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const ExpressError = require("../../utils/ExpressError");


const removeFromCart = async (req, res) => {

    const { productId } = req.params;

    const user = await User.findById(req.session.userId);

    if(!user){
        throw new ExpressError(404,"User not found");
    }

    const initialLength = user.cart.length;

    user.cart = user.cart.filter(
        item => item.product.toString() !== productId
    );

    if (user.cart.length === initialLength) {
        throw new ExpressError(404, "Product not found in cart");
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: "Product removed from cart"
    });
};

module.exports = removeFromCart;