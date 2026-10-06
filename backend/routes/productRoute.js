const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const User = require('../models/userSchema');
const Product = require("../models/productSchema");
const ExpressError = require("../utils/ExpressError");
const wrapAsync = require("../utils/Wrapasync");
const { isLoggedIn, isShopkeeper } = require("../middleware/auth");
const { validateProduct } = require('../middleware/validateSchema');
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const upload = require("../middleware/multer");
const cloudinary = require('cloudinary');

// POST /api/products - Create a new product (Shopkeeper only)
router.post("/", isLoggedIn, isShopkeeper, upload.single("image"), validateProduct, wrapAsync(async (req, res) => {
        const {
            name,
            description,
            price,
            category,
            stock
        } = req.body;

        let { offerPrice, isAvailable, isActive } = req.body;

        // Determine offer price
        if (offerPrice === undefined || offerPrice === '' || offerPrice === null || isNaN(Number(offerPrice))) {
            offerPrice = price;
        } else {
            offerPrice = Number(offerPrice);
        }

        const available = isAvailable !== undefined ? Boolean(isAvailable) : (isActive !== undefined ? Boolean(isActive) : true);

        let imageUrl = typeof req.body.image === 'string' && req.body.image.trim()
            ? req.body.image.trim()
            : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
        let publicId = "";

        if (req.file && req.file.buffer) {
            const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
            imageUrl = result.secure_url;
            publicId = result.public_id;
        }

        const product = new Product({
            name,
            description,
            price: Number(price),
            offerPrice: Number(offerPrice),
            category,
            image: {
                url: imageUrl,
                publicId: publicId
            },
            stock: Number(stock),
            isAvailable: available
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            product
        });
    })
);

// GET /api/products - Get all products with pagination (Public / Browsing)
router.get("/", wrapAsync(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
        Math.max(Number(req.query.limit) || 10, 1),
        100
    );

    const skip = (page - 1) * limit;

    const products = await Product.find()
        .sort({ createdAt: -1 })
        .select("name description price offerPrice category image stock isAvailable salesCount createdAt")
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
}));

// GET /api/products/:productId - Get single product details
router.get("/:productId", wrapAsync(async (req, res) => {
    const product = await Product.findById(req.params.productId);

    if (!product) {
        throw new ExpressError(404, "Product not found");
    }

    res.status(200).json({
        success: true,
        message: "Product retrieved successfully",
        product
    });
}));

// PATCH /api/products/:productId - Update product (Shopkeeper only)
router.patch("/:productId", isLoggedIn, isShopkeeper, upload.single("image"), validateProduct, wrapAsync(async (req, res) => {
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

        let { offerPrice, isAvailable, isActive } = req.body;

        if (offerPrice === undefined || offerPrice === '' || offerPrice === null || isNaN(Number(offerPrice))) {
            offerPrice = price;
        } else {
            offerPrice = Number(offerPrice);
        }

        if (isAvailable !== undefined) {
            product.isAvailable = Boolean(isAvailable);
        } else if (isActive !== undefined) {
            product.isAvailable = Boolean(isActive);
        }

        // If a new image file was uploaded
        if (req.file && req.file.buffer) {
            const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

            // Clean up old image if present
            if (product.image?.publicId) {
                if (product.image.publicId.startsWith('local_')) {
                    const localPath = path.join(__dirname, "../public/uploads", product.image.publicId.replace('local_', ''));
                    if (fs.existsSync(localPath)) {
                        try { fs.unlinkSync(localPath); } catch (e) { console.warn("Failed to delete local file:", e.message); }
                    }
                } else if (process.env.CLOUDINARY_API_KEY) {
                    try {
                        await cloudinary.uploader.destroy(product.image.publicId);
                    } catch (e) { console.warn("Failed to delete cloudinary file:", e.message); }
                }
            }

            product.image = {
                url: result.secure_url,
                publicId: result.public_id
            };
        } else if (typeof req.body.image === 'string' && req.body.image.trim() && req.body.image !== product.image?.url) {
            product.image = {
                url: req.body.image.trim(),
                publicId: product.image?.publicId || ""
            };
        }

        product.name = name;
        product.description = description;
        product.price = Number(price);
        product.offerPrice = Number(offerPrice);
        product.category = category;
        product.stock = Number(stock);

        await product.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });
    })
);

// DELETE /api/products/:productId - Delete product (Shopkeeper only)
router.delete('/:productId', isLoggedIn, isShopkeeper, wrapAsync(async (req, res) => {
        const product = await Product.findById(req.params.productId);

        if (!product) {
            throw new ExpressError(404, "Product not found");
        }

        // Clean up image file
        if (product.image?.publicId) {
            if (product.image.publicId.startsWith('local_')) {
                const localPath = path.join(__dirname, "../public/uploads", product.image.publicId.replace('local_', ''));
                if (fs.existsSync(localPath)) {
                    try { fs.unlinkSync(localPath); } catch (e) {}
                }
            } else if (process.env.CLOUDINARY_API_KEY) {
                try {
                    await cloudinary.uploader.destroy(product.image.publicId);
                } catch (e) {}
            }
        }

        await Product.findByIdAndDelete(req.params.productId);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    })
);

module.exports = router;