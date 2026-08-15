import { NextResponse } from "next/server";
import { createNxCrmLead, type NxCrmLeadInput } from "@/lib/nx-crm";

export const runtime = "nodejs";

const MAX_REQUEST_SIZE_BYTES = 16_384;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{1,79}$/u;
const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,185}\.[A-Za-z]{2,24}$/;

type LeadRequest = Partial<NxCrmLeadInput> & { website?: unknown; page?: unknown };

function stripControlCharacters(value: string) {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code === 9 || code === 10 || (code >= 32 && code !== 127) ? character : "";
  }).join("");
}

function sanitizeSingleLine(value: unknown, maxLength: number) {
  return stripControlCharacters(String(value ?? "").normalize("NFKC"))
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeMessage(value: unknown) {
  return stripControlCharacters(String(value ?? "").normalize("NFKC"))
    .replace(/\r\n?/g, "\n")
    .replace(/[<>]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 1_000);
}

function validateLead(body: LeadRequest) {
  const lead = {
    name: sanitizeSingleLine(body.name, 80),
    email: sanitizeSingleLine(body.email, 254).toLowerCase(),
    phone: sanitizeSingleLine(body.phone, 20),
    message: sanitizeMessage(body.message),
  };
  const phoneDigits = lead.phone.replace(/\D/g, "");

  if (
    !NAME_PATTERN.test(lead.name) ||
    !EMAIL_PATTERN.test(lead.email) ||
    phoneDigits.length < 10 ||
    phoneDigits.length > 13 ||
    lead.message.length < 10
  ) {
    return null;
  }

  return lead;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ ok: false, error: "unsupported_media_type" }, { status: 415 });
  }

  if (contentLength > MAX_REQUEST_SIZE_BYTES) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  let body: LeadRequest;
  try {
    body = (await request.json()) as LeadRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (sanitizeSingleLine(body.website, 120)) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const lead = validateLead(body);
  if (!lead) {
    return NextResponse.json({ ok: false, error: "invalid_lead" }, { status: 400 });
  }

  try {
    const leadId = await createNxCrmLead(lead, {
      page: sanitizeSingleLine(body.page, 200) || null,
      referrer: sanitizeSingleLine(request.headers.get("referer"), 500) || null,
      userAgent: sanitizeSingleLine(request.headers.get("user-agent"), 500) || null,
    });

    return NextResponse.json({ ok: true, leadId }, { status: 201 });
  } catch (error) {
    console.error("NX-CRM lead creation failed", error);
    return NextResponse.json({ ok: false, error: "crm_unavailable" }, { status: 503 });
  }
}
