import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsappButton } from "@/components/site/WhatsappButton";
import { CookieBanner } from "@/components/site/CookieBanner";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsappButton />
      <CookieBanner />
    </>
  );
}
