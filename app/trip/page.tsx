"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Place, SavedTrip } from "../types";
import { supabase } from "../utils/supabase";
import Header from "../components/Header";
import HomeView from "../components/HomeView";
import PlaceForm from "../components/PlaceForm";
import PlaceList from "../components/PlaceList";
import RouteResult from "../components/RouteResult";
import KoreaIllustMap, { PIN_COLORS } from "../components/KoreaIllustMap";

export default function CoupleTripPlanner() {
  const [view, setView] = useState<"home" | "storage">("home");
  const [tripTitle, setTripTitle] = useState("관다의 여행 계획 ✈️");
  const [lastModified, setLastModified] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [transport, setTransport] = useState("🚗 자차");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedRoute, setGeneratedRoute] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);

  // 지도 지역 클릭 시 열리는 빠른 장소 저장 모달 상태
  const [mapAddRegion, setMapAddRegion] = useState<string | null>(null);
  const [quickAuthor, setQuickAuthor] = useState<"관우" | "다영">("관우");
  const [quickCategory, setQuickCategory] = useState<"놀거리" | "숙소" | "맛집" | "쇼핑">("맛집");
  const [quickName, setQuickName] = useState("");
  const [quickLocation, setQuickLocation] = useState("");
  const [quickFeatures, setQuickFeatures] = useState("");
  const [quickReview, setQuickReview] = useState("");
  const [quickVisited, setQuickVisited] = useState(false);
  const [quickPinColor, setQuickPinColor] = useState("#EF4444");
  const [isSavingQuick, setIsSavingQuick] = useState(false);

  const fetchAllData = async () => {
    const { data: pData } = await supabase.from("places").select("*").order("id", { ascending: false });
    if (pData) {
      setPlaces(
        pData.map((r) => ({
          id: r.id,
          author: r.author,
          region: r.region,
          category: r.category,
          name: r.name,
          price: r.price,
          duration: r.duration,
          location: r.location,
          features: r.features,
          cautions: r.cautions,
          naverUrl: r.naver_url,
          instaUrl: r.insta_url,
          selected: r.selected,
          lat: r.lat,
          lng: r.lng,
          pinColor: r.pin_color || "#EF4444",
          visited: Boolean(r.visited),
          review: r.review || "",
        }))
      );
    }
    const { data: tData } = await supabase.from("saved_trips").select("*").order("id", { ascending: false });
    if (tData) {
      setSavedTrips(
        tData.map((r) => ({
          id: r.id,
          title: r.title,
          startDate: r.start_date,
          endDate: r.end_date,
          routeText: r.route_text,
          createdAt: r.created_at,
        }))
      );
    }
    const { data: sData } = await supabase.from("trip_settings").select("*").eq("id", 1).maybeSingle();
    if (sData) {
      setTripTitle(sData.trip_title);
      if (sData.updated_at) setLastModified(sData.updated_at);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const touchTimestamp = async (newTitle?: string) => {
    const now = new Date().toLocaleString("ko-KR");
    setLastModified(now);
    await supabase.from("trip_settings").upsert({
      id: 1,
      trip_title: newTitle ?? tripTitle,
      updated_at: now,
    });
  };

  // 주소/지역을 좌표(lat, lng)로 변환하는 헬퍼
  const getCoordinates = async (query: string, region: string) => {
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, region }),
      });
      return await res.json();
    } catch {
      return { lat: 37.5665, lng: 126.978 };
    }
  };

  const handleAddPlace = async (p: Place) => {
    const coords = await getCoordinates(p.location || p.name, p.region);
    const newId = Number(p.id) || Date.now();
    const pinColor = p.pinColor || "#EF4444";

    const { error } = await supabase.from("places").insert({
      id: newId,
      author: p.author || "관우",
      region: p.region || "미지정",
      category: p.category || "맛집",
      name: p.name || "이름없음",
      price: p.price || "",
      duration: p.duration || "",
      location: p.location || "",
      features: p.features || "",
      cautions: p.cautions || "",
      naver_url: p.naverUrl || "",
      insta_url: p.instaUrl || "",
      selected: true,
      lat: coords.lat,
      lng: coords.lng,
      pin_color: pinColor,
      visited: Boolean(p.visited),
      review: p.review || "",
    });
    if (error) return alert("DB 저장 실패: " + error.message);

    setPlaces([
      {
        ...p,
        id: newId,
        lat: coords.lat,
        lng: coords.lng,
        pinColor,
        visited: Boolean(p.visited),
        review: p.review || "",
      },
      ...places,
    ]);
    touchTimestamp();
  };

  // 지도에서 지역 클릭 후 모달로 장소 바로 저장
  const handleQuickSaveFromMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapAddRegion || !quickName.trim()) return;
    setIsSavingQuick(true);

    const newPlace: Place = {
      id: Date.now(),
      author: quickAuthor,
      region: mapAddRegion,
      category: quickCategory,
      name: quickName.trim(),
      price: "",
      duration: "",
      location: quickLocation.trim(),
      features: quickFeatures.trim(),
      cautions: "",
      naverUrl: "",
      instaUrl: "",
      selected: true,
      pinColor: quickPinColor,
      visited: quickVisited,
      review: quickReview.trim(),
    };

    await handleAddPlace(newPlace);
    setIsSavingQuick(false);
    setMapAddRegion(null);
    setQuickName("");
    setQuickLocation("");
    setQuickFeatures("");
    setQuickReview("");
    setQuickVisited(false);
    setQuickPinColor("#EF4444");
  };

  // 지도에서 핀 클릭 후 후기 & 핀 색상 수정 저장
  const handleUpdatePinAndReview = async (
    id: number,
    updates: { pin_color: string; visited: boolean; review: string }
  ) => {
    setPlaces(
      places.map((p) =>
        p.id === id
          ? {
              ...p,
              pinColor: updates.pin_color,
              visited: updates.visited,
              review: updates.review,
            }
          : p
      )
    );
    await supabase
      .from("places")
      .update({
        pin_color: updates.pin_color,
        visited: updates.visited,
        review: updates.review,
      })
      .eq("id", id);
    touchTimestamp();
  };

  const handleToggleSelect = async (id: number) => {
    const target = places.find((p) => p.id === id);
    if (!target) return;
    setPlaces(places.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)));
    await supabase.from("places").update({ selected: !target.selected }).eq("id", id);
    touchTimestamp();
  };

  const handleUpdatePlace = async (u: Place) => {
    setPlaces(places.map((p) => (p.id === u.id ? u : p)));
    await supabase
      .from("places")
      .update({
        region: u.region,
        category: u.category,
        name: u.name,
        price: u.price,
        duration: u.duration,
        location: u.location,
        features: u.features,
        cautions: u.cautions,
        naver_url: u.naverUrl,
        insta_url: u.instaUrl,
      })
      .eq("id", u.id);
    touchTimestamp();
  };

  const handleDelete = async (id: number) => {
    setPlaces(places.filter((p) => p.id !== id));
    await supabase.from("places").delete().eq("id", id);
    touchTimestamp();
  };

  const handleGenerateRoute = async () => {
    const selected = places.filter((p) => p.selected);
    if (selected.length === 0) return alert("보관 장소에서 최소 1곳 이상 선택해주세요!");
    setIsLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, transport, places: selected }),
      });
      const data = await res.json();
      if (data.plan) {
        setGeneratedPlan(data.plan);
        setGeneratedRoute(JSON.stringify(data.plan));
      } else if (data.route) {
        setGeneratedRoute(data.route);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTrip = async (customTitle: string) => {
    const newTrip: SavedTrip = {
      id: Date.now(),
      title: customTitle,
      startDate,
      endDate,
      routeText: generatedPlan ? JSON.stringify(generatedPlan) : generatedRoute || "",
      createdAt: new Date().toLocaleDateString("ko-KR"),
    };
    await supabase.from("saved_trips").insert({
      id: newTrip.id,
      title: newTrip.title,
      start_date: newTrip.startDate,
      end_date: newTrip.endDate,
      route_text: newTrip.routeText,
      created_at: newTrip.createdAt,
    });
    setSavedTrips([newTrip, ...savedTrips]);
  };

  const handleDeleteSavedTrip = async (id: number) => {
    setSavedTrips(savedTrips.filter((t) => t.id !== id));
    await supabase.from("saved_trips").delete().eq("id", id);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <div className="bg-stone-900 text-white px-4 py-2">
        <div className="max-w-md mx-auto flex items-center justify-between text-xs">
          <Link href="/" className="font-bold text-amber-300 hover:underline">
            ← 메인 보드로
          </Link>
          <span className="text-stone-400">여행 카테고리</span>
        </div>
      </div>

      <Header
        tripTitle={tripTitle}
        setTripTitle={(t) => {
          setTripTitle(t);
          touchTimestamp(t);
        }}
        lastModified={lastModified}
        onRefresh={fetchAllData}
      />

      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {/* 1. 최상단 대한민국 일러스트 컬러 지도 */}
        <KoreaIllustMap
          places={places.map((p) => ({
            ...p,
            pin_color: p.pinColor,
          }))}
          onSelectRegionToAdd={(regionName) => setMapAddRegion(regionName)}
          onUpdatePlaceReviewAndPin={handleUpdatePinAndReview}
        />

        {/* 2. 기존 여행 메인 / 보관 장소 화면 */}
        {view === "home" ? (
          <>
            <HomeView
              tripTitle={tripTitle}
              startDate={startDate}
              endDate={endDate}
              transport={transport}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              setTransport={setTransport}
              places={places}
              generatedRoute={generatedRoute}
              isLoading={isLoading}
              savedTrips={savedTrips}
              onGoStorage={() => setView("storage")}
              onGenerateRoute={handleGenerateRoute}
              onSaveTrip={handleSaveTrip}
              onDeleteSavedTrip={handleDeleteSavedTrip}
            />
            {generatedPlan && <RouteResult plan={generatedPlan} />}
          </>
        ) : (
          <div className="space-y-5">
            <button
              onClick={() => setView("home")}
              className="text-xs font-bold bg-stone-200 px-3 py-1.5 rounded-xl"
            >
              ← 여행 메인으로 돌아가기
            </button>
            <PlaceForm onAddPlace={handleAddPlace} />
            <PlaceList
              places={places}
              onToggleSelect={handleToggleSelect}
              onDelete={handleDelete}
              onUpdate={handleUpdatePlace}
            />
          </div>
        )}
      </main>

      {/* 지도에서 시·도 구역 클릭 시 열리는 빠른 장소 저장 모달 */}
      {mapAddRegion && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleQuickSaveFromMap}
            className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">
                📍 [{mapAddRegion}] 새 장소 저장
              </h3>
              <button
                type="button"
                onClick={() => setMapAddRegion(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* 작성자 & 카테고리 */}
            <div className="flex gap-2">
              {(["관우", "다영"] as const).map((person) => (
                <button
                  key={person}
                  type="button"
                  onClick={() => setQuickAuthor(person)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${
                    quickAuthor === person
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-stone-50 text-stone-500 border-stone-200"
                  }`}
                >
                  {person === "관우" ? "🙋‍♂️ 관우" : "🙋‍♀️ 다영"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-1 bg-stone-100 p-1 rounded-xl">
              {(["맛집", "놀거리", "숙소", "쇼핑"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setQuickCategory(cat)}
                  className={`text-[11px] font-bold py-1 rounded-lg ${
                    quickCategory === cat ? "bg-white shadow-sm text-stone-900" : "text-stone-500"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              placeholder="장소 이름 * (예: 해운대 암소갈비)"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
            />

            <input
              type="text"
              placeholder="상세 주소/위치 (예: 부산 해운대구 중동2로 10번길)"
              value={quickLocation}
              onChange={(e) => setQuickLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
            />

            <input
              type="text"
              placeholder="특징 메모 (선택)"
              value={quickFeatures}
              onChange={(e) => setQuickFeatures(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
            />

            {/* 핀 색깔 선택 */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                🎨 핀 색깔 선택
              </label>
              <div className="flex gap-2">
                {PIN_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setQuickPinColor(c.value)}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      quickPinColor === c.value ? "scale-110 border-stone-900" : "border-white shadow"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* 다녀간 후기 체크 & 입력 */}
            <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={quickVisited}
                onChange={(e) => setQuickVisited(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
              <span>✅ 이미 다녀온 곳이에요 (후기 함께 작성)</span>
            </label>

            {quickVisited && (
              <textarea
                rows={2}
                placeholder="다녀간 후기를 자유롭게 적어주세요!"
                value={quickReview}
                onChange={(e) => setQuickReview(e.target.value)}
                className="w-full p-2.5 text-xs border border-stone-200 rounded-xl"
              />
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMapAddRegion(null)}
                className="flex-1 py-2.5 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSavingQuick}
                className="flex-1 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl"
              >
                {isSavingQuick ? "핀 꽂는 중..." : "지도에 핀 저장"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}