import { useMemo } from "react";
import {
  Text,
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useCatalog } from "@/lib/catalog-context";
import { getImageUrl } from "@/lib/catalog-service";
import type { Category } from "@/lib/catalog-types";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (width - HORIZONTAL_PADDING * 2 - CARD_GAP) / COLUMN_COUNT;

export default function FavoritesScreen() {
  const router = useRouter();
  const { catalogData, favorites, toggleFavorite } = useCatalog();

  const favoriteCategories = useMemo(() => {
    if (!catalogData) return [];
    return catalogData.categories.filter((c: Category) =>
      favorites.includes(c.id)
    );
  }, [catalogData, favorites]);

  const handlePress = (category: Category) => {
    router.push({
      pathname: "/viewer",
      params: { categoryId: category.id },
    } as any);
  };

  const renderItem = ({ item, index }: { item: Category; index: number }) => {
    if (!catalogData) return null;
    const thumbUrl = getImageUrl(catalogData, item.pages[0]);

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
              contentFit="cover"
              transition={200}
            />
            <View style={[styles.numBadge, { backgroundColor: item.color }]}>
              <Text style={styles.numText}>{item.num}</Text>
            </View>
          </View>
          <View style={styles.body}>
            <View style={styles.header}>
              <View style={styles.nameContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.nameEn} numberOfLines={1}>
                  {item.name_en}
                </Text>
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  toggleFavorite(item.id);
                }}
                style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                hitSlop={8}
              >
                <MaterialIcons name="favorite" size={20} color="#EF4444" />
              </Pressable>
            </View>
            <Text style={styles.desc} numberOfLines={2}>
              {item.desc}
            </Text>
            <View style={styles.footer}>
              <View style={styles.pagesBadge}>
                <Text style={styles.pagesText}>{item.pages.length}페이지</Text>
              </View>
              <View style={[styles.viewBtn, { backgroundColor: item.color }]}>
                <Text style={styles.viewBtnText}>보기</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <View style={styles.titleBar}>
        <Text style={styles.title}>즐겨찾기</Text>
        {favoriteCategories.length > 0 && (
          <Text style={styles.count}>{favoriteCategories.length}개</Text>
        )}
      </View>

      {favoriteCategories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="favorite-border" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>즐겨찾기가 없습니다</Text>
          <Text style={styles.emptySubtext}>
            홈 화면에서 하트 아이콘을 눌러{"\n"}자주 보는 카테고리를 추가하세요
          </Text>
        </View>
      ) : (
        <FlatList
          data={favoriteCategories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
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
    height: 120,
    backgroundColor: "#EEEEEE",
  },
  numBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  numText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  body: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212121",
  },
  nameEn: {
    fontSize: 10,
    color: "#757575",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  desc: {
    fontSize: 11,
    color: "#757575",
    lineHeight: 16,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pagesBadge: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pagesText: {
    fontSize: 11,
    color: "#757575",
  },
  viewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  viewBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
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
