# 👑 Royal Discord Bot & Luxury Web Dashboard Suite

مشروع متكامل واحترافي (**Production Ready**) يجمع بين:
1. **Discord Bot** متطور يعمل بنظام **Slash Commands (/)** فقط عبر مكتبة `discord.js` (v14) وأحدث مواصفات Gateway v10.
2. **Web Dashboard** سحابي خارجي فاخر بثيم ملكي أسود وذهبي (**Dark & Gold Luxury Theme**) متجاوب 100% مع أجهزة الكمبيوتر والهواتف الذكية ومربوط بنظام **Discord OAuth2**.
3. **قاعدة بيانات علائقية متكاملة** عبر **Prisma ORM** تدعم **PostgreSQL** للإنتاج و **SQLite** للتجربة الفورية الخفيفة.
4. **نظام سينما ومشاهدة أفلام متزامن** يعتمد على تقنية **Discord Activities الرسمية** للمشاهدة المشتركة المتزامنة داخل الرومات الصوتية بأمان وقانونية تامة.

---

## 🌟 مميزات المشروع الشاملة

### 1. Discord Bot (Slash Commands Only)
- **18 أمر Slash Commands جاهز ومنظم برمجياً:**
  - `/help`: دليل الأوامر ورابط لوحة التحكم.
  - `/setup`: مرشد الإعداد السريع لربط السيرفر بالداشبورد.
  - `/ping`: فحص سرعة استجابة البوت والـ WebSocket Heartbeat.
  - `/serverinfo`: إحصائيات السيرفر (الأعضاء، القنوات، الرتب، مستويات Boost).
  - `/welcome`: فحص ومعاينة بطاقة الترحيب النشطة.
  - `/autorole`: استعراض الرتب التلقائية مع فحص Role Hierarchy.
  - `/colorroles`: نشر لوحة اختيار ألوان الأعضاء التفاعلية في القناة.
  - `/ticket`: نشر لوحة فتح تذاكر الدعم الفني مع أزرار التحكم.
  - `/play`: تشغيل الصوتيات في الروم الصوتي عبر مكتبة `@discordjs/voice`.
  - `/pause`, `/resume`, `/skip`, `/stop`, `/queue`, `/volume`, `/loop`, `/nowplaying`: تحكم كامل في مشغل الصوت وقوائم الانتظار.
  - `/playmovie`: إطلاق جلسة سينما ومشاهدة جماعية متزامنة داخل الروم الصوتي.

### 2. لوحة التحكم السحابية (Luxury Web Dashboard)
- **تصميم Dark & Gold استثنائي:** خلفيات Deep Obsidian (`#08080A`) مع لمسات الذهب الملكي (`#D4AF37`, `#F6E6B4`) وتأثيرات Glassmorphism ناعمة.
- **حماية وتحقق صارم للصلاحيات:**
  - تسجيل الدخول عبر **Discord OAuth2** مع حماية ضد هجمات CSRF.
  - فحص بيت `0x8` الخاص بصلاحية **Administrator** برمجياً؛ منع أي مستخدم من الوصول لأي سيرفر لا يملك فيه صلاحية إدارية كاملة.
  - ميزة **Instant Dev Mode** لاختبار وتجربة الداشبورد بنقرة واحدة قبل وضع بيانات البوت.
- **14 قسم إداري حقيقي مربوط بقاعدة البيانات مباشرة:**
  1. **Overview:** إحصائيات السيرفر، عدد التذاكر المفتوحة، سرعة الاتصال.
  2. **General Settings:** بروتوكولات الأمان وفحص الصلاحيات.
  3. **Welcome System:** تفعيل/تعطيل، اختيار القناة، بطاقة Embed مخصصة، معاينة حية متطابقة مع ديسكورد.
  4. **Auto Roles:** إضافة وحذف الرتب التلقائية مع تنبيه Role Hierarchy.
  5. **Color Roles:** إنشاء لوحات ألوان متعددة، إضافة الألوان مع إيموجي ورتبة، نمط اللون الواحد.
  6. **Audit Logs:** توجيه 7 أنواع من السجلات لقنوات مخصصة (دخول/خروج، طرد مع الفاعل، حظر، سحب رومات صوتية، ميوت/ديفن، حذف الرسائل مع استرجاع المحتوى، إغلاق التذاكر).
  7. **Ticket System:** تخصيص لوحة التذاكر، رتبة الدعم، فئة الرومات، استعراض التذاكر المفتوحة، وتوليد Transcript كامل بصيغة HTML.
  8. **Auto Response:** إدارة الردود التلقائية (كلمة التحفيز، الرد، تطابق تام، تخصيص القنوات).
  9. **Music System:** مؤشرات جودة الصوت (Opus 48kHz)، شريط التحكم بمستوى الصوت الافتراضي.
  10. **Movies Watch Party:** مكتبة الأفلام، إضافة أفلام بروابط HLS/MP4، إطلاق مشغل المشاهدة المتزامنة.
  11. **Series & Episodes:** تنظيم المسلسلات والمواسم والحلقات.
  12. **Commands Management:** تفعيل وتعطيل أي أمر من أوامر البوت بالسيرفر فوراً.
  13. **Bot Settings:** تخصيص نص الـ Presence، نوع النشاط، حالة الاتصال، ولغة البوت.
  14. **Server Information:** تفاصيل فنية عن السيرفر، المالك، وتوزيع القنوات.

