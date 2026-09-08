const express = require("express");
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const validateUser = require('../middleware/validateUser');
const Wrapasync = require('../utils/Wrapasync');
const ExpressError = require('../utils/ExpressError');

const router = express.Router();

module.exports = router;


router.post("/register", validateUser, Wrapasync(async (req, res) => {
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
    const hashedPassword =  await bcrypt.hash(password, salt);

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
            email: user.email
        }
    });

})
);