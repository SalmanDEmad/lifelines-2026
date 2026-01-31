import { create } from 'zustand';
import { Report, getAllReports, saveReport as dbSaveReport, getUnsyncedReports as dbGetUnsyncedReports, markSynced as dbMarkSynced, deleteReport as dbDeleteReport, clearNonDemoReports as dbClearNonDemoReports, updateReportId as dbUpdateReportId } from '../utils/database';

interface ReportState {
  localReports: Report[];
  unsyncedCount: number;
  currentReport: Report | null;
  isSyncing: boolean;
  
  addLocalReport: (report: Omit<Report, 'id' | 'synced'>) => Promise<void>;
  loadReportsFromDB: () => Promise<void>;
  getUnsyncedReports: () => Promise<Report[]>;
  getLocalReport: (reportId: string) => Promise<Report | undefined>;
  markSynced: (reportId: string) => Promise<void>;
  updateReportId: (oldId: string, newId: string) => Promise<void>;
  setCurrentReport: (report: Report | null) => void;
  clearCurrentReport: () => void;
  deleteLocalReport: (reportId: string) => Promise<void>;
  setIsSyncing: (syncing: boolean) => void;
  clearNonDemoReports: () => Promise<number>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  localReports: [],
  unsyncedCount: 0,
  currentReport: null,
  isSyncing: false,

  addLocalReport: async (report: Omit<Report, 'id' | 'synced'>) => {
    try {
      const fullReport: Report = {
        id: '',
        ...report,
        synced: 0,
      };
      
      await dbSaveReport(fullReport);
      
      // Reload reports from DB
      await get().loadReportsFromDB();
    } catch (error) {
      console.error('Error adding report:', error);
      throw error;
    }
  },

  loadReportsFromDB: async () => {
    try {
      const reports = await getAllReports();
      const unsyncedCount = reports.filter((r) => r.synced === 0).length;
      set({ localReports: reports, unsyncedCount });
    } catch (error) {
      console.error('Error loading reports from DB:', error);
    }
  },

  getUnsyncedReports: async () => {
    try {
      return await dbGetUnsyncedReports();
    } catch (error) {
      console.error('Error getting unsynced reports:', error);
      return [];
    }
  },

  getLocalReport: async (reportId: string) => {
    try {
      // Check if report exists in current state
      const report = get().localReports.find(r => r.id === reportId);
      return report;
    } catch (error) {
      console.error('Error getting local report:', error);
      return undefined;
    }
  },

  markSynced: async (reportId: string) => {
    try {
      await dbMarkSynced(reportId);
      const updatedReports = get().localReports.map((r) =>
        r.id === reportId ? { ...r, synced: 1 as 0 | 1 } : r
      );
      const unsyncedCount = updatedReports.filter((r) => r.synced === 0).length;
      set({ localReports: updatedReports, unsyncedCount });
    } catch (error) {
      console.error('Error marking report as synced:', error);
    }
  },

  updateReportId: async (oldId: string, newId: string) => {
    try {
      await dbUpdateReportId(oldId, newId);
      const updatedReports = get().localReports.map((r) =>
        r.id === oldId ? { ...r, id: newId } : r
      );
      set({ localReports: updatedReports });
      console.log(`[STORE] Report ID updated: ${oldId} -> ${newId}`);
    } catch (error) {
      console.error('Error updating report ID:', error);
    }
  },

  deleteLocalReport: async (reportId: string) => {
    try {
      await dbDeleteReport(reportId);
      await get().loadReportsFromDB();
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  setCurrentReport: (report: Report | null) => {
    set({ currentReport: report });
  },

  clearCurrentReport: () => {
    set({ currentReport: null });
  },

  setIsSyncing: (syncing: boolean) => {
    set({ isSyncing: syncing });
  },

  clearNonDemoReports: async () => {
    try {
      const deletedCount = await dbClearNonDemoReports();
      // Reload reports to update the state
      await get().loadReportsFromDB();
      return deletedCount;
    } catch (error) {
      console.error('Error clearing non-demo reports:', error);
      throw error;
    }
  },
}));
