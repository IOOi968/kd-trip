"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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

function sortExamGroups(groups: ExamGroup[]): ExamGroup[] {
  return [...groups].sort((a, b) => {
    const matchA = a.examName.match(/^(\d{4})\D*(\d+)?/);
    const matchB = b.examName.match(/^(\d{4})\D*(\d+)?/);

    if (matchA && matchB) {
      const yearA = Number(matchA[1]);
      const yearB = Number(matchB[1]);
      if (yearA !== yearB) return yearB - yearA;

      const roundA = matchA[2] ? Number(matchA[2]) : 0;
      const roundB = matchB[2] ? Number(matchB[2]) : 0;
      if (roundA !== roundB) return roundA - roundB;
    }
    return b.examName.localeCompare(a.examName, "ko", { numeric: true });
  });
}

export default function SavedReviewPage() {
  const [reviewExams, setReviewExams] = useState<ExamGroup[]>([]);
  const [openExams, setOpenExams] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kwan_study_ee_exams_v1");
      if (saved) {
        const parsed: ExamGroup[] = JSON.parse(saved);
        setReviewExams(sortExamGroups(parsed.filter((g) => g.attempts.length >= 2)));
      }
    } catch {
      // 파싱 오류 무시
    }
  }, []);

  const toggleOpen = (name: string) => {
    setOpenExams((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              href="/study"
              className="text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg transition"
            >
              ← 공부
            </Link>
            <h1 className="text-base font-extrabold text-stone-900">복습 저장함 🔖</h1>
          </div>
          <span className="text-[11px] font-bold bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full">
            누적 {reviewExams.length}건
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-3">
        {reviewExams.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center text-xs text-stone-400 space-y-2">
            <p className="font-bold text-stone-600">아직 복습 누적된 회차가 없습니다.</p>
            <p>전기기사에서 같은 시험(ex. 2026-1)을 2회차 이상 다시 풀어 저장하면 이곳에 자동으로 모입니다.</p>
          </div>
        ) : (
          reviewExams.map((group) => {
            const isOpen = !!openExams[group.examName];
            const first = group.attempts[0];
            const latest = group.attempts[group.attempts.length - 1];

            return (
              <div
                key={group.examName}
                className="bg-white border border-sky-200 rounded-2xl overflow-hidden shadow-2xs"
              >
                <div
                  onClick={() => toggleOpen(group.examName)}
                  className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-sky-50/60 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-sky-600">
                      {isOpen ? "▼" : "▶"}
                    </span>
                    <span className="text-sm font-extrabold text-stone-900">
                      ⚡ {group.examName}
                    </span>
                    <span className="text-[11px] font-bold bg-sky-600 text-white px-2 py-0.5 rounded-full">
                      {group.attempts.length}회 누적
                    </span>
                  </div>

                  <span className="text-xs font-bold text-stone-600">
                    {first.correctScore}점 →{" "}
                    <strong className="text-emerald-700">{latest.correctScore}점</strong>
                  </span>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 border-t border-sky-100 bg-stone-50/70 space-y-2">
                    {group.attempts.map((att) => (
                      <div
                        key={att.id}
                        className="bg-white border border-stone-200 rounded-xl p-3 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-stone-900">
                            {att.attemptNo}회차 ({att.date})
                          </span>
                          <span className="text-[11px]">
                            <span className="text-emerald-700">맞춤 {att.correctScore}</span> ·{" "}
                            <span className="text-stone-900">단답 {att.shortAnswerScore}</span> ·{" "}
                            <span className="text-sky-600">틀림 {att.wrongScore}</span> ·{" "}
                            <span className="text-rose-600">어려움 {att.unsolvedScore}</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {att.wrongNumbers.map((num) => {
                            const repeated =
                              att.attemptNo >= 2 && att.repeatedWrongNumbers.includes(num);
                            return (
                              <span
                                key={num}
                                className={`text-[11px] px-2 py-0.5 rounded font-bold border ${
                                  repeated
                                    ? "bg-rose-100 text-rose-700 border-rose-200"
                                    : "bg-stone-100 text-stone-700 border-stone-200"
                                }`}
                              >
                                {num}번
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
          })
        )}
      </main>
    </div>
  );
}
