import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "../src/generated/pages");
let patched = 0;

function patchHtml(html) {
  return html
    .replace(/href="#">Privacy Policy/g, 'href="/privacy-policy">Privacy Policy')
    .replace(/href="#">Terms of Use/g, 'href="/terms-of-use">Terms of Use');
}

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith(".json")) continue;
  const filePath = path.join(dir, file);
  const page = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!page.html) continue;
  const nextHtml = patchHtml(page.html);
  if (nextHtml === page.html) continue;
  page.html = nextHtml;
  fs.writeFileSync(filePath, `${JSON.stringify(page)}\n`);
  patched += 1;
}

console.log(`Patched footer links in ${patched} template files.`);
