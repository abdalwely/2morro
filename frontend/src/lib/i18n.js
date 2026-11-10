import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const EN = {
  "تصور مقترح": "Proposed concept", "الأسماء والمنظومات التقنية المعروضة أمثلة على تقنيات يمكن العمل معها حسب نطاق المشروع، ولا تعني وجود شراكة أو اعتماد رسمي.": "The listed names and technology ecosystems are examples of technologies that may be used depending on project scope; they do not imply an official partnership or certification.",
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
  "استعرض قائمة الخدمات التقنية التي تقدمها شركة 2Morro Technology Solutions: التطوير، الحلول السحابية، الأمن السيبراني، تحليل البيانات والمزيد.": "Browse the technology services offered by 2Morro Technology Solutions: development, cloud solutions, cybersecurity, data analytics and more.",
  "استعرض معرض أعمال 2Morro Technology Solutions: مشاريع وأنظمة وحلول رقمية نماذج منها تعكس منهجيتنا في التنفيذ.": "Explore the 2Morro Technology Solutions portfolio: projects, systems and digital solutions that reflect our delivery methodology.",
  "استعرض نماذج التنفيذ التي توضح منهجيتنا في إدارة المشاريع.": "Explore the delivery models that show our project management methodology.",
  "استعرض نماذج التنفيذ كاملة": "View all delivery models", "استكشاف الخدمات": "Explore services", "استكشف خدماتنا": "Explore our services",
  "افتح المحادثة": "Open chat", "افتح تطبيق البريد": "Open email app",
  "افتح محادثة مباشرة مع فريقنا على واتساب خلال ساعات العمل.": "Start a direct chat with our team on WhatsApp during business hours.",
  "التزام بالمعايير المتفق عليها في كل تفاصيل المشروع، من أول سطر كود حتى التسليم النهائي.": "Commitment to the agreed standards in every detail of the project, from the first line of code to final delivery.",
  "التزام صارم بالجودة": "Strict commitment to quality", "التقنيات المستخدمة": "Technologies used",
  "الجودة ليست مرحلة… بل أسلوب عمل": "Quality isn't a phase… it's how we work", "الجودة والتنفيذ": "Quality & delivery",
  "الخدمات المعروضة حاليًا بيانات تجريبية معلَّمة بوضوح، ويمكن للمسؤول تعديلها أو استبدالها بالكامل من لوحة التحكم.": "The services currently shown are clearly marked demo data, and the administrator can edit or fully replace them from the dashboard.",
  "الخدمة | 2Morro Technology Solutions": "Service | 2Morro Technology Solutions", "الخدمة المرتبطة": "Related service",
  "الخدمة غير موجودة": "Service not found", "الصفحة المطلوبة غير موجودة.": "The requested page does not exist.",
  "الصفحة غير موجودة | 2Morro Technology Solutions": "Page not found | 2Morro Technology Solutions",
  "العودة إلى الخدمات": "Back to services", "العودة إلى الرئيسية": "Back to home", "العودة إلى المشاريع": "Back to projects", "الكل": "All",
  "المشاريع المعروضة حاليًا بيانات تجريبية معلَّمة بوضوح لأغراض العرض، ولم تُعتمد بعد كأعمال منفذة رسميًا. يمكن للمسؤول استبدالها من لوحة التحكم.": "The projects currently shown are clearly marked demo data for display purposes and are not yet confirmed as officially delivered work. The administrator can replace them from the dashboard.",
  "المشروع | 2Morro Technology Solutions": "Project | 2Morro Technology Solutions", "المشروع غير موجود": "Project not found",
  "النماذج المعروضة أمثلة توضيحية لأسلوب العمل ولم يُعتمد بعضها رسميًا بعد — يمكن للمسؤول تعديلها وإدارتها من لوحة التحكم.": "The models shown are illustrative examples of how we work and some are not yet officially approved. The administrator can edit and manage them from the dashboard.",
  "بنية تحتية تقنية متطورة": "Advanced technical infrastructure", "تابعنا على منصات التواصل": "Follow us on social media",
  "تحليل · تطوير · دعم": "Analysis · Development · Support", "تحليل دقيق للمتطلبات قبل بدء التنفيذ": "Precise requirements analysis before execution starts",
  "تعذر نسخ البريد، يرجى نسخه يدويًا": "Couldn't copy the email, please copy it manually", "تم النسخ": "Copied",
  "تنفيذ على مراحل مع نقاط مراجعة واضحة": "Phased delivery with clear review points", "تواصل عبر واتساب": "Chat on WhatsApp",
  "تواصل مع شركة 2Morro Technology Solutions عبر واتساب أو البريد الإلكتروني الرسمي.": "Contact 2Morro Technology Solutions through WhatsApp or our official email.",
  "تواصل معنا | 2Morro Technology Solutions": "Contact Us | 2Morro Technology Solutions",
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
  "عرض الصورة بحجم أكبر": "View larger image", "عن المشروع": "About the project", "فريق 2Morro Technology Solutions": "The 2Morro Technology Solutions team",
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
  "مشاريعنا | 2Morro Technology Solutions": "Our Projects | 2Morro Technology Solutions", "معرض أعمال يعكس جودة التنفيذ": "A portfolio that reflects the quality of our delivery", "مجالات المشاريع ونماذج العرض": "Project Categories & Demo Showcases", "تصنيفات مجالات المشاريع الواردة في الملف التعريفي، مع نماذج عرض تجريبية توضح شكل المحتوى قبل إضافة دراسات حالة موثقة.": "Project categories from the company profile, with illustrative demo showcases to preview the content layout before verified case studies are added.", "معرض الصور": "Image gallery",
  "ممارسات أمنية مدروسة تحمي بياناتك وبيانات عملائك في كل مراحل العمل.": "Well-considered security practices that protect your data and your customers' data at every stage.",
  "من التحليل حتى الدعم": "From analysis to support",
  "من التصميم والتطوير إلى التشغيل والدعم، نقدم مجموعة متكاملة من الخدمات التقنية الاحترافية.": "From design and development to operation and support, we offer a complete range of professional technology services.",
  "من الفكرة إلى التشغيل": "From idea to launch", "من نحن؟": "Who are we?", "منهجية العمل": "Methodology", "منهجية تنفيذ واضحة": "A clear delivery methodology",
  "منهجية عمل مرحلية… من التحليل إلى الدعم": "A phased methodology… from analysis to support", "منهجية مرحلية واضحة": "A clear phased methodology", "منهجية واضحة": "Clear methodology",
  "مهتم بهذه الخدمة؟": "Interested in this service?",
  "نؤمن أن الحل التقني الناجح يبدأ من فهم عميق لطبيعة نشاطك وأهدافك، ثم يُبنى بمنهجية منظمة وجودة ملتزمة بها.": "We believe a successful technology solution starts with a deep understanding of your business and goals, then is built with an organized methodology and committed quality.",
  "نبذة عن الشركة": "About the company", "نبني حلولاً تقنية تدفع أعمالك إلى الأمام": "We build technology solutions that move your business forward",
  "نستقبل استفساراتك وطلباتك مباشرة عبر واتساب والبريد الإلكتروني الرسميين.": "Reach us directly through our official WhatsApp and email.", "نسخ البريد": "Copy email",
  "نماذج التنفيذ | 2Morro Technology Solutions": "Delivery Models | 2Morro Technology Solutions",
  "نماذج تنفيذ الأعمال في 2Morro Technology Solutions: مراحل تنفيذ المشاريع والمخرجات المتوقعة ومدد التنفيذ التقريبية.": "Delivery models at 2Morro Technology Solutions: project phases, expected outputs and approximate durations.",
  "نماذج توضح أسلوبنا في تنفيذ المشاريع وإدارة مراحل العمل والمخرجات المتوقعة من كل مرحلة.": "Models that show how we deliver projects, manage work phases and the outputs expected from each phase.",
  "نماذج من المشاريع والحلول التي صممناها وطوّرناها، مصنفة حسب نوع الحل التقني.": "Examples of projects and solutions we have designed and developed, grouped by type of solution.",
  "نماذج من طبيعة الحلول التي نصممها ونطورها لعملائنا.": "Examples of the kind of solutions we design and develop for our clients.",
  "هل أعجبك هذا المشروع؟": "Like this project?", "هل تريد التعرف على طريقة عملنا؟": "Want to see how we work?",
  "هل لديك فكرة مشروع تقني؟ لنحوّلها إلى واقع": "Have a technology project idea? Let's make it real", "يسعدنا تواصلك معنا": "We'd love to hear from you",
  "2Morro Technology Solutions | حلول تقنية متكاملة": "2Morro Technology Solutions | Integrated Technology Solutions",
  "{name} | مشاريع 2Morro Technology Solutions": "{name} | 2Morro Technology Solutions Projects",
  "خدماتنا | 2Morro Technology Solutions": "Our Services | 2Morro Technology Solutions",
  "من نحن | {name}": "About Us | {name}",
  "صورة من مشروع {name} - {n}": "Image from {name} project - {n}", "عرض الصورة {n}": "View image {n}",
  "مرحبًا، أود الاستفسار عن خدمة: {name}": "Hello, I'd like to ask about the service: {name}",
  "مرحبًا، شاهدت مشروع «{name}» وأود الاستفسار عن خدمات مشابهة": "Hello, I saw the \"{name}\" project and would like to ask about similar services",
  "أُنشئ في {date}": "Created on {date}", " • آخر تحديث {date}": " • Last updated {date}",
  "جميع الحقوق محفوظة": "All rights reserved", "المدة": "Duration", "مراحل التنفيذ": "Delivery phases", "المراحل": "Phases", "المخرجات": "Outputs", "المخرجات المتوقعة": "Expected outputs",
  "English": "English", "العربية": "العربية",
  "حلولنا": "Solutions", "المجالات التقنية": "Technology Domains", "الحلول المتكاملة": "Integrated Solutions",
  "القطاعات": "Industries", "المنظومة التقنية": "Technology Ecosystem", "مركز المعرفة": "Knowledge Center",
  "المعرفة": "Knowledge", "خبرات مترابطة وحلول متكاملة": "Connected expertise and integrated solutions",
  "مجالات وحلول الشركة": "Our domains and solutions", "نربط مجالاتنا التقنية بخدمات وحلول عملية تخدم احتياجات القطاعات المختلفة.": "We connect our technology domains with practical services and solutions for different industries.",
  "حل متكامل": "Integrated solution", "مجال تقني": "Technology domain", "عرض التفاصيل": "View details", "الموقع الرسمي للتقنية": "Official technology website",
  "تقنية": "Technology", "منصة": "Platform", "شهادة": "Certification", "اعتماد": "Accreditation", "شريك رسمي": "Official partner",
  "لا يوجد محتوى منشور حاليًا": "No content has been published yet", "سيظهر المحتوى هنا بعد إضافته واعتماده من لوحة الإدارة.": "Content will appear here after it has been added and approved in the dashboard.",
  "نماذج مرنة لتقديم وتنفيذ الخدمات": "Flexible service engagement and delivery models", "أساليب التعاقد والتوريد والتنفيذ والتشغيل والدعم التي يمكن الاتفاق عليها بحسب نطاق كل مشروع.": "Engagement, supply, implementation, operation and support approaches agreed according to each project scope.",
  "المخرجات أو نطاق الخدمة": "Deliverables or service scope", "منهجية العمل كاملة": "Full methodology", "استعرض منهجية العمل كاملة": "Explore the full methodology",
  "سياسة الخصوصية": "Privacy Policy", "الشروط والأحكام": "Terms and Conditions", "لم يتم نشر هذا المحتوى بعد.": "This content has not been published yet.",
  "تحميل الملف التعريفي": "Download company profile", "تحميل المورد": "Download resource", "تاريخ التأسيس": "Established", "المقر الرئيسي": "Headquarters",
  "نطاق النموذج أو الخدمة": "Model or service scope", "ما الذي يشمله هذا النموذج؟": "What is included in this model?", "الخدمات التي يغطيها هذا النموذج": "Services covered by this model",
  "الخدمات المكونة للحل": "Services included in this solution", "الحلول المرتبطة": "Related solutions", "الخدمات المرتبطة": "Related services",
  "المجال التقني": "Technology domain",
  "المنطقة الزمنية": "Time zone",
  "المشاريع المرتبطة": "Related projects", "القطاعات المرتبطة": "Related sectors",
  "يمكنك فتح محادثة مباشرة مع فريقنا على واتساب في أي وقت.": "You can start a direct WhatsApp conversation with our team at any time.",
  "المحتوى المرتبط": "Related content",
  "تعذر تحميل البيانات من الخادم. تحقق من تشغيل Backend واتصال الشبكة، ثم أعد تحميل الصفحة.": "Could not load data from the server. Check that the backend is running and the network is connected, then reload the page.",
  "أرسل رسالة عبر واتساب": "Send a message via WhatsApp",
  "أساليب التعاقد والتوريد والتنفيذ والتشغيل والدعم في 2Morro Technology Solutions.": "Contracting, procurement, delivery, operations and support models at 2Morro Technology Solutions.",
  "أيام وساعات العمل": "Business days and hours",
  "اكتب بياناتك ورسالتك، وسنجهزها لك في واتساب لإرسالها مباشرة. لا يتم حفظ النموذج في الموقع.": "Enter your details and message. We will prepare it in WhatsApp for you to send directly. This form is not stored on the website.",
  "الأوقات المعروضة معلومات إرشادية فقط، ويمكنك مراسلتنا عبر واتساب في أي وقت.": "The hours shown are informational only. You can message us on WhatsApp at any time.",
  "الاسم": "Name", "البريد الإلكتروني": "Email address", "الرسالة": "Message", "رقم الهاتف": "Phone number",
  "رقم واتساب غير متاح حاليًا": "WhatsApp number is currently unavailable", "يرجى إدخال الاسم والرسالة": "Please enter your name and message",
  "تجهيز الرسالة وفتح واتساب": "Prepare message and open WhatsApp", "مغلق": "Closed",
  "تعرف على الشركة": "Learn about the company", "استعراض القطاعات": "Explore sectors", "استعراض المنظومة التقنية": "Explore technology ecosystem", "المجالات والحلول": "Domains and solutions", "المقالات والموارد": "Articles and resources", "منظومة التقنيات": "Technology ecosystem",
  "خبرات تقنية مترابطة": "Connected technical expertise", "مجالاتنا التقنية التي تغطي خبرات وخدمات الشركة.": "Our technology domains cover the company's expertise and services.",
  "مجالاتنا التقنية": "Our technology domains",
  "حلول تجمع الخدمات والتقنيات": "Solutions combining services and technologies", "حلول مترابطة تُبنى لتلبية احتياجات الأعمال والقطاعات المختلفة.": "Connected solutions designed for business and sector needs.",
  "جميع المجالات": "All domains", "جميع الحلول": "All solutions", "جميع المقالات": "All articles",
  "تقنيات ومنصات ضمن خبراتنا": "Technologies and platforms within our expertise", "قطاعات نعمل على دعمها": "Sectors we support",
  "استعرض مراحل منهجية العمل التي نتبعها من فهم المتطلبات حتى التشغيل والدعم.": "Explore the methodology stages we follow, from requirements discovery to operations and support.",
  "تعرف على طرق التعاقد والتوريد والتنفيذ والتشغيل والدعم التي يمكن الاتفاق عليها بحسب نطاق كل مشروع.": "Learn about contracting, procurement, delivery, operations and support models that can be agreed according to each project's scope.", "التقنيات المرتبطة": "Related technologies",
  "رسالة تواصل جديدة إلى 2Morro Technology Solutions": "New inquiry for 2Morro Technology Solutions",
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
