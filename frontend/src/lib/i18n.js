import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const EN = {
  "الرئيسية": "Home", "من نحن": "About Us", "خدماتنا": "Our Services", "مشاريعنا": "Our Projects", "نماذج التنفيذ": "Delivery Models",
  "تواصل معنا": "Contact Us", "ابدأ مشروعك": "Start your project", "إغلاق القائمة": "Close menu", "فتح القائمة": "Open menu",
  "شعار الشركة": "Company logo", "روابط سريعة": "Quick links", "لوحة التحكم الإدارية": "Admin dashboard",
  "لينكدإن": "LinkedIn", "إكس (تويتر)": "X (Twitter)", "إنستغرام": "Instagram", "جيت هب": "GitHub",
  "لم تُضف بيانات التواصل بعد — يمكن للمسؤول إضافتها من لوحة التحكم.": "Contact details have not been added yet. The site administrator can add them from the dashboard.",
  "جارٍ التحميل…": "Loading…", "تجريبي": "Demo",
  "هذا عنصر تجريبي يمكن للمسؤول تعديله أو استبداله من لوحة التحكم": "This is a demo item that the administrator can edit or replace from the dashboard",
  "اعرف المزيد": "Learn more", "تفاصيل المشروع": "Project details",
  "أرسل استفسارك أو متطلباتك إلى بريدنا الرسمي وسنرد عليك في أقرب وقت.": "Send your inquiry or requirements to our official email and we will reply as soon as possible.",
  "أسلوب عمل مرحلي يوضح لك موقع مشروعك من الخطة في أي وقت، دون مفاجآت.": "A phased way of working that shows you where your project stands against the plan at any time, with no surprises.",
  "أعمالنا": "Our Work", "أمان وخصوصية": "Security & privacy", "أهداف المشروع": "Project goals", "إغلاق العرض": "Close preview",
  "اختبارات شاملة للأداء والأمان قبل التسليم": "Comprehensive performance and security testing before delivery",
  "استعرض قائمة الخدمات التقنية التي تقدمها شركة 2Morro Technically Solutions: التطوير، الحلول السحابية، الأمن السيبراني، تحليل البيانات والمزيد.": "Browse the technology services offered by 2Morro Technically Solutions: development, cloud solutions, cybersecurity, data analytics and more.",
  "استعرض معرض أعمال 2Morro Technically Solutions: مشاريع وأنظمة وحلول رقمية نماذج منها تعكس منهجيتنا في التنفيذ.": "Explore the 2Morro Technically Solutions portfolio: projects, systems and digital solutions that reflect our delivery methodology.",
  "استعرض نماذج التنفيذ التي توضح منهجيتنا في إدارة المشاريع.": "Explore the delivery models that show our project management methodology.",
  "استعرض نماذج التنفيذ كاملة": "View all delivery models", "استكشاف الخدمات": "Explore services", "استكشف خدماتنا": "Explore our services",
  "افتح المحادثة": "Open chat", "افتح تطبيق البريد": "Open email app",
  "افتح محادثة مباشرة مع فريقنا على واتساب خلال ساعات العمل.": "Start a direct chat with our team on WhatsApp during business hours.",
  "التزام بالمعايير المتفق عليها في كل تفاصيل المشروع، من أول سطر كود حتى التسليم النهائي.": "Commitment to the agreed standards in every detail of the project, from the first line of code to final delivery.",
  "التزام صارم بالجودة": "Strict commitment to quality", "التقنيات المستخدمة": "Technologies used",
  "الجودة ليست مرحلة… بل أسلوب عمل": "Quality isn't a phase… it's how we work", "الجودة والتنفيذ": "Quality & delivery",
  "الخدمات المعروضة حاليًا بيانات تجريبية معلَّمة بوضوح، ويمكن للمسؤول تعديلها أو استبدالها بالكامل من لوحة التحكم.": "The services currently shown are clearly marked demo data, and the administrator can edit or fully replace them from the dashboard.",
  "الخدمة | 2Morro Technically Solutions": "Service | 2Morro Technically Solutions", "الخدمة المرتبطة": "Related service",
  "الخدمة غير موجودة": "Service not found", "الصفحة المطلوبة غير موجودة.": "The requested page does not exist.",
  "الصفحة غير موجودة | 2Morro Technically Solutions": "Page not found | 2Morro Technically Solutions",
  "العودة إلى الخدمات": "Back to services", "العودة إلى الرئيسية": "Back to home", "العودة إلى المشاريع": "Back to projects", "الكل": "All",
  "المشاريع المعروضة حاليًا بيانات تجريبية معلَّمة بوضوح لأغراض العرض، ولم تُعتمد بعد كأعمال منفذة رسميًا. يمكن للمسؤول استبدالها من لوحة التحكم.": "The projects currently shown are clearly marked demo data for display purposes and are not yet confirmed as officially delivered work. The administrator can replace them from the dashboard.",
  "المشروع | 2Morro Technically Solutions": "Project | 2Morro Technically Solutions", "المشروع غير موجود": "Project not found",
  "النماذج المعروضة أمثلة توضيحية لأسلوب العمل ولم يُعتمد بعضها رسميًا بعد — يمكن للمسؤول تعديلها وإدارتها من لوحة التحكم.": "The models shown are illustrative examples of how we work and some are not yet officially approved. The administrator can edit and manage them from the dashboard.",
  "بنية تحتية تقنية متطورة": "Advanced technical infrastructure", "تابعنا على منصات التواصل": "Follow us on social media",
  "تحليل · تطوير · دعم": "Analysis · Development · Support", "تحليل دقيق للمتطلبات قبل بدء التنفيذ": "Precise requirements analysis before execution starts",
  "تعذر نسخ البريد، يرجى نسخه يدويًا": "Couldn't copy the email, please copy it manually", "تم النسخ": "Copied",
  "تنفيذ على مراحل مع نقاط مراجعة واضحة": "Phased delivery with clear review points", "تواصل عبر واتساب": "Chat on WhatsApp",
  "تواصل مع شركة 2Morro Technically Solutions عبر واتساب أو البريد الإلكتروني الرسمي.": "Contact 2Morro Technically Solutions through WhatsApp or our official email.",
  "تواصل معنا | 2Morro Technically Solutions": "Contact Us | 2Morro Technically Solutions",
  "تواصل معنا اليوم ونناقش معك كيف يمكن لحلولنا التقنية أن تخدم أهداف أعمالك.": "Contact us today and let's discuss how our technology solutions can serve your business goals.",
  "تواصل معنا لمناقشة مشروعك القادم.": "Contact us to discuss your next project.",
  "تواصل معنا مباشرة لمناقشة متطلباتك وسنكون سعداء بالإجابة على استفساراتك.": "Contact us directly to discuss your requirements. We'll be happy to answer your questions.",
  "جميع الخدمات": "All services", "جميع المشاريع": "All projects", "جودة التنفيذ": "Delivery quality",
  "حلول تقنية تغطي احتياجات أعمالك": "Technology solutions covering your business needs", "حلول تقنية متخصصة لكل احتياج": "Specialized technology solutions for every need",
  "دعم فني متواصل": "Continuous technical support", "دعم ومتابعة بعد التشغيل": "Support and follow-up after launch",
  "رؤيتنا": "Our Vision", "راسلنا عبر البريد": "Email us",
  "ربما تم حذف هذا المشروع أو إخفاؤه من النشر.": "This project may have been deleted or unpublished.",
  "ربما تم حذف هذه الخدمة أو إخفاؤها من النشر.": "This service may have been deleted or unpublished.",
  "ربما تم نقل الصفحة أو حذفها، أو أن الرابط المدخل غير صحيح. يمكنك العودة إلى الصفحة الرئيسية واستكشاف بقية الأقسام.": "The page may have been moved or deleted, or the link is incorrect. You can go back to the home page and explore the other sections.",
  "رحلة واضحة من الفكرة إلى التشغيل": "A clear journey from idea to launch", "رسالتنا": "Our Mission", "زيارة الرابط الخارجي": "Visit external link",
  "سيتم عرض الخدمات هنا بمجرد نشرها من لوحة التحكم الإدارية.": "Services will appear here once they are published from the admin dashboard.",
  "سيتم عرض المشاريع هنا بمجرد نشرها من لوحة التحكم الإدارية.": "Projects will appear here once they are published from the admin dashboard.",
  "سيتم عرض نماذج التنفيذ هنا بمجرد نشرها من لوحة التحكم الإدارية.": "Delivery models will appear here once they are published from the admin dashboard.",
  "شاشة تعرض شيفرة برمجية لمشروع تقني": "A screen showing source code for a technology project", "شراكة طويلة الأمد": "Long-term partnership",
  "شركة حلول تقنية متكاملة": "Integrated technology solutions company", "شريك تقني يفهم أعمالك قبل أن يكتب سطر كود": "A technology partner that understands your business before writing a line of code",
  "صفحة التواصل": "Contact page", "صورة مكبرة من المشروع": "Enlarged project image", "عذرًا… الصفحة التي تبحث عنها غير موجودة": "Sorry… the page you're looking for doesn't exist",
  "عرض الصورة بحجم أكبر": "View larger image", "عن المشروع": "About the project", "فريق 2Morro Technically Solutions": "The 2Morro Technically Solutions team",
  "فريق تقني يعمل بمنهجية واضحة وشغف حقيقي بالجودة": "A technology team with a clear methodology and a real passion for quality",
  "فريق تقني يعمل على حلول رقمية": "A technology team working on digital solutions", "قيمنا المهنية": "Our professional values",
  "لا توجد خدمات منشورة حاليًا": "No published services yet", "لا توجد مشاريع منشورة حاليًا": "No published projects yet", "لا توجد نماذج تنفيذ منشورة حاليًا": "No published delivery models yet",
  "لا نسلّم المشروع ونختفي؛ نبقى شريك دعم وتطوير مع نمو أعمالك.": "We don't deliver and disappear; we stay your support and development partner as your business grows.",
  "لم تُضف التفاصيل الكاملة لهذه الخدمة بعد.": "Full details for this service haven't been added yet.",
  "لم تُضف بيانات التواصل الرسمية بعد — يمكن لمسؤول الموقع إضافة رابط واتساب والبريد الإلكتروني وحسابات التواصل من لوحة التحكم.": "Official contact details haven't been added yet. The site administrator can add WhatsApp, email and social accounts from the dashboard.",
  "لم تُعتمد الرؤية بعد — يمكن للمسؤول إضافتها من لوحة التحكم.": "The vision hasn't been approved yet. The administrator can add it from the dashboard.",
  "لم تُعتمد الرسالة بعد — يمكن للمسؤول إضافتها من لوحة التحكم.": "The mission hasn't been approved yet. The administrator can add it from the dashboard.",
  "لماذا نحن؟": "Why us?", "مبادئ تحكم كل مشروع ننفذه": "Principles that guide every project we deliver",
  "مجموعة متكاملة من الخدمات التقنية الاحترافية التي نصممها ونطورها ونشغّلها لأجل أعمال عملائنا.": "A complete range of professional technology services that we design, develop and operate for our clients' businesses.",
  "مخرجات المشروع": "Project outputs", "مرحبًا، أود الاستفسار عن خدماتكم": "Hello, I'd like to ask about your services", "مرحبًا، أود التواصل معكم": "Hello, I'd like to get in touch",
  "مزايا الخدمة والمخرجات": "Service features & outputs", "مسار التنقل": "Breadcrumb", "مشاريع مختارة": "Selected projects", "مشاريع مرتبطة بهذه الخدمة": "Projects related to this service",
  "مشاريعنا | 2Morro Technically Solutions": "Our Projects | 2Morro Technically Solutions", "معرض أعمال يعكس جودة التنفيذ": "A portfolio that reflects the quality of our delivery", "معرض الصور": "Image gallery",
  "ممارسات أمنية مدروسة تحمي بياناتك وبيانات عملائك في كل مراحل العمل.": "Well-considered security practices that protect your data and your customers' data at every stage.",
  "من التحليل حتى الدعم": "From analysis to support",
  "من التصميم والتطوير إلى التشغيل والدعم، نقدم مجموعة متكاملة من الخدمات التقنية الاحترافية.": "From design and development to operation and support, we offer a complete range of professional technology services.",
  "من الفكرة إلى التشغيل": "From idea to launch", "من نحن؟": "Who are we?", "منهجية العمل": "Methodology", "منهجية تنفيذ واضحة": "A clear delivery methodology",
  "منهجية عمل مرحلية… من التحليل إلى الدعم": "A phased methodology… from analysis to support", "منهجية مرحلية واضحة": "A clear phased methodology", "منهجية واضحة": "Clear methodology",
  "مهتم بهذه الخدمة؟": "Interested in this service?",
  "نؤمن أن الحل التقني الناجح يبدأ من فهم عميق لطبيعة نشاطك وأهدافك، ثم يُبنى بمنهجية منظمة وجودة ملتزمة بها.": "We believe a successful technology solution starts with a deep understanding of your business and goals, then is built with an organized methodology and committed quality.",
  "نبذة عن الشركة": "About the company", "نبني حلولاً تقنية تدفع أعمالك إلى الأمام": "We build technology solutions that move your business forward",
  "نستقبل استفساراتك وطلباتك مباشرة عبر واتساب والبريد الإلكتروني الرسميين.": "Reach us directly through our official WhatsApp and email.", "نسخ البريد": "Copy email",
  "نماذج التنفيذ | 2Morro Technically Solutions": "Delivery Models | 2Morro Technically Solutions",
  "نماذج تنفيذ الأعمال في 2Morro Technically Solutions: مراحل تنفيذ المشاريع والمخرجات المتوقعة ومدد التنفيذ التقريبية.": "Delivery models at 2Morro Technically Solutions: project phases, expected outputs and approximate durations.",
  "نماذج توضح أسلوبنا في تنفيذ المشاريع وإدارة مراحل العمل والمخرجات المتوقعة من كل مرحلة.": "Models that show how we deliver projects, manage work phases and the outputs expected from each phase.",
  "نماذج من المشاريع والحلول التي صممناها وطوّرناها، مصنفة حسب نوع الحل التقني.": "Examples of projects and solutions we have designed and developed, grouped by type of solution.",
  "نماذج من طبيعة الحلول التي نصممها ونطورها لعملائنا.": "Examples of the kind of solutions we design and develop for our clients.",
  "هل أعجبك هذا المشروع؟": "Like this project?", "هل تريد التعرف على طريقة عملنا؟": "Want to see how we work?",
  "هل لديك فكرة مشروع تقني؟ لنحوّلها إلى واقع": "Have a technology project idea? Let's make it real", "يسعدنا تواصلك معنا": "We'd love to hear from you",
  "2Morro Technically Solutions | حلول تقنية متكاملة": "2Morro Technically Solutions | Integrated Technology Solutions",
  "{name} | مشاريع 2Morro Technically Solutions": "{name} | 2Morro Technically Solutions Projects",
  "خدماتنا | 2Morro Technically Solutions": "Our Services | 2Morro Technically Solutions",
  "من نحن | {name}": "About Us | {name}",
  "صورة من مشروع {name} - {n}": "Image from {name} project - {n}", "عرض الصورة {n}": "View image {n}",
  "مرحبًا، أود الاستفسار عن خدمة: {name}": "Hello, I'd like to ask about the service: {name}",
  "مرحبًا، شاهدت مشروع «{name}» وأود الاستفسار عن خدمات مشابهة": "Hello, I saw the \"{name}\" project and would like to ask about similar services",
  "أُنشئ في {date}": "Created on {date}", " • آخر تحديث {date}": " • Last updated {date}",
  "جميع الحقوق محفوظة": "All rights reserved", "المدة": "Duration", "مراحل التنفيذ": "Delivery phases", "المراحل": "Phases", "المخرجات": "Outputs", "المخرجات المتوقعة": "Expected outputs",
  "English": "English", "العربية": "العربية",
};

