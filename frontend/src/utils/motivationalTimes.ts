// USA Swimming 2024-2028 National Age Group Motivational Time Standards
// Standards are in seconds for each event/age group/gender combination
// Levels: B (top 55%), BB (top 35%), A (top 15%), AA (top 8%), AAA (top 6%), AAAA (top 2%)

export interface MotivationalStandard {
  B: number;
  BB: number;
  A: number;
  AA: number;
  AAA: number;
  AAAA: number;
}

export type AchievementLevel = 'B' | 'BB' | 'A' | 'AA' | 'AAA' | 'AAAA' | null;

// Convert time string (MM:SS.ss or SS.ss) to seconds
const t = (time: string): number => {
  if (time.includes(':')) {
    const [min, sec] = time.split(':');
    return parseFloat(min) * 60 + parseFloat(sec);
  }
  return parseFloat(time);
};

// SCY Standards for 11-12 Boys
const SCY_11_12_M: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('32.69'), BB: t('30.39'), A: t('28.29'), AA: t('27.09'), AAA: t('25.89'), AAAA: t('24.79') },
  '100 Free': { B: t('1:11.89'), BB: t('1:06.49'), A: t('1:02.69'), AA: t('1:00.09'), AAA: t('57.69'), AAAA: t('55.49') },
  '200 Free': { B: t('2:38.99'), BB: t('2:27.49'), A: t('2:18.29'), AA: t('2:12.49'), AAA: t('2:06.19'), AAAA: t('2:01.09') },
  '500 Free': { B: t('7:03.49'), BB: t('6:32.79'), A: t('6:08.29'), AA: t('5:52.09'), AAA: t('5:34.39'), AAAA: t('5:20.19') },
  '50 Back': { B: t('38.59'), BB: t('35.89'), A: t('33.59'), AA: t('32.19'), AAA: t('30.79'), AAAA: t('29.59') },
  '100 Back': { B: t('1:20.09'), BB: t('1:16.29'), A: t('1:12.89'), AA: t('1:10.49'), AAA: t('1:07.29'), AAAA: t('1:04.89') },
  '50 Breast': { B: t('42.49'), BB: t('39.59'), A: t('37.09'), AA: t('35.59'), AAA: t('34.09'), AAAA: t('32.79') },
  '100 Breast': { B: t('1:23.99'), BB: t('1:20.19'), A: t('1:16.69'), AA: t('1:14.09'), AAA: t('1:10.89'), AAAA: t('1:08.29') },
  '50 Fly': { B: t('36.69'), BB: t('34.19'), A: t('32.09'), AA: t('30.79'), AAA: t('29.49'), AAAA: t('28.39') },
  '100 Fly': { B: t('1:27.89'), BB: t('1:23.09'), A: t('1:18.99'), AA: t('1:16.09'), AAA: t('1:12.49'), AAAA: t('1:09.89') },
  '100 IM': { B: t('1:27.39'), BB: t('1:22.69'), A: t('1:19.09'), AA: t('1:16.39'), AAA: t('1:12.89'), AAAA: t('1:10.09') },
  '200 IM': { B: t('3:05.29'), BB: t('2:52.69'), A: t('2:43.09'), AA: t('2:36.59'), AAA: t('2:29.29'), AAAA: t('2:23.49') },
};

// SCY Standards for 11-12 Girls
const SCY_11_12_F: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('32.09'), BB: t('29.89'), A: t('27.89'), AA: t('26.69'), AAA: t('25.59'), AAAA: t('24.59') },
  '100 Free': { B: t('1:10.19'), BB: t('1:05.09'), A: t('1:01.39'), AA: t('58.89'), AAA: t('56.59'), AAAA: t('54.49') },
  '200 Free': { B: t('2:35.09'), BB: t('2:24.09'), A: t('2:15.19'), AA: t('2:09.49'), AAA: t('2:03.49'), AAAA: t('1:58.49') },
  '500 Free': { B: t('6:53.79'), BB: t('6:24.19'), A: t('6:00.49'), AA: t('5:44.89'), AAA: t('5:28.09'), AAAA: t('5:14.29') },
  '50 Back': { B: t('38.29'), BB: t('35.59'), A: t('33.29'), AA: t('31.89'), AAA: t('30.59'), AAAA: t('29.39') },
  '100 Back': { B: t('1:19.09'), BB: t('1:15.39'), A: t('1:11.99'), AA: t('1:09.59'), AAA: t('1:06.49'), AAAA: t('1:04.09') },
  '50 Breast': { B: t('42.99'), BB: t('40.09'), A: t('37.49'), AA: t('35.99'), AAA: t('34.49'), AAAA: t('33.09') },
  '100 Breast': { B: t('1:26.09'), BB: t('1:22.19'), A: t('1:18.59'), AA: t('1:15.89'), AAA: t('1:12.59'), AAAA: t('1:09.89') },
  '50 Fly': { B: t('36.49'), BB: t('33.99'), A: t('31.89'), AA: t('30.59'), AAA: t('29.29'), AAAA: t('28.19') },
  '100 Fly': { B: t('1:24.59'), BB: t('1:20.09'), A: t('1:16.19'), AA: t('1:13.39'), AAA: t('1:10.09'), AAAA: t('1:07.49') },
  '100 IM': { B: t('1:24.79'), BB: t('1:20.29'), A: t('1:16.79'), AA: t('1:14.19'), AAA: t('1:10.89'), AAAA: t('1:08.19') },
  '200 IM': { B: t('3:00.39'), BB: t('2:48.49'), A: t('2:39.19'), AA: t('2:32.89'), AAA: t('2:25.99'), AAAA: t('2:20.29') },
};

