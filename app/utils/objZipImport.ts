import { BlobReader, ZipReader } from "@zip.js/zip.js";
import { LoadingManager } from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader.js";
import type { ModelInfo } from "../types/models";

export const OBJ_ZIP_LIMITS = {
  maxZipBytes: 64 * 1024 ** 2,
  maxEntries: 128,
  maxEntryBytes: 64 * 1024 ** 2,
  maxTotalBytes: 128 * 1024 ** 2,
};
export interface ImportedObjPackage {
  model: ModelInfo;
  /** Returns an isolated manager for each load; never persist it in Redux/storage. */
  createLoadingManager(): LoadingManager;
  /** Caller-owned: keep package URLs alive until rendering finishes. */
  dispose(): void;
}

export class ObjZipImportError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "ObjZipImportError";
  }
}
function fail(code: string, detail: string): never {
  throw new ObjZipImportError(code, detail);
}
function hasForbiddenCharacters(path: string): boolean {
  return /[\\:%?#]/.test(path) || Array.from(path).some((char) => {
    const code = char.charCodeAt(0);
    return code < 32 || (code >= 127 && code <= 159);
  });
}
const extension = (path: string) => path.slice(path.lastIndexOf(".")).toLowerCase();
const directory = (path: string) => path.slice(0, path.lastIndexOf("/") + 1);

/** Resolve virtual relative paths only. No URL decoding, schemes or network fallback. */
function relativePath(path: string): string {
  if (!path || path.startsWith("/") || hasForbiddenCharacters(path)) fail("RESOURCE_NOT_FOUND", `Unregistered resource: ${path}`);
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (part === ".") continue;
    if (part === "..") {
      if (!parts.length) fail("RESOURCE_NOT_FOUND", `Resource escapes package: ${path}`);
      parts.pop();
    } else if (!part) {
      fail("RESOURCE_NOT_FOUND", `Invalid resource: ${path}`);
    } else parts.push(part);
  }
  return parts.join("/");
}

