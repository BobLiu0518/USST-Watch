import { Buffer } from 'node:buffer';

export function renameKey<T extends object>(
    arr: T[],
    map: Record<string, string>
): T[] {
    return arr.map(
        (obj) =>
            Object.fromEntries(
                Object.entries(obj).map(([key, value]) => [
                    map[key] ?? key,
                    value,
                ])
            ) as T
    );
}

export function base64Decode(str: string): string {
    return Buffer.from(str, 'base64').toString();
}
