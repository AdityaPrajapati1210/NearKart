import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getProducts } from "../services/product";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

function Products() {
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);

    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");

    const loadProducts = useCallback(async (pageNumber, append = false) => {
        try {
            setError("");

            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            const response = await getProducts({
                page: pageNumber,
                limit: 12
            });

            const newProducts = response.products || [];

            setProducts((previous) =>
                append
                    ? [...previous, ...newProducts]
                    : newProducts
            );

            setHasMore(Boolean(response.hasMore));
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        loadProducts(1);
    }, [loadProducts]);

    const handleLoadMore = async () => {
        const nextPage = page + 1;

        await loadProducts(nextPage, true);

        setPage(nextPage);
    };

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center px-4">
                <Loader text="Loading products..." />
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Products
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Browse products available from your nearby store.
                    </p>
                </div>

                <ErrorMessage
                    message={error}
                    onClose={() => setError("")}
                />

                {!error && products.length === 0 && (
                    <EmptyState
                        title="No products available"
                        message="There are currently no products available."
                    />
                )}

                {products.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {products.map((product) => {
                                const finalPrice =
                                    product.offerPrice > 0
                                        ? product.offerPrice
                                        : product.price;

                                const hasDiscount =
                                    product.offerPrice > 0 &&
                                    product.offerPrice < product.price;

                                return (
                                    <article
                                        key={product._id}
                                        className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <div className="flex h-52 items-center justify-center bg-gray-100">
                                            {product.image?.url ? (
                                                <img
                                                    src={product.image.url}
                                                    alt={product.name}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-5xl">
                                                    🛍️
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-5">
                                            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                                                {product.category}
                                            </p>

                                            <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-gray-900">
                                                {product.name}
                                            </h2>

                                            <div className="mt-4 flex items-center gap-2">
                                                <span className="text-xl font-bold text-gray-900">
                                                    ₹{finalPrice}
                                                </span>

                                                {hasDiscount && (
                                                    <span className="text-sm text-gray-400 line-through">
                                                        ₹{product.price}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-2 text-sm text-gray-500">
                                                {product.stock > 0
                                                    ? `${product.stock} available`
                                                    : "Out of stock"}
                                            </p>

                                            <Link
                                                to={`/products/${product._id}`}
                                                className="mt-5 block rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                                            >
                                                View Product
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {hasMore && (
                            <div className="mt-10 flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loadingMore
                                        ? "Loading..."
                                        : "Show More"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}

export default Products;