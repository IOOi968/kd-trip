import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }
    if (!imageBase64) {
      return NextResponse.json({ error: "이미지 데이터가 없습니다." }, { status: 400 });
    }

    const prompt = `전기기사 시험 단답형 문제 스크린샷입니다. 이미지 속 글자를 정확히 읽어서 아래 JSON 형식으로만 반환하세요.
- question: 문제 본문 텍스트 (보기나 조건 포함, 줄바꿈 유지)
- answer: 이미지에 정답이나 해설이 함께 적혀 있다면 정답 텍스트만 추출, 이미지에 정답이 안 보이면 빈 문자열("")

JSON 키: question, answer`;

    const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
    let lastError = "AI 분석 지연";

    for (const model of models) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } },
                ],
              },
            ],
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

    return NextResponse.json({ error: `AI 글자 추출 실패: ${lastError}` }, { status: 500 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
