"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";

interface MealRecommendation {
  time: string;
  menu: string;
  kcal: number;
}

interface SavedInbodyAnalysis {
  id: number;
  date: string;
  goal: string;
  duration: string;
  targetMuscle: string;
  bmr: number;
  targetKcal: number;
  targetProtein: number;
  feasibilityBadge: string;
  feasibilityDetail: string;
  bodySummary: string;
  mealPlan: MealRecommendation[];
}

interface InbodyRecord {
  id: number;
  date: string;
  weight: number;
  muscle: number;
  fatMass: number;
  fatPercent: number;
  bmr: number;
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxW = 900;
      const scale = img.width > maxW ? maxW / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("이미지 처리 실패"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.src = url;
  });
}

export default function InbodyTab() {
  const [records, setRecords] = useState<InbodyRecord[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedInbodyAnalysis[]>([]);
  const [openAnalysisId, setOpenAnalysisId] = useState<number | null>(null);

  const [goal, setGoal] = useState("체지방 감량");
  const [duration, setDuration] = useState("");
  const [targetMuscle, setTargetMuscle] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const loadInbodyData = async () => {
      const { data: recData } = await supabase
        .from("workout_inbody_records")
        .select("*")
        .order("date", { ascending: true });
      if (recData) {
        setRecords(
          recData.map((r) => ({
            id: r.id,
            date: r.date,
            weight: r.weight,
            muscle: r.muscle,
            fatMass: r.fat_mass,
            fatPercent: r.fat_percent,
            bmr: r.bmr,
          }))
        );
      }

      const { data: anaData } = await supabase
        .from("workout_inbody_analyses")
        .select("*")
        .order("id", { ascending: false });
      if (anaData) {
        const mapped: SavedInbodyAnalysis[] = anaData.map((a) => ({
          id: a.id,
          date: a.date,
          goal: a.goal,
          duration: a.duration,
          targetMuscle: a.target_muscle,
          bmr: a.bmr,
          targetKcal: a.target_kcal,
          targetProtein: a.target_protein,
          feasibilityBadge: a.feasibility_badge,
          feasibilityDetail: a.feasibility_detail,
          bodySummary: a.body_summary,
          mealPlan: a.meal_plan || [],
        }));
        setSavedAnalyses(mapped);
        if (mapped.length > 0) setOpenAnalysisId(mapped[0].id);
      }
    };
    loadInbodyData();
  }, []);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const base64 = await compressImage(file);
      const res = await fetch("/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "inbody",
          imageBase64: base64,
          mimeType: "image/jpeg",
          goal,
          duration: duration.trim(),
          targetMuscle: targetMuscle.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return alert(data.error || "분석 중 오류가 발생했습니다.");
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const newRec: InbodyRecord = {
        id: Date.now(),
        date: data.date || todayStr,
        weight: Number(data.weight) || 0,
        muscle: Number(data.muscle) || 0,
        fatMass: Number(data.fatMass) || 0,
        fatPercent: Number(data.fatPercent) || 0,
        bmr: Number(data.bmr) || 1500,
      };
      setRecords([...records, newRec].sort((a, b) => a.date.localeCompare(b.date)));
      await supabase.from("workout_inbody_records").insert({
        id: newRec.id,
        date: newRec.date,
        weight: newRec.weight,
        muscle: newRec.muscle,
        fat_mass: newRec.fatMass,
        fat_percent: newRec.fatPercent,
        bmr: newRec.bmr,
      });

      const parsedPlan: MealRecommendation[] = Array.isArray(data.mealPlan)
        ? data.mealPlan.map((m: any) =>
            typeof m === "string"
              ? { time: "추천", menu: m, kcal: 0 }
              : { time: m.time || "식단", menu: m.menu || "", kcal: Number(m.kcal) || 0 }
          )
        : [];

      const newAnalysis: SavedInbodyAnalysis = {
        id: Date.now() + 1,
        date: todayStr,
        goal,
        duration: duration.trim() || "권장 기간",
        targetMuscle: targetMuscle.trim() || "근육 유지",
        bmr: Number(data.bmr) || 1500,
        targetKcal: Number(data.targetKcal) || 2200,
        targetProtein: Number(data.targetProtein) || 150,
        feasibilityBadge: data.feasibilityBadge || "분석 완료",
        feasibilityDetail: data.feasibilityDetail || "",
        bodySummary: data.bodySummary || "",
        mealPlan: parsedPlan,
      };

      setSavedAnalyses([newAnalysis, ...savedAnalyses]);
      setOpenAnalysisId(newAnalysis.id);
      await supabase.from("workout_inbody_analyses").insert({
        id: newAnalysis.id,
        date: newAnalysis.date,
        goal: newAnalysis.goal,
        duration: newAnalysis.duration,
        target_muscle: newAnalysis.targetMuscle,
        bmr: newAnalysis.bmr,
        target_kcal: newAnalysis.targetKcal,
        target_protein: newAnalysis.targetProtein,
        feasibility_badge: newAnalysis.feasibilityBadge,
        feasibility_detail: newAnalysis.feasibilityDetail,
        body_summary: newAnalysis.bodySummary,
        meal_plan: newAnalysis.mealPlan,
      });
    } catch (err: any) {
      alert(err?.message || "업로드 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
      e.target.value = "";
    }
  };

  const renderLineChart = (title: string, color: string, values: number[], unit: string) => {
    if (values.length === 0) return null;
    const min = Math.min(...values) - 1;
    const max = Math.max(...values) + 1;
    const width = 260;
    const height = 65;

    const points = values.map((v, i) => {
      const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * (width - 40) + 20;
      const y = height - 15 - ((v - min) / (max - min || 1)) * (height - 30);
      return { x, y, v };
    });

    const polyPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

    return (
      <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
        <div className="flex justify-between text-xs font-bold">
          <span style={{ color }}>{title}</span>
          <span className="text-stone-700">{values[values.length - 1]}{unit}</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 overflow-visible">
          {points.length > 1 && <polyline fill="none" stroke={color} strokeWidth="2.5" points={polyPoints} />}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="4" fill={color} />
              <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="9" fill="#444" fontWeight="bold">
                {p.v}
              </text>
            </g>
          ))}
        </svg>
        <div className="flex justify-between text-[10px] text-stone-400">
          {records.map((r) => <span key={r.id}>{r.date.slice(5)}</span>)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-stone-900">📸 인바디 앱 스크린샷 자동 분석</h2>
        <div className="grid grid-cols-3 gap-1.5">
          {["체지방 감량", "린매스업", "근육량 증가"].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGoal(g)}
              className={`py-1.5 text-[11px] font-bold rounded-lg border transition ${
                goal === g
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-stone-50 text-stone-600 border-stone-200"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="목표 기간 (예: 8주, 3개월)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50"
          />
          <input
            type="text"
            placeholder="원하는 근육량 증가 (예: +2kg)"
            value={targetMuscle}
            onChange={(e) => setTargetMuscle(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50"
          />
        </div>

        <label className="block w-full py-3 bg-lime-50 hover:bg-lime-100 border-2 border-dashed border-emerald-300 rounded-xl text-center cursor-pointer transition">
          <span className="text-xs font-bold text-emerald-800">
            {isAnalyzing ? "⏳ AI가 스크린샷 분석 중..." : "🖼️ 인바디 스크린샷 사진 선택하기"}
          </span>
          <input type="file" accept="image/*" onChange={handleScreenshotUpload} disabled={isAnalyzing} className="hidden" />
        </label>
      </div>

      {savedAnalyses.length > 0 && (
        <div className="space-y-2.5">
          {savedAnalyses.map((item) => {
            const isOpen = openAnalysisId === item.id;
            return (
              <div
                key={item.id}
                className="bg-emerald-50/80 border border-emerald-200 rounded-2xl overflow-hidden"
              >
                <div
                  onClick={() => setOpenAnalysisId(isOpen ? null : item.id)}
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-emerald-100/60 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-950">
                      {item.date} · {item.goal}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      {item.targetKcal}kcal
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-700">
                      {isOpen ? "▲" : "▼"}
                    </span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setSavedAnalyses(savedAnalyses.filter((a) => a.id !== item.id));
                        if (openAnalysisId === item.id) setOpenAnalysisId(null);
                        await supabase.from("workout_inbody_analyses").delete().eq("id", item.id);
                      }}
                      className="text-[11px] text-stone-400 hover:text-rose-500"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-emerald-200/70">
                    <div className="flex items-center justify-between pt-1">
                      <h3 className="text-xs font-bold text-emerald-950">💡 인바디 핵심 분석 & 식단 전략</h3>
                      <span className="text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                        {item.feasibilityBadge}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-xl border border-emerald-100 text-xs">
                      <div>
                        <p className="text-[10px] text-stone-400">기초대사량</p>
                        <p className="font-extrabold text-stone-800">{item.bmr} kcal</p>
                      </div>
                      <div className="border-x border-stone-100">
                        <p className="text-[10px] text-emerald-600 font-bold">권장 칼로리</p>
                        <p className="font-extrabold text-emerald-700">{item.targetKcal} kcal</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-lime-700 font-bold">권장 단백질</p>
                        <p className="font-extrabold text-lime-700">{item.targetProtein} g</p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                      <p className="text-[11px] font-bold text-emerald-900">
                        🎯 현실성 검토 ({item.duration} · 근육 {item.targetMuscle})
                      </p>
                      <p className="text-xs text-stone-700 leading-relaxed">{item.feasibilityDetail}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                      <p className="text-[11px] font-bold text-stone-800">📌 체성분 핵심 요약</p>
                      <p className="text-xs text-stone-700 leading-relaxed">{item.bodySummary}</p>
                    </div>

                    {item.mealPlan.length > 0 && (
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-2">
                        <p className="text-[11px] font-bold text-emerald-800">🍱 현실 맞춤 추천 식단</p>
                        <div className="space-y-1.5">
                          {item.mealPlan.map((m, idx) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between gap-2 text-xs bg-lime-50/50 px-2.5 py-2 rounded-lg border border-lime-100"
                            >
                              <div>
                                <span className="font-bold text-emerald-700 mr-1.5">[{m.time}]</span>
                                <span className="text-stone-800">{m.menu}</span>
                              </div>
                              {m.kcal > 0 && <span className="text-[11px] text-stone-400 shrink-0">{m.kcal}kcal</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {records.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-stone-800">📈 기간별 신체 변화 추이 ({records.length}회 기록)</h3>
          {renderLineChart("체중 변화", "#1c1917", records.map((r) => r.weight), "kg")}
          {renderLineChart("골격근량 변화", "#059669", records.map((r) => r.muscle), "kg")}
          {renderLineChart("체지방량 변화", "#e11d48", records.map((r) => r.fatMass), "kg")}
        </div>
      )}
    </div>
  );
}