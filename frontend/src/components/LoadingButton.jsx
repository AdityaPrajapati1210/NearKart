function LoadingButton({
    children,
    loading = false,
    loadingText = "Loading...",
    type = "button",
    disabled = false,
    onClick,
    className = "",
    ...props
}) {
    const isDisabled = loading || disabled;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            aria-busy={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
            {...props}
        >
            {loading && (
                <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                />
            )}

            <span>
                {loading ? loadingText : children}
            </span>
        </button>
    );
}

export default LoadingButton;