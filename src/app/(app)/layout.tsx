import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-panel focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="mx-auto max-w-[1280px] px-4 py-6">
        {children}
      </main>
      <Footer />
    </>
  );
}
