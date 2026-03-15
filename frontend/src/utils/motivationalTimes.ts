// USA Swimming 2024-2028 National Age Group Motivational Time Standards
// Standards are in seconds for each event/age group/gender combination
// Levels: B (top 55%), BB (top 35%), A (top 15%), AA (top 8%), AAA (top 6%), AAAA (top 2%)
// Source: https://swimgoals.app/guides/motivational-times (Official USA Swimming data)

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

// SCY Standards for 11-12 Boys (OFFICIAL 2024-2028)
const SCY_11_12_M: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('32.79'), BB: t('30.49'), A: t('28.09'), AA: t('26.99'), AAA: t('25.79'), AAAA: t('24.59') },
  '100 Free': { B: t('1:11.49'), BB: t('1:06.39'), A: t('1:01.29'), AA: t('58.69'), AAA: t('56.19'), AAAA: t('53.59') },
  '200 Free': { B: t('2:35.99'), BB: t('2:24.89'), A: t('2:13.69'), AA: t('2:08.19'), AAA: t('2:02.59'), AAAA: t('1:56.99') },
  '500 Free': { B: t('6:59.89'), BB: t('6:29.99'), A: t('5:59.99'), AA: t('5:44.99'), AAA: t('5:29.99'), AAAA: t('5:14.99') },
  '1000 Free': { B: t('14:43.49'), BB: t('13:40.39'), A: t('12:37.29'), AA: t('12:05.79'), AAA: t('11:34.19'), AAAA: t('11:02.59') },
  '1650 Free': { B: t('24:27.69'), BB: t('22:42.89'), A: t('20:58.09'), AA: t('20:05.59'), AAA: t('19:13.19'), AAAA: t('18:20.79') },
  '50 Back': { B: t('38.49'), BB: t('35.59'), A: t('32.69'), AA: t('31.19'), AAA: t('29.69'), AAAA: t('28.19') },
  '100 Back': { B: t('1:22.19'), BB: t('1:15.69'), A: t('1:09.29'), AA: t('1:05.99'), AAA: t('1:02.79'), AAAA: t('59.49') },
  '200 Back': { B: t('2:52.89'), BB: t('2:40.49'), A: t('2:28.19'), AA: t('2:21.99'), AAA: t('2:15.89'), AAAA: t('2:09.69') },
  '50 Breast': { B: t('43.49'), BB: t('40.09'), A: t('36.69'), AA: t('34.99'), AAA: t('33.29'), AAAA: t('31.49') },
  '100 Breast': { B: t('1:32.59'), BB: t('1:25.49'), A: t('1:18.39'), AA: t('1:14.89'), AAA: t('1:11.39'), AAAA: t('1:07.79') },
  '200 Breast': { B: t('3:16.39'), BB: t('3:02.39'), A: t('2:48.39'), AA: t('2:41.39'), AAA: t('2:34.39'), AAAA: t('2:27.29') },
  '50 Fly': { B: t('37.09'), BB: t('34.19'), A: t('31.19'), AA: t('29.69'), AAA: t('28.19'), AAAA: t('26.69') },
  '100 Fly': { B: t('1:22.89'), BB: t('1:16.09'), A: t('1:09.29'), AA: t('1:05.89'), AAA: t('1:02.49'), AAAA: t('59.09') },
  '200 Fly': { B: t('2:56.59'), BB: t('2:43.99'), A: t('2:31.39'), AA: t('2:24.99'), AAA: t('2:18.69'), AAAA: t('2:12.39') },
  '100 IM': { B: t('1:21.89'), BB: t('1:15.89'), A: t('1:09.99'), AA: t('1:06.99'), AAA: t('1:03.99'), AAAA: t('1:01.09') },
  '200 IM': { B: t('2:59.29'), BB: t('2:45.79'), A: t('2:32.29'), AA: t('2:25.59'), AAA: t('2:18.79'), AAAA: t('2:12.09') },
  '400 IM': { B: t('6:17.09'), BB: t('5:50.09'), A: t('5:23.19'), AA: t('5:09.79'), AAA: t('4:56.29'), AAAA: t('4:42.79') },
};

