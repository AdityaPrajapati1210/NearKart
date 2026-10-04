const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "nearkart/products"
            },
            (error, result) => {
                if (error) {
                    console.warn("Cloudinary upload error, using fallback image:", error.message);
                    resolve({
                        secure_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500",
                        public_id: "product_" + Date.now()
                    });
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(buffer);
    });
};

module.exports = uploadToCloudinary;