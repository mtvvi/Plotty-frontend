export type AvatarImageSize = {
  naturalHeight: number;
  naturalWidth: number;
};

export type AvatarCropOptions = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export type AvatarDragOptions = {
  currentOffsetX: number;
  currentOffsetY: number;
  deltaX: number;
  deltaY: number;
  frameSize: number;
  maxOffsetX: number;
  maxOffsetY: number;
};

export function getAvatarCropGeometry(
  imageSize: AvatarImageSize,
  options: AvatarCropOptions,
  frameSize = 1,
) {
  const naturalWidth = Math.max(1, imageSize.naturalWidth);
  const naturalHeight = Math.max(1, imageSize.naturalHeight);
  const safeScale = Math.max(1, options.scale);
  const baseScale = Math.max(frameSize / naturalWidth, frameSize / naturalHeight);
  const drawWidth = naturalWidth * baseScale * safeScale;
  const drawHeight = naturalHeight * baseScale * safeScale;
  const maxOffsetX = Math.max(0, ((drawWidth - frameSize) / 2 / frameSize) * 100);
  const maxOffsetY = Math.max(0, ((drawHeight - frameSize) / 2 / frameSize) * 100);
  const offsetX = normalizeZero(clampNumber(options.offsetX, -maxOffsetX, maxOffsetX));
  const offsetY = normalizeZero(clampNumber(options.offsetY, -maxOffsetY, maxOffsetY));

  return {
    drawHeight,
    drawHeightPercent: (drawHeight / frameSize) * 100,
    drawWidth,
    drawWidthPercent: (drawWidth / frameSize) * 100,
    drawX: (frameSize - drawWidth) / 2 + (offsetX / 100) * frameSize,
    drawY: (frameSize - drawHeight) / 2 + (offsetY / 100) * frameSize,
    maxOffsetX,
    maxOffsetY,
    offsetX,
    offsetY,
  };
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getAvatarDragOffsets({
  currentOffsetX,
  currentOffsetY,
  deltaX,
  deltaY,
  frameSize,
  maxOffsetX,
  maxOffsetY,
}: AvatarDragOptions) {
  const safeFrameSize = Math.max(1, frameSize);
  const offsetDeltaX = (deltaX / safeFrameSize) * 100;
  const offsetDeltaY = (deltaY / safeFrameSize) * 100;

  return {
    offsetX: normalizeZero(clampNumber(currentOffsetX + offsetDeltaX, -maxOffsetX, maxOffsetX)),
    offsetY: normalizeZero(clampNumber(currentOffsetY + offsetDeltaY, -maxOffsetY, maxOffsetY)),
  };
}

function normalizeZero(value: number) {
  return Object.is(value, -0) ? 0 : value;
}
