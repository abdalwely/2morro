from typing import List, Optional

from pydantic import BaseModel, Field


class BaseDocument(BaseModel):
    model_config = {'extra': 'ignore'}

    id: str = ''
    created_at: str = ''
    updated_at: str = ''

    def to_mongo(self) -> dict:
        d = self.model_dump()
        d['_id'] = d.pop('id', '')
        return d

    @classmethod
    def from_mongo(cls, doc: dict):
        d = dict(doc)
        _id = d.pop('_id', None)
        if _id is not None:
            d['id'] = str(_id)
        return cls(**d)


class ServiceIn(BaseModel):
    en: dict = {}
    name: str = Field(min_length=2, max_length=140)
    short_desc: str = Field(min_length=2, max_length=400)
    detailed_desc: str = ''
    icon: str = ''
    image_url: str = ''
    features: List[str] = []
    category: str = ''
    order: int = 0
    published: bool = False
    seo_title: str = Field(default='', max_length=200)
    seo_description: str = Field(default='', max_length=400)


class Service(BaseDocument):
    en: dict = {}
    name: str = ''
    short_desc: str = ''
    detailed_desc: str = ''
    icon: str = ''
    image_url: str = ''
    features: List[str] = []
    category: str = ''
    order: int = 0
    published: bool = False
    is_demo: bool = False
    slug: str = ''
    seo_title: str = ''
    seo_description: str = ''


class PhaseIn(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    desc: str = ''


class DeliveryModelIn(BaseModel):
    en: dict = {}
    name: str = Field(min_length=2, max_length=140)
    short_desc: str = Field(min_length=2, max_length=400)
    detailed_desc: str = ''
    phases: List[PhaseIn] = []
    outputs: List[str] = []
    image_url: str = ''
    duration: str = ''
    order: int = 0
    published: bool = False


class DeliveryModel(BaseDocument):
    en: dict = {}
    name: str = ''
    short_desc: str = ''
    detailed_desc: str = ''
    phases: List[PhaseIn] = []
    outputs: List[str] = []
    image_url: str = ''
    duration: str = ''
    order: int = 0
    published: bool = False
    is_demo: bool = False
    slug: str = ''


class ProjectIn(BaseModel):
    en: dict = {}
    name: str = Field(min_length=2, max_length=140)
    short_desc: str = Field(min_length=2, max_length=400)
    detailed_desc: str = ''
    main_image_url: str = ''
    gallery_urls: List[str] = []
    category: str = ''
    technologies: List[str] = []
    goals: str = ''
    outputs: str = ''
    external_url: str = ''
    service_id: str = ''
    order: int = 0
    published: bool = False


class Project(BaseDocument):
    en: dict = {}
    name: str = ''
    short_desc: str = ''
    detailed_desc: str = ''
    main_image_url: str = ''
    gallery_urls: List[str] = []
    category: str = ''
    technologies: List[str] = []
    goals: str = ''
    outputs: str = ''
    external_url: str = ''
    service_id: str = ''
    order: int = 0
    published: bool = False
    is_demo: bool = False
    slug: str = ''


class SettingsIn(BaseModel):
    company_name: Optional[str] = None
    tagline: Optional[str] = None
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    about_short: Optional[str] = None
    about_content: Optional[str] = None
    mission: Optional[str] = None
    vision: Optional[str] = None
    values: Optional[List[str]] = None
    quality_content: Optional[str] = None
    methodology_content: Optional[str] = None
    email: Optional[str] = None
    whatsapp_number: Optional[str] = None
    social: Optional[dict] = None
    footer_text: Optional[str] = None
    logo_url: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    copyright_text: Optional[str] = None
    copyright_text_en: Optional[str] = None
    en: Optional[dict] = None
    pages: Optional[dict] = None


class ThemeIn(BaseModel):
    colors: dict
    animations: dict
    decorations: dict
    backgrounds: dict


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(pattern='^(admin|editor)$')


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    role: Optional[str] = Field(default=None, pattern='^(admin|editor)$')
    active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)
