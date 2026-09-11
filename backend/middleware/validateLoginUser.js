const Joi = require("joi");
const ExpressError = require('../utils/ExpressError');

const validateUser = (req, res, next) => {
    const userSchema = Joi.object({
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

        
        password: Joi.string()
            .min(6)
            .required()
            .messages({
                "string.empty": "Password is required",
                "string.min": "Password must be at least 6 characters",
                "any.required": "Password is required"
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