// SCY Standards for 10 & Under Boys
const SCY_10U_M: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('38.69'), BB: t('35.89'), A: t('33.49'), AA: t('32.09'), AAA: t('30.69'), AAAA: t('29.49') },
  '100 Free': { B: t('1:26.49'), BB: t('1:19.99'), A: t('1:15.19'), AA: t('1:12.09'), AAA: t('1:08.79'), AAAA: t('1:06.09') },
  '200 Free': { B: t('3:09.79'), BB: t('2:56.29'), A: t('2:45.49'), AA: t('2:38.49'), AAA: t('2:31.19'), AAAA: t('2:25.09') },
  '50 Back': { B: t('45.89'), BB: t('42.59'), A: t('39.79'), AA: t('38.19'), AAA: t('36.49'), AAAA: t('35.09') },
  '100 Back': { B: t('1:35.79'), BB: t('1:31.09'), A: t('1:26.89'), AA: t('1:23.99'), AAA: t('1:20.19'), AAAA: t('1:17.19') },
  '50 Breast': { B: t('51.39'), BB: t('47.69'), A: t('44.49'), AA: t('42.69'), AAA: t('40.79'), AAAA: t('39.19') },
  '100 Breast': { B: t('1:49.49'), BB: t('1:44.19'), A: t('1:39.49'), AA: t('1:36.29'), AAA: t('1:32.49'), AAAA: t('1:29.39') },
  '50 Fly': { B: t('44.09'), BB: t('40.99'), A: t('38.29'), AA: t('36.69'), AAA: t('35.09'), AAAA: t('33.69') },
  '100 Fly': { B: t('1:46.99'), BB: t('1:41.39'), A: t('1:36.49'), AA: t('1:33.19'), AAA: t('1:29.09'), AAAA: t('1:25.89') },
  '100 IM': { B: t('1:39.79'), BB: t('1:34.39'), A: t('1:30.19'), AA: t('1:27.19'), AAA: t('1:23.49'), AAAA: t('1:20.49') },
  '200 IM': { B: t('3:34.59'), BB: t('3:19.69'), A: t('3:08.59'), AA: t('3:01.29'), AAA: t('2:53.29'), AAAA: t('2:46.79') },
};

// SCY Standards for 10 & Under Girls
const SCY_10U_F: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('37.59'), BB: t('34.89'), A: t('32.59'), AA: t('31.19'), AAA: t('29.89'), AAAA: t('28.69') },
  '100 Free': { B: t('1:22.89'), BB: t('1:16.99'), A: t('1:12.49'), AA: t('1:09.49'), AAA: t('1:06.39'), AAAA: t('1:03.79') },
  '200 Free': { B: t('3:02.59'), BB: t('2:49.99'), A: t('2:39.89'), AA: t('2:33.29'), AAA: t('2:26.29'), AAAA: t('2:20.49') },
  '50 Back': { B: t('44.49'), BB: t('41.39'), A: t('38.69'), AA: t('37.09'), AAA: t('35.49'), AAAA: t('34.09') },
  '100 Back': { B: t('1:32.29'), BB: t('1:27.89'), A: t('1:23.89'), AA: t('1:21.09'), AAA: t('1:17.49'), AAAA: t('1:14.59') },
  '50 Breast': { B: t('50.89'), BB: t('47.29'), A: t('44.19'), AA: t('42.39'), AAA: t('40.59'), AAAA: t('38.99') },
  '100 Breast': { B: t('1:48.49'), BB: t('1:43.29'), A: t('1:38.69'), AA: t('1:35.49'), AAA: t('1:31.79'), AAAA: t('1:28.69') },
  '50 Fly': { B: t('42.79'), BB: t('39.79'), A: t('37.19'), AA: t('35.69'), AAA: t('34.09'), AAAA: t('32.79') },
  '100 Fly': { B: t('1:40.79'), BB: t('1:35.59'), A: t('1:31.09'), AA: t('1:28.09'), AAA: t('1:24.39'), AAAA: t('1:21.39') },
  '100 IM': { B: t('1:35.49'), BB: t('1:30.49'), A: t('1:26.49'), AA: t('1:23.69'), AAA: t('1:20.19'), AAAA: t('1:17.29') },
  '200 IM': { B: t('3:26.29'), BB: t('3:12.19'), A: t('3:01.69'), AA: t('2:54.69'), AAA: t('2:47.09'), AAAA: t('2:40.79') },
};

