"use client";

import React from "react";

interface RouteStep {
  order: number;
  name: string;
  category: string;
  address?: string;
  moveFromPrev: string;
  bestTime: string;
  hoursAndBreak: string;
  parkingName?: string;
  parkingFee?: string;
}

interface RoutePlan {
  summary: string;
  steps: RouteStep[];
}

export default function RouteResult({ plan }: { plan: RoutePlan | null }) {
  if (!plan || !plan.steps) return null;

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded-full">
            최적 동선 정렬 완료
          </span>
          <span className="text-xs font-bold text-emerald-900">꼬임 없는 최단 이동 루트</span>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">{plan.summary}</p>
      </div>

      <div className="space-y-3">
        {plan.steps.map((step, idx) => {
          const naverSearchUrl = `https://map.naver.com/p/search/${encodeURIComponent(step.name)}`;
          const hasParking = Boolean(step.parkingName && step.parkingName.trim());
          const naverParkingUrl = hasParking
            ? `https://map.naver.com/p/search/${encodeURIComponent(step.parkingName!)}`
            : "";

          return (
            <div key={idx} className="space-y-3">
              {idx > 0 && (
                <div className="flex items-center justify-center">
                  <div className="bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                    <span>⬇️</span>
                    <span>{step.moveFromPrev}</span>
                  </div>
                </div>
              )}

              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                      {step.order}
                    </span>
                    <div>
                      <span className="text-[11px] text-stone-400 font-medium block">{step.category}</span>
                      <h3 className="text-sm font-bold text-stone-900">{step.name}</h3>
                    </div>
                  </div>
                  <a
                    href={naverSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-[#03C75A] hover:bg-[#02b351] text-white text-[11px] font-bold rounded-lg transition"
                  >
                    N 네이버지도
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-sky-800 mb-1">👥 한산한 추천 시간대</div>
                    <p className="text-xs text-stone-700 leading-snug">{step.bestTime}</p>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-amber-800 mb-1">🕒 운영시간 · 브레이크타임</div>
                    <p className="text-xs text-stone-700 leading-snug">{step.hoursAndBreak}</p>
                  </div>

                  {hasParking && (
                    <>
                      <div className="bg-violet-50/70 border border-violet-100 rounded-xl p-3 flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-violet-800 mb-1">🅿️ 추천 주차장 (저렴·여유)</div>
                          <p className="text-xs font-semibold text-stone-800 leading-snug">{step.parkingName}</p>
                        </div>
                        <a
                          href={naverParkingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-violet-700 underline mt-1.5 inline-block"
                        >
                          주차장 위치 바로보기 →
                        </a>
                      </div>

                      <div className="bg-stone-50 border border-stone-200/70 rounded-xl p-3">
                        <div className="text-[11px] font-bold text-stone-700 mb-1">💳 주차 요금 · 무료 팁</div>
                        <p className="text-xs text-stone-700 leading-snug">{step.parkingFee}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}