// SCY Standards for 11-12 Girls (OFFICIAL 2024-2028)
const SCY_11_12_F: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('33.99'), BB: t('31.69'), A: t('29.29'), AA: t('28.09'), AAA: t('26.99'), AAAA: t('25.79') },
  '100 Free': { B: t('1:14.69'), BB: t('1:09.39'), A: t('1:03.99'), AA: t('1:01.39'), AAA: t('58.69'), AAAA: t('55.99') },
  '200 Free': { B: t('2:42.59'), BB: t('2:30.89'), A: t('2:19.29'), AA: t('2:13.49'), AAA: t('2:07.69'), AAAA: t('2:01.89') },
  '500 Free': { B: t('7:16.89'), BB: t('6:45.69'), A: t('6:14.49'), AA: t('5:58.89'), AAA: t('5:43.29'), AAAA: t('5:27.69') },
  '1000 Free': { B: t('15:02.69'), BB: t('13:58.19'), A: t('12:53.79'), AA: t('12:21.49'), AAA: t('11:49.29'), AAAA: t('11:16.99') },
  '1650 Free': { B: t('25:07.39'), BB: t('23:19.69'), A: t('21:32.09'), AA: t('20:38.19'), AAA: t('19:44.39'), AAAA: t('18:50.59') },
  '50 Back': { B: t('38.79'), BB: t('35.99'), A: t('33.19'), AA: t('31.79'), AAA: t('30.49'), AAAA: t('29.09') },
  '100 Back': { B: t('1:26.59'), BB: t('1:19.79'), A: t('1:12.99'), AA: t('1:09.59'), AAA: t('1:06.19'), AAAA: t('1:02.69') },
  '200 Back': { B: t('2:59.49'), BB: t('2:46.69'), A: t('2:33.89'), AA: t('2:27.49'), AAA: t('2:20.99'), AAAA: t('2:14.59') },
  '50 Breast': { B: t('43.99'), BB: t('40.89'), A: t('37.69'), AA: t('36.19'), AAA: t('34.59'), AAAA: t('32.99') },
  '100 Breast': { B: t('1:36.49'), BB: t('1:29.29'), A: t('1:22.19'), AA: t('1:18.59'), AAA: t('1:15.09'), AAAA: t('1:11.49') },
  '200 Breast': { B: t('3:25.69'), BB: t('3:10.99'), A: t('2:56.29'), AA: t('2:48.99'), AAA: t('2:41.69'), AAAA: t('2:34.29') },
  '50 Fly': { B: t('36.89'), BB: t('34.29'), A: t('31.59'), AA: t('30.29'), AAA: t('28.99'), AAAA: t('27.69') },
  '100 Fly': { B: t('1:25.79'), BB: t('1:18.89'), A: t('1:12.09'), AA: t('1:08.59'), AAA: t('1:05.19'), AAAA: t('1:01.79') },
  '200 Fly': { B: t('3:03.39'), BB: t('2:50.29'), A: t('2:37.19'), AA: t('2:30.59'), AAA: t('2:24.09'), AAAA: t('2:17.59') },
  '100 IM': { B: t('1:25.19'), BB: t('1:19.09'), A: t('1:13.09'), AA: t('1:09.99'), AAA: t('1:06.99'), AAAA: t('1:03.89') },
  '200 IM': { B: t('3:03.89'), BB: t('2:50.69'), A: t('2:37.59'), AA: t('2:30.99'), AAA: t('2:24.49'), AAAA: t('2:17.89') },
  '400 IM': { B: t('6:31.69'), BB: t('6:03.69'), A: t('5:35.79'), AA: t('5:21.79'), AAA: t('5:07.79'), AAAA: t('4:53.79') },
};

