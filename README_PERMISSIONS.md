# نظام الصلاحيات - WisdomJebril V3

## الإعداد

### 1. إضافة معرفات الرتب

قم بتحرير الملف `config/roles.json` وأضف معرفات الرتب:

```json
{
  "owner_role_id": "YOUR_OWNER_ROLE_ID_HERE",
  "founders_role_id": "YOUR_FOUNDERS_ROLE_ID_HERE",
  "moderators_role_id": "YOUR_MODERATORS_ROLE_ID_HERE",
  "staff_role_id": "YOUR_STAFF_ROLE_ID_HERE"
}
```

**ملاحظات:**
- `owner_role_id`: اختياري - إذا تركت فارغاً، سيتم استخدام Bot Owner (مالك البوت) فقط
- يمكنك الحصول على معرف الرتبة من Discord عبر تفعيل Developer Mode ثم النقر بالزر الأيمن على الرتبة → Copy ID

### 2. فهم الهرمية

الهرمية من الأعلى إلى الأسفل:
1. **Owner** - مالك البوت (من إعدادات Discord Application)
2. **Founders** - المؤسسون
3. **Moderators** - المدراء
4. **Staff** - الطاقم
5. **Everyone** - الجميع

### 3. قواعد الوصول

- **Owner** لديه وصول لجميع الأوامر
- **Founders** لديهم وصول لـ:
  - جميع أوامر Founders
  - جميع أوامر Moderators
  - جميع أوامر Staff
  - جميع أوامر Everyone
  
- **Moderators** لديهم وصول لـ:
  - جميع أوامر Moderators
  - جميع أوامر Staff
  - جميع أوامر Everyone

- **Staff** لديهم وصول لـ:
  - جميع أوامر Staff
  - جميع أوامر Everyone

- **Everyone** لديهم وصول فقط لـ:
  - أوامر Everyone

---

## توزيع الصلاحيات

### أوامر التعديل

| الأمر | الصلاحيات المطلوبة |
|------|-------------------|
| !ban, !qawed, !QAWED, !tla7 | Founders only |
| !unban | Founders only |
| !banlist | Founders only |
| !kick | Founders only |
| !warn | Moderators + Founders |
| !showwarnings | Moderators + Founders |
| !removewarn | Moderators + Founders |
| !timeout | Moderators + Founders |
| !rtimeout | Moderators + Founders |
| !mute, !skot | Staff + Moderators + Founders |
| !unmute, !hder | Staff + Moderators + Founders |
| !muteall, !skto | Moderators + Founders |
| !unmuteall, !hdro | Moderators + Founders |
| !deafen | Staff + Moderators + Founders |
| !undeafen | Staff + Moderators + Founders |
| !reject | Moderators + Founders |
| !unreject | Moderators + Founders |
| !antispam, !as, !spam | Founders |
| !antitag | Founders |

### أوامر الإدارة

| الأمر | الصلاحيات المطلوبة |
|------|-------------------|
| !lock, !sed | Moderators + Founders |
| !unlock, !fte7 | Moderators + Founders |
| !slowmode | Moderators + Founders |
| !clear, !mse7 | Founders |
| !say | Founders |
| !embed | Founders |
| !announce | Founders |
| !role | Founders |
| !nickname, !nick, !smiya | Staff + Moderators + Founders |
| !nuke | Owner only |

### أوامر المعلومات

| الأمر | الصلاحيات المطلوبة |
|------|-------------------|
| !userinfo | Everyone |
| !server | Everyone |
| !admins | Founders |
| !avatar, !a, !av, !AV | Everyone |
| !banner, !b, !ba | Everyone |
| !ping | Founders |
| !tsara | Everyone |

### أوامر الصوت

| الأمر | الصلاحيات المطلوبة |
|------|-------------------|
| !move | Staff + Moderators + Founders |
| !moveall | Founders |
| !disconnect | Staff + Moderators + Founders |
| !disconnectall | Founders |
| !setupvc | Owner |

### نظام أعياد الميلاد

| الأمر | الصلاحيات المطلوبة |
|------|-------------------|
| !setupbirthdays | Founders |
| !addbirthday, !birthday, !bd | Everyone |
| !birthdays, !bdays | Everyone |
| !removebirthday | Founders |

### أوامر خاصة

| الأمر | الصلاحيات المطلوبة |
|------|-------------------|
| !poll | Everyone |
| !giveaway | Moderators + Founders |
| !tracktimer, !vtrack, !voicetrack, !vtimer | Owner |
| !ja, !janotif, !voicenotif | Owner |
| !setupja | Owner |
| !dm | Moderators + Founders |

### المساعدة والإعدادات

| الأمر | الصلاحيات المطلوبة |
|------|-------------------|
| !help, !commands, !menu | Staff + Moderators + Founders |
| !lmohim | Staff + Moderators + Founders |
| !welcome, !welcometoggle, !wc | Owner |
| !setupapply, !applysetup, !setapply | Owner |

---

## رسائل الخطأ

عند محاولة استخدام أمر بدون صلاحية، سيظهر:
```
⛔ ليس لديك صلاحية لاستعمال هذا الأمر.
```

---

## الملفات المهمة

- `config/roles.json` - ملف إعدادات الرتب
- `utils/permissions.js` - نظام الصلاحيات المركزي
- `events/messageCreate.js` - التحقق من الصلاحيات قبل تنفيذ الأوامر

---

## ملاحظات

1. النظام يعتمد على **الرتب** (Roles) وليس على صلاحيات Discord
2. مالك البوت (Bot Owner) لديه وصول تلقائي لجميع الأوامر
3. إذا لم يكن للمستخدم أي رتبة من الرتب المحددة، فسيكون في مستوى "everyone"
4. الأوامر التي تحتاج `owner` تتطلب أن يكون المستخدم هو مالك البوت (من Discord Application settings)

