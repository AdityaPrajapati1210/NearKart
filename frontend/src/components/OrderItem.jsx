function OrderItem({ item }) {
    const product = item?.product || item;

    if (!product) {
        return null;
    }

    const price =
        item?.price ??
        item?.unitPrice ??
        (product.offerPrice > 0
            ? product.offerPrice
            : product.price) ??
        0;

    const quantity = item?.quantity || 1;

    return (
        <div className="flex gap-4 py-5 first:pt-0 last:pb-0">
            {/* Product Image */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                {product.image?.url ? (
                    <img
                        src={product.image.url}
                        alt={product.name || "Product"}
                        loading="lazy"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span
                        className="text-2xl"
                        aria-hidden="true"
                    >
                        🛍️
                    </span>
                )}
            </div>

            {/* Product Information */}
            <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 font-semibold text-gray-900">
                    {product.name || "Product"}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                    ₹{price} × {quantity}
                </p>
            </div>

            {/* Item Total */}
            <p className="shrink-0 font-semibold text-gray-900">
                ₹{price * quantity}
            </p>
        </div>
    );
}

export default OrderItem;