// SCY Standards for 10 & Under Boys (OFFICIAL 2024-2028)
const SCY_10U_M: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('38.19'), BB: t('34.59'), A: t('31.09'), AA: t('29.89'), AAA: t('28.69'), AAAA: t('27.49') },
  '100 Free': { B: t('1:27.99'), BB: t('1:18.89'), A: t('1:09.79'), AA: t('1:06.79'), AAA: t('1:03.79'), AAAA: t('1:00.69') },
  '200 Free': { B: t('3:09.49'), BB: t('2:50.59'), A: t('2:31.59'), AA: t('2:25.29'), AAA: t('2:18.99'), AAAA: t('2:12.69') },
  '500 Free': { B: t('8:24.29'), BB: t('7:33.79'), A: t('6:43.39'), AA: t('6:26.59'), AAA: t('6:09.79'), AAAA: t('5:52.99') },
  '50 Back': { B: t('48.29'), BB: t('42.89'), A: t('37.59'), AA: t('35.79'), AAA: t('33.99'), AAAA: t('32.19') },
  '100 Back': { B: t('1:40.69'), BB: t('1:30.09'), A: t('1:19.59'), AA: t('1:16.09'), AAA: t('1:12.49'), AAAA: t('1:08.99') },
  '50 Breast': { B: t('53.39'), BB: t('47.69'), A: t('42.09'), AA: t('40.19'), AAA: t('38.29'), AAAA: t('36.39') },
  '100 Breast': { B: t('1:54.09'), BB: t('1:42.29'), A: t('1:30.59'), AA: t('1:26.59'), AAA: t('1:22.69'), AAAA: t('1:18.79') },
  '50 Fly': { B: t('46.49'), BB: t('41.29'), A: t('35.99'), AA: t('34.29'), AAA: t('32.59'), AAAA: t('30.79') },
  '100 Fly': { B: t('1:53.49'), BB: t('1:38.99'), A: t('1:24.39'), AA: t('1:19.49'), AAA: t('1:14.59'), AAAA: t('1:09.79') },
  '100 IM': { B: t('1:39.69'), BB: t('1:29.69'), A: t('1:19.69'), AA: t('1:16.39'), AAA: t('1:13.09'), AAAA: t('1:09.79') },
  '200 IM': { B: t('3:38.59'), BB: t('3:15.99'), A: t('2:53.49'), AA: t('2:45.89'), AAA: t('2:38.39'), AAAA: t('2:30.89') },
};

// SCY Standards for 10 & Under Girls (OFFICIAL 2024-2028)
const SCY_10U_F: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('39.79'), BB: t('35.99'), A: t('32.09'), AA: t('30.89'), AAA: t('29.59'), AAAA: t('28.29') },
  '100 Free': { B: t('1:30.79'), BB: t('1:21.09'), A: t('1:11.49'), AA: t('1:08.29'), AAA: t('1:04.99'), AAAA: t('1:01.79') },
  '200 Free': { B: t('3:22.79'), BB: t('3:00.59'), A: t('2:38.39'), AA: t('2:30.99'), AAA: t('2:23.59'), AAAA: t('2:16.19') },
  '500 Free': { B: t('8:36.69'), BB: t('7:45.09'), A: t('6:53.39'), AA: t('6:36.19'), AAA: t('6:18.99'), AAAA: t('6:01.69') },
  '50 Back': { B: t('48.59'), BB: t('43.29'), A: t('37.99'), AA: t('36.19'), AAA: t('34.39'), AAAA: t('32.59') },
  '100 Back': { B: t('1:45.79'), BB: t('1:33.99'), A: t('1:22.29'), AA: t('1:18.39'), AAA: t('1:14.49'), AAAA: t('1:10.59') },
  '50 Breast': { B: t('54.59'), BB: t('48.69'), A: t('42.79'), AA: t('40.89'), AAA: t('38.89'), AAAA: t('36.89') },
  '100 Breast': { B: t('2:00.29'), BB: t('1:46.89'), A: t('1:33.59'), AA: t('1:29.09'), AAA: t('1:24.69'), AAAA: t('1:20.19') },
  '50 Fly': { B: t('48.39'), BB: t('42.69'), A: t('36.99'), AA: t('35.09'), AAA: t('33.19'), AAAA: t('31.29') },
  '100 Fly': { B: t('1:56.69'), BB: t('1:41.39'), A: t('1:26.09'), AA: t('1:20.99'), AAA: t('1:15.99'), AAAA: t('1:10.89') },
  '100 IM': { B: t('1:44.29'), BB: t('1:33.19'), A: t('1:22.09'), AA: t('1:18.39'), AAA: t('1:14.69'), AAAA: t('1:10.99') },
  '200 IM': { B: t('3:42.09'), BB: t('3:18.79'), A: t('2:55.49'), AA: t('2:47.69'), AAA: t('2:39.99'), AAAA: t('2:32.19') },
};

