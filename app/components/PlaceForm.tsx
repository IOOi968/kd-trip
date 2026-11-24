"use client";

import React, { useState } from "react";
import { Category, Place } from "../types";

export default function PlaceForm({ onAddPlace }: { onAddPlace: (p: Place) => void }) {
  const [author, setAuthor] = useState<"관우" | "다영">("관우");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState<Category>("맛집");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [features, setFeatures] = useState("");
  const [cautions, setCautions] = useState("");
  const [naverUrl, setNaverUrl] = useState("");
  const [instaUrl, setInstaUrl] = useState("");

  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const handleAutoParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();
      if (data.error) return alert(data.error);
      if (data.name) setName(data.name);
      if (data.region) setRegion(data.region);
      if (data.location) setLocation(data.location);
      if (data.price) setPrice(data.price);
      if (data.duration) setDuration(data.duration);
      if (data.features) setFeatures(data.features);
      if (data.cautions) setCautions(data.cautions);
      if (data.naverUrl) setNaverUrl(data.naverUrl);
      if (data.instaUrl) setInstaUrl(data.instaUrl);
      setRawText("");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddPlace({
      id: Date.now(),
      author,
      region: region.trim() || "미지정",
      category,
      name: name.trim(),
      price: price.trim(),
      duration: duration.trim(),
      location: location.trim(),
      features: features.trim(),
      cautions: cautions.trim(),
      naverUrl: naverUrl.trim(),
      instaUrl: instaUrl.trim(),
      selected: true,
    });
    setRegion("");
    setName("");
    setPrice("");
    setDuration("");
    setLocation("");
    setFeatures("");
    setCautions("");
    setNaverUrl("");
    setInstaUrl("");
  };

  return (
    <section className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 space-y-3">
      <h2 className="text-sm font-bold text-stone-700">📍 새 장소 추가</h2>

      <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl space-y-2">
        <textarea
          rows={2}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="네이버지도나 카톡 메모를 통째로 붙여넣으세요"
          className="w-full p-2 text-xs bg-white border border-amber-200 rounded-lg"
        />
        <button
          type="button"
          onClick={handleAutoParse}
          disabled={isParsing}
          className="w-full py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg"
        >
          {isParsing ? "AI 정리 중..." : "✨ 메모 자동 정리해서 채우기"}
        </button>
      </div>

      <div className="flex gap-2">
        {(["관우", "다영"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAuthor(p)}
            className={`flex-1 py-1.5 text-xs rounded-lg font-semibold border ${
              author === p ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-500"
            }`}
          >
            {p === "관우" ? "🙋‍♂️ 관우" : "🙋‍♀️ 다영"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-12 gap-2">
          <input
            type="text"
            placeholder="지역"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="col-span-5 px-3 py-2 text-xs border border-stone-200 rounded-xl"
          />
          <div className="col-span-7 grid grid-cols-4 gap-1 bg-stone-100 p-1 rounded-xl">
            {(["놀거리", "숙소", "맛집", "쇼핑"] as Category[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`text-[11px] font-bold rounded-lg py-1 ${
                  category === cat ? "bg-white shadow-sm" : "text-stone-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="장소 이름 *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl"
            required
          />
          <input
            type="text"
            placeholder="가격"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="소요시간"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl"
          />
          <input
            type="text"
            placeholder="도로명/지번 주소"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl"
          />
        </div>

        <input
          type="text"
          placeholder="특징"
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
        />
        <input
          type="text"
          placeholder="주의사항"
          value={cautions}
          onChange={(e) => setCautions(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-rose-200 bg-rose-50/30 rounded-xl"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="url"
            placeholder="네이버지도 URL"
            value={naverUrl}
            onChange={(e) => setNaverUrl(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl"
          />
          <input
            type="url"
            placeholder="인스타그램 URL"
            value={instaUrl}
            onChange={(e) => setInstaUrl(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl"
          />
        </div>

        <button type="submit" className="w-full py-2.5 bg-stone-900 text-white text-sm font-bold rounded-xl">
          저장하기
        </button>
      </form>
    </section>
  );
}