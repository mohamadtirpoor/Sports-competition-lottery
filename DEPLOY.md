# راهنمای دیپلوی در لیارا

## روش 1: دو پروژه جداگانه (توصیه می‌شود)

### Backend (Node.js)

1. در لیارا یک پروژه Node.js بسازید (مثلاً: `tournament-api`)

2. فایل `liara.json` در پوشه `backend`:
```json
{
  "platform": "node",
  "node": {
    "version": "18"
  },
  "port": 5000
}
```

3. دیپلوی کنید:
```bash
cd backend
liara deploy --platform=node --port=5000
```

4. آدرس API شما: `https://tournament-api.liara.run`

### Frontend (Next.js)

1. در لیارا یک پروژه Next.js بسازید (مثلاً: `tournament-app`)

2. فایل `liara.json` در پوشه `frontend`:
```json
{
  "platform": "next",
  "next": {
    "version": "14"
  }
}
```

3. آدرس API رو در فایل‌های فرانت‌اند تغییر بدید:
```javascript
// frontend/pages/index.js و سایر فایل‌ها
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tournament-api.liara.run/api';
```

4. دیپلوی کنید:
```bash
cd frontend
liara deploy --platform=next
```

5. آدرس سایت شما: `https://tournament-app.liara.run`

---

## روش 2: یک پروژه Node.js (ساده‌تر)

### مراحل:

1. در لیارا یک پروژه Node.js بسازید

2. فایل `liara.json` در ریشه پروژه:
```json
{
  "platform": "node",
  "node": {
    "version": "18"
  },
  "port": 5000,
  "build": {
    "location": "backend"
  }
}
```

3. دیپلوی کنید:
```bash
liara deploy --platform=node --port=5000
```

**نکته**: در این روش فقط API در دسترس است. برای فرانت‌اند باید از روش 1 استفاده کنید.

---

## متغیرهای محیطی (Environment Variables)

در تنظیمات پروژه لیارا:

### Backend:
```
NODE_ENV=production
PORT=5000
```

### Frontend:
```
NEXT_PUBLIC_API_URL=https://tournament-api.liara.run/api
```

---

## نکات مهم:

1. ✅ دیتابیس SQLite در لیارا کار می‌کند اما برای production بهتر است از PostgreSQL یا MySQL استفاده کنید
2. ✅ CORS را برای دامنه فرانت‌اند تنظیم کنید
3. ✅ فایل `.gitignore` را چک کنید که `node_modules` و `.next` در آن باشد
4. ✅ برای دیسک دائمی (Persistent Storage) در لیارا، دیتابیس را در `/data` ذخیره کنید

---

## دستورات مفید:

```bash
# نصب Liara CLI
npm install -g @liara/cli

# لاگین
liara login

# دیپلوی
liara deploy

# مشاهده لاگ‌ها
liara logs

# لیست پروژه‌ها
liara project list
```
