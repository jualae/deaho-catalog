import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { CatalogData, Category } from "./catalog-types";

const CATALOG_CACHE_KEY = "@cerad_catalog_data";
const FAVORITES_KEY = "@cerad_favorites_v2"; // v2: page-level favorites

// S3 catalog.json URL (uploaded via storagePut)
const CATALOG_S3_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663337257885/g9FMjJFMH7rkmYiPvT29tr/cerad-catalog/catalog_v3.json";

function getApiBaseUrl(): string {
  if (Platform.OS === "web") {
    // Use same origin - web-server.mjs proxies /api/* to backend
    return window.location.origin;
  }
  return "http://localhost:3000";
}

/**
 * Generate a unique page ID for favorites.
 * Format: "categoryId_pageNumber"
 * e.g., "iron_3" means page 3 in the iron category
 */
export function makePageId(categoryId: string, pageNum: number): string {
  return `${categoryId}_${pageNum}`;
}

/**
 * Parse a page ID back into categoryId and pageNum.
 */
export function parsePageId(pageId: string): { categoryId: string; pageNum: number } {
  const lastUnderscore = pageId.lastIndexOf("_");
  const categoryId = pageId.substring(0, lastUnderscore);
  const pageNum = parseInt(pageId.substring(lastUnderscore + 1), 10);
  return { categoryId, pageNum };
}

export function getImageUrl(catalogData: CatalogData, pageNum: number): string {
  // Prefer S3 URLs (imageUrls) over Google Drive IDs (imageIds)
  if (catalogData.imageUrls) {
    const url = catalogData.imageUrls[String(pageNum)];
    if (url) return url;
  }

  // Fallback to Google Drive via server proxy
  const fileId = catalogData.imageIds[String(pageNum)];
  if (!fileId) return "";

  if (Platform.OS === "web") {
    return `${getApiBaseUrl()}/api/image-proxy/${fileId}`;
  }
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;
}

async function fetchFromS3(): Promise<CatalogData> {
  const response = await fetch(CATALOG_S3_URL + "?t=" + Date.now(), {
    method: "GET",
    headers: { Accept: "application/json", "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw new Error(`S3 error: ${response.status}`);
  return response.json();
}

async function fetchFromServer(): Promise<CatalogData> {
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${baseUrl}/api/trpc/catalog.getData`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const json = await response.json();
    return json.result?.data?.json ?? json.result?.data ?? json;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

export async function fetchCatalogData(): Promise<CatalogData> {
  try {
    let data: CatalogData;

    if (Platform.OS === "web") {
      // Web: use server API via proxy (avoids CORS issues with S3)
      try {
        data = await fetchFromServer();
      } catch {
        try {
          data = await fetchFromS3();
        } catch {
          throw new Error("All data sources failed");
        }
      }
    } else {
      // Native: try S3 first (faster, no CORS issues)
      try {
        data = await fetchFromS3();
      } catch {
        try {
          data = await fetchFromServer();
        } catch {
          throw new Error("All data sources failed");
        }
      }
    }

    // Cache the data
    await AsyncStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    // Try to load from cache
    const cached = await AsyncStorage.getItem(CATALOG_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    throw error;
  }
}

export async function getCachedCatalogData(): Promise<CatalogData | null> {
  try {
    const cached = await AsyncStorage.getItem(CATALOG_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get all favorite page IDs.
 * Each entry is a string like "categoryId_pageNumber".
 */
export async function getFavorites(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Toggle a page-level favorite.
 * @param pageId - Format: "categoryId_pageNumber"
 */
export async function toggleFavorite(pageId: string): Promise<string[]> {
  const favorites = await getFavorites();
  const index = favorites.indexOf(pageId);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(pageId);
  }
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return favorites;
}

export function searchCategories(
  categories: Category[],
  query: string
): Category[] {
  if (!query.trim()) return categories;
  const q = query.toLowerCase();
  return categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(q) ||
      cat.name_en.toLowerCase().includes(q) ||
      cat.desc.toLowerCase().includes(q)
  );
}
