# Customer Cards

ระบบจัดการข้อมูลลูกค้าจากนามบัตร สำหรับงาน Trade Show / Exhibition
พร้อม OCR อ่านนามบัตรอัตโนมัติด้วย Claude Vision และ Export Excel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, PWA |
| Backend | Node.js, Express 5 |
| Database | MySQL 8 |
| OCR | Claude Vision API (claude-haiku-4-5) |
| Export | SheetJS (xlsx) |
| Image processing | Sharp, Multer |

---

## Prerequisites

- Node.js 18+
- MySQL 8+
- Anthropic API Key — [console.anthropic.com](https://console.anthropic.com)

---

## Database Setup

```sql
CREATE DATABASE IF NOT EXISTS customercards
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE customercards;
```

จากนั้น import schema:

```bash
mysql -u root -p customercards < db/schema.sql
```

---

## Installation

### 1. Clone & install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

แก้ไขไฟล์ `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=customercards

PORT=3001
UPLOAD_DIR=uploads

ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

### 3. Build frontend

```bash
cd frontend
npm run build
```

### 4. Start backend

```bash
cd backend
npm start
```

เปิด [http://localhost:3001](http://localhost:3001)

---

## Development

รัน frontend dev server และ backend พร้อมกัน:

```bash
# Terminal 1 — backend (auto-restart on change)
cd backend
npm run dev

# Terminal 2 — frontend (HMR)
cd frontend
npm run dev
```

Frontend dev: [http://localhost:5173](http://localhost:5173) → proxy ไป backend port 3001

---

## Features

### บันทึกข้อมูลลูกค้า
- ถ่ายรูปนามบัตรและรูปลูกค้า พร้อม crop ก่อนบันทึก
- กด **"อ่านข้อมูลจากนามบัตร (OCR)"** → Claude Vision อ่านและกรอกฟอร์มอัตโนมัติ
- รองรับทั้งภาษาไทยและอังกฤษ

### ฟิลด์ข้อมูล
| ฟิลด์ | รายละเอียด |
|---|---|
| Visit Date | วันที่พบลูกค้า |
| Visitor | เป็น Visitor หรือไม่ |
| Company | ชื่อบริษัท/องค์กร |
| Contact Name | ชื่อ-นามสกุล |
| Position | ตำแหน่ง |
| Phone | เบอร์โทรศัพท์ |
| Email | อีเมล |
| Website | เว็บไซต์ |
| Address | ที่อยู่ |
| Country | ประเทศ (เลือกได้หลายประเทศ) |
| Business Type | ประเภทธุรกิจ (เลือกได้หลายประเภท) |
| Arrange By | ผู้รับผิดชอบ |
| Remark | ความต้องการพิเศษ/สินค้าที่สนใจ |
| Note | หมายเหตุเพิ่มเติม |

### รายการลูกค้า
- **Card view** — แสดงแบบ card พร้อมรูป
- **Table view** — แสดงแบบตาราง เหมาะสำหรับดูข้อมูลจำนวนมาก
- ค้นหาแบบ real-time (บริษัท / ชื่อ / email / arrange by)
- Pagination

### Export Excel
- กดปุ่ม **Export Excel** ในหน้ารายการ
- Export ทุก record ที่ตรงกับคำค้นหาปัจจุบัน (ไม่จำกัด pagination)
- ไฟล์: `customers_YYYY-MM-DD.xlsx`

---

## API Endpoints

### Customers

| Method | Path | Description |
|---|---|---|
| GET | `/api/customers` | รายการลูกค้า (query: `search`, `page`, `limit`) |
| GET | `/api/customers/:id` | ข้อมูลลูกค้า |
| POST | `/api/customers` | เพิ่มลูกค้า (multipart/form-data) |
| PUT | `/api/customers/:id` | แก้ไขลูกค้า (multipart/form-data) |
| DELETE | `/api/customers/:id` | ลบลูกค้า |

### OCR

| Method | Path | Description |
|---|---|---|
| POST | `/api/ocr` | อ่านนามบัตร (multipart: `image`) → JSON fields |

### Static

| Path | Description |
|---|---|
| `/uploads/:filename` | ไฟล์รูปภาพที่อัปโหลด |

---

## Project Structure

```
customercards/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── customers.js   # CRUD customers
│   │   │   └── ocr.js         # Claude Vision OCR
│   │   ├── db.js              # MySQL connection pool
│   │   └── upload.js          # Multer config
│   ├── uploads/               # uploaded images (gitignore)
│   ├── index.js               # Express app entry
│   ├── .env                   # environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CameraCapture.jsx  # camera + crop component
│   │   │   └── CustomerForm.jsx   # add/edit form with OCR button
│   │   ├── pages/
│   │   │   ├── CardList.jsx       # list + table + export
│   │   │   ├── NewCard.jsx
│   │   │   ├── CardDetail.jsx
│   │   │   └── EditCard.jsx
│   │   ├── utils/
│   │   │   └── ocr.js             # OCR API client
│   │   ├── api.js                 # Axios API calls
│   │   └── App.jsx
│   └── package.json
└── db/
    └── schema.sql
```

---

## Image Upload

- รูปภาพถูก compress ด้วย Sharp ก่อนบันทึก (max 1200×1200, JPEG quality 80)
- เก็บใน `backend/uploads/`
- ขนาดไฟล์สูงสุด: 20 MB ต่อรูป
