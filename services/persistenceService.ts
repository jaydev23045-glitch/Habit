
import { AppData, Task, HistoricalReport, ReportRange } from '../types';
import { v4 as uuidv4 } from 'uuid';

const ARCHIVE_AGE_DAYS = 30;

export const performDataHygiene = (data: AppData): AppData => {
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(now.getDate() - ARCHIVE_AGE_DAYS);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const tasksToArchive = data.tasks.filter(t => t.completed && t.date < cutoffStr);
  const activeTasks = data.tasks.filter(t => !t.completed || t.date >= cutoffStr);

  if (tasksToArchive.length === 0) return data;

  console.log(`[Flow OS Cloud] Archiving ${tasksToArchive.length} tasks to cold storage.`);

  const updatedArchives = [...(data.archivedTasks || []), ...tasksToArchive];

  return {
    ...data,
    tasks: activeTasks,
    archivedTasks: updatedArchives
  };
};

export const checkLongAbsence = (lastLogin?: string): boolean => {
  if (!lastLogin) return false;
  const last = new Date(lastLogin);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays > 7;
};

export const getReportTriggers = (lastLogin?: string): ReportRange[] => {
  if (!lastLogin) return [];
  const last = new Date(lastLogin);
  const now = new Date();
  const triggers: ReportRange[] = [];

  // Monthly check
  if (last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear()) {
    triggers.push('month');
  }

  // 6 Month check (H1: Jan-Jun, H2: Jul-Dec)
  const lastHalf = last.getMonth() < 6 ? 0 : 1;
  const currentHalf = now.getMonth() < 6 ? 0 : 1;
  if (lastHalf !== currentHalf || last.getFullYear() !== now.getFullYear()) {
    triggers.push('6month');
  }

  // Yearly check
  if (last.getFullYear() !== now.getFullYear()) {
    triggers.push('year');
  }

  return triggers;
};
