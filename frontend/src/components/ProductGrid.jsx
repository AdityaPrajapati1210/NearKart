import ProductCard from "./ProductCard";
import Loader from "./Loader";
import EmptyState from "./EmptyState";

function ProductGrid({
    products = [],
    loading = false,
    emptyTitle = "No products found",
    emptyMessage = "There are no products available right now.",
    onProductClick
}) {
    if (loading) {
        return (
            <div className="flex min-h-40 items-center justify-center">
                <Loader text="Loading products..." />
            </div>
        );
    }

    if (!products.length) {
        return (
            <EmptyState
                title={emptyTitle}
                message={emptyMessage}
            />
        );
    }

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
                <ProductCard
                    key={product._id}
                    product={product}
                    onClick={() => onProductClick?.(product)}
                />
            ))}
        </div>
    );
}

export default ProductGrid;