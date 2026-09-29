import { Link } from "react-router-dom";

function Home() {
    return (
        <main className="min-h-[calc(100vh-4rem)] bg-gray-50">
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
                                to="/products"
                                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Browse Products
                            </Link>

                            <Link
                                to="/location"
                                className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                            >
                                Check Delivery
                            </Link>
                        </div>

                        <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-gray-200 pt-6">
                            <div>
                                <p className="text-xl font-bold text-gray-900">
                                    Fast
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    Local delivery
                                </p>
                            </div>

                            <div>
                                <p className="text-xl font-bold text-gray-900">
                                    Nearby
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    Local store
                                </p>
                            </div>

                            <div>
                                <p className="text-xl font-bold text-gray-900">
                                    Easy
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    Simple ordering
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Visual */}
                    <div className="hidden justify-center lg:flex">
                        <div className="relative flex h-96 w-96 items-center justify-center overflow-hidden rounded-3xl bg-blue-600 shadow-xl">
                            <div
                                className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500"
                                aria-hidden="true"
                            />

                            <div
                                className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-blue-700"
                                aria-hidden="true"
                            />

                            <div className="relative text-center text-white">
                                <div className="text-7xl" aria-hidden="true">
                                    🛍️
                                </div>

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