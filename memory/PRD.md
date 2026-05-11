# QuietZones — كويت زونز

## Original Problem Statement
بناء تطبيق ويب متجاوب مجاني (نموذج أولي) للموبايل والتابلت يعتمد على GPS لتذكير المستخدم بكتم صوت الهاتف عند دخول أماكن محددة (مساجد، كنائس، مدارس، جامعات، مستشفيات، مكتبات، عمل، منزل). يتم تنبيهه أيضاً عند الخروج لإعادة الرنين. ثنائي اللغة عربي/إنجليزي. التصميم عصري بألوان مميزة. خرائط Leaflet/OpenStreetMap. مستهدف Android/iOS/HarmonyOS عبر متصفح الجوال.

**ملاحظة مهمة**: الإسكات التلقائي الفعلي للهاتف غير ممكن في متصفح الويب (قيد أمني). هذا النموذج يقدم **تنبيهاً/إشعاراً** عند الدخول/الخروج، يمكن لاحقاً ترقيته لتطبيق Android أصلي.

## Architecture
- **Backend**: FastAPI (server.py) + MongoDB (motor async). CRUD على `/api/places`, `/api/visits`, `/api/stats`.
- **Frontend**: React 19 + React Router 7 + Tailwind + Leaflet + react-leaflet + lucide-react. AppContext للحالة (i18n, GPS watcher, geofence detection).
- **User identity**: localStorage device-based ID (`qz_user_id`) — لا تسجيل دخول.
- **Geofencing**: Haversine distance vs radius_m. enter/exit events تُسجَّل تلقائياً + إشعار متصفح + صوت قصير.

## User Personas
- طلاب وشباب يدخلون مدارس/جامعات/مكتبات
- مصلون في المساجد والكنائس
- عاملو الصحة في المستشفيات
- موظفون في بيئات هادئة

## Core Requirements (Static)
1. خريطة تفاعلية مع موقع المستخدم ودوائر geofence حول الأماكن المحفوظة
2. CRUD على الأماكن مع 9 فئات وأيقونات مخصصة
3. شريط حالة (Status pill) يظهر "وضع الرنين / تذكير الصمت / داخل [اسم]"
4. سجل النشاط (enter/exit history)
5. ثنائي اللغة EN/AR مع RTL/LTR تلقائي
6. إشعارات المتصفح + صوت
7. تتبع GPS مباشر مع watchPosition
8. إعدادات: لغة، نصف قطر افتراضي، إشعارات، صوت، تتبع تلقائي

### Phase 3 — Multi-language & Action Toggle (2026-01)
- ✅ **17 لغة عالمية**: en, ar, es, fr, de, it, pt, ru, tr, id, zh, ja, ko, hi, fa, ur, he
- ✅ خطوط مخصصة لكل سكريبت (Noto Sans SC/JP/KR/Devanagari, Vazirmatn, Heebo, Tajawal)
- ✅ تطبيق RTL تلقائي للغات العبرية والفارسية والأردية والعربية
- ✅ Fallback تلقائي للإنجليزية للمفاتيح المفقودة عبر deepMerge
- ✅ منتقي اللغة في الإعدادات (native select بدلاً من pills) مع flags
- ✅ **ActionToggle** (Silent أحمر / Ring أخضر) على كل بطاقة مكان
- ✅ نفس التوجل في AddPlaceDialog ("Action on enter")
- ✅ منطق الإشعار يفرّق بين Silent و Ring (entered_body vs entered_body_ring)
- ✅ Backend: حقل `action` على Place + Share مع Literal['silent','ring'] validation
- ✅ اختبار: Backend 24/24 (100%)، Frontend 100% على كل التدفقات

## Implemented (2026-01)
- ✅ Backend API كامل: places/visits/stats مع validation + cascade delete
- ✅ Frontend متعدد الصفحات: Home (خريطة + قريب)، Places، History، Settings
- ✅ Leaflet map مع markers مخصصة ودوائر geofence
- ✅ AddPlaceDialog مع كل الحقول + "Use current location" + slider للنصف قطر
- ✅ Geofence enter/exit detection في AppContext (تسجيل visit + إشعار + صوت)
- ✅ Bilingual EN/AR كامل + RTL مع Tajawal/Outfit fonts
- ✅ تصميم بألوان طبيعية (Terracotta + Jade + Bone White)
- ✅ Bottom nav + FAB + StatusPill مع animations
- ✅ كل العناصر التفاعلية لديها data-testid
- ✅ اختبار شامل: Backend 100% (15/15)، Frontend ~95% (مشكلة overlay تم إصلاحها)

### Phase 2 — Social Sharing (2026-01)
- ✅ Backend: `/api/shares` POST/GET endpoints مع short id (10 hex) + view_count
- ✅ ShareDialog موحد: QR Code (qrcode.react) + Copy Link + 5 أزرار وسائل تواصل (WhatsApp, Telegram, X, Facebook, Email) + Native Share API
- ✅ زر مشاركة على كل بطاقة مكان (Places page)
- ✅ زر "Share all my places" + "Share QuietZones app" في Settings
- ✅ صفحة استيراد عامة `/s/:shareId` بدون bottom nav، خريطة، اختيار متعدد، استيراد جماعي
- ✅ Snapshot immutable للأماكن المشتركة (لا تتأثر بحذف صاحبها)
- ✅ ترجمة كاملة EN/AR للميزة
- ✅ اختبار: Backend 21/21، Frontend 100% على تدفقات المشاركة

## Backlog (Priority Order)
### P1
- Map picker tap-to-select داخل AddPlaceDialog (حالياً يدوي أو "موقعي الحالي")
- Stats dashboard page (most visited, total mute reminders) - الـ endpoint موجود
- PWA manifest + service worker للتثبيت على الشاشة الرئيسية

### P2
- مشاركة الأماكن (export/import JSON)
- جدولة (تفعيل المنطقة فقط في ساعات/أيام محددة)
- Heat map لأكثر الأماكن زيارة
- Dark theme

### P3 (يتطلب Mobile Agent / تطبيق أصلي)
- كتم تلقائي فعلي للهاتف على Android
- Background geofencing مع نظام التشغيل
- إشعارات push عند إغلاق التطبيق

## Test Credentials
لا يوجد - التطبيق يعتمد على معرّف جهاز محلي (localStorage). كل متصفح/جهاز يحصل على ID فريد تلقائياً.

## Future Native App Plan
عند ترقية المستخدم لـ Mobile Agent: نقل المنطق إلى Expo React Native، استخدام `expo-location` للـ background tracking، و`expo-av` + Android AudioManager للكتم الفعلي.
