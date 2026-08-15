import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const landingUrl = new URL("../components/landing-page.tsx", import.meta.url);
const leadsRouteUrl = new URL("../app/api/leads/route.ts", import.meta.url);
const homePageUrl = new URL("../app/page.tsx", import.meta.url);
const rootLayoutUrl = new URL("../app/layout.tsx", import.meta.url);

test("expõe a landing page na raiz do App Router", async () => {
  const [homePage, rootLayout] = await Promise.all([
    readFile(homePageUrl, "utf8"),
    readFile(rootLayoutUrl, "utf8"),
  ]);

  assert.match(homePage, /import\s+\{\s*LandingPage\s*\}\s+from\s+["']@\/components\/landing-page["']/);
  assert.match(homePage, /return\s+<LandingPage\s*\/>/);
  assert.match(rootLayout, /<html\s+lang="pt-BR"/);
  assert.match(rootLayout, /<body[^>]*>\{children\}<\/body>/);
});

test("protege links externos e mensagens do WhatsApp", async () => {
  const landing = await readFile(landingUrl, "utf8");
  const blankTargets = landing.match(/target="_blank"/g) ?? [];
  const safeTargets = landing.match(/target="_blank"\s+rel="noopener noreferrer"/g) ?? [];

  assert.ok(blankTargets.length > 0);
  assert.equal(safeTargets.length, blankTargets.length);
  assert.match(landing, /https:\/\/wa\.me\/5521991182709/);
  assert.match(landing, /encodeURIComponent\(message\)/);
  assert.match(landing, /validateContactForm/);
  assert.match(landing, /FORM_COOLDOWN_MS/);
});

test("envia o formulário ao endpoint interno do CRM com o contrato esperado", async () => {
  const [landing, route] = await Promise.all([
    readFile(landingUrl, "utf8"),
    readFile(leadsRouteUrl, "utf8"),
  ]);

  assert.match(landing, /await fetch\("\/api\/leads"/);
  assert.match(landing, /cliente_id:\s*"nexo-web-studio"/);
  assert.match(landing, /nome:\s*validated\.values\.name/);
  assert.match(landing, /telefone:\s*validated\.values\.phone/);
  assert.match(landing, /mensagem:\s*validated\.values\.message/);
  assert.match(landing, /if \(!response\.ok\)/);
  assert.match(landing, /formTarget\.reset\(\)/);
  assert.match(landing, /Enviando\.\.\./);
  assert.doesNotMatch(landing, /submitLeadToCrm/);
  assert.doesNotMatch(landing, /FIREBASE_PRIVATE_KEY/);
  assert.match(route, /export const runtime = "nodejs"/);
  assert.match(route, /body\.cliente_id/);
  assert.match(route, /body\.nome/);
  assert.match(route, /body\.telefone/);
  assert.match(route, /body\.mensagem/);
  assert.match(route, /createNxCrmLead/);
});

test("mantém as otimizações de animação e acessibilidade", async () => {
  const [landing, topography, css] = await Promise.all([
    readFile(landingUrl, "utf8"),
    readFile(new URL("../components/Topography.jsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(landing, /requestAnimationFrame/);
  assert.match(landing, /useReducedMotion/);
  assert.match(topography, /cancelAnimationFrame/);
  assert.match(topography, /removeEventListener\("pointermove"/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /overflow-x:\s*hidden/);
});
