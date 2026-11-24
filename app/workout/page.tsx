"use client";

import React, { useState } from "react";
import Link from "next/link";
import RoutineTab from "./components/RoutineTab";
import CalendarTab from "./components/CalendarTab";
import DietTab from "./components/DietTab";
import InbodyTab from "./components/InbodyTab";

export default function WorkoutPage() {
  const [tab, setTab] = useState<"routine" | "calendar" | "diet" | "inbody">("routine");

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3.5">
        <div className="max-w-md mx-auto space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg transition"
              >
                ← 홈
              </Link>
              <h1 className="text-base font-extrabold text-stone-900">나의 운동 관리 💪</h1>
            </div>
            <span className="text-[11px] font-bold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full">
              WORKOUT
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTab("routine")}
              className={`py-2 text-[11px] font-bold rounded-lg transition ${
                tab === "routine" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
              }`}
            >
              🏋️ 루틴
            </button>
            <button
              type="button"
              onClick={() => setTab("calendar")}
              className={`py-2 text-[11px] font-bold rounded-lg transition ${
                tab === "calendar" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
              }`}
            >
              📅 운동기록
            </button>
            <button
              type="button"
              onClick={() => setTab("diet")}
              className={`py-2 text-[11px] font-bold rounded-lg transition ${
                tab === "diet" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
              }`}
            >
              🥗 식단
            </button>
            <button
              type="button"
              onClick={() => setTab("inbody")}
              className={`py-2 text-[11px] font-bold rounded-lg transition ${
                tab === "inbody" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
              }`}
            >
              📊 인바디
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5">
        {tab === "routine" && <RoutineTab />}
        {tab === "calendar" && <CalendarTab />}
        {tab === "diet" && <DietTab />}
        {tab === "inbody" && <InbodyTab />}
      </main>
    </div>
  );
}