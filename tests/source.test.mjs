import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const landingUrl = new URL("../components/landing-page.tsx", import.meta.url);
const leadsRouteUrl = new URL("../app/api/leads/route.ts", import.meta.url);
const crmAdapterUrl = new URL("../lib/nx-crm.ts", import.meta.url);

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

test("envia o formulário ao NX-CRM sem alterar o fluxo do WhatsApp", async () => {
  const [landing, route, adapter] = await Promise.all([
    readFile(landingUrl, "utf8"),
    readFile(leadsRouteUrl, "utf8"),
    readFile(crmAdapterUrl, "utf8"),
  ]);

  assert.match(landing, /fetch\("\/api\/leads"/);
  assert.match(landing, /keepalive:\s*true/);
  assert.match(landing, /submitLeadToCrm\(validated\.values\)[\s\S]*window\.open/);
  assert.match(route, /export const runtime = "nodejs"/);
  assert.match(route, /createNxCrmLead/);
  assert.match(adapter, /3EQx6sXtRzWmGpvhGPQeXAsBXOI3/);
  assert.match(adapter, /FieldValue\.serverTimestamp/);
  assert.doesNotMatch(landing, /FIREBASE_PRIVATE_KEY/);
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
