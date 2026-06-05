/** REOVANA Learn section content patches for template pages. */

const FAQ_GROUPS = [
  {
    title: "Getting Started",
    items: [
      {
        question: "What is REOVANA?",
        answer:
          "REOVANA is a foreclosure and auction marketplace helping buyers discover distressed properties, bank-owned homes, short sales, and commercial assets across the United States.",
      },
      {
        question: "How do I search for properties?",
        answer:
          "Use Buy in the navigation to open All Auction Homes or a category such as Foreclosure Homes. Filter by location on the map, asset type, and auction status.",
      },
    ],
  },
  {
    title: "Auctions & Bidding",
    items: [
      {
        question: "What does estimated opening bid mean?",
        answer:
          "It is the projected starting price for the auction event, not a final sale price. Live bidding may begin at or near this amount depending on the seller.",
      },
      {
        question: "Do I need to register before bidding?",
        answer:
          "Yes. Select Register on a listing to complete bidder verification, agree to auction terms, and submit any required deposit instructions for that event.",
      },
      {
        question: "Are auction properties sold as-is?",
        answer:
          "Most foreclosure and bank-owned auction sales are as-is. Buyers should complete due diligence on title, condition, and occupancy before placing a bid.",
      },
    ],
  },
  {
    title: "Account & Support",
    items: [
      {
        question: "What is the difference between foreclosure and bank owned?",
        answer:
          "Foreclosure homes are heading toward or in the foreclosure sale process. Bank-owned (REO) properties are already repossessed by the lender and offered for sale.",
      },
      {
        question: "How do I save a property?",
        answer:
          "Click the heart icon on any listing card to add it to your favorites once you are signed in to your REOVANA account.",
      },
      {
        question: "Where can I get more help?",
        answer:
          "Visit the Help Center for guided topics, browse the Glossary for terminology, or contact our support team through the Contact page.",
      },
    ],
  },
];

const FAQ_IDS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

function buildFaqItem(question, answer, id, open = false) {
  const collapsed = open ? "" : " collapsed";
  const show = open ? " show" : "";
  const active = open ? " active" : "";
  return `                                    <li class="faq-item${active}">
                                        <a href="#accordion-faq-${id}" class="faq-header h6${collapsed}"
                                            data-bs-toggle="collapse" aria-expanded="${open ? "true" : "false"}"
                                            aria-controls="accordion-faq-${id}">
                                            ${question} <i class="icon-CaretDown"></i>
                                        </a>
                                        <div id="accordion-faq-${id}" class="collapse${show}" data-bs-parent="#wrapper-faq">
                                            <p class="faq-body">
                                                ${answer}
                                            </p>
                                        </div>
                                    </li>`;
}

function buildFaqGroupsHtml() {
  let idIndex = 0;
  return FAQ_GROUPS.map((group, groupIndex) => {
    const items = group.items
      .map((item) => {
        const id = FAQ_IDS[idIndex++];
        const open = groupIndex === 0 && idIndex === 1;
        return buildFaqItem(item.question, item.answer, id, open);
      })
      .join("\n");
    return `                            <div class="tf-faq mb-49">
                                <h3 class="fw-8 title mb-24">${group.title}</h3>
                                <ul class="box-faq" id="wrapper-faq${groupIndex === 0 ? "" : `-${groupIndex + 1}`}">
${items}
                                </ul>
                            </div>`;
  }).join("\n");
}

/** Replace generic FAQ copy with REOVANA foreclosure/auction Q&A. */
export function applyReovanaFaqContent(html) {
  const open = '<div class="col-xl-8 col-lg-7">';
  const colStart = html.indexOf(open);
  const sidebarStart = html.indexOf('<div class="col-xl-4 col-lg-5">', colStart);
  if (colStart < 0 || sidebarStart < 0) return html;

  const innerStart = colStart + open.length;
  const inner = `
                            <div class="heading-section  mb-48">
                                <h2 class="title ">Frequently Asked Questions</h2>
                                <p class="text-1">Common questions about buying foreclosure and auction properties on REOVANA.</p>
                            </div>
${buildFaqGroupsHtml()}
                        `;

  return (
    html.slice(0, innerStart) +
    inner +
    '                        </div>\r\n                        ' +
    html.slice(sidebarStart)
  );
}

/** REOVANA blog listing title/subtitle. */
export function applyReovanaBlogContent(html) {
  let out = html;
  out = out.replace(
    /<title>[^<]*<\/title>/i,
    "<title>Foreclosure Insights — REOVANA</title>",
  );
  out = out.replace(
    /<h2 class="title[^"]*">Blog<\/h2>/g,
    '<h2 class="title">Foreclosure Insights</h2>',
  );
  out = out.replace(
    /<h1 class="title[^"]*">Blog<\/h1>/g,
    '<h1 class="title">Foreclosure Insights</h1>',
  );
  return out;
}
