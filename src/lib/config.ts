export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/emailhr";

export function getAssetUrl(path: string): string {
  if (path.startsWith("data:") || path.startsWith("http://") || path.startsWith("https://") || path.startsWith("cid:")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${cleanPath}`;
}
