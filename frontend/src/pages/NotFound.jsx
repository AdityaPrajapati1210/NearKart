import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-8xl font-bold text-gray-800">404</h1>

            <h2 className="text-2xl font-semibold mt-4">
                Page Not Found
            </h2>

            <p className="text-gray-500 mt-2">
                Sorry, the page you are looking for does not exist.
            </p>

            <Link
                to="/"
                className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
                Go to Home
            </Link>
        </div>
    );
};

export default NotFound;