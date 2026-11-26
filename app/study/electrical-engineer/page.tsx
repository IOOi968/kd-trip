"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface TopicNote {
  id: number;
  subject: string;
  title: string;
  content: string;
  date: string;
  bookmarked: boolean;
}

const SUBJECTS = [
  "전기자기학",
  "전력공학",
  "전기기기",
  "회로이론 및 제어공학",
  "전기설비기술기준",
  "실기",
];

const STORAGE_KEY = "kwan_study_ee_notes_v1";

export default function ElectricalEngineerPage() {
  const [todayStr, setTodayStr] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("전체");
  const [targetSubject, setTargetSubject] = useState<string>("전기자기학");

  const [notes, setNotes] = useState<TopicNote[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  useEffect(() => {
    const now = new Date();
    const tStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    setTodayStr(tStr);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setNotes(JSON.parse(saved));
    } catch {
      // 파싱 오류 무시
    }
  }, []);

  const saveNotes = (next: TopicNote[]) => {
    setNotes(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    const newNote: TopicNote = {
      id: Date.now(),
      subject: targetSubject,
      title: title.trim() || "핵심 정리",
      content: content.trim(),
      date: todayStr,
      bookmarked: false,
    };

    saveNotes([newNote, ...notes]);
    setTitle("");
    setContent("");
  };

  const toggleBookmark = (id: number) => {
    saveNotes(
      notes.map((n) => (n.id === id ? { ...n, bookmarked: !n.bookmarked } : n))
    );
  };

  const deleteNote = (id: number) => {
    if (confirm("이 노트를 삭제할까요?")) {
      saveNotes(notes.filter((n) => n.id !== id));
    }
  };

  const visibleNotes = notes.filter((n) => {
    const matchSubject = selectedSubject === "전체" || n.subject === selectedSubject;
    const matchBookmark = !onlyBookmarked || n.bookmarked;
    return matchSubject && matchBookmark;
  });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      {/* 상단 고정 헤더 */}
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
          <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
            총 {notes.length}개 노트
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {/* 1. 과목별 필터 탭 */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-stone-600">과목별 보기</span>
            <button
              type="button"
              onClick={() => setOnlyBookmarked(!onlyBookmarked)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                onlyBookmarked
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-white text-stone-500 border-stone-200"
              }`}
            >
              {onlyBookmarked ? "★ 중요 표시만 보는 중" : "☆ 중요만 보기"}
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {["전체", ...SUBJECTS].map((sub) => {
              const count =
                sub === "전체"
                  ? notes.length
                  : notes.filter((n) => n.subject === sub).length;
              const active = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    setSelectedSubject(sub);
                    if (sub !== "전체") setTargetSubject(sub);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition ${
                    active
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {sub} ({count})
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. 공식 · 개념 · 오답 노트 작성 폼 */}
        <form
          onSubmit={handleAddNote}
          className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-stone-800">✍️ 새 개념 · 공식 정리</span>
            <select
              value={targetSubject}
              onChange={(e) => setTargetSubject(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold border border-stone-200 rounded-lg bg-amber-50 text-amber-900 focus:outline-none"
            >
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="제목 / 공식명 (예: 가우스 법칙, 변압기 효율 공식)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none"
            required
          />

          <textarea
            rows={4}
            placeholder="공식, 암기 팁, 기출 오답 포인트를 자유롭게 적어두세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 text-xs leading-relaxed border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none"
          />

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition"
          >
            + 전기기사 노트에 추가하기
          </button>
        </form>

        {/* 3. 저장된 노트 목록 */}
        <section className="space-y-2.5">
          {visibleNotes.length === 0 ? (
            <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center text-xs text-stone-400">
              아직 정리된 내용이 없어요.
              <br />
              위 칸에 과목을 고르고 공식이나 개념을 기록해 보세요!
            </div>
          ) : (
            visibleNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        {note.subject}
                      </span>
                      <span className="text-[11px] text-stone-400">{note.date}</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-stone-900">{note.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleBookmark(note.id)}
                      className={`text-base leading-none ${
                        note.bookmarked ? "text-amber-500" : "text-stone-300 hover:text-amber-400"
                      }`}
                      aria-label="중요 표시"
                    >
                      {note.bookmarked ? "★" : "☆"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNote(note.id)}
                      className="text-xs text-stone-400 hover:text-rose-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {note.content && (
                  <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line break-words bg-stone-50 p-3 rounded-xl border border-stone-100">
                    {note.content}
                  </p>
                )}
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

