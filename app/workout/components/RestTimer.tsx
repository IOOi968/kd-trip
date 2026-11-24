"use client";

import React, { useState, useEffect } from "react";

interface RestTimerProps {
  triggerKey: number;
}

export default function RestTimer({ triggerKey }: RestTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (triggerKey > 0) {
      setSeconds(0);
      setIsRunning(true);
    }
  }, [triggerKey]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div
      className={`rounded-2xl p-4 border flex items-center justify-between transition ${
        isRunning
          ? "bg-sky-900 text-white border-sky-800 shadow-md"
          : "bg-white text-stone-800 border-stone-200 shadow-xs"
      }`}
    >
      <div>
        <p className={`text-xs font-bold ${isRunning ? "text-sky-300" : "text-stone-500"}`}>
          타이머
        </p>
        <p className="text-2xl font-extrabold tracking-wider mt-0.5">{formatted}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          className={`px-4 py-2.5 text-sm font-extrabold rounded-xl transition ${
            isRunning ? "bg-amber-400 text-stone-900" : "bg-sky-600 text-white"
          }`}
        >
          {isRunning ? "정지" : "시작"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRunning(false);
            setSeconds(0);
          }}
          className={`px-4 py-2.5 text-sm font-extrabold rounded-xl transition ${
            isRunning ? "bg-sky-800 text-sky-200" : "bg-stone-100 text-stone-600"
          }`}
        >
          리셋
        </button>
      </div>
    </div>
  );
}