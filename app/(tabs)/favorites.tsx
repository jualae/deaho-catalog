import { useMemo } from "react";
import {
  Text,
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useCatalog } from "@/lib/catalog-context";
import { getImageUrl, parsePageId } from "@/lib/catalog-service";
import type { Category } from "@/lib/catalog-types";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (width - HORIZONTAL_PADDING * 2 - CARD_GAP) / COLUMN_COUNT;

interface FavoriteItem {
  pageId: string;
  categoryId: string;
  pageNum: number;
  category: Category;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { catalogData, favorites, toggleFavorite } = useCatalog();

  const favoriteItems = useMemo(() => {
    if (!catalogData) return [];
    const items: FavoriteItem[] = [];
    for (const pageId of favorites) {
      const { categoryId, pageNum } = parsePageId(pageId);
      const category = catalogData.categories.find((c: Category) => c.id === categoryId);
      if (category) {
        items.push({ pageId, categoryId, pageNum, category });
      }
    }
    return items;
  }, [catalogData, favorites]);

  const handlePress = (item: FavoriteItem) => {
    // Navigate to viewer at the specific page
    const pageIndex = item.category.pages.indexOf(item.pageNum);
    router.push({
      pathname: "/viewer",
      params: { categoryId: item.categoryId, startPage: pageIndex >= 0 ? pageIndex : 0 },
    } as any);
  };

  const renderItem = ({ item, index }: { item: FavoriteItem; index: number }) => {
    if (!catalogData) return null;
    const thumbUrl = getImageUrl(catalogData, item.pageNum);
    const pageIndex = item.category.pages.indexOf(item.pageNum);

    return (
      <View
        style={[
          styles.cardWrapper,
          { marginRight: index % COLUMN_COUNT === 0 ? CARD_GAP : 0 },
        ]}
      >
        <Pressable
          onPress={() => handlePress(item)}
          style={({ pressed }) => [
            styles.card,
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <View style={styles.thumbContainer}>
            <Image
              source={{ uri: thumbUrl }}
              style={styles.thumb}
              resizeMode="cover"
            />
            {/* Category color badge */}
            <View style={[styles.catBadge, { backgroundColor: item.category.color }]}>
              <Text style={styles.catBadgeText}>{item.category.name}</Text>
            </View>
            {/* Unfavorite button */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                toggleFavorite(item.pageId);
              }}
              style={({ pressed }) => [
                styles.favBtn,
                pressed && { opacity: 0.6 },
              ]}
              hitSlop={8}
            >
              <MaterialIcons name="favorite" size={20} color="#FF4081" />
            </Pressable>
          </View>
          <View style={styles.body}>
            <Text style={styles.pageLabel} numberOfLines={1}>
              {item.category.name} - {pageIndex + 1}페이지
            </Text>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <View style={styles.titleBar}>
        <Text style={styles.title}>즐겨찾기</Text>
        {favoriteItems.length > 0 && (
          <Text style={styles.count}>{favoriteItems.length}개</Text>
        )}
      </View>

      {favoriteItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="favorite-border" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>즐겨찾기가 없습니다</Text>
          <Text style={styles.emptySubtext}>
            카탈로그 뷰어에서 하트 아이콘을 눌러{"\n"}자주 보는 페이지를 추가하세요
          </Text>
        </View>
      ) : (
        <FlatList
          data={favoriteItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.pageId}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A237E",
  },
  count: {
    fontSize: 14,
    color: "#757575",
  },
  listContent: {
    paddingBottom: 40,
  },
  columnWrapper: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: CARD_GAP,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  thumbContainer: {
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: 140,
    backgroundColor: "#EEEEEE",
  },
  catBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  catBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#424242",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#D1D5DB",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 20,
  },
});
