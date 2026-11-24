import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { transport, places } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: "API 키가 없습니다." }, { status: 500 });

    const isCar = transport.includes("자차");

    const placeDetails = places
      .map(
        (p: any, i: number) =>
          `${i + 1}. [${p.category}] ${p.name} | 위치: ${p.location || p.naverUrl || "미기재"} | 메모: ${p.features || ""} ${p.cautions || ""}`
      )
      .join("\n");

    const prompt = `당신은 한국의 로컬 동선 및 물류 최적화 플래너입니다.
사용자가 선택한 장소들을 **동선이 꼬이지 않고 이동 시간이 가장 짧고 깔끔한 최적 순서**로 재배열한 뒤 아래 JSON 형식으로만 반환하세요.

- 주 이동수단: ${transport}
- 선택한 장소 목록:
${placeDetails}

[작성 규칙]
1. 모든 이동 시간은 반드시 선택한 주 이동수단(${transport}) 기준으로 계산하세요.
2. ${
      isCar
        ? "주 이동수단이 '자차'이므로, 각 장소별로 가장 저렴하고 안 붐비는 근처 추천 주차장 이름과 주차 요금을 반드시 정확히 기입하세요."
        : `주 이동수단이 '${transport}'이므로 주차장 정보는 필요하지 않습니다. parkingName과 parkingFee는 빈 문자열("")로 두세요.`
    }

반드시 아래 JSON 구조를 정확히 지키세요:
{
  "summary": "전체 동선 요약 한 줄 (${transport} 기준 총 이동시간 및 최적 순서)",
  "steps": [
    {
      "order": 1,
      "name": "장소명",
      "category": "카테고리",
      "address": "도로명 또는 지번 주소",
      "moveFromPrev": "이전 장소에서의 ${transport} 이동 소요시간 (첫 번째 장소는 '출발지 (첫 번째 코스)')",
      "bestTime": "가장 안 붐비고 쾌적한 추천 방문 시간대",
      "hoursAndBreak": "운영 시간, 정기 휴무일, 브레이크타임 정보",
      "parkingName": "${isCar ? "가장 저렴하고 여유로운 근처 추천 주차장 이름" : ""}",
      "parkingFee": "${isCar ? "주차 요금 및 무료 지원 팁" : ""}"
    }
  ]
}`;

    const models = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.8-flash-lite"];
    let data: any = null;
    let res: Response | null = null;

    for (const model of models) {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        }
      );
      data = await res.json();
      if (res.ok && !data.error) break;
    }

    if (!res?.ok || data?.error) {
      return NextResponse.json(
        { error: `Gemini API 오류: ${data?.error?.message || "일정 생성 실패"}` },
        { status: 500 }
      );
    }

    const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = rawOutput.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ plan: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "오류 발생" }, { status: 500 });
  }
}