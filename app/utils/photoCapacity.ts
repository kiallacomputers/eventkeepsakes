/** Display-only estimates. Does not alter actual storage quotas or billing.
 * Adjust this assumption to change the estimates across the app.
 */
export const photoEstimateSizeMb = 5

export function estimatePhotoCount(storageLimitBytes: number): number {
  if (!Number.isFinite(storageLimitBytes) || storageLimitBytes <= 0) return 0
  return Math.floor(storageLimitBytes / (photoEstimateSizeMb * 1024 * 1024))
}
