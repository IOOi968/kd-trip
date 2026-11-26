"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const GOAL_KEY = "kwan_study_goal_minutes_v1";

export default function StudySettingsPage() {
  const [hours, setHours] = useState("4");
  const [minutes, setMinutes] = useState("0");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GOAL_KEY);
      if (saved) {
        const total = Number(saved);
        setHours(String(Math.floor(total / 60)));
        setMinutes(String(total % 60));
      }
    } catch {
      // 무시
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Math.max(10, (Number(hours) || 0) * 60 + (Number(minutes) || 0));
    localStorage.setItem(GOAL_KEY, String(total));
    alert(`하루 목표 공부 시간이 ${Math.floor(total / 60)}시간 ${total % 60}분으로 저장되었습니다!`);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/study" className="text-xs font-bold bg-stone-100 text-stone-700 px-2.5 py-1.5 rounded-lg">
              ← 공부
            </Link>
            <h1 className="text-base font-extrabold text-stone-900">설정 ⚙️</h1>
          </div>
          <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
            STUDY
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5">
        <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-extrabold text-stone-900">⏱️ 하루 목표 공부량 설정</h2>
            <p className="text-xs text-stone-500 mt-1">
              설정한 목표 시간만큼 달력 아래 네모 칸이 등분되어 공부 시간에 따라 차오릅니다.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[2, 4, 6, 8].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setHours(String(h));
                  setMinutes("0");
                }}
                className={`py-2 text-xs font-bold rounded-xl border ${
                  Number(hours) === h && Number(minutes) === 0
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-stone-50 text-stone-700 border-stone-200"
                }`}
              >
                {h}시간
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
              <label className="block text-[11px] font-bold text-stone-500 mb-1">시간</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-extrabold text-center"
                />
                <span className="text-xs font-bold">시간</span>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
              <label className="block text-[11px] font-bold text-stone-500 mb-1">분</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={10}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-extrabold text-center"
                />
                <span className="text-xs font-bold">분</span>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-emerald-600 text-white text-xs font-extrabold rounded-xl">
            목표 공부량 저장하기
          </button>
        </form>
      </main>
    </div>
  );
}
