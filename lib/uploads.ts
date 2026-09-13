const MAX_BYTES = 5 * 1024 * 1024;

const SIGNATURES: { type: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  {
    type: "image/png",
    ext: "png",
    test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  { type: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/webp",
    ext: "webp",
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

export type ValidImage = { bytes: ArrayBuffer; contentType: string; ext: string };

export async function validateImage(file: unknown): Promise<ValidImage | { error: string }> {
  if (!(file instanceof File)) return { error: "Файл не выбран" };
  if (file.size === 0) return { error: "Пустой файл" };
  if (file.size > MAX_BYTES) return { error: "Файл больше 5 МБ" };
  const bytes = await file.arrayBuffer();
  const head = new Uint8Array(bytes.slice(0, 12));
  const match = SIGNATURES.find((s) => s.test(head));
  if (!match) return { error: "Допустимы только PNG, JPG или WEBP" };
  return { bytes, contentType: match.type, ext: match.ext };
}

export function uploadKey(kind: string, ext: string) {
  return `public/${kind}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
}
