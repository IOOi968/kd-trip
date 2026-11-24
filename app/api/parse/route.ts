import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { rawText } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "서버에 GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const prompt = `오직 아래 [메모 텍스트]에 실제로 적혀 있는 내용만 추출해 JSON 객체 1개로 반환하세요.
절대 메모에 없는 내용을 추측하거나 지어내지 마세요. 메모에 없는 항목은 반드시 빈 문자열("")로 두세요.

JSON 키:
- name: 장소명 (메모에서 가장 핵심이 되는 상호명/장소명)
- region: 메모에 적힌 시/구 단위 지역명 (없으면 "")
- category: 메모 내용을 보고 ["식당", "카페", "관광지", "쇼핑", "숙소", "기타"] 중 1개 선택
- location: 메모에 적힌 도로명 주소 또는 지번 주소 (없으면 "")
- naverUrl: 메모에 적힌 네이버지도 URL (없으면 "")
- price: 메모에 적힌 가격 정보 (없으면 "")
- duration: 메모에 적힌 체류 시간 (없으면 "")
- features: 메모에 적힌 영업시간, 전화번호, 편의시설, 특징만 그대로 요약 (없으면 "")
- cautions: 메모에 적힌 브레이크타임, 휴무일, 주의사항만 요약 (없으면 "")
- instaUrl: 메모에 적힌 인스타그램 URL (없으면 "")

[메모 텍스트]
${rawText}`;

    const models = ["gemini-3.5-flash", "gemini-3.8-flash-lite", "gemini-3.8-flash-lite"];
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
              temperature: 0,
            },
          }),
        }
      );
      data = await res.json();
      if (res.ok && !data.error) break;
    }

    if (!res?.ok || data?.error) {
      return NextResponse.json(
        { error: `Gemini API 오류: ${data?.error?.message || "서버 응답 지연"}` },
        { status: 500 }
      );
    }

    const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = rawOutput.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const result = Array.isArray(parsed) ? parsed[0] : parsed;

    return NextResponse.json(result || {});
  } catch (err: any) {
    return NextResponse.json(
      { error: `텍스트 분석 오류: ${err?.message || "알 수 없는 오류"}` },
      { status: 500 }
    );
  }
}