import api from "./api";

/**
 * Save user's current GPS location.
 */
export const saveCurrentLocation = async ({ latitude, longitude }) => {
    return await api("/users/location", {
        method: "PATCH",
        body: JSON.stringify({
            latitude,
            longitude
        })
    });
};

/**
 * Get user's saved location.
 */
export const getCurrentLocation = async () => {
    return await api("/users/location");
};

/**
 * Get browser's current GPS location.
 *
 * This does not send anything to the backend.
 * It only reads the device location.
 */
export const getBrowserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(
                new Error(
                    "Geolocation is not supported by this browser"
                )
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                let message = "Unable to get your location";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = "Location permission was denied";
                        break;

                    case error.POSITION_UNAVAILABLE:
                        message = "Location information is unavailable";
                        break;

                    case error.TIMEOUT:
                        message = "Location request timed out";
                        break;

                    default:
                        break;
                }

                reject(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
};