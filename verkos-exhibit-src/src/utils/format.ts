export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function getDisplayId(id: string, prefix = 'VRK'): string {
  const match = id.match(/(\d+)$/);
  if (!match) return id.toUpperCase();
  return `${prefix}-${match[1].padStart(3, '0')}`;
}
