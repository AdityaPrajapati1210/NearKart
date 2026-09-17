const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const ExpressError = require("../../utils/ExpressError");

const addToCart = async (req, res) => {

    const { productId } = req.body;

    const quantity = Number(req.body.quantity ?? 1);

    if (!productId) {
        throw new ExpressError(400, "Product ID is required");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new ExpressError(400, "Quantity must be at least 1");
    }

    const product = await Product.findById(productId);

    if (!product) {
        throw new ExpressError(404, "Product not found");
    }

    if (product.stock < quantity) {
        throw new ExpressError(400, "Insufficient stock");
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
        throw new ExpressError(404, "User not found");
    }

    const existingItem = user.cart.find(
        item => item.product.toString() === productId
    );

    if (existingItem) {

        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > product.stock) {
            throw new ExpressError(400, "Requested quantity exceeds stock");
        }

        existingItem.quantity = newQuantity;

    } else {

        user.cart.push({
            product: productId,
            quantity
        });
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: "Product added to cart"
    });
};

module.exports = addToCart;