"use client";

import Script from "next/script";

const SCRIPTS = [
  "/js/jquery.min.js",
  "/js/bootstrap.min.js",
  "/js/lazysize.min.js",
  "/js/rangle-slider.js",
  "/js/jquery.nice-select.min.js",
  "/js/swiper-bundle.min.js",
  "/js/swiper.js",
  "/js/simpleParallaxVanilla.umd.js",
  "/js/wow.min.js",
  "/js/Splitetext.js",
  "/js/ScrollTrigger.min.js",
  "/js/gsap.min.js",
  "/js/infinityslide.js",
  "/js/SmoothScroll.js",
  "/js/main.js",
] as const;

export function TemplateScripts() {
  return (
    <>
      {SCRIPTS.map((src) => (
        <Script key={src} src={src} strategy="afterInteractive" />
      ))}
    </>
  );
}
