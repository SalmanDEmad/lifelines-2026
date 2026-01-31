import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  
  // Prevent multiple simultaneous init attempts
  if (isInitializing && initPromise) {
    return initPromise;
  }
  
  isInitializing = true;
  initPromise = (async () => {
    try {
      db = await SQLite.openDatabaseAsync('reports.db');
      return db;
    } catch (error) {
      console.error('Failed to open database:', error);
      throw error;
    } finally {
      isInitializing = false;
    }
  })();
  
  return initPromise;
};

// Simple UUID v4 generator that works in React Native
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface Report {
  id?: string;
  zone: string;
  category: 'rubble' | 'hazard' | 'blocked_road';
  latitude: number;
  longitude: number;
  imageUri?: string;
  description?: string;
  timestamp: number;
  synced: 0 | 1;
  user_id?: string;
  is_demo?: 0 | 1;
}

export const initDatabase = async (): Promise<void> => {
  try {
    const database = await getDB();
    
    // Create table if it doesn't exist
    await database.runAsync(
      `CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        zone TEXT,
        category TEXT,
        latitude REAL,
        longitude REAL,
        imageUri TEXT,
        description TEXT,
        timestamp INTEGER,
        synced INTEGER,
        user_id TEXT,
        is_demo INTEGER DEFAULT 0
      );`
    );
    
    // Check if user_id column exists, if not add it
    try {
      const result = await database.getFirstAsync<any>(
        `PRAGMA table_info(reports) WHERE name='user_id';`
      );
      
      if (!result) {
        console.log('Adding user_id column to existing reports table...');
        await database.runAsync(`ALTER TABLE reports ADD COLUMN user_id TEXT DEFAULT NULL;`);
      }
    } catch (error) {
      // Ignore PRAGMA errors, column might already exist
      console.log('Column check skipped (new table)');
    }

    // Check if is_demo column exists, if not add it
    try {
      const result = await database.getFirstAsync<any>(
        `PRAGMA table_info(reports) WHERE name='is_demo';`
      );
      
      if (!result) {
        console.log('Adding is_demo column to existing reports table...');
        await database.runAsync(`ALTER TABLE reports ADD COLUMN is_demo INTEGER DEFAULT 0;`);
      }
    } catch (error) {
      // Ignore PRAGMA errors, column might already exist
      console.log('is_demo column check skipped');
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export const saveReport = async (report: Report): Promise<string> => {
  try {
    const database = await getDB();
    const id = report.id || generateUUID();
    
    // Try inserting with user_id column first
    try {
      await database.runAsync(
        `INSERT INTO reports (id, zone, category, latitude, longitude, imageUri, description, timestamp, synced, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          report.zone,
          report.category,
          report.latitude,
          report.longitude,
          report.imageUri || '',
          report.description || '',
          report.timestamp,
          0,
          report.user_id || null,
        ]
      );
    } catch (innerError: any) {
      // If user_id column doesn't exist, try without it
      if (innerError?.message?.includes('user_id')) {
        console.log('user_id column not available, inserting without it');
        await database.runAsync(
          `INSERT INTO reports (id, zone, category, latitude, longitude, imageUri, description, timestamp, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            report.zone,
            report.category,
            report.latitude,
            report.longitude,
            report.imageUri || '',
            report.description || '',
            report.timestamp,
            0,
          ]
        );
      } else {
        throw innerError;
      }
    }
    
    console.log('Report saved:', id);
    return id;
  } catch (error) {
    console.error('Error saving report:', error);
    throw error;
  }
};

export const getAllReports = async (): Promise<Report[]> => {
  try {
    const database = await getDB();
    const result = await database.getAllAsync<any>(
      'SELECT * FROM reports ORDER BY timestamp DESC'
    );
    console.log('Got all reports:', result.length);
    // Ensure synced is a number
    return result.map(r => ({
      ...r,
      synced: typeof r.synced === 'number' ? r.synced : (r.synced ? 1 : 0),
    })) as Report[];
  } catch (error) {
    console.error('Error getting all reports:', error);
    return [];
  }
};

export const getReportsByZone = async (zone: string): Promise<Report[]> => {
  try {
    const database = await getDB();
    const result = await database.getAllAsync<any>(
      'SELECT * FROM reports WHERE zone = ? ORDER BY timestamp DESC',
      [zone]
    );
    return result.map(r => ({
      ...r,
      synced: typeof r.synced === 'number' ? r.synced : (r.synced ? 1 : 0),
    })) as Report[];
  } catch (error) {
    console.error('Error getting reports by zone:', error);
    return [];
  }
};

export const getUnsyncedReports = async (): Promise<Report[]> => {
  try {
    const database = await getDB();
    const result = await database.getAllAsync<any>(
      'SELECT * FROM reports WHERE synced = 0 ORDER BY timestamp ASC'
    );
    return result.map(r => ({
      ...r,
      synced: typeof r.synced === 'number' ? r.synced : (r.synced ? 1 : 0),
    })) as Report[];
  } catch (error) {
    console.error('Error getting unsynced reports:', error);
    return [];
  }
};

export const markSynced = async (reportId: string): Promise<void> => {
  try {
    const database = await getDB();
    await database.runAsync(
      'UPDATE reports SET synced = 1 WHERE id = ?',
      [reportId]
    );
    console.log('Report marked as synced:', reportId);
  } catch (error) {
    console.error('Error marking report as synced:', error);
    throw error;
  }
};

export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    const database = await getDB();
    await database.runAsync(
      'DELETE FROM reports WHERE id = ?',
      [reportId]
    );
    console.log('Report deleted:', reportId);
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

export const clearNonDemoReports = async (): Promise<number> => {
  try {
    const database = await getDB();
    
    // Count how many reports will be deleted
    const countResult = await database.getFirstAsync<any>(
      `SELECT COUNT(*) as count FROM reports WHERE is_demo = 0 OR is_demo IS NULL`
    );
    const deletedCount = countResult?.count || 0;
    
    // Delete all non-demo reports
    await database.runAsync(
      `DELETE FROM reports WHERE is_demo = 0 OR is_demo IS NULL`
    );
    
    console.log(`Cleared ${deletedCount} non-demo reports from database`);
    return deletedCount;
  } catch (error) {
    console.error('Error clearing non-demo reports:', error);
    throw error;
  }
};
