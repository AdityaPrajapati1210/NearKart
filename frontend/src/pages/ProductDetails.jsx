import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getProducts } from "../services/product";
import { addToCart } from "../services/cart";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";

function ProductDetails() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadProduct = async () => {
            try {
                setError("");

                /*
                 * Current backend has product listing API.
                 * Until a dedicated GET /products/:productId
                 * endpoint is added, we find the product from
                 * the available product list.
                 */
                const response = await getProducts({
                    limit: 50
                });

                const foundProduct = response.products?.find(
                    (item) => item._id === productId
                );

                if (!foundProduct) {
                    throw new Error("Product not found");
                }

                setProduct(foundProduct);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [productId]);

    const handleQuantityChange = (value) => {
        const newQuantity = Number(value);

        if (!product) {
            return;
        }

        setQuantity(
            Math.min(
                Math.max(newQuantity, 1),
                product.stock
            )
        );
    };

    const handleAddToCart = async () => {
        if (!product || product.stock < 1) {
            return;
        }

        setAdding(true);
        setError("");
        setSuccess("");

        try {
            await addToCart(product._id, quantity);

            setSuccess("Product added to cart successfully.");
        } catch (error) {
            setError(error.message);
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <Loader text="Loading product..." />
            </main>
        );
    }

    if (error && !product) {
        return (
            <main className="min-h-[60vh] px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl">
                    <ErrorMessage message={error} />

                    <Link
                        to="/products"
                        className="mt-5 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                        ← Back to Products
                    </Link>
                </div>
            </main>
        );
    }

    const finalPrice =
        product.offerPrice > 0
            ? product.offerPrice
            : product.price;

    const hasDiscount =
        product.offerPrice > 0 &&
        product.offerPrice < product.price;

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">

                <Link
                    to="/products"
                    className="mb-6 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    ← Back to Products
                </Link>

                <div className="grid overflow-hidden rounded-2xl bg-white shadow-sm md:grid-cols-2">

                    {/* Product Image */}
                    <div className="flex min-h-[350px] items-center justify-center bg-gray-100">
                        {product.image?.url ? (
                            <img
                                src={product.image.url}
                                alt={product.name}
                                className="h-full max-h-[500px] w-full object-cover"
                            />
                        ) : (
                            <span className="text-8xl">
                                🛍️
                            </span>
                        )}
                    </div>

                    {/* Product Information */}
                    <div className="p-6 sm:p-10">

                        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                            {product.category}
                        </p>

                        <h1 className="mt-3 text-3xl font-bold text-gray-900">
                            {product.name}
                        </h1>

                        <div className="mt-5 flex items-center gap-3">
                            <span className="text-3xl font-bold text-gray-900">
                                ₹{finalPrice}
                            </span>

                            {hasDiscount && (
                                <span className="text-lg text-gray-400 line-through">
                                    ₹{product.price}
                                </span>
                            )}
                        </div>

                        <div className="mt-6 border-t border-gray-200 pt-6">
                            <h2 className="text-sm font-semibold text-gray-900">
                                Description
                            </h2>

                            <p className="mt-2 leading-7 text-gray-600">
                                {product.description ||
                                    "No description available for this product."}
                            </p>
                        </div>

                        <div className="mt-6">
                            <p className="text-sm text-gray-600">
                                Availability:
                                {" "}
                                <span
                                    className={
                                        product.stock > 0
                                            ? "font-semibold text-green-600"
                                            : "font-semibold text-red-600"
                                    }
                                >
                                    {product.stock > 0
                                        ? `${product.stock} in stock`
                                        : "Out of stock"}
                                </span>
                            </p>
                        </div>

                        {error && (
                            <div className="mt-5">
                                <ErrorMessage
                                    message={error}
                                    onClose={() => setError("")}
                                />
                            </div>
                        )}

                        {success && (
                            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                                {success}
                            </div>
                        )}

                        {product.stock > 0 && (
                            <div className="mt-8">
                                <label
                                    htmlFor="quantity"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Quantity
                                </label>

                                <div className="mt-2 flex max-w-xs">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleQuantityChange(
                                                quantity - 1
                                            )
                                        }
                                        disabled={quantity <= 1 || adding}
                                        className="rounded-l-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        −
                                    </button>

                                    <input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        max={product.stock}
                                        value={quantity}
                                        onChange={(event) =>
                                            handleQuantityChange(
                                                event.target.value
                                            )
                                        }
                                        disabled={adding}
                                        className="w-20 border-y border-gray-300 text-center text-sm outline-none"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleQuantityChange(
                                                quantity + 1
                                            )
                                        }
                                        disabled={
                                            quantity >= product.stock ||
                                            adding
                                        }
                                        className="rounded-r-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={adding}
                                    className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {adding
                                        ? "Adding..."
                                        : "Add to Cart"}
                                </button>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => navigate("/cart")}
                            className="mt-3 w-full rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                        >
                            Go to Cart
                        </button>

                    </div>
                </div>
            </div>
        </main>
    );
}

export default ProductDetails;