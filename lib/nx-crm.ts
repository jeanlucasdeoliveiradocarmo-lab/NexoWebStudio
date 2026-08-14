import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const DEFAULT_CRM_ID = "3EQx6sXtRzWmGpvhGPQeXAsBXOI3";
const DEFAULT_LEADS_COLLECTION = "leads";

export type NxCrmLeadInput = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

type LeadMetadata = {
  page: string | null;
  referrer: string | null;
  userAgent: string | null;
};

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getFirebaseApp() {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  return initializeApp({
    credential: cert({
      projectId: requiredEnvironmentVariable("FIREBASE_PROJECT_ID"),
      clientEmail: requiredEnvironmentVariable("FIREBASE_CLIENT_EMAIL"),
      privateKey: requiredEnvironmentVariable("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });
}

function getLeadsCollectionPath(crmId: string) {
  const configuredPath = process.env.NX_CRM_LEADS_COLLECTION?.trim() || DEFAULT_LEADS_COLLECTION;
  const collectionPath = configuredPath.replaceAll("{crmId}", crmId).replace(/^\/+|\/+$/g, "");
  const pathSegments = collectionPath.split("/").filter(Boolean);

  if (pathSegments.length === 0 || pathSegments.length % 2 === 0) {
    throw new Error("NX_CRM_LEADS_COLLECTION must point to a Firestore collection");
  }

  return collectionPath;
}

function getCrmIdField() {
  const field = process.env.NX_CRM_ID_FIELD?.trim() || "crmId";

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(field)) {
    throw new Error("NX_CRM_ID_FIELD must be a valid Firestore field name");
  }

  return field;
}

export async function createNxCrmLead(input: NxCrmLeadInput, metadata: LeadMetadata) {
  const crmId = process.env.NX_CRM_ID?.trim() || DEFAULT_CRM_ID;
  const database = getFirestore(getFirebaseApp());
  const timestamp = FieldValue.serverTimestamp();
  const phoneDigits = input.phone.replace(/\D/g, "");

  const document = await database.collection(getLeadsCollectionPath(crmId)).add({
    [getCrmIdField()]: crmId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    phoneDigits,
    message: input.message,
    status: "new",
    source: "nexo-web-studio",
    channel: "website-form",
    metadata,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return document.id;
}