// SCY Standards for 13-14 Boys
const SCY_13_14_M: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('28.09'), BB: t('26.09'), A: t('24.39'), AA: t('23.39'), AAA: t('22.39'), AAAA: t('21.49') },
  '100 Free': { B: t('1:01.19'), BB: t('56.79'), A: t('53.49'), AA: t('51.29'), AAA: t('49.09'), AAAA: t('47.19') },
  '200 Free': { B: t('2:14.59'), BB: t('2:04.89'), A: t('1:57.29'), AA: t('1:52.29'), AAA: t('1:47.09'), AAAA: t('1:42.79') },
  '500 Free': { B: t('5:59.59'), BB: t('5:33.89'), A: t('5:12.89'), AA: t('4:59.19'), AAA: t('4:44.69'), AAAA: t('4:32.49') },
  '50 Back': { B: t('33.19'), BB: t('30.79'), A: t('28.79'), AA: t('27.59'), AAA: t('26.39'), AAAA: t('25.39') },
  '100 Back': { B: t('1:09.39'), BB: t('1:06.09'), A: t('1:03.09'), AA: t('1:01.09'), AAA: t('58.39'), AAAA: t('56.19') },
  '50 Breast': { B: t('36.09'), BB: t('33.59'), A: t('31.49'), AA: t('30.19'), AAA: t('28.89'), AAAA: t('27.79') },
  '100 Breast': { B: t('1:17.09'), BB: t('1:13.79'), A: t('1:10.79'), AA: t('1:08.49'), AAA: t('1:05.69'), AAAA: t('1:03.39') },
  '50 Fly': { B: t('31.09'), BB: t('28.89'), A: t('27.09'), AA: t('25.99'), AAA: t('24.89'), AAAA: t('23.89') },
  '100 Fly': { B: t('1:10.99'), BB: t('1:06.19'), A: t('1:02.29'), AA: t('59.69'), AAA: t('56.79'), AAAA: t('54.49') },
  '100 IM': { B: t('1:12.49'), BB: t('1:08.49'), A: t('1:05.29'), AA: t('1:03.09'), AAA: t('1:00.29'), AAAA: t('57.99') },
  '200 IM': { B: t('2:35.59'), BB: t('2:24.69'), A: t('2:16.09'), AA: t('2:10.49'), AAA: t('2:04.39'), AAAA: t('1:59.19') },
};

// SCY Standards for 13-14 Girls
const SCY_13_14_F: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('28.89'), BB: t('26.89'), A: t('25.09'), AA: t('24.09'), AAA: t('23.09'), AAAA: t('22.19') },
  '100 Free': { B: t('1:02.69'), BB: t('58.19'), A: t('54.89'), AA: t('52.69'), AAA: t('50.49'), AAAA: t('48.59') },
  '200 Free': { B: t('2:17.69'), BB: t('2:07.69'), A: t('1:59.89'), AA: t('1:54.69'), AAA: t('1:49.29'), AAAA: t('1:44.79') },
  '500 Free': { B: t('6:05.99'), BB: t('5:39.79'), A: t('5:18.39'), AA: t('5:04.39'), AAA: t('4:49.49'), AAAA: t('4:37.09') },
  '50 Back': { B: t('34.29'), BB: t('31.89'), A: t('29.79'), AA: t('28.59'), AAA: t('27.39'), AAAA: t('26.29') },
  '100 Back': { B: t('1:11.09'), BB: t('1:07.69'), A: t('1:04.59'), AA: t('1:02.49'), AAA: t('59.79'), AAAA: t('57.49') },
  '50 Breast': { B: t('38.19'), BB: t('35.59'), A: t('33.29'), AA: t('31.89'), AAA: t('30.59'), AAAA: t('29.39') },
  '100 Breast': { B: t('1:20.39'), BB: t('1:16.89'), A: t('1:13.69'), AA: t('1:11.29'), AAA: t('1:08.39'), AAAA: t('1:05.99') },
  '50 Fly': { B: t('32.09'), BB: t('29.89'), A: t('27.99'), AA: t('26.89'), AAA: t('25.69'), AAAA: t('24.69') },
  '100 Fly': { B: t('1:12.29'), BB: t('1:07.39'), A: t('1:03.39'), AA: t('1:00.69'), AAA: t('57.69'), AAAA: t('55.29') },
  '100 IM': { B: t('1:14.39'), BB: t('1:10.29'), A: t('1:06.99'), AA: t('1:04.69'), AAA: t('1:01.79'), AAAA: t('59.39') },
  '200 IM': { B: t('2:40.09'), BB: t('2:28.89'), A: t('2:20.09'), AA: t('2:14.29'), AAA: t('2:07.99'), AAAA: t('2:02.69') },
};

