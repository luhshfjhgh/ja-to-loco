
-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Allow anon SELECT of is_active by email lookup? No: we'll use service role via server fn.
GRANT SELECT ON public.profiles TO anon; -- needed for public check of activation status; RLS below restricts
CREATE POLICY "profiles_public_activation_check" ON public.profiles FOR SELECT TO anon USING (false); -- effectively closed for anon

-- ============ VERIFICATION CODES ============
CREATE TABLE public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signup','password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_verification_codes_lookup ON public.verification_codes(email, purpose, used);
GRANT SELECT, INSERT, UPDATE ON public.verification_codes TO anon, authenticated;
GRANT ALL ON public.verification_codes TO service_role;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
-- Anonymous users need to insert their own codes during signup/reset flows and validate them
CREATE POLICY "vc_insert_any" ON public.verification_codes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "vc_select_any" ON public.verification_codes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "vc_update_any" ON public.verification_codes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ DEVICES ============
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL UNIQUE,
  device_key TEXT NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_devices_user ON public.devices(user_id);
CREATE INDEX idx_devices_device_id ON public.devices(device_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO authenticated;
GRANT ALL ON public.devices TO service_role;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "devices_owner_all" ON public.devices FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TELEMETRY ============
CREATE TABLE public.telemetry (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  temperature NUMERIC,
  humidity NUMERIC,
  status TEXT,
  energy BOOLEAN,
  generator BOOLEAN,
  leds JSONB,
  buttons JSONB,
  uptime BIGINT,
  ip TEXT,
  mac TEXT,
  wifi TEXT,
  rssi INTEGER,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_telemetry_device_time ON public.telemetry(device_id, created_at DESC);
GRANT SELECT ON public.telemetry TO authenticated;
GRANT ALL ON public.telemetry TO service_role;
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telemetry_owner_select" ON public.telemetry FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.devices d WHERE d.device_id = telemetry.device_id AND d.user_id = auth.uid())
);

-- ============ LOGS ============
CREATE TABLE public.logs (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_logs_device_time ON public.logs(device_id, created_at DESC);
GRANT SELECT ON public.logs TO authenticated;
GRANT ALL ON public.logs TO service_role;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_owner_select" ON public.logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.devices d WHERE d.device_id = logs.device_id AND d.user_id = auth.uid())
);

-- ============ ALERTS ============
CREATE TABLE public.alerts (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alerts_device_time ON public.alerts(device_id, created_at DESC);
GRANT SELECT, UPDATE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_owner_select" ON public.alerts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.devices d WHERE d.device_id = alerts.device_id AND d.user_id = auth.uid())
);
CREATE POLICY "alerts_owner_ack" ON public.alerts FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.devices d WHERE d.device_id = alerts.device_id AND d.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.devices d WHERE d.device_id = alerts.device_id AND d.user_id = auth.uid())
);

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_devices_updated BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ HANDLE NEW USER ============
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_active)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry;
ALTER PUBLICATION supabase_realtime ADD TABLE public.logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
