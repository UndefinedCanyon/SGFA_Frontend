import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

function Layout() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="min-h-screen flex flex-col">
            <a
                href="#contenido"
                className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow"
            >
                Saltar al contenido
            </a>
            <Header />
            <main id="contenido" className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default Layout;