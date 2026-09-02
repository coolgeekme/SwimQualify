
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  const paddedSecs = parseFloat(secs) < 10 ? `0${secs}` : secs;
  return mins > 0 ? `${mins}:${paddedSecs}` : secs;
};

export const parseTime = (timeStr: string): number => {
  // Supports mm:ss.xx or ss.xx
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(parts[0]);
};

export const calculatePace = (totalSeconds: number, totalDistance: number, paceDistance: number): number => {
  return (totalSeconds / totalDistance) * paceDistance;
};

export const ageGroupFromAge = (age: number): string => {
  if (age <= 10) return '10U';
  if (age <= 12) return '11-12';
  if (age <= 14) return '13-14';
  if (age <= 16) return '15-16';
  return '17-18';
};

const currentAge = (dob: string): number => {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const mDiff = now.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

export const getAgeGroup = (dob: string): string => ageGroupFromAge(currentAge(dob));

/** Next age-group change: the next birthday (11/13/15/17) that moves the swimmer up. */
export const getNextAgeGroupChange = (dob: string): { group: string; date: Date } | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  // next birthday (including today if it is the birthday)
  let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  const ageAtNext = next.getFullYear() - birth.getFullYear();
  const nextGroup = ageGroupFromAge(ageAtNext);
  if (nextGroup === getAgeGroup(dob)) return null; // birthdays at 10/12/14/16 don't move groups
  return { group: nextGroup, date: next };
};

export const getAgeGroupAtDate = (dob: string, dateStr: string): string => {
  const birthDate = new Date(dob);
  const referenceDate = new Date(dateStr);
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age <= 10) return '10U';
  if (age <= 12) return '11-12';
  if (age <= 14) return '13-14';
  if (age <= 16) return '15-16';
  return '17-18';
};
