import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Palette, Sparkles, Image as ImageIcon, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { applyTheme, useSettings } from "@/lib/theme";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Field, inputCls, ImageUploader, ConfirmAction, PageTitle, Card } from "@/components/admin/AdminUI";

const COLORS = [
  { key: "primary", label: "اللون الأساسي", hint: "الأزرار والروابط والأيقونات" },
  { key: "accent", label: "لون التمييز", hint: "الشارات واللمسات المضيئة" },
  { key: "dark", label: "خلفية الأقسام الداكنة", hint: "الشريط العلوي ورؤوس الصفحات والتذييل" },
  { key: "surface", label: "خلفية الأقسام الفاتحة", hint: "البطاقات والأقسام الرمادية" },
  { key: "page", label: "خلفية الصفحة", hint: "لون الخلفية العامة للموقع" },
];
const PAGES = [["home", "الرئيسية"], ["about", "من نحن"], ["services", "الخدمات"], ["projects", "المشاريع"], ["models", "نماذج التنفيذ"], ["contact", "تواصل معنا"]];
const SPEEDS = [["slow", "بطيئة"], ["normal", "عادية"], ["fast", "سريعة"]];

function HexInput({ value, onValid, testid }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const change = (v) => {
    setDraft(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onValid(v.toUpperCase());
  };
  return <input dir="ltr" className={inputCls} value={draft} onChange={(e) => change(e.target.value)} onBlur={() => setDraft(value)} maxLength={7} data-testid={testid} />;
}

function ColorsCard({ theme, setTheme }) {
  const set = (k, v) => setTheme({ ...theme, colors: { ...theme.colors, [k]: v } });
  return (
    <Card icon={Palette} title="ألوان الموقع" testid="admin-theme-colors">
      <div className="grid gap-4 sm:grid-cols-2">
        {COLORS.map((c) => (
          <Field key={c.key} label={c.label} hint={c.hint}>
            <div className="flex items-center gap-2">
              <input type="color" value={theme.colors[c.key]} onChange={(e) => set(c.key, e.target.value.toUpperCase())} className="h-11 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" data-testid={`admin-theme-color-${c.key}`} />
              <HexInput value={theme.colors[c.key]} onValid={(v) => set(c.key, v)} testid={`admin-theme-color-${c.key}-hex`} />
            </div>
          </Field>
        ))}
      </div>
    </Card>
  );
}

function MotionCard({ theme, setTheme }) {
  const anim = theme.animations;
  const deco = theme.decorations;
  return (
    <Card icon={Sparkles} title="الحركات والزخارف" testid="admin-theme-motion">
      <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-bold text-slate-700">
        تشغيل حركات الظهور والانتقال
        <Switch checked={anim.enabled} onCheckedChange={(v) => setTheme({ ...theme, animations: { ...anim, enabled: v } })} data-testid="admin-theme-anim-enabled" />
      </label>
      <Field label="سرعة الحركات">
        <div className="flex gap-2">
          {SPEEDS.map(([k, l]) => (
            <button type="button" key={k} disabled={!anim.enabled} onClick={() => setTheme({ ...theme, animations: { ...anim, speed: k } })} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors disabled:opacity-40 ${anim.speed === k ? "border-electric bg-electric-50 text-electric" : "border-slate-200 text-slate-600"}`} data-testid={`admin-theme-speed-${k}`}>{l}</button>
          ))}
        </div>
      </Field>
      <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-bold text-slate-700">
        نقش الشبكة خلف العناوين
        <Switch checked={deco.grid} onCheckedChange={(v) => setTheme({ ...theme, decorations: { ...deco, grid: v } })} data-testid="admin-theme-deco-grid" />
      </label>
      <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-bold text-slate-700">
        التوهج الضوئي في الخلفيات
        <Switch checked={deco.glow} onCheckedChange={(v) => setTheme({ ...theme, decorations: { ...deco, glow: v } })} data-testid="admin-theme-deco-glow" />
      </label>
    </Card>
  );
}

function BackgroundsCard({ theme, setTheme }) {
  const bg = theme.backgrounds;
  const set = (k, v) => setTheme({ ...theme, backgrounds: { ...bg, [k]: v } });
  return (
    <Card icon={ImageIcon} title="صور خلفيات رؤوس الصفحات" testid="admin-theme-backgrounds">
      <div className="grid gap-5 sm:grid-cols-2">
        {PAGES.map(([k, l]) => (
          <ImageUploader key={k} value={bg[k]} onChange={(u) => set(k, u)} label={`صفحة ${l}`} testid={`admin-theme-bg-${k}`} />
        ))}
      </div>
      <Field label={`تعتيم الصورة: ${bg.overlay}%`} hint="نسبة اللون الداكن فوق الصورة لضمان وضوح النصوص">
        <Slider dir="rtl" min={0} max={95} step={5} value={[bg.overlay]} onValueChange={([v]) => set("overlay", v)} data-testid="admin-theme-bg-overlay" />
      </Field>
    </Card>
  );
}

export default function AppearanceAdmin() {
  const { data: settings, isLoading } = useSettings();
  const qc = useQueryClient();
  const [theme, setTheme] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { if (settings?.theme) setTheme(settings.theme); }, [settings]);
  useEffect(() => { if (theme) applyTheme(theme, true); }, [theme]);
  useEffect(() => () => qc.invalidateQueries({ queryKey: ["settings"] }), [qc]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/admin/theme", theme);
      setTheme(data);
      await qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("تم حفظ المظهر — يظهر على الموقع مباشرة");
    } catch (err) {
      toast.error(formatApiError(err));
    }
    setSaving(false);
  };

  const reset = async () => {
    setConfirmReset(false);
    try {
      const { data } = await api.post("/admin/theme/reset");
      setTheme(data);
      await qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("تمت إعادة الألوان والمظهر الافتراضي");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  if (isLoading || !theme) return <div className="py-24 text-center text-sm text-slate-500" data-testid="admin-appearance-loading">جارٍ التحميل…</div>;

  return (
    <div data-testid="admin-appearance-page">
      <PageTitle title="المظهر والألوان" desc="تحكم بألوان الموقع والحركات والخلفيات. تظهر المعاينة هنا فورًا، ولا تُطبق على الموقع إلا بعد الحفظ.">
        <div className="flex gap-2">
          <button onClick={() => setConfirmReset(true)} className="btn-outline !px-4 !py-2.5 !text-xs" data-testid="admin-theme-reset-button">
            <RotateCcw className="h-4 w-4" />
            إعادة الألوان الافتراضية
          </button>
          <button onClick={save} disabled={saving} className="btn-primary !px-5 !py-2.5 !text-xs disabled:opacity-60" data-testid="admin-theme-save-button">
            <Save className="h-4 w-4" />
            {saving ? "جارٍ الحفظ…" : "حفظ المظهر"}
          </button>
        </div>
      </PageTitle>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ColorsCard theme={theme} setTheme={setTheme} />
        <MotionCard theme={theme} setTheme={setTheme} />
        <div className="xl:col-span-2"><BackgroundsCard theme={theme} setTheme={setTheme} /></div>
      </div>
      <ConfirmAction open={confirmReset} onOpenChange={setConfirmReset} title="إعادة المظهر الافتراضي" confirmLabel="نعم، أعد الافتراضي" onConfirm={reset} testid="admin-theme-reset"
        description="ستعود جميع الألوان والحركات والزخارف وصور الخلفيات إلى الإعدادات الافتراضية للموقع." />
    </div>
  );
}
