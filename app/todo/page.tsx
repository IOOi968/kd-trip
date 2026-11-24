"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface IdeaItem {
  id: number;
  preset: string;
  content: string;
  date: string;
  done: boolean;
}

const PRESETS_KEY = "kwan_todo_presets_v1";
const ITEMS_KEY = "kwan_todo_items_v1";

function getLocalTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function TodoPage() {
  const [presets, setPresets] = useState<string[]>([]);
  const [targetPreset, setTargetPreset] = useState<string>("");
  const [viewPreset, setViewPreset] = useState<string>("전체");
  const [newPresetName, setNewPresetName] = useState("");
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [isDeletingPreset, setIsDeletingPreset] = useState(false);

  const [items, setItems] = useState<IdeaItem[]>([]);
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    const localToday = getLocalTodayStr();
    setDate((prev) => prev || localToday);

    try {
      const p = localStorage.getItem(PRESETS_KEY);
      if (p) {
        const parsed: string[] = JSON.parse(p);
        setPresets(parsed);
        if (parsed.length > 0) setTargetPreset(parsed[0]);
      }
      const i = localStorage.getItem(ITEMS_KEY);
      if (i) setItems(JSON.parse(i));
    } catch {}
  }, []);

  const savePresets = (next: string[]) => {
    setPresets(next);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
  };

  const saveItems = (next: IdeaItem[]) => {
    setItems(next);
    localStorage.setItem(ITEMS_KEY, JSON.stringify(next));
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPresetName.trim();
    if (!name || presets.includes(name)) return;
    const next = [...presets, name];
    savePresets(next);
    setTargetPreset(name);
    setNewPresetName("");
    setShowAddPreset(false);
  };

  const handleDeletePreset = (presetToRemove: string) => {
    const next = presets.filter((p) => p !== presetToRemove);
    savePresets(next);
    if (targetPreset === presetToRemove) {
      setTargetPreset(next[0] || "");
    }
    if (viewPreset === presetToRemove) {
      setViewPreset("전체");
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const fallbackDate = date || getLocalTodayStr();
    const presetToSave = targetPreset || "일반";
    if (!presets.includes(presetToSave) && !targetPreset) {
      savePresets([...presets, presetToSave]);
      setTargetPreset(presetToSave);
    }
    saveItems([
      {
        id: Date.now(),
        preset: presetToSave,
        content: content.trim(),
        date: fallbackDate,
        done: false,
      },
      ...items,
    ]);
    setContent("");
  };

  const toggleItemDone = (id: number) => {
    saveItems(items.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  };

  const deleteItem = (id: number) => {
    saveItems(items.filter((x) => x.id !== id));
  };

  const startEdit = (item: IdeaItem) => {
    setEditingId(item.id);
    setEditingText(item.content);
  };

  const saveEdit = (id: number) => {
    if (!editingText.trim()) return;
    const trimmed = editingText.trim();
    saveItems(items.map((x) => (x.id === id ? { ...x, content: trimmed } : x)));
    setEditingId(null);
    setEditingText("");
  };

  const visibleItems = useMemo(() => {
    const filtered =
      viewPreset === "전체"
        ? items
        : items.filter((x) => x.preset === viewPreset);
    return [...filtered].sort((a, b) => Number(a.done) - Number(b.done));
  }, [items, viewPreset]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-16 overflow-x-hidden">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/"
              className="text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg transition shrink-0"
            >
              ← 홈
            </Link>
            <h1 className="text-base font-extrabold text-stone-900 truncate">
              ✅ 해야 할 일
            </h1>
          </div>
          <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full shrink-0 max-w-[140px] truncate">
            {viewPreset} · {visibleItems.length}개
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-5 min-w-0">
        <section className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-stone-700">🗂️ 프리셋</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsDeletingPreset(!isDeletingPreset)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${
                  isDeletingPreset
                    ? "bg-rose-100 text-rose-700"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                }`}
              >
                {isDeletingPreset ? "완료" : "삭제"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddPreset(!showAddPreset)}
                className="text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-lg transition"
              >
                {showAddPreset ? "닫기 ✕" : "+ 프리셋 추가"}
              </button>
            </div>
          </div>

          {presets.length > 0 && (
            <div className="flex flex-wrap gap-1.5 min-w-0">
              {presets.map((preset) => {
                const count = items.filter((i) => i.preset === preset).length;
                const active = targetPreset === preset;
                return (
                  <div
                    key={preset}
                    className={`inline-flex items-center rounded-xl text-xs font-bold border transition max-w-full overflow-hidden ${
                      active
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-stone-50 text-stone-600 border-stone-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setTargetPreset(preset)}
                      className="px-3 py-1.5 break-all text-left hover:opacity-80"
                    >
                      {preset} ({count})
                    </button>
                    {isDeletingPreset && (
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(preset)}
                        aria-label={`${preset} 삭제`}
                        className="px-2 py-1.5 text-[11px] text-rose-500 hover:bg-rose-100 hover:text-rose-700 border-l border-stone-200/80"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showAddPreset && (
            <form onSubmit={handleAddPreset} className="flex gap-2 pt-1 min-w-0">
              <input
                type="text"
                placeholder="프리셋 이름 입력"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="flex-1 min-w-0 px-3 py-1.5 text-xs border border-stone-200 rounded-xl focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shrink-0"
              >
                추가
              </button>
            </form>
          )}
        </section>

        <form
          onSubmit={handleAddItem}
          className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-2.5 min-w-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-xs font-bold text-stone-800 shrink-0">프리셋:</span>
              <select
                value={targetPreset}
                onChange={(e) => setTargetPreset(e.target.value)}
                className="min-w-0 max-w-full px-2 py-1 text-xs font-bold border border-stone-200 rounded-lg bg-stone-50 text-stone-800 truncate"
              >
                {presets.length === 0 ? (
                  <option value="">일반</option>
                ) : (
                  presets.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))
                )}
              </select>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-2.5 py-1 text-[11px] border border-stone-200 rounded-lg bg-stone-50 text-stone-600 shrink-0"
            />
          </div>

          <textarea
            rows={4}
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 text-xs leading-relaxed border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400"
            required
          />

          <button
            type="submit"
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition"
          >
            + 항목으로 추가하기
          </button>
        </form>

        <section className="space-y-2.5 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {["전체", ...presets].map((tab) => {
              const active = viewPreset === tab;
              const tabCount =
                tab === "전체"
                  ? items.length
                  : items.filter((i) => i.preset === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setViewPreset(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition max-w-full break-all text-left ${
                    active
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {tab} ({tabCount})
                </button>
              );
            })}
          </div>

          {visibleItems.length === 0 ? (
            <div className="bg-white border border-dashed border-stone-300 rounded-2xl py-12 px-6 min-h-[160px] flex flex-col items-center justify-center gap-1 text-center">
              <span className="text-xl">📝</span>
              <p className="text-xs font-bold text-stone-500">
                표시할 항목이 없습니다.
              </p>
            </div>
          ) : (
            visibleItems.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition flex items-start gap-3 min-w-0 ${
                    item.done
                      ? "bg-stone-100/80 border-stone-200 opacity-65"
                      : "bg-white border-stone-200 shadow-2xs"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItemDone(item.id)}
                    className="mt-0.5 w-4 h-4 accent-amber-600 cursor-pointer shrink-0"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400">
                      <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded max-w-full truncate">
                        {item.preset}
                      </span>
                      <span>📅 {item.date}</span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={3}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full p-2 text-xs leading-relaxed border border-stone-300 rounded-xl focus:outline-none"
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => saveEdit(item.id)}
                            className="px-2.5 py-1 bg-stone-900 text-white text-[11px] font-bold rounded-lg"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 bg-stone-100 text-stone-600 text-[11px] font-bold rounded-lg"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className={`text-xs leading-relaxed whitespace-pre-line break-words ${
                          item.done
                            ? "line-through text-stone-400"
                            : "text-stone-800 font-medium"
                        }`}
                      >
                        {item.content}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => (isEditing ? setEditingId(null) : startEdit(item))}
                      className="text-[11px] font-semibold text-stone-500 hover:text-stone-900"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="text-[11px] text-stone-400 hover:text-rose-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}