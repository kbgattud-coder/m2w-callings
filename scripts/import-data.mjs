// Imports the Firestore export (scripts/export-firestore.mjs) into the Worker, replacing all data,
// then reads everything back and checks every document matches the export exactly.
// Usage: IMPORT_TOKEN=... node scripts/import-data.mjs <base url> [migration/firestore-export.json]
//        node scripts/import-data.mjs --verify-only <base url> [file]   (just the comparison)
import fs from "node:fs";
import { isDeepStrictEqual } from "node:util";

const args = process.argv.slice(2);
const verifyOnly = args[0] === "--verify-only";
if (verifyOnly) args.shift();
const [baseUrl, file = "migration/firestore-export.json"] = args;
const token = process.env.IMPORT_TOKEN;
if (!baseUrl || (!verifyOnly && !token)) {
  console.error("Usage: IMPORT_TOKEN=... node scripts/import-data.mjs <base url> [file]");
  process.exit(1);
}

const { exportedAt, collections } = JSON.parse(fs.readFileSync(file, "utf8"));
console.log(`Export from ${exportedAt}`);

if (!verifyOnly) {
  const res = await fetch(`${baseUrl}/api/admin/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ collections }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Import failed: ${res.status} ${body}`);
  console.log("Imported:", JSON.parse(body).imported);
}

const live = await fetch(`${baseUrl}/api/data`, { cache: "no-store" });
if (!live.ok) throw new Error(`Reading back failed: ${live.status}`);
const { docs } = await live.json();

let problems = 0;
for (const [name, expected] of Object.entries(collections)) {
  const actual = docs[name] || {};
  const ids = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  let same = 0;
  for (const id of ids) {
    if (!(id in actual)) console.error(`  missing  ${name}/${id}`);
    else if (!(id in expected)) console.error(`  extra    ${name}/${id}`);
    else if (!isDeepStrictEqual(actual[id], expected[id])) console.error(`  differs  ${name}/${id}`);
    else {
      same++;
      continue;
    }
    problems++;
  }
  console.log(`${name}: ${same}/${Object.keys(expected).length} identical, ${Object.keys(actual).length} stored`);
}
for (const name of Object.keys(docs)) {
  if (!(name in collections) && Object.keys(docs[name]).length) {
    console.error(`  unexpected collection ${name}`);
    problems++;
  }
}
console.log(problems === 0 ? "Every document matches the export." : `${problems} problem(s) found.`);
process.exit(problems === 0 ? 0 : 1);
