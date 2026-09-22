const express = require("express");
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const Wrapasync = require('../utils/Wrapasync');
const ExpressError = require('../utils/ExpressError');
const { isLoggedIn, isShopkeeper, isShopkeeperOrRider } = require('../middleware/auth');
const { validateUser, validateLoginUser, validateUserUpdate, validateAddress, validateLocation } = require('../middleware/validateSchema');
const addToCart = require('../controllers/cartController/addToCart');
const getCart = require('../controllers/cartController/getCart');
const clearCart = require('../controllers/cartController/clearCart');
const removeFromCart = require('../controllers/cartController/removeFromCart');
const updateCart = require('../controllers/cartController/updateCart');
const calculateDistance = require('../utils/calculateDistance');
const Order = require('../models/orderSchema');
const placeOrder = require('../controllers/orderController/placeOrder');
const getUserOrder = require('../controllers/orderController/getUsersOrder');
const cancelOrder = require("../controllers/orderController/cancelOrder");
const getOrderDetails = require("../controllers/orderController/getOrderDetails");
const getAllOrder = require("../controllers/orderController/getAllOrder");
const updateStatus = require("../controllers/orderController/updateStatus");
const verifyOtp = require("../controllers/orderController/verifyOtp");
const generateOtp = require("../controllers/orderController/generateOtp");
const assignRider = require('../controllers/orderController/assignRider');


const router = express.Router();

module.exports = router;

console.log("assignRider:", typeof assignRider);

router.post("/", isLoggedIn, Wrapasync(placeOrder));

router.get("/", isLoggedIn, Wrapasync(getUserOrder));

router.get("/shopkeeper", isLoggedIn, isShopkeeper, Wrapasync(getAllOrder));

router.get('/:orderId', isLoggedIn, Wrapasync(getOrderDetails));

router.patch('/:orderId/cancel', Wrapasync(cancelOrder));

router.patch("/:orderId/status", isLoggedIn, isShopkeeper, Wrapasync(updateStatus));

router.post("/:orderId/otp", isLoggedIn, isShopkeeperOrRider, Wrapasync(generateOtp));

router.post("/:orderId/otp/verify", isLoggedIn, isShopkeeperOrRider, Wrapasync(verifyOtp));

router.patch("/:orderId/assign-rider",isLoggedIn,isShopkeeper,Wrapasync(assignRider));