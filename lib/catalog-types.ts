export interface Category {
  id: string;
  num: number;
  name: string;
  name_en: string;
  icon: string;
  color: string;
  pages: number[];
  desc: string;
}

export interface CatalogData {
  version: string;
  title: string;
  subtitle: string;
  totalPages: number;
  imageBaseUrl: string;
  imageIds: Record<string, string>;
  imageUrls?: Record<string, string>;
  categories: Category[];
}
