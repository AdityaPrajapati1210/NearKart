const Joi = require("joi");
const ExpressError = require("../utils/ExpressError");

const validateAddress = (req, res, next) => {
    const addressSchema = Joi.object({

        label: Joi.string()
            .valid("home", "college", "hostel", "other")
            .default("other"),

        address: Joi.string()
            .trim()
            .min(5)
            .max(200)
            .required(),

        latitude: Joi.number()
            .min(-90)
            .max(90),

        longitude: Joi.number()
            .min(-180)
            .max(180),
    });


    const { error } = addressSchema.validate(req.body);

    if (error) {
        throw new ExpressError(400, error.details[0].message);
    }

    next();
};


const validateUser = (req, res, next) => {
    const locationSchema = Joi.object({
    latitude: Joi.number()
        .min(-90)
        .max(90)
        .required(),

    longitude: Joi.number()
        .min(-180)
        .max(180)
        .required()
});

    const { error } = locationSchema.validate(req.body);

    if (error) {
        throw new ExpressError(400,error.details[0].message);
    }

    next();
};



const validateUserUpdate = (req, res, next) => {
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



const validateLoginUser = (req, res, next) => {
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



const validateLocation = (req, res, next) => {
    const locationSchema = Joi.object({
    latitude: Joi.number()
        .min(-90)
        .max(90)
        .required(),

    longitude: Joi.number()
        .min(-180)
        .max(180)
        .required()
});

    const { error } = locationSchema.validate(req.body);

    if (error) {
        throw new ExpressError(400,error.details[0].message);
    }

    next();
};


const validateProduct = (req, res, next) => {

    const productSchema = Joi.object({

        name: Joi.string()
            .trim()
            .min(2)
            .max(100)
            .required(),

        description: Joi.string()
            .trim()
            .max(500)
            .allow("", null),

        price: Joi.number()
            .min(0)
            .required(),

        offerPrice: Joi.number()
            .min(0)
            .max(Joi.ref("price"))
            .optional(),

        category: Joi.string()
            .trim()
            .required(),

        image: Joi.string()
            .trim()
            .allow("", null),

        stock: Joi.number()
            .integer()
            .min(0)
            .required(),

        isAvailable: Joi.boolean()
            .optional(),

        salesCount: Joi.number()
            .integer()
            .min(0)
            .optional()
    });

    const { error } = productSchema.validate(req.body);

    if (error) {
        throw new ExpressError(400, error.details[0].message);
    }

    next();
};


module.exports = {
    validateAddress,
    validateUser,
    validateUserUpdate,
    validateLoginUser,
    validateLocation,
    validateProduct
}