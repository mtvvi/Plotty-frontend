import { describe, expect, it } from "vitest";

import { getAvatarCropGeometry, getAvatarDragOffsets } from "@/widgets/profile/avatar-crop";

describe("avatar crop geometry", () => {
  it("keeps the full wide image available for horizontal repositioning", () => {
    const geometry = getAvatarCropGeometry(
      { naturalHeight: 512, naturalWidth: 2048 },
      { offsetX: 100, offsetY: 0, scale: 1 },
      512,
    );

    expect(geometry.drawWidth).toBe(2048);
    expect(geometry.drawHeight).toBe(512);
    expect(geometry.maxOffsetX).toBe(150);
    expect(geometry.drawX).toBe(-256);
  });

  it("clamps offsets so the crop does not expose blank edges", () => {
    const geometry = getAvatarCropGeometry(
      { naturalHeight: 512, naturalWidth: 1024 },
      { offsetX: 1000, offsetY: -1000, scale: 1 },
      512,
    );

    expect(geometry.offsetX).toBe(50);
    expect(geometry.offsetY).toBe(0);
    expect(geometry.drawX).toBe(0);
    expect(geometry.drawY).toBe(0);
  });

  it("maps pointer movement over the preview to clamped avatar offsets", () => {
    const offsets = getAvatarDragOffsets({
      currentOffsetX: 10,
      currentOffsetY: -5,
      deltaX: 64,
      deltaY: -96,
      frameSize: 256,
      maxOffsetX: 30,
      maxOffsetY: 50,
    });

    expect(offsets.offsetX).toBe(30);
    expect(offsets.offsetY).toBe(-42.5);
  });
});
