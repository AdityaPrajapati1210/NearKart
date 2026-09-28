function Loader({ size = "md", text = "Loading..." }) {
    const sizeClasses = {
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-3",
        lg: "h-12 w-12 border-4"
    };

    return (
        <div
            className="flex flex-col items-center justify-center gap-3"
            role="status"
            aria-live="polite"
        >
            <div
                className={`${sizeClasses[size] || sizeClasses.md} animate-spin rounded-full border-gray-200 border-t-blue-600`}
            />

            {text && (
                <p className="text-sm text-gray-500">
                    {text}
                </p>
            )}

            <span className="sr-only">
                {text}
            </span>
        </div>
    );
}

export default Loader;