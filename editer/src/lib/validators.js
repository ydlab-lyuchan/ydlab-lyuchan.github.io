export function validateEquipment(data) {
  const errors = [];
  if (!Array.isArray(data.items)) errors.push("items 必須是陣列");

  (data.items || []).forEach((item, i) => {
    if (!item.name?.trim()) errors.push(`第 ${i + 1} 筆：名稱必填`);
    if (!item.category?.trim()) errors.push(`第 ${i + 1} 筆：分類必填`);
  });

  return errors;
}

export function validateCases(data) {
  const errors = [];
  if (!Array.isArray(data.items)) errors.push("items 必須是陣列");
  if (data.homeLimit != null && Number(data.homeLimit) < 1) {
    errors.push("homeLimit 必須大於 0");
  }

  const ids = new Set();
  (data.items || []).forEach((item, i) => {
    const id = item.id?.trim();
    if (!id) errors.push(`第 ${i + 1} 筆：id 必填`);
    else if (ids.has(id)) errors.push(`id 重複：${id}`);
    else ids.add(id);

    if (!item.title?.trim()) errors.push(`第 ${i + 1} 筆：標題必填`);
    if (!item.date?.trim()) errors.push(`第 ${i + 1} 筆：日期必填`);
  });

  return errors;
}

export function normalizeEquipmentPayload(data) {
  return {
    updated: data.updated,
    items: (data.items || []).map((item) => ({
      name: item.name?.trim() || "",
      category: item.category?.trim() || "",
      summary: item.summary?.trim() || "",
      image: item.image?.trim() || "",
    })),
  };
}

export function normalizeCasesPayload(data) {
  return {
    updated: data.updated,
    homeLimit: Number(data.homeLimit) > 0 ? Number(data.homeLimit) : 3,
    items: (data.items || []).map((item) => ({
      id: item.id?.trim() || "",
      title: item.title?.trim() || "",
      date: item.date?.trim() || "",
      category: item.category?.trim() || "",
      summary: item.summary?.trim() || "",
      description: item.description || "",
      image: item.image?.trim() || "",
      images: Array.isArray(item.images)
        ? item.images.filter(Boolean).map((x) => String(x).trim())
        : [],
      youtube: item.youtube?.trim() || "",
    })),
  };
}
