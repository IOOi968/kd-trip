import { Category, Place } from "../types";

export function parseMemoToPlaces(rawMemo: string, author: "관우" | "다영"): Place[] {
  const blocks = rawMemo.trim().split(/\n\s*\n/).filter((b) => b.trim());

  return blocks.map((block, idx) => {
    const lines = block.split(/\n+/).map((l) => l.trim()).filter(Boolean);

    let instaUrl = "";
    let naverUrl = "";
    const urls = block.match(/https?:\/\/[^\s]+/g) || [];
    urls.forEach((u) => {
      if (u.includes("instagram.com") || u.includes("instagr.am")) instaUrl = u;
      else naverUrl = u;
    });

    const cleanLines = lines
      .map((l) => l.replace(/https?:\/\/[^\s]+/g, "").trim())
      .filter(Boolean);

    let category: Category = "맛집";
    if (/호텔|펜션|숙소|에어비앤비|리조트|풀빌라/.test(block)) category = "숙소";
    else if (/맛집|카페|식당|브런치|고기|회|커피|빵|디저트/.test(block)) category = "맛집";
    else if (/소품샵|백화점|아울렛|쇼핑|시장|팝업/.test(block)) category = "쇼핑";
    else if (/박물관|전시|산책|공원|해수욕장|체험|놀거리/.test(block)) category = "놀거리";

    const reg = block.match(/(서울|성수|홍대|연남|을지로|제주|애월|서귀포|부산|해운대|광안리|강릉|속초|양양|경주|여수|전주|인천|가평|춘천|대구|도쿄|오사카|후쿠오카)/);
    const prc = block.match(/([0-9,.]+\s*(만원|원)|무료)/);
    const dur = block.match(/([0-9.]+\s*시간(\s*[0-9]+\s*분)?|[0-9]+\s*분)/);
    const loc = cleanLines.find((l) => /(역|출구|번지|근처|도보|시\s|구\s|동\s|로\s|길\s)/.test(l));
    const cau = cleanLines.find((l) => /(주의|예약|웨이팅|휴무|필수|마감|브레이크|주차)/.test(l));

    const name = cleanLines[0] ? cleanLines[0].slice(0, 40) : "이름 없는 장소";
    const features = cleanLines.filter((l) => l !== name && l !== loc && l !== cau).join(" / ");

    return {
      id: Date.now() + idx,
      author,
      region: reg ? reg[0] : "미지정",
      category,
      name,
      price: prc ? prc[0] : "",
      duration: dur ? dur[0] : "",
      location: loc || "",
      features,
      cautions: cau || "",
      naverUrl,
      instaUrl,
      selected: true,
    };
  });
}