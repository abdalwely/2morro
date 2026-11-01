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
    'models': {'badge': 'نماذج التنفيذ', 'title': 'منهجية عمل مرحلية… من التحليل إلى الدعم',
               'subtitle': 'نماذج توضح أسلوبنا في تنفيذ المشاريع وإدارة مراحل العمل والمخرجات المتوقعة من كل مرحلة.',
               'badge_en': 'Delivery Models', 'title_en': 'A phased methodology… from analysis to support',
               'subtitle_en': 'Models that show how we deliver projects, manage work phases and the outputs expected from each phase.'},
    'contact': {'badge': 'تواصل معنا', 'title': 'يسعدنا تواصلك معنا',
                'subtitle': 'نستقبل استفساراتك وطلباتك مباشرة عبر واتساب والبريد الإلكتروني الرسميين.',
                'badge_en': 'Contact Us', 'title_en': 'We\'d love to hear from you',
                'subtitle_en': 'Reach us directly through our official WhatsApp and email.'},
}

TEXT_KEYS = ['tagline', 'hero_title', 'hero_subtitle', 'about_short', 'about_content', 'mission', 'vision',
             'values', 'quality_content', 'methodology_content', 'footer_text', 'seo_title', 'seo_description']

HEX_RE = r'^#[0-9A-Fa-f]{6}$'


def default_theme():
    return copy.deepcopy(DEFAULT_THEME)


def default_pages():
    return copy.deepcopy(DEFAULT_PAGES)
