import { useState } from "react";

import {
    getBrowserLocation,
    saveCurrentLocation
} from "../services/location";

import LoadingButton from "./LoadingButton";
import ErrorMessage from "./ErrorMessage";

function LocationPermission({
    onSuccess,
    title = "Enable Location",
    description = "We need your location to check delivery availability."
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleEnableLocation = async () => {
        try {
            setLoading(true);
            setError("");

            const location = await getBrowserLocation();

            await saveCurrentLocation({
                latitude: location.latitude,
                longitude: location.longitude
            });

            onSuccess?.(location);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
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
                        {description}
                    </p>

                    {error && (
                        <div className="mt-4">
                            <ErrorMessage
                                message={error}
                                onClose={() => setError("")}
                            />
                        </div>
                    )}

                    <LoadingButton
                        type="button"
                        loading={loading}
                        loadingText="Getting location..."
                        onClick={handleEnableLocation}
                        className="mt-5 bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Enable Location
                    </LoadingButton>
                </div>
            </div>
        </section>
    );
}

export default LocationPermission;