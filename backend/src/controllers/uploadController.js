const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/response");
const UploadedDocument = require("../models/UploadedDocument");
const Transaction = require("../models/Transaction");
const { enhanceStatementCategories } = require("../services/finance/categoryService");
const { parseNaturalLanguageDate } = require("../utils/dateParser");

const requireOptional = (moduleName) => {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(moduleName);
  } catch (error) {
    if (error && error.code === "MODULE_NOT_FOUND") {
      const err = new Error(`Optional dependency "${moduleName}" is required for this feature. Run: npm install ${moduleName}`);
      err.statusCode = 500;
      throw err;
    }
    throw error;
  }
};

const normalizeKey = (value) =>
  String(value || "")
    .replace(/^\uFEFF/, "") // strip UTF-8 BOM if present
    .toLowerCase()
    // Strip everything except a-z/0-9 so headers like "DR/CR", "Txn. Date", "Debit Amount"
    // normalize to stable keys (e.g., "drcr", "txndate", "debitamount").
    .replace(/[^a-z0-9]+/g, "");

const pickFirst = (row, keys) => {
  const map = new Map(Object.entries(row).map(([k, v]) => [normalizeKey(k), v]));
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (map.has(normalized)) return map.get(normalized);
  }
  return undefined;
};

const parseAmountValue = (value) => {
  if (value === undefined || value === null) return null;
  let text = String(value).trim();
  if (!text) return null;

  // Normalize unicode signs commonly found in PDFs/CSVs into ASCII.
  text = text
    .replace(/[−–—﹣－]/g, "-") // minus variants
    .replace(/[＋]/g, "+"); // fullwidth plus

  // Handle "(123.45)" style negatives used by some statements.
  const isParenNegative = /^\(.*\)$/.test(text);

  // Capture the first numeric token (preserve leading +/-) and drop currency noise.
  // Supports: "+1,200.50", "-250", "INR 500", "Rs. 1,234.00 Dr"
  const cleaned = text
    .replace(/[()]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\b(rs\.?|inr)\b/gi, "")
    .replace(/[₹\u20B9$]/g, "")
    .trim();
  const match = cleaned.match(/[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?|[+-]?\d+(?:\.\d+)?/);
  if (!match) return null;

  const raw = match[0].replace(/,/g, "");
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;

  return isParenNegative ? -Math.abs(n) : n;
};

const normalizeCategory = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

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

const IST_OFFSET_MS = 330 * 60 * 1000;

const parseStatementDateParts = (value, now = new Date()) => {
  const text = String(value || "").trim().replace(/,/g, " ").replace(/\s+/g, " ");
  if (!text) return null;

  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    return { year: Number(match[1]), monthIndex: Number(match[2]) - 1, day: Number(match[3]) };
  }

  match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    return { year: Number(match[3]), monthIndex: Number(match[2]) - 1, day: Number(match[1]) };
  }

  match = text.match(/^(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?$/);
  if (match) {
    const monthIndex = MONTHS[String(match[2]).toLowerCase()];
    return {
      year: match[3] ? Number(match[3]) : now.getFullYear(),
      monthIndex,
      day: Number(match[1]),
    };
  }

  match = text.match(/^([A-Za-z]{3,9})\s+(\d{1,2})(?:\s+(\d{4}))?$/);
  if (match) {
    const monthIndex = MONTHS[String(match[1]).toLowerCase()];
    return {
      year: match[3] ? Number(match[3]) : now.getFullYear(),
      monthIndex,
      day: Number(match[2]),
    };
  }

  return null;
};

const parseStatementTimeParts = (value) => {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return { hours: 0, minutes: 0, seconds: 0 };

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);
  const meridiem = match[4] ? match[4].toUpperCase() : null;

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  if (meridiem) {
    hours %= 12;
    if (meridiem === "PM") hours += 12;
  }

  return { hours, minutes, seconds };
};