// SCY Standards for 13-14 Boys (OFFICIAL 2024-2028)
const SCY_13_14_M: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('29.89'), BB: t('27.69'), A: t('25.59'), AA: t('24.59'), AAA: t('23.49'), AAAA: t('22.39') },
  '100 Free': { B: t('1:04.99'), BB: t('1:00.29'), A: t('55.69'), AA: t('53.39'), AAA: t('51.09'), AAAA: t('48.69') },
  '200 Free': { B: t('2:22.49'), BB: t('2:12.29'), A: t('2:02.19'), AA: t('1:57.09'), AAA: t('1:51.99'), AAAA: t('1:46.89') },
  '500 Free': { B: t('6:25.69'), BB: t('5:58.19'), A: t('5:30.59'), AA: t('5:16.89'), AAA: t('5:03.09'), AAAA: t('4:49.29') },
  '1000 Free': { B: t('13:17.99'), BB: t('12:20.99'), A: t('11:23.99'), AA: t('10:55.49'), AAA: t('10:26.99'), AAAA: t('9:58.49') },
  '1650 Free': { B: t('22:22.89'), BB: t('20:46.99'), A: t('19:11.09'), AA: t('18:23.09'), AAA: t('17:35.19'), AAAA: t('16:47.19') },
  '100 Back': { B: t('1:11.29'), BB: t('1:06.19'), A: t('1:01.09'), AA: t('58.59'), AAA: t('55.99'), AAAA: t('53.49') },
  '200 Back': { B: t('2:34.69'), BB: t('2:23.69'), A: t('2:12.59'), AA: t('2:07.09'), AAA: t('2:01.59'), AAAA: t('1:55.99') },
  '100 Breast': { B: t('1:20.49'), BB: t('1:14.79'), A: t('1:08.99'), AA: t('1:06.19'), AAA: t('1:03.29'), AAAA: t('1:00.39') },
  '200 Breast': { B: t('2:54.89'), BB: t('2:42.39'), A: t('2:29.89'), AA: t('2:23.59'), AAA: t('2:17.39'), AAAA: t('2:11.19') },
  '100 Fly': { B: t('1:10.49'), BB: t('1:05.49'), A: t('1:00.39'), AA: t('57.89'), AAA: t('55.39'), AAAA: t('52.89') },
  '200 Fly': { B: t('2:36.79'), BB: t('2:25.59'), A: t('2:14.39'), AA: t('2:08.79'), AAA: t('2:03.19'), AAAA: t('1:57.59') },
  '200 IM': { B: t('2:37.99'), BB: t('2:26.69'), A: t('2:15.39'), AA: t('2:09.79'), AAA: t('2:04.09'), AAAA: t('1:58.49') },
  '400 IM': { B: t('5:37.69'), BB: t('5:13.59'), A: t('4:49.49'), AA: t('4:37.39'), AAA: t('4:25.39'), AAAA: t('4:13.29') },
};

