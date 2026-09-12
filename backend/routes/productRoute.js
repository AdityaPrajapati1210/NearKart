const express = require("express");
const router = express.Router();

const User = require('../models/userSchema');
const Product = require("../models/productSchema");
const ExpressError = require("../utils/ExpressError");
const wrapAsync = require("../utils/Wrapasync");
const { isLoggedIn, isShopkeeper } = require("../middleware/auth");
const { validateProduct } = require('../middleware/validateSchema');



router.post("/", isLoggedIn, isShopkeeper, validateProduct, wrapAsync(async (req, res) => {
    const {
        name,
        description,
        price,
        category,
        image,
        stock
    } = req.body;

    let { offerPrice } = req.body;

    if (offerPrice == undefined) {
        offerPrice = price;
    }

    const product = new Product({
        name,
        description,
        price,
        offerPrice,
        category,
        image,
        stock
    });

    await product.save();

    res.status(201).json({
        success: true,
        message: "Product added successfully",
        product
    });
})
);

router.get("/", isLoggedIn, wrapAsync(async (req, res) => {       //get prduct   ?page=1&&limit=10

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
        Math.max(Number(req.query.limit) || 10, 1),
        50
    );

    const skip = (page - 1) * limit;

    const products = await Product.find({
        isAvailable: true
    })
        .sort({ createdAt: -1 })
        .select("name description price offerPrice category image stock")
        .skip(skip)
        .limit(limit)
        .lean();

    const totalProducts = await Product.countDocuments({
        isAvailable: true
    });

    const hasMore = skip + products.length < totalProducts;

    res.status(200).json({
        success: true,
        page,
        limit,
        totalProducts,
        hasMore,
        products
    });
})
);

router.get("/:productId", isLoggedIn, wrapAsync(async (req, res) => {       //get prduct   ?page=1&&limit=10
    const product = await Product.findById(req.params.productId);

    if(!product){
        throw new ExpressError(404,"Product not found");
    }

    res.status(200).json({
        success:true,
        message:"Product get successfully",
        product
    })
})
);

router.patch('/:productId', isLoggedIn, isShopkeeper, validateProduct, wrapAsync(async (req, res) => {   //product update
    const {
        name,
        description,
        price,
        category,
        image,
        stock
    } = req.body;

    let { offerPrice } = req.body;

    if (offerPrice == undefined) {
        offerPrice = price;
    }
    const Updatedproduct = await Product.findByIdAndUpdate(req.params.productId, {
        name,
        description,
        price,
        offerPrice,
        category,
        image,
        stock
    },{new:true});

    if(!Updatedproduct){
        throw new ExpressError(404,"Product Not found");
    }

    res.status(201).json({
        success: true,
        message: "Product updated successfully",
        Updatedproduct
    });
}))

router.delete('/:productId', isLoggedIn, isShopkeeper, wrapAsync(async (req, res) => {         //delete product

        const deletedProduct = await Product.findByIdAndDelete(
            req.params.productId
        );

        if (!deletedProduct) {
            throw new ExpressError(404, "Product not found");
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    })
);


module.exports = router;