const buildIstDate = (dateText, timeText, now = new Date()) => {
  const parts = parseStatementDateParts(dateText, now);
  if (!parts || parts.monthIndex === undefined) return null;

  const time = parseStatementTimeParts(timeText);
  const utcMs =
    Date.UTC(parts.year, parts.monthIndex, parts.day, time.hours, time.minutes, time.seconds, 0) -
    IST_OFFSET_MS;

  const date = new Date(utcMs);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseExcelSerialDate = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 20000 || n > 80000) return null;

  // Excel serial dates count days from 1899-12-30 because of the historic 1900 leap-year bug.
  const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 24 * 60 * 60 * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseImportedDate = (value, now = new Date()) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const excelDate = parseExcelSerialDate(value);
  if (excelDate) return excelDate;

  return parseNaturalLanguageDate(String(value || ""), now);
};

const parseExplicitType = (raw) => {
  const value = String(raw || "").trim().toLowerCase();
  if (!value) return null;

  // Common CSV conventions: "income"/"expense", "credit"/"debit", "cr"/"dr"
  if (/(^|\b)(income|credit|cr|deposit)(\b|$)/.test(value)) return "income";
  if (/(^|\b)(expense|debit|dr|withdrawal)(\b|$)/.test(value)) return "expense";
  return null;
};

const inferTypeFromDescription = (description) => {
  const text = String(description || "").toLowerCase();
  if (!text) return null;

  if (/\b(credit card|cc payment|card bill|card payment due)\b/.test(text)) return "expense";

  // Income-ish signals
  if (/\b(salary|payroll|credited|interest|dividend|refund|cashback|bonus|dep tfr)\b/.test(text)) return "income";
  if (/\b(transfer received|received from|upi cr|upi\/cr|neft cr|imps cr|rtgs cr|cr\/)\b/.test(text)) return "income";

  // Expense-ish signals
  if (/\b(upi\/dr|wdl tfr|upi|debit|dr\b|paid|purchase|spent|payment to|card payment|rent|bill|recharge|sip|emi)\b/.test(text)) return "expense";
  if (/\b(atm|withdrawal|cash withdrawal)\b/.test(text)) return "expense";
  return null;
};

const shouldIgnoreStatementTransaction = (description) => {
  const text = String(description || "").toLowerCase();
  if (!text) return false;

  // Wallet / UPI Lite top-ups move money between the user's own balances.
  // They should not be imported as spend/income transactions.
  return /\b(upi\s*lite\s*top[\s-]?up|wallet\s*top[\s-]?up|top[\s-]?up)\b/.test(text);
};

