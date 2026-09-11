const express = require("express");
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const validateUser = require('../middleware/validateUser');
const Wrapasync = require('../utils/Wrapasync');
const ExpressError = require('../utils/ExpressError');
const validateLoginUser = require('../middleware/validateLoginUser');
const isLoggedIn = require('../middleware/isLoggedIn');
const validataUserupdate = require('../middleware/validateUserUpdate');


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

    console.log("SESSION:", req.session);
    console.log("SESSION ID:", req.sessionID);

    res.status(200).json({
        message: "Login successful"
    });
}));

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

router.patch('/profile', isLoggedIn, validataUserupdate, Wrapasync(async (req, res) => {
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