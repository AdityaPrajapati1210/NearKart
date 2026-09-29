function CartItem({
    item,
    updating = false,
    onQuantityChange,
    onRemove
}) {
    const product = item?.product || item;

    if (!product) {
        return null;
    }

    const price =
        product.offerPrice > 0
            ? product.offerPrice
            : product.price;

    const quantity = item.quantity || 1;

    const itemTotal = price * quantity;

    const handleDecrease = () => {
        if (quantity <= 1 || updating) {
            return;
        }

        onQuantityChange?.(
            product._id,
            quantity - 1
        );
    };

    const handleIncrease = () => {
        if (updating) {
            return;
        }

        onQuantityChange?.(
            product._id,
            quantity + 1
        );
    };

    return (
        <article className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex gap-4">
                {/* Product Image */}
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                    {product.image?.url ? (
                        <img
                            src={product.image.url}
                            alt={product.name || "Product"}
                            loading="lazy"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span
                            className="text-3xl"
                            aria-hidden="true"
                        >
                            🛍️
                        </span>
                    )}
                </div>

                {/* Product Details */}
                <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 font-semibold text-gray-900">
                        {product.name || "Product"}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        ₹{price} each
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        {/* Quantity */}
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={handleDecrease}
                                disabled={
                                    updating ||
                                    quantity <= 1
                                }
                                aria-label={`Decrease quantity of ${product.name}`}
                                className="rounded-l-lg border border-gray-300 px-3 py-2 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                −
                            </button>

                            <span
                                className="min-w-12 border-y border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-900"
                                aria-label={`Quantity ${quantity}`}
                            >
                                {quantity}
                            </span>

                            <button
                                type="button"
                                onClick={handleIncrease}
                                disabled={updating}
                                aria-label={`Increase quantity of ${product.name}`}
                                className="rounded-r-lg border border-gray-300 px-3 py-2 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                +
                            </button>
                        </div>

                        {/* Total */}
                        <p className="font-bold text-gray-900">
                            ₹{itemTotal}
                        </p>
                    </div>

                    {/* Remove */}
                    <button
                        type="button"
                        onClick={() =>
                            onRemove?.(product._id)
                        }
                        disabled={updating}
                        className="mt-3 text-sm font-medium text-red-500 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {updating
                            ? "Updating..."
                            : "Remove"}
                    </button>
                </div>
            </div>
        </article>
    );
}

export default CartItem;