// All standards organized by course, age group, and gender
const MOTIVATIONAL_STANDARDS: Record<string, Record<string, Record<string, Record<string, MotivationalStandard>>>> = {
  SCY: {
    '10U': { M: SCY_10U_M, F: SCY_10U_F },
    '11-12': { M: SCY_11_12_M, F: SCY_11_12_F },
    '13-14': { M: SCY_13_14_M, F: SCY_13_14_F },
  }
};

/**
 * Get the achievement level for a given time
 * @param timeSeconds - Swimmer's time in seconds
 * @param eventName - Event name (e.g., "50 Free", "100 Back")
 * @param ageGroup - Age group (e.g., "10U", "11-12", "13-14")
 * @param gender - Gender ("M" or "F")
 * @param course - Course type ("SCY", "SCM", "LCM") - currently only SCY supported
 * @returns Achievement level or null if not found
 */
export function getAchievementLevel(
  timeSeconds: number,
  eventName: string,
  ageGroup: string,
  gender: 'M' | 'F',
  course: string = 'SCY'
): AchievementLevel {
  const courseStandards = MOTIVATIONAL_STANDARDS[course];
  if (!courseStandards) return null;
  
  const ageStandards = courseStandards[ageGroup];
  if (!ageStandards) return null;
  
  const genderStandards = ageStandards[gender];
  if (!genderStandards) return null;
  
  const eventStandards = genderStandards[eventName];
  if (!eventStandards) return null;
  
  // Check from fastest to slowest
  if (timeSeconds <= eventStandards.AAAA) return 'AAAA';
  if (timeSeconds <= eventStandards.AAA) return 'AAA';
  if (timeSeconds <= eventStandards.AA) return 'AA';
  if (timeSeconds <= eventStandards.A) return 'A';
  if (timeSeconds <= eventStandards.BB) return 'BB';
  if (timeSeconds <= eventStandards.B) return 'B';
  
  return null; // Time doesn't meet B standard
}

/**
 * Get the next achievement level to work towards
 * @returns Object with next level and time needed, or null if already at AAAA
 */
export function getNextLevel(
  timeSeconds: number,
  eventName: string,
  ageGroup: string,
  gender: 'M' | 'F',
  course: string = 'SCY'
): { level: AchievementLevel; timeNeeded: number } | null {
  const courseStandards = MOTIVATIONAL_STANDARDS[course];
  if (!courseStandards) return null;
  
  const ageStandards = courseStandards[ageGroup];
  if (!ageStandards) return null;
  
  const genderStandards = ageStandards[gender];
  if (!genderStandards) return null;
  
  const eventStandards = genderStandards[eventName];
  if (!eventStandards) return null;
  
  const currentLevel = getAchievementLevel(timeSeconds, eventName, ageGroup, gender, course);
  
  // Determine next level
  const levels: AchievementLevel[] = ['B', 'BB', 'A', 'AA', 'AAA', 'AAAA'];
  
  if (currentLevel === 'AAAA') return null; // Already at top
  
  if (currentLevel === null) {
    return { level: 'B', timeNeeded: eventStandards.B };
  }
  
  const currentIndex = levels.indexOf(currentLevel);
  const nextLevel = levels[currentIndex + 1];
  
  return {
    level: nextLevel,
    timeNeeded: eventStandards[nextLevel as keyof MotivationalStandard]
  };
}

/**
 * Get color scheme for achievement level
 */
export function getLevelColor(level: AchievementLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case 'AAAA':
      return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400' };
    case 'AAA':
      return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400' };
    case 'AA':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' };
    case 'A':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-400' };
    case 'BB':
      return { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-400' };
    case 'B':
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-400' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-300' };
  }
}

/**
 * Get percentile description for achievement level
 */
export function getLevelDescription(level: AchievementLevel): string {
  switch (level) {
    case 'AAAA': return 'Top 2% nationally';
    case 'AAA': return 'Top 6% nationally';
    case 'AA': return 'Top 8% nationally';
    case 'A': return 'Top 15% nationally';
    case 'BB': return 'Top 35% nationally';
    case 'B': return 'Top 55% nationally';
    default: return '';
  }
}
