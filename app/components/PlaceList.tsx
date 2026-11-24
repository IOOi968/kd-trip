"use client";

import React, { useState } from "react";
import { Category, Place } from "../types";

interface PlaceListProps {
  places: Place[];
  onToggleSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (updatedPlace: Place) => void;
}

export default function PlaceList({ places, onToggleSelect, onDelete, onUpdate }: PlaceListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Place | null>(null);

  const startEdit = (place: Place) => {
    setEditingId(place.id);
    setEditForm({ ...place });
  };

  const saveEdit = () => {
    if (!editForm || !editForm.name.trim()) return;
    onUpdate(editForm);
    setEditingId(null);
    setEditForm(null);
  };

  const selectedCount = places.filter((p) => p.selected).length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-700">🗂️ 저장된 장소 ({places.length}곳)</h2>
        <span className="text-xs text-stone-500">{selectedCount}곳 선택됨</span>
      </div>

      {places.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-stone-300">
          <p className="text-sm font-medium text-stone-500">가고 싶은 장소를 추가해보세요!</p>
        </div>
      ) : (
        places.map((p) =>
          editingId === p.id && editForm ? (
            <div key={p.id} className="p-4 rounded-2xl border-2 border-amber-400 bg-amber-50/40 space-y-2">
              <div className="grid grid-cols-12 gap-1.5">
                <input value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} placeholder="지역" className="col-span-5 px-2.5 py-1.5 text-xs bg-white border rounded-lg" />
                <div className="col-span-7 grid grid-cols-4 gap-1 bg-stone-100 p-1 rounded-lg">
                  {(["놀거리", "숙소", "맛집", "쇼핑"] as Category[]).map((cat) => (
                    <button key={cat} type="button" onClick={() => setEditForm({ ...editForm, category: cat })} className={editForm.category === cat ? "text-[11px] font-bold rounded bg-white shadow-sm" : "text-[11px] text-stone-500"}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="장소/숙소 이름 *" className="px-2.5 py-1.5 text-xs bg-white border rounded-lg" />
                <input value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} placeholder="가격" className="px-2.5 py-1.5 text-xs bg-white border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <input value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} placeholder="소요시간" className="px-2.5 py-1.5 text-xs bg-white border rounded-lg" />
                <input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="위치" className="px-2.5 py-1.5 text-xs bg-white border rounded-lg" />
              </div>
              <input value={editForm.features} onChange={(e) => setEditForm({ ...editForm, features: e.target.value })} placeholder="특징" className="w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg" />
              <input value={editForm.cautions} onChange={(e) => setEditForm({ ...editForm, cautions: e.target.value })} placeholder="주의사항" className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg" />
              <div className="grid grid-cols-2 gap-1.5">
                <input value={editForm.naverUrl} onChange={(e) => setEditForm({ ...editForm, naverUrl: e.target.value })} placeholder="네이버지도/예약 URL" className="px-2.5 py-1.5 text-xs bg-white border rounded-lg" />
                <input value={editForm.instaUrl} onChange={(e) => setEditForm({ ...editForm, instaUrl: e.target.value })} placeholder="인스타그램 URL" className="px-2.5 py-1.5 text-xs bg-white border rounded-lg" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={saveEdit} className="flex-1 py-1.5 bg-stone-900 text-white text-xs font-bold rounded-lg">수정 완료</button>
                <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg">취소</button>
              </div>
            </div>
          ) : (
            <div key={p.id} className={p.selected ? "p-4 rounded-2xl border bg-white border-stone-300 shadow-sm flex items-start gap-3" : "p-4 rounded-2xl border bg-stone-100 border-stone-200 opacity-60 flex items-start gap-3"}>
              <input type="checkbox" checked={p.selected} onChange={() => onToggleSelect(p.id)} className="mt-1 w-5 h-5 accent-rose-500" />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  <span className={p.author === "관우" ? "px-2 py-0.5 rounded bg-sky-100 text-sky-700" : "px-2 py-0.5 rounded bg-rose-100 text-rose-700"}>{p.author}</span>
                  <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600">{p.region}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">{p.category}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-base truncate">{p.name}</h3>
                  {p.price && <span className="text-xs font-semibold text-emerald-700">{p.price}</span>}
                </div>
                {(p.duration || p.location) && <p className="text-xs text-stone-500">{p.duration && "⏱️ " + p.duration} {p.location && "📍 " + p.location}</p>}
                {p.features && <p className="text-xs bg-stone-50 p-2 rounded-lg">✨ {p.features}</p>}
                {p.cautions && <p className="text-xs bg-rose-50 text-rose-700 p-2 rounded-lg">⚠️ {p.cautions}</p>}
                <div className="flex gap-2 pt-1">
                  {p.naverUrl && <a href={p.naverUrl} target="_blank" rel="noreferrer" className="text-[11px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">네이버지도/예약 ↗</a>}
                  {p.instaUrl && <a href={p.instaUrl} target="_blank" rel="noreferrer" className="text-[11px] bg-pink-50 text-pink-700 px-2 py-1 rounded border border-pink-200">인스타그램 ↗</a>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => startEdit(p)} className="text-xs text-stone-500 hover:text-amber-600 font-medium">수정</button>
                <button onClick={() => onDelete(p.id)} className="text-xs text-stone-400 hover:text-red-500">삭제</button>
              </div>
            </div>
          )
        )
      )}
    </section>
  );
}