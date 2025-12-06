export function modelPortrait(
  path: string,
  width: number = 120,
  height: number = 160
): string {
  // https://ik.imagekit.io/fliptopbox/lifedrawing/model/jodie-stone/jodie-stone-0287.jpg?updatedAt=1764862273193
  const folder = path.split("/").length > 1 ? path : `1024/${path}`;

  const pathname = `lifedrawing/model/${folder}`;
  const url = new URL(pathname, "https://ik.imagekit.io/fliptopbox/");
  url.searchParams.append("tr", `w-${width},h-${height},fo-face`);

  return url.toString();
}
