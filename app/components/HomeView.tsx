"use client";

import React, { useState } from "react";
import { Place, SavedTrip } from "../types";
import RouteResult from "./RouteResult";

interface HomeViewProps {
  tripTitle: string;
  startDate: string;
  endDate: string;
  transport?: string;
  setStartDate: (d: string) => void;
  setEndDate: (d: string) => void;
  setTransport?: (t: string) => void;
  places: Place[];
  generatedRoute: string | null;
  isLoading?: boolean;
  savedTrips: SavedTrip[];
  onGoStorage: () => void;
  onGenerateRoute: () => void;
  onSaveTrip: (customTitle: string) => void;
  onDeleteSavedTrip: (id: number) => void;
}

export default function HomeView({
  startDate,
  endDate,
  transport = "🚗 자차",
  setStartDate,
  setEndDate,
  setTransport,
  places,
  isLoading = false,
  savedTrips,
  onGoStorage,
  onGenerateRoute,
  onDeleteSavedTrip,
}: HomeViewProps) {
  // 저장된 계획 중 현재 펼쳐져 있는 항목의 ID를 기억하는 상태
  const [expandedTripId, setExpandedTripId] = useState<number | null>(null);

  const selectedPlaces = places.filter((p) => p.selected);

  return (
    <div className="space-y-5">
      {/* 1. 여행 조건 & 이동수단 설정 카드 */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-800">🗓️ 여행 일정 · 이동수단</h2>
          <button
            type="button"
            onClick={onGoStorage}
            className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition"
          >
            📍 보관 장소 ({places.length}) →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">출발일 (선택)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2 bg-stone-50"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">도착일 (선택)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2 bg-stone-50"
            />
          </div>
        </div>

        {setTransport && (
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">주 이동수단</label>
            <div className="grid grid-cols-3 gap-2">
              {["🚗 자차", "🚆 기차/대중교통", "🚶 도보"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTransport(item)}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    transport === item
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 선택된 장소 미리보기 요약 */}
        <div className="bg-stone-50 border border-stone-200/70 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-stone-600">
              선택된 장소 ({selectedPlaces.length}곳)
            </span>
            <button
              type="button"
              onClick={onGoStorage}
              className="text-[11px] text-stone-500 underline"
            >
              장소 추가/변경
            </button>
          </div>
          {selectedPlaces.length === 0 ? (
            <p className="text-xs text-stone-400">보관 장소에서 루트에 넣을 장소를 선택해주세요.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedPlaces.map((p) => (
                <span
                  key={p.id}
                  className="text-[11px] font-medium bg-white border border-stone-200 text-stone-700 px-2.5 py-1 rounded-full"
                >
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onGenerateRoute}
          disabled={isLoading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          {isLoading ? "✨ AI가 최적 동선 · 주차장 · 혼잡도를 분석 중입니다..." : "🚀 최적 동선 · 주차 · 혼잡도 계획 세우기"}
        </button>
      </div>

      {/* 2. 저장된 계획 목록 (클릭 시 접었다 펼쳤다 전환 + 카드 칸 그대로 표시) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-stone-600 px-1">
          📂 저장된 여행 계획 ({savedTrips.length})
        </h3>

        {savedTrips.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-5 text-center text-xs text-stone-400">
            아직 저장된 여행 계획이 없습니다. 위에서 계획을 세운 뒤 저장해보세요!
          </div>
        ) : (
          savedTrips.map((trip) => {
            const isExpanded = expandedTripId === trip.id;

            let parsedPlan = null;
            try {
              const obj = JSON.parse(trip.routeText);
              if (obj && obj.steps) parsedPlan = obj;
            } catch {
              parsedPlan = null;
            }

            return (
              <div
                key={trip.id}
                className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3"
              >
                {/* 제목 바: 누르면 접기 / 펼치기 */}
                <div
                  onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{trip.title}</h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {trip.startDate && trip.endDate
                        ? `${trip.startDate} ~ ${trip.endDate} · `
                        : ""}
                      {trip.createdAt}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg transition">
                      {isExpanded ? "▲ 접기" : "▼ 펼치기"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`'${trip.title}' 계획을 삭제할까요?`)) {
                          onDeleteSavedTrip(trip.id);
                        }
                      }}
                      className="px-2 py-1 text-xs text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {/* 펼쳐졌을 때만 여행계획 세우기에서 나왔던 카드 칸들이 그대로 표시됨 */}
                {isExpanded && (
                  <div className="pt-2 border-t border-stone-100">
                    {parsedPlan ? (
                      <RouteResult plan={parsedPlan} />
                    ) : (
                      <p className="text-xs text-stone-600 whitespace-pre-wrap leading-relaxed">
                        {trip.routeText}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}