/**
 * REOVANA site footer — dark hero background with legal disclaimers.
 */

const REOVANA_LOGO = "/images/reovana/logo.png";

export function buildReovanaFooter() {
  return `<footer id="footer" class="reovana-footer">
            <div class="reovana-footer__bg" aria-hidden="true"></div>
            <div class="tf-container reovana-footer__inner">
                <div class="reovana-footer__top">
                    <div class="reovana-footer__brand">
                        <a href="/" class="reovana-footer__logo-link">
                            <img id="logo_footer" class="reovana-logo reovana-footer-logo" src="${REOVANA_LOGO}" alt="REOVANA">
                        </a>
                        <p class="reovana-footer__tagline">Connecting real estate investors with hard money lenders nationwide.</p>
                    </div>
                    <div class="reovana-footer__contact">
                        <a href="/contact" class="reovana-footer__contact-link">Contact Us</a>
                        <a href="/learn/faq" class="reovana-footer__contact-link">FAQ</a>
                    </div>
                </div>

                <div class="reovana-footer__links">
                    <div class="reovana-footer__col">
                        <h6>Buy</h6>
                        <ul>
                            <li><a href="/properties/foreclosure">Foreclosure</a></li>
                            <li><a href="/properties/bank-owned">Bank Owned</a></li>
                            <li><a href="/properties/hud-home">HUD Home</a></li>
                            <li><a href="/auctions">Auctions</a></li>
                        </ul>
                    </div>
                    <div class="reovana-footer__col">
                        <h6>Loans</h6>
                        <ul>
                            <li><a href="/loans">Find a Loan</a></li>
                            <li><a href="/loans#solutions">Loan Solutions</a></li>
                            <li><a href="/home-loan-process">Loan Process</a></li>
                            <li><a href="/">Loan Calculator</a></li>
                        </ul>
                    </div>
                    <div class="reovana-footer__col">
                        <h6>Learn</h6>
                        <ul>
                            <li><a href="/learn/overview">Overview</a></li>
                            <li><a href="/learn/glossary">Glossary</a></li>
                            <li><a href="/learn/help-center">Help Center</a></li>
                            <li><a href="/learn/faq">FAQ</a></li>
                        </ul>
                    </div>
                    <div class="reovana-footer__col">
                        <h6>Company</h6>
                        <ul>
                            <li><a href="/contact">Contact</a></li>
                            <li><a href="/career">Careers</a></li>
                            <li><a href="/faq">Support</a></li>
                        </ul>
                    </div>
                </div>

                <div class="reovana-footer__disclaimers">
                    <div class="reovana-footer__disclaimer">
                        <h6>Fair Housing Disclaimer</h6>
                        <p>REOVANA.com supports the principles of the Fair Housing Act and Equal Opportunity Housing.</p>
                    </div>
                    <div class="reovana-footer__disclaimer">
                        <h6>Real Estate Disclaimer</h6>
                        <p>Property information is believed to be accurate but is not guaranteed. Users should independently verify all information before making investment decisions.</p>
                    </div>
                    <div class="reovana-footer__disclaimer reovana-footer__disclaimer--highlight">
                        <h6>Lending Disclaimer</h6>
                        <p>REOVANA.com is not a lender. We connect borrowers with third-party lending partners. Loan approvals are subject to lender qualifications and underwriting requirements.</p>
                    </div>
                </div>

                <div class="reovana-footer__bottom">
                    <p>Copyright &copy; ${new Date().getFullYear()} <strong>REOVANA</strong>. All rights reserved.</p>
                </div>
            </div>
        </footer>`;
}

export function replaceSiteFooter(html) {
  return html.replace(/<footer[\s\S]*?<\/footer>/i, buildReovanaFooter());
}
