const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const pool = require('../db');
const upload = require('../upload');

// List all customers
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '';
    let params = [];
    if (search) {
      where = 'WHERE company_name LIKE ? OR contact_name LIKE ? OR email LIKE ? OR arrange_by LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }

    const [rows] = await pool.query(
      `SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM customers ${where}`,
      params
    );

    res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create customer
router.post('/', upload.fields([
  { name: 'card_photo', maxCount: 1 },
  { name: 'customer_photo', maxCount: 1 },
]), async (req, res) => {
  try {
    const body = req.body;
    const cardFile = req.files?.card_photo?.[0];
    const customerFile = req.files?.customer_photo?.[0];

    if (!cardFile) return res.status(400).json({ error: 'Business card photo is required' });

    // Compress images with sharp
    const compressImage = async (filePath) => {
      const compressed = filePath.replace(/(\.\w+)$/, '_c.jpg');
      await sharp(filePath).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 }).toFile(compressed);
      fs.unlinkSync(filePath);
      return path.basename(compressed);
    };

    const cardPhotoName = await compressImage(cardFile.path);
    const customerPhotoName = customerFile ? await compressImage(customerFile.path) : null;

    const countries = body.countries ? JSON.parse(body.countries) : [];
    const businessTypes = body.business_types ? JSON.parse(body.business_types) : [];

    const [result] = await pool.query(
      `INSERT INTO customers
        (visit_date, is_visitor, company_name, contact_name, position, phone, email, website, address,
         countries, country_other, business_types, business_type_other,
         remark, note, arrange_by, card_photo, customer_photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.visit_date || new Date().toISOString().slice(0, 10),
        body.is_visitor === 'true' ? 1 : 0,
        body.company_name || null,
        body.contact_name || null,
        body.position || null,
        body.phone || null,
        body.email || null,
        body.website || null,
        body.address || null,
        JSON.stringify(countries),
        body.country_other || null,
        JSON.stringify(businessTypes),
        body.business_type_other || null,
        body.remark || null,
        body.note || null,
        body.arrange_by || null,
        cardPhotoName,
        customerPhotoName,
      ]
    );

    res.status(201).json({ id: result.insertId, message: 'Saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update customer
router.put('/:id', upload.fields([
  { name: 'card_photo', maxCount: 1 },
  { name: 'customer_photo', maxCount: 1 },
]), async (req, res) => {
  try {
    const body = req.body;
    const cardFile = req.files?.card_photo?.[0];
    const customerFile = req.files?.customer_photo?.[0];

    const [existing] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Not found' });

    const uploadDir = path.join(__dirname, '../../uploads');
    const compressImage = async (filePath) => {
      const compressed = filePath.replace(/(\.\w+)$/, '_c.jpg');
      await sharp(filePath).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 }).toFile(compressed);
      fs.unlinkSync(filePath);
      return path.basename(compressed);
    };

    let cardPhotoName = existing[0].card_photo;
    let customerPhotoName = existing[0].customer_photo;

    if (cardFile) {
      if (cardPhotoName) {
        const old = path.join(uploadDir, cardPhotoName);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      cardPhotoName = await compressImage(cardFile.path);
    }
    if (customerFile) {
      if (customerPhotoName) {
        const old = path.join(uploadDir, customerPhotoName);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      customerPhotoName = await compressImage(customerFile.path);
    }

    const countries = body.countries ? JSON.parse(body.countries) : [];
    const businessTypes = body.business_types ? JSON.parse(body.business_types) : [];

    await pool.query(
      `UPDATE customers SET
        visit_date=?, is_visitor=?, company_name=?, contact_name=?, position=?, phone=?, email=?,
        website=?, address=?, countries=?, country_other=?, business_types=?, business_type_other=?,
        remark=?, note=?, arrange_by=?, card_photo=?, customer_photo=?
       WHERE id=?`,
      [
        body.visit_date || existing[0].visit_date,
        body.is_visitor === 'true' ? 1 : 0,
        body.company_name || null,
        body.contact_name || null,
        body.position || null,
        body.phone || null,
        body.email || null,
        body.website || null,
        body.address || null,
        JSON.stringify(countries),
        body.country_other || null,
        JSON.stringify(businessTypes),
        body.business_type_other || null,
        body.remark || null,
        body.note || null,
        body.arrange_by || null,
        cardPhotoName,
        customerPhotoName,
        req.params.id,
      ]
    );

    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const uploadDir = path.join(__dirname, '../../uploads');
    if (rows[0].card_photo) {
      const f = path.join(uploadDir, rows[0].card_photo);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    if (rows[0].customer_photo) {
      const f = path.join(uploadDir, rows[0].customer_photo);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }

    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
