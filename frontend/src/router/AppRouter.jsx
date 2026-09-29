import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Search from "../pages/Search";
import Location from "../pages/Location";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import OrderDetails from "../pages/OrderDetails";
import OrderTracking from "../pages/OrderTracking";
import Profile from "../pages/Profile";
import Addresses from "../pages/Addresses";
import NotFound from "../pages/NotFound";

import ProtectedRoute from "../components/ProtectedRoute";

function AppRouter() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />
            <Route
                path="/products/:productId"
                element={<ProductDetails />}
            />
            <Route path="/search" element={<Search />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route path="/location" element={<Location />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route
                    path="/orders/:orderId"
                    element={<OrderDetails />}
                />
                <Route
                    path="/orders/:orderId/tracking"
                    element={<OrderTracking />}
                />
                <Route path="/profile" element={<Profile />} />
                <Route path="/addresses" element={<Addresses />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default AppRouter;