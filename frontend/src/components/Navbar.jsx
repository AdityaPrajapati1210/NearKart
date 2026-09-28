import { Link } from "react-router-dom";

function Navbar() {
    return (
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                {/* Logo */}
                <Link
                    to="/"
                    className="text-2xl font-bold text-blue-600"
                >
                    NearKart
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-3 sm:gap-5">

                    <Link
                        to="/"
                        className="text-sm font-medium text-gray-700 transition hover:text-blue-600"
                    >
                        Home
                    </Link>

                    <Link
                        to="/login"
                        className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-blue-600"
                    >
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Register
                    </Link>

                </nav>
            </div>
        </header>
    );
}

export default Navbar;