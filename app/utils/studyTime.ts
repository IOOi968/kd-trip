export interface TimeRange {
  id: string;
  startSec: number; // 05:00 기준 경과 초 (0 ~ 86400)
  endSec: number;   // 05:00 기준 경과 초 (0 ~ 86400)
}

export interface DayTimeRecord {
  seconds: number;
  ranges: TimeRange[];
}

const TIME_KEY = "kwan_study_time_v2";
const GOAL_KEY = "kwan_study_goal_minutes_v1";

// 새벽 0~4시는 전날 플래너(05:00 ~ 다음날 04:59:59) 날짜와 05:00 기준 초(0~86400)로 변환
export function getStudyDateAndOffset(dateObj: Date) {
  const shifted = new Date(dateObj.getTime() - 5 * 60 * 60 * 1000);
  const dStr = `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(
    shifted.getDate()
  ).padStart(2, "0")}`;
  const offsetSec =
    shifted.getHours() * 3600 + shifted.getMinutes() * 60 + shifted.getSeconds();
  return { dStr, offsetSec };
}

// 시(0~23), 분(0~59), 초(0~59)를 05:00 기준 경과 초(0~86400)로 변환
export function hmsToOffsetSec(h: number, m: number, s: number): number {
  const shiftedHour = h >= 5 ? h - 5 : h + 19;
  return shiftedHour * 3600 + m * 60 + s;
}

// 05:00 기준 경과 초를 실제 시/분/초 객체로 역변환
export function offsetSecToHms(offsetSec: number) {
  const clamped = Math.max(0, Math.min(86399, Math.floor(offsetSec)));
  const shiftedHour = Math.floor(clamped / 3600);
  const h = (shiftedHour + 5) % 24;
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return { h, m, s };
}

// 겹치는 시간 구간을 병합하여 실제 총 공부 초(seconds) 계산
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

// 특정 10분 칸([slotStart, slotEnd])이 왼쪽에서 오른쪽으로 몇 % 채워졌는지 계산
export function getSlotFillPercent(
  ranges: TimeRange[],
  slotStart: number,
  slotEnd: number
): number {
  if (!ranges || ranges.length === 0) return 0;
  let covered = 0;
  const intervals: [number, number][] = [];

  for (const r of ranges) {
    const s = Math.max(slotStart, Math.min(r.startSec, r.endSec));
    const e = Math.min(slotEnd, Math.max(r.startSec, r.endSec));
    if (e > s) intervals.push([s, e]);
  }
  if (intervals.length === 0) return 0;

  intervals.sort((a, b) => a[0] - b[0]);
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

// 뽀모도로 / 공부타이머가 1초 흐를 때마다 현재 시각 구간을 1초씩 확장
export function addOneStudySecond() {
  try {
    const { dStr, offsetSec } = getStudyDateAndOffset(new Date());
    const db = loadTimeRecords();
    const cur: DayTimeRecord = db[dStr] || { seconds: 0, ranges: [] };
    const ranges = [...(cur.ranges || [])];
    const last = ranges[ranges.length - 1];

    // 직전 기록과 3초 이내로 이어지면 같은 구간을 1초 연장, 아니면 새 구간 생성
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
