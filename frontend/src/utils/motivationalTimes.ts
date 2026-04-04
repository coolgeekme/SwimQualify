// USA Swimming 2024-2028 National Age Group Motivational Time Standards
// Standards are in seconds for each event/age group/gender combination
// Levels: B (top 55%), BB (top 35%), A (top 15%), AA (top 8%), AAA (top 6%), AAAA (top 2%)
// Source: https://swimgoals.app/guides/motivational-times (Official USA Swimming data)
// Last Updated: March 2026

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

// ============================================================================
// SCY (SHORT COURSE YARDS) STANDARDS
// ============================================================================

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

// SCY Standards for 15-16 Boys (OFFICIAL 2024-2028)
const SCY_15_16_M: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('28.29'), BB: t('26.29'), A: t('24.19'), AA: t('23.19'), AAA: t('22.19'), AAAA: t('21.19') },
  '100 Free': { B: t('1:01.99'), BB: t('57.59'), A: t('53.19'), AA: t('50.99'), AAA: t('48.79'), AAAA: t('46.49') },
  '200 Free': { B: t('2:15.99'), BB: t('2:06.29'), A: t('1:56.59'), AA: t('1:51.79'), AAA: t('1:46.89'), AAAA: t('1:41.99') },
  '500 Free': { B: t('6:08.39'), BB: t('5:42.09'), A: t('5:15.79'), AA: t('5:02.69'), AAA: t('4:49.49'), AAAA: t('4:36.29') },
  '1000 Free': { B: t('12:51.79'), BB: t('11:56.69'), A: t('11:01.59'), AA: t('10:33.99'), AAA: t('10:06.39'), AAAA: t('9:38.89') },
  '1650 Free': { B: t('21:26.59'), BB: t('19:54.69'), A: t('18:22.79'), AA: t('17:36.89'), AAA: t('16:50.89'), AAAA: t('16:04.99') },
  '100 Back': { B: t('1:07.49'), BB: t('1:02.69'), A: t('57.89'), AA: t('55.49'), AAA: t('53.09'), AAAA: t('50.69') },
  '200 Back': { B: t('2:27.59'), BB: t('2:17.09'), A: t('2:06.59'), AA: t('2:01.29'), AAA: t('1:55.99'), AAAA: t('1:50.69') },
  '100 Breast': { B: t('1:16.89'), BB: t('1:11.39'), A: t('1:05.89'), AA: t('1:03.19'), AAA: t('1:00.39'), AAAA: t('57.69') },
  '200 Breast': { B: t('2:47.09'), BB: t('2:35.19'), A: t('2:23.19'), AA: t('2:17.29'), AAA: t('2:11.29'), AAAA: t('2:05.29') },
  '100 Fly': { B: t('1:07.19'), BB: t('1:02.39'), A: t('57.59'), AA: t('55.19'), AAA: t('52.79'), AAAA: t('50.39') },
  '200 Fly': { B: t('2:30.19'), BB: t('2:19.49'), A: t('2:08.79'), AA: t('2:03.39'), AAA: t('1:58.09'), AAAA: t('1:52.69') },
  '200 IM': { B: t('2:30.89'), BB: t('2:20.19'), A: t('2:09.39'), AA: t('2:03.99'), AAA: t('1:58.59'), AAAA: t('1:53.19') },
  '400 IM': { B: t('5:22.19'), BB: t('4:59.19'), A: t('4:36.19'), AA: t('4:24.69'), AAA: t('4:13.19'), AAAA: t('4:01.59') },
};

