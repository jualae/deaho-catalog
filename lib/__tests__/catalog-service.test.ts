import { describe, it, expect } from "vitest";
import { searchCategories, getImageUrl } from "../catalog-service";
import type { CatalogData, Category } from "../catalog-types";

const mockCategories: Category[] = [
  {
    id: "iron",
    num: 1,
    name: "아이롱 / 매직기 / 고데기",
    name_en: "IRON / MAGIC / CURLER",
    icon: "🔥",
    color: "#C0392B",
    pages: [2, 3, 4, 5, 6, 7, 8],
    desc: "세라드 골드 아이롱 등 10가지 사이즈 헤어스타일링 제품",
  },
  {
    id: "brush",
    num: 2,
    name: "브러시",
    name_en: "BRUSH",
    icon: "🪮",
    color: "#8E44AD",
    pages: [9, 10, 11, 12, 13, 14, 15, 16],
    desc: "히트 롱 브러시, 엔틱 열판 브러시 등 다양한 헤어 브러시",
  },
  {
    id: "comb",
    num: 3,
    name: "빗",
    name_en: "COMB",
    icon: "⚡",
    color: "#2980B9",
    pages: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
    desc: "카본 빗 스타일, 컷트빗, 일제 커트빗 등 전문가용 빗",
  },
];

const mockCatalogData: CatalogData = {
  version: "1.0",
  title: "CERAD CATALOG",
  subtitle: "대호상사",
  totalPages: 54,
  imageBaseUrl: "https://drive.google.com/uc?export=view&id=",
  imageIds: {
    "2": "abc123",
    "9": "def456",
    "17": "ghi789",
  },
  categories: mockCategories,
};

describe("searchCategories", () => {
  it("returns all categories when query is empty", () => {
    const result = searchCategories(mockCategories, "");
    expect(result).toHaveLength(3);
  });

  it("filters by Korean name", () => {
    const result = searchCategories(mockCategories, "브러시");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("brush");
  });

  it("filters by English name", () => {
    const result = searchCategories(mockCategories, "IRON");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("iron");
  });

  it("filters by description", () => {
    const result = searchCategories(mockCategories, "카본");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("comb");
  });

  it("is case-insensitive", () => {
    const result = searchCategories(mockCategories, "brush");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("brush");
  });

  it("returns empty for no match", () => {
    const result = searchCategories(mockCategories, "xyz없는검색어");
    expect(result).toHaveLength(0);
  });
});

describe("getImageUrl", () => {
  it("returns correct Google Drive URL for valid page", () => {
    const url = getImageUrl(mockCatalogData, 2);
    expect(url).toBe("https://drive.google.com/uc?export=view&id=abc123");
  });

  it("returns empty string for invalid page", () => {
    const url = getImageUrl(mockCatalogData, 999);
    expect(url).toBe("");
  });
});
