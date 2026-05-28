const express = require('express');
const router = express.Router();
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Image files only'));
  },
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = `You are extracting contact information from a business card image.

Return a single JSON object with exactly these keys (use null if not found):
{
  "company_name": "full company/organization name",
  "contact_name": "person's full name",
  "position": "job title or position",
  "phone": "phone number(s) — join multiple with ' / ', exclude fax",
  "email": "email address (lowercase)",
  "website": "website URL",
  "address": "full address (join lines with newline)"
}

Rules:
- Do NOT include fax numbers in phone
- If there are multiple phone numbers (Tel + Mobile) join them: "02-xxx-xxxx / 081-xxx-xxxx"
- Strip label prefixes like "Tel:", "Mobile:", "Email:" from values
- Return ONLY the JSON object, no explanation, no markdown fences`;

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const base64 = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype === 'image/png' ? 'image/png' : 'image/jpeg';

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: PROMPT },
        ],
      }],
    });

    const text = message.content[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(422).json({ error: 'Could not parse response' });

    const fields = JSON.parse(jsonMatch[0]);

    // Normalize: replace empty strings with null
    Object.keys(fields).forEach(k => {
      if (fields[k] === '' || fields[k] === 'null') fields[k] = null;
    });

    res.json(fields);
  } catch (err) {
    console.error('OCR error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
