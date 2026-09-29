function ProductQuantity({
    value,
    min = 1,
    max = Infinity,
    onChange,
    disabled = false,
    label = "Quantity"
}) {
    const updateValue = (nextValue) => {
        const numericValue = Number(nextValue);

        if (!Number.isFinite(numericValue)) {
            return;
        }

        const safeValue = Math.min(
            Math.max(numericValue, min),
            max
        );

        onChange?.(safeValue);
    };

    const canDecrease =
        !disabled && value > min;

    const canIncrease =
        !disabled && value < max;

    return (
        <div>
            <label
                htmlFor="product-quantity"
                className="mb-2 block text-sm font-medium text-gray-700"
            >
                {label}
            </label>

            <div className="flex w-fit items-center">
                <button
                    type="button"
                    onClick={() =>
                        updateValue(value - 1)
                    }
                    disabled={!canDecrease}
                    aria-label="Decrease quantity"
                    className="rounded-l-lg border border-gray-300 px-4 py-3 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    −
                </button>

                <input
                    id="product-quantity"
                    type="number"
                    min={min}
                    max={max === Infinity ? undefined : max}
                    value={value}
                    onChange={(event) =>
                        updateValue(event.target.value)
                    }
                    disabled={disabled}
                    inputMode="numeric"
                    aria-label={label}
                    className="w-20 border-y border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-900 outline-none focus:border-blue-500"
                />

                <button
                    type="button"
                    onClick={() =>
                        updateValue(value + 1)
                    }
                    disabled={!canIncrease}
                    aria-label="Increase quantity"
                    className="rounded-r-lg border border-gray-300 px-4 py-3 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    +
                </button>
            </div>
        </div>
    );
}

export default ProductQuantity;