let currentLang = (typeof window !== "undefined" && window.localStorage.getItem("site_lang")) === "en" ? "en" : "ar";

export function getLang() {
  return currentLang;
}

export function t(text, params) {
  let out = currentLang === "en" ? EN[text] ?? text : text;
  if (params) Object.entries(params).forEach(([k, v]) => { out = out.replaceAll(`{${k}}`, v ?? ""); });
  return out;
}

export function tr(obj, field) {
  if (!obj) return currentLang === "en" ? "" : undefined;
  if (currentLang === "en") {
    const v = obj.en?.[field];
    if (Array.isArray(v) ? v.length : v) return v;
  }
  return obj[field];
}

export function trPage(settings, page, field) {
  const p = settings?.pages?.[page];
  if (!p) return "";
  return (currentLang === "en" && p[`${field}_en`]) || p[field] || "";
}

const LangContext = createContext({ lang: "ar", setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(currentLang);
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const effective = isAdmin ? "ar" : lang;
    document.documentElement.lang = effective;
    document.documentElement.dir = effective === "en" ? "ltr" : "rtl";
  }, [lang, isAdmin]);

  const setLang = (l) => {
    currentLang = l;
    window.localStorage.setItem("site_lang", l);
    setLangState(l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <div key={lang} className="contents">{children}</div>
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
