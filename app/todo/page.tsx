"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";

interface IdeaItem {
  id: number;
  preset: string;
  content: string;
  date: string;
  done: boolean;
  highlighted?: boolean;
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
  const [targetPreset, setTargetPreset] = useState<string>("일반");
  const [viewPreset, setViewPreset] = useState<string>("전체");
  const [newPresetName, setNewPresetName] = useState("");
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [isDeletingPreset, setIsDeletingPreset] = useState(false);

  const [items, setItems] = useState<IdeaItem[]>([]);
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 수정 상태 (항목 내용 + 프리셋 변경)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingPreset, setEditingPreset] = useState("일반");

  // 한 줄 필터 바 좌우 드래그 스크롤 ref
  const filterBarRef = useRef<HTMLDivElement>(null);
  const isDraggingFilter = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const draggedMoved = useRef(false);

  useEffect(() => {
    setDate((prev) => prev || getLocalTodayStr());

    try {
      const p = localStorage.getItem(PRESETS_KEY);
      if (p) {
        const parsed: string[] = JSON.parse(p);
        setPresets(parsed);
      }
      const i = localStorage.getItem(ITEMS_KEY);
      if (i) setItems(JSON.parse(i));
    } catch {}
  }, []);

  // 수정 중 다른 곳을 누르거나 벗어나면 자동 수정 취소
  useEffect(() => {
    if (editingId === null) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest("[data-edit-box='true']") ||
        target.closest("[data-edit-trigger='true']")
      ) {
        return;
      }
      setEditingId(null);
      setEditingText("");
    };

    const handleBlur = () => {
      setEditingId(null);
      setEditingText("");
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("blur", handleBlur);
    };
  }, [editingId]);

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
    if (!name || name === "전체" || presets.includes(name)) return;
    savePresets([...presets, name]);
    setNewPresetName("");
    setShowAddPreset(false);
  };

  const handleDeletePreset = (presetToRemove: string) => {
    const next = presets.filter((p) => p !== presetToRemove);
    savePresets(next);
    if (targetPreset === presetToRemove) {
      setTargetPreset("일반");
    }
    if (viewPreset === presetToRemove) {
      setViewPreset("전체");
    }
  };

  // 내용 안에 등록된 프리셋과 동일한 이름이 있으면 그 프리셋으로 결정, 없으면 사용자가 고른 프리셋(기본: 일반) 유지
  const resolvePresetForItem = (text: string, chosenPreset: string) => {
    const sortedPresets = [...presets]
      .filter((p) => p.trim() && p !== "일반")
      .sort((a, b) => b.length - a.length);
    const matched = sortedPresets.find((p) => text.includes(p.trim()));
    return matched || chosenPreset || "일반";
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    const assignedPreset = resolvePresetForItem(trimmed, targetPreset);
    saveItems([
      {
        id: Date.now(),
        preset: assignedPreset,
        content: trimmed,
        date: date || getLocalTodayStr(),
        done: false,
        highlighted: false,
      },
      ...items,
    ]);
    setContent("");
  };

  const handleAiOrganize = () => {
    const trimmed = content.trim();
    if (!trimmed || isAiLoading) return;
    setIsAiLoading(true);

    const lines = trimmed
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const organized =
      lines.length > 1
        ? lines.map((line) => (line.startsWith("• ") ? line : `• ${line}`)).join("\n")
        : trimmed;

    setContent(organized);
    setIsAiLoading(false);
  };

  const toggleItemDone = (id: number) => {
    saveItems(items.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  };

  const toggleItemHighlight = (id: number) => {
    if (editingId === id) return;
    saveItems(
      items.map((x) =>
        x.id === id ? { ...x, highlighted: !x.highlighted } : x
      )
    );
  };

  const deleteItem = (id: number) => {
    if (editingId === id) {
      setEditingId(null);
      setEditingText("");
    }
    saveItems(items.filter((x) => x.id !== id));
  };

  const startEdit = (item: IdeaItem) => {
    if (editingId === item.id) {
      setEditingId(null);
      setEditingText("");
      return;
    }
    setEditingId(item.id);
    setEditingText(item.content);
    setEditingPreset(item.preset || "일반");
  };

  const saveEdit = (id: number) => {
    if (!editingText.trim()) return;
    saveItems(
      items.map((x) =>
        x.id === id
          ? { ...x, content: editingText.trim(), preset: editingPreset || "일반" }
          : x
      )
    );
    setEditingId(null);
    setEditingText("");
  };

  const presetOptions = useMemo(() => {
    const base = ["일반", ...presets.filter((p) => p !== "일반")];
    return Array.from(new Set(base));
  }, [presets]);

  const filterTabs = useMemo(() => {
    const base = ["전체", "일반", ...presets.filter((p) => p !== "일반")];
    return Array.from(new Set(base));
  }, [presets]);

  const visibleItems = useMemo(() => {
    const filtered =
      viewPreset === "전체"
        ? items
        : items.filter((x) => (x.preset || "일반") === viewPreset);
    return [...filtered].sort((a, b) => Number(a.done) - Number(b.done));
  }, [items, viewPreset]);

  // 좌우 드래그 스크롤 핸들러
  const onFilterMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = filterBarRef.current;
    if (!el) return;
    isDraggingFilter.current = true;
    draggedMoved.current = false;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragStartScrollLeft.current = el.scrollLeft;
  };

  const onFilterMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingFilter.current || !filterBarRef.current) return;
    const x = e.pageX - filterBarRef.current.offsetLeft;
    if (Math.abs(x - dragStartX.current) > 4) {
      draggedMoved.current = true;
    }
    const walk = (x - dragStartX.current) * 1.2;
    filterBarRef.current.scrollLeft = dragStartScrollLeft.current - walk;
  };

  const stopFilterDrag = () => {
    isDraggingFilter.current = false;
    setTimeout(() => {
      draggedMoved.current = false;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-16 overflow-x-hidden">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/"
              onClick={() => {
                setEditingId(null);
                setEditingText("");
              }}
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
        {/* 프리셋 관리 영역 */}
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

        {/* 자유 입력 폼 (직접 프리셋 선택 가능 + 내용 일치 시 자동 지정) */}
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
                {presetOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
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

          <button
            type="button"
            onClick={handleAiOrganize}
            disabled={isAiLoading}
            className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition"
          >
            {isAiLoading ? "AI 정리 중..." : "AI"}
          </button>
        </form>

        {/* 한 줄 좌우 드래그 필터 바 & 항목 목록 */}
        <section className="space-y-2.5 min-w-0">
          <div
            ref={filterBarRef}
            onMouseDown={onFilterMouseDown}
            onMouseMove={onFilterMouseMove}
            onMouseUp={stopFilterDrag}
            onMouseLeave={stopFilterDrag}
            className="w-full max-w-full flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 cursor-grab active:cursor-grabbing select-none"
          >
            {filterTabs.map((tab) => {
              const active = viewPreset === tab;
              const tabCount =
                tab === "전체"
                  ? items.length
                  : items.filter((i) => (i.preset || "일반") === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    if (draggedMoved.current) return;
                    setEditingId(null);
                    setEditingText("");
                    setViewPreset(tab);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition shrink-0 whitespace-nowrap ${
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
              const itemPreset = item.preset || "일반";
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItemHighlight(item.id)}
                  className={`p-3.5 rounded-2xl border transition flex items-start gap-3 min-w-0 cursor-pointer ${
                    item.done
                      ? "bg-stone-100/80 border-stone-200 opacity-65"
                      : item.highlighted
                      ? "bg-amber-50/90 border-amber-400 ring-2 ring-amber-200 shadow-xs"
                      : "bg-white border-stone-200 shadow-2xs"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleItemDone(item.id)}
                    className="mt-0.5 w-4 h-4 accent-amber-600 cursor-pointer shrink-0"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400">
                      <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded max-w-full truncate">
                        {itemPreset}
                      </span>
                      <span>📅 {item.date}</span>
                    </div>

                    {isEditing ? (
                      <div
                        data-edit-box="true"
                        onClick={(e) => e.stopPropagation()}
                        className="space-y-2 pt-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-stone-600">
                            프리셋:
                          </span>
                          <select
                            value={editingPreset}
                            onChange={(e) => setEditingPreset(e.target.value)}
                            className="px-2 py-1 text-xs font-bold border border-stone-300 rounded-lg bg-white text-stone-800"
                          >
                            {presetOptions.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>

                        <textarea
                          rows={3}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full p-2 text-xs leading-relaxed border border-stone-300 rounded-xl bg-white focus:outline-none"
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
                            onClick={() => {
                              setEditingId(null);
                              setEditingText("");
                            }}
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

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-col items-end gap-1.5 shrink-0"
                  >
                    <button
                      type="button"
                      data-edit-trigger="true"
                      onClick={() => startEdit(item)}
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
