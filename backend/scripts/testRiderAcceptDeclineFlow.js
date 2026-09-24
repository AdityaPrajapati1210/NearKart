const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

require("../models/mongoose");

const User = require("../models/userSchema");
const Rider = require("../models/riderSchema");
const Order = require("../models/orderSchema");
const Store = require("../models/storeSchema");
const Product = require("../models/productSchema");

const BASE_URL = "http://127.0.0.1:3000";

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
    console.log("=== STARTING ACCEPT / DECLINE / REASSIGN VERIFICATION TEST ===\n");

    try {
        // 1. SHOPKEEPER LOGIN
        const shopRes = await request("/api/users/login", {
            method: "POST",
            body: {
                email: "shopkeeper@nearkart.com",
                password: "password123"
            }
        });
        if (shopRes.status !== 200) {
            throw new Error(`Shopkeeper login failed: ${JSON.stringify(shopRes.data)}`);
        }
        const shopCookies = shopRes.cookies;
        console.log("✓ Shopkeeper logged in");

        // 2. CREATE TWO TEST RIDERS: Rider 1 & Rider 2
        const rider1Phone = `8${Math.floor(100000000 + Math.random() * 900000000)}`;
        const rider2Phone = `8${Math.floor(100000000 + Math.random() * 900000000)}`;
        const riderPassword = "password123";

        const r1Res = await request("/api/riders", {
            method: "POST",
            body: {
                name: "Rider One",
                phone: rider1Phone,
                email: `rider1_${Date.now()}@test.com`,
                password: riderPassword
            }
        }, shopCookies);
        const rider1Id = r1Res.data.rider.id;

        const r2Res = await request("/api/riders", {
            method: "POST",
            body: {
                name: "Rider Two",
                phone: rider2Phone,
                email: `rider2_${Date.now()}@test.com`,
                password: riderPassword
            }
        }, shopCookies);
        const rider2Id = r2Res.data.rider.id;

        console.log(`✓ Rider 1 created: ${rider1Id} (${rider1Phone})`);
        console.log(`✓ Rider 2 created: ${rider2Id} (${rider2Phone})`);

        // 3. LOGIN BOTH RIDERS
        const loginRider1 = await request("/api/users/login", {
            method: "POST",
            body: { phone: rider1Phone, password: riderPassword }
        });
        const rider1Cookies = loginRider1.cookies;

        const loginRider2 = await request("/api/users/login", {
            method: "POST",
            body: { phone: rider2Phone, password: riderPassword }
        });
        const rider2Cookies = loginRider2.cookies;
        console.log("✓ Both riders logged in");

        // 4. CREATE PRODUCT & PLACE ORDER AS CUSTOMER
        const customerPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
        const custEmail = `cust_${Date.now()}@test.com`;
        await request("/api/users/register", {
            method: "POST",
            body: {
                name: "Cust Test",
                email: custEmail,
                phone: customerPhone,
                password: "password123",
                CnfPassword: "password123"
            }
        });

        const custLogin = await request("/api/users/login", {
            method: "POST",
            body: { email: custEmail, password: "password123" }
        });
        const custCookies = custLogin.cookies;

        await request("/api/users/location", {
            method: "PATCH",
            body: { latitude: 28.6140, longitude: 77.2091 }
        }, custCookies);

        await request("/api/users/addresses", {
            method: "POST",
            body: {
                label: "home",
                address: "Test Home Address",
                latitude: 28.6140,
                longitude: 77.2091,
                isDefault: true
            }
        }, custCookies);

        const product = await Product.findOne({});
        await request("/api/users/cart", {
            method: "POST",
            body: { productId: product._id.toString(), quantity: 1 }
        }, custCookies);

        const orderRes = await request("/api/orders", { method: "POST" }, custCookies);
        const orderId = orderRes.data.order._id;
        console.log(`✓ Order placed: ${orderId}`);

        // Advance to READY
        await request(`/api/orders/${orderId}/status`, { method: "PATCH", body: { status: "ACCEPTED" } }, shopCookies);
        await request(`/api/orders/${orderId}/status`, { method: "PATCH", body: { status: "PREPARING" } }, shopCookies);
        await request(`/api/orders/${orderId}/status`, { method: "PATCH", body: { status: "READY" } }, shopCookies);
        console.log("✓ Order advanced to READY");

        // 5. TEST DIRECT ASSIGNMENT TO RIDER 1
        console.log("\n--- Testing Shopkeeper Assigns Rider 1 ---");
        const assign1 = await request(`/api/orders/${orderId}/assign-rider`, {
            method: "PATCH",
            body: { riderId: rider1Id }
        }, shopCookies);
        if (assign1.status !== 200 || assign1.data.order.rider.id !== rider1Id) {
            throw new Error(`Assign Rider 1 failed: ${JSON.stringify(assign1.data)}`);
        }
        console.log("✓ Order assigned to Rider 1 successfully");

        // 6. RIDER 1 DECLINES THE ORDER
        console.log("\n--- Testing Rider 1 Declines Order ---");
        const declineRes = await request(`/api/riders/orders/${orderId}/decline`, {
            method: "PATCH",
            body: { reason: "Flat tire" }
        }, rider1Cookies);

        if (declineRes.status !== 200 || declineRes.data.order.rider !== null) {
            throw new Error(`Rider 1 decline failed: ${JSON.stringify(declineRes.data)}`);
        }
        console.log("✓ Rider 1 declined order! Order rider released to null");

        // 7. VERIFY POOL AVAILABILITY
        console.log("\n--- Testing Pool Visibility After Decline ---");
        const r1Avail = await request("/api/riders/orders/available", {}, rider1Cookies);
        const r1SeesOrder = r1Avail.data.orders.some(o => o._id === orderId);
        if (r1SeesOrder) {
            throw new Error("Rider 1 should NOT see the order they just declined!");
        }
        console.log("✓ Rider 1 does NOT see the declined order in available orders (filtered out correctly)");

        const r2Avail = await request("/api/riders/orders/available", {}, rider2Cookies);
        const r2SeesOrder = r2Avail.data.orders.some(o => o._id === orderId);
        if (!r2SeesOrder) {
            throw new Error("Rider 2 SHOULD see the order in available orders!");
        }
        console.log("✓ Rider 2 sees the order in available orders!");

        // 8. RIDER 2 ACCEPTS THE ORDER
        console.log("\n--- Testing Rider 2 Accepts Order ---");
        const r2Accept = await request(`/api/riders/orders/${orderId}/accept`, {
            method: "PATCH"
        }, rider2Cookies);
        if (r2Accept.status !== 200 || r2Accept.data.order.rider.toString() !== rider2Id) {
            throw new Error(`Rider 2 accept failed: ${JSON.stringify(r2Accept.data)}`);
        }
        console.log("✓ Rider 2 accepted the order successfully!");

        // 9. TEST SHOPKEEPER OVERRIDE / REASSIGNMENT
        console.log("\n--- Testing Shopkeeper Reassign Override ---");
        const reassignRes = await request(`/api/orders/${orderId}/assign-rider`, {
            method: "PATCH",
            body: { riderId: rider1Id } // Shopkeeper re-assigns Rider 1
        }, shopCookies);
        if (reassignRes.status !== 200) {
            throw new Error(`Shopkeeper reassign failed: ${JSON.stringify(reassignRes.data)}`);
        }
        console.log("✓ Shopkeeper successfully re-assigned order to Rider 1 (No blocking 400 error!)");

        // Reassign back to Rider 2 to complete delivery
        await request(`/api/orders/${orderId}/assign-rider`, {
            method: "PATCH",
            body: { riderId: rider2Id }
        }, shopCookies);

        // 10. RIDER 2 COMPLETES DELIVERY
        console.log("\n--- Testing Delivery by Rider 2 ---");
        await request(`/api/riders/orders/${orderId}/status`, {
            method: "PATCH",
            body: { status: "OUT_FOR_DELIVERY" }
        }, rider2Cookies);

        const otpRes = await request(`/api/riders/orders/${orderId}/otp`, { method: "POST" }, rider2Cookies);
        const otp = otpRes.data.developmentOTP;

        const verifyRes = await request(`/api/riders/orders/${orderId}/otp/verify`, {
            method: "POST",
            body: { otp }
        }, rider2Cookies);

        if (verifyRes.status !== 200 || verifyRes.data.order.orderStatus !== "DELIVERED") {
            throw new Error(`Delivery completion failed: ${JSON.stringify(verifyRes.data)}`);
        }
        console.log("✓ Order successfully delivered by Rider 2!");

        console.log("\n=======================================================");
        console.log("🎉 ALL TESTS PASSED! ACCEPT & DECLINE FLOW FULLY VERIFIED!");
        console.log("=======================================================\n");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ TEST FAILED:", err);
        process.exit(1);
    }
};

runTest();
