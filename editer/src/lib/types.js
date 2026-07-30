export const EQUIPMENT_CATEGORIES = ["音響", "視訊", "網路", "其他"];

export const CASE_CATEGORIES = ["視訊", "音響", "網路", "軟硬體", "其他"];

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function emptyEquipment() {
  return {
    name: "",
    category: "音響",
    summary: "",
    image: "",
  };
}

export function emptyCase() {
  return {
    id: "",
    title: "",
    date: todayISO(),
    category: "視訊",
    summary: "",
    description: "",
    image: "",
    images: [],
    youtube: "",
  };
}

export function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function suggestCaseId(title, date) {
  const slug = slugify(title);
  const d = String(date || "").slice(0, 10);
  return slug ? `${d}-${slug}` : d;
}