---

## 🚀 التشغيل السريع محلياً (Local Development)

### 1. تثبيت الحزم وإعداد قاعدة البيانات:
```bash
# تثبيت حزم البوت والـ API
npm install

# توليد Prisma Client ومزامنة قاعدة البيانات
npx prisma db push

# تثبيت حزم الداشبورد
cd dashboard
npm install
npm run build
cd ..
```

### 2. تشغيل النظام:
```bash
# تشغيل الخادم والداشبورد والبوت معاً:
npm start
```

افتح المتصفح وتوجه إلى:
👉 **`http://localhost:3000`**

- يمكنك النقر على **"دخول تجريبي فوري (Instant Dev Mode)"** لتصفح جميع أقسام الداشبورد وتعديل الإعدادات فوراً.

---

## ⚙️ ربط البوت الرسمي بديسكورد (Discord Developer Setup)

لربط البوت الفعلي بحسابك في ديسكورد:
1. توجه إلى [Discord Developer Portal](https://discord.com/developers/applications) وأنشئ تطبيقاً جديداً (**New Application**).
2. من تبويب **Bot**:
   - انسخ **Token** وضعه في ملف `.env` أمام `DISCORD_TOKEN`.
   - في قسم **Privileged Gateway Intents**، فعّل كلاً من:
     - ✅ **Server Members Intent**
     - ✅ **Message Content Intent**
3. من تبويب **OAuth2**:
   - انسخ **Client ID** وضعه في `.env` أمام `DISCORD_CLIENT_ID`.
   - انسخ **Client Secret** وضعه في `.env` أمام `DISCORD_CLIENT_SECRET`.
   - في قسم **Redirects** أضف الرابط التالي بدقة:
     - `http://localhost:3000/api/auth/callback` (للتشغيل المحلي)
     - أو رابط نطاقك الخارجي في الإنتاج: `https://yourdomain.com/api/auth/callback`
4. لدعوة البوت لسيرفرك بصلاحية كاملة:
   - اذهب إلى **OAuth2 -> URL Generator** واختر `bot` و `applications.commands`.
   - اختر الصلاحيات المطلوبة أو `Administrator` واستخدم الرابط لدعوة البوت.

---

## 🐳 النشر للإنتاج (Production Hosting)

المشروع مجهز بالكامل للعمل على خوادم VPS (مثل Hetzner أو DigitalOcean) مع Docker Compose.

```bash
# تشغيل البوت والـ Backend والـ PostgreSQL والـ Redis بحاوية معزولة:
docker compose up -d --build
```

### إدارة العمليات عبر PM2 (بديل خفيف للـ VPS):
```bash
npm run build
pm2 start dist/src/index.js --name "royal-bot"
pm2 save
pm2 startup
```

---

## 📁 هيكلية المشروع (Project Architecture)

```
royal-bot/
├── prisma/
│   └── schema.prisma         # مخطط قاعدة البيانات (13 نموذج علائقي)
├── src/
│   ├── api/                  # خادم REST API ونظام OAuth2
│   │   ├── middlewares/      # حماية الصلاحيات (authGuard, adminGuard)
│   │   ├── routes/           # مسارات (auth, guilds, cinema)
│   │   └── server.ts         # تهيئة وتوزيع Express
│   ├── bot/                  # محرك ديسكورد بوت (Discord.js v14)
│   │   ├── cache/            # كاش الرسائل المحذوفة
│   │   ├── commands/         # أوامر Slash Commands مقسمة تصنيفياً
│   │   ├── events/           # معالجات الأحداث (Join, Leave, Ban, Voice, Delete)
│   │   ├── handlers/         # مسجل ومحمل الأوامر والأحداث
│   │   └── modules/          # محركات الموسيقى، التذاكر، والـ Audit Logs
│   ├── config/               # فحص وضبط متغيرات البيئة
│   └── index.ts              # نقطة الانطلاق الرئيسية
├── dashboard/                # لوحة التحكم السحابية (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/       # عناصر الواجهة (Navbar, Sidebar)
│   │   ├── pages/            # شاشات (Login, ServerSelector, Dashboard, CinemaRoom)
│   │   ├── tabs/             # الـ 14 قسم الإداري الفاخر
│   │   ├── api.ts            # عميل استدعاء الـ APIs
│   │   └── index.css         # نظام التصميم الملكي Dark & Gold
│   └── vite.config.ts
├── Dockerfile                # صورة Docker متعددة المراحل
├── docker-compose.yml        # أوركسترا الإنتاج الكاملة
└── .env.example              # نموذج متغيرات البيئة
```

---

## 💎 الجودة والأمان (Security Standards)
- **لا وجود لـ Hardcoded Secrets:** جميع المفاتيح مخزنة في `.env`.
- **فحص الصلاحيات اللحظي:** فحص Administrator Bitwise قبل كل عملية.
- **حماية CSRF:** توليد رموز `state` مشفرة لكل جلسة تسجيل دخول.
- **Rate Limiting:** حماية الـ Endpoints من الإغراق بـ `express-rate-limit`.
- **HTML Transcripts:** توليد سجلات التذاكر بتنسيق نظيف وآمن.
- **الامتثال التام لـ Discord ToS:** استخدام Discord Activities الرسمية بدلاً من السيلفبوت المحظور.
