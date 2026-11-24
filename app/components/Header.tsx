"use client";

import React from "react";

interface HeaderProps {
  tripTitle: string;
  setTripTitle: (title: string) => void;
  lastModified: string;
  onRefresh: () => void;
}

export default function Header({
  tripTitle,
  setTripTitle,
  lastModified,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            value={tripTitle}
            onChange={(e) => setTripTitle(e.target.value)}
            className="text-xl font-bold bg-transparent focus:outline-none w-full"
          />
          <span className="text-xs font-medium bg-rose-100 text-rose-600 px-2.5 py-1 rounded-full shrink-0">
            여행 계획
          </span>
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[11px] text-stone-400">
          <span>최근 변경: {lastModified || "불러오는 중..."}</span>
          <button
            type="button"
            onClick={onRefresh}
            className="text-stone-600 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md"
          >
            🔄 새로고침
          </button>
        </div>
      </div>
    </header>
  );
}