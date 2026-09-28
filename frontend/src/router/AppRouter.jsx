import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProtectedRoute from "../components/ProtectedRoute";

function AppRouter() {
    return (
        <BrowserRouter>
            <div className="flex min-h-screen flex-col">

                <Navbar />

                <main className="flex-1">
                    <Routes>

                        {/* ================= PUBLIC ================= */}

                        <Route
                            path="/"
                            element={<Home />}
                        />

                        <Route
                            path="/login"
                            element={<Login />}
                        />

                        <Route
                            path="/register"
                            element={<Register />}
                        />

                        <Route
                            path="/products"
                            element={<Products />}
                        />

                        <Route
                            path="/products/:productId"
                            element={<ProductDetails />}
                        />


                        {/* ================= PROTECTED ================= */}

                        <Route element={<ProtectedRoute />}>

                            <Route
                                path="/profile"
                                element={<Profile />}
                            />

                            <Route
                                path="/cart"
                                element={<Cart />}
                            />

                            <Route
                                path="/checkout"
                                element={<Checkout />}
                            />

                            <Route
                                path="/orders"
                                element={<Orders />}
                            />

                            <Route
                                path="/orders/:orderId"
                                element={
                                    <div className="p-10">
                                        Order Details
                                    </div>
                                }
                            />

                        </Route>

                    </Routes>
                </main>

                <Footer />

            </div>
        </BrowserRouter>
    );
}

export default AppRouter;