import { createApp } from "vue";
import App from "./App.vue";
import { pinia } from "./store/index.ts";
import { applyTheme, initialTheme } from "./store/theme.ts";
import "./style.css";

// Before the first paint, so there is no flash of the wrong theme.
applyTheme(initialTheme());

createApp(App).use(pinia).mount("#app");
