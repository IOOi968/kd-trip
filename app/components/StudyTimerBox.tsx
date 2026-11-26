"use client";

import React, { useState, useEffect } from "react";
import { addOneStudySecond } from "../utils/studyTime";

interface Props {
  onTick?: () => void;
}

export default function StudyTimerBox({ onTick }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
      addOneStudySecond();
      if (onTick) onTick();
    }, 1000);
    return () => clearInterval(timer);
  }, [running, onTick]);

  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-50 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-emerald-600">{isOpen ? "▼" : "▶"}</span>
          <span className="text-xs font-extrabold text-stone-800">⏱️ 공부 타이머</span>
          {running && (
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full animate-pulse">
              측정 중
            </span>
          )}
        </div>
        <span className="text-xs font-extrabold text-stone-600">
          {hrs}:{mins}:{secs}
        </span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-stone-500 font-semibold">
              공부 시간 & 스터디플래너 격자에 자동 반영됩니다
            </p>
            <p className="text-2xl font-extrabold text-stone-900 tracking-wider mt-0.5">
              {hrs}:{mins}:{secs}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRunning(!running)}
              className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition ${
                running ? "bg-amber-400 text-stone-900" : "bg-emerald-600 text-white"
              }`}
            >
              {running ? "정지" : "시작"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                setSeconds(0);
              }}
              className="px-3 py-2 text-xs font-bold bg-stone-200 text-stone-700 rounded-xl"
            >
              리셋
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
