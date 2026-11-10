import copy

DEFAULT_THEME = {
    'colors': {
        'primary': '#0066FF',
        'accent': '#00E5FF',
        'dark': '#070D1B',
        'surface': '#F8FAFC',
        'page': '#F7F9FC',
    },
    'animations': {'enabled': True, 'speed': 'normal'},
    'decorations': {'grid': True, 'glow': True},
    'backgrounds': {'home': '', 'about': '', 'services': '', 'projects': '', 'models': '', 'contact': '', 'overlay': 70},
}

DEFAULT_PAGES = {
    'about': {'badge': 'من نحن', 'title': 'فريق تقني يعمل بمنهجية واضحة وشغف حقيقي بالجودة', 'subtitle': '',
              'badge_en': 'About Us', 'title_en': 'A technology team with a clear methodology and a real passion for quality', 'subtitle_en': ''},
    'services': {'badge': 'خدماتنا', 'title': 'حلول تقنية متخصصة لكل احتياج',
                 'subtitle': 'مجموعة متكاملة من الخدمات التقنية الاحترافية التي نصممها ونطورها ونشغّلها لأجل أعمال عملائنا.',
                 'badge_en': 'Our Services', 'title_en': 'Specialized technology solutions for every need',
                 'subtitle_en': 'A complete range of professional technology services that we design, develop and operate for our clients\' businesses.'},
    'projects': {'badge': 'مشاريعنا', 'title': 'معرض أعمال يعكس جودة التنفيذ',
                 'subtitle': 'نماذج من المشاريع والحلول التي صممناها وطوّرناها، مصنفة حسب نوع الحل التقني.',
                 'badge_en': 'Our Projects', 'title_en': 'A portfolio that reflects the quality of our delivery',
                 'subtitle_en': 'Examples of projects and solutions we have designed and developed, grouped by type of solution.'},
    'models': {'badge': 'نماذج التنفيذ', 'title': 'نماذج مرنة لتقديم وتنفيذ الخدمات',
               'subtitle': 'أساليب التعاقد والتوريد والتنفيذ والتشغيل والدعم التي يمكن الاتفاق عليها بحسب نطاق كل مشروع.',
               'badge_en': 'Delivery Models', 'title_en': 'Flexible service engagement and delivery models',
               'subtitle_en': 'Engagement, supply, implementation, operation and support approaches agreed according to each project scope.'},
    'delivery_models': {'badge': 'نماذج التنفيذ', 'title': 'نماذج مرنة لتقديم وتنفيذ الخدمات',
               'subtitle': 'أساليب التعاقد والتوريد والتنفيذ والتشغيل والدعم التي يمكن الاتفاق عليها بحسب نطاق كل مشروع.',
               'badge_en': 'Delivery Models', 'title_en': 'Flexible ways to deliver technology services',
               'subtitle_en': 'Engagement and delivery approaches agreed according to each project scope.'},
    'contact': {'badge': 'تواصل معنا', 'title': 'يسعدنا تواصلك معنا',
                'subtitle': 'نستقبل استفساراتك وطلباتك مباشرة عبر واتساب والبريد الإلكتروني الرسميين.',
                'badge_en': 'Contact Us', 'title_en': 'We\'d love to hear from you',
                'subtitle_en': 'Reach us directly through our official WhatsApp and email.'},
    'domains': {'badge': 'المجالات التقنية', 'title': 'مجالاتنا التقنية', 'subtitle': 'المجالات الرئيسية التي تغطي خبرات وخدمات الشركة.', 'badge_en': 'Technology Domains', 'title_en': 'Our Technology Domains', 'subtitle_en': 'The primary domains that cover the company\'s expertise and services.'},
    'solutions': {'badge': 'الحلول المتكاملة', 'title': 'حلول تقنية متكاملة', 'subtitle': 'حلول تجمع الخدمات والتقنيات لتلبية احتياجات الأعمال.', 'badge_en': 'Integrated Solutions', 'title_en': 'Integrated Technology Solutions', 'subtitle_en': 'Solutions that combine services and technologies to meet business needs.'},
    'sectors': {'badge': 'القطاعات', 'title': 'القطاعات التي نخدمها', 'subtitle': 'القطاعات التي يمكن أن تستفيد من خدمات وحلول الشركة.', 'badge_en': 'Industries', 'title_en': 'Industries We Serve', 'subtitle_en': 'Industries that can benefit from the company\'s services and solutions.'},
    'technology': {'badge': 'المنظومة التقنية', 'title': 'منظومتنا التقنية', 'subtitle': 'التقنيات والمنصات التي تدخل ضمن نطاق خبراتنا وحلولنا.', 'badge_en': 'Technology Ecosystem', 'title_en': 'Our Technology Ecosystem', 'subtitle_en': 'Technologies and platforms within our expertise and solutions.'},
    'methodology': {'badge': 'منهجية العمل', 'title': 'منهجية واضحة من الفكرة إلى التشغيل', 'subtitle': 'مراحل واضحة لفهم المتطلبات والتصميم والتنفيذ والفحص والتشغيل والدعم.', 'badge_en': 'Methodology', 'title_en': 'A clear methodology from discovery to operations', 'subtitle_en': 'Clear stages for requirements discovery, design, implementation, testing, operations and support.'},
    'knowledge': {'badge': 'مركز المعرفة', 'title': 'المعرفة والموارد التقنية', 'subtitle': 'مقالات وأدلة وموارد تقنية تنشرها الشركة.', 'badge_en': 'Knowledge Center', 'title_en': 'Knowledge and Technical Resources', 'subtitle_en': 'Technical articles, guides and resources published by the company.'},
    'privacy': {'badge': 'سياسة الخصوصية', 'title': 'سياسة الخصوصية', 'subtitle': '', 'badge_en': 'Privacy Policy', 'title_en': 'Privacy Policy', 'subtitle_en': ''},
    'terms': {'badge': 'الشروط والأحكام', 'title': 'الشروط والأحكام', 'subtitle': '', 'badge_en': 'Terms and Conditions', 'title_en': 'Terms and Conditions', 'subtitle_en': ''},
}

TEXT_KEYS = ['company_name', 'tagline', 'hero_title', 'hero_subtitle', 'about_short', 'about_content', 'mission', 'vision',
             'values', 'quality_content', 'methodology_content', 'footer_text', 'seo_title', 'seo_description']

HEX_RE = r'^#[0-9A-Fa-f]{6}$'


def default_theme():
    return copy.deepcopy(DEFAULT_THEME)


def default_pages():
    return copy.deepcopy(DEFAULT_PAGES)
