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

module.exports = validateAddress;