// SCY Standards for 15-16 Girls (OFFICIAL 2024-2028)
const SCY_15_16_F: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('31.79'), BB: t('29.49'), A: t('27.29'), AA: t('26.09'), AAA: t('24.99'), AAAA: t('23.89') },
  '100 Free': { B: t('1:08.79'), BB: t('1:03.79'), A: t('58.89'), AA: t('56.49'), AAA: t('53.99'), AAAA: t('51.59') },
  '200 Free': { B: t('2:28.99'), BB: t('2:18.39'), A: t('2:07.69'), AA: t('2:02.39'), AAA: t('1:57.09'), AAAA: t('1:51.79') },
  '500 Free': { B: t('6:40.99'), BB: t('6:12.39'), A: t('5:43.69'), AA: t('5:29.39'), AAA: t('5:15.09'), AAAA: t('5:00.79') },
  '1000 Free': { B: t('13:52.89'), BB: t('12:53.49'), A: t('11:53.99'), AA: t('11:24.19'), AAA: t('10:54.49'), AAAA: t('10:24.69') },
  '1650 Free': { B: t('23:15.89'), BB: t('21:36.19'), A: t('19:56.49'), AA: t('19:06.69'), AAA: t('18:16.79'), AAAA: t('17:26.89') },
  '100 Back': { B: t('1:14.69'), BB: t('1:09.39'), A: t('1:04.09'), AA: t('1:01.39'), AAA: t('58.69'), AAAA: t('56.09') },
  '200 Back': { B: t('2:42.19'), BB: t('2:30.59'), A: t('2:19.09'), AA: t('2:13.29'), AAA: t('2:07.49'), AAAA: t('2:01.69') },
  '100 Breast': { B: t('1:25.89'), BB: t('1:19.79'), A: t('1:13.69'), AA: t('1:10.59'), AAA: t('1:07.49'), AAAA: t('1:04.49') },
  '200 Breast': { B: t('3:05.99'), BB: t('2:52.69'), A: t('2:39.39'), AA: t('2:32.79'), AAA: t('2:26.19'), AAAA: t('2:19.49') },
  '100 Fly': { B: t('1:14.39'), BB: t('1:09.09'), A: t('1:03.79'), AA: t('1:01.09'), AAA: t('58.39'), AAAA: t('55.79') },
  '200 Fly': { B: t('2:45.79'), BB: t('2:33.99'), A: t('2:22.09'), AA: t('2:16.19'), AAA: t('2:10.29'), AAAA: t('2:04.39') },
  '200 IM': { B: t('2:46.19'), BB: t('2:34.29'), A: t('2:22.39'), AA: t('2:16.49'), AAA: t('2:10.59'), AAAA: t('2:04.59') },
  '400 IM': { B: t('5:54.99'), BB: t('5:29.69'), A: t('5:04.29'), AA: t('4:51.59'), AAA: t('4:38.99'), AAAA: t('4:26.29') },
};

// SCY Standards for 17-18 Boys (OFFICIAL 2024-2028)
const SCY_17_18_M: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('27.59'), BB: t('25.59'), A: t('23.59'), AA: t('22.59'), AAA: t('21.69'), AAAA: t('20.69') },
  '100 Free': { B: t('1:00.29'), BB: t('55.99'), A: t('51.69'), AA: t('49.59'), AAA: t('47.39'), AAAA: t('45.29') },
  '200 Free': { B: t('2:13.59'), BB: t('2:03.99'), A: t('1:54.49'), AA: t('1:49.69'), AAA: t('1:44.99'), AAAA: t('1:40.19') },
  '500 Free': { B: t('6:03.19'), BB: t('5:37.29'), A: t('5:11.39'), AA: t('4:58.39'), AAA: t('4:45.39'), AAAA: t('4:32.39') },
  '1000 Free': { B: t('12:40.19'), BB: t('11:45.89'), A: t('10:51.59'), AA: t('10:24.49'), AAA: t('9:57.29'), AAAA: t('9:30.19') },
  '1650 Free': { B: t('21:08.99'), BB: t('19:38.39'), A: t('18:07.69'), AA: t('17:22.39'), AAA: t('16:37.09'), AAAA: t('15:51.79') },
  '100 Back': { B: t('1:05.19'), BB: t('1:00.59'), A: t('55.89'), AA: t('53.59'), AAA: t('51.29'), AAAA: t('48.89') },
  '200 Back': { B: t('2:23.89'), BB: t('2:13.59'), A: t('2:03.29'), AA: t('1:58.19'), AAA: t('1:53.09'), AAAA: t('1:47.89') },
  '100 Breast': { B: t('1:14.69'), BB: t('1:09.39'), A: t('1:03.99'), AA: t('1:01.39'), AAA: t('58.69'), AAAA: t('55.99') },
  '200 Breast': { B: t('2:42.29'), BB: t('2:30.69'), A: t('2:19.09'), AA: t('2:13.29'), AAA: t('2:07.49'), AAAA: t('2:01.69') },
  '100 Fly': { B: t('1:05.39'), BB: t('1:00.79'), A: t('56.09'), AA: t('53.69'), AAA: t('51.39'), AAAA: t('49.09') },
  '200 Fly': { B: t('2:26.39'), BB: t('2:15.99'), A: t('2:05.49'), AA: t('2:00.29'), AAA: t('1:55.09'), AAAA: t('1:49.79') },
  '200 IM': { B: t('2:27.39'), BB: t('2:16.89'), A: t('2:06.39'), AA: t('2:01.09'), AAA: t('1:55.89'), AAAA: t('1:50.59') },
  '400 IM': { B: t('5:17.39'), BB: t('4:54.69'), A: t('4:31.99'), AA: t('4:20.69'), AAA: t('4:09.39'), AAAA: t('3:57.99') },
};

