"use client";

import React, { useState, useEffect } from "react";

export interface ShortAnswerItem {
  id: number;
  question: string;
  imageDataUrl?: string; // 문제 스크린샷 이미지 (Data URL)
  answer: string;
  date: string;
  wrongCount?: number;
}

const SHORT_KEY = "kwan_study_ee_short_answers_v1";

function compressToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxW = 800;
      const scale = img.width > maxW ? maxW / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("이미지 처리 실패"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.src = url;
  });
}

export default function ShortAnswerBox({ todayStr }: { todayStr: string }) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [items, setItems] = useState<ShortAnswerItem[]>([]);
  const [question, setQuestion] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [answer, setAnswer] = useState("");
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
    try {
      localStorage.setItem(SHORT_KEY, JSON.stringify(next));
      setItems(next);
    } catch {
      alert("저장 공간이 부족합니다. 오래된 스크린샷 문제를 일부 삭제한 뒤 다시 시도해 주세요.");
    }
  };

  // 스크린샷 업로드 시 문제 내용에 이미지 그대로 첨부
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressToDataUrl(file);
      setImageDataUrl(dataUrl);
    } catch {
      alert("스크린샷을 불러오는 중 오류가 발생했습니다.");
    } finally {
      e.target.value = "";
    }
  };

  const handleAddShortAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() && !imageDataUrl) {
      return alert("문제 내용을 입력하거나 스크린샷을 올려주세요.");
    }
    if (!answer.trim()) {
      return alert("정답을 입력해 주세요.");
    }

    const newItem: ShortAnswerItem = {
      id: Date.now(),
      question: question.trim(),
      imageDataUrl: imageDataUrl || undefined,
      answer: answer.trim(),
      date: todayStr,
    };
    saveItems([newItem, ...items]);
    setQuestion("");
    setImageDataUrl("");
    setAnswer("");
    setIsHistoryOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("이 단답 문제를 삭제할까요?")) {
      saveItems(items.filter((item) => item.id !== id));
    }
  };

  const toggleReveal = (id: number) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* 1. 단답 문제 등록 박스 (스크린샷 그대로 첨부 + 수기 정답 입력) */}
      <section className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div
          onClick={() => setIsRegisterOpen(!isRegisterOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-stone-900">✍️ 단답 문제 등록</h2>
            <span className="text-xs font-extrabold text-amber-600">
              {isRegisterOpen ? "▼" : "▶"}
            </span>
          </div>
        </div>

        {isRegisterOpen && (
          <form onSubmit={handleAddShortAnswer} className="space-y-3 pt-1">
            {/* 문제 내용 박스 (스크린샷 올리기 + 선택적 텍스트 입력 통합) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-stone-600">문제 내용</label>
                <label className="text-[11px] font-extrabold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg cursor-pointer transition">
                  📸 스크린샷 올리기
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {imageDataUrl && (
                <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                  <img
                    src={imageDataUrl}
                    alt="첨부된 문제 스크린샷"
                    className="w-full max-h-64 object-contain mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => setImageDataUrl("")}
                    className="absolute top-2 right-2 bg-stone-900/75 text-white text-[10px] font-bold px-2 py-1 rounded-lg"
                  >
                    사진 삭제 ✕
                  </button>
                </div>
              )}

              <textarea
                rows={3}
                placeholder={
                  imageDataUrl
                    ? "추가 메모가 있으면 입력하세요 (사진만으로도 등록 가능)"
                    : "단답형 문제 내용을 입력하거나 위 버튼으로 스크린샷을 올려주세요"
                }
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-2.5 text-xs leading-relaxed border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:outline-none"
              />
            </div>

            {/* 정답 수기 입력 박스 */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-600">정답</label>
              <textarea
                rows={2}
                placeholder="정답을 직접 입력하세요"
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
        )}
      </section>

      {/* 2. 누적 단답 기록 박스 (스크린샷 문제 + 텍스트 문제 모두 표시) */}
      <section className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-stone-900">📋 누적 단답 기록</h2>
            <span className="text-xs font-extrabold text-amber-600">
              {isHistoryOpen ? "▼" : "▶"}
            </span>
          </div>
          <span className="text-[11px] font-bold text-stone-400">{items.length}문제</span>
        </div>

        {isHistoryOpen && (
          <div className="border-t border-stone-200 pt-1">
            {items.length === 0 ? (
              <p className="py-6 text-center text-xs text-stone-400">
                아직 등록된 단답 문제가 없습니다.
              </p>
            ) : (
              <div className="divide-y divide-stone-200">
                {items.map((item, idx) => {
                  const isRevealed = !!revealedIds[item.id];
                  return (
                    <div key={item.id} className="py-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-extrabold text-amber-700">
                            #{items.length - idx}
                          </span>
                          <span className="text-[11px] text-stone-400">{item.date}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-[11px] text-stone-400 hover:text-rose-500"
                        >
                          삭제
                        </button>
                      </div>

                      {item.imageDataUrl && (
                        <img
                          src={item.imageDataUrl}
                          alt="문제 스크린샷"
                          className="w-full max-h-64 object-contain rounded-xl border border-stone-200 bg-stone-50"
                        />
                      )}

                      {item.question && (
                        <p className="text-xs font-bold text-stone-800 whitespace-pre-line leading-relaxed">
                          {item.question}
                        </p>
                      )}

                      <div>
                        <button
                          type="button"
                          onClick={() => toggleReveal(item.id)}
                          className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg"
                        >
                          {isRevealed ? "정답 숨기기 ▲" : "정답 보기 ▼"}
                        </button>

                        {isRevealed && (
                          <p className="mt-2 pt-2 border-t border-dashed border-stone-200 text-xs font-extrabold text-emerald-800 whitespace-pre-line leading-relaxed">
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
    </>
  );
}
