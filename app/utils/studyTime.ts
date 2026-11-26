export interface TimeRange {
  id: string;
  startSec: number; // 오전 05:00 기준 경과 초 (0 ~ 86400)
  endSec: number;   // 오전 05:00 기준 경과 초 (0 ~ 86400)
}

export interface DayTimeRecord {
  seconds: number;
  ranges: TimeRange[];
}

const TIME_KEY = "kwan_study_time_v2";
const GOAL_KEY = "kwan_study_goal_minutes_v1";

export function getStudyDateAndOffset(dateObj: Date) {
  const shifted = new Date(dateObj.getTime() - 5 * 60 * 60 * 1000);
  const dStr = `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(
    shifted.getDate()
  ).padStart(2, "0")}`;
  const offsetSec =
    shifted.getHours() * 3600 + shifted.getMinutes() * 60 + shifted.getSeconds();
  return { dStr, offsetSec };
}

export const getStudyDateAndSlot = getStudyDateAndOffset;

export function hmsToOffsetSec(h: number, m: number, s: number): number {
  const shiftedHour = h >= 5 ? h - 5 : h + 19;
  return shiftedHour * 3600 + m * 60 + s;
}

export function offsetSecToHms(offsetSec: number) {
  const clamped = Math.max(0, Math.min(86399, Math.floor(offsetSec)));
  const shiftedHour = Math.floor(clamped / 3600);
  const h = (shiftedHour + 5) % 24;
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return { h, m, s };
}

export function calcMergedSeconds(ranges: TimeRange[]): number {
  if (!ranges || ranges.length === 0) return 0;
  const sorted = [...ranges]
    .map((r) => ({ start: Math.min(r.startSec, r.endSec), end: Math.max(r.startSec, r.endSec) }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);

  if (sorted.length === 0) return 0;
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.start <= prev.end) {
      prev.end = Math.max(prev.end, cur.end);
    } else {
      merged.push(cur);
    }
  }
  return merged.reduce((sum, r) => sum + (r.end - r.start), 0);
}

// 10분(600초) 칸 내부가 초 단위로 왼쪽에서 오른쪽 몇 % 차올랐는지 계산
export function getSlotFillPercent(
  ranges: TimeRange[],
  slotStart: number,
  slotEnd: number
): number {
  if (!ranges || ranges.length === 0) return 0;
  const intervals: [number, number][] = [];

  for (const r of ranges) {
    const s = Math.max(slotStart, Math.min(r.startSec, r.endSec));
    const e = Math.min(slotEnd, Math.max(r.startSec, r.endSec));
    if (e > s) intervals.push([s, e]);
  }
  if (intervals.length === 0) return 0;

  intervals.sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let [curS, curE] = intervals[0];
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] <= curE) {
      curE = Math.max(curE, intervals[i][1]);
    } else {
      covered += curE - curS;
      [curS, curE] = intervals[i];
    }
  }
  covered += curE - curS;
  return Math.min(100, (covered / (slotEnd - slotStart)) * 100);
}

export function loadTimeRecords(): Record<string, DayTimeRecord> {
  try {
    const raw = localStorage.getItem(TIME_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveTimeRecords(db: Record<string, DayTimeRecord>) {
  localStorage.setItem(TIME_KEY, JSON.stringify(db));
}

export function addOneStudySecond() {
  try {
    const { dStr, offsetSec } = getStudyDateAndOffset(new Date());
    const db = loadTimeRecords();
    const cur: DayTimeRecord = db[dStr] || { seconds: 0, ranges: [] };
    const ranges = [...(cur.ranges || [])];
    const last = ranges[ranges.length - 1];

    if (last && offsetSec >= last.endSec && offsetSec - last.endSec <= 3) {
      last.endSec = offsetSec + 1;
    } else {
      ranges.push({
        id: String(Date.now()),
        startSec: offsetSec,
        endSec: offsetSec + 1,
      });
    }

    db[dStr] = {
      seconds: calcMergedSeconds(ranges),
      ranges,
    };
    saveTimeRecords(db);
  } catch {
    // 무시
  }
}

export function loadGoalMinutes(): number {
  try {
    const saved = localStorage.getItem(GOAL_KEY);
    return saved ? Math.max(10, Number(saved)) : 240;
  } catch {
    return 240;
  }
}
