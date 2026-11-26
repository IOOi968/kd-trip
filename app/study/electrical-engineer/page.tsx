"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ShortAnswerBox from "../components/ShortAnswerBox";

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

const STORAGE_KEY = "kwan_study_ee_exams_v1";

function parseNumbers(input: string): number[] {
  const nums = input
    .split(/[\s,./]+/)
    .map((v) => Number(v.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
  return Array.from(new Set(nums)).sort((a, b) => a - b);
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

export default function ElectricalEngineerPage() {
  const [todayStr, setTodayStr] = useState("");
  const [examGroups, setExamGroups] = useState<ExamGroup[]>([]);
  const [openExams, setOpenExams] = useState<Record<string, boolean>>({});

  const [isScoreBoxOpen, setIsScoreBoxOpen] = useState(false);
  const [isHistoryBoxOpen, setIsHistoryBoxOpen] = useState(false);

  const [examName, setExamName] = useState("");
  const [correctScore, setCorrectScore] = useState("");
  const [shortAnswerScore, setShortAnswerScore] = useState("");
  const [wrongScore, setWrongScore] = useState("");
  const [unsolvedScore, setUnsolvedScore] = useState("");
  const [wrongInput, setWrongInput] = useState("");

  useEffect(() => {
    const now = new Date();
    const tStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    setTodayStr(tStr);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ExamGroup[] = JSON.parse(saved);
        setExamGroups(sortExamGroups(parsed));
      }
    } catch {
      // 파싱 오류 무시
    }
  }, []);

  const saveGroups = (next: ExamGroup[]) => {
    const sorted = sortExamGroups(next);
    setExamGroups(sorted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  };

  const normalizedName = examName.trim();
  const existingGroup = examGroups.find((g) => g.examName === normalizedName);
  const currentWrongList = parseNumbers(wrongInput);

  const pastWrongSet = new Set<number>(
    existingGroup ? existingGroup.attempts.flatMap((a) => a.wrongNumbers) : []
  );
  const liveRepeatedList = currentWrongList.filter((n) => pastWrongSet.has(n));

  const handleSaveAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedName) return alert("시험 이름을 입력해 주세요. (예: 2026-1)");

    const prevAttempts = existingGroup ? existingGroup.attempts : [];
    const attemptNo = prevAttempts.length + 1;

    const prevWrongUnion = new Set<number>(
      prevAttempts.flatMap((a) => a.wrongNumbers)
    );
    const repeatedWrongNumbers = currentWrongList.filter((n) =>
      prevWrongUnion.has(n)
    );

    const newAttempt: AttemptRecord = {
      id: Date.now(),
      attemptNo,
      date: todayStr,
      correctScore: correctScore.trim() || "0",
      shortAnswerScore: shortAnswerScore.trim() || "0",
      wrongScore: wrongScore.trim() || "0",
      unsolvedScore: unsolvedScore.trim() || "0",
      wrongNumbers: currentWrongList,
      repeatedWrongNumbers,
    };

    let nextGroups: ExamGroup[];
    if (existingGroup) {
      nextGroups = examGroups.map((g) =>
        g.examName === normalizedName
          ? { ...g, attempts: [...g.attempts, newAttempt] }
          : g
      );
    } else {
      nextGroups = [
        ...examGroups,
        { examName: normalizedName, attempts: [newAttempt] },
      ];
    }

    saveGroups(nextGroups);
    setIsHistoryBoxOpen(true);
    setOpenExams((prev) => ({ ...prev, [normalizedName]: true }));

    setCorrectScore("");
    setShortAnswerScore("");
    setWrongScore("");
    setUnsolvedScore("");
    setWrongInput("");

    if (attemptNo >= 2) {
      alert(
        `[${normalizedName}] ${attemptNo}회차 기록이 누적 저장되었으며, 공부 보드 '저장' 칸에도 반영되었습니다!`
      );
    } else {
      alert(`[${normalizedName}] 1회차 기록이 저장되었습니다.`);
    }
  };

  const toggleOpen = (name: string) => {
    setOpenExams((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleDeleteGroup = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (confirm(`[${name}] 회차의 모든 기록을 삭제할까요?`)) {
      saveGroups(examGroups.filter((g) => g.examName !== name));
    }
  };

  const handleDeleteSingleAttempt = (name: string, attemptId: number) => {
    if (!confirm("이 풀이 차수 기록을 삭제할까요?")) return;
    const next = examGroups
      .map((g) => {
        if (g.examName !== name) return g;
        const filtered = g.attempts
          .filter((a) => a.id !== attemptId)
          .map((a, idx) => ({ ...a, attemptNo: idx + 1 }));
        return { ...g, attempts: filtered };
      })
      .filter((g) => g.attempts.length > 0);
    saveGroups(next);
  };

  const reviewGroupCount = examGroups.filter((g) => g.attempts.length >= 2).length;

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
            <h1 className="text-base font-extrabold text-stone-900">전기기사 ⚡</h1>
          </div>
          <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
            STUDY
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {/* 1. 기출 회차 점수 · 오답 기록 박스 */}
        <section className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3.5">
          <div
            onClick={() => setIsScoreBoxOpen(!isScoreBoxOpen)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-stone-900">📝 기출 회차 점수 · 오답 기록</h2>
              <span className="text-xs font-extrabold text-amber-600">
                {isScoreBoxOpen ? "▼" : "▶"}
              </span>
            </div>
            {existingGroup && isScoreBoxOpen && (
              <span className="text-[11px] font-bold bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
                {existingGroup.attempts.length + 1}회차 입력 중
              </span>
            )}
          </div>

          {isScoreBoxOpen && (
            <form onSubmit={handleSaveAttempt} className="space-y-3.5 pt-1">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-stone-600">시험 이름</label>
                <input
                  type="text"
                  placeholder="ex) 2026-1"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-extrabold border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-stone-600">점수 기록</label>
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2">
                    <span className="block text-[10px] font-bold text-emerald-800 mb-1">맞춘 점수</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={correctScore}
                      onChange={(e) => setCorrectScore(e.target.value)}
                      className="w-full bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs font-extrabold text-center text-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div className="bg-stone-100 border border-stone-200 rounded-xl p-2">
                    <span className="block text-[10px] font-bold text-stone-800 mb-1">단답 점수</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={shortAnswerScore}
                      onChange={(e) => setShortAnswerScore(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-extrabold text-center text-stone-900 focus:outline-none"
                    />
                  </div>

                  <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-2">
                    <span className="block text-[10px] font-bold text-sky-800 mb-1">틀린 점수</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={wrongScore}
                      onChange={(e) => setWrongScore(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded-lg px-2 py-1 text-xs font-extrabold text-center text-sky-600 focus:outline-none"
                    />
                  </div>

                  <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-2">
                    <span className="block text-[10px] font-bold text-rose-800 mb-1">어려운 문제</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={unsolvedScore}
                      onChange={(e) => setUnsolvedScore(e.target.value)}
                      className="w-full bg-white border border-rose-200 rounded-lg px-2 py-1 text-xs font-extrabold text-center text-rose-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-stone-600">
                  틀린 번호 (쉼표 또는 띄어쓰기로 구분)
                </label>
                <input
                  type="text"
                  placeholder="ex) 3, 12, 24, 58"
                  value={wrongInput}
                  onChange={(e) => setWrongInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none"
                />

                {existingGroup && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5 text-xs">
                    <p className="font-extrabold text-amber-950">
                      🔍 이전 [{existingGroup.examName}] 오답 비교 ({existingGroup.attempts.length}회 누적)
                    </p>
                    <p className="text-[11px] text-stone-700">
                      이전 틀린 번호:{" "}
                      {Array.from(pastWrongSet).length > 0
                        ? Array.from(pastWrongSet)
                            .sort((a, b) => a - b)
                            .map((n) => `${n}번`)
                            .join(", ")
                        : "없음"}
                    </p>
                    {liveRepeatedList.length > 0 ? (
                      <p className="text-[11px] font-extrabold text-rose-600">
                        ⚠️ 중복 오답 번호: {liveRepeatedList.map((n) => `${n}번`).join(", ")}
                      </p>
                    ) : (
                      currentWrongList.length > 0 && (
                        <p className="text-[11px] font-bold text-emerald-700">
                          ✅ 이전에 틀렸던 번호는 모두 맞혔습니다!
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-xs transition"
              >
                {existingGroup
                  ? `저장하기 (${existingGroup.attempts.length + 1}회차 누적 → 공부 보드 '저장' 연동)`
                  : "저장하기 (1회차 등록)"}
              </button>
            </form>
          )}
        </section>

        {/* 2. 누적 회차 기록 박스 (박스 안에 중첩 박스 없이 얇은 가로 구분선만 적용) */}
        <section className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div
            onClick={() => setIsHistoryBoxOpen(!isHistoryBoxOpen)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-stone-900">📚 누적 회차 기록</h2>
              <span className="text-xs font-extrabold text-amber-600">
                {isHistoryBoxOpen ? "▼" : "▶"}
              </span>
            </div>
            <span className="text-[11px] font-bold text-stone-400">
              {examGroups.length}개 시험 · 복습 {reviewGroupCount}개
            </span>
          </div>

          {isHistoryBoxOpen && (
            <div className="border-t border-stone-200 pt-1">
              {examGroups.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-400">
                  아직 저장된 시험 회차가 없습니다.
                </p>
              ) : (
                <div className="divide-y divide-stone-200">
                  {examGroups.map((group) => {
                    const isOpen = !!openExams[group.examName];
                    const latest = group.attempts[group.attempts.length - 1];

                    return (
                      <div key={group.examName} className="py-3">
                        <div
                          onClick={() => toggleOpen(group.examName)}
                          className="flex items-center justify-between cursor-pointer hover:opacity-80 transition"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-extrabold text-amber-600">
                              {isOpen ? "▼" : "▶"}
                            </span>
                            <span className="text-sm font-extrabold text-stone-900">
                              {group.examName}
                            </span>
                            <span className="text-[11px] font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">
                              총 {group.attempts.length}회 풀이
                            </span>
                            {group.attempts.length >= 2 && (
                              <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                                🔖 복습 누적됨
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-extrabold text-emerald-700">
                              최근 {latest.correctScore}점
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteGroup(e, group.examName)}
                              className="text-[11px] text-stone-400 hover:text-rose-500 ml-1"
                            >
                              삭제
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="mt-2.5 pt-2 border-t border-dashed border-stone-200 divide-y divide-stone-100">
                            {group.attempts.map((att) => (
                              <div key={att.id} className="py-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                                        att.attemptNo === 1
                                          ? "bg-stone-800 text-white"
                                          : "bg-sky-600 text-white"
                                      }`}
                                    >
                                      {att.attemptNo}회차
                                    </span>
                                    <span className="text-[11px] text-stone-400">{att.date}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSingleAttempt(group.examName, att.id)}
                                    className="text-[11px] text-stone-400 hover:text-rose-500"
                                  >
                                    차수 삭제
                                  </button>
                                </div>

                                <div className="grid grid-cols-4 gap-1.5 text-center bg-stone-50 p-2 rounded-lg text-[11px]">
                                  <div>
                                    <span className="block text-[10px] text-stone-400">맞춘 점수</span>
                                    <strong className="text-emerald-700">{att.correctScore}점</strong>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-stone-400">단답 점수</span>
                                    <strong className="text-stone-900">{att.shortAnswerScore}점</strong>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-stone-400">틀린 점수</span>
                                    <strong className="text-sky-600">{att.wrongScore}점</strong>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-stone-400">어려운 문제</span>
                                    <strong className="text-rose-600">{att.unsolvedScore}점</strong>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[11px] font-bold text-stone-600">
                                    틀린 번호 ({att.wrongNumbers.length}개):
                                  </p>
                                  {att.wrongNumbers.length === 0 ? (
                                    <span className="text-[11px] text-emerald-600 font-bold">
                                      만점! 틀린 번호 없음
                                    </span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {att.wrongNumbers.map((num) => {
                                        const isRepeated =
                                          att.attemptNo >= 2 &&
                                          att.repeatedWrongNumbers.includes(num);
                                        return (
                                          <span
                                            key={num}
                                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                              isRepeated
                                                ? "bg-rose-100 text-rose-700 border-rose-200"
                                                : "bg-stone-100 text-stone-700 border-stone-200"
                                            }`}
                                          >
                                            {num}번
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
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
        </section>

        {/* 3. 단답 문제 등록 + 4. 누적 단답 기록 */}
        <ShortAnswerBox todayStr={todayStr} />
      </main>
    </div>
  );
}
