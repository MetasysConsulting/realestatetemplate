import { TemplateScripts } from "@/components/template/TemplateScripts";
import { WireTemplateAuth } from "@/components/auth/WireTemplateAuth";
import { SiteBodyClass } from "@/components/SiteBodyClass";
import "../globals.css";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link rel="stylesheet" href="/css/bootstrap.css" />
      <link rel="stylesheet" href="/css/animate.min.css" />
      <link rel="stylesheet" href="/css/sib-styles.css" />
      <link rel="stylesheet" href="/css/swiper-bundle.min.css" />
      <link rel="stylesheet" href="/css/styles.css" />
      <link rel="stylesheet" href="/icons/icomoon/style.css" />
      <link rel="shortcut icon" href="/images/reovana/logo.png" />
      <SiteBodyClass />
      {children}
      <WireTemplateAuth />
      <TemplateScripts />
    </>
  );
}
