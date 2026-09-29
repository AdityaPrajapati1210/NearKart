import { useEffect, useState } from "react";

import LocationStatus from "../components/LocationStatus";
import LocationPermission from "../components/LocationPermission";
import Loader from "../components/Loader";

import { getCurrentLocation } from "../services/location";

function Location() {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadLocation = async () => {
        try {
            const response = await getCurrentLocation();

            setLocation(response.location || null);
        } catch {
            setLocation(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLocation();
    }, []);

    if (loading) {
        return (
            <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4">
                <Loader text="Loading location..." />
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Delivery Location
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                    Set your current location to check NearKart
                    delivery availability.
                </p>
            </div>

            {location ? (
                <LocationStatus />
            ) : (
                <LocationPermission
                    onSuccess={(newLocation) =>
                        setLocation(newLocation)
                    }
                />
            )}
        </main>
    );
}

export default Location;