import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "react-native": path.resolve(__dirname, "__tests__/mocks/react-native.ts"),
      "@react-native-async-storage/async-storage": path.resolve(
        __dirname,
        "__tests__/mocks/async-storage.ts"
      ),
    },
  },
});
