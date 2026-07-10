"use client";

import { REOVANA_BRAND } from "@/lib/admin/reovana-admin-data";

const Footer = () => {
  return (
    <footer className=" px-5 pt-2">
      <div className=" py-3 border-t border-x px-5 rounded-t-2xl ">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="text-center md:text-left">
            <p className="text-white/50 text-sm">
              © {(new Date().getFullYear())} {REOVANA_BRAND.name}. {REOVANA_BRAND.tagline}.
            </p>
          </div>

          <div className="text-center md:text-right">
            <p className="text-white/50 text-sm">
              <a
                className="text-white/75 hover:text-primary font-medium transition-colors"
                href={REOVANA_BRAND.localPublicSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open public marketplace
              </a>
              {" · "}
              <a
                className="text-white/75 hover:text-primary font-medium transition-colors"
                href="https://mantrakshdevs.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mantraksh Devs
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer;
