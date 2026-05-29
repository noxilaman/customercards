import { createWorker } from 'tesseract.js';

// PSM 11 = SPARSE_TEXT — finds text anywhere without assuming a layout block
const PSM_SPARSE_TEXT = '11';

// Scale up small images and boost contrast before passing to Tesseract.
// Business card fonts are often thin and small; higher resolution + contrast
// dramatically improves recognition accuracy.
async function preprocessForOCR(imageFile) {
  const bitmap = await createImageBitmap(imageFile);
  const canvas = document.createElement('canvas');

  // Ensure the longer side is at least 1800px
  const maxDim = Math.max(bitmap.width, bitmap.height);
  const scale = maxDim < 1800 ? 1800 / maxDim : 1;
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Convert to grayscale + boost contrast
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const contrast = 45;
  const f = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const v = Math.min(255, Math.max(0, f * (gray - 128) + 128));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

export async function recognizeCard(imageFile, onProgress) {
  const processed = await preprocessForOCR(imageFile);

  const worker = await createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.floor(m.progress * 100));
      }
    },
  });

  await worker.setParameters({
    tessedit_pageseg_mode: PSM_SPARSE_TEXT,
    preserve_interword_spaces: '1',
  });

  const { data } = await worker.recognize(processed);
  await worker.terminate();
  return data; // data.lines[], data.words[], data.text
}

function cleanLine(str) {
  return str.replace(/\s{2,}/g, ' ').trim();
}

export function parseCardFields(data) {
  // Use Tesseract line objects with confidence filtering.
  // Falls back to raw text split if line data is absent.
  let lines;
  if (Array.isArray(data.lines) && data.lines.length > 0) {
    lines = data.lines
      .filter(l => l.confidence > 20)
      .map(l => cleanLine(l.text))
      .filter(l => l.length > 1 && /[a-zA-Z฀-๿\d]/.test(l));
  } else {
    lines = (data.text ?? '')
      .split('\n')
      .map(cleanLine)
      .filter(l => l.length > 1 && /[a-zA-Z฀-๿\d]/.test(l));
  }

  const text = lines.join('\n');
  const result = {};
  const used = new Set(); // track claimed line indices

  // ── EMAIL ──────────────────────────────────────────────────────────────────
  const emailM = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailM) {
    result.email = emailM[0].toLowerCase();
    lines.forEach((l, i) => { if (l.includes(result.email)) used.add(i); });
  }

  // ── WEBSITE ────────────────────────────────────────────────────────────────
  const webCandidates = [...text.matchAll(/(?:https?:\/\/|www\.)[^\s,<>\n@"']+/gi)];
  if (webCandidates.length) {
    result.website = webCandidates[0][0].replace(/[.,;:)]+$/, '');
    lines.forEach((l, i) => { if (l.includes(result.website)) used.add(i); });
  }

  // ── PHONE ──────────────────────────────────────────────────────────────────
  // Strategy 1: lines with Tel / Mobile / Phone label (exclude Fax)
  const telPat = /(?:^|\s)(?:Tel|Tél|Phone|Mobile|Mob|T|HP)[\s.:]/i;
  const faxPat = /(?:^|\s)(?:Fax|F)[\s.:]/i;

  const telLines = lines.map((l, i) => ({ l, i }))
    .filter(({ l, i }) => !used.has(i) && telPat.test(l) && !faxPat.test(l));
  const faxLines = lines.map((l, i) => ({ l, i }))
    .filter(({ l, i }) => !used.has(i) && faxPat.test(l));

  const extractNums = arr =>
    arr.flatMap(({ l, i }) => {
      used.add(i);
      return [...l.matchAll(/\+?[0-9][\d\s\-()+.]{5,}/g)]
        .map(m => m[0].trim().replace(/\s+/g, ' '));
    });

  const telNums = extractNums(telLines);
  if (telNums.length) result.phone = telNums.join(' / ');
  faxLines.forEach(({ i }) => used.add(i)); // mark fax lines used, don't store

  if (!result.phone) {
    // Strategy 2: line that's entirely digits / separators
    const onlyDigitsIdx = lines.findIndex(
      (l, i) => !used.has(i) && /^\+?[\d\s\-().+]{8,}$/.test(l),
    );
    if (onlyDigitsIdx >= 0) {
      result.phone = lines[onlyDigitsIdx].trim();
      used.add(onlyDigitsIdx);
    } else {
      // Strategy 3: Thai mobile / landline pattern in free text
      const m = text.match(/(?:\+?66[-\s]?|0)[689]\d[-\s]?\d{3,4}[-\s]?\d{4}/);
      if (m) result.phone = m[0];
    }
  }

  // ── COMPANY NAME ───────────────────────────────────────────────────────────
  const companyPat =
    /co\.,?\s*ltd|co\.,?\s*limited|\binc\b\.?|\bcorp\b\.?|\bplc\b|\bcompany\b|\bgroup\b|\bindustries?\b|\binternational\b|\benterprise\b|\btrading\b|บริษัท|หจก\.|จำกัด|\bpty\b|\bgmbh\b|\bllc\b/i;
  const companyIdx = lines.findIndex((l, i) => !used.has(i) && companyPat.test(l));
  if (companyIdx >= 0) {
    result.company_name = lines[companyIdx];
    used.add(companyIdx);
  }

  // ── POSITION / TITLE ───────────────────────────────────────────────────────
  const posPat =
    /\b(?:general\s+manager|managing\s+director|sales\s+(?:manager|director|rep)|marketing\s+(?:manager|director)|product\s+manager|branch\s+manager|manager|director|ceo|coo|cfo|cto|vp|vice[\s-]?president|president|executive|officer|engineer|head\s+of|chief|founder|owner|sales|marketing|purchas|account|representative|buyer|supervisor|coordinator|specialist|consultant|analyst)\b|ผู้จัดการ|ผู้อำนวย|กรรมการ|หัวหน้า|ฝ่ายขาย|ฝ่าย/i;
  const posIdx = lines.findIndex((l, i) => !used.has(i) && posPat.test(l));
  if (posIdx >= 0) {
    result.position = lines[posIdx];
    used.add(posIdx);
  }

  // ── ADDRESS ────────────────────────────────────────────────────────────────
  const addrPat =
    /\d+[\s,\/][A-Za-z฀-๿]|\b(?:road|street|st\.|ave\.?|avenue|blvd|floor|fl\.|building|bldg|suite|moo|soi|หมู่|ถนน|ซอย|แขวง|เขต|กรุงเทพ|จังหวัด|district|province|postal|postcode|zip)\b/i;
  const addrGroup = lines
    .map((l, i) => ({ l, i }))
    .filter(({ l, i }) => !used.has(i) && addrPat.test(l));
  if (addrGroup.length) {
    result.address = addrGroup.map(({ l }) => l).join('\n');
    addrGroup.forEach(({ i }) => used.add(i));
  }

  // ── CONTACT NAME ───────────────────────────────────────────────────────────
  // 2–4 TitleCase or ALL-CAPS words, no digits, not yet claimed
  const namePat =
    /^(?:[A-Z][a-zA-Z'-]{1,25}\.?\s+){1,3}[A-Z][a-zA-Z'-]{1,25}\.?$|^(?:[A-Z]{2,20}\s+){1,3}[A-Z]{2,20}$/;
  const nameIdx = lines.findIndex((l, i) => !used.has(i) && namePat.test(l));
  if (nameIdx >= 0) {
    result.contact_name = lines[nameIdx];
    used.add(nameIdx);
  }

  return result;
}
