export type CategoryId =
  | "all"
  | "cleanser"
  | "moisturizer"
  | "skincare"
  | "suncare"
  | "haircare"
  | "hair color"
  | "hair styling"
  | "makeup"
  | "men's grooming"
  | "fragrance";

export type LanguageCode = "en" | "ar";

export interface Product {
  id: number;
  brand: string;
  name: string;
  category: Exclude<CategoryId, "all">;
  image: string;
  description: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: GroundingSource[];
  searchFallback?: boolean;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  productIds: number[];
  updatedAt: string;
}
