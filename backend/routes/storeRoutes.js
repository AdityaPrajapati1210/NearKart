const express = require('express');
const router = express.Router();

const {isLoggedIn, isShopkeeper} = require("../middleware/auth");
const Wrapasync = require('../utils/Wrapasync');
const {getStore,updateStore,updateStoreStatus,updateStoreLocation} = require("../controllers/storeController");


// GET /api/shopkeeper/store
// Get store details
router.get("/", isLoggedIn, isShopkeeper, Wrapasync(getStore));


// PATCH /api/shopkeeper/store
// Update store details
router.patch("/", isLoggedIn, isShopkeeper, Wrapasync(updateStore));


// PATCH /api/shopkeeper/store/status
// Open / Close store
router.patch("/status", isLoggedIn, isShopkeeper, Wrapasync(updateStoreStatus));


// PATCH /api/shopkeeper/store/location
// Update store location
router.patch("/location", isLoggedIn, isShopkeeper, Wrapasync(updateStoreLocation) );


module.exports = router;