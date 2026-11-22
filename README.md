# 📱 تطبيق صانع تيك توك | TikTok Studio Mobile

تطبيق أندرويد **مستقل بالكامل**: كل المعالجة تتم داخل الهاتف عبر FFmpeg مدمج في التطبيق، بدون سيرفر وبدون إنترنت.

## 🚀 بناء ملف الـ APK
1. ارفع المشروع على GitHub (Push على فرع `main`).
2. من تبويب **Actions** افتح آخر تشغيل لـ `Build Android APK`.
3. نزّل `TikTok-Studio-Mobile-APK` من قسم **Artifacts** ثم ثبّت `app-debug.apk`.

## ✨ المميزات
- قص 9:16 (1080×1920): قص ذكي للمنتصف / خلفية ضبابية / أشرطة سوداء.
- إزالة العلامات المائية: delogo أو تمويه المنطقة أو تكبير بسيط، مع قص نهاية CapCut.
- حذف السكتات فعلياً من الفيديو.
- هوك نصي، اسم حساب نصي، وشعار صورة (يُرسم كصور شفافة فيُعرض العربي صحيحاً).
- كابشن عربي كاريوكي: الصق النص فيُوزَّع تلقائياً على مدة الفيديو (توقيت تقديري).
- تجريد البيانات الوصفية (GPS وغيرها).
- الحفظ في المعرض (Movies/TikTokStudio) والمشاركة.

## 🧩 ملاحظات تقنية
- إضافة Capacitor أصلية: `android/app/src/main/java/com/tiktokstudio/app/FFmpegPlugin.java`.
- مكتبة FFmpeg: `io.github.jamaismagic.ffmpeg:ffmpeg-kit-lts-full-16kb` (LGPL، بدون x264).
  المشفّر الأساسي `libx264` إن وُجد، وإلا `h264_mediacodec` (تشفير الهاتف)، وإلا `mpeg4`.
- الأوامر تُبنى في `src/services/ffmpegBuilder.ts`.
