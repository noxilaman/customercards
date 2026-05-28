# Customer Cards — Setup Guide

## โครงสร้างโปรเจค
```
customercards/
├── backend/          Node.js + Express API
│   ├── .env          ← แก้ DB config ที่นี่
│   ├── uploads/      รูปภาพที่อัปโหลด
│   └── index.js
├── frontend/         React PWA
│   └── dist/         ← build output (ถูก serve โดย backend)
└── db/
    └── schema.sql    ← สร้าง database ด้วยไฟล์นี้
```

## 1. สร้าง Database

```sql
mysql -u root -p < db/schema.sql
```

หรือ copy เนื้อหาใน `db/schema.sql` ไป run ใน phpMyAdmin / MySQL Workbench

## 2. ตั้งค่า Backend

แก้ไขไฟล์ `backend/.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword   ← ใส่ password MySQL
DB_NAME=customercards

PORT=3001
```

## 3. Build Frontend

```bash
cd frontend
npm install
npm run build
```

## 4. Start Server

```bash
cd backend
npm install
npm start
```

เปิด browser ไปที่ `http://your-server-ip:3001`

## 5. ใช้งานบน Tablet/มือถือ

เปิด browser บน tablet แล้วไปที่ `http://your-server-ip:3001`

ถ้าต้องการ HTTPS (สำหรับกล้องบน iOS):
- ใช้ nginx reverse proxy + Let's Encrypt SSL
- หรือใช้ ngrok สำหรับ development

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/customers | รายการลูกค้าทั้งหมด |
| GET | /api/customers/:id | ดูลูกค้ารายเดียว |
| POST | /api/customers | เพิ่มลูกค้าใหม่ |
| PUT | /api/customers/:id | แก้ไขข้อมูล |
| DELETE | /api/customers/:id | ลบ |

Query params สำหรับ GET /api/customers:
- `search` - ค้นหา
- `page` - หน้า (default 1)
- `limit` - จำนวนต่อหน้า (default 20)
