import JSZip from "jszip";
import { generateImageThumbnail } from "./uploader";

/**
 * Fast ZIP archive loader using slicing and checkCRC32: false.
 */
async function loadZipFast(file: File | Blob): Promise<JSZip> {
  const checkCRC32 = false;
  const targetBlob = file.size > 24 * 1024 * 1024 ? file.slice(0, 24 * 1024 * 1024) : file;
  try {
    const zip = await JSZip.loadAsync(targetBlob, { checkCRC32 });
    if (Object.keys(zip.files).length > 0) return zip;
    throw new Error("Empty zip slice");
  } catch (err) {
    return await JSZip.loadAsync(file, { checkCRC32 });
  }
}

/**
 * Ranks icon path candidates so custom app logos (logo.png, app_logo.png, ic_logo.png)
 * take top priority over default generic Android Studio template icons (ic_launcher.png).
 */
function rankIconPaths(paths: string[]): string[] {
  return [...paths].sort((a, b) => {
    const getScore = (path: string) => {
      const name = path.split("/").pop()?.toLowerCase() ?? "";
      let score = 0;

      if (path.includes("xxxhdpi")) score += 40;
      else if (path.includes("xxhdpi")) score += 30;
      else if (path.includes("xhdpi")) score += 20;
      else if (path.includes("hdpi")) score += 10;

      if (/logo|app_logo|ic_logo|custom|main_icon|app_icon|splash|app\./i.test(name)) score += 100;
      else if (/ic_launcher_round/i.test(name)) score += 15;
      else if (/ic_launcher/i.test(name)) score += 5;

      return score;
    };
    return getScore(b) - getScore(a);
  });
}

/**
 * Extracts authentic raster image icons (PNG, WebP, JPEG) from APK / APKS / XAPK packages.
 */
export async function generateApkThumbnail(file: File | Blob): Promise<Blob> {
  let zip = await loadZipFast(file);

  const processZip = async (currentZip: JSZip): Promise<Blob> => {
    // 1. Root icon.png check for XAPK / APKS bundles
    if (currentZip.files["icon.png"] && !currentZip.files["icon.png"].dir) {
      try {
        const iconBlob = await currentZip.files["icon.png"].async("blob");
        return await generateImageThumbnail(iconBlob);
      } catch (e) {
        // Fall through
      }
    }

    // 2. Unpack embedded base.apk inside APKS / XAPK if present
    const baseApkEntry = Object.keys(currentZip.files).find(
      (fn) => !currentZip.files[fn].dir && /(?:base|app)\.apk$/i.test(fn)
    );
    if (baseApkEntry) {
      try {
        const baseApkBuffer = await currentZip.files[baseApkEntry].async("arraybuffer");
        const innerZip = await JSZip.loadAsync(baseApkBuffer, { checkCRC32: false });
        return await processZip(innerZip);
      } catch (e) {
        // Fall through with outer zip
      }
    }

    const fileKeys = Object.keys(currentZip.files).filter((fn) => !currentZip.files[fn].dir);
    const isRasterImage = (fn: string) =>
      /\.(png|webp|jpg|jpeg)$/i.test(fn) && !fn.endsWith(".9.png");

    let candidateKeys: string[] = [];

    const fullIconPatterns = [
      /res\/mipmap-xxxhdpi[^\/]*\/(?:logo|app_logo|ic_logo|ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
      /res\/mipmap-xxhdpi[^\/]*\/(?:logo|app_logo|ic_logo|ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
      /res\/mipmap-xhdpi[^\/]*\/(?:logo|app_logo|ic_logo|ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
      /res\/mipmap-hdpi[^\/]*\/(?:logo|app_logo|ic_logo|ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
      /res\/drawable-xxhdpi[^\/]*\/(?:logo|app_logo|ic_logo|ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
      /res\/drawable-xhdpi[^\/]*\/(?:logo|app_logo|ic_logo|ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
      /res\/mipmap[^\/]*\/(?:logo|app_logo|ic_logo|ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
      /res\/drawable[^\/]*\/(?:logo|app_logo|ic_logo|ic_launcher|ic_launcher_round|app_icon)\.(png|webp)$/i,
      /(?:logo|app_logo|ic_logo|ic_launcher|app_icon)\.(png|webp)$/i,
    ];

    for (const pattern of fullIconPatterns) {
      const found = fileKeys.filter(
        (fn) => isRasterImage(fn) && !/_foreground|_background/i.test(fn) && pattern.test(fn)
      );
      candidateKeys.push(...found);
    }

    const secondary = fileKeys.filter(
      (fn) =>
        isRasterImage(fn) &&
        !candidateKeys.includes(fn) &&
        !/_foreground|_background/i.test(fn) &&
        /res\/(?:mipmap|drawable)[^\/]*\/.*(?:launcher|icon|logo|avatar|app).*\.(png|webp)$/i.test(fn)
    );
    candidateKeys.push(...secondary);

    candidateKeys = rankIconPaths(candidateKeys);

    for (const key of candidateKeys) {
      try {
        const iconBlob = await currentZip.files[key].async("blob");
        return await generateImageThumbnail(iconBlob);
      } catch (err) {
        // Continue
      }
    }

    // Heuristic ranking for obfuscated APKs
    const allResImages = fileKeys
      .filter((fn) => isRasterImage(fn) && /^res\//i.test(fn))
      .sort((a, b) => {
        const scoreA = /mipmap/i.test(a) ? 3 : /drawable/i.test(a) ? 2 : 1;
        const scoreB = /mipmap/i.test(b) ? 3 : /drawable/i.test(b) ? 2 : 1;
        return scoreB - scoreA;
      });

    for (const key of rankIconPaths(allResImages).slice(0, 25)) {
      try {
        const iconBlob = await currentZip.files[key].async("blob");
        return await generateImageThumbnail(iconBlob);
      } catch (err) {
        // Continue
      }
    }

    // Global image search in zip
    const globalImages = fileKeys.filter((fn) => isRasterImage(fn));
    for (const key of rankIconPaths(globalImages).slice(0, 25)) {
      try {
        const iconBlob = await currentZip.files[key].async("blob");
        return await generateImageThumbnail(iconBlob);
      } catch (err) {
        // Continue
      }
    }

    throw new Error("No raster icon found in package");
  };

  try {
    return await processZip(zip);
  } catch (err) {
    if (file.size > 24 * 1024 * 1024) {
      const fullZip = await JSZip.loadAsync(file, { checkCRC32: false });
      return await processZip(fullZip);
    }
    throw err;
  }
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

  // Draw white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

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
