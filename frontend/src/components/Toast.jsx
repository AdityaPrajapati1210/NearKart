function Toast({
    message,
    type = "success",
    onClose
}) {
    if (!message) {
        return null;
    }

    const styles = {
        success: {
            container:
                "border-green-200 bg-green-50 text-green-700",
            icon: "✓"
        },

        error: {
            container:
                "border-red-200 bg-red-50 text-red-700",
            icon: "!"
        },

        info: {
            container:
                "border-blue-200 bg-blue-50 text-blue-700",
            icon: "i"
        },

        warning: {
            container:
                "border-yellow-200 bg-yellow-50 text-yellow-700",
            icon: "!"
        }
    };

    const currentStyle =
        styles[type] || styles.info;

    return (
        <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm ${currentStyle.container}`}
            role="alert"
            aria-live="polite"
        >
            <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold"
                aria-hidden="true"
            >
                {currentStyle.icon}
            </span>

            <p className="flex-1 text-sm font-medium">
                {message}
            </p>

            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close notification"
                    className="shrink-0 text-lg leading-none opacity-60 transition hover:opacity-100"
                >
                    ×
                </button>
            )}
        </div>
    );
}

export default Toast;