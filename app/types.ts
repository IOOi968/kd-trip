export type Category = "놀거리" | "숙소" | "맛집" | "쇼핑";

export interface Place {
  id: number;
  author: "관우" | "다영";
  region: string;
  category: Category;
  name: string;
  price: string;
  duration: string;
  location: string;
  features: string;
  cautions: string;
  naverUrl: string;
  instaUrl: string;
  selected: boolean;
  lat?: number | null;
  lng?: number | null;
  pinColor?: string;
  visited?: boolean;
  review?: string;
}

export interface SavedTrip {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  routeText: string;
  createdAt: string;
}