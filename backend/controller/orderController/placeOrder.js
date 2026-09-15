const User = require("../../models/userSchema");
const ExpressError = require("../../utils/ExpressError");
const calculateDistance = require("../../utils/calculateDistance");
const Order = require("../../models/orderSchema");

const placeOrder = async (req, res) => {

    // 1. Get logged-in user's cart, location and addresses
    const user = await User.findById(req.session.userId)
        .select("cart location addresses")
        .populate("cart.product");

    if (!user) {
        throw new ExpressError(404, "User not found");
    }

    // 2. Check location exists
    if (
        !user.location ||
        user.location.latitude === undefined ||
        user.location.longitude === undefined
    ) {
        throw new ExpressError(
            400,
            "Please provide your location before placing an order"
        );
    }

    // 3. Check cart is not empty
    if (!user.cart || user.cart.length === 0) {
        throw new ExpressError(
            400,
            "Your cart is empty"
        );
    }

    // 4. Get default delivery address
    const defaultAddress = user.addresses?.find(
        address => address.isDefault === true
    );

    if (!defaultAddress) {
        throw new ExpressError(
            400,
            "Please add a default delivery address before placing an order"
        );
    }

    // 5. Shop location
    // Later this should come from Store/Shop model
    const shopLatitude = 28.4595;
    const shopLongitude = 77.0266;

    // 6. Calculate delivery distance
    const distance = calculateDistance(
        shopLatitude,
        shopLongitude,
        user.location.latitude,
        user.location.longitude
    );

    // 7. Delivery range check
    const DELIVERY_RADIUS = 2;

    if (distance > DELIVERY_RADIUS) {
        throw new ExpressError(
            400,
            "You are outside the delivery range"
        );
    }

    // 8. Create order items + calculate subtotal
    const items = [];
    let subtotal = 0;

    for (const cartItem of user.cart) {

        const product = cartItem.product;

        // Product doesn't exist
        if (!product) {
            throw new ExpressError(
                404,
                "One of the products in your cart no longer exists"
            );
        }

        // Check product availability
        if (!product.isAvailable) {
            throw new ExpressError(
                400,
                `${product.name} is currently unavailable`
            );
        }

        // Check stock
        if (product.stock < cartItem.quantity) {
            throw new ExpressError(
                409,
                `${product.name} is out of stock`
            );
        }

        // Decide selling price
        const sellingPrice =
            product.offerPrice !== undefined &&
            product.offerPrice < product.price
                ? product.offerPrice
                : product.price;

        // Calculate item subtotal
        const itemSubtotal =
            sellingPrice * cartItem.quantity;

        // Snapshot product information
        items.push({
            product: product._id,
            name: product.name,
            price: sellingPrice,
            quantity: cartItem.quantity,
            subtotal: itemSubtotal
        });

        subtotal += itemSubtotal;
    }

    // 9. Delivery fee
    const deliveryFee = 0;

    // 10. Discount
    const discount = 0;

    // 11. Final amount
    const totalAmount =
        subtotal + deliveryFee - discount;

    // 12. Create order
    const order = await Order.create({

        user: user._id,

        items,

        subtotal,

        deliveryFee,

        discount,

        totalAmount,

        // Snapshot delivery address
        deliveryAddress: {
            label: defaultAddress.label,
            address: defaultAddress.address
        },

        // Customer location snapshot
        customerLocation: {
            type: "Point",
            coordinates: [
                user.location.longitude,
                user.location.latitude
            ]
        },

        // Shop location snapshot
        shopLocation: {
            type: "Point",
            coordinates: [
                shopLongitude,
                shopLatitude
            ]
        },

        deliveryDistance: distance,

        // Current supported payment method
        paymentMethod: "COD",

        paymentStatus: "PENDING",

        orderStatus: "PENDING"
    });

    // 13. Clear cart
    user.cart = [];

    await user.save();

    // 14. Response
    return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order
    });
};

module.exports = placeOrder;
