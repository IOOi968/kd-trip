"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface StudyLog {
  date: string;
  memo: string;
}

interface ToolCard {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
}

interface SubjectCard {
  id: string;
  name: string;
  icon: string;
  href: string;
  color: string;
}

interface AttemptRecord {
  id: number;
  attemptNo: number;
  date: string;
  correctScore: string;
  shortAnswerScore: string;
  wrongScore: string;
  unsolvedScore: string;
  wrongNumbers: number[];
  repeatedWrongNumbers: number[];
}

interface ExamGroup {
  examName: string;
  attempts: AttemptRecord[];
}

const AVAILABLE_TOOLS: ToolCard[] = [
  { id: "quiz", title: "퀴즈", desc: "기출 · 개념 테스트", icon: "📝", color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
  { id: "saved", title: "저장", desc: "복습 회차 · 오답 누적", icon: "🔖", color: "bg-sky-50 border-sky-200 text-sky-900" },
  { id: "settings", title: "설정", desc: "학습 환경 · 알림 설정", icon: "⚙️", color: "bg-stone-100 border-stone-200 text-stone-800" },
  { id: "planner", title: "스터디플래너", desc: "목표 · 학습 시간표", icon: "🗓️", color: "bg-indigo-50 border-indigo-200 text-indigo-900" },
];

const AVAILABLE_SUBJECTS: Omit<SubjectCard, "id">[] = [
  {
    name: "전기기사",
    icon: "⚡",
    href: "/study/electrical-engineer",
    color: "bg-amber-50 border-amber-200 text-amber-900",
  },
];

export default function StudyPage() {
  const [todayStr, setTodayStr] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10);

  // 공부 달력 데이터
  const [studyLogs, setStudyLogs] = useState<Record<string, StudyLog>>({});
  const [memoInput, setMemoInput] = useState("");

  // 학습 도구 (+ 추가 및 수정 모드 토글)
  const [tools, setTools] = useState<ToolCard[]>([]);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [isEditingTools, setIsEditingTools] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // 전기기사에서 2회차 이상(복습) 저장된 누적 회차 연동
  const [reviewExams, setReviewExams] = useState<ExamGroup[]>([]);
  const [openSavedExam, setOpenSavedExam] = useState<Record<string, boolean>>({});

  // 하단 공부 과목 카드 (+ 추가 방식)
  const [subjects, setSubjects] = useState<SubjectCard[]>([]);
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  useEffect(() => {
    const now = new Date();
    const tStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    setTodayStr(tStr);
    setSelectedDate(tStr);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());

    try {
      const savedStudy = localStorage.getItem("kwan_study_calendar_v1");
      if (savedStudy) {
        const parsed = JSON.parse(savedStudy);
        setStudyLogs(parsed);
        if (parsed[tStr]) setMemoInput(parsed[tStr].memo || "");
      }

      const savedTools = localStorage.getItem("kwan_study_tools_v1");
      if (savedTools) setTools(JSON.parse(savedTools));

      const savedSubjects = localStorage.getItem("kwan_study_subjects_v1");
      if (savedSubjects) setSubjects(JSON.parse(savedSubjects));

      // 전기기사 복습(2회차 이상) 기록 불러오기
      const savedEeExams = localStorage.getItem("kwan_study_ee_exams_v1");
      if (savedEeExams) {
        const parsedExams: ExamGroup[] = JSON.parse(savedEeExams);
        setReviewExams(parsedExams.filter((g) => g.attempts.length >= 2));
      }
    } catch {
      // 파싱 오류 무시
    }
  }, []);

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
    if (!selectedDate) return;
    const next = {
      ...studyLogs,
      [selectedDate]: {
        date: selectedDate,
        memo: memoInput.trim() || "공부 완료 📚",
      },
    };
    setStudyLogs(next);
    localStorage.setItem("kwan_study_calendar_v1", JSON.stringify(next));
  };

  const handleDeleteStudyLog = () => {
    if (!selectedDate) return;
    const next = { ...studyLogs };
    delete next[selectedDate];
    setStudyLogs(next);
    setMemoInput("");
    localStorage.setItem("kwan_study_calendar_v1", JSON.stringify(next));
  };

  const saveTools = (next: ToolCard[]) => {
    setTools(next);
    localStorage.setItem("kwan_study_tools_v1", JSON.stringify(next));
  };

  const handleAddTool = (item: ToolCard) => {
    if (tools.some((t) => t.id === item.id)) return;
    saveTools([...tools, item]);
    setIsAddingTool(false);
  };

  const handleDeleteTool = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("이 학습 도구를 삭제할까요?")) {
      const next = tools.filter((t) => t.id !== id);
      saveTools(next);
      if (activeTool === id) setActiveTool(null);
      if (next.length === 0) setIsEditingTools(false);
    }
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
            <h1 className="text-base font-extrabold text-stone-900">공부 📚</h1>
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

          {/* 선택한 날짜 메모 */}
          <form onSubmit={handleSaveStudyLog} className="pt-2 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-stone-800">
                📌 {selectedDate || "오늘"}
              </span>
              {selectedDate && studyLogs[selectedDate] && (
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
                placeholder="공부한 내용 한 줄 메모 (예: 전기자기학 2장 완료)"
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

        {/* 2. 학습 도구 (+ 추가 및 수정 버튼) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-stone-600">
              학습 도구 ({tools.length}/4)
            </h2>
            {tools.length > 0 && (
              <button
                type="button"
                onClick={() => setIsEditingTools(!isEditingTools)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border transition ${
                  isEditingTools
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-500 border-stone-200 hover:bg-stone-100"
                }`}
              >
                {isEditingTools ? "완료" : "수정"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                className={`relative h-20 rounded-2xl border px-4 py-3 flex items-center justify-between text-left shadow-xs hover:scale-[1.01] transition cursor-pointer ${tool.color}`}
              >
                {isEditingTools && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteTool(e, tool.id)}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/90 text-[10px] text-rose-500 hover:bg-rose-500 hover:text-white shadow-2xs flex items-center justify-center transition"
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                )}
                <div className="pr-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-extrabold">{tool.title}</p>
                    {tool.id === "saved" && reviewExams.length > 0 && (
                      <span className="text-[10px] font-extrabold bg-sky-600 text-white px-1.5 py-0.2 rounded-full">
                        {reviewExams.length}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-75 mt-0.5">{tool.desc}</p>
                </div>
                <span className="text-2xl shrink-0">{tool.icon}</span>
              </div>
            ))}

            {tools.length < 4 && (
              <button
                type="button"
                onClick={() => setIsAddingTool(true)}
                className="h-20 rounded-2xl border-2 border-dashed border-stone-300 bg-white hover:bg-stone-100 flex flex-col items-center justify-center gap-0.5 text-stone-400 hover:text-stone-700 transition"
              >
                <span className="text-2xl font-light leading-none">+</span>
                <span className="text-[11px] font-semibold">추가</span>
              </button>
            )}
          </div>

          {/* 학습 도구 + 추가 선택 창 */}
          {isAddingTool && (
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-800">학습 도구 선택</h3>
                <button
                  type="button"
                  onClick={() => setIsAddingTool(false)}
                  className="text-xs text-stone-400"
                >
                  닫기 ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_TOOLS.map((item) => {
                  const alreadyAdded = tools.some((t) => t.id === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddTool(item)}
                      className="py-3 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-40 text-xs font-bold flex items-center gap-2 transition"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* '저장' 도구 클릭 시: 전기기사에서 2회차 이상(복습) 누적된 회차 목록 표시 */}
          {activeTool === "saved" && (
            <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-sky-950">
                  🔖 복습 누적 회차 보관함 ({reviewExams.length}건)
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTool(null)}
                  className="text-xs text-stone-400 font-bold"
                >
                  닫기 ✕
                </button>
              </div>

              {reviewExams.length === 0 ? (
                <p className="text-xs text-stone-500 bg-stone-50 p-3 rounded-xl">
                  전기기사에서 같은 회차(ex. 2025-1)를 2회차 이상 다시 풀고 저장하면 이곳에 자동으로 누적됩니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {reviewExams.map((group) => {
                    const isOpen = !!openSavedExam[group.examName];
                    const first = group.attempts[0];
                    const latest = group.attempts[group.attempts.length - 1];

                    return (
                      <div
                        key={group.examName}
                        className="border border-sky-200 bg-sky-50/50 rounded-xl overflow-hidden"
                      >
                        <div
                          onClick={() =>
                            setOpenSavedExam((prev) => ({
                              ...prev,
                              [group.examName]: !prev[group.examName],
                            }))
                          }
                          className="px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-sky-100/60 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-sky-700">
                              {isOpen ? "▼" : "▶"}
                            </span>
                            <span className="text-xs font-extrabold text-stone-900">
                              ⚡ {group.examName}
                            </span>
                            <span className="text-[10px] font-bold bg-sky-600 text-white px-2 py-0.5 rounded-full">
                              {group.attempts.length}회 누적
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-stone-600">
                            {first.correctScore}점 →{" "}
                            <strong className="text-emerald-700">{latest.correctScore}점</strong>
                          </span>
                        </div>

                        {isOpen && (
                          <div className="px-3.5 pb-3 pt-1.5 border-t border-sky-200/70 bg-white space-y-2">
                            {group.attempts.map((att) => (
                              <div
                                key={att.id}
                                className="text-[11px] bg-stone-50 border border-stone-200 rounded-lg p-2.5 space-y-1.5"
                              >
                                <div className="flex items-center justify-between font-bold">
                                  <span className="text-stone-800">
                                    {att.attemptNo}회차 ({att.date})
                                  </span>
                                  <span className="text-emerald-700">
                                    맞춤 {att.correctScore} · 단답 {att.shortAnswerScore} · 틀림{" "}
                                    {att.wrongScore} · 못맞춤 {att.unsolvedScore}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {att.wrongNumbers.map((num) => {
                                    const repeated = att.repeatedWrongNumbers.includes(num);
                                    return (
                                      <span
                                        key={num}
                                        className={`px-1.5 py-0.5 rounded font-bold ${
                                          repeated
                                            ? "bg-rose-600 text-white"
                                            : "bg-white border border-stone-200 text-stone-600"
                                        }`}
                                      >
                                        {num}번{repeated ? " (또 틀림)" : ""}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTool && activeTool !== "saved" && (
            <div className="bg-white border border-stone-200 rounded-2xl p-3.5 text-xs text-stone-600 flex items-center justify-between shadow-xs">
              <span>
                <strong>{tools.find((m) => m.id === activeTool)?.title}</strong> 기능은 준비 중입니다! 원하시는 구성을 말씀해 주시면 바로 연결해 드릴게요.
              </span>
              <button
                type="button"
                onClick={() => setActiveTool(null)}
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
