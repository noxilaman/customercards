// Sends the card image to the backend which uses Claude vision for extraction.
// Returns { company_name, contact_name, position, phone, email, website, address }
export async function recognizeCard(imageFile) {
  const fd = new FormData();
  fd.append('image', imageFile);

  const res = await fetch('/api/ocr', { method: 'POST', body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `OCR failed (${res.status})`);
  }
  return res.json(); // already structured fields
}
