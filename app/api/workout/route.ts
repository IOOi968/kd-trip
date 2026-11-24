import { NextResponse } from "next/server";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const models = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];

    if (body.type === "inbody") {
      const { imageBase64, mimeType, goal, duration, targetMuscle } = body;
      const prompt = `당신은 전문 스포츠 영양사 및 트레이너입니다.
제공된 인바디 결과지 이미지와 아래 목표 조건을 분석해 반드시 JSON으로만 반환하세요.
- 선택 목표: ${goal || "체지방 감량"}
- 생각하고 있는 기간: ${duration || "미입력 (적정 기간 제안)"}
- 원하는 근육량 변화: ${targetMuscle || "미입력"}

[작성 규칙]
1. 인바디 결과지의 측정일, 키, 체중, 골격근량, 체지방량, 체지방률, 기초대사량을 정확히 읽으세요.
2. 입력된 '기간'과 '원하는 근육량 변화'가 생리학적으로 현실적인지 냉정하고 친절하게 평가하세요.
3. 기초대사량과 활동대사량, 목표를 고려한 일일 권장 섭취 칼로리(kcal)와 단백질(g)을 계산하세요.
4. 추천 식단은 닭가슴살·햇반·계란·그릭요거트·일반 백반 반공기 등 한국에서 현실적으로 바로 구해 먹을 수 있는 메뉴와 구체적인 양(g, 공기, 개)으로 짜세요.

JSON 키:
- date: 측정일 (YYYY-MM-DD, 없으면 오늘 날짜)
- height: 키(cm 숫자)
- weight: 체중(kg 숫자)
- muscle: 골격근량(kg 숫자)
- fatMass: 체지방량(kg 숫자)
- fatPercent: 체지방률(% 숫자)
- bmr: 기초대사량(kcal 숫자)
- targetKcal: 일일 권장 섭취 칼로리(kcal 숫자)
- targetProtein: 일일 권장 단백질(g 숫자)
- feasibilityBadge: 현실성 판정 한 줄 (예: "현실적으로 달성 가능", "다소 빡빡한 목표", "기간 연장 권장")
- feasibilityDetail: 설정한 기간과 근육량 목표에 대한 구체적 분석 설명 (2~3문장)
- bodySummary: 현재 체성분 핵심 진단 및 전략 요약 (2~3문장)
- mealPlan: [{ "time": "아침", "menu": "메뉴 및 구체적 양", "kcal": 500 }, { "time": "점심", "menu": "...", "kcal": 700 }, { "time": "저녁", "menu": "...", "kcal": 650 }, { "time": "간식", "menu": "...", "kcal": 300 }]`;

      const parts: any[] = [{ text: prompt }];
      if (imageBase64) {
        parts.push({ inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } });
      }

      let lastError = "서버 응답 지연";
      for (const model of models) {
        for (let attempt = 0; attempt < 2; attempt++) {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
              }),
            }
          );
          const data = await res.json();
          if (res.ok && !data.error) {
            const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "{}")
              .replace(/```json|```/g, "")
              .trim();
            return NextResponse.json(JSON.parse(text));
          }
          lastError = data.error?.message || res.statusText;
          if (res.status === 503 || lastError.includes("high demand")) {
            await sleep(1500);
            continue;
          }
          break;
        }
      }
      return NextResponse.json({ error: `AI 분석 실패: ${lastError}` }, { status: 500 });
    }

    if (body.type === "food_estimate") {
      const { foodText, amountText } = body;
      const prompt = `음식("${foodText}")과 체감 양("${amountText || "보통 1인분"}")의 칼로리와 단백질을 추산해 JSON만 반환하세요.
키: kcal(숫자), protein(숫자), note(한 줄 요약)`;

      let lastError = "계산 실패";
      for (const model of models) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
            }),
          }
        );
        const data = await res.json();
        if (res.ok && !data.error) {
          const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "{}")
            .replace(/```json|```/g, "")
            .trim();
          return NextResponse.json(JSON.parse(text));
        }
        lastError = data.error?.message || res.statusText;
      }
      return NextResponse.json({ error: `계산 실패: ${lastError}` }, { status: 500 });
    }

    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "서버 오류" }, { status: 500 });
  }
}