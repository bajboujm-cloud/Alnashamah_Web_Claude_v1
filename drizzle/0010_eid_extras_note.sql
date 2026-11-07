-- Message customers see when "Order includes" items are switched off (during Eid the government
-- slaughterhouses don't return head, intestines or tripe). Editable in Admin → Order includes.
UPDATE "extras"
SET "unavailable_note_en" = 'Not available during Eid Al-Adha due to government slaughterhouse regulations.',
    "unavailable_note_ar" = 'غير متاح خلال عيد الأضحى حسب أنظمة وتعليمات المسالخ الحكومية.'
WHERE "unavailable_note_en" = '' AND "unavailable_note_ar" = '';
