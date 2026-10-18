declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

/** Injected by Vite from package.json. */
declare const __APP_VERSION__: string;
