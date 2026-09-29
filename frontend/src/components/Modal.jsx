import { useEffect } from "react";

function Modal({
    open,
    onClose,
    title,
    children,
    size = "md",
    closeOnOverlay = true,
    showCloseButton = true
}) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            document.body.style.overflow =
                previousOverflow;
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl"
    };

    const handleOverlayClick = (event) => {
        if (
            closeOnOverlay &&
            event.target === event.currentTarget
        ) {
            onClose?.();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8"
            role="presentation"
            onMouseDown={handleOverlayClick}
        >
            <div
                className={`relative w-full ${sizeClasses[size] || sizeClasses.md} rounded-2xl bg-white shadow-2xl`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={
                    title
                        ? "modal-title"
                        : undefined
                }
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        {title ? (
                            <h2
                                id="modal-title"
                                className="text-lg font-bold text-gray-900"
                            >
                                {title}
                            </h2>
                        ) : (
                            <span />
                        )}

                        {showCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close modal"
                                className="rounded-lg p-2 text-xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}

                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;