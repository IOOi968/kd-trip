"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";

interface SetRow {
  id: number;
  presetWeight: string;
  presetReps: string;
  weight: string;
  reps: string;
  done: boolean;
}

interface ActiveExercise {
  id: number;
  name: string;
  restTime?: string;
  note: string;
  sets: SetRow[];
}

interface WorkoutLog {
  date: string;
  dayOfWeek?: string;
  title?: string;
  summary: string;
  routineSnapshot?: ActiveExercise[];
}

export default function CalendarTab() {
  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  };

  const getWeekday = (dateStr: string) => {
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const d = new Date(dateStr + "T00:00:00");
    return weekdays[d.getDay()] || "";
  };

  const todayStr = getTodayStr();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [logs, setLogs] = useState<Record<string, WorkoutLog>>({});
  const [summaryInput, setSummaryInput] = useState("");

  useEffect(() => {
    const loadLogs = async () => {
      const { data } = await supabase.from("workout_logs").select("*");
      if (data) {
        const map: Record<string, WorkoutLog> = {};
        data.forEach((row) => {
          map[row.date] = {
            date: row.date,
            dayOfWeek: row.day_of_week,
            title: row.title,
            summary: row.summary || "",
            routineSnapshot: row.routine_snapshot || [],
          };
        });
        setLogs(map);
        if (map[todayStr]) setSummaryInput(map[todayStr].summary || "");
      }
    };
    loadLogs();
  }, [todayStr]);

  const currentObj = new Date(selectedDate + "T00:00:00");
  const year = currentObj.getFullYear();
  const month = currentObj.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleSelectDay = (day: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dStr);
    setSummaryInput(logs[dStr]?.summary || "");
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const dayOfWeek = getWeekday(selectedDate);
    const updated: WorkoutLog = {
      ...logs[selectedDate],
      date: selectedDate,
      dayOfWeek,
      summary: summaryInput.trim(),
    };
    setLogs({ ...logs, [selectedDate]: updated });

    await supabase.from("workout_logs").upsert({
      date: selectedDate,
      day_of_week: dayOfWeek,
      title: updated.title || "",
      summary: updated.summary,
      routine_snapshot: updated.routineSnapshot || [],
    });
    alert(`${selectedDate} (${dayOfWeek}) 운동기록이 저장되었습니다.`);
  };

  const handleDeleteLog = async () => {
    const next = { ...logs };
    delete next[selectedDate];
    setLogs(next);
    setSummaryInput("");
    await supabase.from("workout_logs").delete().eq("date", selectedDate);
  };

  const monthCount = Object.keys(logs).filter((d) =>
    d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)
  ).length;

  const selectedWeekday = getWeekday(selectedDate);
  const currentLog = logs[selectedDate];
  const snapshot = currentLog?.routineSnapshot;

  const previousSamePresetLog = (() => {
    if (!currentLog?.title) return null;
    const prevDates = Object.keys(logs)
      .filter((d) => d < selectedDate && logs[d]?.title === currentLog.title && logs[d]?.routineSnapshot?.length)
      .sort();
    if (prevDates.length === 0) return null;
    return logs[prevDates[prevDates.length - 1]];
  })();

  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900">
            📅 {year}년 {month + 1}월 운동 출석부
          </h2>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
            이번 달 {monthCount}일 완료 🔥
          </span>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-stone-400">
          {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
              2,
              "0"
            )}`;
            const hasWorkout = !!logs[dStr];
            const isSelected = selectedDate === dStr;
            return (
              <button
                key={dStr}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={`aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center transition ${
                  isSelected
                    ? "bg-stone-900 text-white"
                    : hasWorkout
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "hover:bg-stone-100 text-stone-700"
                }`}
              >
                <span>{day}</span>
                {hasWorkout && <span className="text-[9px] leading-none mt-0.5">💪</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-600 rounded-full" />
            <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
              {selectedDate} ({selectedWeekday}) 운동기록 {currentLog?.title && `(${currentLog.title})`}
            </h3>
          </div>
          {currentLog && (
            <button type="button" onClick={handleDeleteLog} className="text-xs text-rose-500 font-bold">
              삭제
            </button>
          )}
        </div>

        {snapshot && snapshot.length > 0 ? (
          <div className="space-y-2.5">
            {snapshot.map((ex, exIdx) => {
              const prevEx =
                previousSamePresetLog?.routineSnapshot?.find((p) => p.name === ex.name) ||
                previousSamePresetLog?.routineSnapshot?.[exIdx];

              return (
                <div
                  key={ex.id}
                  className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs space-y-2.5"
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-extrabold text-stone-900">{ex.name}</span>
                    {ex.restTime && (
                      <span className="text-[11px] font-semibold text-stone-400">
                        {ex.restTime}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {ex.sets.map((s, idx) => {
                      const prevSet = prevEx?.sets?.[idx];
                      const isWeightLower =
                        prevSet !== undefined && Number(s.weight) < Number(prevSet.weight);
                      const isRepsLower =
                        prevSet !== undefined && Number(s.reps) < Number(prevSet.reps);

                      return (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs ${
                            s.done
                              ? "bg-emerald-50/70 border-emerald-200"
                              : "bg-rose-50/50 border-rose-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 shrink-0">
                            {s.done ? (
                              <span className="w-4 h-4 rounded bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                                ✓
                              </span>
                            ) : (
                              <span className="w-4 h-4 rounded bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                                ✕
                              </span>
                            )}
                            <span className="font-bold text-stone-600">{idx + 1}세트</span>
                          </div>

                          <span className="text-[11px] font-semibold text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                            {s.presetWeight}kg · {s.presetReps}회
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`w-11 text-center bg-white border rounded-lg py-1 font-extrabold ${
                                isWeightLower
                                  ? "text-rose-600 border-rose-300"
                                  : "text-stone-900 border-stone-300"
                              }`}
                            >
                              {s.weight}
                            </span>
                            <span className={isWeightLower ? "text-rose-600 font-bold" : "text-stone-500"}>
                              kg
                            </span>
                            <span
                              className={`w-9 text-center bg-white border rounded-lg py-1 font-extrabold ${
                                isRepsLower
                                  ? "text-rose-600 border-rose-300"
                                  : "text-stone-900 border-stone-300"
                              }`}
                            >
                              {s.reps}
                            </span>
                            <span className={isRepsLower ? "text-rose-600 font-bold" : "text-stone-500"}>
                              회
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {ex.note && (
                    <p className="w-full text-[11px] bg-amber-50/60 text-amber-900 px-2.5 py-1.5 rounded-lg">
                      {ex.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <form
            onSubmit={handleSaveLog}
            className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-2.5"
          >
            <textarea
              rows={4}
              value={summaryInput}
              onChange={(e) => setSummaryInput(e.target.value)}
              className="w-full p-3 text-xs leading-relaxed border border-stone-200 rounded-xl bg-stone-50/70 focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
            >
              기록 저장하기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}