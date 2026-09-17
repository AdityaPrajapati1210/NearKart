const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const ExpressError = require("../../utils/ExpressError");


const updateCart = async (req, res) => {

    const { productId } = req.params;

    const quantity = Number(req.body.quantity ?? 1);

    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new ExpressError(400, "Quantity must be at least 1");
    }

    const product = await Product.findById(productId);

    if (!product) {
        body
        throw new ExpressError(404, "Product not found");
    }

    if (quantity > product.stock) {
        throw new ExpressError(400, "Insufficient stock");
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
        throw new ExpressError(404, "User not found");
    }

    const item = user.cart.find(
        item => item.product.toString() === productId
    );

    if (!item) {
        throw new ExpressError(404, "Product not found in cart");
    }

    item.quantity = quantity;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Cart updated"
    });
};

module.exports = updateCart;