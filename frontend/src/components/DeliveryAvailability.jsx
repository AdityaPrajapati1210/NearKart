import { useState } from "react";

import {
    getBrowserLocation,
    saveCurrentLocation
} from "../services/location";

import LoadingButton from "./LoadingButton";
import ErrorMessage from "./ErrorMessage";

function DeliveryAvailability({
    onLocationUpdated,
    title = "Check Delivery Availability"
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleCheckLocation = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess(false);

            const location = await getBrowserLocation();

            await saveCurrentLocation({
                latitude: location.latitude,
                longitude: location.longitude
            });

            setSuccess(true);

            onLocationUpdated?.(location);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl"
                    aria-hidden="true"
                >
                    📍
                </div>

                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-gray-900">
                        {title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        Allow location access so NearKart can check
                        whether your current location is within the
                        delivery area.
                    </p>

                    {error && (
                        <div className="mt-4">
                            <ErrorMessage
                                message={error}
                                onClose={() => setError("")}
                            />
                        </div>
                    )}

                    {success && (
                        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                            <p className="text-sm font-medium text-green-700">
                                Location updated successfully.
                            </p>

                            <p className="mt-1 text-xs text-green-600">
                                Your delivery location is ready to be
                                checked.
                            </p>
                        </div>
                    )}

                    {!success && (
                        <LoadingButton
                            type="button"
                            loading={loading}
                            loadingText="Getting location..."
                            onClick={handleCheckLocation}
                            className="mt-5 bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Check My Location
                        </LoadingButton>
                    )}
                </div>
            </div>
        </section>
    );
}

export default DeliveryAvailability;