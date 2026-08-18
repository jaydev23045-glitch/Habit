
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

// 3. The Master Algorithm
export const calculateStreak = (
  history: Record<string, boolean>, 
  freezeInventory: number = 0
): { currentStreak: number; freezesUsed: number; isFrozen: boolean } => {
  
  let streak = 0;
  let freezesUsed = 0;
  let isFrozen = false;
  
  const today = getFlowDate();
  
  // Day 0: Check Today
  if (history[today]) {
    streak++;
  }

  // Iterate backwards efficiently
  // We check up to 365 days or until broken
  for (let i = 1; i < 365; i++) {
    const checkDate = subtractDays(today, i);
    const completed = history[checkDate];

    if (completed) {
      streak++;
    } else {
      // MISSED DAY -> Check Freeze Logic
      if (freezeInventory > 0) {
        freezeInventory--; // Consume a freeze
        freezesUsed++;
        isFrozen = true; 
        // We do NOT increment streak on a frozen day, 
        // but we continue the chain (it bridges the gap)
      } else {
        // No freezes left, chain broken
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