// SCY Standards for 17-18 Girls (OFFICIAL 2024-2028)
const SCY_17_18_F: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('31.39'), BB: t('29.09'), A: t('26.89'), AA: t('25.79'), AAA: t('24.69'), AAAA: t('23.49') },
  '100 Free': { B: t('1:08.09'), BB: t('1:03.19'), A: t('58.39'), AA: t('55.89'), AAA: t('53.49'), AAAA: t('51.09') },
  '200 Free': { B: t('2:27.19'), BB: t('2:16.69'), A: t('2:06.19'), AA: t('2:00.89'), AAA: t('1:55.69'), AAAA: t('1:50.39') },
  '500 Free': { B: t('6:36.49'), BB: t('6:08.19'), A: t('5:39.89'), AA: t('5:25.69'), AAA: t('5:11.59'), AAAA: t('4:57.39') },
  '1000 Free': { B: t('13:46.09'), BB: t('12:47.09'), A: t('11:48.09'), AA: t('11:18.59'), AAA: t('10:49.09'), AAAA: t('10:19.59') },
  '1650 Free': { B: t('22:47.19'), BB: t('21:09.59'), A: t('19:31.89'), AA: t('18:43.09'), AAA: t('17:54.29'), AAAA: t('17:05.39') },
  '100 Back': { B: t('1:13.39'), BB: t('1:08.09'), A: t('1:02.89'), AA: t('1:00.29'), AAA: t('57.69'), AAAA: t('54.99') },
  '200 Back': { B: t('2:38.79'), BB: t('2:27.39'), A: t('2:16.09'), AA: t('2:10.39'), AAA: t('2:04.79'), AAAA: t('1:59.09') },
  '100 Breast': { B: t('1:24.79'), BB: t('1:18.79'), A: t('1:12.69'), AA: t('1:09.69'), AAA: t('1:06.69'), AAAA: t('1:03.59') },
  '200 Breast': { B: t('3:04.69'), BB: t('2:51.49'), A: t('2:38.29'), AA: t('2:31.69'), AAA: t('2:25.09'), AAAA: t('2:18.49') },
  '100 Fly': { B: t('1:13.59'), BB: t('1:08.29'), A: t('1:03.09'), AA: t('1:00.39'), AAA: t('57.79'), AAAA: t('55.19') },
  '200 Fly': { B: t('2:42.79'), BB: t('2:31.19'), A: t('2:19.49'), AA: t('2:13.69'), AAA: t('2:07.89'), AAAA: t('2:02.09') },
  '200 IM': { B: t('2:43.59'), BB: t('2:31.89'), A: t('2:20.19'), AA: t('2:14.39'), AAA: t('2:08.49'), AAAA: t('2:02.69') },
  '400 IM': { B: t('5:50.69'), BB: t('5:25.59'), A: t('5:00.59'), AA: t('4:47.99'), AAA: t('4:35.49'), AAAA: t('4:22.99') },
};