const cleanPaymentDescription = (description) => {
  const raw = String(description || "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "";

  const firstPart = raw.split("|")[0].trim();

  if (/^(paid to|received from|payment to)\b/i.test(firstPart)) {
    return firstPart;
  }

  // Common bank UPI narration: WDL TFR UPI/DR/<ref>/<payee>/<bank>/<app>/Paym...
  if (/\bUPI\/(?:DR|CR)\b/i.test(raw) || /\b(?:WDL|DEP)\s+TFR\b/i.test(raw)) {
    const bankCodes = new Set([
      "sbin",
      "yesb",
      "hdfc",
      "icic",
      "axis",
      "utib",
      "cnrb",
      "barb",
      "fdrL",
      "pyTM",
      "paytm",
      "phonepe",
      "upilite",
      "upi lite",
      "paym",
      "paid",
      "at",
      "acb",
    ].map((item) => item.toLowerCase()));

    const tokens = raw
      .split(/[\/|]/)
      .map((token) => token.replace(/\b(WDL|DEP)\s+TFR\b/gi, "").replace(/\bUPI\b/gi, "").trim())
      .filter(Boolean);

    const candidate = tokens.find((token) => {
      const normalized = token.toLowerCase().replace(/[^a-z0-9 ]+/g, "").trim();
      if (!normalized || bankCodes.has(normalized)) return false;
      if (/^(dr|cr)$/i.test(normalized)) return false;
      if (/^\d{6,}$/.test(normalized)) return false;
      if (/^\d+$/.test(normalized)) return false;
      if (/^0+\d+/.test(normalized)) return false;
      if (/^gorantla|anantapur|acb gorantla$/i.test(normalized)) return false;
      return /[a-z]/i.test(normalized);
    });

    if (candidate) return candidate.replace(/\s+/g, " ").trim();
  }

  return firstPart || raw;
};

const normalizeMerchantKey = (value) =>
  cleanPaymentDescription(value)
    .toLowerCase()
    .replace(/\b(paid to|received from|payment to)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const findCategoryHint = (merchantKey, categoryHints) => {
  if (!merchantKey || !(categoryHints instanceof Map)) return "";
  if (categoryHints.has(merchantKey)) return categoryHints.get(merchantKey);

  for (const [key, category] of categoryHints.entries()) {
    if (!key || key.length < 4) continue;
    if (merchantKey.includes(key) || key.includes(merchantKey)) {
      return category;
    }
  }

  return "";
};

const buildCategoryHints = async (userId) => {
  const transactions = await Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(1000)
    .select("description category")
    .lean();

  const hints = new Map();

  for (const transaction of transactions) {
    const category = String(transaction.category || "").trim();
    if (!category || category.toLowerCase() === "transfers") continue;

    const key = normalizeMerchantKey(transaction.description);
    if (key && !hints.has(key)) {
      hints.set(key, category);
    }
  }

  return hints;
};

const inferCategoryFromDescription = (description, fallback = "Transfers", type = "expense") => {
  const text = String(description || "").toLowerCase();
  if (!text) return fallback;

  if (type === "income") {
    if (/\b(salary|payroll|bonus|stipend)\b/.test(text)) return "Salary";
    if (/\b(refund|cashback|reversal)\b/.test(text)) return "Refunds";
    if (/\b(interest|dividend)\b/.test(text)) return "Investments";
    return fallback;
  }

  // Lightweight, deterministic categorization (no LLM) for imports.
  if (/\b(salary|bonus|payroll)\b/.test(text)) return "Salary";
  if (/\b(rent)\b/.test(text)) return "Rent";
  if (/\b(swiggy|zomato|restaurant|lunch|dinner|breakfast|coffee|food|bakery|kitchen|juice|hotel|cafe|canteen|tea|snack|meal|tiffin|biryani|pizza|dominos|mcdonald|kfc)\b/.test(text)) return "Food";
  if (/\b(grocer|grocery|supermarket|fresh|mart|bazaar|zepto|blinkit|bigbasket|dmart|reliance fresh|star bazaar|provision|prov\b|kirana|vegetable|milk|dairy|departmental store)\b/.test(text)) return "Groceries";
  if (/\b(electricity|power|water|gas|utility|bill|broadband|wifi|internet|recharge|postpaid|prepaid|mobile|airtel|jio|vi\b|bsnl)\b/.test(text)) return "Utilities";
  if (/\b(metro|bus|bmtc|uber|ola|fuel|petrol|diesel|transport|cab|railway|train|parking|toll)\b/.test(text)) return "Transport";
  if (/\b(amazon|flipkart|myntra|ajio|shopping|marketplace|store|gift card|electronics|electrical|electrica|jeweller|jewellery|jewelry|grt)\b/.test(text)) return "Shopping";
  if (/\b(sip|mutual fund|mf|investment|stocks?|equity|crypto|bitcoin)\b/.test(text)) return "Investments";
  if (/\b(atm|cash withdrawal)\b/.test(text)) return "Cash";
  if (/\b(charge|charges|fee|fees|penalty|fine)\b/.test(text)) return "Fees";
  if (/\b(movie|cinema|bookmyshow|game|gaming|netflix|spotify|prime video|youtube premium)\b/.test(text)) return "Entertainment";
  if (/\b(school|college|tuition|course|exam|udemy|coursera|education)\b/.test(text)) return "Education";
  if (/\b(flight|hotel booking|train ticket|bus ticket|travel|makemytrip|goibibo|irctc)\b/.test(text)) return "Travel";
  if (/\b(openai|chatgpt|subscription|netflix|spotify|prime video|youtube premium)\b/.test(text)) return "Subscriptions";
  if (/\b(doctor|hospital|clinic|pharmacy|medicine|medical)\b/.test(text)) return "Healthcare";
  if (/\b(received from|transfer received|paid to|dep tfr|wdl tfr|upi\/cr|upi\/dr|paytm|phonepe)\b/.test(text)) return "Transfers";

  return fallback;
};

const mapRowToTransaction = (row, now = new Date(), categoryHints = new Map()) => {
  const dateRaw = pickFirst(row, ["date", "transactiondate", "valuedate", "posteddate", "txnDate"]);
  const descriptionRaw = pickFirst(row, ["description", "narration", "details", "particulars", "remarks", "note"]);

  const debitRaw = pickFirst(row, [
    "debit",
    "withdrawal",
    "dr",
    "amountdebit",
    "debitamount",
    "withdrawalamount",
    "dramount",
  ]);
  const creditRaw = pickFirst(row, [
    "credit",
    "deposit",
    "cr",
    "amountcredit",
    "creditamount",
    "depositamount",
    "cramount",
  ]);
  const amountRaw = pickFirst(row, ["amount", "amt", "transactionamount", "amountinr", "inramount"]);
  const typeRaw = pickFirst(row, ["type", "transactiontype", "drcr", "debitcredit", "txnType", "crdr", "dc"]);
  const categoryRaw = pickFirst(row, ["category", "cat", "txncategory"]);

  const debit = parseAmountValue(debitRaw);
  const credit = parseAmountValue(creditRaw);
  let amount = parseAmountValue(amountRaw);

  const rawDescription = String(descriptionRaw || "").trim();
  if (shouldIgnoreStatementTransaction(rawDescription)) return null;

  const description = cleanPaymentDescription(rawDescription) || rawDescription;
  const categoryDescription = `${description} ${rawDescription}`.trim();

  // Determine type with a clear priority:
  // 1) explicit debit/credit columns
  // 2) explicit type/DRCR column
  // 3) signed amount
  // 4) description heuristic
  // 5) default expense (safer for statements)
  let type = "expense";
  if (credit && credit > 0) {
    type = "income";
    amount = credit;
  } else if (debit && debit > 0) {
    type = "expense";
    amount = debit;
  } else {
    const explicitType = parseExplicitType(typeRaw);
    if (explicitType && amount !== null) {
      type = explicitType;
      amount = Math.abs(amount);
    } else if (amount !== null) {
      if (amount < 0) {
        type = "expense";
        amount = Math.abs(amount);
      } else {
        const descType = inferTypeFromDescription(rawDescription || description);
        type = descType || "expense";
        amount = Math.abs(amount);
      }
    }
  }

  if (!amount || !Number.isFinite(amount) || amount <= 0) return null;

  let date = parseImportedDate(dateRaw, now);
  date = date || now;
  const categoryFromFile = normalizeCategory(categoryRaw);
  const merchantKey = normalizeMerchantKey(description);
  const category =
    categoryFromFile ||
    findCategoryHint(merchantKey, categoryHints) ||
    inferCategoryFromDescription(categoryDescription, "Transfers", type);

  return {
    amount,
    type,
    category,
    date,
    description: description || "Imported transaction",
    raw: { ...row, originalDescription: rawDescription },
  };
};

const parseCsvBuffer = async (buffer) => {
  const csvParser = requireOptional("csv-parser");
  const { Readable } = require("stream");

  const rows = [];

  await new Promise((resolve, reject) => {
    Readable.from([buffer])
      .pipe(csvParser())
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  return rows;
};

const parseXlsxBuffer = async (buffer) => {
  const XLSX = requireOptional("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetNames = Array.isArray(workbook.SheetNames) ? workbook.SheetNames : [];
  const rows = [];

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const sheetRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    rows.push(...sheetRows.map((row) => ({ ...row, __sheetName: sheetName })));
  }

  return rows;
};

const parsePhonePePdfRows = (lines, now = new Date()) => {
  const isDateLine = (value) => /^[A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}$/.test(String(value || "").trim());
  const isTimeLine = (value) => /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(String(value || "").trim());
  const rows = [];

  for (let i = 0; i < lines.length; i += 1) {
    const dateLine = lines[i];
    const timeLine = lines[i + 1];
    const transactionLine = lines[i + 2];

    if (!isDateLine(dateLine) || !isTimeLine(timeLine) || !transactionLine) continue;

    const match = String(transactionLine || "").match(
      /^(DEBIT|CREDIT)\s*[\u20B9]\s*([0-9,]+(?:\.\d{1,2})?)\s*(.+)$/i
    );
    if (!match) continue;

    const type = match[1].toLowerCase() === "credit" ? "credit" : "debit";
    const amount = match[2];
    const details = String(match[3] || "").trim().replace(/\s+/g, " ");
    const date = buildIstDate(dateLine, timeLine, now) || parseNaturalLanguageDate(dateLine, now) || now;

    let transactionId = "";
    let utr = "";
    let account = "";

    for (let j = i + 3; j < lines.length; j += 1) {
      const line = String(lines[j] || "").trim();
      if (isDateLine(line) || /^Page\s+\d+/i.test(line) || /^DateTransaction/i.test(line)) break;

      if (/^Transaction ID\b/i.test(line)) transactionId = line.replace(/^Transaction ID\s*/i, "").trim();
      else if (/^UTR No\./i.test(line)) utr = line.replace(/^UTR No\.\s*/i, "").trim();
      else if (/^X{2,}\d+/i.test(line)) account = line;
    }

    const descriptionParts = [details];
    if (transactionId) descriptionParts.push(`Transaction ID: ${transactionId}`);
    if (utr) descriptionParts.push(`UTR No: ${utr}`);
    if (account) descriptionParts.push(`Account: ${account}`);

    rows.push({
      Date: date,
      Description: descriptionParts.join(" | "),
      Amount: amount,
      Type: type,
    });
  }

  return rows;
};

const parseBankTablePdfRows = (lines) => {
  const startsWithDate = (value) => /^\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/.test(String(value || "").trim());
  const rows = [];
  const chunks = [];
  let current = [];

  for (const rawLine of lines) {
    const line = String(rawLine || "").replace(/\s+/g, " ").trim();
    if (!line || /^(Value Date|Post Date|Details|Page no\.?|Statement From|Date of Statement)/i.test(line)) {
      continue;
    }

    if (startsWithDate(line)) {
      if (current.length > 0) chunks.push(current.join(" "));
      current = [line];
    } else if (current.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) chunks.push(current.join(" "));

  const dateRegex = /\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/g;
  const amountOrDash = "-|\\d{1,3}(?:,\\d{3})*(?:\\.\\d{1,2})?";
  const amountTailRegex = new RegExp(`\\s(?<debit>${amountOrDash})\\s+(?<credit>${amountOrDash})\\s+(?<balance>${amountOrDash})\\s*$`);

  for (const chunk of chunks) {
    const dateMatches = Array.from(chunk.matchAll(dateRegex));
    if (dateMatches.length < 2) continue;

    const postDate = dateMatches[1][0] || dateMatches[0][0];
    const secondDateIndex = dateMatches[1].index || 0;
    const rest = chunk.slice(secondDateIndex + postDate.length).trim();
    const tail = rest.match(amountTailRegex);
    if (!tail?.groups) continue;

    const debit = tail.groups.debit === "-" ? "" : tail.groups.debit;
    const credit = tail.groups.credit === "-" ? "" : tail.groups.credit;
    if (!debit && !credit) continue;

    const description = rest
      .slice(0, tail.index)
      .replace(/\s+-\s*$/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!description || /^[-\s]+$/.test(description)) continue;

    rows.push({
      Date: postDate,
      Description: description,
      Debit: debit,
      Credit: credit,
      Balance: tail.groups.balance === "-" ? "" : tail.groups.balance,
    });
  }

  return rows;
};

const parsePdfBuffer = async (buffer) => {
  const pdfParse = requireOptional("pdf-parse");
  const parsed = await pdfParse(buffer);
  const text = String(parsed.text || "");

  // Bank PDFs vary wildly. We do a best-effort extraction:
  // find lines that contain a date and an amount-like number.
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const looksLikePhonePeStatement =
    lines.some((l) => /^Transaction Statement for\b/i.test(l)) &&
    lines.some((l) => /^DateTransaction DetailsTypeAmount$/i.test(l));

  if (looksLikePhonePeStatement) {
    return parsePhonePePdfRows(lines, new Date());
  }

  const looksLikeNaviUpiStatement =
    lines.some((l) => /transaction statement from/i.test(l)) &&
    lines.some((l) => /paid via navi upi/i.test(l) || /all upi, bill payments/i.test(l));

  // Navi statement format (UPI/bill payments/recharges):
  // Date line, time line, "Paid to ..." / "Received from ..." / "UPI Lite top-up", then metadata lines, then "₹amount" on its own line.
  if (looksLikeNaviUpiStatement) {
    const isDateLine = (value) => /^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}$/.test(String(value || "").trim());
    const isTimeLine = (value) => /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(String(value || "").trim());
    const isAmountLine = (value) => /^[\u20B9₹]\s*[\+\-]?\d/.test(String(value || "").trim());

    // Navi statement timestamps are in IST (Asia/Kolkata, UTC+05:30) and the server
    // timezone may be UTC (e.g. Vercel). Convert IST wall-clock times to a stable UTC instant.
    const IST_OFFSET_MS = 330 * 60 * 1000;
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

    const parseDateParts = (value) => {
      const match = String(value || "").trim().match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
      if (!match) return null;
      const day = Number(match[1]);
      const monthKey = String(match[2] || "").toLowerCase();
      const year = Number(match[3]);
      const monthIndex = MONTHS[monthKey];
      if (!Number.isInteger(day) || !Number.isInteger(year) || monthIndex === undefined) return null;
      return { year, monthIndex, day };
    };

    const parseTime = (value) => {
      const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return null;
      let hours = Number(match[1]);
      const minutes = Number(match[2]);
      const meridiem = match[3].toUpperCase();

      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
      hours = hours % 12;
      if (meridiem === "PM") hours += 12;
      return { hours, minutes };
    };

    const rows = [];

    for (let i = 0; i < lines.length; i += 1) {
      const dateLine = lines[i];
      if (!isDateLine(dateLine)) continue;

      const timeLine = lines[i + 1];
      const detailsLine = lines[i + 2];
      if (!isTimeLine(timeLine) || !detailsLine) continue;

      const dateParts = parseDateParts(dateLine);
      if (!dateParts) continue;

      const time = parseTime(timeLine) || { hours: 0, minutes: 0 };
      const utcMs =
        Date.UTC(dateParts.year, dateParts.monthIndex, dateParts.day, time.hours, time.minutes, 0, 0) -
        IST_OFFSET_MS;
      const baseDate = new Date(utcMs);

      const details = String(detailsLine || "").trim().replace(/\s+/g, " ");
      const lowerDetails = details.toLowerCase();

      // Infer direction from the human-readable verb.
      const direction =
        lowerDetails.startsWith("received") ? "credit" : lowerDetails.startsWith("paid") ? "debit" : "debit";

      let txnId = "";
      let note = "";
      let bank = "";
      let accountSuffix = "";
      let amountText = "";

      // Consume metadata lines until we hit an amount (₹...) or the next transaction date.
      for (let j = i + 3; j < lines.length; j += 1) {
        const line = String(lines[j] || "").trim();

        if (isDateLine(line)) {
          // Next transaction starts; stop scanning this one.
          break;
        }

        if (isAmountLine(line)) {
          amountText = line;
          i = j; // move outer loop forward to the amount line we consumed
          break;
        }

        if (/^UPI txn ID:/i.test(line)) txnId = line.replace(/^UPI txn ID:\s*/i, "").trim();
        else if (/^Note:/i.test(line)) note = line.replace(/^Note:\s*/i, "").trim();
        else if (/bank of india|state bank|hdfc bank|icici bank|axis bank|kotak/i.test(line)) bank = line;
        else if (/^-\s*\d{2,6}$/.test(line)) accountSuffix = line.replace(/^-\s*/, "").trim();
      }

      if (!amountText) {
        // No amount found; skip this record.
        continue;
      }

      const descriptionParts = [details];
      if (note) descriptionParts.push(`Note: ${note}`);
      if (txnId) descriptionParts.push(`UPI txn ID: ${txnId}`);
      if (bank) descriptionParts.push(bank);
      if (accountSuffix) descriptionParts.push(`A/C -${accountSuffix}`);

      rows.push({
        Date: baseDate,
        Description: descriptionParts.join(" | "),
        Amount: amountText,
        Type: direction,
      });
    }

    return rows;
  }

  const bankRows = parseBankTablePdfRows(lines);
  if (bankRows.length > 0) {
    return bankRows;
  }

  const rows = [];

  for (const line of lines) {
    const dateMatch = line.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/);
    const amtMatch = line.match(
      /(?:[\u20B9₹]|rs\.?|inr|\$)\s*([+\-\u2212\u2013\u2014]?\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i
    );
    if (!amtMatch) continue;

    rows.push({
      Date: dateMatch ? dateMatch[1] : "",
      Description: line,
      Amount: amtMatch[1] || "",
    });
  }

  return rows;
};

// POST /api/uploads/statement (multipart form-data: file)
const uploadStatement = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded. Use multipart/form-data with field name 'file'.");
  }

  const originalName = req.file.originalname || "statement";
  const filename = `${Date.now()}-${originalName}`.replace(/[^\w.\-]+/g, "_");
  const fileType = req.file.mimetype || "application/octet-stream";
  const size = req.file.size || 0;

  const ext = String(originalName).toLowerCase().split(".").pop();
  const buffer = req.file.buffer;
  const now = new Date();

  let rows = [];
  if (ext === "csv") {
    rows = await parseCsvBuffer(buffer);
  } else if (ext === "xlsx" || ext === "xls") {
    rows = await parseXlsxBuffer(buffer);
  } else if (ext === "pdf") {
    rows = await parsePdfBuffer(buffer);
  } else {
    res.status(400);
    throw new Error("Unsupported file type. Please upload a CSV, XLSX, or PDF.");
  }

  const categoryHints = await buildCategoryHints(req.user._id);

  const parsedTransactions = rows
    .map((row) => mapRowToTransaction(row, now, categoryHints))
    .filter(Boolean);
  const extractedTransactions = await enhanceStatementCategories(parsedTransactions);

  const document = await UploadedDocument.create({
    userId: req.user._id,
    originalName,
    filename,
    fileType,
    size,
    status: "extracted",
    extractedTransactions,
  });

  sendSuccess(res, 200, "Statement parsed successfully", {
    documentId: document._id,
    count: extractedTransactions.length,
    extractedTransactions,
  });
});

// POST /api/uploads/import-confirmed
// Body: { documentId: string, selectedIndices?: number[] }
const importConfirmed = asyncHandler(async (req, res) => {
  const { documentId, selectedIndices } = req.body || {};

  if (!documentId) {
    res.status(400);
    throw new Error("documentId is required");
  }

  const document = await UploadedDocument.findOne({ _id: documentId, userId: req.user._id });
  if (!document) {
    res.status(404);
    throw new Error("Uploaded document not found");
  }

  if (document.status === "imported") {
    sendSuccess(res, 200, "Document already imported", { importedCount: document.importedCount || 0 });
    return;
  }

  const extracted = Array.isArray(document.extractedTransactions) ? document.extractedTransactions : [];
  const indices = Array.isArray(selectedIndices) ? selectedIndices.filter((n) => Number.isInteger(n)) : null;
  const toImport = indices ? indices.map((i) => extracted[i]).filter(Boolean) : extracted;

  if (toImport.length === 0) {
    res.status(400);
    throw new Error("No transactions selected to import");
  }

  const created = await Transaction.insertMany(
    toImport.map((t) => ({
      userId: req.user._id,
      amount: t.amount,
      type: t.type,
      category: t.category || "Transfers",
      date: t.date || new Date(),
      description: t.description || "Imported transaction",
    })),
    { ordered: false }
  );

  document.status = "imported";
  document.importedCount = created.length;
  await document.save();

  sendSuccess(res, 201, "Transactions imported successfully", {
    importedCount: created.length,
    documentId: document._id,
  });
});

module.exports = {
  uploadStatement,
  importConfirmed,
};
