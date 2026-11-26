"use client";

import React, { useState, useEffect, useRef } from "react";
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
  { name: "공부", icon: "📚", href: "/study", color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
];

type DeployStatus = "synced" | "building" | "ready";

export default function MainDashboard() {
  const [cards, setCards] = useState<CategoryCard[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const [deployStatus, setDeployStatus] = useState<DeployStatus>("synced");
  const loadedShaRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kwan_dashboard_cards");
      if (saved) setCards(JSON.parse(saved));
    } catch {
      // 저장 데이터 파싱 실패 시 무시
    }
  }, []);

  // 창을 나갔다 들어오거나 새로고침해도 마지막 커밋 시각을 기준으로 반영중/최신 정확 판별
  useEffect(() => {
    const checkDeployStatus = async () => {
      try {
        const res = await fetch(
          "https://api.github.com/repos/IOOi968/kd-trip/commits/main",
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        const latestSha: string = data.sha;
        const commitDateStr: string | undefined =
          data.commit?.committer?.date || data.commit?.author?.date;

        const commitTime = commitDateStr ? new Date(commitDateStr).getTime() : 0;
        const elapsedMs = Date.now() - commitTime;
        const BUILD_DURATION_MS = 75000; // Vercel 평균 빌드 소요 시간(약 75초)

        if (!loadedShaRef.current) {
          loadedShaRef.current = latestSha;
        }

        // 보고 있는 도중 새 커밋이 올라온 경우
        if (latestSha !== loadedShaRef.current) {
          if (elapsedMs < BUILD_DURATION_MS) {
            setDeployStatus("building");
          } else {
            setDeployStatus("ready");
          }
          return;
        }

        // 새로고침/재접속 시에도 최근 75초 이내 커밋이면 반영중으로 표시
        if (commitTime && elapsedMs < BUILD_DURATION_MS) {
          setDeployStatus("building");
        } else {
          setDeployStatus("synced");
        }
      } catch {
        // 네트워크 일시 오류 무시
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
        <header className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900">나의 라이프 보드</h1>
            <p className="text-xs text-stone-500 mt-1">
              카테고리를 선택해 나만의 홈을 구성하세요 ({cards.length}/6)
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {deployStatus === "synced" && (
              <span
                title="GitHub 최신 코드가 반영된 상태입니다"
                className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                최신
              </span>
            )}

            {deployStatus === "building" && (
              <span
                title="GitHub 수정 감지! Vercel에서 반영 중입니다..."
                className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full animate-pulse"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                반영중
              </span>
            )}

            {deployStatus === "ready" && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1 text-[10px] font-bold bg-sky-600 text-white px-2 py-1 rounded-full shadow-xs hover:bg-sky-700 transition"
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
