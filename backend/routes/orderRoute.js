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
const placeOrder = require('../controller/orderController/placeOrder');


const router = express.Router();

module.exports = router;


router.post("/", isLoggedIn, Wrapasync(placeOrder));