// ============================================================================
// LCM (LONG COURSE METERS) STANDARDS
// ============================================================================

// LCM Standards for 11-12 Boys (OFFICIAL 2024-2028)
const LCM_11_12_M: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('39.09'), BB: t('36.39'), A: t('33.69'), AA: t('32.39'), AAA: t('30.99'), AAAA: t('29.69') },
  '100 Free': { B: t('1:25.49'), BB: t('1:19.49'), A: t('1:13.49'), AA: t('1:10.49'), AAA: t('1:07.39'), AAAA: t('1:04.39') },
  '200 Free': { B: t('3:04.29'), BB: t('2:51.19'), A: t('2:38.09'), AA: t('2:31.49'), AAA: t('2:24.99'), AAAA: t('2:18.39') },
  '400 Free': { B: t('6:26.89'), BB: t('5:59.19'), A: t('5:31.59'), AA: t('5:17.79'), AAA: t('5:03.89'), AAAA: t('4:50.09') },
  '800 Free': { B: t('13:24.79'), BB: t('12:27.19'), A: t('11:29.49'), AA: t('11:00.69'), AAA: t('10:31.79'), AAAA: t('10:02.99') },
  '1500 Free': { B: t('24:28.39'), BB: t('22:43.49'), A: t('20:58.59'), AA: t('20:06.19'), AAA: t('19:13.69'), AAAA: t('18:21.29') },
  '50 Back': { B: t('44.79'), BB: t('41.59'), A: t('38.39'), AA: t('36.79'), AAA: t('35.19'), AAAA: t('33.59') },
  '100 Back': { B: t('1:35.09'), BB: t('1:27.89'), A: t('1:20.69'), AA: t('1:17.09'), AAA: t('1:13.39'), AAAA: t('1:09.79') },
  '200 Back': { B: t('3:21.39'), BB: t('3:06.69'), A: t('2:51.99'), AA: t('2:44.69'), AAA: t('2:37.29'), AAAA: t('2:29.99') },
  '50 Breast': { B: t('50.39'), BB: t('46.69'), A: t('42.99'), AA: t('41.19'), AAA: t('39.29'), AAAA: t('37.49') },
  '100 Breast': { B: t('1:50.79'), BB: t('1:42.69'), A: t('1:34.49'), AA: t('1:30.39'), AAA: t('1:26.29'), AAAA: t('1:22.19') },
  '200 Breast': { B: t('3:54.09'), BB: t('3:37.19'), A: t('3:20.39'), AA: t('3:11.89'), AAA: t('3:03.49'), AAAA: t('2:54.99') },
  '50 Fly': { B: t('43.19'), BB: t('40.09'), A: t('36.89'), AA: t('35.29'), AAA: t('33.69'), AAAA: t('32.09') },
  '100 Fly': { B: t('1:40.29'), BB: t('1:32.29'), A: t('1:24.29'), AA: t('1:20.29'), AAA: t('1:16.29'), AAAA: t('1:12.29') },
  '200 Fly': { B: t('3:29.79'), BB: t('3:14.49'), A: t('2:59.29'), AA: t('2:51.59'), AAA: t('2:43.99'), AAAA: t('2:36.29') },
  '200 IM': { B: t('3:27.99'), BB: t('3:13.19'), A: t('2:58.29'), AA: t('2:50.89'), AAA: t('2:43.49'), AAAA: t('2:35.99') },
  '400 IM': { B: t('7:16.79'), BB: t('6:45.79'), A: t('6:14.69'), AA: t('5:59.19'), AAA: t('5:43.69'), AAAA: t('5:28.09') },
};

