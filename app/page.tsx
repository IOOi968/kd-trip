"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PomodoroBox from "./components/PomodoroBox";

interface CategoryCard {
  id: string;
  name: string;
  icon: string;
  href: string;
  color: string;
}

const AVAILABLE_CATEGORIES: Omit<CategoryCard, "id">[] = [
  { name: "여행", icon: "✈️", href: "/trip", color: "bg-rose-50 border-rose-200 text-rose-900" },
  { name: "운동", icon: "💪", href: "/workout", color: "bg-sky-50 border-sky-200 text-sky-900" },
  { name: "해야 할 일", icon: "✅", href: "/todo", color: "bg-amber-50 border-amber-200 text-amber-900" },
  { name: "공부", icon: "📚", href: "/study", color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
];

type DeployStatus = "synced" | "building" | "ready";

export default function MainDashboard() {
  const [cards, setCards] = useState<CategoryCard[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingCards, setIsEditingCards] = useState(false);
  const [deployStatus, setDeployStatus] = useState<DeployStatus>("synced");
  const loadedShaRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kwan_dashboard_cards");
      if (saved) setCards(JSON.parse(saved));
    } catch {
      // 무시
    }
  }, []);

  useEffect(() => {
    const checkDeployStatus = async () => {
      try {
        const res = await fetch("https://api.github.com/repos/IOOi968/kd-trip/commits/main", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const latestSha: string = data.sha;
        const commitDateStr: string | undefined =
          data.commit?.committer?.date || data.commit?.author?.date;

        const commitTime = commitDateStr ? new Date(commitDateStr).getTime() : 0;
        const elapsedMs = Date.now() - commitTime;
        const BUILD_MS = 75000;

        if (!loadedShaRef.current) loadedShaRef.current = latestSha;

        if (latestSha !== loadedShaRef.current) {
          setDeployStatus(elapsedMs < BUILD_MS ? "building" : "ready");
          return;
        }
        setDeployStatus(commitTime && elapsedMs < BUILD_MS ? "building" : "synced");
      } catch {
        // 무시
      }
    };

    checkDeployStatus();
    const timer = setInterval(checkDeployStatus, 8000);
    return () => clearInterval(timer);
  }, []);

  const saveCards = (next: CategoryCard[]) => {
    setCards(next);
    localStorage.setItem("kwan_dashboard_cards", JSON.stringify(next));
  };

  const handleAddCategory = (item: Omit<CategoryCard, "id">) => {
    if (cards.length >= 6) return;
    saveCards([...cards, { ...item, id: String(Date.now()) }]);
    setIsAdding(false);
  };

  const handleDeleteCard = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("이 카테고리 칸을 삭제할까요?")) {
      const next = cards.filter((c) => c.id !== id);
      saveCards(next);
      if (next.length === 0) setIsEditingCards(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <header className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900">나의 라이프 보드</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-stone-500">나만의 홈을 구성하세요 ({cards.length}/6)</p>
              {cards.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsEditingCards(!isEditingCards)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border transition ${
                    isEditingCards
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-500 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {isEditingCards ? "완료" : "수정"}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-1">
            {deployStatus === "synced" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                최신
              </span>
            )}
            {deployStatus === "building" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                반영중
              </span>
            )}
            {deployStatus === "ready" && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1 text-[10px] font-bold bg-sky-600 text-white px-2 py-1 rounded-full shadow-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                적용됨 ↻
              </button>
            )}
            <span className="text-[11px] font-bold bg-stone-900 text-white px-2.5 py-1 rounded-full">
              MY HOME
            </span>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-3">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className={`relative aspect-square rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 shadow-sm hover:scale-[1.02] transition ${card.color}`}
            >
              {isEditingCards && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteCard(e, card.id)}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/90 text-[10px] text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              )}
              <span className="text-3xl">{card.icon}</span>
              <span className="text-xs font-bold text-center break-keep">{card.name}</span>
            </Link>
          ))}

          {cards.length < 6 && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="aspect-square rounded-2xl border-2 border-dashed border-stone-300 bg-white hover:bg-stone-100 flex flex-col items-center justify-center gap-1 text-stone-400 hover:text-stone-700 transition"
            >
              <span className="text-3xl font-light">+</span>
              <span className="text-[11px] font-semibold">추가</span>
            </button>
          )}
        </section>

        {isAdding && (
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-800">카테고리 선택</h2>
              <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-stone-400">
                닫기 ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_CATEGORIES.map((item) => {
                const alreadyAdded = cards.some((c) => c.name === item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => handleAddCategory(item)}
                    className="py-3 px-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-40 text-xs font-bold flex flex-col items-center gap-1.5"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <PomodoroBox />
      </div>
    </div>
  );
}
