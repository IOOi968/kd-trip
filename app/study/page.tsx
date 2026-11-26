"use client";

import React from "react";
import Link from "next/link";

export default function StudyPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 pt-3.5 pb-3">
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

      <main className="max-w-md mx-auto px-4 pt-6">
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-10 text-center space-y-2">
          <span className="text-4xl">📚</span>
          <p className="text-sm font-bold text-stone-800">공부 페이지 준비 완료!</p>
          <p className="text-xs text-stone-400">
            원하시는 기능(과목별 노트, 타이머, 체크리스트 등)을 정하시면 여기에 바로 채워 넣을 수 있어요.
          </p>
        </div>
      </main>
    </div>
  );
}

