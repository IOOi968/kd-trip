export interface DayTimeRecord {
  seconds: number;
  slots: string[]; // "5-0", "5-1" ... "4-5"
}

const TIME_KEY = "kwan_study_time_v1";
const GOAL_KEY = "kwan_study_goal_minutes_v1";

// 새벽 0~4시는 전날 플래너(5시~새벽4시 기준) 날짜로 귀속
export function getStudyDateAndSlot(dateObj: Date) {
  const shifted = new Date(dateObj.getTime() - 5 * 60 * 60 * 1000);
  const dStr = `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(
    shifted.getDate()
  ).padStart(2, "0")}`;
  const hour = dateObj.getHours();
  const minSlot = Math.floor(dateObj.getMinutes() / 10);
  return { dStr, slotKey: `${hour}-${minSlot}` };
}

export function loadTimeRecords(): Record<string, DayTimeRecord> {
  try {
    const raw = localStorage.getItem(TIME_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function addOneStudySecond() {
  try {
    const { dStr, slotKey } = getStudyDateAndSlot(new Date());
    const db = loadTimeRecords();
    const cur = db[dStr] || { seconds: 0, slots: [] };
    const nextSlots = cur.slots.includes(slotKey) ? cur.slots : [...cur.slots, slotKey];
    db[dStr] = { seconds: (cur.seconds || 0) + 1, slots: nextSlots };
    localStorage.setItem(TIME_KEY, JSON.stringify(db));
  } catch {
    // 무시
  }
}

export function loadGoalMinutes(): number {
  try {
    const saved = localStorage.getItem(GOAL_KEY);
    return saved ? Math.max(10, Number(saved)) : 240; // 기본 4시간
  } catch {
    return 240;
  }
}
