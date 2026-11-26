"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import QuizRunnerModal, { ShortAnswerItem } from "../components/QuizRunnerModal";

interface SubjectCard {
  id: string;
  name: string;
  icon: string;
  href: string;
  color: string;
}

const SUBJECTS_KEY = "kwan_study_subjects_v1";
const SHORT_KEY = "kwan_study_ee_short_answers_v1";

export default function StudyQuizPage() {
  const [subjects, setSubjects] = useState<SubjectCard[]>([]);
  const [shortItems, setShortItems] = useState<ShortAnswerItem[]>([]);

  // 모달 상태
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"setup" | "wrong-only">("setup");

  // 자주 틀린 문제 아코디언 & 정답 토글
  const [isWrongListOpen, setIsWrongListOpen] = useState(true);
  const [revealedIds, setRevealedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const savedSub = localStorage.getItem(SUBJECTS_KEY);
      if (savedSub) {
        setSubjects(JSON.parse(savedSub));
      } else {
        setSubjects([
          {
            id: "default-ee",
            name: "전기기사",
            icon: "⚡",
            href: "/study/electrical-engineer",
            color: "bg-amber-50 border-amber-200 text-amber-900",
          },
        ]);
      }

      const savedShort = localStorage.getItem(SHORT_KEY);
      if (savedShort) setShortItems(JSON.parse(savedShort));
    } catch {
      // 무시
    }
  }, []);

  // 맞음 / 틀림 판정 시 오답 횟수(wrongCount) 실시간 누적 저장
  const handleRecordResult = (id: number, isCorrect: boolean) => {
    if (isCorrect) return;
    setShortItems((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, wrongCount: (item.wrongCount || 0) + 1 } : item
      );
      localStorage.setItem(SHORT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetWrongCount = (id: number) => {
    const next = shortItems.map((item) =>
      item.id === id ? { ...item, wrongCount: 0 } : item
    );
    setShortItems(next);
    localStorage.setItem(SHORT_KEY, JSON.stringify(next));
  };

  // 자주 틀린 문제 (wrongCount >= 1 인 항목을 많이 틀린 순으로 정렬)
  const frequentWrongItems = [...shortItems]
    .filter((item) => (item.wrongCount || 0) > 0)
    .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0));

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      {/* 상단 고정 헤더 (STUDY 배지 통일) */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              href="/study"
              className="text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg transition"
            >
              ← 공부
            </Link>
            <h1 className="text-base font-extrabold text-stone-900">퀴즈 📝</h1>
          </div>
          <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
            STUDY
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {/* 1. 나의 공부 과목 카테고리 선택 */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold text-stone-600 px-1">과목 선택</h2>
          <div className="grid grid-cols-3 gap-3">
            {subjects.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setModalMode("setup");
                  setActiveSubject(sub.name);
                }}
                className={`aspect-square rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 shadow-sm hover:scale-[1.02] transition ${sub.color}`}
              >
                <span className="text-3xl">{sub.icon}</span>
                <span className="text-xs font-bold text-center break-keep">{sub.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 2. 자주 틀린 문제 모음 박스 (얇은 구분선 스타일) */}
        <section className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div
            onClick={() => setIsWrongListOpen(!isWrongListOpen)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-stone-900">🔥 자주 틀린 문제</h2>
              <span className="text-xs font-extrabold text-rose-500">
                {isWrongListOpen ? "▼" : "▶"}
              </span>
            </div>
            <span className="text-[11px] font-bold text-stone-400">
              {frequentWrongItems.length}문제
            </span>
          </div>

          {isWrongListOpen && (
            <div className="border-t border-stone-200 pt-2 space-y-2">
              {frequentWrongItems.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-400">
                  아직 틀린 문제가 없습니다.
                  <br />위 과목을 눌러 단답 퀴즈를 풀어보세요!
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode("wrong-only");
                      setActiveSubject("전기기사 (자주 틀린 문제)");
                    }}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold rounded-xl transition"
                  >
                    🔁 자주 틀린 문제만 집중 복습하기 ({frequentWrongItems.length}문제)
                  </button>

                  <div className="divide-y divide-stone-200">
                    {frequentWrongItems.map((item) => {
                      const isRevealed = !!revealedIds[item.id];
                      return (
                        <div key={item.id} className="py-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                              {item.wrongCount}회 틀림
                            </span>
                            <button
                              type="button"
                              onClick={() => resetWrongCount(item.id)}
                              className="text-[11px] text-stone-400 hover:text-stone-700"
                            >
                              목록에서 제외
                            </button>
                          </div>

                          <p className="text-xs font-bold text-stone-800 whitespace-pre-line leading-relaxed">
                            {item.question}
                          </p>

                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedIds((prev) => ({
                                  ...prev,
                                  [item.id]: !prev[item.id],
                                }))
                              }
                              className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg"
                            >
                              {isRevealed ? "정답 숨기기 ▲" : "정답 보기 ▼"}
                            </button>

                            {isRevealed && (
                              <p className="mt-2 pt-2 border-t border-dashed border-stone-200 text-xs font-extrabold text-emerald-800 whitespace-pre-line leading-relaxed">
                                {item.answer}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      {/* 과목 클릭 시 뜨는 투명 배경 설정 및 단답 퀴즈 모달 */}
      {activeSubject && (
        <QuizRunnerModal
          subjectName={activeSubject}
          allItems={shortItems}
          initialMode={modalMode}
          onClose={() => setActiveSubject(null)}
          onRecordResult={handleRecordResult}
        />
      )}
    </div>
  );
}
