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

  // 수정 상태 (항목 내용 + 프리셋 변경)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingPreset, setEditingPreset] = useState("일반");

  // 꾹 눌러서 순서 이동 상태 (상단 프리셋 칸 & 하단 필터 탭 공용)
  const [reorderingPreset, setReorderingPreset] = useState<string | null>(null);
  const [reorderSource, setReorderSource] = useState<"top" | "bottom" | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const didReorderRef = useRef(false);

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

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // 꾹 누르기 시작 (0.35초 유지 시 순서 이동 모드 진입)
  const handlePresetPointerDown = (
    e: React.PointerEvent,
    presetName: string,
    source: "top" | "bottom"
  ) => {
    if (presetName === "전체" || isDeletingPreset) return;
    clearLongPressTimer();
    didReorderRef.current = false;
    pressStartPosRef.current = { x: e.clientX, y: e.clientY };

    longPressTimerRef.current = setTimeout(() => {
      setReorderingPreset(presetName);
      setReorderSource(source);
      didReorderRef.current = true;
      isDraggingFilter.current = false;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(25);
        } catch {}
      }
    }, 350);
  };

  // 롱프레스 대기 중 손가락/마우스가 크게 움직이면 롱프레스 취소(일반 좌우 슬라이드 허용)
  const handlePresetPointerMoveCancelCheck = (e: React.PointerEvent) => {
    if (!longPressTimerRef.current || !pressStartPosRef.current) return;
    const dx = Math.abs(e.clientX - pressStartPosRef.current.x);
    const dy = Math.abs(e.clientY - pressStartPosRef.current.y);
    if (dx > 8 || dy > 8) {
      clearLongPressTimer();
    }
  };

  // 순서 이동 모드 중 포인터(터치/마우스)가 다른 프리셋 위로 지나가면 위치 즉시 교환
  useEffect(() => {
    if (!reorderingPreset || !reorderSource) return;

    const movePresetToTarget = (fromName: string, toName: string) => {
      if (fromName === toName || toName === "전체") return;
      setPresets((prev) => {
        const base = prev.includes("일반") ? [...prev] : ["일반", ...prev];
        const fromIdx = base.indexOf(fromName);
        const toIdx = base.indexOf(toName);
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;

        const next = [...base];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
        return next;
      });
    };

    const handleMoveAtPoint = (clientX: number, clientY: number) => {
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      const chip = el?.closest(`[data-preset-zone="${reorderSource}"]`) as HTMLElement | null;
      const hoveredName = chip?.getAttribute("data-preset-name");
      if (hoveredName && hoveredName !== reorderingPreset) {
        movePresetToTarget(reorderingPreset, hoveredName);
      }
    };

    const handleGlobalPointerMove = (e: PointerEvent) => {
      e.preventDefault();
      handleMoveAtPoint(e.clientX, e.clientY);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        handleMoveAtPoint(touch.clientX, touch.clientY);
      }
    };

    const handleGlobalEnd = () => {
      clearLongPressTimer();
      setReorderingPreset(null);
      setReorderSource(null);
      setTimeout(() => {
        didReorderRef.current = false;
      }, 60);
    };

    window.addEventListener("pointermove", handleGlobalPointerMove, { passive: false });
    window.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });
    window.addEventListener("pointerup", handleGlobalEnd);
    window.addEventListener("pointercancel", handleGlobalEnd);
    window.addEventListener("touchend", handleGlobalEnd);
    window.addEventListener("touchcancel", handleGlobalEnd);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("pointerup", handleGlobalEnd);
      window.removeEventListener("pointercancel", handleGlobalEnd);
      window.removeEventListener("touchend", handleGlobalEnd);
      window.removeEventListener("touchcancel", handleGlobalEnd);
    };
  }, [reorderingPreset, reorderSource]);

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

  // 내용에 등록된 프리셋과 동일한 단어가 있으면 자동 분류하고, 맨 앞에 붙은 프리셋 문구는 제거
  const resolvePresetAndContent = (rawText: string, chosenPreset: string) => {
    const sortedPresets = [...presets]
      .map((p) => p.trim())
      .filter((p) => p && p !== "일반")
      .sort((a, b) => b.length - a.length);

    const prefixMatch = sortedPresets.find((p) => rawText.startsWith(p));
    if (prefixMatch) {
      const stripped = rawText.slice(prefixMatch.length).trim();
      return {
        preset: prefixMatch,
        cleanedContent: stripped || rawText,
      };
    }

    const anywhereMatch = sortedPresets.find((p) => rawText.includes(p));
    if (anywhereMatch) {
      return {
        preset: anywhereMatch,
        cleanedContent: rawText,
      };
    }

    return {
      preset: chosenPreset || "일반",
      cleanedContent: rawText,
    };
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    const { preset: assignedPreset, cleanedContent } = resolvePresetAndContent(
      trimmed,
      targetPreset
    );

    saveItems([
      {
        id: Date.now(),
        preset: assignedPreset,
        content: cleanedContent,
        date: date || getLocalTodayStr(),
        done: false,
        highlighted: false,
      },
      ...items,
    ]);
    setContent("");
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
    if (presets.includes("일반")) {
      return Array.from(new Set(presets));
    }
    return Array.from(new Set(["일반", ...presets]));
  }, [presets]);

  const filterTabs = useMemo(() => {
    return ["전체", ...presetOptions];
  }, [presetOptions]);

  const visibleItems = useMemo(() => {
    const filtered =
      viewPreset === "전체"
        ? items
        : items.filter((x) => (x.preset || "일반") === viewPreset);
    return [...filtered].sort((a, b) => Number(a.done) - Number(b.done));
  }, [items, viewPreset]);

  // 좌우 드래그 스크롤 핸들러 (순서 이동 모드가 아닐 때만 동작)
  const onFilterMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reorderingPreset) return;
    const el = filterBarRef.current;
    if (!el) return;
    isDraggingFilter.current = true;
    draggedMoved.current = false;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragStartScrollLeft.current = el.scrollLeft;
  };

  const onFilterMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reorderingPreset || !isDraggingFilter.current || !filterBarRef.current) return;
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

  const isBottomReordering =
    reorderingPreset !== null && reorderSource === "bottom";

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
        {/* 프리셋 관리 영역 (꾹 눌러서 위치 이동 가능) */}
        <section className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-700">🗂️ 프리셋</span>
              {reorderingPreset && reorderSource === "top" && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  순서 이동 중
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setReorderingPreset(null);
                  setIsDeletingPreset(!isDeletingPreset);
                }}
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
            <div className="flex flex-wrap gap-1.5 min-w-0 select-none">
              {presets.map((preset) => {
                const count = items.filter((i) => i.preset === preset).length;
                const active = targetPreset === preset;
                const isBeingMoved =
                  reorderingPreset === preset && reorderSource === "top";
                return (
                  <div
                    key={preset}
                    data-preset-zone="top"
                    data-preset-name={preset}
                    onPointerDown={(e) => handlePresetPointerDown(e, preset, "top")}
                    onPointerMove={handlePresetPointerMoveCancelCheck}
                    onPointerUp={clearLongPressTimer}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`inline-flex items-center rounded-xl text-xs font-bold border transition max-w-full overflow-hidden touch-none ${
                      isBeingMoved
                        ? "bg-amber-300 text-amber-950 border-amber-500 scale-105 shadow-md ring-2 ring-amber-300 z-10"
                        : active
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-stone-50 text-stone-600 border-stone-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (didReorderRef.current) return;
                        setTargetPreset(preset);
                      }}
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

        {/* 자유 입력 폼 */}
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
        </form>

        {/* 평소엔 한 줄 좌우 슬라이드, 꾹 누를 때만 위쪽 프리셋 칸처럼 펼쳐져 순서 이동 */}
        <section className="space-y-2.5 min-w-0">
          <div
            ref={filterBarRef}
            onMouseDown={onFilterMouseDown}
            onMouseMove={onFilterMouseMove}
            onMouseUp={stopFilterDrag}
            onMouseLeave={stopFilterDrag}
            className={
              isBottomReordering
                ? "w-full max-w-full bg-white border border-amber-300 rounded-2xl p-3 shadow-sm flex flex-wrap items-center gap-1.5 select-none touch-none"
                : "w-full max-w-full flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 cursor-grab active:cursor-grabbing select-none"
            }
          >
            {filterTabs.map((tab) => {
              const active = viewPreset === tab;
              const isBeingMoved =
                reorderingPreset === tab && reorderSource === "bottom";
              const tabCount =
                tab === "전체"
                  ? items.length
                  : items.filter((i) => (i.preset || "일반") === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  data-preset-zone="bottom"
                  data-preset-name={tab}
                  onPointerDown={(e) => handlePresetPointerDown(e, tab, "bottom")}
                  onPointerMove={handlePresetPointerMoveCancelCheck}
                  onPointerUp={clearLongPressTimer}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => {
                    if (draggedMoved.current || didReorderRef.current) return;
                    setEditingId(null);
                    setEditingText("");
                    setViewPreset(tab);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition shrink-0 whitespace-nowrap ${
                    isBeingMoved
                      ? "bg-amber-300 text-amber-950 border-amber-500 scale-105 shadow-md ring-2 ring-amber-300 z-10"
                      : active
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
