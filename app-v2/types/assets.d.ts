// 静态资源模块声明（expo/types 未内置，手动补充）
declare module "*.jpg" {
  const asset: number;
  export default asset;
}
declare module "*.jpeg" {
  const asset: number;
  export default asset;
}
declare module "*.png" {
  const asset: number;
  export default asset;
}
declare module "*.webp" {
  const asset: number;
  export default asset;
}
declare module "*.gif" {
  const asset: number;
  export default asset;
}
