// backend/src/services/streakService.js
// Service for calculating streaks, calendar differences, and Streak Freeze protections

/**
 * Normalizes any Date object or ISO string to a UTC 'YYYY-MM-DD' string.
 * This eliminates timezone shifts and time-of-day discrepancies.
 */
function toDateString(dateObj) {
  const d = new Date(dateObj);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes a date to UTC midnight Date object for PostgreSQL storage
 */
function toMidnightUTCDate(dateObj = new Date()) {
  const dateStr = toDateString(dateObj);
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Calculates the difference in calendar days between two 'YYYY-MM-DD' strings.
 * e.g., daysBetween('2026-11-08', '2026-11-09') === 1
 */
function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(`${dateStr1}T00:00:00Z`);
  const d2 = new Date(`${dateStr2}T00:00:00Z`);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Computes streak statistics from check-ins and used streak freezes.
 * A Streak Freeze shields a missed day, preserving the consecutive streak unbroken.
 * 
 * @param {Array} checkIns - Array of checkIn records with 'date' field
 * @param {number} duration - Challenge duration in days (default: 30)
 * @param {Array} streakFreezes - Array of streak freeze records with 'date' field
 * @returns {Object} { totalCheckIns, currentStreak, longestStreak, progressPercentage, completedDates, frozenDates, freezesUsed }
 */
function calculateStreaks(checkIns = [], duration = 30, streakFreezes = []) {
  const checkInDateSet = new Set();
  (checkIns || []).forEach((c) => {
    if (c && c.date) {
      checkInDateSet.add(toDateString(c.date));
    }
  });

  const frozenDateSet = new Set();
  (streakFreezes || []).forEach((f) => {
    if (f && f.date) {
      frozenDateSet.add(toDateString(f.date));
    }
  });

  // Combined set of days where either a check-in occurred OR a freeze was applied
  const combinedActiveSet = new Set([...checkInDateSet, ...frozenDateSet]);
  const sortedDates = Array.from(combinedActiveSet).sort();
  const totalCheckIns = checkInDateSet.size;

  if (sortedDates.length === 0) {
    return {
      totalCheckIns: 0,
      currentStreak: 0,
      longestStreak: 0,
      progressPercentage: 0,
      completedDates: [],
      frozenDates: [],
      freezesUsed: 0,
    };
  }

  // 1. Calculate Longest Streak (across combined active & frozen days)
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = daysBetween(sortedDates[i - 1], sortedDates[i]);
    if (diff === 1) {
      tempStreak++;
    } else if (diff > 1) {
      tempStreak = 1; // Streak broken
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  // 2. Calculate Current Streak
  const todayStr = toDateString(new Date());
  const lastActiveDate = sortedDates[sortedDates.length - 1];
  const daysSinceLastActive = daysBetween(lastActiveDate, todayStr);

  let currentStreak = 0;

  // Streak is alive if the most recent active or frozen day was TODAY (0) or YESTERDAY (1)
  if (daysSinceLastActive === 0 || daysSinceLastActive === 1) {
    currentStreak = 1;
    // Walk backwards counting consecutive days
    for (let i = sortedDates.length - 1; i > 0; i--) {
      const diff = daysBetween(sortedDates[i - 1], sortedDates[i]);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    // 2 or more days have elapsed since last check-in or freeze
    currentStreak = 0;
  }

  const progressPercentage = duration > 0
    ? Math.min(100, Math.round((totalCheckIns / duration) * 100))
    : 0;

  return {
    totalCheckIns,
    currentStreak,
    longestStreak,
    progressPercentage,
    completedDates: Array.from(checkInDateSet).sort(),
    frozenDates: Array.from(frozenDateSet).sort(),
    freezesUsed: frozenDateSet.size,
  };
}

module.exports = {
  toDateString,
  toMidnightUTCDate,
  daysBetween,
  calculateStreaks,
};
