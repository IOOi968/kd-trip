"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";

interface MealItem {
  id: number;
  date: string;
  time: string;
  food: string;
  amount: string;
  kcal: number;
  protein: number;
}

interface MealRecommendation {
  time: string;
  menu: string;
  kcal: number;
}

interface SavedInbodyAnalysis {
  id: number;
  date: string;
  goal: string;
  targetKcal: number;
  targetProtein: number;
  mealPlan: MealRecommendation[];
}

export default function DietTab() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedInbodyAnalysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | "">("");

  const [targetKcal, setTargetKcal] = useState(2200);
  const [targetProtein, setTargetProtein] = useState(150);
  const [recommendedPlan, setRecommendedPlan] = useState<MealRecommendation[]>([]);
  const [meals, setMeals] = useState<MealItem[]>([]);

  const [time, setTime] = useState("점심");
  const [food, setFood] = useState("");
  const [amount, setAmount] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [isEstimating, setIsEstimating] = useState(false);
  const [aiNote, setAiNote] = useState("");

  useEffect(() => {
    const loadDietData = async () => {
      const { data: mealsData } = await supabase
        .from("workout_meals")
        .select("*")
        .order("id", { ascending: false });
      if (mealsData) setMeals(mealsData);

      const { data: anaData } = await supabase
        .from("workout_inbody_analyses")
        .select("*")
        .order("id", { ascending: false });
      if (anaData && anaData.length > 0) {
        const list: SavedInbodyAnalysis[] = anaData.map((a) => ({
          id: a.id,
          date: a.date,
          goal: a.goal,
          targetKcal: a.target_kcal,
          targetProtein: a.target_protein,
          mealPlan: a.meal_plan || [],
        }));
        setSavedAnalyses(list);
        const first = list[0];
        setSelectedAnalysisId(first.id);
        setTargetKcal(first.targetKcal);
        setTargetProtein(first.targetProtein);
        setRecommendedPlan(first.mealPlan);
      }
    };
    loadDietData();
  }, []);

  const handleSelectAnalysis = (val: string) => {
    if (!val) {
      setSelectedAnalysisId("");
      return;
    }
    const idNum = Number(val);
    setSelectedAnalysisId(idNum);

    const found = savedAnalyses.find((a) => a.id === idNum);
    if (found) {
      setTargetKcal(found.targetKcal);
      setTargetProtein(found.targetProtein);
      setRecommendedPlan(found.mealPlan || []);
    }
  };

  const handleEstimateKcal = async () => {
    if (!food.trim()) return alert("음식 메뉴를 먼저 입력해 주세요!");
    setIsEstimating(true);
    setAiNote("");
    try {
      const res = await fetch("/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "food_estimate", foodText: food, amountText: amount }),
      });
      const data = await res.json();
      if (data.kcal) {
        setKcal(String(data.kcal));
        setProtein(String(data.protein || 0));
        setAiNote(data.note || "");
      }
    } finally {
      setIsEstimating(false);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!food.trim() || !kcal) return;
    const newMeal: MealItem = {
      id: Date.now(),
      date: selectedDate,
      time,
      food: food.trim(),
      amount: amount.trim(),
      kcal: Number(kcal),
      protein: Number(protein) || 0,
    };
    setMeals([newMeal, ...meals]);
    setFood("");
    setAmount("");
    setKcal("");
    setProtein("");
    setAiNote("");
    await supabase.from("workout_meals").insert(newMeal);
  };

  const dailyMeals = meals.filter((m) => m.date === selectedDate);
  const totalKcal = dailyMeals.reduce((sum, m) => sum + m.kcal, 0);
  const totalProtein = dailyMeals.reduce((sum, m) => sum + m.protein, 0);
  const diffKcal = targetKcal - totalKcal;
  const diffProtein = targetProtein - totalProtein;
  const isOver = diffKcal < 0;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold bg-stone-100 px-2.5 py-1.5 rounded-lg"
          />

          <select
            value={selectedAnalysisId}
            onChange={(e) => handleSelectAnalysis(e.target.value)}
            className="text-xs font-bold bg-stone-100 px-2.5 py-1.5 rounded-lg max-w-[180px] truncate focus:outline-none"
          >
            {savedAnalyses.length === 0 ? (
              <option value="">인바디 분석 없음</option>
            ) : (
              savedAnalyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.date} · {a.goal}
                </option>
              ))
            )}
          </select>
        </div>

        <div className={`p-3 rounded-xl border space-y-1.5 ${isOver ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-700">섭취 {totalKcal} / {targetKcal} kcal</span>
            <span className={`text-xs font-extrabold ${isOver ? "text-rose-600" : "text-emerald-700"}`}>
              {isOver ? `🚨 ${Math.abs(diffKcal)} kcal 오버됨!` : `✅ ${diffKcal} kcal 여유 있음`}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-black/5">
            <span className="text-xs font-bold text-stone-700">단백질 {totalProtein} / {targetProtein} g</span>
            <span className={`text-xs font-extrabold ${diffProtein <= 0 ? "text-sky-700" : "text-stone-600"}`}>
              {diffProtein <= 0 ? `💪 목표 단백질 달성! (+${Math.abs(diffProtein)}g)` : `🥩 ${diffProtein} g 더 필요`}
            </span>
          </div>
        </div>

        {recommendedPlan.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl space-y-2">
            <p className="text-[11px] font-bold text-amber-900">🍱 인바디 맞춤 현실 추천 식단</p>
            <div className="space-y-1.5">
              {recommendedPlan.map((item, i) => (
                <div key={i} className="bg-white/90 px-2.5 py-2 rounded-lg text-xs flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-amber-900 mr-1.5">[{item.time}]</span>
                    <span className="text-stone-800">{item.menu}</span>
                  </div>
                  {item.kcal > 0 && <span className="text-[11px] text-stone-400 shrink-0">{item.kcal}kcal</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleAddMeal} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-2.5">
        <h2 className="text-sm font-bold text-stone-800">🥗 식단 기록 & AI 칼로리 계산</h2>
        <div className="grid grid-cols-4 gap-1 bg-stone-100 p-1 rounded-xl">
          {["아침", "점심", "저녁", "간식"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTime(t)}
              className={`py-1.5 text-[11px] font-bold rounded-lg ${time === t ? "bg-white text-emerald-700 shadow-xs" : "text-stone-500"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="음식 메뉴 (예: 제육덮밥)"
            value={food}
            onChange={(e) => setFood(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl"
            required
          />
          <input
            type="text"
            placeholder="체감 양 (예: 밥 반공기만)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl"
          />
        </div>

        <button
          type="button"
          onClick={handleEstimateKcal}
          disabled={isEstimating}
          className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl"
        >
          {isEstimating ? "⏳ AI가 칼로리 계산 중..." : "✨ 먹은 양 기준으로 대략 칼로리 계산하기"}
        </button>

        {aiNote && <p className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg">💡 {aiNote}</p>}

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="칼로리 (kcal) *"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl"
            required
          />
          <input
            type="number"
            placeholder="단백질 (g)"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="px-3 py-2 text-xs border border-stone-200 rounded-xl"
          />
        </div>

        <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl">
          {selectedDate} 식단에 저장하기
        </button>
      </form>

      <div className="space-y-2">
        <span className="text-xs font-bold text-stone-600 px-1">{selectedDate} 섭취 내역 ({dailyMeals.length})</span>
        {dailyMeals.map((m) => (
          <div key={m.id} className="bg-white border border-stone-200 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{m.time}</span>
                <span className="text-xs font-bold text-stone-900">{m.food}</span>
                {m.amount && <span className="text-[11px] text-stone-400">({m.amount})</span>}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">🔥 {m.kcal} kcal · 🥩 단백질 {m.protein}g</p>
            </div>
            <button
              onClick={async () => {
                setMeals(meals.filter((x) => x.id !== m.id));
                await supabase.from("workout_meals").delete().eq("id", m.id);
              }}
              className="text-xs text-stone-400 hover:text-rose-500"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}