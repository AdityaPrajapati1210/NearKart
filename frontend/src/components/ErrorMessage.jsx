function ErrorMessage({ message, onClose }) {
    if (!message) {
        return null;
    }

    return (
        <div
            role="alert"
            className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
            <p>{message}</p>

            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close error message"
                    className="shrink-0 font-semibold text-red-500 transition hover:text-red-700"
                >
                    ×
                </button>
            )}
        </div>
    );
}

export default ErrorMessage;