/** One ZIP = one OBJ, optional single MTL and PNG/JPEG/TGA companions. No filesystem extraction. */
export async function importObjZip(blob: Blob, overrides: Partial<typeof OBJ_ZIP_LIMITS> = {}): Promise<ImportedObjPackage> {
  const limits = { ...OBJ_ZIP_LIMITS, ...overrides };
  for (const value of Object.values(limits)) {
    if (!Number.isSafeInteger(value) || value < 0) fail("INVALID_LIMIT", "Limits must be nonnegative safe integers");
  }
  if (blob.size > limits.maxZipBytes) fail("ZIP_LIMIT", "ZIP exceeds compressed byte limit");
  const reader = new ZipReader(new BlobReader(blob), {
    strictness: "strict", filenameValidation: "strict", checkCrc32: true,
    checkOverlappingEntry: true, useWebWorkers: false,
  });
  const urls = new Map<string, string>();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const url of urls.values()) URL.revokeObjectURL(url);
    urls.clear();
  };
  try {
    const entries = [];
    const paths = new Map<string, boolean>();
    let declaredTotal = 0;
    for await (const entry of reader.getEntriesGenerator()) {
      if (entries.length >= limits.maxEntries) fail("ENTRY_COUNT_LIMIT", "ZIP exceeds entry count limit");
      const path = entry.directory ? entry.filename.slice(0, -1) : entry.filename;
      if (!path || hasForbiddenCharacters(path) || entry.rawFilename.some((byte) => byte < 32 || byte === 127) || path !== path.normalize("NFC")) fail("UNSAFE_PATH", `Unsafe entry: ${entry.filename}`);
      const key = path.toLowerCase();
      if (paths.has(key)) fail("PATH_COLLISION", `Colliding entry: ${path}`);
      paths.set(key, entry.directory);
      const kind = (entry.unixMode ?? 0) & 0o170000;
      if (entry.encrypted || (kind !== 0 && kind !== (entry.directory ? 0o040000 : 0o100000)) ||
          (!entry.directory && ![".obj", ".mtl", ".png", ".jpg", ".jpeg", ".tga"].includes(extension(path))) ||
          ![0, 8].includes(entry.compressionMethod)) fail("UNSUPPORTED_ENTRY", `Unsupported entry: ${path}`);
      if (!Number.isSafeInteger(entry.uncompressedSize) || entry.uncompressedSize < 0 || entry.uncompressedSize > limits.maxEntryBytes) fail("ENTRY_LIMIT", `Entry exceeds expanded byte limit: ${path}`);
      declaredTotal += entry.uncompressedSize;
      if (declaredTotal > limits.maxTotalBytes) fail("TOTAL_LIMIT", "ZIP exceeds total expanded byte limit");
      entries.push(entry);
    }
    for (const path of paths.keys()) {
      const parts = path.split("/");
      parts.pop();
      while (parts.length) {
        if (paths.get(parts.join("/")) === false) fail("PATH_COLLISION", `File/directory collision: ${path}`);
        parts.pop();
      }
    }
    const files = entries.filter((entry) => !entry.directory);
    const objs = files.filter((entry) => extension(entry.filename) === ".obj");
    const mtls = files.filter((entry) => extension(entry.filename) === ".mtl");
    if (objs.length !== 1) fail("OBJ_COUNT", "ZIP must contain exactly one OBJ");
    if (mtls.length > 1) fail("MTL_COUNT", "ZIP may contain at most one MTL");
    const data = new Map<string, Blob>();
    let actualTotal = 0;
    // The sink checks actual bytes before retaining each chunk; progress checks also
    // bound expansion when central-directory sizes are dishonest.
    for (const entry of entries) {
      if (entry.directory) {
        if (entry.uncompressedSize !== 0) fail("UNSUPPORTED_ENTRY", "Directory entries must be empty");
        continue;
      }
      const chunks: Uint8Array[] = [];
      let actual = 0;
      const check = (bytes: number) => {
        if (bytes > limits.maxEntryBytes) fail("ENTRY_LIMIT", `Entry exceeds expanded byte limit: ${entry.filename}`);
        if (actualTotal + bytes > limits.maxTotalBytes) fail("TOTAL_LIMIT", "ZIP exceeds total expanded byte limit");
      };
      await entry.getData(new WritableStream<Uint8Array>({
        write(chunk) {
          check(actual + chunk.byteLength);
          actual += chunk.byteLength;
          chunks.push(new Uint8Array(chunk));
        },
      }), { onprogress: check });
      if (actual !== entry.uncompressedSize) fail("INVALID_ZIP", `Expanded size mismatch: ${entry.filename}`);
      actualTotal += actual;
      if (!entry.directory) data.set(entry.filename, new Blob(chunks));
    }
    const requireResource = (base: string, reference: string, ext: string[]) => {
      // Validate reference separately so absolute paths cannot be hidden by a base.
      if (!reference || reference.startsWith("/") || hasForbiddenCharacters(reference)) fail("RESOURCE_NOT_FOUND", `Invalid resource: ${reference}`);
      const path = relativePath(base + reference);
      if (!data.has(path) || !ext.includes(extension(path))) fail("RESOURCE_NOT_FOUND", `Missing companion: ${reference}`);
      return path;
    };
    const objPath = objs[0].filename;
    let mtlPath: string | null = null;
    const objText = await data.get(objPath)!.text();
    for (const line of objText.split(/\r?\n/)) {
      const match = /^\s*mtllib\s+(.+?)\s*$/.exec(line);
      if (match) {
        const path = requireResource(directory(objPath), match[1], [".mtl"]);
        if (mtlPath && path !== mtlPath) fail("MTL_COUNT", "OBJ may reference only one MTL");
        mtlPath = path;
      }
    }
    if (!mtlPath && /^\s*usemtl\s+/m.test(objText)) fail("RESOURCE_NOT_FOUND", "OBJ uses materials without a library");
    // A sole companion is supported even when exporters omit mtllib.
    mtlPath ??= mtls[0]?.filename ?? null;
    if (mtlPath) {
      const text = await data.get(mtlPath)!.text();
      const materials = new MTLLoader(new LoadingManager()).parse(text, directory(mtlPath));
      for (const info of Object.values(materials.materialsInfo)) {
        for (const [key, value] of Object.entries(info)) {
          if (/^(map_|bump$|norm$|disp$|decal$|refl$)/i.test(key)) {
            if (typeof value !== "string") fail("RESOURCE_NOT_FOUND", "Invalid texture reference");
            const params = materials.getTextureParams(value, {});
            requireResource(directory(mtlPath), params.url, [".png", ".jpg", ".jpeg", ".tga"]);
          }
        }
      }
    }
    for (const [path, content] of data) {
      if (extension(path) !== ".tga") continue;
      try {
        const buffer = await content.arrayBuffer();
        if (buffer.byteLength < 19) fail("INVALID_TEXTURE", `Invalid TGA texture: ${path}`);
        const header = new DataView(buffer);
        const bytes = new Uint8Array(buffer);
        const width = header.getUint16(12, true);
        const height = header.getUint16(14, true);
        const imageType = header.getUint8(2);
        const pixelDepth = header.getUint8(16);
        const pixelBytes = pixelDepth / 8;
        const indexed = imageType === 1 || imageType === 9;
        const greyscale = imageType === 3 || imageType === 11;
        const rle = imageType === 9 || imageType === 10 || imageType === 11;
        const pixelCount = width * height;
        if (!width || !height || pixelCount > 16 * 1024 * 1024) {
          fail("TEXTURE_LIMIT", `TGA dimensions exceed supported limits: ${path}`);
        }
        if (![1, 2, 3, 9, 10, 11].includes(imageType) || ![8, 16, 24, 32].includes(pixelDepth)) {
          fail("INVALID_TEXTURE", `Unsupported TGA format: ${path}`);
        }
        const paletteLength = header.getUint16(5, true);
        if ((indexed && (header.getUint8(1) !== 1 || !paletteLength || paletteLength > 256 || header.getUint8(7) !== 24 ||
              header.getUint16(3, true) !== 0 || pixelDepth !== 8)) ||
            (!indexed && header.getUint8(1) !== 0) ||
            (greyscale && ![8, 16].includes(pixelDepth)) ||
            (!indexed && !greyscale && ![16, 24, 32].includes(pixelDepth))) {
          fail("INVALID_TEXTURE", `Invalid TGA header: ${path}`);
        }
        let dataOffset = 18 + header.getUint8(0);
        if (indexed) {
          dataOffset += header.getUint16(5, true) * (header.getUint8(7) / 8);
        }
        if (dataOffset > bytes.length) fail("INVALID_TEXTURE", `Truncated TGA header: ${path}`);
        if (rle) {
          let remainingPixels = pixelCount;
          while (remainingPixels > 0) {
            if (dataOffset >= bytes.length) fail("INVALID_TEXTURE", `Truncated TGA pixels: ${path}`);
            const packet = bytes[dataOffset++];
            const count = (packet & 0x7f) + 1;
            if (count > remainingPixels) fail("INVALID_TEXTURE", `Invalid TGA packet: ${path}`);
            const runPacket = (packet & 0x80) !== 0;
            const packetBytes = runPacket ? pixelBytes : count * pixelBytes;
            if (dataOffset + packetBytes > bytes.length) fail("INVALID_TEXTURE", `Truncated TGA pixels: ${path}`);
            if (indexed) {
              const start = dataOffset;
              const end = runPacket ? start + 1 : start + count;
              for (let index = start; index < end; index++) {
                if (bytes[index] >= paletteLength) fail("INVALID_TEXTURE", `TGA palette index is out of range: ${path}`);
              }
            }
            dataOffset += packetBytes;
            remainingPixels -= count;
          }
        } else {
          const pixelEnd = dataOffset + pixelCount * pixelBytes;
          if (pixelEnd > bytes.length) fail("INVALID_TEXTURE", `Truncated TGA pixels: ${path}`);
          if (indexed) {
            for (let index = dataOffset; index < pixelEnd; index++) {
              if (bytes[index] >= paletteLength) fail("INVALID_TEXTURE", `TGA palette index is out of range: ${path}`);
            }
          }
        }
        const parsed: unknown = new TGALoader().parse(buffer);
        if (!parsed || typeof parsed !== "object" || !("data" in parsed) || !("width" in parsed) || !("height" in parsed)) {
          fail("INVALID_TEXTURE", `Invalid TGA texture: ${path}`);
        }
        const { data, width: parsedWidth, height: parsedHeight } = parsed;
        if (!(data instanceof Uint8Array) || data.byteLength !== width * height * 4 || parsedWidth !== width || parsedHeight !== height) {
          fail("INVALID_TEXTURE", `Invalid TGA texture: ${path}`);
        }
      } catch (error) {
        if (error instanceof ObjZipImportError) throw error;
        fail("INVALID_TEXTURE", `Invalid TGA texture: ${path}`);
      }
    }
    // Allocate only after all archive and companion checks succeeded.
    for (const [path, content] of data) {
      const mime = ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" } as Record<string, string>)[extension(path)] ?? "application/octet-stream";
      urls.set(path, URL.createObjectURL(content.slice(0, content.size, mime)));
    }
    const createLoadingManager = () => {
      const manager = new LoadingManager();
      manager.addHandler(/\.tga$/i, new TGALoader(manager));
      manager.setURLModifier((url) => {
        if (disposed) fail("DISPOSED", "Imported package has been disposed");
        const resolved = urls.get(relativePath(url));
        if (!resolved) fail("RESOURCE_NOT_FOUND", `Unregistered resource: ${url}`);
        return resolved;
      });
      return manager;
    };
    return { model: { name: objPath.split("/").pop()!, objPath, mtlPath }, createLoadingManager, dispose };
  } catch (error) {
    dispose();
    if (error instanceof ObjZipImportError) throw error;
    throw new ObjZipImportError("INVALID_ZIP", error instanceof Error ? error.message : "Invalid ZIP");
  } finally {
    await reader.close();
  }
}
