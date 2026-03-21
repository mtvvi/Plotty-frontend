import type { CatalogStoryCard } from "./types";

const statusLabelMap: Record<CatalogStoryCard["status"], string> = {
  "in-progress": "В процессе",
  completed: "Завершён",
  frozen: "Заморожен",
};

const sizeLabelMap: Record<CatalogStoryCard["size"], string> = {
  mini: "Мини",
  midi: "Миди",
  maxi: "Макси",
};

export function mapStoryStatusLabel(status: CatalogStoryCard["status"]) {
  return statusLabelMap[status];
}

export function mapStorySizeLabel(size: CatalogStoryCard["size"]) {
  return sizeLabelMap[size];
}

