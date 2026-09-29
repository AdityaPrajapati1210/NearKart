import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { getProducts } from "../services/product";

import SearchBar from "../components/SearchBar";
import ProductGrid from "../components/ProductGrid";
import ErrorMessage from "../components/ErrorMessage";

function Search() {
    const [searchParams, setSearchParams] = useSearchParams();

    const initialQuery = searchParams.get("q") || "";

    const [query, setQuery] = useState(initialQuery);
    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const searchProducts = async (searchValue) => {
        const trimmedQuery = searchValue.trim();

        if (!trimmedQuery) {
            setProducts([]);
            setQuery("");
            setSearchParams({});
            return;
        }

        try {
            setLoading(true);
            setError("");

            setQuery(trimmedQuery);
            setSearchParams({ q: trimmedQuery });

            /*
             * Current product API may not support server-side
             * search yet, so we fetch the available products and
             * filter them on the client.
             */
            const response = await getProducts({
                page: 1,
                limit: 50
            });

            const allProducts = response.products || [];

            const normalizedQuery =
                trimmedQuery.toLowerCase();

            const filteredProducts = allProducts.filter(
                (product) => {
                    const name =
                        product.name?.toLowerCase() || "";

                    const category =
                        product.category?.toLowerCase() || "";

                    const description =
                        product.description?.toLowerCase() || "";

                    return (
                        name.includes(normalizedQuery) ||
                        category.includes(normalizedQuery) ||
                        description.includes(normalizedQuery)
                    );
                }
            );

            setProducts(filteredProducts);
        } catch (error) {
            setError(
                error.message || "Failed to search products."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialQuery) {
            searchProducts(initialQuery);
        }
        // Search only when the URL query changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialQuery]);

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mx-auto max-w-3xl">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Search Products
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Find products available from your nearby store.
                    </p>

                    <div className="mt-6">
                        <SearchBar
                            value={query}
                            onChange={setQuery}
                            onSubmit={searchProducts}
                            loading={loading}
                        />
                    </div>
                </div>

                {error && (
                    <div className="mx-auto mt-6 max-w-3xl">
                        <ErrorMessage
                            message={error}
                            onClose={() => setError("")}
                        />
                    </div>
                )}

                {query && !loading && !error && (
                    <div className="mt-10">
                        <div className="mb-5">
                            <h2 className="text-xl font-bold text-gray-900">
                                Search results
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                {products.length}{" "}
                                {products.length === 1
                                    ? "product"
                                    : "products"}{" "}
                                found for "{query}"
                            </p>
                        </div>

                        <ProductGrid
                            products={products}
                            emptyTitle="No products found"
                            emptyMessage={`No products matched "${query}". Try another search.`}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}

export default Search;