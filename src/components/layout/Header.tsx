"use client";

import Link from "next/link";
import { useState } from "react";
import { mainNavigation } from "@/lib/navigation";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header id="header-main" className="header header-sticky">
        <div className="header-inner">
          <div className="tf-container xl">
            <div className="row">
              <div className="col-12">
                <div className="header-inner-wrap">
                  <div className="header-logo">
                    <Link href="/" className="site-logo">
                      <img
                        className="logo_header"
                        alt="Proty Real Estate"
                        src="/images/logo/logo@2x.png"
                      />
                    </Link>
                  </div>
                  <nav className="main-menu">
                    <ul className="navigation">
                      {mainNavigation.map((item) => (
                        <li
                          key={item.label}
                          className={
                            item.children?.length ? "has-child" : undefined
                          }
                        >
                          <Link href={item.href}>{item.label}</Link>
                          {item.children && (
                            <ul className="submenu">
                              {item.children.map((child) => (
                                <li key={child.href}>
                                  <Link href={child.href}>{child.label}</Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="header-right">
                    <div className="phone-number">
                      <div className="icons">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1.875 5.625C1.875 12.5283 7.47167 18.125 14.375 18.125H16.25C16.7473 18.125 17.2242 17.9275 17.5758 17.5758C17.9275 17.2242 18.125 16.7473 18.125 16.25V15.1067C18.125 14.6767 17.8325 14.3017 17.415 14.1975L13.7292 13.2758C13.3625 13.1842 12.9775 13.3217 12.7517 13.6233L11.9433 14.7008C11.7083 15.0142 11.3025 15.1525 10.935 15.0175C9.57073 14.5159 8.33179 13.7238 7.30398 12.696C6.27618 11.6682 5.48406 10.4293 4.9825 9.065C4.8475 8.6975 4.98583 8.29167 5.29917 8.05667L6.37667 7.24833C6.67917 7.0225 6.81583 6.63667 6.72417 6.27083L5.8025 2.585C5.75178 2.38225 5.63477 2.20225 5.47004 2.07361C5.30532 1.94498 5.10234 1.87507 4.89333 1.875H3.75C3.25272 1.875 2.77581 2.07254 2.42417 2.42417C2.07254 2.77581 1.875 3.25272 1.875 3.75V5.625Z"
                            stroke="black"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <p>(808) 555-0123</p>
                    </div>
                    <div className="btn-add">
                      <Link className="tf-btn style-border pd-23" href="/contact">
                        Add property
                      </Link>
                    </div>
                    <button
                      type="button"
                      className="mobile-button"
                      aria-label="Open menu"
                      onClick={() => setMobileOpen(true)}
                    >
                      <i className="icon-menu" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`mobile-nav-wrap ${mobileOpen ? "show" : ""}`}
        style={{
          display: mobileOpen ? "block" : "none",
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.5)",
        }}
        onClick={() => setMobileOpen(false)}
        role="presentation"
      >
        <div
          className="mobile-nav"
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: "min(320px, 90vw)",
            background: "#fff",
            padding: "24px",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            style={{
              marginBottom: 16,
              border: "none",
              background: "transparent",
              fontSize: 24,
              cursor: "pointer",
            }}
            aria-label="Close menu"
          >
            ×
          </button>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {mainNavigation.map((item) => (
              <li key={item.label} style={{ marginBottom: 12 }}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{ fontWeight: 600, color: "var(--Heading)" }}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <ul style={{ paddingLeft: 16, marginTop: 8 }}>
                    {item.children.map((child) => (
                      <li key={child.href} style={{ marginBottom: 6 }}>
                        <Link
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
