const Joi = require("joi");
const ExpressError = require('../utils/ExpressError');

const validateUser = (req, res, next) => {
    const userSchema = Joi.object({
        name: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .required()
            .messages({
                "string.empty": "Name is required",
                "string.min": "Name must be at least 2 characters",
                "string.max": "Name must not exceed 50 characters",
                "any.required": "Name is required"
            }),

        email: Joi.string()
            .trim()
            .email()
            .lowercase()
            .required()
            .messages({
                "string.empty": "Email is required",
                "string.email": "Please enter a valid email address",
                "any.required": "Email is required"
            }),

        phone: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .required()
            .messages({
                "string.pattern.base": "Phone number must be exactly 10 digits",
                "string.empty": "Phone number is required",
                "any.required": "Phone number is required"
            }),

        password: Joi.string()
            .min(6)
            .required()
            .messages({
                "string.empty": "Password is required",
                "string.min": "Password must be at least 6 characters",
                "any.required": "Password is required"
            }),

        CnfPassword: Joi.string()
            .min(6)
            .required()
            .messages({
                "string.empty": "Confirm password is required",
                "string.min": "Confirm password must be at least 6 characters",
                "any.required": "Confirm password is required"
            }),
    });

    const { error } = userSchema.validate(req.body);

    if (error) {
        throw new ExpressError(
            400,
            error.details[0].message
        );
    }

    next();
};

module.exports = validateUser;
