import { Link } from "react-router-dom";

function ProductCard({ product }) {
    if (!product) {
        return null;
    }

    const finalPrice =
        product.offerPrice > 0
            ? product.offerPrice
            : product.price;

    const hasDiscount =
        product.offerPrice > 0 &&
        product.offerPrice < product.price;

    const isOutOfStock =
        product.stock <= 0 ||
        product.isAvailable === false;

    return (
        <article className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            {/* Image */}
            <Link
                to={`/products/${product._id}`}
                className="block"
                aria-label={`View ${product.name}`}
            >
                <div className="flex h-52 items-center justify-center overflow-hidden bg-gray-100">
                    {product.image?.url ? (
                        <img
                            src={product.image.url}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        />
                    ) : (
                        <span
                            className="text-5xl"
                            aria-hidden="true"
                        >
                            🛍️
                        </span>
                    )}
                </div>
            </Link>

            {/* Content */}
            <div className="p-5">
                {product.category && (
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                        {product.category}
                    </p>
                )}

                <Link
                    to={`/products/${product._id}`}
                    className="mt-2 block"
                >
                    <h2 className="line-clamp-2 text-lg font-semibold text-gray-900 transition hover:text-blue-600">
                        {product.name}
                    </h2>
                </Link>

                {/* Price */}
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

                {/* Availability */}
                <p
                    className={`mt-2 text-sm ${
                        isOutOfStock
                            ? "text-red-500"
                            : "text-gray-500"
                    }`}
                >
                    {isOutOfStock
                        ? "Out of stock"
                        : `${product.stock} available`}
                </p>

                <Link
                    to={`/products/${product._id}`}
                    className={`mt-5 block rounded-lg px-4 py-3 text-center text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isOutOfStock
                            ? "cursor-not-allowed bg-gray-100 text-gray-400"
                            : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                    }`}
                    onClick={(event) => {
                        if (isOutOfStock) {
                            event.preventDefault();
                        }
                    }}
                    aria-disabled={isOutOfStock}
                >
                    {isOutOfStock
                        ? "Out of Stock"
                        : "View Product"}
                </Link>
            </div>
        </article>
    );
}

export default ProductCard;