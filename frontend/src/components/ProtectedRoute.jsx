import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute() {
    const location = useLocation();

    const { isAuthenticated, loading } = useSelector(
        (state) => state.auth
    );

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;