// LCM Standards for 11-12 Girls (OFFICIAL 2024-2028)
const LCM_11_12_F: Record<string, MotivationalStandard> = {
  '50 Free': { B: t('39.89'), BB: t('37.09'), A: t('34.29'), AA: t('32.89'), AAA: t('31.49'), AAAA: t('30.09') },
  '100 Free': { B: t('1:27.59'), BB: t('1:21.39'), A: t('1:15.19'), AA: t('1:12.09'), AAA: t('1:08.99'), AAAA: t('1:05.89') },
  '200 Free': { B: t('3:11.89'), BB: t('2:58.29'), A: t('2:44.79'), AA: t('2:37.99'), AAA: t('2:31.29'), AAAA: t('2:24.49') },
  '400 Free': { B: t('6:44.49'), BB: t('6:15.69'), A: t('5:46.89'), AA: t('5:32.49'), AAA: t('5:18.09'), AAAA: t('5:03.69') },
  '800 Free': { B: t('13:47.99'), BB: t('12:48.69'), A: t('11:49.29'), AA: t('11:19.69'), AAA: t('10:50.09'), AAAA: t('10:20.39') },
  '1500 Free': { B: t('25:43.69'), BB: t('23:53.19'), A: t('22:02.69'), AA: t('21:07.49'), AAA: t('20:12.19'), AAAA: t('19:16.99') },
  '50 Back': { B: t('45.39'), BB: t('42.19'), A: t('38.89'), AA: t('37.29'), AAA: t('35.69'), AAAA: t('34.09') },
  '100 Back': { B: t('1:39.69'), BB: t('1:32.09'), A: t('1:24.59'), AA: t('1:20.79'), AAA: t('1:16.99'), AAAA: t('1:13.19') },
  '200 Back': { B: t('3:27.79'), BB: t('3:12.69'), A: t('2:57.49'), AA: t('2:49.99'), AAA: t('2:42.39'), AAAA: t('2:34.79') },
  '50 Breast': { B: t('51.09'), BB: t('47.39'), A: t('43.69'), AA: t('41.79'), AAA: t('39.99'), AAAA: t('38.09') },
  '100 Breast': { B: t('1:55.49'), BB: t('1:46.99'), A: t('1:38.59'), AA: t('1:34.29'), AAA: t('1:30.09'), AAAA: t('1:25.79') },
  '200 Breast': { B: t('4:04.49'), BB: t('3:46.89'), A: t('3:29.29'), AA: t('3:20.49'), AAA: t('3:11.69'), AAAA: t('3:02.89') },
  '50 Fly': { B: t('43.29'), BB: t('40.19'), A: t('37.09'), AA: t('35.49'), AAA: t('33.99'), AAAA: t('32.49') },
  '100 Fly': { B: t('1:44.09'), BB: t('1:35.79'), A: t('1:27.59'), AA: t('1:23.39'), AAA: t('1:19.29'), AAAA: t('1:15.09') },
  '200 Fly': { B: t('3:37.39'), BB: t('3:21.59'), A: t('3:05.79'), AA: t('2:57.89'), AAA: t('2:49.99'), AAAA: t('2:42.09') },
  '200 IM': { B: t('3:32.39'), BB: t('3:17.29'), A: t('3:02.19'), AA: t('2:54.59'), AAA: t('2:47.09'), AAAA: t('2:39.49') },
  '400 IM': { B: t('7:30.69'), BB: t('6:58.79'), A: t('6:26.79'), AA: t('6:10.79'), AAA: t('5:54.79'), AAAA: t('5:38.79') },
};

// ============================================================================
// STANDARDS INDEX
// ============================================================================

