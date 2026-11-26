"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DayTimeRecord, getStudyDateAndSlot, loadTimeRecords } from "../../utils/studyTime";

interface PlannerLine {
  done: boolean;
  text: string;
}

interface DaySheet {
  goal: string;
  lines: PlannerLine[]; // 24줄 (사진 속 24행과 1:1 매칭)
}

// 사진 속 5 ~ 12 ~ 4 순서 (24시간)
const HOURS_ORDER = [
  { hour: 5, label: "5" }, { hour: 6, label: "6" }, { hour: 7, label: "7" },
  { hour: 8, label: "8" }, { hour: 9, label: "9" }, { hour: 10, label: "10" },
  { hour: 11, label: "11" }, { hour: 12, label: "12" }, { hour: 13, label: "1" },
  { hour: 14, label: "2" }, { hour: 15, label: "3" }, { hour: 16, label: "4" },
  { hour: 17, label: "5" }, { hour: 18, label: "6" }, { hour: 19, label: "7" },
  { hour: 20, label: "8" }, { hour: 21, label: "9" }, { hour: 22, label: "10" },
  { hour: 23, label: "11" }, { hour: 0, label: "12" }, { hour: 1, label: "1" },
  { hour: 2, label: "2" }, { hour: 3, label: "3" }, { hour: 4, label: "4" },
];

const EMPTY_LINES: PlannerLine[] = Array.from({ length: 24 }, () => ({ done: false, text: "" }));

export default function StudyPlannerPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [sheets, setSheets] = useState<Record<string, DaySheet>>({});
  const [timeRecords, setTimeRecords] = useState<Record<string, DayTimeRecord>>({});

  useEffect(() => {
    const { dStr } = getStudyDateAndSlot(new Date());
    setSelectedDate(dStr);

    try {
      const savedSheets = localStorage.getItem("kwan_study_planner_sheets_v1");
      if (savedSheets) setSheets(JSON.parse(savedSheets));
    } catch {
      // 무시
    }
    setTimeRecords(loadTimeRecords());
  }, []);

  const currentSheet: DaySheet = sheets[selectedDate] || {
    goal: "",
    lines: EMPTY_LINES,
  };

  const currentTime: DayTimeRecord = timeRecords[selectedDate] || {
    seconds: 0,
    slots: [],
  };

  const saveSheet = (nextSheet: DaySheet) => {
    const nextAll = { ...sheets, [selectedDate]: nextSheet };
    setSheets(nextAll);
    localStorage.setItem("kwan_study_planner_sheets_v1", JSON.stringify(nextAll));
  };

  const updateLine = (idx: number, patch: Partial<PlannerLine>) => {
    const nextLines = currentSheet.lines.map((line, i) =>
      i === idx ? { ...line, ...patch } : line
    );
    saveSheet({ ...currentSheet, lines: nextLines });
  };

  // 네모칸 터치 시 수동 칠하기/해제 토글
  const toggleSlot = (slotKey: string) => {
    if (!selectedDate) return;
    const exists = currentTime.slots.includes(slotKey);
    const nextSlots = exists
      ? currentTime.slots.filter((s) => s !== slotKey)
      : [...currentTime.slots, slotKey];
    const nextSec = Math.max(0, currentTime.seconds + (exists ? -600 : 600));

    const nextRecords = {
      ...timeRecords,
      [selectedDate]: { seconds: nextSec, slots: nextSlots },
    };
    setTimeRecords(nextRecords);
    localStorage.setItem("kwan_study_time_v1", JSON.stringify(nextRecords));
  };

  const totalH = Math.floor(currentTime.seconds / 3600);
  const totalM = Math.floor((currentTime.seconds % 3600) / 60);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/study" className="text-xs font-bold bg-stone-100 text-stone-700 px-2.5 py-1.5 rounded-lg">
              ← 공부
            </Link>
            <h1 className="text-base font-extrabold text-stone-900">스터디플래너 🗓️</h1>
          </div>
          <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
            STUDY
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-3 pt-4">
        {/* 사진 속 종이 플래너 시트 그대로 재현 */}
        <div className="bg-white border border-stone-300 rounded-xl shadow-xs overflow-hidden">
          {/* 상단 goal 줄 & 날짜 선택 */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b-2 border-stone-400">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-extrabold text-stone-700 tracking-tight">goal</span>
              <input
                type="text"
                placeholder="오늘의 목표를 입력하세요"
                value={currentSheet.goal}
                onChange={(e) => saveSheet({ ...currentSheet, goal: e.target.value })}
                className="flex-1 text-xs font-bold text-stone-900 bg-transparent focus:outline-none"
              />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded"
            />
          </div>

          {/* 24줄 본문: 왼쪽(넓은 할일 줄글 칸) + 오른쪽(5~4 정사각형 6칸 타임테이블) */}
          <div className="divide-y divide-stone-300">
            {HOURS_ORDER.map((item, idx) => {
              const line = currentSheet.lines[idx] || { done: false, text: "" };
              return (
                <div key={item.hour} className="grid grid-cols-12 items-stretch min-h-[26px]">
                  {/* 왼쪽 넓은 할일 줄 칸 (체크박스 + 세로선 + 점선 구분선 구조) */}
                  <div className="col-span-7 flex items-center border-r border-stone-400">
                    <div className="w-7 h-full flex items-center justify-center border-r border-stone-300 shrink-0">
                      <input
                        type="checkbox"
                        checked={line.done}
                        onChange={(e) => updateLine(idx, { done: e.target.checked })}
                        className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                      />
                    </div>
                    <input
                      type="text"
                      value={line.text}
                      onChange={(e) => updateLine(idx, { text: e.target.value })}
                      className={`w-full px-2 text-[11px] bg-transparent focus:outline-none ${
                        line.done ? "line-through text-stone-400" : "text-stone-800"
                      }`}
                    />
                  </div>

                  {/* 오른쪽 타임테이블: 시간 숫자(5~4) + 6개 정사각형 네모칸 */}
                  <div className="col-span-5 grid grid-cols-7 items-stretch">
                    <span className="flex items-center justify-center text-[10px] font-bold text-stone-600 bg-stone-50 border-r border-stone-300">
                      {item.label}
                    </span>
                    <div className="col-span-6 grid grid-cols-6 divide-x divide-stone-200">
                      {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                        const slotKey = `${item.hour}-${slotIdx}`;
                        const filled = currentTime.slots.includes(slotKey);
                        return (
                          <button
                            key={slotKey}
                            type="button"
                            onClick={() => toggleSlot(slotKey)}
                            className={`w-full h-full min-h-[24px] transition ${
                              filled ? "bg-emerald-500" : "bg-white hover:bg-emerald-50"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 맨 아래 total __ h __ m 집계 칸 (사진 하단 양식 그대로) */}
          <div className="grid grid-cols-12 border-t-2 border-stone-400 bg-stone-50/60">
            <div className="col-span-7 border-r border-stone-400 px-3 py-3 flex items-center">
              <span className="text-[10px] text-stone-400">
                뽀모도로 · 공부타이머 시간이 자동 색칠됩니다
              </span>
            </div>
            <div className="col-span-5 px-3 py-2.5 flex flex-col justify-between">
              <span className="text-xs font-extrabold text-stone-700">total</span>
              <div className="flex items-baseline justify-end gap-2 mt-1">
                <span className="text-base font-extrabold text-emerald-700">{totalH}</span>
                <span className="text-xs font-bold text-stone-600">h</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {String(totalM).padStart(2, "0")}
                </span>
                <span className="text-xs font-bold text-stone-600">m</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
