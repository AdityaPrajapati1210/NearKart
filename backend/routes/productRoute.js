const express = require("express");
const router = express.Router();

const User = require('../models/userSchema');
const Product = require("../models/productSchema");
const ExpressError = require("../utils/ExpressError");
const wrapAsync = require("../utils/Wrapasync");
const { isLoggedIn, isShopkeeper } = require("../middleware/auth");
const { validateProduct } = require('../middleware/validateSchema');
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const upload = require("../middleware/multer");
const cloudinary = require('cloudinary');



router.post("/", isLoggedIn, isShopkeeper, upload.single("image"), validateProduct, wrapAsync(async (req, res) => {
        const {
            name,
            description,
            price,
            category,
            stock
        } = req.body;

        let { offerPrice } = req.body;

        if (offerPrice === undefined) {
            offerPrice = price;
        }

        const result = await uploadToCloudinary(req.file.buffer);

        const product = new Product({
            name,
            description,
            price,
            offerPrice,
            category,
            image: {
                url: result.secure_url,
                publicId: result.public_id
            },
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

    const products = await Product.find()
        .sort({ createdAt: -1 })
        .select("name description price offerPrice category image stock")
        .skip(skip)
        .limit(limit)
        .lean();

    const totalProducts = await Product.countDocuments();

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

router.patch("/:productId",isLoggedIn,isShopkeeper,upload.single("image"),validateProduct,wrapAsync(async (req, res) => {

        const product = await Product.findById(req.params.productId);

        if (!product) {
            throw new ExpressError(404, "Product not found");
        }

        const {
            name,
            description,
            price,
            category,
            stock
        } = req.body;

        let { offerPrice } = req.body;

        if (offerPrice === undefined) {
            offerPrice = price;
        }

        if (req.file) {


            const result = await uploadToCloudinary(req.file.buffer);

            if (product.image?.publicId) {
                await cloudinary.uploader.destroy(
                    product.image.publicId
                );
            }

            product.image = {
                url: result.secure_url,
                publicId: result.public_id
            };
        }
        product.name = name;
        product.description = description;
        product.price = price;
        product.offerPrice = offerPrice;
        product.category = category;
        product.stock = stock;

        await product.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });
    })
);

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