/**
 * DATE & STREAK UTILITY SERVICE
 * Implements "Bulletproof" Logic for Timezones and Streak Freezes.
 */

// 1. Normalize Date (4 AM Boundary for Night Owls)
export const getFlowDate = (): string => {
  const now = new Date();
  // If it's before 4 AM, count it as the previous day
  if (now.getHours() < 4) {
    now.setDate(now.getDate() - 1);
  }
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 2. Subtract Days safely
export const subtractDays = (dateStr: string, days: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Create date in UTC to prevent timezone offsets and DST issues
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - days);
  
  const newY = date.getUTCFullYear();
  const newM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const newD = String(date.getUTCDate()).padStart(2, '0');
  return `${newY}-${newM}-${newD}`;
};

// Helper: Check if there are prior completions within freeze inventory reach
const hasPriorCompletions = (history: Record<string, boolean>, startDateStr: string, maxLookahead: number): boolean => {
  for (let k = 1; k <= maxLookahead; k++) {
    const priorDate = subtractDays(startDateStr, k);
    if (history[priorDate]) return true;
  }
  return false;
};

// 3. The Master Algorithm
export const calculateStreak = (
  history: Record<string, boolean>, 
  freezeInventory: number = 0
): { currentStreak: number; freezesUsed: number; isFrozen: boolean } => {
  
  let streak = 0;
  let freezesUsed = 0;
  let isFrozen = false;
  let remainingFreezes = freezeInventory;
  
  const today = getFlowDate();
  
  // Day 0: Check Today
  if (history[today]) {
    streak++;
  }

  // Iterate backwards efficiently
  for (let i = 1; i < 365; i++) {
    const checkDate = subtractDays(today, i);
    const completed = history[checkDate];

    if (completed) {
      streak++;
    } else {
      // MISSED DAY -> Only consume freeze if there are completions further back
      if (remainingFreezes > 0 && hasPriorCompletions(history, checkDate, remainingFreezes)) {
        remainingFreezes--;
        freezesUsed++;
        isFrozen = true;
      } else {
        // No freezes left or no prior completions to connect to -> chain broken
        break;
      }
    }
  }

  return { currentStreak: streak, freezesUsed, isFrozen };
};

export const calculateVelocity = (history: Record<string, boolean>): number => {
  const today = getFlowDate();
  let completed = 0;
  const days = 30;
  
  for (let i = 0; i < days; i++) {
     const checkDate = subtractDays(today, i);
     if (history[checkDate]) completed++;
  }
  
  return (completed / days) * 100;
};
