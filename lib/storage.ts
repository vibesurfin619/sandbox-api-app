import { StoredApplication, ApplicationStatus } from "./types";
import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "applications.db");

let db: Database | null = null;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function getDatabase(): Promise<Database> {
  if (db) return db;

  const wasmPath = path.join(
    process.cwd(),
    "node_modules",
    "sql.js",
    "dist",
    "sql-wasm.wasm"
  );
  const wasmBinary = fs.readFileSync(wasmPath);

  const SQL = await initSqlJs({ wasmBinary });

  ensureDataDir();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      account_id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      company_name TEXT NOT NULL,
      coverages TEXT NOT NULL,
      answers TEXT NOT NULL,
      questions TEXT NOT NULL,
      start_application_data TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      submitted_at TEXT,
      quote_data TEXT
    )
  `);

  try {
    db.run("ALTER TABLE applications ADD COLUMN quote_data TEXT");
  } catch {
    // Column already exists
  }

  try {
    db.run("ALTER TABLE applications ADD COLUMN policy_data TEXT");
  } catch {
    // Column already exists
  }

  persistDatabase(db);
  return db;
}

function persistDatabase(database: Database): void {
  ensureDataDir();
  const data = database.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function normalizeApplication(app: any): StoredApplication {
  return {
    ...app,
    questions: app.questions ?? [],
    answers: app.answers ?? [],
    coverages: app.coverages ?? [],
  };
}

export async function saveApplication(
  application: StoredApplication
): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();

  database.run(
    `INSERT OR REPLACE INTO applications (
      account_id, status, company_name, coverages, answers, questions,
      start_application_data, created_at, updated_at, submitted_at, quote_data, policy_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      application.account_id,
      application.status,
      application.company_name,
      JSON.stringify(application.coverages),
      JSON.stringify(application.answers),
      JSON.stringify(application.questions),
      application.startApplicationData
        ? JSON.stringify(application.startApplicationData)
        : null,
      application.created_at || now,
      now,
      application.submitted_at || null,
      application.quote_data || null,
      application.policy_data || null,
    ]
  );

  persistDatabase(database);
}

export async function getApplication(
  accountId: string
): Promise<StoredApplication | null> {
  const database = await getDatabase();
  const stmt = database.prepare(
    "SELECT * FROM applications WHERE account_id = ?"
  );
  stmt.bind([accountId]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    stmt.free();

    return normalizeApplication({
      account_id: row.account_id,
      status: row.status as ApplicationStatus,
      company_name: row.company_name,
      coverages: JSON.parse(row.coverages || "[]"),
      answers: JSON.parse(row.answers || "[]"),
      questions: JSON.parse(row.questions || "[]"),
      startApplicationData: row.start_application_data
        ? JSON.parse(row.start_application_data)
        : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      submitted_at: row.submitted_at || undefined,
      quote_data: row.quote_data || undefined,
      policy_data: row.policy_data || undefined,
    });
  }

  stmt.free();
  return null;
}

export async function getAllApplications(): Promise<StoredApplication[]> {
  const database = await getDatabase();
  const result = database.exec(
    "SELECT * FROM applications ORDER BY updated_at DESC"
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return [];
  }

  return result[0].values.map((row) => {
    const app: StoredApplication = {
      account_id: row[0] as string,
      status: row[1] as ApplicationStatus,
      company_name: row[2] as string,
      coverages: JSON.parse((row[3] as string) || "[]"),
      answers: JSON.parse((row[4] as string) || "[]"),
      questions: JSON.parse((row[5] as string) || "[]"),
      startApplicationData: row[6]
        ? JSON.parse(row[6] as string)
        : undefined,
      created_at: row[7] as string,
      updated_at: row[8] as string,
      submitted_at: (row[9] as string) || undefined,
      quote_data: (row[10] as string) || undefined,
      policy_data: (row[11] as string) || undefined,
    };
    return normalizeApplication(app);
  });
}

export async function deleteApplication(accountId: string): Promise<boolean> {
  const database = await getDatabase();
  database.run("DELETE FROM applications WHERE account_id = ?", [accountId]);
  persistDatabase(database);
  return true;
}

export async function clearAllApplications(): Promise<void> {
  const database = await getDatabase();
  database.run("DELETE FROM applications");
  persistDatabase(database);
}

export async function updateApplicationStatus(
  accountId: string,
  status: ApplicationStatus,
  submittedAt?: string
): Promise<boolean> {
  const application = await getApplication(accountId);
  if (!application) return false;

  await saveApplication({
    ...application,
    status,
    submitted_at: submittedAt || application.submitted_at,
    updated_at: new Date().toISOString(),
  });

  return true;
}

export async function saveQuoteData(
  accountId: string,
  quoteData: object
): Promise<boolean> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const json = JSON.stringify(quoteData);

  database.run(
    "UPDATE applications SET quote_data = ?, updated_at = ? WHERE account_id = ?",
    [json, now, accountId]
  );

  persistDatabase(database);
  return true;
}

export async function getQuoteData(
  accountId: string
): Promise<object | null> {
  const database = await getDatabase();
  const stmt = database.prepare(
    "SELECT quote_data FROM applications WHERE account_id = ?"
  );
  stmt.bind([accountId]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    stmt.free();
    if (row.quote_data) {
      return JSON.parse(row.quote_data);
    }
    return null;
  }

  stmt.free();
  return null;
}

export async function savePolicyData(
  accountId: string,
  policyData: object
): Promise<boolean> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const json = JSON.stringify(policyData);

  database.run(
    "UPDATE applications SET policy_data = ?, updated_at = ? WHERE account_id = ?",
    [json, now, accountId]
  );

  persistDatabase(database);
  return true;
}

export async function getPolicyData(
  accountId: string
): Promise<object | null> {
  const database = await getDatabase();
  const stmt = database.prepare(
    "SELECT policy_data FROM applications WHERE account_id = ?"
  );
  stmt.bind([accountId]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    stmt.free();
    if (row.policy_data) {
      return JSON.parse(row.policy_data);
    }
    return null;
  }

  stmt.free();
  return null;
}
