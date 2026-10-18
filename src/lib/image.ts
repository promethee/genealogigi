import { MAX_PHOTO_SIDE } from "../data/photos.ts";
import { PhotoError } from "../data/photos.ts";
import { t } from "../i18n/index.ts";

/** The size an image of `width` x `height` is shrunk to so that its longest side is `max`. */
export function fitWithin(
  width: number,
  height: number,
  max: number = MAX_PHOTO_SIDE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function load(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new PhotoError(t("err.photoInvalid")));
    image.src = dataUrl;
  });
}

/**
 * Shrinks any browser-readable image to at most `max` pixels on its longest side and returns it as
 * a JPEG data URL. Drawn on a canvas, so EXIF rotation is applied and transparency becomes white.
 */
export async function shrinkToJpeg(
  dataUrl: string,
  max: number = MAX_PHOTO_SIDE,
  quality = 0.85,
): Promise<string> {
  const image = await load(dataUrl);
  if (!image.naturalWidth || !image.naturalHeight) throw new PhotoError(t("err.photoInvalid"));
  const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight, max);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new PhotoError(t("err.photoInvalid"));
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
