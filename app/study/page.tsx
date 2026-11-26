"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import StudyTimerBox from "./components/StudyTimerBox";
import {
  DayTimeRecord,
  getStudyDateAndSlot,
  loadTimeRecords,
  loadGoalMinutes,
} from "../utils/studyTime";

interface ToolCard {
  id: string;
  title: string;
  desc: string;
  icon: string;
  href: string;
  color: string;
}

interface SubjectCard {
  id: string;
  name: string;
  icon: string;
  href: string;
  color: string;
}

const AVAILABLE_TOOLS: ToolCard[] = [
  { id: "quiz", title: "퀴즈", desc: "기출 · 개념 테스트", icon: "📝", href: "/study/quiz", color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
  { id: "saved", title: "저장", desc: "복습 회차 · 오답 누적", icon: "🔖", href: "/study/saved", color: "bg-sky-50 border-sky-200 text-sky-900" },
  { id: "settings", title: "설정", desc: "목표 공부 시간 설정", icon: "⚙️", href: "/study/settings", color: "bg-stone-100 border-stone-200 text-stone-800" },
  { id: "planner", title: "스터디플래너", desc: "시간별 타임테이블", icon: "🗓️", href: "/study/planner", color: "bg-indigo-50 border-indigo-200 text-indigo-900" },
];

const AVAILABLE_SUBJECTS: Omit<SubjectCard, "id">[] = [
  {
    name: "전기기사",
    icon: "⚡",
    href: "/study/electrical-engineer",
    color: "bg-amber-50 border-amber-200 text-amber-900",
  },
];

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

export default function StudyPage() {
  const [todayStr, setTodayStr] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10);

  const [timeRecords, setTimeRecords] = useState<Record<string, DayTimeRecord>>({});
  const [goalMinutes, setGoalMinutes] = useState(240);

  const [tools, setTools] = useState<ToolCard[]>([]);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [isEditingTools, setIsEditingTools] = useState(false);

  const [subjects, setSubjects] = useState<SubjectCard[]>([]);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isEditingSubjects, setIsEditingSubjects] = useState(false);

  const refreshTimeData = useCallback(() => {
    setTimeRecords(loadTimeRecords());
    setGoalMinutes(loadGoalMinutes());
  }, []);

  useEffect(() => {
    const now = new Date();
    const { dStr } = getStudyDateAndSlot(now);
    setTodayStr(dStr);
    setSelectedDate(dStr);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    refreshTimeData();

    try {
      const savedTools = localStorage.getItem("kwan_study_tools_v2");
      if (savedTools) setTools(JSON.parse(savedTools));
      const savedSubjects = localStorage.getItem("kwan_study_subjects_v1");
      if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    } catch {
      // 무시
    }
  }, [refreshTimeData]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const saveTools = (next: ToolCard[]) => {
    setTools(next);
    localStorage.setItem("kwan_study_tools_v2", JSON.stringify(next));
  };

  const saveSubjects = (next: SubjectCard[]) => {
    setSubjects(next);
    localStorage.setItem("kwan_study_subjects_v1", JSON.stringify(next));
  };

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const studyDays = Object.entries(timeRecords).filter(
    ([d, r]) => d.startsWith(monthPrefix) && r.seconds > 0
  ).length;

  const selectedSec = selectedDate ? timeRecords[selectedDate]?.seconds || 0 : 0;
  const goalSec = goalMinutes * 60;
  const fillPct = Math.min(100, Math.round((selectedSec / goalSec) * 100));
  const blockCount = Math.max(1, Math.min(12, Math.round(goalMinutes / 60)));

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg">
              ← 홈
            </Link>
            <h1 className="text-base font-extrabold text-stone-900">공부 📚</h1>
          </div>
          <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
            STUDY
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {/* 1. 공부 달력 & 목표 시간 기준 등분 네모 게이지 */}
        <section className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (viewMonth === 0 ? (setViewYear(viewYear - 1), setViewMonth(11)) : setViewMonth(viewMonth - 1))}
                className="w-7 h-7 rounded-lg bg-stone-100 text-xs font-bold"
              >
                ◀
              </button>
              <h2 className="text-base font-extrabold text-stone-900">
                {viewYear}년 {viewMonth + 1}월
              </h2>
              <button
                type="button"
                onClick={() => (viewMonth === 11 ? (setViewYear(viewYear + 1), setViewMonth(0)) : setViewMonth(viewMonth + 1))}
                className="w-7 h-7 rounded-lg bg-stone-100 text-xs font-bold"
              >
                ▶
              </button>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
              이번 달 {studyDays}일 공부 🔥
            </span>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-bold text-stone-400">
            {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => (
              <div key={w} className={`py-1 ${i === 0 ? "text-rose-400" : i === 6 ? "text-sky-500" : ""}`}>
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const daySec = timeRecords[dStr]?.seconds || 0;
              const dayPct = Math.min(100, Math.round((daySec / goalSec) * 100));
              const isSelected = selectedDate === dStr;

              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => setSelectedDate(dStr)}
                  className={`relative h-12 rounded-xl text-xs font-bold flex items-center justify-center overflow-hidden border ${
                    isSelected
                      ? "bg-stone-900 text-white border-stone-900"
                      : daySec > 0
                      ? "bg-emerald-50/50 text-emerald-950 border-emerald-300"
                      : dStr === todayStr
                      ? "bg-stone-100 border-stone-300"
                      : "bg-white border-transparent"
                  }`}
                >
                  {!isSelected && dayPct > 0 && (
                    <span
                      style={{ height: `${dayPct}%` }}
                      className="absolute bottom-0 left-0 right-0 bg-emerald-200/70 pointer-events-none"
                    />
                  )}
                  <span className="relative z-10">{day}</span>
                </button>
              );
            })}
          </div>

          {/* 목표 공부량 기준 등분 네모칸 게이지 */}
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-stone-800">
                📌 {selectedDate || "오늘"} ({fillPct}%)
              </span>
              <span className="font-bold text-emerald-700">
                {formatDuration(selectedSec)} / 목표 {Math.round((goalMinutes / 60) * 10) / 10}시간
              </span>
            </div>

            <div
              style={{ gridTemplateColumns: `repeat(${blockCount}, minmax(0, 1fr))` }}
              className="grid gap-1.5 h-7 bg-stone-100 p-1 rounded-xl border border-stone-200"
            >
              {Array.from({ length: blockCount }).map((_, idx) => {
                const start = (idx / blockCount) * 100;
                const end = ((idx + 1) / blockCount) * 100;
                const fill = Math.max(0, Math.min(100, ((fillPct - start) / (end - start)) * 100));
                return (
                  <div key={idx} className="h-full bg-white rounded-md border border-stone-200 overflow-hidden">
                    <div style={{ width: `${fill}%` }} className="h-full bg-emerald-500 transition-all" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 2. 달력 밑 접이식 공부 타이머 */}
        <StudyTimerBox onTick={refreshTimeData} />

        {/* 3. 학습 도구 */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-stone-600">학습 도구 ({tools.length}/4)</h2>
            {tools.length > 0 && (
              <button
                type="button"
                onClick={() => setIsEditingTools(!isEditingTools)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  isEditingTools ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-500 border-stone-200"
                }`}
              >
                {isEditingTools ? "완료" : "수정"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className={`relative h-20 rounded-2xl border px-4 py-3 flex items-center justify-between shadow-xs ${tool.color}`}
              >
                {isEditingTools && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const next = tools.filter((t) => t.id !== tool.id);
                      saveTools(next);
                      if (next.length === 0) setIsEditingTools(false);
                    }}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/90 text-[10px] text-rose-500 flex items-center justify-center"
                  >
                    ✕
                  </button>
                )}
                <div className="pr-2">
                  <p className="text-sm font-extrabold">{tool.title}</p>
                  <p className="text-[11px] opacity-75 mt-0.5">{tool.desc}</p>
                </div>
                <span className="text-2xl shrink-0">{tool.icon}</span>
              </Link>
            ))}

            {tools.length < 4 && (
              <button
                type="button"
                onClick={() => setIsAddingTool(true)}
                className="h-20 rounded-2xl border-2 border-dashed border-stone-300 bg-white flex flex-col items-center justify-center text-stone-400"
              >
                <span className="text-2xl font-light leading-none">+</span>
                <span className="text-[11px] font-semibold">추가</span>
              </button>
            )}
          </div>

          {isAddingTool && (
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">학습 도구 선택</h3>
                <button type="button" onClick={() => setIsAddingTool(false)} className="text-xs text-stone-400">
                  닫기 ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_TOOLS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={tools.some((t) => t.id === item.id)}
                    onClick={() => {
                      saveTools([...tools, item]);
                      setIsAddingTool(false);
                    }}
                    className="py-3 px-3 rounded-xl border border-stone-200 bg-stone-50 disabled:opacity-40 text-xs font-bold flex items-center gap-2"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 4. 나의 공부 과목 (수정 버튼 누를 때만 X 표시) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-stone-600">나의 공부 과목 ({subjects.length})</h2>
            {subjects.length > 0 && (
              <button
                type="button"
                onClick={() => setIsEditingSubjects(!isEditingSubjects)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  isEditingSubjects ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-500 border-stone-200"
                }`}
              >
                {isEditingSubjects ? "완료" : "수정"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {subjects.map((sub) => (
              <Link
                key={sub.id}
                href={sub.href}
                className={`relative aspect-square rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 shadow-sm ${sub.color}`}
              >
                {isEditingSubjects && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const next = subjects.filter((s) => s.id !== sub.id);
                      saveSubjects(next);
                      if (next.length === 0) setIsEditingSubjects(false);
                    }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/90 text-[10px] text-rose-500 flex items-center justify-center"
                  >
                    ✕
                  </button>
                )}
                <span className="text-3xl">{sub.icon}</span>
                <span className="text-xs font-bold text-center">{sub.name}</span>
              </Link>
            ))}

            <button
              type="button"
              onClick={() => setIsAddingSubject(true)}
              className="aspect-square rounded-2xl border-2 border-dashed border-stone-300 bg-white flex flex-col items-center justify-center gap-1 text-stone-400"
            >
              <span className="text-3xl font-light">+</span>
              <span className="text-[11px] font-semibold">추가</span>
            </button>
          </div>

          {isAddingSubject && (
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">공부 과목 선택</h3>
                <button type="button" onClick={() => setIsAddingSubject(false)} className="text-xs text-stone-400">
                  닫기 ✕
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_SUBJECTS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    disabled={subjects.some((s) => s.name === item.name)}
                    onClick={() => {
                      saveSubjects([...subjects, { ...item, id: String(Date.now()) }]);
                      setIsAddingSubject(false);
                    }}
                    className="py-3 px-2 rounded-xl border border-stone-200 bg-stone-50 disabled:opacity-40 text-xs font-bold flex flex-col items-center gap-1.5"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