// SCY Standards for 13-14 Girls (OFFICIAL 2024-2028)
const SCY_13_14_F: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('32.49'), BB: t('30.19'), A: t('27.89'), AA: t('26.69'), AAA: t('25.59'), AAAA: t('24.39') },
  '100 Free': { B: t('1:10.99'), BB: t('1:05.89'), A: t('1:00.89'), AA: t('58.29'), AAA: t('55.79'), AAAA: t('53.29') },
  '200 Free': { B: t('2:33.59'), BB: t('2:22.69'), A: t('2:11.69'), AA: t('2:06.19'), AAA: t('2:00.69'), AAAA: t('1:55.29') },
  '500 Free': { B: t('6:52.19'), BB: t('6:22.79'), A: t('5:53.39'), AA: t('5:38.59'), AAA: t('5:23.89'), AAAA: t('5:09.19') },
  '1000 Free': { B: t('14:11.09'), BB: t('13:10.29'), A: t('12:09.49'), AA: t('11:39.09'), AAA: t('11:08.69'), AAAA: t('10:38.29') },
  '1650 Free': { B: t('23:42.89'), BB: t('22:01.19'), A: t('20:19.59'), AA: t('19:28.79'), AAA: t('18:37.99'), AAAA: t('17:47.19') },
  '100 Back': { B: t('1:16.89'), BB: t('1:11.39'), A: t('1:05.89'), AA: t('1:03.19'), AAA: t('1:00.49'), AAAA: t('57.69') },
  '200 Back': { B: t('2:46.39'), BB: t('2:34.49'), A: t('2:22.59'), AA: t('2:16.69'), AAA: t('2:10.69'), AAAA: t('2:04.79') },
  '100 Breast': { B: t('1:28.69'), BB: t('1:22.29'), A: t('1:15.99'), AA: t('1:12.89'), AAA: t('1:09.69'), AAAA: t('1:06.49') },
  '200 Breast': { B: t('3:10.99'), BB: t('2:57.39'), A: t('2:43.79'), AA: t('2:36.89'), AAA: t('2:30.09'), AAAA: t('2:23.29') },
  '100 Fly': { B: t('1:16.79'), BB: t('1:11.29'), A: t('1:05.89'), AA: t('1:03.09'), AAA: t('1:00.39'), AAAA: t('57.59') },
  '200 Fly': { B: t('2:51.19'), BB: t('2:38.99'), A: t('2:26.69'), AA: t('2:20.59'), AAA: t('2:14.49'), AAAA: t('2:08.39') },
  '200 IM': { B: t('2:51.79'), BB: t('2:39.49'), A: t('2:27.19'), AA: t('2:21.09'), AAA: t('2:14.99'), AAAA: t('2:08.79') },
  '400 IM': { B: t('6:05.79'), BB: t('5:39.69'), A: t('5:13.49'), AA: t('5:00.49'), AAA: t('4:47.39'), AAAA: t('4:34.29') },
};

// All standards organized by course, age group, and gender
const MOTIVATIONAL_STANDARDS: Record<string, Record<string, Record<string, Record<string, MotivationalStandard>>>> = {
  SCY: {
    '10U': { M: SCY_10U_M, F: SCY_10U_F },
    '10 & Under': { M: SCY_10U_M, F: SCY_10U_F },
    '11-12': { M: SCY_11_12_M, F: SCY_11_12_F },
    '13-14': { M: SCY_13_14_M, F: SCY_13_14_F },
  }
};

// Normalize event name to match our standards keys
function normalizeEventName(eventName: string): string {
  // Handle various naming conventions
  const normalized = eventName
    .replace(/Freestyle/i, 'Free')
    .replace(/Backstroke/i, 'Back')
    .replace(/Breaststroke/i, 'Breast')
    .replace(/Butterfly/i, 'Fly')
    .replace(/Individual Medley/i, 'IM')
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalized;
}

/**
 * Get the achievement level for a given time
 * @param timeSeconds - Swimmer's time in seconds
 * @param eventName - Event name (e.g., "50 Free", "100 Back", "50 Freestyle")
 * @param ageGroup - Age group (e.g., "10U", "10 & Under", "11-12", "13-14")
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
  
  // Try to find the event with normalized name
  const normalizedName = normalizeEventName(eventName);
  let eventStandards = genderStandards[normalizedName];
  
  // If not found, try the original name
  if (!eventStandards) {
    eventStandards = genderStandards[eventName];
  }
  
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
  
  // Try to find the event with normalized name
  const normalizedName = normalizeEventName(eventName);
  let eventStandards = genderStandards[normalizedName];
  
  // If not found, try the original name
  if (!eventStandards) {
    eventStandards = genderStandards[eventName];
  }
  
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
