
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

export const getAgeGroup = (dob: string): string => {
  const age = new Date().getFullYear() - new Date(dob).getFullYear();
  if (age <= 10) return '10U';
  if (age <= 12) return '11-12';
  if (age <= 14) return '13-14';
  if (age <= 16) return '15-16';
  return '17-18';
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
