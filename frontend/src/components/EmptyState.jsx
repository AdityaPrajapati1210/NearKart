function EmptyState({
    title = "Nothing here yet",
    message = "",
    action = null
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                📦
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
                {title}
            </h2>

            {message && (
                <p className="mt-2 max-w-md text-sm text-gray-500">
                    {message}
                </p>
            )}

            {action && (
                <div className="mt-5">
                    {action}
                </div>
            )}
        </div>
    );
}

export default EmptyState;