// All standards organized by course, age group, and gender
const MOTIVATIONAL_STANDARDS: Record<string, Record<string, Record<string, Record<string, MotivationalStandard>>>> = {
  SCY: {
    '10U': { M: SCY_10U_M, F: SCY_10U_F },
    '10 & Under': { M: SCY_10U_M, F: SCY_10U_F },
    '11-12': { M: SCY_11_12_M, F: SCY_11_12_F },
    '13-14': { M: SCY_13_14_M, F: SCY_13_14_F },
    '15-16': { M: SCY_15_16_M, F: SCY_15_16_F },
    '17-18': { M: SCY_17_18_M, F: SCY_17_18_F },
  },
  LCM: {
    '11-12': { M: LCM_11_12_M, F: LCM_11_12_F },
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Normalize event name to match our standards keys
function normalizeEventName(eventName: string): string {
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
  
  const normalizedName = normalizeEventName(eventName);
  let eventStandards = genderStandards[normalizedName];
  
  if (!eventStandards) {
    eventStandards = genderStandards[eventName];
  }
  
  if (!eventStandards) return null;
  
  if (timeSeconds <= eventStandards.AAAA) return 'AAAA';
  if (timeSeconds <= eventStandards.AAA) return 'AAA';
  if (timeSeconds <= eventStandards.AA) return 'AA';
  if (timeSeconds <= eventStandards.A) return 'A';
  if (timeSeconds <= eventStandards.BB) return 'BB';
  if (timeSeconds <= eventStandards.B) return 'B';
  
  return null;
}

/**
 * Get the next achievement level to work towards
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
  
  const normalizedName = normalizeEventName(eventName);
  let eventStandards = genderStandards[normalizedName];
  
  if (!eventStandards) {
    eventStandards = genderStandards[eventName];
  }
  
  if (!eventStandards) return null;
  
  const currentLevel = getAchievementLevel(timeSeconds, eventName, ageGroup, gender, course);
  const levels: AchievementLevel[] = ['B', 'BB', 'A', 'AA', 'AAA', 'AAAA'];
  
  if (currentLevel === 'AAAA') return null;
  
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
    case 'AAAA': return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' };
    case 'AAA': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'AA': return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'A': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
    case 'BB': return { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' };
    case 'B': return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
    default: return { bg: 'bg-slate-800/50', text: 'text-slate-500', border: 'border-slate-700/30' };
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

/**
 * Get all standards for an event (for the Verify Standards modal)
 */
export function getEventStandards(
  eventName: string,
  ageGroup: string,
  gender: 'M' | 'F',
  course: string = 'SCY'
): MotivationalStandard | null {
  const courseStandards = MOTIVATIONAL_STANDARDS[course];
  if (!courseStandards) return null;
  
  const ageStandards = courseStandards[ageGroup];
  if (!ageStandards) return null;
  
  const genderStandards = ageStandards[gender];
  if (!genderStandards) return null;
  
  const normalizedName = normalizeEventName(eventName);
  return genderStandards[normalizedName] || genderStandards[eventName] || null;
}

/**
 * Get all available events for an age group
 */
export function getAvailableEvents(
  ageGroup: string,
  gender: 'M' | 'F',
  course: string = 'SCY'
): string[] {
  const courseStandards = MOTIVATIONAL_STANDARDS[course];
  if (!courseStandards) return [];
  
  const ageStandards = courseStandards[ageGroup];
  if (!ageStandards) return [];
  
  const genderStandards = ageStandards[gender];
  if (!genderStandards) return [];
  
  return Object.keys(genderStandards);
}

/**
 * Get supported age groups for a course
 */
export function getSupportedAgeGroups(course: string = 'SCY'): string[] {
  const courseStandards = MOTIVATIONAL_STANDARDS[course];
  if (!courseStandards) return [];
  return Object.keys(courseStandards).filter(ag => !ag.includes('&')); // Filter out aliases
}

/**
 * Get supported courses
 */
export function getSupportedCourses(): string[] {
  return Object.keys(MOTIVATIONAL_STANDARDS);
}

/**
 * Format seconds to time string (MM:SS.ss or SS.ss)
 */
export function formatTimeFromSeconds(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2).padStart(5, '0');
    return `${mins}:${secs}`;
  }
  return seconds.toFixed(2);
}
