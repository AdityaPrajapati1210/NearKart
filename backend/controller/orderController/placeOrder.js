const express = require("express");
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const Wrapasync = require('../utils/Wrapasync');
const ExpressError = require('../utils/ExpressError');
const { isLoggedIn } = require('../middleware/auth');
const { validateUser, validateLoginUser, validateUserUpdate, validateAddress, validateLocation } = require('../middleware/validateSchema');
const addToCart = require('../controller/cartController/addToCart');
const getCart = require('../controller/cartController/getCart');
const clearCart = require('../controller/cartController/clearCart');
const removeFromCart = require('../controller/cartController/removeFromCart');
const updateCart = require('../controller/cartController/updateCart');
const calculateDistance = require('../utils/calculateDistance');
const Order = require('../models/orderSchema');

const placeOrder = async (req, res) => {

    // 1. Get logged-in user's cart and location
    const user = await User.findById(req.session.userId)
        .select("cart location");

    if (!user) {
        throw new ExpressError(404, "User not found");
    }


    // 2. Check location exists
    if (
        !user.location ||
        user.location.latitude === undefined ||
        user.location.longitude === undefined
    ) {
        throw new ExpressError(
            400,
            "Please provide your location before placing an order"
        );
    }


    // 3. Check cart is not empty
    if (!user.cart || user.cart.length === 0) {
        throw new ExpressError(
            400,
            "Your cart is empty"
        );
    }


    // // 4. Get products from cart
    // const populatedUser = await User.findById(req.session.userId)
    //     .select("cart location")
    //     .populate("cart.product");


    // 5. Shop location
    // Later this should come from Store/Shop model
    const shopLatitude = 28.4595;
    const shopLongitude = 77.0266;


    // 6. Check delivery distance
    const distance = calculateDistance(
        shopLatitude,
        shopLongitude,
        user.location.latitude,
        user.location.longitude
    );


    // 7. Delivery range check
    const DELIVERY_RADIUS = 2;

    if (distance > DELIVERY_RADIUS) {
        throw new ExpressError(
            400,
            "You are outside the delivery range"
        );
    }


    // 8. Create order items + calculate price
    const items = [];

    let subtotal = 0;

    for (const cartItem of user.cart) {

        const product = cartItem.product;

        // Product doesn't exist
        if (!product) {
            throw new ExpressError(
                404,
                "One of the products in your cart no longer exists"
            );
        }


        // Check product availability
        if (!product.isAvailable) {
            throw new ExpressError(
                400,
                `${product.name} is currently unavailable`
            );
        }


        // Check stock
        if (product.stock < cartItem.quantity) {
            throw new ExpressError(
                400,
                `${product.name} is out of stock`
            );
        }


        // Decide selling price
        const sellingPrice =
            product.offerPrice !== undefined &&
                product.offerPrice < product.price
                ? product.offerPrice
                : product.price;


        // Calculate subtotal
        const itemSubtotal =
            sellingPrice * cartItem.quantity;


        // Snapshot product information
        items.push({
            product: product._id,
            name: product.name,
            price: sellingPrice,
            quantity: cartItem.quantity,
            subtotal: itemSubtotal
        });


        subtotal += itemSubtotal;
    }


    // 9. Delivery fee
    const deliveryFee = 0;


    // 10. Discount
    const discount = 0;


    // 11. Final amount
    const totalAmount =
        subtotal + deliveryFee - discount;


    // 12. Create order
    const order = await Order.create({

        user: user._id,

        items,

        subtotal,

        deliveryFee,

        discount,

        totalAmount,

        customerLocation: {
            type: "Point",
            coordinates: [
                user.location.longitude,
                user.location.latitude
            ]
        },

        shopLocation: {
            type: "Point",
            coordinates: [
                shopLongitude,
                shopLatitude
            ]
        },

        deliveryDistance: distance,

        paymentMethod: "COD",

        paymentStatus: "PENDING",

        orderStatus: "PENDING"
    });


    // 13. Clear cart
    user.cart = [];

    await user.save();


    // 14. Response
    res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order
    });
}

module.exports = placeOrder;