"use client";

import React, { useState, useRef, useEffect } from "react";
// @ts-ignore
import southKoreaMap from "@svg-maps/south-korea";

export interface MapPlace {
  id: number;
  author: "관우" | "다영";
  region: string;
  category: string;
  name: string;
  location: string;
  features: string;
  cautions: string;
  lat?: number | null;
  lng?: number | null;
  pin_color?: string;
  visited?: boolean;
  review?: string;
}

interface KoreaIllustMapProps {
  places: MapPlace[];
  onSelectRegionToAdd: (regionName: string) => void;
  onUpdatePlaceReviewAndPin: (
    id: number,
    updates: { pin_color: string; visited: boolean; review: string }
  ) => void;
}

export const PIN_COLORS = [
  { name: "코랄 로즈", value: "#F43F5E" },
  { name: "오션 블루", value: "#0EA5E9" },
  { name: "세이지 민트", value: "#10B981" },
  { name: "앰버 골드", value: "#F59E0B" },
  { name: "바이올렛", value: "#8B5CF6" },
  { name: "차콜 블랙", value: "#27272A" },
];

// 2가지 인포그래픽 감성 컬러 테마
const THEMES = {
  mint: {
    name: "민트 & 브라운",
    fills: {
      seoul: "#9E7B73",
      incheon: "#84B1B0",
      gyeonggi: "#92BCBB",
      gangwon: "url(#mint-hatch)",
      "north-chungcheong": "#A5C79B",
      "south-chungcheong": "#84B1B0",
      sejong: "#9E7B73",
      daejeon: "#B29189",
      "north-gyeongsang": "#92BCBB",
      daegu: "#9E7B73",
      ulsan: "#A5C79B",
      "south-gyeongsang": "url(#brown-hatch)",
      busan: "#9E7B73",
      "north-jeolla": "#A5C79B",
      gwangju: "#9E7B73",
      "south-jeolla": "#84B1B0",
      jeju: "url(#mint-hatch)",
    } as Record<string, string>,
  },
  yellow: {
    name: "옐로우 & 올리브",
    fills: {
      seoul: "#E87A3E",
      incheon: "#F4CE46",
      gyeonggi: "#F7D75C",
      gangwon: "url(#yellow-dots)",
      "north-chungcheong": "#F4CE46",
      "south-chungcheong": "#F7D75C",
      sejong: "#E87A3E",
      daejeon: "#899E72",
      "north-gyeongsang": "#F4CE46",
      daegu: "#E87A3E",
      ulsan: "#899E72",
      "south-gyeongsang": "#899E72",
      busan: "#E87A3E",
      "north-jeolla": "url(#yellow-dots)",
      gwangju: "#E87A3E",
      "south-jeolla": "#F4CE46",
      jeju: "url(#yellow-dots)",
    } as Record<string, string>,
  },
};

// 17개 광역 시·도 이름 & 정중앙 미세 보정
const REGION_LABELS: Record<string, { name: string; dx?: number; dy?: number }> = {
  seoul: { name: "서울" },
  incheon: { name: "인천", dx: -10, dy: 2 },
  gyeonggi: { name: "경기", dy: 14 },
  gangwon: { name: "강원" },
  "north-chungcheong": { name: "충북", dx: -4 },
  "south-chungcheong": { name: "충남", dx: -6 },
  sejong: { name: "세종", dy: -3 },
  daejeon: { name: "대전", dy: 3 },
  "north-gyeongsang": { name: "경북", dx: -6, dy: -6 },
  daegu: { name: "대구" },
  ulsan: { name: "울산", dx: 4 },
  "south-gyeongsang": { name: "경남", dx: -4 },
  busan: { name: "부산", dx: 4, dy: 4 },
  "north-jeolla": { name: "전북" },
  gwangju: { name: "광주" },
  "south-jeolla": { name: "전남", dy: 2 },
  jeju: { name: "제주" },
};

// 대표 관광 도시 (각 시·도 실제 중심점 기준 정확한 위치 배치 - 경주·포항·강릉·여수 등)
const TOURIST_CITIES: { name: string; parentId: string; dx: number; dy: number }[] = [
  { name: "가평", parentId: "gyeonggi", dx: 22, dy: -18 },
  { name: "춘천", parentId: "gangwon", dx: -30, dy: -8 },
  { name: "속초", parentId: "gangwon", dx: 22, dy: -34 },
  { name: "강릉", parentId: "gangwon", dx: 38, dy: 4 },
  { name: "단양", parentId: "north-chungcheong", dx: 28, dy: -30 },
  { name: "태안", parentId: "south-chungcheong", dx: -34, dy: -12 },
  { name: "안동", parentId: "north-gyeongsang", dx: 2, dy: -28 },
  { name: "포항", parentId: "north-gyeongsang", dx: 44, dy: 16 },
  { name: "경주", parentId: "north-gyeongsang", dx: 38, dy: 38 },
  { name: "통영", parentId: "south-gyeongsang", dx: 10, dy: 32 },
  { name: "거제", parentId: "south-gyeongsang", dx: 26, dy: 26 },
  { name: "남해", parentId: "south-gyeongsang", dx: -20, dy: 32 },
  { name: "전주", parentId: "north-jeolla", dx: 2, dy: -14 },
  { name: "여수", parentId: "south-jeolla", dx: 40, dy: 16 },
  { name: "순천", parentId: "south-jeolla", dx: 28, dy: -4 },
  { name: "서귀포", parentId: "jeju", dx: 0, dy: 12 },
];

