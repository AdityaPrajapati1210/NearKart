const Joi = require("joi");
const ExpressError = require('../utils/ExpressError');

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

module.exports = validateUser;
