"use client";

import React, { useState, useEffect } from "react";

interface ShortAnswerItem {
  id: number;
  question: string;
  answer: string;
  date: string;
}

const SHORT_KEY = "kwan_study_ee_short_answers_v1";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxW = 1000;
      const scale = img.width > maxW ? maxW / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("이미지 처리 실패"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.src = url;
  });
}

export default function ShortAnswerBox({ todayStr }: { todayStr: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<ShortAnswerItem[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SHORT_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      // 무시
    }
  }, []);

  const saveItems = (next: ShortAnswerItem[]) => {
    setItems(next);
    localStorage.setItem(SHORT_KEY, JSON.stringify(next));
  };

  // 스크린샷 선택 시 AI로 글자 분석해 문제/정답 칸 자동 채우기
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const base64 = await compressImage(file);
      const res = await fetch("/api/study-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: "image/jpeg" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || "글자 분석 중 오류가 발생했습니다.");
        return;
      }
      if (data.question) setQuestion(data.question);
      if (data.answer) setAnswer(data.answer);
    } catch {
      alert("스크린샷 분석 중 오류가 발생했습니다.");
    } finally {
      setIsExtracting(false);
      e.target.value = "";
    }
  };

  const handleAddShortAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() && !answer.trim()) return;

    const newItem: ShortAnswerItem = {
      id: Date.now(),
      question: question.trim(),
      answer: answer.trim(),
      date: todayStr,
    };
    saveItems([newItem, ...items]);
    setQuestion("");
    setAnswer("");
  };

  const handleDelete = (id: number) => {
    if (confirm("이 단답 기록을 삭제할까요?")) {
      saveItems(items.filter((item) => item.id !== id));
    }
  };

  const toggleReveal = (id: number) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3.5">
      {/* 1·2번 박스와 완전히 동일한 글자 크기·스타일의 헤더 + 삼각형 토글 */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold text-stone-900">✍️ 단답 기록</h2>
          <span className="text-xs font-extrabold text-amber-600">{isOpen ? "▼" : "▶"}</span>
        </div>
        <span className="text-[11px] font-bold text-stone-400">{items.length}개</span>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-1">
          <form onSubmit={handleAddShortAnswer} className="space-y-3">
            {/* 스크린샷 넣는 칸 + AI 글자 분석 */}
            <label className="block w-full py-2.5 px-3 bg-amber-50/70 hover:bg-amber-100/70 border border-dashed border-amber-300 rounded-xl text-center cursor-pointer transition">
              <span className="text-xs font-extrabold text-amber-900">
                {isExtracting
                  ? "⏳ AI가 스크린샷 글자를 분석 중입니다..."
                  : "📸 스크린샷 첨부 (AI 자동 글자 추출)"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isExtracting}
                className="hidden"
              />
            </label>

            {/* 문제 내용 넣는 박스 */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-600">문제 내용</label>
              <textarea
                rows={3}
                placeholder="단답형 문제 내용을 입력하거나 위에서 스크린샷을 올려주세요"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-2.5 text-xs leading-relaxed border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none"
                required
              />
            </div>

            {/* 정답 넣는 박스 */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-600">정답</label>
              <textarea
                rows={2}
                placeholder="정답을 입력하세요"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full p-2.5 text-xs font-bold leading-relaxed border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-xs transition"
            >
              단답 기록
            </button>
          </form>

          {/* 저장된 단답 문제 목록 */}
          {items.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              {items.map((item, idx) => {
                const isRevealed = !!revealedIds[item.id];
                return (
                  <div
                    key={item.id}
                    className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-amber-800">
                        Q{items.length - idx}. ({item.date})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-[11px] text-stone-400 hover:text-rose-500"
                      >
                        삭제
                      </button>
                    </div>

                    <p className="text-xs font-bold text-stone-800 whitespace-pre-line leading-relaxed">
                      {item.question}
                    </p>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleReveal(item.id)}
                        className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg"
                      >
                        {isRevealed ? "정답 숨기기 ▲" : "정답 확인 ▼"}
                      </button>

                      {isRevealed && (
                        <p className="mt-2 p-2.5 bg-white border border-emerald-200 rounded-lg text-xs font-extrabold text-emerald-900 whitespace-pre-line">
                          {item.answer}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
