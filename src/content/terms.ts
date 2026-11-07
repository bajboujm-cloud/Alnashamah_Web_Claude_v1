/**
 * Terms & Conditions — DRAFT prepared for the owner, to be reviewed by a UAE-licensed lawyer before go-live.
 * Written with UAE Federal Law No. 15 of 2020 (Consumer Protection), Federal Decree-Law No. 14 of 2023
 * (Trade through Modern Technological Means), Federal Decree-Law No. 45 of 2021 (Personal Data Protection)
 * and Federal Decree-Law No. 8 of 2017 (VAT) in mind. Company details come from the admin "Settings".
 * The admin "Pages" editor (Phase 6) will make this text editable without code.
 */
export const TERMS_VERSION = { date: "2026-11-07", en: "7 November 2026", ar: "7 نوفمبر 2026" };

export type Company = {
  nameEn: string;
  nameAr: string;
  licence: string;
  trn: string;
  addressEn: string;
  addressAr: string;
  phone: string;
  email: string;
};

type Section = { title: string; body: (string | string[])[] };

export function termsSections(lang: "ar" | "en", c: Company): Section[] {
  const name =
    lang === "ar" ? c.nameAr || "النشامى لتجارة المواشي" : c.nameEn || "Al Nashamah Livestock Trading";
  const address = lang === "ar" ? c.addressAr : c.addressEn;
  const contact = [c.email, c.phone].filter(Boolean).join(lang === "ar" ? " أو " : " or ");

  if (lang === "ar")
    return [
      {
        title: "1. من نحن",
        body: [
          `يُدار موقع alnashamah.ae من قِبل ${name}، وهي منشأة مرخّصة في دولة الإمارات العربية المتحدة${
            c.licence ? ` (رخصة تجارية رقم ${c.licence})` : ""
          }${c.trn ? `، ورقم التسجيل الضريبي ${c.trn}` : ""}${address ? `، وعنوانها: ${address}` : ""}.`,
          "تنظّم هذه الشروط استخدامك للموقع وجميع الطلبات التي تتم من خلاله. بإتمامك للطلب فإنك توافق عليها.",
        ],
      },
      {
        title: "2. الحساب ورقم الجوال",
        body: [
          "نتحقق من رقم جوالك برمز يُرسل لمرة واحدة. أنت مسؤول عن صحة البيانات التي تقدمها وعن الحفاظ على سرية هاتفك والرموز المرسلة إليه.",
          "يجب أن يكون عمرك 18 عاماً على الأقل لإتمام الطلب، أو أن يتم الطلب بموافقة ولي الأمر.",
        ],
      },
      {
        title: "3. المواشي والصور والأوزان",
        body: [
          "كل حيوان فريد بطبيعته؛ الصور المعروضة توضيحية لسلالة الحيوان وقد يختلف الحيوان الذي تستلمه في الشكل واللون.",
          "الأعمار والأوزان المذكورة نطاقات تقريبية. الوزن المذكور هو الوزن التقريبي بعد الذبح، وقد يختلف ضمن النطاق المعلن بسبب الاختلافات الطبيعية بين الحيوانات.",
        ],
      },
      {
        title: "4. الأسعار وضريبة القيمة المضافة",
        body: [
          "جميع الأسعار بالدرهم الإماراتي وتشمل ضريبة القيمة المضافة بنسبة 5% ما لم يُذكر خلاف ذلك، ونُصدر لك فاتورة ضريبية لكل طلب مدفوع.",
          "قد تتغير الأسعار من وقت لآخر، لكن سعر طلبك المؤكد لا يتغير. في حال وجود خطأ واضح في السعر سنتواصل معك، ويحق لك إلغاء الطلب واسترداد كامل المبلغ.",
          "التوصيل مشمول في السعر ما لم يظهر لك خلاف ذلك قبل الدفع.",
        ],
      },
      {
        title: "5. الطلب وتأكيده",
        body: [
          "يُعدّ الطلب مؤكداً بعد نجاح عملية الدفع ووصول رسالة التأكيد إليك.",
          "قد نعتذر عن تنفيذ الطلب إذا لم يعد الحيوان أو الخيار المطلوب متوفراً، وفي هذه الحالة نعرض عليك بديلاً مناسباً أو نردّ إليك كامل المبلغ.",
        ],
      },
      {
        title: "6. الذبح والأضاحي والعقيقة",
        body: [
          "يتم الذبح وفق أحكام الشريعة الإسلامية في مسالخ مرخّصة ووفق أنظمة الجهات الحكومية المختصة، وبعد فحص الحيوان.",
          [
            "يجب أن تبلغ الأضحية والعقيقة السن الشرعي المطلوب (مثلاً: 6 أشهر فأكثر للضأن و12 شهراً فأكثر للماعز)، ولا يقبل الموقع الأحجام الأصغر لهذه المناسبات.",
            "لا تشمل أضاحي عيد الأضحى الرأس والمصران والكرش حسب أنظمة وتعليمات المسالخ الحكومية.",
            "تُذبح الأضاحي خلال أيام العيد وفق جدول المسلخ، ونسجّل اسم من تُذبح عنه كما تكتبه في الطلب.",
          ],
        ],
      },
      {
        title: "7. التوصيل والاستلام",
        body: [
          "نوصّل في التاريخ والوقت الذي تختاره قدر الإمكان، وقد تتأخر المواعيد بسبب الازدحام أو ضغط المسالخ خصوصاً في المواسم والأعياد، وسنخبرك بذلك.",
          "يرجى التأكد من صحة العنوان وموقع الدبوس على الخريطة ووجود من يستلم الطلب. إذا تعذّر التسليم نتواصل معك لترتيب موعد آخر.",
          "يمكنك اختيار الاستلام من المحل عند توفّر هذا الخيار. تنتقل مسؤولية الطلب إليك عند التسليم، ويجب حفظ اللحم مبرّداً فور استلامه.",
        ],
      },
      {
        title: "8. الإلغاء والتعديل",
        body: [
          "يمكنك إلغاء الطلب أو تعديل التقطيع والتغليف دون أي رسوم قبل بدء الذبح، ونردّ إليك كامل المبلغ عند الإلغاء.",
          "بعد بدء الذبح لا يمكن إلغاء الطلب، لأن اللحم منتج قابل للتلف ويُجهّز حسب اختيارك، وذلك وفق الاستثناءات التي يقرّها قانون حماية المستهلك للسلع سريعة التلف والمجهزة حسب الطلب.",
        ],
      },
      {
        title: "9. الجودة والاسترداد",
        body: [
          "إذا وجدت مشكلة في الطلب (مثل نقص أو اختلاف عن المطلوب أو مشكلة في الجودة) يرجى إبلاغنا خلال 24 ساعة من الاستلام مع صور توضيحية.",
          "بعد التحقق نعرض عليك الاستبدال أو الاسترداد الكامل أو الجزئي حسب الحالة. يُعاد المبلغ إلى وسيلة الدفع الأصلية خلال 14 يوماً من الموافقة، وقد تختلف مدة ظهوره حسب البنك.",
        ],
      },
      {
        title: "10. الدفع",
        body: [
          "تتم المدفوعات عبر بوابة دفع آمنة ومرخّصة، ولا نحتفظ ببيانات بطاقتك لدينا. لا يبدأ تجهيز الطلب قبل تأكيد الدفع.",
        ],
      },
      {
        title: "11. الخصوصية وحماية البيانات",
        body: [
          "نجمع فقط البيانات اللازمة لتنفيذ طلبك (الاسم، رقم الجوال، العنوان وموقعه، والبريد الإلكتروني اختيارياً)، ونستخدمها لتنفيذ الطلب وإصدار الفاتورة وإرسال التحديثات، وفق المرسوم بقانون اتحادي رقم 45 لسنة 2021 بشأن حماية البيانات الشخصية.",
          `لا نبيع بياناتك لأي جهة. يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها${contact ? ` بالتواصل معنا على ${contact}` : ""}، مع مراعاة ما يلزمنا القانون بالاحتفاظ به (مثل الفواتير الضريبية).`,
        ],
      },
      {
        title: "12. حدود المسؤولية",
        body: [
          "في حدود ما يسمح به القانون، لا نتحمل المسؤولية عن الأضرار غير المباشرة. لا يحدّ أي شيء في هذه الشروط من حقوقك بموجب القانون الاتحادي رقم 15 لسنة 2020 بشأن حماية المستهلك.",
        ],
      },
      {
        title: "13. الظروف القاهرة",
        body: [
          "لا نُعدّ مخلّين بالتزاماتنا إذا تأخر التنفيذ أو تعذّر بسبب ظروف خارجة عن إرادتنا، مثل الأحوال الجوية أو الأوبئة الحيوانية أو القرارات الحكومية أو إغلاق المسالخ. في هذه الحالات نعرض عليك موعداً بديلاً أو استرداد المبلغ.",
        ],
      },
      {
        title: "14. تعديل الشروط",
        body: [
          "قد نحدّث هذه الشروط من وقت لآخر وننشر النسخة الجديدة على هذه الصفحة مع تاريخها. تخضع طلباتك للشروط السارية وقت تقديمها.",
        ],
      },
      {
        title: "15. القانون الواجب التطبيق",
        body: [
          "تخضع هذه الشروط لقوانين دولة الإمارات العربية المتحدة، وتختص محاكم الإمارة التي تقع فيها منشأتنا المرخّصة بالنظر في أي نزاع، دون الإخلال بحقك في التقدم بشكوى إلى جهات حماية المستهلك المختصة.",
        ],
      },
      {
        title: "16. تواصل معنا",
        body: [
          contact
            ? `لأي استفسار أو شكوى تواصل معنا على ${contact}، أو عبر واتساب من زر التواصل في الموقع.`
            : "لأي استفسار أو شكوى تواصل معنا عبر واتساب من زر التواصل في الموقع.",
        ],
      },
    ];

  return [
    {
      title: "1. Who we are",
      body: [
        `alnashamah.ae is operated by ${name}, a business licensed in the United Arab Emirates${
          c.licence ? ` (trade licence no. ${c.licence})` : ""
        }${c.trn ? `, Tax Registration Number ${c.trn}` : ""}${address ? `, located at ${address}` : ""}.`,
        "These terms govern your use of the website and every order placed through it. By placing an order you agree to them.",
      ],
    },
    {
      title: "2. Your account and mobile number",
      body: [
        "We verify your mobile number with a one-time code. You are responsible for the accuracy of your details and for keeping your phone and the codes sent to it private.",
        "You must be at least 18 years old to place an order, or order with a parent's or guardian's consent.",
      ],
    },
    {
      title: "3. Animals, photos and weights",
      body: [
        "Every animal is unique. Photos show the breed and are for illustration; the animal you receive may differ in appearance and colour.",
        "Ages and weights are approximate ranges. The weight shown is the approximate weight after slaughter and may vary within the stated range because of natural differences between animals.",
      ],
    },
    {
      title: "4. Prices and VAT",
      body: [
        "All prices are in UAE dirhams (AED) and include 5% VAT unless stated otherwise. We issue a tax invoice for every paid order.",
        "Prices may change from time to time, but the price of a confirmed order does not. If there is an obvious pricing error we will contact you, and you may cancel for a full refund.",
        "Delivery is included in the price unless a delivery fee is shown to you before payment.",
      ],
    },
    {
      title: "5. Orders and confirmation",
      body: [
        "Your order is confirmed once payment succeeds and you receive our confirmation.",
        "We may decline an order if the animal or option is no longer available; we will then offer you a suitable alternative or a full refund.",
      ],
    },
    {
      title: "6. Slaughter, Udhiyah and Aqiqah",
      body: [
        "Animals are slaughtered according to Islamic Sharia in licensed slaughterhouses, following the rules of the competent government authorities, after inspection.",
        [
          "An Udhiyah or Aqiqah must reach the required age (for example, 6 months or older for sheep and 12 months or older for goats); the website does not accept younger sizes for these occasions.",
          "Eid Al-Adha sacrifices do not include the head, intestines or tripe, in line with government slaughterhouse regulations.",
          "Udhiyah animals are slaughtered during the days of Eid according to the slaughterhouse schedule, and we record the name it is offered on behalf of exactly as you enter it.",
        ],
      ],
    },
    {
      title: "7. Delivery and pick-up",
      body: [
        "We deliver on the date and time you choose wherever possible. Times may be delayed by traffic or slaughterhouse demand, especially during seasons and Eid; we will keep you informed.",
        "Please make sure your address and map pin are correct and that someone is available to receive the order. If delivery is not possible we will contact you to arrange another time.",
        "Where offered, you may pick up from our shop instead. Responsibility for the order passes to you on handover; meat must be refrigerated straight away.",
      ],
    },
    {
      title: "8. Cancellations and changes",
      body: [
        "You may cancel, or change the cutting and packaging, free of charge before slaughter begins; cancellations are refunded in full.",
        "Once slaughter has begun the order cannot be cancelled, because meat is perishable and prepared to your instructions — in line with the exceptions the Consumer Protection Law allows for perishable and made-to-order goods.",
      ],
    },
    {
      title: "9. Quality issues and refunds",
      body: [
        "If something is wrong with your order (missing items, not what you ordered, or a quality problem), please tell us within 24 hours of receiving it, with photos.",
        "After checking, we will offer a replacement or a full or partial refund as appropriate. Refunds go back to the original payment method within 14 days of approval; your bank may take longer to show them.",
      ],
    },
    {
      title: "10. Payment",
      body: [
        "Payments are processed by a secure, licensed payment gateway; we never store your card details. Orders are prepared only after payment is confirmed.",
      ],
    },
    {
      title: "11. Privacy and data protection",
      body: [
        "We collect only what we need to fulfil your order (name, mobile number, address and map location, and optionally your email) and use it to deliver, invoice and update you, in line with Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data.",
        `We never sell your data. You may ask to see, correct or delete your data${contact ? ` by contacting ${contact}` : ""}, subject to records we must keep by law (such as tax invoices).`,
      ],
    },
    {
      title: "12. Liability",
      body: [
        "To the extent permitted by law we are not liable for indirect losses. Nothing in these terms limits your rights under Federal Law No. 15 of 2020 on Consumer Protection.",
      ],
    },
    {
      title: "13. Events outside our control",
      body: [
        "We are not in breach if an order is delayed or cannot be fulfilled because of events outside our control, such as weather, animal disease outbreaks, government decisions or slaughterhouse closures. We will then offer you a new date or a refund.",
      ],
    },
    {
      title: "14. Changes to these terms",
      body: [
        "We may update these terms from time to time and will publish the new version on this page with its date. Your order is governed by the terms in force when you placed it.",
      ],
    },
    {
      title: "15. Governing law",
      body: [
        "These terms are governed by the laws of the United Arab Emirates. The courts of the emirate in which our business is licensed have jurisdiction over any dispute, without affecting your right to complain to the competent consumer protection authorities.",
      ],
    },
    {
      title: "16. Contact us",
      body: [
        contact
          ? `For any question or complaint, contact us at ${contact}, or on WhatsApp using the button on the website.`
          : "For any question or complaint, contact us on WhatsApp using the button on the website.",
      ],
    },
  ];
}
