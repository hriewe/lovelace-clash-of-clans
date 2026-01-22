import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "src/clash-of-clans-card.ts",
  output: {
    file: "dist/clash-of-clans-card.js",
    format: "es",
    sourcemap: false,
  },
  plugins: [
    nodeResolve({
      browser: true,
    }),
    typescript({
      tsconfig: "./tsconfig.json",
    }),
  ],
};
