/**
 * import-dayone.ts
 *
 * Imports entries from a Day One JSON/ZIP export into Supabase.
 *
 * Usage:
 *   npx ts-node scripts/import-dayone.ts --file ~/DayOne.zip [--dry-run] [--user-id <uuid>]
 *
 * Env vars required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Day One ZIP contains Journal.json (or multiple Journal_*.json files).
 * Each entry has: text, creationDate, modifiedDate, tags, photos, uuid
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import { format, parseISO } from "date-fns";

const DRY_RUN = process.argv.includes("--dry-run");
const FILE_FLAG = process.argv.indexOf("--file");
const USER_ID_FLAG = process.argv.indexOf("--user-id");
const INPUT_FILE = FILE_FLAG !== -1 ? process.argv[FILE_FLAG + 1] : null;
const USER_ID = USER_ID_FLAG !== -1 ? process.argv[USER_ID_FLAG + 1] : null;

if (!INPUT_FILE) {
  console.error("Error: --file <path> is required");
  process.exit(1);
}

if (!USER_ID && !DRY_RUN) {
  console.error("Error: --user-id <uuid> is required (or use --dry-run)");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Day One types ────────────────────────────────────────────────────────────

interface DayOnePhoto {
  identifier: string;
  md5: string;
  type: string;
  width: number;
  height: number;
}

interface DayOneEntry {
  uuid: string;
  text: string;
  creationDate: string;
  modifiedDate?: string;
  tags?: string[];
  photos?: DayOnePhoto[];
  journal?: string;
  starred?: boolean;
}

interface DayOneJournal {
  entries: DayOneEntry[];
  metadata?: { version: string };
}

// ─── Extract ZIP ──────────────────────────────────────────────────────────────

function extractZip(zipPath: string): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dayone-"));
  execSync(`unzip -q "${zipPath}" -d "${tmpDir}"`);
  return tmpDir;
}

function findJsonFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsonFiles(fullPath));
    } else if (entry.name.endsWith(".json") && entry.name.toLowerCase().includes("journal")) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── Title extraction ─────────────────────────────────────────────────────────

function extractTitle(text: string): { title: string | null; body: string } {
  const lines = text.split("\n");
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.startsWith("# ")) {
    return {
      title: firstLine.replace(/^#+\s+/, "").trim(),
      body: lines.slice(1).join("\n").trim(),
    };
  }
  return { title: null, body: text };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let extractDir: string | null = null;
  let jsonFiles: string[] = [];

  if (INPUT_FILE!.endsWith(".zip")) {
    console.log("Extracting ZIP...");
    extractDir = extractZip(INPUT_FILE!);
    jsonFiles = findJsonFiles(extractDir);
  } else if (INPUT_FILE!.endsWith(".json")) {
    jsonFiles = [INPUT_FILE!];
  } else {
    console.error("Unsupported file format. Provide a .zip or .json Day One export.");
    process.exit(1);
  }

  if (jsonFiles.length === 0) {
    console.error("No journal JSON files found.");
    process.exit(1);
  }

  console.log(`Found ${jsonFiles.length} journal file(s).`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const seenUuids = new Set<string>();

  for (const jsonFile of jsonFiles) {
    const raw = JSON.parse(fs.readFileSync(jsonFile, "utf-8")) as DayOneJournal;
    const entries = raw.entries ?? [];
    console.log(`Processing ${entries.length} entries from ${path.basename(jsonFile)}...`);

    for (const entry of entries) {
      // Deduplicate by Day One UUID
      if (seenUuids.has(entry.uuid)) {
        skipped++;
        continue;
      }
      seenUuids.add(entry.uuid);

      const entryDate = format(parseISO(entry.creationDate), "yyyy-MM-dd");
      const { title, body } = extractTitle(entry.text ?? "");

      if (DRY_RUN) {
        console.log(`  DRY-RUN: ${entryDate} — "${title ?? "(no title)"}" (${body.length} chars)`);
        imported++;
        continue;
      }

      try {
        const { data: created, error } = await supabase
          .from("entries")
          .insert({
            entry_date: entryDate,
            title: title || null,
            body,
            source: "imported",
            ai_draft: false,
            approved: true,
            user_id: USER_ID,
          })
          .select("id")
          .single();

        if (error) {
          console.error(`  ERROR: ${entry.uuid} — ${error.message}`);
          errors++;
          continue;
        }

        // Map Day One tags
        if (entry.tags && entry.tags.length > 0 && created) {
          for (const tagName of entry.tags) {
            const { data: tag } = await supabase
              .from("tags")
              .upsert({ name: tagName, is_canonical: false, user_id: USER_ID }, {
                onConflict: "name",
              })
              .select("id")
              .single();

            if (tag) {
              await supabase.from("entry_tags").upsert({
                entry_id: created.id,
                tag_id: tag.id,
              });
            }
          }
        }

        imported++;
        if (imported % 50 === 0) console.log(`  ...${imported} imported`);
      } catch (err) {
        console.error(`  ERROR: ${entry.uuid} — ${err}`);
        errors++;
      }
    }
  }

  // Cleanup temp dir
  if (extractDir) {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }

  console.log(`\nDone. Imported: ${imported} | Skipped: ${skipped} | Errors: ${errors}`);
}

main().catch(console.error);
