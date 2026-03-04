import { Text, View, Pressable, StyleSheet, Image } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import type { Category, CatalogData } from "@/lib/catalog-types";
import { getImageUrl } from "@/lib/catalog-service";

interface CategoryCardProps {
  category: Category;
  catalogData: CatalogData;
  onPress: () => void;
}

export function CategoryCard({
  category,
  catalogData,
  onPress,
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
      </View>

      {/* Category Name - Large & Bold with gradient edges */}
      <LinearGradient
        colors={[
          "transparent",
          category.color,
          category.color,
          category.color,
          "transparent",
        ]}
        locations={[0, 0.15, 0.5, 0.85, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.nameBar}
      >
        <View style={styles.numBadge}>
          <Text style={styles.numText}>{category.num}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {category.name}
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.nameEn} numberOfLines={1}>
          {category.name_en}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {category.desc}
        </Text>
        <View style={styles.footer}>
          <View style={styles.pagesBadge}>
            <MaterialIcons name="photo-library" size={12} color="#757575" />
            <Text style={styles.pagesText}>{category.pages.length}페이지</Text>
          </View>
          <View style={[styles.viewBtn, { backgroundColor: category.color }]}>
            <Text style={styles.viewBtnText}>보기</Text>
            <MaterialIcons name="chevron-right" size={14} color="#FFFFFF" />
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

  nameBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  numBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  numText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  body: {
    padding: 12,
    paddingTop: 8,
  },
  nameEn: {
    fontSize: 11,
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  desc: {
    fontSize: 12,
    color: "#757575",
    lineHeight: 17,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pagesBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pagesText: {
    fontSize: 11,
    color: "#757575",
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  viewBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
