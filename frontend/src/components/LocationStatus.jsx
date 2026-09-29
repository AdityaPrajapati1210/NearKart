import { useCallback, useEffect, useState } from "react";

import {
    getCurrentLocation,
    getBrowserLocation,
    saveCurrentLocation
} from "../services/location";

import Loader from "./Loader";
import ErrorMessage from "./ErrorMessage";
import LoadingButton from "./LoadingButton";

function LocationStatus() {
    const [location, setLocation] = useState(null);

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadLocation = useCallback(async () => {
        try {
            setError("");

            const response = await getCurrentLocation();

            setLocation(response.location || null);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLocation();
    }, [loadLocation]);

    const handleRefreshLocation = async () => {
        try {
            setError("");
            setSuccess("");
            setUpdating(true);

            const browserLocation =
                await getBrowserLocation();

            await saveCurrentLocation({
                latitude: browserLocation.latitude,
                longitude: browserLocation.longitude
            });

            setLocation({
                latitude: browserLocation.latitude,
                longitude: browserLocation.longitude,
                updatedAt: new Date().toISOString()
            });

            setSuccess("Location updated successfully.");
        } catch (error) {
            setError(error.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <Loader
                    size="sm"
                    text="Loading location..."
                />
            </div>
        );
    }

    return (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-xl"
                            aria-hidden="true"
                        >
                            📍
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Current Location
                            </h2>

                            <p className="text-sm text-gray-500">
                                Used to check delivery availability.
                            </p>
                        </div>
                    </div>

                    {location ? (
                        <div className="mt-5 rounded-xl bg-gray-50 p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        Latitude
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {Number(
                                            location.latitude
                                        ).toFixed(6)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        Longitude
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {Number(
                                            location.longitude
                                        ).toFixed(6)}
                                    </p>
                                </div>
                            </div>

                            {location.updatedAt && (
                                <p className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-400">
                                    Last updated:{" "}
                                    {new Date(
                                        location.updatedAt
                                    ).toLocaleString("en-IN")}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                            <p className="text-sm font-medium text-yellow-700">
                                Location is not available.
                            </p>

                            <p className="mt-1 text-xs text-yellow-600">
                                Enable location to check whether
                                delivery is available at your
                                location.
                            </p>
                        </div>
                    )}
                </div>

                <LoadingButton
                    type="button"
                    loading={updating}
                    loadingText="Updating..."
                    onClick={handleRefreshLocation}
                    className="shrink-0 bg-blue-600 text-white hover:bg-blue-700"
                >
                    Refresh Location
                </LoadingButton>
            </div>

            {error && (
                <div className="mt-5">
                    <ErrorMessage
                        message={error}
                        onClose={() => setError("")}
                    />
                </div>
            )}

            {success && (
                <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                </div>
            )}
        </section>
    );
}

export default LocationStatus;