"use client";

import React, { useState, useEffect } from "react";
import RestTimer from "./RestTimer";
import { supabase } from "../../utils/supabase";

interface PresetSetConfig {
  weight: string;
  reps: string;
}

interface PresetItem {
  id: number;
  name: string;
  restTime: string;
  sets: PresetSetConfig[];
}

interface RoutinePreset {
  id: number;
  title: string;
  items: PresetItem[];
}

interface SetRow {
  id: number;
  presetWeight: string;
  presetReps: string;
  weight: string;
  reps: string;
  done: boolean;
}

interface ActiveExercise {
  id: number;
  name: string;
  restTime?: string;
  note: string;
  sets: SetRow[];
}

export default function RoutineTab() {
  const [presets, setPresets] = useState<RoutinePreset[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<ActiveExercise[]>([]);
  const [activePresetId, setActivePresetId] = useState<number | null>(null);
  const [activeTitle, setActiveTitle] = useState("");
  const [timerKey, setTimerKey] = useState(0);

  const [isEditingPresets, setIsEditingPresets] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [draftItems, setDraftItems] = useState<PresetItem[]>([]);
  const [expandedDraftId, setExpandedDraftId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [setsCount, setSetsCount] = useState("");
  const [restTime, setRestTime] = useState("");

  useEffect(() => {
    const loadPresets = async () => {
      const { data } = await supabase
        .from("workout_presets")
        .select("*")
        .order("id", { ascending: true });
      if (data) setPresets(data);
    };
    loadPresets();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setTitle("");
    setDraftItems([]);
    setExpandedDraftId(null);
    setName("");
    setSetsCount("");
    setRestTime("");
  };

  const handleAddDraftItem = () => {
    if (!name.trim()) return;
    const count = Math.max(1, Number(setsCount) || 3);
    const newId = Date.now();
    const initialSets: PresetSetConfig[] = Array.from({ length: count }).map(() => ({
      weight: "",
      reps: "",
    }));
    setDraftItems([
      ...draftItems,
      { id: newId, name: name.trim(), restTime: restTime.trim(), sets: initialSets },
    ]);
    setExpandedDraftId(newId);
    setName("");
    setSetsCount("");
    setRestTime("");
  };

  const handleUpdateDraftSet = (
    itemId: number,
    setIdx: number,
    field: "weight" | "reps",
    val: string
  ) => {
    setDraftItems(
      draftItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              sets: item.sets.map((s, idx) => (idx === setIdx ? { ...s, [field]: val } : s)),
            }
          : item
      )
    );
  };

  const handleSavePreset = async () => {
    if (!title.trim() || draftItems.length === 0) return;
    if (editId !== null) {
      const updated = { id: editId, title: title.trim(), items: draftItems };
      setPresets(presets.map((p) => (p.id === editId ? updated : p)));
      await supabase.from("workout_presets").upsert(updated);
    } else {
      const created = { id: Date.now(), title: title.trim(), items: draftItems };
      setPresets([...presets, created]);
      await supabase.from("workout_presets").insert(created);
    }
    resetForm();
  };

  const handleStartEdit = (preset: RoutinePreset) => {
    setEditId(preset.id);
    setTitle(preset.title);
    setDraftItems(
      preset.items.map((i) => ({
        ...i,
        restTime: i.restTime || "",
        sets: i.sets.map((s) => ({ ...s })),
      }))
    );
    setExpandedDraftId(preset.items[0]?.id ?? null);
    setShowForm(true);
  };

  const handleSelectPreset = (preset: RoutinePreset) => {
    if (activePresetId === preset.id) {
      setActivePresetId(null);
      setActiveTitle("");
      setActiveRoutine([]);
      return;
    }

    setActivePresetId(preset.id);
    setActiveTitle(preset.title);
    const next: ActiveExercise[] = preset.items.map((item, idx) => ({
      id: Date.now() + idx,
      name: item.name,
      restTime: item.restTime || "",
      note: "",
      sets: item.sets.map((s, sIdx) => {
        const w = s.weight.trim() || "0";
        const r = s.reps.trim() || "0";
        return {
          id: Date.now() + idx * 100 + sIdx,
          presetWeight: w,
          presetReps: r,
          weight: w,
          reps: r,
          done: false,
        };
      }),
    }));
    setActiveRoutine(next);
  };

  const handleToggleSet = (exId: number, setId: number) => {
    let started = false;
    const next = activeRoutine.map((ex) => {
      if (ex.id !== exId) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => {
          if (s.id !== setId) return s;
          if (!s.done) started = true;
          return { ...s, done: !s.done };
        }),
      };
    });
    setActiveRoutine(next);
    if (started) setTimerKey((k) => k + 1);
  };

  const handleUpdateSet = (exId: number, setId: number, field: "weight" | "reps", val: string) => {
    setActiveRoutine(
      activeRoutine.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: val } : s)) }
          : ex
      )
    );
  };

  const handleOunwan = async () => {
    if (activeRoutine.length === 0) return;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = weekdays[now.getDay()];

    const { error } = await supabase.from("workout_logs").upsert({
      date: todayStr,
      day_of_week: dayOfWeek,
      title: activeTitle,
      summary: "",
      routine_snapshot: activeRoutine,
    });

    if (error) {
      alert("DB 저장 오류: " + error.message);
    } else {
      alert(`${todayStr} (${dayOfWeek}) 운동기록이 클라우드 DB에 저장되었습니다.`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-800">나의 루틴</h2>
          {showForm ? (
            <div className="flex items-center gap-1.5">
              {editId !== null && (
                <button
                  type="button"
                  onClick={async () => {
                    const targetId = editId;
                    setPresets(presets.filter((p) => p.id !== targetId));
                    if (activePresetId === targetId) {
                      setActivePresetId(null);
                      setActiveTitle("");
                      setActiveRoutine([]);
                    }
                    resetForm();
                    await supabase.from("workout_presets").delete().eq("id", targetId);
                  }}
                  className="text-xs font-bold bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg"
                >
                  삭제
                </button>
              )}
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-bold bg-stone-100 text-stone-600 px-3 py-1.5 rounded-lg"
              >
                닫기 ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {presets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsEditingPresets((prev) => !prev)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                    isEditingPresets
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  {isEditingPresets ? "완료" : "수정"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsEditingPresets(false);
                  setEditId(null);
                  setTitle("");
                  setDraftItems([]);
                  setExpandedDraftId(null);
                  setShowForm(true);
                }}
                className="text-xs font-bold bg-stone-900 text-white px-3 py-1.5 rounded-lg"
              >
                + 추가
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1">루틴 이름</label>
              <input
                type="text"
                placeholder="루틴 이름"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-bold bg-white border border-stone-200 rounded-xl"
              />
            </div>

            <div className="bg-white border border-stone-200 p-3 rounded-xl space-y-2.5">
              <p className="text-[11px] font-bold text-stone-500">운동 종목 입력</p>
              <div className="grid grid-cols-12 gap-1.5">
                <input
                  placeholder="운동명"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-6 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                />
                <input
                  placeholder="세트수"
                  value={setsCount}
                  onChange={(e) => setSetsCount(e.target.value)}
                  className="col-span-3 px-2 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-center"
                />
                <input
                  placeholder="휴식시간"
                  value={restTime}
                  onChange={(e) => setRestTime(e.target.value)}
                  className="col-span-3 px-2 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-center"
                />
              </div>
              <button
                type="button"
                onClick={handleAddDraftItem}
                className="w-full py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl transition"
              >
                + 종목 추가
              </button>
            </div>

            <div className="pt-2 border-t border-stone-200 space-y-2">
              <p className="text-[11px] font-bold text-stone-500">
                담긴 종목 ({draftItems.length}개 · 클릭하여 세트별 무게/횟수 입력)
              </p>
              {draftItems.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-3 bg-white rounded-xl border border-dashed border-stone-200">
                  위에서 종목을 추가해 주세요
                </p>
              ) : (
                <div className="space-y-2">
                  {draftItems.map((item) => {
                    const isExpanded = expandedDraftId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-stone-200 overflow-hidden"
                      >
                        <div
                          onClick={() => setExpandedDraftId(isExpanded ? null : item.id)}
                          className="flex items-center justify-between px-3.5 py-2.5 text-xs cursor-pointer hover:bg-stone-50"
                        >
                          <span className="font-bold text-stone-800">
                            {item.name} · {item.sets.length}세트
                            {item.restTime && ` · 휴식 ${item.restTime}`}{" "}
                            <span className="text-[11px] font-normal text-stone-400 ml-1">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDraftItems(draftItems.filter((d) => d.id !== item.id));
                            }}
                            className="text-stone-400 hover:text-rose-500 font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1.5 border-t border-stone-100 bg-stone-50/60 space-y-1.5">
                            {item.sets.map((s, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs"
                              >
                                <span className="font-bold text-stone-500">{sIdx + 1}세트</span>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    placeholder="무게"
                                    value={s.weight}
                                    onChange={(e) =>
                                      handleUpdateDraftSet(item.id, sIdx, "weight", e.target.value)
                                    }
                                    className="w-12 text-center bg-stone-50 border border-stone-200 rounded-md py-1 font-bold text-stone-900"
                                  />
                                  <span className="text-stone-500">kg</span>
                                  <input
                                    placeholder="횟수"
                                    value={s.reps}
                                    onChange={(e) =>
                                      handleUpdateDraftSet(item.id, sIdx, "reps", e.target.value)
                                    }
                                    className="w-10 text-center bg-stone-50 border border-stone-200 rounded-md py-1 font-bold text-stone-900"
                                  />
                                  <span className="text-stone-500">회</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={handleSavePreset}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-xl shadow-xs transition"
              >
                저장
              </button>
            </div>
          </div>
        )}

        {presets.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`flex items-stretch rounded-xl shadow-sm overflow-hidden border transition min-w-0 ${
                    isSelected
                      ? "bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-300"
                      : "bg-emerald-600 text-white border-emerald-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="flex-1 py-2.5 px-2 text-center font-extrabold text-xs hover:bg-emerald-700/80 transition truncate"
                    title={preset.title}
                  >
                    {preset.title}
                  </button>
                  {isEditingPresets && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPresets(false);
                        handleStartEdit(preset);
                      }}
                      className="px-2 text-xs font-extrabold bg-emerald-800/50 hover:bg-emerald-800/80 text-white border-l border-emerald-500/40 shrink-0"
                      aria-label={`${preset.title} 수정`}
                    >
                      ✓
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RestTimer triggerKey={timerKey} />

      <div className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2 px-1">
          <span className="w-1.5 h-4 bg-emerald-600 rounded-full" />
          <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
            오늘의 진행 루틴 {activeTitle && `(${activeTitle})`}
          </h3>
        </div>

        {activeRoutine.map((ex) => (
          <div key={ex.id} className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-extrabold text-stone-900">{ex.name}</span>
                {ex.restTime && (
                  <span className="text-[11px] font-semibold text-stone-400">
                    {ex.restTime}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveRoutine(activeRoutine.filter((item) => item.id !== ex.id))}
                className="text-xs text-stone-400 hover:text-rose-500"
              >
                삭제
              </button>
            </div>

            <div className="space-y-1.5">
              {ex.sets.map((s, idx) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs ${
                    s.done ? "bg-emerald-50/70 border-emerald-200 opacity-75" : "bg-stone-50 border-stone-200"
                  }`}
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={() => handleToggleSet(ex.id, s.id)}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                    <span className="font-bold text-stone-600">{idx + 1}세트</span>
                  </div>

                  <span className="text-[11px] font-semibold text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                    {s.presetWeight}kg · {s.presetReps}회
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      value={s.weight}
                      onChange={(e) => handleUpdateSet(ex.id, s.id, "weight", e.target.value)}
                      className="w-11 text-center bg-white border border-stone-300 rounded-lg py-1 font-extrabold text-stone-900"
                    />
                    <span className="text-stone-500">kg</span>
                    <input
                      value={s.reps}
                      onChange={(e) => handleUpdateSet(ex.id, s.id, "reps", e.target.value)}
                      className="w-9 text-center bg-white border border-stone-300 rounded-lg py-1 font-extrabold text-stone-900"
                    />
                    <span className="text-stone-500">회</span>
                  </div>
                </div>
              ))}
            </div>

            <input
              type="text"
              value={ex.note}
              onChange={(e) =>
                setActiveRoutine(
                  activeRoutine.map((item) =>
                    item.id === ex.id ? { ...item, note: e.target.value } : item
                  )
                )
              }
              placeholder="특이사항 / 메모"
              className="w-full text-[11px] bg-amber-50/60 text-amber-900 px-2.5 py-1.5 rounded-lg focus:outline-none"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleOunwan}
        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-2xl shadow-md transition"
      >
        💪 오운완 💪
      </button>
    </div>
  );
}