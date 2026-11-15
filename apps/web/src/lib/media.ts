export interface MediaStorageAdapter {
  validateImageUrl(url: string): string;
}

/**
 * MVP media adapter accepting curated local `/images/...` assets and external
 * HTTPS/HTTP URLs. Swap or extend with Vercel Blob / S3 presigned uploads later.
 */
export const mediaAdapter: MediaStorageAdapter = {
  validateImageUrl(url: string): string {
    const trimmed = url.trim();
    if (
      trimmed.startsWith("/images/") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("http://")
    ) {
      return trimmed;
    }
    throw new Error("Unsupported media URL. Use /images/... or an http(s) URL.");
  },
};