export default function KoreaIllustMap({
  places,
  onSelectRegionToAdd,
  onUpdatePlaceReviewAndPin,
}: KoreaIllustMapProps) {
  const [themeKey, setThemeKey] = useState<"mint" | "yellow">("mint");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const [regionCenters, setRegionCenters] = useState<Record<string, { x: number; y: number }>>({});

  const dragStartRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  const [selectedPin, setSelectedPin] = useState<MapPlace | null>(null);
  const [editColor, setEditColor] = useState("#F43F5E");
  const [editVisited, setEditVisited] = useState(false);
  const [editReview, setEditReview] = useState("");

  // 1. 휠 확대/축소 시 홈페이지 스크롤 완벽 차단
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setScale((prev) => Math.min(4.0, Math.max(0.9, Number((prev + delta).toFixed(2)))));
    };

    el.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleNativeWheel);
  }, []);

  const rawViewBox = (southKoreaMap?.viewBox || "0 0 509 716").split(" ").map(Number);
  const vb = {
    minX: rawViewBox[0] || 0,
    minY: rawViewBox[1] || 0,
    width: rawViewBox[2] || 509,
    height: rawViewBox[3] || 716,
  };

  const fullViewBox = `${vb.minX - 24} ${vb.minY - 20} ${vb.width + 48} ${vb.height + 40}`;
  const locations: Array<{ id: string; name: string; path: string }> =
    southKoreaMap?.locations || [];

  // 2. 실제 한반도 시·도 폴리곤의 정중앙 좌표(getBBox) 자동 계산
  useEffect(() => {
    const centers: Record<string, { x: number; y: number }> = {};
    Object.entries(pathRefs.current).forEach(([id, el]) => {
      if (el) {
        const bbox = el.getBBox();
        const labelInfo = REGION_LABELS[id.toLowerCase()];
        centers[id.toLowerCase()] = {
          x: bbox.x + bbox.width / 2 + (labelInfo?.dx || 0),
          y: bbox.y + bbox.height / 2 + (labelInfo?.dy || 0),
        };
      }
    });
    setRegionCenters(centers);
  }, []);

  // 3. 저장된 장소의 지역/도시명을 기준으로 정확한 핀 좌표 반환 (어긋남 제로)
  const getAccuratePinPosition = (place: MapPlace, index: number) => {
    const text = `${place.region} ${place.location} ${place.name}`;

    // 대표 도시(경주·포항·강릉·여수 등) 매칭
    const matchedCity = TOURIST_CITIES.find((c) => text.includes(c.name));
    if (matchedCity && regionCenters[matchedCity.parentId]) {
      const parent = regionCenters[matchedCity.parentId];
      const angle = (index * 137.5 * Math.PI) / 180;
      const r = index === 0 ? 0 : 8;
      return {
        x: parent.x + matchedCity.dx + Math.cos(angle) * r,
        y: parent.y + matchedCity.dy + Math.sin(angle) * r,
      };
    }

    // 17개 시·도 매칭
    const matchedSidoEntry = Object.entries(REGION_LABELS).find(([, info]) =>
      text.includes(info.name)
    );
    if (matchedSidoEntry && regionCenters[matchedSidoEntry[0]]) {
      const center = regionCenters[matchedSidoEntry[0]];
      const angle = (index * 137.5 * Math.PI) / 180;
      const r = index === 0 ? 0 : 10;
      return {
        x: center.x + Math.cos(angle) * r,
        y: center.y + Math.sin(angle) * r,
      };
    }

    return regionCenters["seoul"] || { x: vb.width / 2, y: vb.height / 2 };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    movedRef.current = false;
    dragStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    movedRef.current = true;
    setOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const openPinModal = (place: MapPlace) => {
    setSelectedPin(place);
    setEditColor(place.pin_color || "#F43F5E");
    setEditVisited(Boolean(place.visited));
    setEditReview(place.review || "");
  };

  const handleSavePinEdit = () => {
    if (!selectedPin) return;
    onUpdatePlaceReviewAndPin(selectedPin.id, {
      pin_color: editColor,
      visited: editVisited,
      review: editReview,
    });
    setSelectedPin(null);
  };

  const currentTheme = THEMES[themeKey];

  return (
    <section className="rounded-3xl border border-stone-200 overflow-hidden shadow-sm bg-[#ECEEED]">
      {/* 상단 인포그래픽 헤더 */}
      <div className="px-5 pt-4 pb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-[3.5px] border-[#E87A3E] inline-block" />
          <div>
            <h2 className="text-sm font-black text-[#E87A3E] tracking-tight">
              대한민국 여행 인포그래픽
            </h2>
            <p className="text-[11px] text-stone-600">
              {hoveredRegion
                ? `📍 [${hoveredRegion}] 클릭해서 장소 저장`
                : "지역이나 대표 도시(경주·강릉·여수 등)를 클릭하세요"}
            </p>
          </div>
        </div>

        {/* 테마 & 줌 컨트롤 */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setThemeKey(themeKey === "mint" ? "yellow" : "mint")}
            className="px-2.5 h-7 bg-white/90 hover:bg-white border border-stone-300/80 rounded-lg text-[10px] font-bold text-stone-700 transition"
          >
            {themeKey === "mint" ? "☀️ 옐로우" : "🌿 민트"}
          </button>
          <div className="flex items-center gap-0.5 bg-white/90 border border-stone-300/80 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(4.0, Number((s + 0.35).toFixed(2))))}
              className="w-6 h-6 rounded text-xs font-bold text-stone-700 hover:bg-stone-100"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.9, Number((s - 0.35).toFixed(2))))}
              className="w-6 h-6 rounded text-xs font-bold text-stone-700 hover:bg-stone-100"
            >
              −
            </button>
            <button
              type="button"
              onClick={resetView}
              className="px-1.5 h-6 rounded text-[10px] font-bold text-stone-500 hover:bg-stone-100"
            >
              리셋
            </button>
          </div>
        </div>
      </div>

      {/* 실제 한반도 해안선 인포그래픽 SVG 캔버스 */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full h-[460px] bg-[#ECEEED] overflow-hidden cursor-grab active:cursor-grabbing select-none overscroll-contain"
      >
        <svg
          viewBox={fullViewBox}
          className="w-full h-full transition-transform duration-75"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* 빗금 & 도트 인포그래픽 패턴 */}
          <defs>
            <pattern
              id="mint-hatch"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <rect width="8" height="8" fill="#A5C79B" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="#CFE3C8" strokeWidth="3.2" />
            </pattern>
            <pattern
              id="brown-hatch"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <rect width="8" height="8" fill="#9E7B73" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="#C5ABA4" strokeWidth="3.2" />
            </pattern>
            <pattern id="yellow-dots" width="9" height="9" patternUnits="userSpaceOnUse">
              <rect width="9" height="9" fill="#F4CE46" />
              <circle cx="4.5" cy="4.5" r="1.8" fill="#FFF8D6" />
            </pattern>
          </defs>

          {/* 1. 실제 대한민국 17개 시·도 외곽선 폴리곤 */}
          {locations.map((loc) => {
            const key = loc.id.toLowerCase();
            const labelInfo = REGION_LABELS[key] || { name: loc.name };
            const fill = currentTheme.fills[key] || "#92BCBB";

            return (
              <path
                key={loc.id}
                ref={(el) => {
                  pathRefs.current[key] = el;
                }}
                d={loc.path}
                fill={fill}
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinejoin="round"
                onMouseEnter={() => setHoveredRegion(labelInfo.name)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => {
                  if (!movedRef.current) onSelectRegionToAdd(labelInfo.name);
                }}
                className="cursor-pointer transition-opacity duration-150 hover:opacity-80"
              />
            );
          })}

          {/* 2. 구역 정중앙에 깔끔하게 인쇄된 17개 시·도 지명 */}
          {Object.entries(regionCenters).map(([key, pos]) => {
            const info = REGION_LABELS[key];
            if (!info) return null;
            const invScale = Math.max(0.55, 1 / Math.pow(scale, 0.55));

            return (
              <text
                key={`sido-${key}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12 * invScale}
                fontWeight="900"
                fill="#1F2937"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth={2.5 * invScale}
                paintOrder="stroke"
                className="pointer-events-none select-none"
              >
                {info.name}
              </text>
            );
          })}

          {/* 3. 대표 관광 도시 (각 도의 중심 기준 정확한 오프셋 위치 - 경주·포항·강릉·여수 등) */}
          {TOURIST_CITIES.map((city) => {
            const parentPos = regionCenters[city.parentId];
            if (!parentPos) return null;
            const cx = parentPos.x + city.dx;
            const cy = parentPos.y + city.dy;
            const invScale = Math.max(0.5, 1 / Math.pow(scale, 0.55));

            return (
              <g
                key={city.name}
                transform={`translate(${cx}, ${cy})`}
                onMouseEnter={() => setHoveredRegion(city.name)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!movedRef.current) onSelectRegionToAdd(city.name);
                }}
                className="cursor-pointer"
              >
                <circle cx="0" cy={-6 * invScale} r={2 * invScale} fill="#374151" />
                <text
                  x="0"
                  y={4 * invScale}
                  textAnchor="middle"
                  fontSize={9 * invScale}
                  fontWeight="800"
                  fill="#374151"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth={2 * invScale}
                  paintOrder="stroke"
                >
                  {city.name}
                </text>
              </g>
            );
          })}

          {/* 4. 저장된 장소 물방울 번호 핀 마커 */}
          {Object.keys(regionCenters).length > 0 &&
            places.map((place, idx) => {
              const { x, y } = getAccuratePinPosition(place, idx);
              const invScale = Math.max(0.55, 1 / Math.pow(scale, 0.55));
              const pinColor = place.pin_color || "#F43F5E";
              const numLabel = String(idx + 1).padStart(2, "0");

              return (
                <g
                  key={place.id}
                  transform={`translate(${x}, ${y}) scale(${invScale})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!movedRef.current) openPinModal(place);
                  }}
                  className="cursor-pointer"
                >
                  <ellipse cx="0" cy="1" rx="5.5" ry="2.2" fill="rgba(0,0,0,0.22)" />
                  <path
                    d="M 0 0 C -8 -11 -12 -18 -12 -24 A 12 12 0 1 1 12 -24 C 12 -18 8 -11 0 0 Z"
                    fill={pinColor}
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                  />
                  <text
                    x="0"
                    y="-21"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="900"
                    fill="#FFFFFF"
                  >
                    {numLabel}
                  </text>
                  {place.visited && (
                    <circle
                      cx="9"
                      cy="-32"
                      r="4.5"
                      fill="#10B981"
                      stroke="#FFFFFF"
                      strokeWidth="1.3"
                    />
                  )}
                </g>
              );
            })}
        </svg>

        <div className="absolute bottom-2.5 left-4 right-4 flex justify-between text-[10px] text-stone-500 pointer-events-none">
          <span>드래그 이동 · 휠 확대/축소</span>
          <span className="font-bold text-stone-700">총 {places.length}곳 기록됨</span>
        </div>
      </div>

      {/* 지도 아래 깔끔한 핀 인덱스 카드 (글자 겹침 없이 한눈에 보기) */}
      {places.length > 0 && (
        <div className="px-4 py-3 bg-white border-t border-stone-200/80">
          <div className="grid grid-cols-2 gap-2">
            {places.slice(0, 6).map((place, idx) => (
              <button
                key={`card-${place.id}`}
                type="button"
                onClick={() => openPinModal(place)}
                className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-200/80 px-2.5 py-1.5 rounded-xl text-left transition"
              >
                <span
                  className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0"
                  style={{ backgroundColor: place.pin_color || "#F43F5E" }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-stone-800 truncate">{place.name}</p>
                  <p className="text-[9px] text-stone-400 truncate">
                    {place.region} {place.visited ? "· ✅방문완료" : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 핀 클릭 시 열리는 '후기 & 핀 컬러 설정' 모달 */}
      {selectedPin && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-stone-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full">
                  {selectedPin.region} · {selectedPin.category}
                </span>
                <h3 className="text-base font-black text-stone-900 mt-1.5">{selectedPin.name}</h3>
                {selectedPin.location && (
                  <p className="text-xs text-stone-500 mt-0.5">📍 {selectedPin.location}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPin(null)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-2">
                🎨 핀 색깔 선택
              </label>
              <div className="flex flex-wrap gap-2.5">
                {PIN_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setEditColor(c.value)}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      editColor === c.value ? "scale-115 border-stone-900" : "border-white shadow"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
              <input
                type="checkbox"
                checked={editVisited}
                onChange={(e) => setEditVisited(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
              <span>✅ 다녀온 장소로 표시하기</span>
            </label>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                ✍️ 다녀간 후기
              </label>
              <textarea
                rows={3}
                value={editReview}
                onChange={(e) => setEditReview(e.target.value)}
                placeholder="다녀온 소감이나 추천 포인트를 자유롭게 적어주세요!"
                className="w-full p-3 text-xs border border-stone-200 rounded-2xl focus:outline-none focus:border-stone-800"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedPin(null)}
                className="flex-1 py-2.5 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleSavePinEdit}
                className="flex-1 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}