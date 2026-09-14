const express = require("express");
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const Wrapasync = require('../utils/Wrapasync');
const ExpressError = require('../utils/ExpressError');
const { isLoggedIn } = require('../middleware/auth');
const { validateUser, validateLoginUser, validateUserUpdate, validateAddress, validateLocation } = require('../middleware/validateSchema');
const wrapAsync = require("../utils/Wrapasync");
const addToCart = require('../controller/cartController/addToCart');
const getCart = require('../controller/cartController/getCart');
const clearCart = require('../controller/cartController/clearCart');
const removeFromCart = require('../controller/cartController/removeFromCart');
const updateCart = require('../controller/cartController/updateCart');


const router = express.Router();

module.exports = router;

