
import { useMemo } from 'react';
import { UserProfile } from '../types';

export const useCharacter = (user: UserProfile) => {
  const levelData = useMemo(() => {
    // Level Formula: Level = floor(sqrt(XP / 100))
    // Example: 100 XP = Lvl 1, 400 XP = Lvl 2, 900 XP = Lvl 3
    const rawXp = user?.xp ?? 0;
    const xp = Math.max(0, isNaN(rawXp) ? 0 : rawXp);
    const level = Math.floor(Math.sqrt(xp / 100));
    
    const currentLevelBaseXp = Math.pow(level, 2) * 100;
    const nextLevelXp = Math.pow(level + 1, 2) * 100;
    const xpNeededForNext = nextLevelXp - currentLevelBaseXp || 100;
    const currentProgressXp = xp - currentLevelBaseXp;
    
    const progressPercent = Math.min(100, Math.max(0, (currentProgressXp / xpNeededForNext) * 100));

    return {
      level,
      currentLevelBaseXp,
      nextLevelXp,
      progressPercent
    };
  }, [user.xp]);

  return levelData;
};
