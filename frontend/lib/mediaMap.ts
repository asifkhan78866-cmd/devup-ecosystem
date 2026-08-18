import mapping from "./supabase_mapping.json";

export function getMediaUrl(relPath: string): string {
  // Normalize leading slash
  const key = relPath.startsWith("/") ? relPath.slice(1) : relPath;
  return (mapping as Record<string, string>)[key] || relPath;
}

export default mapping as Record<string, string>;
