import { Link } from "react-router-dom";

function Home() {
    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50">
            {/* Hero Section */}
            <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid w-full items-center gap-12 lg:grid-cols-2">

                    {/* Content */}
                    <div>
                        <span className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-600">
                            Fast Local Delivery
                        </span>

                        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                            Your nearby store,
                            <span className="block text-blue-600">
                                delivered to you.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
                            Order everyday products from your nearby store
                            and get them delivered quickly to your location.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link
                                to="/register"
                                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Start Shopping
                            </Link>

                            <Link
                                to="/login"
                                className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                            >
                                Login
                            </Link>
                        </div>
                    </div>

                    {/* Visual */}
                    <div className="hidden lg:flex justify-center">
                        <div className="flex h-96 w-96 items-center justify-center rounded-3xl bg-blue-600 shadow-xl">
                            <div className="text-center text-white">
                                <div className="text-7xl">🛍️</div>

                                <h2 className="mt-6 text-3xl font-bold">
                                    NearKart
                                </h2>

                                <p className="mt-2 text-blue-100">
                                    Shop nearby. Get it fast.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </main>
    );
}

export default Home;