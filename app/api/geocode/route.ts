import { NextResponse } from "next/server";

const REGION_CENTERS: Record<string, { lat: number; lng: number }> = {
  서울: { lat: 37.5665, lng: 126.978 },
  인천: { lat: 37.4563, lng: 126.7052 },
  경기: { lat: 37.4138, lng: 127.5183 },
  강원: { lat: 37.8228, lng: 128.1555 },
  충북: { lat: 36.6357, lng: 127.4914 },
  충남: { lat: 36.5184, lng: 126.8 },
  대전: { lat: 36.3504, lng: 127.3845 },
  세종: { lat: 36.4801, lng: 127.289 },
  전북: { lat: 35.7175, lng: 127.153 },
  전남: { lat: 34.8679, lng: 126.991 },
  광주: { lat: 35.1595, lng: 126.8526 },
  경북: { lat: 36.4919, lng: 128.8889 },
  대구: { lat: 35.8714, lng: 128.6014 },
  경남: { lat: 35.4606, lng: 128.2132 },
  부산: { lat: 35.1796, lng: 129.0756 },
  울산: { lat: 35.5384, lng: 129.3114 },
  제주: { lat: 33.4996, lng: 126.5312 },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query : "";
    const region = typeof body?.region === "string" ? body.region : "";

    if (query.trim()) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=kr&limit=1&q=${encodeURIComponent(
        query.trim()
      )}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "KD-TripPlanner/1.0" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return NextResponse.json({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        }
      }
    }

    const matchedKey = Object.keys(REGION_CENTERS).find(
      (k) => region.includes(k) || query.includes(k)
    );
    const base = matchedKey ? REGION_CENTERS[matchedKey] : REGION_CENTERS["서울"];
    const jitterLat = (Math.random() - 0.5) * 0.08;
    const jitterLng = (Math.random() - 0.5) * 0.08;

    return NextResponse.json({
      lat: base.lat + jitterLat,
      lng: base.lng + jitterLng,
    });
  } catch {
    return NextResponse.json({ lat: 37.5665, lng: 126.978 });
  }
}