function CategoryFilter({
    categories = [],
    value = "",
    onChange
}) {
    if (!categories.length) {
        return null;
    }

    return (
        <div className="flex w-full gap-2 overflow-x-auto pb-1">
            <button
                type="button"
                onClick={() => onChange?.("")}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    value === ""
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
                All
            </button>

            {categories.map((category) => (
                <button
                    key={category}
                    type="button"
                    onClick={() => onChange?.(category)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                        value === category
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    {category}
                </button>
            ))}
        </div>
    );
}

export default CategoryFilter;