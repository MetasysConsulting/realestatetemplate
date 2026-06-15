/**
 * REOVANA site footer — multi-column layout with legal disclaimers.
 */

const REOVANA_LOGO = "/images/reovana/logo.png";
const YEAR = new Date().getFullYear();

function footerLinkList(items) {
  return items
    .map(([href, label]) => `<li><a href="${href}">${label}</a></li>`)
    .join("\n                            ");
}

export function buildReovanaFooter() {
  return `<footer id="footer" class="reovana-footer">
            <div class="tf-container reovana-footer__inner">
                <div class="reovana-footer__main">
                    <div class="reovana-footer__brand">
                        <a href="/" class="reovana-footer__logo-link">
                            <img id="logo_footer" class="reovana-logo reovana-footer-logo" src="${REOVANA_LOGO}" alt="REOVANA">
                        </a>
                        <ul class="reovana-footer__highlights">
                            <li>
                                <span class="reovana-footer__highlight-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/></svg>
                                </span>
                                <span><strong>Trusted Lenders</strong> — Vetted lenders you can trust.</span>
                            </li>
                            <li>
                                <span class="reovana-footer__highlight-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z"/></svg>
                                </span>
                                <span><strong>Fast Closings</strong> — Close in as little as 5 days.</span>
                            </li>
                            <li>
                                <span class="reovana-footer__highlight-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>
                                </span>
                                <span><strong>Secure Process</strong> — Safe, secure, and confidential.</span>
                            </li>
                        </ul>
                    </div>

                    <div class="reovana-footer__col">
                        <h6>Properties</h6>
                        <ul>
                            ${footerLinkList([
                              ["/properties/foreclosure", "Foreclosures"],
                              ["/properties/pre-foreclosure", "Pre-Foreclosures"],
                              ["/properties/bank-owned", "REO Properties"],
                              ["/auctions", "Auction Homes"],
                              ["/properties/bank-owned", "Bank-Owned Properties"],
                              ["/properties/foreclosure", "Distressed Properties"],
                              ["/properties/off-market", "Off-Market Deals"],
                            ])}
                        </ul>
                    </div>

                    <div class="reovana-footer__col">
                        <h6>Financing</h6>
                        <ul>
                            ${footerLinkList([
                              ["/loans", "Hard Money Loans"],
                              ["/loans", "Investor Loans"],
                              ["/", "Residential Loan Calculator"],
                              ["/loans", "Commercial Loan Calculator"],
                              ["/loans#solutions", "Fix &amp; Flip Loans"],
                              ["/loans#solutions", "Bridge Loans"],
                              ["/loans#solutions", "Construction Loans"],
                            ])}
                        </ul>
                    </div>

                    <div class="reovana-footer__col">
                        <h6>Resources</h6>
                        <ul>
                            ${footerLinkList([
                              ["/learn/guides/beginners-guide", "Blog"],
                              ["/learn/overview", "Investor Guides"],
                              ["/learn/faq", "FAQs"],
                              ["/blog/grid", "Market News"],
                              ["/learn/glossary", "Glossary"],
                              ["/learn/help-center", "Webinars"],
                            ])}
                        </ul>
                    </div>

                    <div class="reovana-footer__col">
                        <h6>Company</h6>
                        <ul>
                            ${footerLinkList([
                              ["/contact", "About Us"],
                              ["/learn/overview", "How It Works"],
                              ["/contact", "Contact Us"],
                              ["#", "Privacy Policy"],
                              ["#", "Terms of Use"],
                              ["/career", "Careers"],
                            ])}
                        </ul>
                    </div>

                    <div class="reovana-footer__newsletter">
                        <h6>Stay Updated</h6>
                        <p>Get the latest distressed property listings, investor opportunities, and market updates.</p>
                        <form class="reovana-footer__subscribe" action="#" method="post" onsubmit="return false;">
                            <input type="email" name="email" placeholder="Enter your email" aria-label="Email address" required>
                            <button type="submit" class="reovana-footer__subscribe-btn">Subscribe</button>
                        </form>
                    </div>
                </div>

                <div class="reovana-footer__divider" aria-hidden="true"></div>

                <div class="reovana-footer__legal-row">
                    <div class="reovana-footer__legal-block">
                        <h6>Contact Us</h6>
                        <ul class="reovana-footer__contact-list">
                            <li>
                                <i class="icon-phone-2" aria-hidden="true"></i>
                                <a href="tel:+18881234567">(888) 123-4567</a>
                            </li>
                            <li>
                                <i class="icon-letter-2" aria-hidden="true"></i>
                                <a href="mailto:info@reovana.com">info@reovana.com</a>
                            </li>
                            <li>
                                <i class="icon-location" aria-hidden="true"></i>
                                <span>Miami, Florida</span>
                            </li>
                        </ul>
                    </div>

                    <div class="reovana-footer__legal-block">
                        <h6>Follow Us</h6>
                        <ul class="reovana-footer__social">
                            <li><a href="#" aria-label="Facebook"><i class="icon-fb"></i></a></li>
                            <li><a href="#" aria-label="Instagram"><i class="icon-ins"></i></a></li>
                            <li><a href="#" aria-label="LinkedIn"><i class="icon-linked"></i></a></li>
                            <li><a href="#" aria-label="YouTube"><svg class="reovana-footer__yt-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23 7.2a3 3 0 00-2.12-2.14C19.28 4.6 12 4.6 12 4.6s-7.28 0-8.88.46A3 3 0 001 7.2 31.87 31.87 0 000 12a31.87 31.87 0 001 4.8 3 3 0 002.12 2.14c1.6.46 8.88.46 8.88.46s7.28 0 8.88-.46A3 3 0 0023 16.8 31.87 31.87 0 0024 12a31.87 31.87 0 00-1-4.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg></a></li>
                            <li><a href="#" aria-label="X"><i class="icon-X"></i></a></li>
                        </ul>
                    </div>

                    <div class="reovana-footer__legal-block">
                        <h6>Legal</h6>
                        <p>REOVANA.com is not a lender. We connect borrowers with third-party lending partners. Loan approvals are subject to lender qualifications and underwriting requirements.</p>
                    </div>

                    <div class="reovana-footer__legal-block">
                        <h6>Disclaimer</h6>
                        <p>Property information is believed to be accurate but is not guaranteed. Users should independently verify all information before making investment decisions.</p>
                    </div>

                    <div class="reovana-footer__legal-block reovana-footer__fair-housing">
                        <div class="reovana-footer__eho" aria-hidden="true">
                            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 20L24 8l16 12v18H8V20z" stroke="currentColor" stroke-width="2"/>
                                <path d="M18 28h12M24 22v12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <p>REOVANA.com supports the principles of the Fair Housing Act and Equal Opportunity Housing.</p>
                    </div>
                </div>

                <div class="reovana-footer__bar">
                    <span>&copy; ${YEAR} REOVANA.com. All Rights Reserved.</span>
                    <span class="reovana-footer__bar-sep" aria-hidden="true">|</span>
                    <span>For Investors, Realtors &amp; Wholesalers</span>
                    <span class="reovana-footer__bar-sep" aria-hidden="true">|</span>
                    <span>Powered by AI Property Search</span>
                </div>
            </div>
        </footer>`;
}

export function replaceSiteFooter(html) {
  return html.replace(/<footer[\s\S]*?<\/footer>/i, buildReovanaFooter());
}
