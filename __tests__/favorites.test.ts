import { describe, it, expect } from "vitest";
import { makePageId, parsePageId } from "../lib/catalog-service";

describe("Page-level favorites", () => {
  describe("makePageId", () => {
    it("should create a page ID from categoryId and pageNum", () => {
      expect(makePageId("iron", 3)).toBe("iron_3");
      expect(makePageId("brush", 15)).toBe("brush_15");
      expect(makePageId("hair_dryer", 7)).toBe("hair_dryer_7");
    });
  });

  describe("parsePageId", () => {
    it("should parse a page ID back to categoryId and pageNum", () => {
      const result = parsePageId("iron_3");
      expect(result.categoryId).toBe("iron");
      expect(result.pageNum).toBe(3);
    });

    it("should handle category IDs with underscores", () => {
      const result = parsePageId("hair_dryer_7");
      expect(result.categoryId).toBe("hair_dryer");
      expect(result.pageNum).toBe(7);
    });

    it("should be inverse of makePageId", () => {
      const categoryId = "hair_dryer";
      const pageNum = 12;
      const pageId = makePageId(categoryId, pageNum);
      const parsed = parsePageId(pageId);
      expect(parsed.categoryId).toBe(categoryId);
      expect(parsed.pageNum).toBe(pageNum);
    });
  });

  describe("favorites array behavior", () => {
    it("should track individual pages, not categories", () => {
      const favorites: string[] = [];
      
      // Add page 3 of iron category
      favorites.push(makePageId("iron", 3));
      expect(favorites).toContain("iron_3");
      expect(favorites).not.toContain("iron_4");
      
      // Add page 4 of iron category
      favorites.push(makePageId("iron", 4));
      expect(favorites).toContain("iron_3");
      expect(favorites).toContain("iron_4");
      expect(favorites.length).toBe(2);
    });

    it("should allow favorites from different categories", () => {
      const favorites = [
        makePageId("iron", 3),
        makePageId("brush", 10),
        makePageId("scissors", 25),
      ];
      
      expect(favorites.length).toBe(3);
      expect(favorites.includes(makePageId("iron", 3))).toBe(true);
      expect(favorites.includes(makePageId("brush", 10))).toBe(true);
      expect(favorites.includes(makePageId("scissors", 25))).toBe(true);
      expect(favorites.includes(makePageId("iron", 10))).toBe(false);
    });

    it("should support toggle (add/remove) behavior", () => {
      const favorites: string[] = [];
      const pageId = makePageId("iron", 3);
      
      // Toggle on
      const idx1 = favorites.indexOf(pageId);
      if (idx1 >= 0) {
        favorites.splice(idx1, 1);
      } else {
        favorites.push(pageId);
      }
      expect(favorites).toContain(pageId);
      
      // Toggle off
      const idx2 = favorites.indexOf(pageId);
      if (idx2 >= 0) {
        favorites.splice(idx2, 1);
      } else {
        favorites.push(pageId);
      }
      expect(favorites).not.toContain(pageId);
    });
  });
});
