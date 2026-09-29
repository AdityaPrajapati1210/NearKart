import { Link } from "react-router-dom";

function NotFound() {
    return (
        <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
            <div className="w-full max-w-md text-center">
                <p className="text-7xl font-extrabold tracking-tight text-blue-600">
                    404
                </p>

                <h1 className="mt-4 text-2xl font-bold text-gray-900">
                    Page Not Found
                </h1>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                    The page you are looking for does not exist or may
                    have been moved.
                </p>

                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        to="/"
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        Go to Home
                    </Link>

                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </main>
    );
}

export default NotFound;