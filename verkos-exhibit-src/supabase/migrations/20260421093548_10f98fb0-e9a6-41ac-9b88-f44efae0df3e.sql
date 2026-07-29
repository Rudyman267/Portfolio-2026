
CREATE TABLE public.agents (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  domain text NOT NULL DEFAULT 'custom',
  status text NOT NULL DEFAULT 'active',
  icon text NOT NULL DEFAULT 'fa-solid fa-robot',
  report_count integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agents_org_id ON public.agents(org_id);

CREATE TABLE public.templates (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  is_default boolean NOT NULL DEFAULT false,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_style text NOT NULL DEFAULT 'gradient',
  page_size text NOT NULL DEFAULT 'A4',
  preview_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_templates_org_id ON public.templates(org_id);

CREATE TABLE public.reports (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  title text NOT NULL,
  profile text NOT NULL DEFAULT 'full_operational',
  status text NOT NULL DEFAULT 'draft_ready',
  site_name text NOT NULL DEFAULT '',
  date text,
  author text NOT NULL DEFAULT '',
  mission_count integer NOT NULL DEFAULT 0,
  executive_summary text NOT NULL DEFAULT '',
  observations jsonb NOT NULL DEFAULT '[]'::jsonb,
  short_term_recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  long_term_recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  agent_id text,
  agent_name text NOT NULL DEFAULT '',
  template_id text,
  flight_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  drone_name text,
  mission_name text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_org_id ON public.reports(org_id);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on agents" ON public.agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on templates" ON public.templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);
