import { Text, View, Pressable, StyleSheet, Image } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { Category, CatalogData } from "@/lib/catalog-types";
import { getImageUrl } from "@/lib/catalog-service";

interface CategoryCardProps {
  category: Category;
  catalogData: CatalogData;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export function CategoryCard({
  category,
  catalogData,
  isFavorite,
  onPress,
  onToggleFavorite,
}: CategoryCardProps) {
  const thumbPage = category.pages[0];
  const thumbUrl = getImageUrl(catalogData, thumbPage);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
      ]}
    >
      <View style={styles.thumbContainer}>
        {thumbUrl ? (
          <Image
            source={{ uri: thumbUrl }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <MaterialIcons name="image" size={32} color="#BDBDBD" />
          </View>
        )}
        <View style={[styles.numBadge, { backgroundColor: category.color }]}>
          <Text style={styles.numText}>{category.num}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {category.name}
            </Text>
            <Text style={styles.nameEn} numberOfLines={1}>
              {category.name_en}
            </Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFavorite();
            }}
            style={({ pressed }) => [
              styles.favBtn,
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}
          >
            <MaterialIcons
              name={isFavorite ? "favorite" : "favorite-border"}
              size={22}
              color={isFavorite ? "#EF4444" : "#9CA3AF"}
            />
          </Pressable>
        </View>
        <Text style={styles.desc} numberOfLines={2}>
          {category.desc}
        </Text>
        <View style={styles.footer}>
          <View style={styles.pagesBadge}>
            <Text style={styles.pagesText}>{category.pages.length}페이지</Text>
          </View>
          <View style={[styles.viewBtn, { backgroundColor: category.color }]}>
            <Text style={styles.viewBtnText}>보기</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
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
  favBtn: {
    padding: 2,
  },
});
