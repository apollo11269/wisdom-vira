# دليل إعداد نظام الصلاحيات

## الخطوات السريعة

### 1. إعداد ملف الرتب

افتح `config/roles.json` وأضف معرفات الرتب:

```json
{
  "owner_role_id": "",
  "founders_role_id": "123456789012345678",
  "moderators_role_id": "123456789012345679",
  "staff_role_id": "123456789012345680"
}
```

**كيفية الحصول على معرف الرتبة:**
1. فتح Discord
2. Settings → Advanced → Enable Developer Mode
3. النقر بالزر الأيمن على الرتبة → Copy ID

### 2. التأكد من البوت لديه الصلاحيات

تأكد أن البوت لديه الصلاحيات التالية:
- Manage Roles
- Manage Channels
- Kick Members
- Ban Members
- Manage Messages
- Moderate Members

### 3. اختبار النظام

بعد إضافة الرتب، جرب:
- `!help` - يجب أن يعمل فقط لـ Staff, Moderators, Founders
- `!ping` - يجب أن يعمل فقط لـ Founders
- `!userinfo` - يجب أن يعمل للجميع

---

## هيكل النظام

```
config/
  └── roles.json          ← إعدادات الرتب

utils/
  └── permissions.js      ← نظام الصلاحيات المركزي

events/
  └── messageCreate.js    ← التحقق من الصلاحيات
```

---

## ملاحظات مهمة

1. **Owner = Bot Owner**: الأوامر التي تحتاج `owner` تحتاج أن يكون المستخدم هو مالك البوت (من Discord Application Settings)
2. **الرتب الفارغة**: إذا تركت `owner_role_id` فارغاً، سيتم استخدام Bot Owner فقط
3. **الهرمية**: الرتب الأعلى تمنح تلقائياً صلاحيات الرتب الأدنى

---

## استكشاف الأخطاء

### المستخدم لا يستطيع استخدام أمر معين

1. تأكد أن المستخدم لديه الرتبة الصحيحة
2. تأكد أن معرف الرتبة صحيح في `config/roles.json`
3. تأكد أن البوت يستطيع رؤية الرتبة (رتبة البوت يجب أن تكون أعلى)

### الأوامر لا تعمل على الإطلاق

1. تأكد أن `config/roles.json` موجود وصحيح
2. تحقق من console للأخطاء
3. تأكد أن البوت متصل بالسيرفر

---

## مثال كامل

```json
{
  "owner_role_id": "",
  "founders_role_id": "123456789012345678",
  "moderators_role_id": "234567890123456789",
  "staff_role_id": "345678901234567890"
}
```

في هذا المثال:
- Owner = Bot Owner فقط (لا توجد رتبة owner)
- Founders = الرتبة بالـ ID: 123456789012345678
- Moderators = الرتبة بالـ ID: 234567890123456789
- Staff = الرتبة بالـ ID: 345678901234567890

