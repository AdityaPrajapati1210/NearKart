import { useCallback, useEffect, useState } from "react";

import { getProducts } from "../services/product";

import ErrorMessage from "../components/ErrorMessage";
import ProductGrid from "../components/ProductGrid";

function Products() {
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);

    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");

    const loadProducts = useCallback(
        async (pageNumber, append = false) => {
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
                setError(
                    error.message || "Failed to load products."
                );
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        []
    );

    useEffect(() => {
        loadProducts(1);
    }, [loadProducts]);

    const handleLoadMore = async () => {
        const nextPage = page + 1;

        await loadProducts(nextPage, true);

        setPage(nextPage);
    };

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Products
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Browse products available from your nearby
                        store.
                    </p>
                </div>

                {error && (
                    <div className="mb-6">
                        <ErrorMessage
                            message={error}
                            onClose={() => setError("")}
                        />
                    </div>
                )}

                <ProductGrid
                    products={products}
                    loading={loading}
                    emptyTitle="No products available"
                    emptyMessage="There are currently no products available."
                />

                {!loading && !error && hasMore && (
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
            </div>
        </main>
    );
}

export default Products;