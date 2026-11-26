"use client";

import React, { useState } from "react";

export interface ShortAnswerItem {
  id: number;
  question: string;
  imageDataUrl?: string;
  answer: string;
  date: string;
  wrongCount?: number;
}

interface Props {
  subjectName: string;
  allItems: ShortAnswerItem[];
  initialMode?: "setup" | "wrong-only";
  onClose: () => void;
  onRecordResult: (id: number, isCorrect: boolean) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function QuizRunnerModal({
  subjectName,
  allItems,
  initialMode = "setup",
  onClose,
  onRecordResult,
}: Props) {
  const wrongOnlyList = allItems.filter((item) => (item.wrongCount || 0) > 0);

  const [step, setStep] = useState<"setup" | "playing" | "result">(
    initialMode === "wrong-only" ? "playing" : "setup"
  );
  const [quizQueue, setQuizQueue] = useState<ShortAnswerItem[]>(() =>
    initialMode === "wrong-only" ? shuffleArray(wrongOnlyList) : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const startQuiz = (limit: number | "all") => {
    if (allItems.length === 0) return;
    const shuffled = shuffleArray(allItems);
    const sliced = limit === "all" ? shuffled : shuffled.slice(0, limit);
    setQuizQueue(sliced);
    setCurrentIdx(0);
    setShowAnswer(false);
    setCorrectCount(0);
    setWrongCount(0);
    setStep("playing");
  };

  const handleJudge = (isCorrect: boolean) => {
    const currentItem = quizQueue[currentIdx];
    if (!currentItem) return;

    onRecordResult(currentItem.id, isCorrect);
    if (isCorrect) setCorrectCount((c) => c + 1);
    else setWrongCount((w) => w + 1);

    if (currentIdx + 1 >= quizQueue.length) {
      setStep("result");
    } else {
      setCurrentIdx((idx) => idx + 1);
      setShowAnswer(false);
    }
  };

  const currentItem = quizQueue[currentIdx];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4"
    >
      {/* 큰 박스 하나만 유지하고 내부는 얇은 구분선으로 분리 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-5 shadow-xl max-h-[88vh] overflow-y-auto"
      >
        {/* 1. 문제 수 설정 화면 (10 / 20 / 전체) */}
        {step === "setup" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-stone-900">
                📝 {subjectName} 단답 퀴즈 설정
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-stone-400 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="border-t border-stone-200 pt-4">
              {allItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-500 space-y-1.5">
                  <p className="font-bold text-stone-700">등록된 단답 문제가 없습니다.</p>
                  <p>전기기사 페이지의 [단답 문제 등록]에서 먼저 문제를 추가해 주세요!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-stone-500">
                    누적 단답 <strong className="text-stone-800">{allItems.length}문제</strong> 중 몇 문제를 랜덤으로 풀까요?
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => startQuiz(10)}
                      className="py-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-extrabold transition"
                    >
                      10문제
                    </button>
                    <button
                      type="button"
                      onClick={() => startQuiz(20)}
                      className="py-3 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-extrabold transition"
                    >
                      20문제
                    </button>
                    <button
                      type="button"
                      onClick={() => startQuiz("all")}
                      className="py-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-extrabold transition"
                    >
                      전체 ({allItems.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. 한 문제씩 랜덤 출제 (중첩 박스 없이 얇은 구분선 하나만 사용) */}
        {step === "playing" && currentItem && (
          <div>
            {/* 상단 진행 표시 헤더 */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {currentIdx + 1} / {quizQueue.length}
                </span>
                {(currentItem.wrongCount || 0) > 0 && (
                  <span className="text-[11px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                    누적 오답 {currentItem.wrongCount}회
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-stone-400 font-bold hover:text-stone-600"
              >
                그만하기 ✕
              </button>
            </div>

            {/* 문제 영역 (별도 박스 없이 얇은 상단 구분선만 적용) */}
            <div className="border-t border-stone-200 py-4 space-y-3 min-h-[130px]">
              <span className="block text-[10px] font-extrabold text-stone-400 tracking-wider">
                QUESTION
              </span>

              {currentItem.imageDataUrl && (
                <img
                  src={currentItem.imageDataUrl}
                  alt="퀴즈 문제 스크린샷"
                  className="w-full max-h-72 object-contain rounded-lg"
                />
              )}

              {currentItem.question && (
                <p className="text-sm font-extrabold text-stone-900 whitespace-pre-line leading-relaxed">
                  {currentItem.question}
                </p>
              )}
            </div>

            {/* 정답 확인 전 vs 정답 확인 후 (얇은 구분선 하나로 분리) */}
            {!showAnswer ? (
              <div className="border-t border-stone-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-extrabold rounded-xl transition"
                >
                  정답 확인하기
                </button>
              </div>
            ) : (
              <div className="border-t border-stone-200 pt-4 space-y-4">
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-extrabold text-emerald-700 tracking-wider">
                    ANSWER
                  </span>
                  <p className="text-sm font-extrabold text-emerald-900 whitespace-pre-line leading-relaxed">
                    {currentItem.answer}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleJudge(false)}
                    className="py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold rounded-xl transition"
                  >
                    ❌ 틀림
                  </button>
                  <button
                    type="button"
                    onClick={() => handleJudge(true)}
                    className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition"
                  >
                    ⭕ 맞음
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. 퀴즈 완료 결과 화면 */}
        {step === "result" && (
          <div className="text-center space-y-4 py-2">
            <h2 className="text-base font-extrabold text-stone-900">🎉 퀴즈 완료!</h2>
            <div className="border-t border-b border-stone-200 py-4 grid grid-cols-2 divide-x divide-stone-200">
              <div>
                <span className="block text-[11px] text-stone-500">맞은 문제</span>
                <strong className="text-lg font-extrabold text-emerald-600">{correctCount}개</strong>
              </div>
              <div>
                <span className="block text-[11px] text-stone-500">틀린 문제</span>
                <strong className="text-lg font-extrabold text-rose-600">{wrongCount}개</strong>
              </div>
            </div>
            <p className="text-[11px] text-stone-500">
              틀린 문제는 [자주 틀린 문제] 목록에 자동 누적되었습니다.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-stone-900 text-white text-xs font-extrabold rounded-xl"
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
