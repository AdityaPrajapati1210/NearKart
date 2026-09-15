const express = require("express");
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const Wrapasync = require('../utils/Wrapasync');
const ExpressError = require('../utils/ExpressError');
const { isLoggedIn , isShopkeeper} = require('../middleware/auth');
const { validateUser, validateLoginUser, validateUserUpdate, validateAddress, validateLocation } = require('../middleware/validateSchema');
const addToCart = require('../controller/cartController/addToCart');
const getCart = require('../controller/cartController/getCart');
const clearCart = require('../controller/cartController/clearCart');
const removeFromCart = require('../controller/cartController/removeFromCart');
const updateCart = require('../controller/cartController/updateCart');
const calculateDistance = require('../utils/calculateDistance');
const Order = require('../models/orderSchema');
const placeOrder = require('../controller/orderController/placeOrder');
const getUserOrder = require('../controller/orderController/getUsersOrder');
const cancelOrder = require("../controller/orderController/cancelOrder");
const getOrderDetails = require("../controller/orderController/getOrderDetails");
const getAllOrder = require("../controller/orderController/getAllOrder");
const updateStatus = require("../controller/orderController/updateStatus");
const verifyOtp = require("../controller/orderController/verifyOtp");
const generateOtp = require("../controller/orderController/generateOtp");


const router = express.Router();

module.exports = router;


router.post("/", isLoggedIn, Wrapasync(placeOrder));

router.get("/", isLoggedIn, Wrapasync(getUserOrder));

router.get("/shopkeeper", isLoggedIn, isShopkeeper, Wrapasync(getAllOrder));

router.get('/:orderId', isLoggedIn, Wrapasync(getOrderDetails));

router.patch('/:orderId/cancel', Wrapasync(cancelOrder));

router.patch("/:orderId/status", isLoggedIn, isShopkeeper, Wrapasync(updateStatus));




router.post("/:orderId/otp", isLoggedIn, isShopkeeper, Wrapasync(generateOtp));

router.post("/:orderId/otp/verify", isLoggedIn, isShopkeeper, Wrapasync(verifyOtp));