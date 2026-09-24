const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const http = require("http");

// Connect to MongoDB
require("../models/mongoose");

const User = require("../models/userSchema");
const Rider = require("../models/riderSchema");
const Order = require("../models/orderSchema");
const Store = require("../models/storeSchema");
const Product = require("../models/productSchema");

// Require Express App
// Note: app.js listens on port 3000 by default. Let's make HTTP calls to port 3000
const BASE_URL = "http://127.0.0.1:3000";

// Helper for HTTP requests with cookie support
const request = async (path, options = {}, cookies = "") => {
    const url = `${BASE_URL}${path}`;
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };
    if (cookies) {
        headers["Cookie"] = cookies;
    }

    const response = await fetch(url, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const setCookie = response.headers.get("set-cookie");
    let nextCookies = cookies;
    if (setCookie) {
        nextCookies = setCookie.split(";")[0];
    }

    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        data = text;
    }

    return { status: response.status, data, cookies: nextCookies };
};

const runTest = async () => {
    console.log("=== STARTING COMPLETE DELIVERY FLOW VERIFICATION TEST ===\n");

    try {
        // Wait for server to be ready
        let serverReady = false;
        for (let i = 0; i < 5; i++) {
            try {
                const res = await fetch(`${BASE_URL}/`);
                if (res.status === 200) {
                    serverReady = true;
                    break;
                }
            } catch (e) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        if (!serverReady) {
            throw new Error("Server on port 3000 is not reachable. Make sure app is running or started.");
        }
        console.log("✓ Server reachable on port 3000");

        // 1. SETUP SHOPKEEPER & MAIN_STORE
        const shopkeeperEmail = `shop_${Date.now()}@test.com`;
        const shopkeeperPassword = "password123";
        const hashedPassword = await bcrypt.hash(shopkeeperPassword, 10);

        const shopkeeper = await User.create({
            name: "Test Shopkeeper",
            email: shopkeeperEmail,
            phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
            password: hashedPassword,
            role: "shopkeeper"
        });

        // Ensure MAIN_STORE exists
        let store = await Store.findOne({ storeKey: "MAIN_STORE" });
        if (!store) {
            store = await Store.create({
                storeKey: "MAIN_STORE",
                name: "Main Test Store",
                shopkeeper: shopkeeper._id,
                location: {
                    type: "Point",
                    coordinates: [77.2090, 28.6139] // Delhi
                },
                deliveryRadius: 10,
                isOpen: true
            });
        } else {
            store.isOpen = true;
            store.shopkeeper = shopkeeper._id;
            await store.save();
        }
        console.log("✓ Store and Shopkeeper configured");

        // Create a test product
        const product = await Product.create({
            name: "Test Milk",
            description: "Fresh milk",
            price: 50,
            stock: 20,
            category: "Dairy",
            isAvailable: true
        });
        console.log("✓ Test product created");

        // 2. CUSTOMER REGISTRATION & LOGIN
        const customerEmail = `customer_${Date.now()}@test.com`;
        const customerPhone = `8${Math.floor(100000000 + Math.random() * 900000000)}`;
        const customerPassword = "password123";

        const regRes = await request("/api/users/register", {
            method: "POST",
            body: {
                name: "Test Customer",
                email: customerEmail,
                phone: customerPhone,
                password: customerPassword,
                CnfPassword: customerPassword
            }
        });
        if (regRes.status !== 201) {
            throw new Error(`Customer registration failed: ${JSON.stringify(regRes.data)}`);
        }
        console.log("✓ Customer registered successfully");

        // Customer Login via SAME LOGIN PAGE (/api/users/login)
        const custLoginRes = await request("/api/users/login", {
            method: "POST",
            body: {
                email: customerEmail,
                password: customerPassword
            }
        });
        if (custLoginRes.status !== 200 || custLoginRes.data.user.role !== "customer") {
            throw new Error(`Customer login failed: ${JSON.stringify(custLoginRes.data)}`);
        }
        const customerCookies = custLoginRes.cookies;
        console.log("✓ Customer logged in via /api/users/login with role:", custLoginRes.data.user.role);

        // 3. SET CUSTOMER LOCATION & ADDRESS
        const locRes = await request("/api/users/location", {
            method: "PATCH",
            body: { latitude: 28.6140, longitude: 77.2091 }
        }, customerCookies);
        if (locRes.status !== 200) {
            throw new Error(`Set location failed: ${JSON.stringify(locRes.data)}`);
        }

        const addrRes = await request("/api/users/addresses", {
            method: "POST",
            body: {
                label: "home",
                address: "Flat 101, Test Apartments, New Delhi",
                latitude: 28.6140,
                longitude: 77.2091,
                isDefault: true
            }
        }, customerCookies);
        if (addrRes.status !== 201) {
            throw new Error(`Add address failed: ${JSON.stringify(addrRes.data)}`);
        }

        // Add to Cart
        await request("/api/users/cart", {
            method: "POST",
            body: { productId: product._id.toString(), quantity: 2 }
        }, customerCookies);
        console.log("✓ Customer set location, address, and added item to cart");

        // 4. PLACE ORDER
        const orderRes = await request("/api/orders", {
            method: "POST"
        }, customerCookies);

        if (orderRes.status !== 201 || !orderRes.data.order) {
            throw new Error(`Place order failed: ${JSON.stringify(orderRes.data)}`);
        }
        const orderId = orderRes.data.order._id;
        console.log(`✓ Order placed successfully! Order ID: ${orderId}, Status: ${orderRes.data.order.orderStatus}`);

        // 5. SHOPKEEPER LOGIN & ADVANCE ORDER STATUS
        const shopLoginRes = await request("/api/users/login", {
            method: "POST",
            body: {
                email: shopkeeperEmail,
                password: shopkeeperPassword
            }
        });
        if (shopLoginRes.status !== 200 || shopLoginRes.data.user.role !== "shopkeeper") {
            throw new Error(`Shopkeeper login failed: ${JSON.stringify(shopLoginRes.data)}`);
        }
        const shopkeeperCookies = shopLoginRes.cookies;
        console.log("✓ Shopkeeper logged in via /api/users/login");

        // Shopkeeper creates a Rider
        const riderPhone = `7${Math.floor(100000000 + Math.random() * 900000000)}`;
        const riderPassword = "password123";
        const createRiderRes = await request("/api/riders", {
            method: "POST",
            body: {
                name: "Raju Rider",
                phone: riderPhone,
                email: `raju_${Date.now()}@test.com`,
                password: riderPassword
            }
        }, shopkeeperCookies);

        if (createRiderRes.status !== 201) {
            throw new Error(`Shopkeeper create rider failed: ${JSON.stringify(createRiderRes.data)}`);
        }
        const createdRiderId = createRiderRes.data.rider.id;
        console.log(`✓ Shopkeeper created Rider: ${createRiderRes.data.rider.name} (Phone: ${riderPhone})`);

        // Advance Order: PENDING -> ACCEPTED -> PREPARING -> READY
        await request(`/api/orders/${orderId}/status`, {
            method: "PATCH",
            body: { status: "ACCEPTED" }
        }, shopkeeperCookies);

        await request(`/api/orders/${orderId}/status`, {
            method: "PATCH",
            body: { status: "PREPARING" }
        }, shopkeeperCookies);

        const readyRes = await request(`/api/orders/${orderId}/status`, {
            method: "PATCH",
            body: { status: "READY" }
        }, shopkeeperCookies);
        if (readyRes.status !== 200 || readyRes.data.order.orderStatus !== "READY") {
            throw new Error(`Move order to READY failed: ${JSON.stringify(readyRes.data)}`);
        }
        console.log("✓ Shopkeeper advanced order status to READY");

        // 6. RIDER LOGINS FROM THE SAME LOGIN PAGE (/api/users/login)
        console.log("\n--- Testing Rider Login on SAME LOGIN PAGE ---");
        const riderUnifiedLoginRes = await request("/api/users/login", {
            method: "POST",
            body: {
                phone: riderPhone,
                password: riderPassword
            }
        });

        if (riderUnifiedLoginRes.status !== 200 || riderUnifiedLoginRes.data.user.role !== "rider") {
            throw new Error(`Rider login from same login page failed: ${JSON.stringify(riderUnifiedLoginRes.data)}`);
        }
        const riderCookies = riderUnifiedLoginRes.cookies;
        console.log("✓ Rider logged in from SAME LOGIN PAGE (/api/users/login) with role: 'rider'!");

        // Verify that direct rider login (/api/riders/login) has been removed (returns 404)
        const directRiderLogin = await request("/api/riders/login", {
            method: "POST",
            body: {
                phone: riderPhone,
                password: riderPassword
            }
        });
        if (directRiderLogin.status !== 404) {
            throw new Error(`Expected /api/riders/login to be removed (404), but got status ${directRiderLogin.status}`);
        }
        console.log("✓ Verified extra rider login route (/api/riders/login) is removed (404)!");

        // Verify that direct rider logout (/api/riders/logout) has been removed (returns 404)
        const directRiderLogout = await request("/api/riders/logout", {
            method: "POST"
        }, riderCookies);
        if (directRiderLogout.status !== 404) {
            throw new Error(`Expected /api/riders/logout to be removed (404), but got status ${directRiderLogout.status}`);
        }
        console.log("✓ Verified extra rider logout route (/api/riders/logout) is removed (404)!");

        // 7. RIDER VIEWS ORDERS
        console.log("\n--- Testing Rider Order View ---");
        const riderOrdersRes = await request("/api/riders/orders", {}, riderCookies);
        if (riderOrdersRes.status !== 200 || !riderOrdersRes.data.success) {
            throw new Error(`Rider get orders failed: ${JSON.stringify(riderOrdersRes.data)}`);
        }
        console.log(`✓ Rider view orders successful! Total assigned: ${riderOrdersRes.data.summary.totalAssigned}, Available to pickup: ${riderOrdersRes.data.summary.availableToPickup}`);

        // 8. RIDER ACCEPTS / CLAIMS ORDER
        console.log("\n--- Testing Rider Accept Order ---");
        const acceptRes = await request(`/api/riders/orders/${orderId}/accept`, {
            method: "PATCH"
        }, riderCookies);
        if (acceptRes.status !== 200) {
            throw new Error(`Rider accept order failed: ${JSON.stringify(acceptRes.data)}`);
        }
        console.log("✓ Rider accepted order successfully!");

        // 9. RIDER MARKS OUT_FOR_DELIVERY
        console.log("\n--- Testing Rider Out For Delivery ---");
        const outRes = await request(`/api/riders/orders/${orderId}/status`, {
            method: "PATCH",
            body: { status: "OUT_FOR_DELIVERY" }
        }, riderCookies);
        if (outRes.status !== 200 || outRes.data.order.orderStatus !== "OUT_FOR_DELIVERY") {
            throw new Error(`Rider mark OUT_FOR_DELIVERY failed: ${JSON.stringify(outRes.data)}`);
        }
        console.log("✓ Order status is now OUT_FOR_DELIVERY!");

        // 10. RIDER SENDS / GENERATES OTP
        console.log("\n--- Testing Rider OTP Generation ---");
        const otpRes = await request(`/api/riders/orders/${orderId}/otp`, {
            method: "POST"
        }, riderCookies);
        if (otpRes.status !== 200 || !otpRes.data.developmentOTP) {
            throw new Error(`Rider generate OTP failed: ${JSON.stringify(otpRes.data)}`);
        }
        const deliveryOtp = otpRes.data.developmentOTP;
        console.log(`✓ Delivery OTP generated by Rider successfully: ${deliveryOtp}`);

        // 11. RIDER VERIFIES OTP & DELIVERS ORDER
        console.log("\n--- Testing Rider OTP Verification ---");
        const verifyRes = await request(`/api/riders/orders/${orderId}/otp/verify`, {
            method: "POST",
            body: { otp: deliveryOtp }
        }, riderCookies);

        if (verifyRes.status !== 200 || verifyRes.data.order.orderStatus !== "DELIVERED") {
            throw new Error(`Rider verify OTP failed: ${JSON.stringify(verifyRes.data)}`);
        }
        console.log("✓ OTP verified successfully! Order marked as DELIVERED!");
        console.log(`✓ Final Order State: Status = ${verifyRes.data.order.orderStatus}, Payment = ${verifyRes.data.order.paymentStatus}, DeliveredAt = ${verifyRes.data.order.deliveredAt}`);

        // 12. RIDER LOCATION UPDATE & PROFILE
        await request("/api/riders/location", {
            method: "PATCH",
            body: { latitude: 28.6145, longitude: 77.2095 }
        }, riderCookies);
        const profileRes = await request("/api/riders/profile", {}, riderCookies);
        console.log(`✓ Rider profile fetched: ${profileRes.data.rider.name} (${profileRes.data.rider.phone})`);

        // Check main profile route for rider
        const mainProfileRes = await request("/api/users/profile", {}, riderCookies);
        if (mainProfileRes.status !== 200 || mainProfileRes.data.user.role !== "rider") {
            throw new Error(`Main profile route failed for rider: ${JSON.stringify(mainProfileRes.data)}`);
        }
        console.log("✓ Rider profile fetched from main profile route (/api/users/profile)!");

        // 13. RIDER LOGOUT VIA MAIN LOGOUT ROUTE (/api/users/logout)
        console.log("\n--- Testing Rider Logout via Main Logout Route ---");
        const riderLogoutRes = await request("/api/users/logout", {
            method: "POST"
        }, riderCookies);
        if (riderLogoutRes.status !== 200 || !riderLogoutRes.data.success) {
            throw new Error(`Rider main logout failed: ${JSON.stringify(riderLogoutRes.data)}`);
        }
        console.log("✓ Rider logged out successfully via main logout route (/api/users/logout)!");

        // 14. VERIFY RIDER CANNOT ACCESS PROTECTED ROUTES AFTER LOGOUT
        const postLogoutRes = await request("/api/riders/orders", {}, riderCookies);
        if (postLogoutRes.status !== 401) {
            throw new Error(`Expected 401 after logout, but got status ${postLogoutRes.status}`);
        }
        console.log("✓ Verified rider cannot access protected routes after logout (401)!");

        console.log("\n=======================================================");
        console.log("🎉 ALL TESTS PASSED! FULL DELIVERY LIFECYCLE VERIFIED!");
        console.log("=======================================================\n");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ TEST FAILED:", err);
        process.exit(1);
    }
};

runTest();
