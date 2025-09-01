import { createClient } from '@supabase/supabase-js';

export type Theme = {
  logoUrl?: string | null;
  primary: string;
  bg: string;
  text: string;
  muted: string;
  btnRadius: number;
  fontFamily: string;
  customCssUrl?: string | null;
};

const DEFAULT_THEME: Theme = {
  logoUrl: null,
  primary: '#0E7AFE',
  bg: '#FFFFFF',
  text: '#111111',
  muted: '#666666',
  btnRadius: 8,
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  customCssUrl: null,
};

export async function loadStoreTheme(storeId: string): Promise<Theme> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Prefer dedicated branding table if present
    const { data: b } = await supabase
      .from('store_branding')
      .select('logo_url, primary_color, bg_color, text_color, muted_color, btn_radius, font_family, custom_css_url')
      .eq('store_id', storeId)
      .is('deleted_at', null as any)
      .maybeSingle();

    if (b) {
      return {
        logoUrl: b.logo_url ?? null,
        primary: b.primary_color || DEFAULT_THEME.primary,
        bg: b.bg_color || DEFAULT_THEME.bg,
        text: b.text_color || DEFAULT_THEME.text,
        muted: b.muted_color || DEFAULT_THEME.muted,
        btnRadius: typeof b.btn_radius === 'number' ? b.btn_radius : DEFAULT_THEME.btnRadius,
        fontFamily: b.font_family || DEFAULT_THEME.fontFamily,
        customCssUrl: b.custom_css_url || null,
      };
    }

    // Optional fallback: a theme JSON in public_store_settings.theme (if you have it)
    const { data: pss } = await supabase
      .from('public_store_settings')
      .select('theme, logo_url')
      .eq('store_id', storeId)
      .maybeSingle();

    if (pss?.theme) {
      const t = { ...DEFAULT_THEME, ...(pss.theme as Record<string, any>) };
      return {
        logoUrl: (pss.logo_url as string) ?? t.logoUrl,
        primary: t.primary, bg: t.bg, text: t.text, muted: t.muted,
        btnRadius: Number(t.btnRadius) || DEFAULT_THEME.btnRadius,
        fontFamily: String(t.fontFamily || DEFAULT_THEME.fontFamily),
        customCssUrl: t.customCssUrl ?? null,
      };
    }

    return DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}
