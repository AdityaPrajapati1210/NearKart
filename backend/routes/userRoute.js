const express = require("express");
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const Wrapasync = require('../utils/Wrapasync');
const ExpressError = require('../utils/ExpressError');
const { isLoggedIn } = require('../middleware/auth');
const { validateUser, validateLoginUser, validateUserUpdate, validateAddress, validateLocation } = require('../middleware/validateSchema');

const router = express.Router();

module.exports = router;


router.post("/register", validateUser, Wrapasync(async (req, res) => {           //register route
    console.log(`req.body = ${req.body}`);
    const { name, email, phone, password, CnfPassword } = req.body;

    if (password !== CnfPassword) {
        throw new ExpressError(
            400,
            "Password and Confirm Password do not match"
        );
    }

    const existingUser = await User.findOne({
        $or: [
            { email },
            { phone }
        ]
    });

    if (existingUser) {
        throw new ExpressError(
            409,
            "User already exists with this email or phone number"
        );
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword
    });

    return res.status(201).json({
        success: true,
        message: "Registration successful",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone
        }
    });

})
);

router.post("/login", validateLoginUser, Wrapasync(async (req, res) => {         //login route...
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new ExpressError(401, "Invalid email or password");
    }

    req.session.userId = user._id;

    // console.log("SESSION:", req.session);
    // console.log("SESSION ID:", req.sessionID);
    const data = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
    };

    res.status(200).json({
        success: true,
        message: "Login successful",
        user: data
    });
}));

router.post("/login/shop", validateLoginUser, Wrapasync(async (req, res) => {         //login shop...
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new ExpressError(401, "Invalid email or password");
    }

    user.role = "shopkeeper";
    user.save();

    req.session.userId = user._id;

    // console.log("SESSION:", req.session);
    // console.log("SESSION ID:", req.sessionID);
    const data = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
    };

    res.status(200).json({
        success: true,
        message: "Login successful",
        user:data
    });
}));

router.post('/logout', isLoggedIn, (req, res, next) => {                  //logout route..
    req.session.destroy((err) => {
        if (err) {
            return next(err);
        }
        res.clearCookie('connect.sid');
        res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    });
});

router.get("/profile", isLoggedIn, Wrapasync(async (req, res) => {      //get profile ...

    const user = await User.findById(req.session.userId)
        .select("-password");  //password ko chod k

    if (!user) {
        throw new ExpressError(404, "User not found");
    }

    res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        user
    });
})
);

router.patch('/profile', isLoggedIn, validateUserUpdate, Wrapasync(async (req, res) => {
    const { name, email, phone } = req.body;

    const user = await User.findByIdAndUpdate(req.session.userId, { name, email, phone }, { new: true, runValidators: true }).select("-password");


    if (!user) {
        throw new ExpressError(404, "User not found");
    }
    res.status(200).json({
        success: true,
        message: "Profile Update successfully.",
        user
    })
}));


// address route start--------------------------

router.get('/addresses', isLoggedIn, Wrapasync(async (req, res) => {     //get the addresses of the user
    const user = await User.findById(req.session.userId)
        .select("addresses");
    if (!user) {
        throw new ExpressError(404, "User not found");
    }
    if (user.addresses.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No addresses found",
            addresses: []
        });
    }
    res.status(200).json({
        success: true,
        message: "Addresses found",
        addresses: user.addresses
    });
}));

router.post('/addresses', isLoggedIn, validateAddress, Wrapasync(async (req, res) => {    //add new addresses
    const { label, address, latitude, longitude } = req.body;

    const user = await User.findById(req.session.userId).select("addresses");

    if (!user) {
        throw new ExpressError(404, "User not found");
    }

    user.addresses.push({
        label,
        address,
        latitude,
        longitude
    })

    await user.save();

    res.status(201).json({
        success: true,
        message: "Address added successfully",
        address: user.addresses[user.addresses.length - 1]
    });
}))

router.patch('/addresses/:addressId', isLoggedIn, validateAddress, Wrapasync(async (req, res) => {

    const user = await User.findById(req.session.userId)
        .select("addresses");

    if (!user) {
        throw new ExpressError(404, "User not found");
    }

    const address = user.addresses.id(req.params.addressId);

    if (!address) {
        throw new ExpressError(404, "Address not found");
    }

    const { label, address: addressText, latitude, longitude } = req.body;

    address.label = label;
    address.address = addressText;
    address.latitude = latitude;
    address.longitude = longitude;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Address updated successfully",
        address
    });
})
);

router.delete('/addresses/:addressId', isLoggedIn, Wrapasync(async (req, res) => {

    const user = await User.findById(req.session.userId)
        .select("addresses");

    if (!user) {
        throw new ExpressError(404, "User not found");
    }

    const address = user.addresses.id(req.params.addressId);

    if (!address) {
        throw new ExpressError(404, "Address not found");
    }

    address.deleteOne();

    await user.save();

    res.status(200).json({
        success: true,
        message: "Address deleted successfully"
    });
})
);

// address route end------------------------------

// location route start --------------------------
router.patch("/location", isLoggedIn, validateLocation, Wrapasync(async (req, res) => {

    const { latitude, longitude } = req.body;

    const user = await User.findByIdAndUpdate(
        req.session.userId,
        {
            location: {
                latitude,
                longitude,
                updatedAt: new Date()
            }
        },
        { new: true }
    );

    if (!user) {
        throw new ExpressError(404, "User not found");
    }

    res.status(200).json({
        message: "Location saved successfully"
    });
}));

router.get('/location', isLoggedIn, Wrapasync(async (req, res) => {
    const user = await User.findById(req.session.userId);

    if (!user) {
        throw new ExpressError(404, "User not found");
    }
    if (!user.location) {
        return res.status(200).json({
            success: true,
            message: "Empty location",
            location: {}
        })
    }

    res.status(200).json({
        success: true,
        message: "successfully found Location",
        location: user.location
    })
}))

// location route snd------------------------------

