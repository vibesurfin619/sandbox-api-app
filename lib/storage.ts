import { StoredApplication, ApplicationStatus } from "./types";

// Dynamic import type for sql.js
type SqlJsModule = typeof import("sql.js");
type Database = import("sql.js").Database;

const STORAGE_KEY = "counterpart_applications_db";
const DB_VERSION_KEY = "counterpart_db_version";
const DB_VERSION = 1;

// Global database instance
let db: Database | null = null;
let dbInitialized = false;

// Initialize SQLite database
async function initDatabase(): Promise<Database> {
  if (db && dbInitialized) {
    return db;
  }

  if (typeof window === "undefined") {
    throw new Error("Database can only be initialized in browser environment");
  }

  try {
    // Dynamic import to avoid server-side bundling issues
    const initSqlJs = (await import("sql.js")).default;
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });

    // Try to load existing database from localStorage
    const savedDb = localStorage.getItem(STORAGE_KEY);
    const savedVersion = localStorage.getItem(DB_VERSION_KEY);

    if (savedDb && savedVersion === String(DB_VERSION)) {
      try {
        const uint8Array = Uint8Array.from(JSON.parse(savedDb));
        db = new SQL.Database(uint8Array);
      } catch (error) {
        console.warn("Failed to load saved database, creating new one:", error);
        db = new SQL.Database();
        createTables(db);
      }
    } else {
      // Create new database
      db = new SQL.Database();
      createTables(db);

      // Migrate existing localStorage data if it exists
      if (savedVersion !== String(DB_VERSION)) {
        migrateFromLocalStorage();
      }
    }

    dbInitialized = true;
    return db;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

// Create database tables
function createTables(database: Database): void {
  database.run(`
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
      submitted_at TEXT
    )
  `);
}

// Migrate data from old localStorage format
function migrateFromLocalStorage(): void {
  try {
    const oldKey = "counterpart_applications";
    const oldData = localStorage.getItem(oldKey);
    
    if (oldData) {
      const applications = JSON.parse(oldData) as StoredApplication[];
      if (Array.isArray(applications) && applications.length > 0) {
        const database = db!;
        applications.forEach((app) => {
          insertApplication(database, app);
        });
        saveDatabase(database);
        console.log(`Migrated ${applications.length} applications from localStorage`);
      }
      // Optionally remove old localStorage data after migration
      // localStorage.removeItem(oldKey);
    }
  } catch (error) {
    console.error("Failed to migrate from localStorage:", error);
  }
}

// Save database to localStorage
function saveDatabase(database: Database): void {
  try {
    const data = database.export();
    const jsonString = JSON.stringify(Array.from(data));
    localStorage.setItem(STORAGE_KEY, jsonString);
    localStorage.setItem(DB_VERSION_KEY, String(DB_VERSION));
  } catch (error) {
    console.error("Failed to save database:", error);
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new Error("Storage quota exceeded. Please clear some applications.");
    }
    throw error;
  }
}

// Get database instance (initializes if needed)
async function getDatabase(): Promise<Database> {
  return await initDatabase();
}

// Normalize application data to ensure all required fields have defaults
function normalizeApplication(app: any): StoredApplication {
  return {
    ...app,
    questions: app.questions ?? [],
    answers: app.answers ?? [],
    coverages: app.coverages ?? [],
  };
}

// Insert or update application in database
function insertApplication(database: Database, application: StoredApplication): void {
  const now = new Date().toISOString();
  
  database.run(
    `INSERT OR REPLACE INTO applications (
      account_id, status, company_name, coverages, answers, questions,
      start_application_data, created_at, updated_at, submitted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      application.account_id,
      application.status,
      application.company_name,
      JSON.stringify(application.coverages),
      JSON.stringify(application.answers),
      JSON.stringify(application.questions),
      application.startApplicationData ? JSON.stringify(application.startApplicationData) : null,
      application.created_at || now,
      now,
      application.submitted_at || null,
    ]
  );
}

// Convert database row to StoredApplication
function rowToApplication(row: any[]): StoredApplication {
  return {
    account_id: row[0] as string,
    status: row[1] as ApplicationStatus,
    company_name: row[2] as string,
    coverages: JSON.parse(row[3] as string || "[]"),
    answers: JSON.parse(row[4] as string || "[]"),
    questions: JSON.parse(row[5] as string || "[]"),
    startApplicationData: row[6] ? JSON.parse(row[6] as string) : undefined,
    created_at: row[7] as string,
    updated_at: row[8] as string,
    submitted_at: row[9] as string || undefined,
  };
}

export async function saveApplication(application: StoredApplication): Promise<void> {
  try {
    const database = await getDatabase();
    insertApplication(database, {
      ...application,
      updated_at: new Date().toISOString(),
      created_at: application.created_at || new Date().toISOString(),
    });
    saveDatabase(database);
  } catch (error) {
    console.error("Failed to save application:", error);
    throw error;
  }
}

export async function getApplication(accountId: string): Promise<StoredApplication | null> {
  try {
    const database = await getDatabase();
    const stmt = database.prepare("SELECT * FROM applications WHERE account_id = ?");
    stmt.bind([accountId]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      stmt.free();
      
      return normalizeApplication({
        account_id: row.account_id,
        status: row.status,
        company_name: row.company_name,
        coverages: JSON.parse(row.coverages || "[]"),
        answers: JSON.parse(row.answers || "[]"),
        questions: JSON.parse(row.questions || "[]"),
        startApplicationData: row.start_application_data ? JSON.parse(row.start_application_data) : undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
        submitted_at: row.submitted_at || undefined,
      });
    }
    
    stmt.free();
    return null;
  } catch (error) {
    console.error("Failed to get application:", error);
    return null;
  }
}

export async function getAllApplications(): Promise<StoredApplication[]> {
  try {
    if (typeof window === "undefined") {
      return [];
    }

    const database = await getDatabase();
    const result = database.exec("SELECT * FROM applications ORDER BY updated_at DESC");

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const applications = result[0].values.map((row) => rowToApplication(row));
    return applications.map(normalizeApplication);
  } catch (error) {
    console.error("Failed to get all applications:", error);
    return [];
  }
}

export async function deleteApplication(accountId: string): Promise<boolean> {
  try {
    const database = await getDatabase();
    const result = database.run("DELETE FROM applications WHERE account_id = ?", [accountId]);
    saveDatabase(database);
    return result.changes > 0;
  } catch (error) {
    console.error("Failed to delete application:", error);
    return false;
  }
}

export async function clearAllApplications(): Promise<void> {
  try {
    const database = await getDatabase();
    database.run("DELETE FROM applications");
    saveDatabase(database);
  } catch (error) {
    console.error("Failed to clear applications:", error);
  }
}

export async function updateApplicationStatus(
  accountId: string,
  status: ApplicationStatus,
  submittedAt?: string
): Promise<boolean> {
  try {
    const application = await getApplication(accountId);
    if (!application) {
      return false;
    }

    await saveApplication({
      ...application,
      status,
      submitted_at: submittedAt || application.submitted_at,
      updated_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Failed to update application status:", error);
    return false;
  }
}
