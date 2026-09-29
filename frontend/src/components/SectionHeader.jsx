function SectionHeader({
    title,
    description = "",
    action = null
}) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    {title}
                </h2>

                {description && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                        {description}
                    </p>
                )}
            </div>

            {action && (
                <div className="shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}

export default SectionHeader;