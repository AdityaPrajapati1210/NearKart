import { useEffect, useState } from "react";

function SearchBar({
    value = "",
    onChange,
    onSubmit,
    placeholder = "Search products...",
    loading = false
}) {
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleSubmit = (event) => {
        event.preventDefault();

        const trimmedValue = inputValue.trim();

        onSubmit?.(trimmedValue);
    };

    const handleChange = (event) => {
        const newValue = event.target.value;

        setInputValue(newValue);
        onChange?.(newValue);
    };

    const handleClear = () => {
        setInputValue("");
        onChange?.("");
        onSubmit?.("");
    };

    return (
        <form
            onSubmit={handleSubmit}
            role="search"
            className="w-full"
        >
            <div className="flex w-full items-center overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <div
                    className="pl-4 text-gray-400"
                    aria-hidden="true"
                >
                    🔍
                </div>

                <input
                    type="search"
                    value={inputValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={loading}
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                />

                {inputValue && !loading && (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="Clear search"
                        className="px-3 text-lg text-gray-400 transition hover:text-gray-700"
                    >
                        ×
                    </button>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="m-1 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Searching..." : "Search"}
                </button>
            </div>
        </form>
    );
}

export default SearchBar;