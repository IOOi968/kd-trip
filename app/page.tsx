"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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
];

export default function MainDashboard() {
  const [cards, setCards] = useState<CategoryCard[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kwan_dashboard_cards");
      if (saved) setCards(JSON.parse(saved));
    } catch {
      // 저장 데이터 파싱 실패 시 무시
    }
  }, []);

  const saveCards = (next: CategoryCard[]) => {
    setCards(next);
    localStorage.setItem("kwan_dashboard_cards", JSON.stringify(next));
  };

  const handleAddCategory = (item: Omit<CategoryCard, "id">) => {
    if (cards.length >= 6) return;
    const next = [...cards, { ...item, id: String(Date.now()) }];
    saveCards(next);
    setIsAdding(false);
  };

  const handleDeleteCard = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("이 카테고리 칸을 삭제할까요?")) {
      saveCards(cards.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* 상단 헤더 */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900">나의 라이프 보드</h1>
            <p className="text-xs text-stone-500 mt-1">
              카테고리를 선택해 나만의 홈을 구성하세요 ({cards.length}/6)
            </p>
          </div>
          <span className="text-[11px] font-bold bg-stone-900 text-white px-2.5 py-1 rounded-full">
            MY HOME
          </span>
        </header>

        {/* 3x2 동적 그리드 보드 */}
        <section className="grid grid-cols-3 gap-3">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className={`relative aspect-square rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 shadow-sm hover:scale-[1.02] transition ${card.color}`}
            >
              <button
                type="button"
                onClick={(e) => handleDeleteCard(e, card.id)}
                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/80 text-[10px] text-stone-400 hover:text-rose-600 flex items-center justify-center"
                aria-label="삭제"
              >
                ✕
              </button>
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

        {/* + 버튼 클릭 시 열리는 카테고리 선택 창 */}
        {isAdding && (
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-800">카테고리 선택</h2>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-stone-400"
              >
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
                    className="py-3 px-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-40 text-xs font-bold flex flex-col items-center gap-1.5 transition"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}