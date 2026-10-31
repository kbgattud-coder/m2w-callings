// One-time export of the old AI Studio Firestore database to JSON, for import into the Durable Object.
// Usage: node scripts/export-firestore.mjs [out.json]
// Writes the converted export plus the untouched REST responses (<out>.raw.json) for auditing.
import fs from "node:fs";
import path from "node:path";

const outPath = process.argv[2] || "migration/firestore-export.json";

// Web config of the old AI Studio app (public values, previously src/lib/firebase-applet-config.json)
const PROJECT_ID = "gen-lang-client-0558874280";
const DATABASE_ID = "ai-studio-masagana2ndwardc-c6aaa759-0441-4af4-92d8-9565d8008394";
const API_KEY = "AIzaSyCE2pDVWQ6-E_0xWrVV_ImISitOEJNkr0w";
const COLLECTIONS = ["callings", "proposals", "council_messages", "system_meta"];

const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

// Convert Firestore REST "Value" objects into the plain JSON the web SDK's data() returns
function fromValue(v) {
  if ("nullValue" in v) return null;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("stringValue" in v) return v.stringValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromValue);
  if ("mapValue" in v) return fromFields(v.mapValue.fields || {});
  throw new Error(`Unsupported Firestore value: ${JSON.stringify(v)}`);
}
const fromFields = (fields) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fromValue(v)]));

// The live security rules refuse plain listing but allow queries, which is how the app reads too
async function queryCollection(collectionId) {
  const res = await fetch(`${base}:runQuery?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId }] } }),
  });
  if (!res.ok) throw new Error(`${collectionId}: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  const failed = rows.find((r) => r.error);
  if (failed) throw new Error(`${collectionId}: ${JSON.stringify(failed.error)}`);
  return rows.filter((r) => r.document).map((r) => r.document);
}

const exportedAt = new Date().toISOString();
const collections = {};
const raw = {};
for (const name of COLLECTIONS) {
  const docs = await queryCollection(name);
  raw[name] = docs;
  collections[name] = Object.fromEntries(docs.map((d) => [d.name.split("/").pop(), fromFields(d.fields || {})]));
  console.log(`${name}: ${docs.length}`);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ exportedAt, collections }, null, 2));
fs.writeFileSync(outPath.replace(/\.json$/, ".raw.json"), JSON.stringify({ exportedAt, raw }, null, 2));
console.log(`Exported to ${outPath}`);
