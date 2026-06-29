export function encode(parts: string[]): string {
  return parts.join(':');
}

export function decode(customId: string): string[] {
  return customId.split(':');
}
