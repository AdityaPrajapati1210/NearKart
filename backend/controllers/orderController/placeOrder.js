const User = require("../../models/userSchema");
const Store = require("../../models/storeSchema");
const Order = require("../../models/orderSchema");

const ExpressError = require("../../utils/ExpressError");
const calculateDistance = require("../../utils/calculateDistance");


const placeOrder = async (req, res) => {

    // -----------------------------------
    // 1. Get logged-in user's cart,
    //    location and addresses
    // -----------------------------------

    const user = await User.findById(req.session.userId)
        .select("cart location addresses")
        .populate("cart.product");

    if (!user) {
        throw new ExpressError(404, "User not found");
    }


    // -----------------------------------
    // 2. Check customer location
    // -----------------------------------

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


    // -----------------------------------
    // 3. Validate customer coordinates
    // -----------------------------------

    const customerLatitude = user.location.latitude;
    const customerLongitude = user.location.longitude;

    if (
        typeof customerLatitude !== "number" ||
        typeof customerLongitude !== "number" ||
        !Number.isFinite(customerLatitude) ||
        !Number.isFinite(customerLongitude) ||
        customerLatitude < -90 ||
        customerLatitude > 90 ||
        customerLongitude < -180 ||
        customerLongitude > 180
    ) {
        throw new ExpressError(
            400,
            "Invalid customer location"
        );
    }


    // -----------------------------------
    // 4. Check cart
    // -----------------------------------

    if (!user.cart || user.cart.length === 0) {
        throw new ExpressError(
            400,
            "Your cart is empty"
        );
    }


    // -----------------------------------
    // 5. Get default delivery address
    // -----------------------------------

    const defaultAddress = user.addresses?.find(
        address => address.isDefault === true
    );

    if (!defaultAddress) {
        throw new ExpressError(
            400,
            "Please add a default delivery address before placing an order"
        );
    }


    // -----------------------------------
    // 6. Get MAIN_STORE
    // -----------------------------------

    const store = await Store.findOne({
        storeKey: "MAIN_STORE"
    }).select(
        "name location deliveryRadius isOpen"
    );

    if (!store) {
        throw new ExpressError(
            404,
            "Store not found"
        );
    }


    // -----------------------------------
    // 7. Check store status
    // -----------------------------------

    if (!store.isOpen) {
        throw new ExpressError(
            400,
            "Store is currently closed"
        );
    }


    // -----------------------------------
    // 8. Validate store location
    // -----------------------------------

    if (
        !store.location ||
        !Array.isArray(store.location.coordinates) ||
        store.location.coordinates.length !== 2
    ) {
        throw new ExpressError(
            500,
            "Store location is not configured correctly"
        );
    }


    const [
        shopLongitude,
        shopLatitude
    ] = store.location.coordinates;


    // -----------------------------------
    // 9. Calculate delivery distance
    // -----------------------------------

    const distance = calculateDistance(
        shopLatitude,
        shopLongitude,
        customerLatitude,
        customerLongitude
    );


    // -----------------------------------
    // 10. Check delivery radius
    // -----------------------------------

    if (distance > store.deliveryRadius) {
        throw new ExpressError(
            400,
            `You are outside the delivery range. Maximum delivery distance is ${store.deliveryRadius} KM`
        );
    }


    // -----------------------------------
    // 11. Create order items
    // -----------------------------------

    const items = [];

    let subtotal = 0;


    for (const cartItem of user.cart) {

        const product = cartItem.product;


        // Product no longer exists
        if (!product) {
            throw new ExpressError(
                404,
                "One of the products in your cart no longer exists"
            );
        }


        // Product unavailable
        if (!product.isAvailable) {
            throw new ExpressError(
                400,
                `${product.name} is currently unavailable`
            );
        }


        // Invalid quantity
        if (
            !Number.isInteger(cartItem.quantity) ||
            cartItem.quantity < 1
        ) {
            throw new ExpressError(
                400,
                `Invalid quantity for ${product.name}`
            );
        }


        // Check stock
        if (product.stock < cartItem.quantity) {
            throw new ExpressError(
                409,
                `${product.name} has insufficient stock`
            );
        }


        // Decide selling price: offerPrice only applies if it is a valid discount (> 0 and < price)
        const hasValidOfferPrice =
            typeof product.offerPrice === "number" &&
            product.offerPrice > 0 &&
            product.offerPrice < product.price;

        const sellingPrice = hasValidOfferPrice
            ? product.offerPrice
            : product.price;


        // Calculate subtotal
        const itemSubtotal =
            sellingPrice * cartItem.quantity;


        // Product snapshot
        items.push({
            product: product._id,
            name: product.name,
            price: sellingPrice,
            quantity: cartItem.quantity,
            subtotal: itemSubtotal
        });


        subtotal += itemSubtotal;
    }


    // -----------------------------------
    // 12. Delivery fee
    // -----------------------------------

    const deliveryFee = 0;


    // -----------------------------------
    // 13. Discount
    // -----------------------------------

    const discount = 0;


    // -----------------------------------
    // 14. Final amount
    // -----------------------------------

    const totalAmount =
        subtotal +
        deliveryFee -
        discount;


    // -----------------------------------
    // 15. Create order
    // -----------------------------------

    const order = await Order.create({

        user: user._id,

        items,

        subtotal,

        deliveryFee,

        discount,

        totalAmount,


        // Delivery address snapshot
        deliveryAddress: {
            label: defaultAddress.label,
            address: defaultAddress.address
        },


        // Customer location snapshot
        customerLocation: {
            type: "Point",
            coordinates: [
                customerLongitude,
                customerLatitude
            ]
        },


        // Store location snapshot
        shopLocation: {
            type: "Point",
            coordinates: [
                shopLongitude,
                shopLatitude
            ]
        },


        // Distance at order time
        deliveryDistance: distance,


        // Payment
        paymentMethod: "COD",
        paymentStatus: "PENDING",


        // Order status
        orderStatus: "PENDING"
    });


    // -----------------------------------
    // 16. Clear cart
    // -----------------------------------

    user.cart = [];

    await user.save();


    // -----------------------------------
    // 17. Response
    // -----------------------------------

    return res.status(201).json({

        success: true,

        message: "Order placed successfully",

        order
    });
};


module.exports = placeOrder;