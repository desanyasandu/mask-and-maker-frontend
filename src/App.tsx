import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { CookieNotice, Footer, Header } from "@/components/layout/Shell";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { scrollToInstant } from "@/lib/smoothScroll";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { ToastHost } from "@/components/ui/kit";
import { CreditsPage, ErrorBoundary, LegalPage, NotFound, RouteLoading } from "@/pages/System";

const Home = lazy(() => import("@/pages/Home"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const MaskDetail = lazy(() => import("@/pages/MaskDetail"));
const Artisans = lazy(() => import("@/pages/Artisans"));
const ArtisanDetail = lazy(() => import("@/pages/ArtisanDetail"));
const Heritage = lazy(() => import("@/pages/Heritage"));
const TraditionDetail = lazy(() => import("@/pages/TraditionDetail"));
const Verify = lazy(() => import("@/pages/Verify"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Account = lazy(() => import("@/pages/Account"));
const Login = lazy(() => import("@/pages/Login"));
const Portal = lazy(() => import("@/pages/Portal"));
const About = lazy(() => import("@/pages/About"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  useEffect(() => {
    scrollToInstant(0);
  }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.main
        id="main"
        key={location.pathname}
        initial={{ opacity: 0, y: reduce ? 0 : 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-[60vh]"
      >
        <ErrorBoundary resetKey={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/masks" element={<Marketplace />} />
            <Route path="/masks/:slug" element={<MaskDetail />} />
            <Route path="/artisans" element={<Artisans />} />
            <Route path="/artisans/:slug" element={<ArtisanDetail />} />
            <Route path="/heritage" element={<Heritage />} />
            <Route path="/heritage/:tradition" element={<TraditionDetail />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify/:certId" element={<Verify />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
            <Route path="/portal" element={<Portal />} />
            <Route path="/about" element={<About />} />
            <Route path="/legal/privacy" element={<LegalPage doc="privacy" />} />
            <Route path="/legal/terms" element={<LegalPage doc="terms" />} />
            <Route path="/legal/shipping" element={<LegalPage doc="shipping" />} />
            <Route path="/legal/credits" element={<CreditsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </motion.main>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SmoothScroll />
        <ScrollToTop />
        <div className="flex min-h-svh flex-col bg-canvas text-ink">
          <Header />
          <div className="flex-1">
            <Suspense fallback={<RouteLoading />}>
              <AnimatedRoutes />
            </Suspense>
          </div>
          <Footer />
        </div>
        <CartDrawer />
        <CommandPalette />
        <ToastHost />
        <CookieNotice />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
