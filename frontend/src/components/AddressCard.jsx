function AddressCard({
    address,
    selected = false,
    selectable = false,
    onSelect,
    onEdit,
    onDelete,
    deleting = false
}) {
    if (!address) {
        return null;
    }

    return (
        <article
            className={`rounded-2xl bg-white p-5 shadow-sm transition ${
                selected
                    ? "border-2 border-blue-500 bg-blue-50/30"
                    : "border border-gray-100"
            }`}
        >
            <div className="flex items-start gap-4">
                {selectable && (
                    <input
                        type="radio"
                        name="deliveryAddress"
                        value={address._id}
                        checked={selected}
                        onChange={() =>
                            onSelect?.(address._id)
                        }
                        className="mt-1 h-4 w-4 accent-blue-600"
                        aria-label={`Select ${address.label} address`}
                    />
                )}

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold capitalize text-gray-900">
                            {address.label || "Address"}
                        </h3>

                        {address.isDefault && (
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                Default
                            </span>
                        )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        {address.address}
                    </p>

                    {(address.latitude !== undefined ||
                        address.longitude !== undefined) && (
                        <p className="mt-2 text-xs text-gray-400">
                            Location saved
                        </p>
                    )}
                </div>

                <span
                    className="text-2xl"
                    aria-hidden="true"
                >
                    📍
                </span>
            </div>

            {(onEdit || onDelete) && (
                <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(address)}
                            disabled={deleting}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Edit
                        </button>
                    )}

                    {onDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete(address._id)}
                            disabled={deleting}
                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {deleting
                                ? "Deleting..."
                                : "Delete"}
                        </button>
                    )}
                </div>
            )}
        </article>
    );
}

export default AddressCard;