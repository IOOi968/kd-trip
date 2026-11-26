"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DayTimeRecord,
  TimeRange,
  getStudyDateAndOffset,
  hmsToOffsetSec,
  offsetSecToHms,
  calcMergedSeconds,
  getSlotFillPercent,
  loadTimeRecords,
  saveTimeRecords,
} from "../../utils/studyTime";

interface PlannerLine {
  done: boolean;
  text: string;
}

interface DaySheet {
  goal: string;
  lines: PlannerLine[];
}

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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default function StudyPlannerPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [sheets, setSheets] = useState<Record<string, DaySheet>>({});
  const [timeRecords, setTimeRecords] = useState<Record<string, DayTimeRecord>>({});

  // 모달 상태 (뒷배경 어둡게 + 시:분:초 ~ 시:분:초 입력)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRangeId, setEditingRangeId] = useState<string | null>(null);
  const [startH, setStartH] = useState("9");
  const [startM, setStartM] = useState("0");
  const [startS, setStartS] = useState("0");
  const [endH, setEndH] = useState("10");
  const [endM, setEndM] = useState("0");
  const [endS, setEndS] = useState("0");

  useEffect(() => {
    const { dStr } = getStudyDateAndOffset(new Date());
    setSelectedDate(dStr);

    try {
      const savedSheets = localStorage.getItem("kwan_study_planner_sheets_v1");
      if (savedSheets) setSheets(JSON.parse(savedSheets));
    } catch {
      // 무시
    }
    setTimeRecords(loadTimeRecords());

    // 뽀모도로·공부타이머가 켜져 있을 때 실시간으로 게이지가 차오르도록 1초마다 동기화
    const syncTimer = setInterval(() => {
      setTimeRecords(loadTimeRecords());
    }, 1000);
    return () => clearInterval(syncTimer);
  }, []);

  const currentSheet: DaySheet = sheets[selectedDate] || {
    goal: "",
    lines: EMPTY_LINES,
  };

  const currentTime: DayTimeRecord = timeRecords[selectedDate] || {
    seconds: 0,
    ranges: [],
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

  // 격자 클릭 시 바로 칠하지 않고 시:분:초 입력 팝업 열기
  const handleOpenTimeModal = (hour: number, slotIdx: number) => {
    const slotStart = hmsToOffsetSec(hour, slotIdx * 10, 0);
    const slotEnd = slotStart + 600;

    const existingRange = currentTime.ranges.find((r) => {
      const s = Math.min(r.startSec, r.endSec);
      const e = Math.max(r.startSec, r.endSec);
      return e > slotStart && s < slotEnd;
    });

    if (existingRange) {
      const sHms = offsetSecToHms(existingRange.startSec);
      const eHms = offsetSecToHms(existingRange.endSec);
      setEditingRangeId(existingRange.id);
      setStartH(String(sHms.h));
      setStartM(String(sHms.m));
      setStartS(String(sHms.s));
      setEndH(String(eHms.h));
      setEndM(String(eHms.m));
      setEndS(String(eHms.s));
    } else {
      const nextHour = slotIdx === 5 ? (hour + 1) % 24 : hour;
      const nextMin = slotIdx === 5 ? 0 : (slotIdx + 1) * 10;
      setEditingRangeId(null);
      setStartH(String(hour));
      setStartM(String(slotIdx * 10));
      setStartS("0");
      setEndH(String(nextHour));
      setEndM(String(nextMin));
      setEndS("0");
    }
    setIsModalOpen(true);
  };

  const handleApplyTimeRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    const sSec = hmsToOffsetSec(
      Math.max(0, Math.min(23, Number(startH) || 0)),
      Math.max(0, Math.min(59, Number(startM) || 0)),
      Math.max(0, Math.min(59, Number(startS) || 0))
    );
    const eSec = hmsToOffsetSec(
      Math.max(0, Math.min(23, Number(endH) || 0)),
      Math.max(0, Math.min(59, Number(endM) || 0)),
      Math.max(0, Math.min(59, Number(endS) || 0))
    );

    if (eSec <= sSec) {
      alert("종료 시간은 시작 시간보다 뒤여야 합니다.");
      return;
    }

    let nextRanges: TimeRange[];
    if (editingRangeId) {
      nextRanges = currentTime.ranges.map((r) =>
        r.id === editingRangeId ? { ...r, startSec: sSec, endSec: eSec } : r
      );
    } else {
      nextRanges = [
        ...currentTime.ranges,
        { id: String(Date.now()), startSec: sSec, endSec: eSec },
      ];
    }

    const nextRecords = {
      ...timeRecords,
      [selectedDate]: {
        seconds: calcMergedSeconds(nextRanges),
        ranges: nextRanges,
      },
    };
    setTimeRecords(nextRecords);
    saveTimeRecords(nextRecords);
    setIsModalOpen(false);
  };

  const handleDeleteRange = (id: string) => {
    const nextRanges = currentTime.ranges.filter((r) => r.id !== id);
    const nextRecords = {
      ...timeRecords,
      [selectedDate]: {
        seconds: calcMergedSeconds(nextRanges),
        ranges: nextRanges,
      },
    };
    setTimeRecords(nextRecords);
    saveTimeRecords(nextRecords);
    if (editingRangeId === id) setIsModalOpen(false);
  };

  const totalH = Math.floor(currentTime.seconds / 3600);
  const totalM = Math.floor((currentTime.seconds % 3600) / 60);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              href="/study"
              className="text-xs font-bold bg-stone-100 text-stone-700 px-2.5 py-1.5 rounded-lg"
            >
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
        <div className="bg-white border border-stone-300 rounded-xl shadow-xs overflow-hidden">
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

          <div className="divide-y divide-stone-300">
            {HOURS_ORDER.map((item, idx) => {
              const line = currentSheet.lines[idx] || { done: false, text: "" };
              return (
                <div key={item.hour} className="grid grid-cols-12 items-stretch min-h-[26px]">
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

                  {/* 오른쪽 타임테이블: 초 단위로 왼쪽 -> 오른쪽으로 게이지가 차오름 */}
                  <div className="col-span-5 grid grid-cols-7 items-stretch">
                    <span className="flex items-center justify-center text-[10px] font-bold text-stone-600 bg-stone-50 border-r border-stone-300">
                      {item.label}
                    </span>
                    <div className="col-span-6 grid grid-cols-6 divide-x divide-stone-200">
                      {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                        const slotStart = hmsToOffsetSec(item.hour, slotIdx * 10, 0);
                        const slotEnd = slotStart + 600;
                        const fillPct = getSlotFillPercent(
                          currentTime.ranges,
                          slotStart,
                          slotEnd
                        );

                        return (
                          <button
                            key={slotIdx}
                            type="button"
                            onClick={() => handleOpenTimeModal(item.hour, slotIdx)}
                            className="relative w-full h-full min-h-[24px] bg-white hover:bg-emerald-50/70 overflow-hidden"
                          >
                            {fillPct > 0 && (
                              <span
                                style={{ width: `${fillPct}%` }}
                                className="absolute top-0 bottom-0 left-0 bg-emerald-500 transition-all duration-300 pointer-events-none"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-12 border-t-2 border-stone-400 bg-stone-50/60">
            <div className="col-span-7 border-r border-stone-400 px-3 py-3 flex items-center">
              <span className="text-[10px] text-stone-400">
                격자 칸을 누르면 시·분·초 구간을 입력·수정할 수 있어요
              </span>
            </div>
            <div className="col-span-5 px-3 py-2.5 flex flex-col justify-between">
              <span className="text-xs font-extrabold text-stone-700">total</span>
              <div className="flex items-baseline justify-end gap-2 mt-1">
                <span className="text-base font-extrabold text-emerald-700">{totalH}</span>
                <span className="text-xs font-bold text-stone-600">h</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {pad2(totalM)}
                </span>
                <span className="text-xs font-bold text-stone-600">m</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 격자 클릭 시 뒷배경 어둡게 + 시:분:초 ~ 시:분:초 설정 팝업 */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-stone-900">
                ⏱️ {editingRangeId ? "공부 시간 수정" : "공부 시간 입력"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-stone-400 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyTimeRange} className="space-y-3">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1.5">
                <span className="block text-[11px] font-bold text-stone-500">시작 (시 : 분 : 초)</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={startH}
                      onChange={(e) => setStartH(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg py-1.5 text-xs font-extrabold text-center"
                    />
                    <span className="text-[11px] font-bold">시</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={startM}
                      onChange={(e) => setStartM(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg py-1.5 text-xs font-extrabold text-center"
                    />
                    <span className="text-[11px] font-bold">분</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={startS}
                      onChange={(e) => setStartS(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg py-1.5 text-xs font-extrabold text-center"
                    />
                    <span className="text-[11px] font-bold">초</span>
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1.5">
                <span className="block text-[11px] font-bold text-stone-500">종료 (시 : 분 : 초)</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={endH}
                      onChange={(e) => setEndH(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg py-1.5 text-xs font-extrabold text-center"
                    />
                    <span className="text-[11px] font-bold">시</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={endM}
                      onChange={(e) => setEndM(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg py-1.5 text-xs font-extrabold text-center"
                    />
                    <span className="text-[11px] font-bold">분</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={endS}
                      onChange={(e) => setEndS(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg py-1.5 text-xs font-extrabold text-center"
                    />
                    <span className="text-[11px] font-bold">초</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                {editingRangeId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRange(editingRangeId)}
                    className="px-3.5 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 text-xs font-extrabold rounded-xl"
                  >
                    삭제
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl"
                >
                  적용하기
                </button>
              </div>
            </form>

            {currentTime.ranges.length > 0 && (
              <div className="pt-2 border-t border-stone-100 space-y-1.5">
                <p className="text-[11px] font-bold text-stone-500">오늘 적용된 시간 목록</p>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {currentTime.ranges.map((r) => {
                    const s = offsetSecToHms(r.startSec);
                    const e = offsetSecToHms(r.endSec);
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between text-[11px] bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200"
                      >
                        <span className="font-bold text-stone-700">
                          {pad2(s.h)}:{pad2(s.m)}:{pad2(s.s)} ~ {pad2(e.h)}:{pad2(e.m)}:{pad2(e.s)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRange(r.id)}
                          className="text-rose-500 font-bold"
                        >
                          삭제
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
