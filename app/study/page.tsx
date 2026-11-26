"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface StudyLog {
  date: string;
  memo: string;
}

interface SubjectCard {
  id: string;
  name: string;
  icon: string;
  href: string;
  color: string;
}

const AVAILABLE_SUBJECTS: Omit<SubjectCard, "id">[] = [
  {
    name: "전기기사",
    icon: "⚡",
    href: "/study/electrical-engineer",
    color: "bg-amber-50 border-amber-200 text-amber-900",
  },
];

const QUICK_MENUS = [
  { id: "quiz", title: "퀴즈", desc: "기출 · 개념 테스트", icon: "📝", color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
  { id: "saved", title: "저장", desc: "오답 · 핵심 요약집", icon: "🔖", color: "bg-sky-50 border-sky-200 text-sky-900" },
  { id: "pending", title: "미정", desc: "추후 기능 확장", icon: "✨", color: "bg-stone-100 border-stone-200 text-stone-700" },
  { id: "planner", title: "스터디플래너", desc: "목표 · 학습 시간표", icon: "🗓️", color: "bg-indigo-50 border-indigo-200 text-indigo-900" },
];

export default function StudyPage() {
  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  };

  const todayStr = getTodayStr();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  // 공부 전용 달력 데이터
  const [studyLogs, setStudyLogs] = useState<Record<string, StudyLog>>({});
  const [memoInput, setMemoInput] = useState("");

  // 2x2 메뉴 선택 상태
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // 하단 공부 과목 카드 (+ 추가 방식)
  const [subjects, setSubjects] = useState<SubjectCard[]>([]);
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  useEffect(() => {
    try {
      const savedStudy = localStorage.getItem("kwan_study_calendar_v1");
      if (savedStudy) {
        const parsed = JSON.parse(savedStudy);
        setStudyLogs(parsed);
        if (parsed[todayStr]) setMemoInput(parsed[todayStr].memo || "");
      }

      const savedSubjects = localStorage.getItem("kwan_study_subjects_v1");
      if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    } catch {
      // 파싱 오류 무시
    }
  }, [todayStr]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dStr);
    setMemoInput(studyLogs[dStr]?.memo || "");
  };

  const handleSaveStudyLog = (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      ...studyLogs,
      [selectedDate]: {
        date: selectedDate,
        memo: memoInput.trim() || "오늘 공부 완료 📚",
      },
    };
    setStudyLogs(next);
    localStorage.setItem("kwan_study_calendar_v1", JSON.stringify(next));
  };

  const handleDeleteStudyLog = () => {
    const next = { ...studyLogs };
    delete next[selectedDate];
    setStudyLogs(next);
    setMemoInput("");
    localStorage.setItem("kwan_study_calendar_v1", JSON.stringify(next));
  };

  const saveSubjects = (next: SubjectCard[]) => {
    setSubjects(next);
    localStorage.setItem("kwan_study_subjects_v1", JSON.stringify(next));
  };

  const handleAddSubject = (item: Omit<SubjectCard, "id">) => {
    const next = [...subjects, { ...item, id: String(Date.now()) }];
    saveSubjects(next);
    setIsAddingSubject(false);
  };

  const handleDeleteSubject = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("이 공부 과목을 삭제할까요?")) {
      saveSubjects(subjects.filter((s) => s.id !== id));
    }
  };

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const studyCount = Object.keys(studyLogs).filter((d) => d.startsWith(monthPrefix)).length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      {/* 상단 고정 헤더 */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg transition"
            >
              ← 홈
            </Link>
            <h1 className="text-base font-extrabold text-stone-900">나의 공부 기록 📚</h1>
          </div>
          <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
            STUDY
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-6">
        {/* 1. 공부 전용 캘린더 */}
        <section className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-700"
              >
                ◀
              </button>
              <h2 className="text-base font-extrabold text-stone-900">
                {viewYear}년 {viewMonth + 1}월
              </h2>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-700"
              >
                ▶
              </button>
            </div>

            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
              이번 달 {studyCount}일 공부 🔥
            </span>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-stone-400">
            {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => (
              <div
                key={w}
                className={`py-1 ${i === 0 ? "text-rose-400" : i === 6 ? "text-sky-500" : ""}`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 큰 날짜 칸 그리드 */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(
                day
              ).padStart(2, "0")}`;
              const hasStudy = !!studyLogs[dStr];
              const isSelected = selectedDate === dStr;
              const isToday = dStr === todayStr;

              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-12 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition border ${
                    isSelected
                      ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                      : hasStudy
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                      : isToday
                      ? "bg-stone-100 text-stone-900 border-stone-300"
                      : "bg-white hover:bg-stone-50 text-stone-700 border-transparent"
                  }`}
                >
                  <span>{day}</span>
                  {hasStudy && <span className="text-[10px] leading-none">📚</span>}
                </button>
              );
            })}
          </div>

          {/* 선택한 날짜 공부 메모 */}
          <form onSubmit={handleSaveStudyLog} className="pt-2 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-stone-800">📌 {selectedDate} 공부 기록</span>
              {studyLogs[selectedDate] && (
                <button
                  type="button"
                  onClick={handleDeleteStudyLog}
                  className="text-[11px] font-bold text-rose-500"
                >
                  삭제
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="오늘 공부한 내용 한 줄 기록 (예: 전기자기학 2장 완료)"
                value={memoInput}
                onChange={(e) => setMemoInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shrink-0"
              >
                체크
              </button>
            </div>
          </form>
        </section>

        {/* 2. 2x2 직사각형 4개 메뉴 박스 (퀴즈 / 저장 / 미정 / 스터디플래너) */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold text-stone-600 px-1">학습 도구</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_MENUS.map((menu) => (
              <button
                key={menu.id}
                type="button"
                onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
                className={`h-20 rounded-2xl border px-4 py-3 flex items-center justify-between text-left shadow-xs hover:scale-[1.01] transition ${menu.color}`}
              >
                <div>
                  <p className="text-sm font-extrabold">{menu.title}</p>
                  <p className="text-[11px] opacity-75 mt-0.5">{menu.desc}</p>
                </div>
                <span className="text-2xl">{menu.icon}</span>
              </button>
            ))}
          </div>

          {activeMenu && (
            <div className="bg-white border border-stone-200 rounded-2xl p-3.5 text-xs text-stone-600 flex items-center justify-between shadow-xs">
              <span>
                <strong>{QUICK_MENUS.find((m) => m.id === activeMenu)?.title}</strong> 기능은 준비 중입니다! 원하시는 구성을 말씀해 주시면 바로 연결해 드릴게요.
              </span>
              <button
                type="button"
                onClick={() => setActiveMenu(null)}
                className="text-stone-400 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}
        </section>

        {/* 3. 하단 공부 과목 보드 (+ 추가 방식으로 전기기사 넣기) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-stone-600">
              나의 공부 과목 ({subjects.length})
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {subjects.map((sub) => (
              <Link
                key={sub.id}
                href={sub.href}
                className={`relative aspect-square rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 shadow-sm hover:scale-[1.02] transition ${sub.color}`}
              >
                <button
                  type="button"
                  onClick={(e) => handleDeleteSubject(e, sub.id)}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/80 text-[10px] text-stone-400 hover:text-rose-600 flex items-center justify-center"
                  aria-label="삭제"
                >
                  ✕
                </button>
                <span className="text-3xl">{sub.icon}</span>
                <span className="text-xs font-bold text-center break-keep">{sub.name}</span>
              </Link>
            ))}

            <button
              type="button"
              onClick={() => setIsAddingSubject(true)}
              className="aspect-square rounded-2xl border-2 border-dashed border-stone-300 bg-white hover:bg-stone-100 flex flex-col items-center justify-center gap-1 text-stone-400 hover:text-stone-700 transition"
            >
              <span className="text-3xl font-light">+</span>
              <span className="text-[11px] font-semibold">추가</span>
            </button>
          </div>

          {/* + 버튼 클릭 시 열리는 과목 선택 창 */}
          {isAddingSubject && (
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-800">공부 과목 선택</h3>
                <button
                  type="button"
                  onClick={() => setIsAddingSubject(false)}
                  className="text-xs text-stone-400"
                >
                  닫기 ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_SUBJECTS.map((item) => {
                  const alreadyAdded = subjects.some((s) => s.name === item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddSubject(item)}
                      className="py-3 px-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-40 text-xs font-bold flex flex-col items-center gap-1.5 transition"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
