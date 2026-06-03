import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

type SiteLayoutProps = {
  children: React.ReactNode;
};

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div id="wrapper">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
