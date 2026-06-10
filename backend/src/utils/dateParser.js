const MONTHS = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const clampDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const parseAbsoluteDate = (text, now = new Date()) => {
  // ISO: YYYY-MM-DD
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    return clampDate(new Date(year, month - 1, day));
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    return clampDate(new Date(year, month - 1, day));
  }

  // "5 May" / "May 5" with optional year
  const monthName1 = text.match(/\b(\d{1,2})\s+([a-z]{3,9})(?:\s+(\d{4}))?\b/i);
  if (monthName1) {
    const day = Number(monthName1[1]);
    const monthKey = String(monthName1[2]).toLowerCase();
    const year = monthName1[3] ? Number(monthName1[3]) : now.getFullYear();
    if (MONTHS[monthKey] !== undefined) {
      return clampDate(new Date(year, MONTHS[monthKey], day));
    }
  }

  const monthName2 = text.match(/\b([a-z]{3,9})\s+(\d{1,2})(?:\s+(\d{4}))?\b/i);
  if (monthName2) {
    const monthKey = String(monthName2[1]).toLowerCase();
    const day = Number(monthName2[2]);
    const year = monthName2[3] ? Number(monthName2[3]) : now.getFullYear();
    if (MONTHS[monthKey] !== undefined) {
      return clampDate(new Date(year, MONTHS[monthKey], day));
    }
  }

  return null;
};

const parseNaturalLanguageDate = (text, now = new Date()) => {
  const lower = String(text || "").toLowerCase();

  if (/\b(today)\b/.test(lower)) {
    return clampDate(new Date(now));
  }

  if (/\b(yesterday)\b/.test(lower)) {
    const date = new Date(now);
    date.setDate(date.getDate() - 1);
    return clampDate(date);
  }

  if (/\b(tomorrow)\b/.test(lower)) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    return clampDate(date);
  }

  const abs = parseAbsoluteDate(lower, now);
  if (abs) {
    return abs;
  }

  return null;
};

module.exports = { parseNaturalLanguageDate };

