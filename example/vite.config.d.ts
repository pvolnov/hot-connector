declare const _default: import("vite").UserConfig;
export default _default;

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
