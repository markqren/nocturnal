/**
 * import-notes.ts
 *
 * Imports Apple Notes journal entries from data/ios_journal_archive/ into Supabase.
 *
 * Usage:
 *   npx ts-node scripts/import-notes.ts [--dry-run] [--user-id <uuid>]
 *
 * Env vars required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (service role to bypass RLS)
 *
 * Filename format: "M.DD.YY  Title.md" or "M.DD  Title.md"
 * Deduplication: heading repetition + paragraph repetition within each file.
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const ARCHIVE_DIR = path.join(__dirname, "../data/ios_journal_archive");
const DRY_RUN = process.argv.includes("--dry-run");
const USER_ID_FLAG = process.argv.indexOf("--user-id");
const USER_ID = USER_ID_FLAG !== -1 ? process.argv[USER_ID_FLAG + 1] : null;

if (!USER_ID && !DRY_RUN) {
  console.error("Error: --user-id <uuid> is required (or use --dry-run)");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Date parsing ─────────────────────────────────────────────────────────────

function parseFilenameDate(filename: string): string | null {
  // Formats: "M.DD.YY", "M.DD.YYYY", "M.DD" at the start
  const match = filename.match(/^(\d{1,2})\.(\d{2})(?:\.(\d{2,4}))?/);
  if (!match) return null;

  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  let year = match[3] ? parseInt(match[3], 10) : null;

  if (year !== null && year < 100) {
    year = year >= 0 && year <= 30 ? 2000 + year : 1900 + year;
  }
  if (year === null) year = new Date().getFullYear();

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseTitle(filename: string): string {
  // Remove date prefix and extension, clean up extra spaces
  return filename
    .replace(/^[\d.]+\s+/, "")
    .replace(/\.md$/, "")
    .trim();
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function deduplicateContent(raw: string): string {
  const lines = raw.split("\n");
  const seenHeadings = new Set<string>();
  const seenParagraphs = new Set<string>();
  const result: string[] = [];
  const paragraphBuffer: string[] = [];

  function flushParagraph() {
    const para = paragraphBuffer.join("\n").trim();
    if (para) {
      // Only add if we haven't seen this exact paragraph before
      if (!seenParagraphs.has(para)) {
        seenParagraphs.add(para);
        result.push(...paragraphBuffer);
      }
    }
    paragraphBuffer.length = 0;
  }

  for (const line of lines) {
    if (line.startsWith("#")) {
      flushParagraph();
      // Deduplicate repeated headings
      if (!seenHeadings.has(line.trim())) {
        seenHeadings.add(line.trim());
        result.push(line);
      }
    } else if (line.trim() === "") {
      flushParagraph();
      result.push(line);
    } else {
      paragraphBuffer.push(line);
    }
  }
  flushParagraph();

  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const files = fs.readdirSync(ARCHIVE_DIR).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} files in archive.`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const entryDate = parseFilenameDate(file);
    if (!entryDate) {
      console.warn(`  SKIP (no date): ${file}`);
      skipped++;
      continue;
    }

    const title = parseTitle(file);
    const raw = fs.readFileSync(path.join(ARCHIVE_DIR, file), "utf-8");
    const body = deduplicateContent(raw);

    if (!body) {
      console.warn(`  SKIP (empty after dedup): ${file}`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  DRY-RUN: ${entryDate} — "${title}" (${body.length} chars)`);
      imported++;
      continue;
    }

    try {
      // Check for existing entry with same date + title to avoid re-import
      const { data: existing } = await supabase
        .from("entries")
        .select("id")
        .eq("entry_date", entryDate)
        .eq("title", title)
        .eq("user_id", USER_ID)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("entries").insert({
        entry_date: entryDate,
        title: title || null,
        body,
        source: "imported",
        ai_draft: false,
        approved: true,
        user_id: USER_ID,
      });

      if (error) {
        console.error(`  ERROR: ${file} — ${error.message}`);
        errors++;
      } else {
        imported++;
        if (imported % 50 === 0) console.log(`  ...${imported} imported`);
      }
    } catch (err) {
      console.error(`  ERROR: ${file} — ${err}`);
      errors++;
    }
  }

  console.log(`\nDone. Imported: ${imported} | Skipped: ${skipped} | Errors: ${errors}`);
}

main().catch(console.error);
