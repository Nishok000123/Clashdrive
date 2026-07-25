import JSZip from "jszip";
import { generateImageThumbnail } from "./uploader";

/**
 * Fast ZIP archive loader using slicing and checkCRC32: false.
 * Prevents CPU starvation and memory spikes during upload.
 */
async function loadZipFast(file: File | Blob): Promise<JSZip> {
  const checkCRC32 = false;
  // If file > 16MB, slice first 16MB for fast icon indexing
  const targetBlob = file.size > 16 * 1024 * 1024 ? file.slice(0, 16 * 1024 * 1024) : file;
  try {
    return await JSZip.loadAsync(targetBlob, { checkCRC32 });
  } catch (err) {
    // If slice failed (e.g. zip central dir at end of file), fall back to full file without CRC32
    return await JSZip.loadAsync(file, { checkCRC32 });
  }
}

/**
 * Ultra-fast, accurate APK/APKS/XAPK/APKM thumbnail generator.
 * Prioritizes complete composite icons (ic_launcher.png, ic_launcher_round.png)
 * over partial foreground cutouts (ic_launcher_foreground.png).
 */
export async function generateApkThumbnail(file: File | Blob): Promise<Blob> {
  let zip = await loadZipFast(file);

  // 1. Check if this is an XAPK / APKS package containing a root icon.png
  if (zip.files["icon.png"] && !zip.files["icon.png"].dir) {
    try {
      const iconBlob = await zip.files["icon.png"].async("blob");
      return await generateImageThumbnail(iconBlob);
    } catch (e) {
      // Fall through to ZIP searching
    }
  }

  // 2. Check if there is an embedded base.apk inside APKS / XAPK
  const baseApkEntry = Object.keys(zip.files).find(
    (fn) => !zip.files[fn].dir && /(?:base|app)\.apk$/i.test(fn)
  );
  if (baseApkEntry) {
    try {
      const baseApkBuffer = await zip.files[baseApkEntry].async("arraybuffer");
      zip = await JSZip.loadAsync(baseApkBuffer, { checkCRC32: false });
    } catch (e) {
      // Fall through with outer zip
    }
  }

  const fileKeys = Object.keys(zip.files).filter((fn) => !zip.files[fn].dir);
  const isImageFile = (fn: string) =>
    /\.(png|webp|jpg|jpeg)$/i.test(fn) && !fn.endsWith(".9.png");

  const candidates: string[] = [];

  // TIER 1: Full composite launcher icons (ic_launcher.png, ic_launcher_round.png, app_icon.png)
  // EXCLUDES _foreground and _background cutouts
  const fullIconPatterns = [
    /res\/mipmap-xxxhdpi[^\/]*\/(?:ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
    /res\/mipmap-xxhdpi[^\/]*\/(?:ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
    /res\/mipmap-xhdpi[^\/]*\/(?:ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
    /res\/mipmap-hdpi[^\/]*\/(?:ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
    /res\/drawable-xxhdpi[^\/]*\/(?:ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
    /res\/drawable-xhdpi[^\/]*\/(?:ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
    /res\/mipmap[^\/]*\/(?:ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
    /res\/drawable[^\/]*\/(?:ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
    /(?:ic_launcher|app_icon)\.(png|webp)$/i,
  ];

  for (const pattern of fullIconPatterns) {
    const found = fileKeys.filter(
      (fn) =>
        isImageFile(fn) &&
        !/_foreground|_background/i.test(fn) &&
        pattern.test(fn)
    );
    candidates.push(...found);
  }

  // TIER 2: Other app icons/logos in mipmap or drawable
  const secondary = fileKeys.filter(
    (fn) =>
      isImageFile(fn) &&
      !candidates.includes(fn) &&
      !/_foreground|_background/i.test(fn) &&
      /res\/(?:mipmap|drawable)[^\/]*\/.*(?:launcher|icon|logo|avatar).*\.(png|webp)$/i.test(fn)
  );
  candidates.push(...secondary);

  // TIER 3: Foreground cutouts (only if no composite icon was found)
  const foregroundOnly = fileKeys.filter(
    (fn) =>
      isImageFile(fn) &&
      !candidates.includes(fn) &&
      /res\/(?:mipmap|drawable)[^\/]*\/.*ic_launcher_foreground.*\.(png|webp)$/i.test(fn)
  );
  candidates.push(...foregroundOnly);

  // TIER 4: Generic res/ images
  const genericRes = fileKeys.filter(
    (fn) => isImageFile(fn) && !candidates.includes(fn) && /^res\//i.test(fn)
  );
  candidates.push(...genericRes);

  // Try candidate files until one successfully loads as a valid image
  for (const key of candidates) {
    try {
      const iconBlob = await zip.files[key].async("blob");
      return await generateImageThumbnail(iconBlob);
    } catch (err) {
      // Continue to next candidate if image load/resize fails
    }
  }

  throw new Error("No valid APK icon image found in package");
}

/**
 * Helper to extract embedded thumbnail/image from DOCX files.
 */
export async function generateDocxThumbnail(file: File | Blob): Promise<Blob> {
  const zip = await loadZipFast(file);

  let thumbEntry = zip.files["docProps/thumbnail.jpeg"] || zip.files["docProps/thumbnail.png"];

  if (!thumbEntry) {
    const mediaFile = Object.keys(zip.files).find(
      (fn) => !zip.files[fn].dir && /^word\/media\/image1\.(png|jpeg|jpg|webp)$/i.test(fn)
    );
    if (mediaFile) {
      thumbEntry = zip.files[mediaFile];
    }
  }

  if (!thumbEntry) {
    throw new Error("No embedded thumbnail or image found in DOCX");
  }

  const imgBlob = await thumbEntry.async("blob");
  return generateImageThumbnail(imgBlob);
}

/**
 * Helper to extract embedded thumbnail/image from XLSX files.
 */
export async function generateXlsxThumbnail(file: File | Blob): Promise<Blob> {
  const zip = await loadZipFast(file);

  let thumbEntry = zip.files["docProps/thumbnail.jpeg"] || zip.files["docProps/thumbnail.png"];

  if (!thumbEntry) {
    const mediaFile = Object.keys(zip.files).find(
      (fn) => !zip.files[fn].dir && /^xl\/media\/image1\.(png|jpeg|jpg|webp)$/i.test(fn)
    );
    if (mediaFile) {
      thumbEntry = zip.files[mediaFile];
    }
  }

  if (!thumbEntry) {
    throw new Error("No embedded thumbnail or image found in XLSX");
  }

  const imgBlob = await thumbEntry.async("blob");
  return generateImageThumbnail(imgBlob);
}

/**
 * Helper to extract embedded album artwork from audio files (MP3, M4A, FLAC, etc.).
 */
export async function generateAudioThumbnail(file: File | Blob): Promise<Blob> {
  const bufferSize = Math.min(file.size, 256 * 1024);
  const slice = file.slice(0, bufferSize);
  const arrayBuffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // 1. Try ID3v2 APIC frame parsing (MP3 / FLAC)
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const majorVersion = bytes[3];
    const tagSize =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f);

    let offset = 10;
    const maxOffset = Math.min(bytes.length, tagSize + 10);

    while (offset < maxOffset - 10) {
      const frameId = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3]
      );

      let frameSize = 0;
      if (majorVersion === 4) {
        frameSize =
          ((bytes[offset + 4] & 0x7f) << 21) |
          ((bytes[offset + 5] & 0x7f) << 14) |
          ((bytes[offset + 6] & 0x7f) << 7) |
          (bytes[offset + 7] & 0x7f);
      } else {
        frameSize =
          (bytes[offset + 4] << 24) |
          (bytes[offset + 5] << 16) |
          (bytes[offset + 6] << 8) |
          bytes[offset + 7];
      }

      if (frameSize <= 0 || offset + 10 + frameSize > bytes.length) break;

      if (frameId === "APIC" || frameId === "PIC") {
        let contentOffset = offset + 10;
        const encoding = bytes[contentOffset];
        contentOffset++;

        let mimeType = "image/jpeg";
        if (frameId === "APIC") {
          let mimeEnd = contentOffset;
          while (mimeEnd < contentOffset + 32 && bytes[mimeEnd] !== 0) mimeEnd++;
          mimeType = String.fromCharCode(...bytes.subarray(contentOffset, mimeEnd)) || "image/jpeg";
          contentOffset = mimeEnd + 1;
        } else {
          contentOffset += 3;
        }

        contentOffset++;

        if (encoding === 0 || encoding === 3) {
          while (contentOffset < offset + 10 + frameSize && bytes[contentOffset] !== 0) {
            contentOffset++;
          }
          contentOffset++;
        } else {
          while (
            contentOffset < offset + 10 + frameSize - 1 &&
            !(bytes[contentOffset] === 0 && bytes[contentOffset + 1] === 0)
          ) {
            contentOffset += 2;
          }
          contentOffset += 2;
        }

        const imgData = bytes.subarray(contentOffset, offset + 10 + frameSize);
        if (imgData.length > 0) {
          try {
            const rawBlob = new Blob([imgData], { type: mimeType });
            return await generateImageThumbnail(rawBlob);
          } catch (e) {
            // Continue if APIC blob parsing fails
          }
        }
      }

      offset += 10 + frameSize;
    }
  }

  // 2. Try M4A / MP4 'covr' atom search (find JPEG 0xFFD8 or PNG 0x89504E47 header)
  for (let i = 0; i < bytes.length - 8; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
      for (let j = i + 4; j < Math.min(bytes.length - 1, i + 500000); j++) {
        if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
          const imgData = bytes.subarray(i, j + 2);
          try {
            const rawBlob = new Blob([imgData], { type: "image/jpeg" });
            return await generateImageThumbnail(rawBlob);
          } catch (e) {
            break;
          }
        }
      }
    }
    if (
      bytes[i] === 0x89 &&
      bytes[i + 1] === 0x50 &&
      bytes[i + 2] === 0x4e &&
      bytes[i + 3] === 0x47
    ) {
      for (let j = i + 8; j < Math.min(bytes.length - 8, i + 500000); j++) {
        if (
          bytes[j] === 0x49 &&
          bytes[j + 1] === 0x45 &&
          bytes[j + 2] === 0x4e &&
          bytes[j + 3] === 0x44
        ) {
          const imgData = bytes.subarray(i, j + 8);
          try {
            const rawBlob = new Blob([imgData], { type: "image/png" });
            return await generateImageThumbnail(rawBlob);
          } catch (e) {
            break;
          }
        }
      }
    }
  }

  throw new Error("No album cover art found in audio metadata");
}

let pdfjsPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib) {
    return Promise.resolve((window as any).pdfjsLib);
  }
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjsLib);
      } else {
        reject(new Error("PDF.js failed to initialize"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js from CDN"));
    document.head.appendChild(script);
  });

  return pdfjsPromise;
}

/**
 * Helper to render PDF Page 1 as a thumbnail blob.
 */
export async function generatePdfThumbnail(file: File | Blob): Promise<Blob> {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 0.8 });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get 2D context for PDF thumbnail canvas");
  }

  await page.render({ canvasContext: ctx, viewport }).promise;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        generateImageThumbnail(blob).then(resolve).catch(reject);
      } else {
        reject(new Error("Failed to generate blob from PDF canvas"));
      }
    }, "image/jpeg", 0.85);
  });
}
