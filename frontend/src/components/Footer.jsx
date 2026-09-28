function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">

                    <div>
                        <h2 className="text-lg font-bold text-blue-600">
                            NearKart
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Shop nearby. Get it fast.
                        </p>
                    </div>

                    <p className="text-sm text-gray-500">
                        © {new Date().getFullYear()} NearKart. All rights reserved.
                    </p>

                </div>

            </div>
        </footer>
    );
}

export default Footer;