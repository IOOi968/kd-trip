"use client";

import React, { useState, useEffect } from "react";
import { addOneStudySecond } from "../utils/studyTime";

export default function PomodoroBox() {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [secLeft, setSecLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (mode === "focus") addOneStudySecond();
      setSecLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          if (mode === "focus") {
            setMode("break");
            return 5 * 60;
          }
          setMode("focus");
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, mode]);

  const mins = String(Math.floor(secLeft / 60)).padStart(2, "0");
  const secs = String(secLeft % 60).padStart(2, "0");

  return (
    <section
      className={`rounded-2xl border p-4 transition ${
        running
          ? "bg-emerald-950 text-white border-emerald-800 shadow-md"
          : "bg-white text-stone-800 border-stone-200 shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold">🍅 뽀모도로 타이머</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                mode === "focus"
                  ? running
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {mode === "focus" ? "집중 25분 (공부시간 반영)" : "휴식 5분"}
            </span>
          </div>
          <p className="text-3xl font-extrabold tracking-wider mt-1">
            {mins}:{secs}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRunning(!running)}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition ${
              running
                ? "bg-amber-400 text-stone-900"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {running ? "정지" : "시작"}
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setSecLeft(mode === "focus" ? 25 * 60 : 5 * 60);
            }}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition ${
              running
                ? "bg-emerald-900 text-emerald-200"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            리셋
          </button>
        </div>
      </div>
    </section>
  );
}
