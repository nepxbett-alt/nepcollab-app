
-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('creator','brand')),
  display_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  cover_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.current_role_is(_role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ creator / brand profiles ============
CREATE TABLE public.creator_profiles (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline TEXT,
  category TEXT,
  niches TEXT[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  audience_size INTEGER NOT NULL DEFAULT 0 CHECK (audience_size >= 0),
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (engagement_rate >= 0),
  instagram_url TEXT, tiktok_url TEXT, youtube_url TEXT, facebook_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.creator_profiles TO authenticated;
GRANT SELECT ON public.creator_profiles TO anon;
GRANT ALL ON public.creator_profiles TO service_role;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_profiles_public_read" ON public.creator_profiles FOR SELECT USING (true);
CREATE POLICY "creator_profiles_write_own" ON public.creator_profiles FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "creator_profiles_update_own" ON public.creator_profiles FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE TRIGGER creator_profiles_updated BEFORE UPDATE ON public.creator_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.brand_profiles (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  description TEXT,
  industry TEXT,
  website TEXT,
  logo_url TEXT,
  location TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.brand_profiles TO authenticated;
GRANT SELECT ON public.brand_profiles TO anon;
GRANT ALL ON public.brand_profiles TO service_role;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand_profiles_public_read" ON public.brand_profiles FOR SELECT USING (true);
CREATE POLICY "brand_profiles_insert_own" ON public.brand_profiles FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "brand_profiles_update_own" ON public.brand_profiles FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE TRIGGER brand_profiles_updated BEFORE UPDATE ON public.brand_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ campaigns ============
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  description TEXT NOT NULL DEFAULT '',
  category TEXT,
  location TEXT,
  remote BOOLEAN NOT NULL DEFAULT false,
  budget NUMERIC(12,2) CHECK (budget IS NULL OR budget >= 0),
  currency TEXT NOT NULL DEFAULT 'NPR',
  perks TEXT[] NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  deliverables TEXT[] NOT NULL DEFAULT '{}',
  requirements TEXT,
  min_followers INTEGER NOT NULL DEFAULT 0 CHECK (min_followers >= 0),
  creators_needed INTEGER NOT NULL DEFAULT 1 CHECK (creators_needed > 0),
  application_deadline DATE,
  campaign_start_date DATE,
  campaign_end_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','paused','closed','completed','cancelled')),
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (campaign_end_date IS NULL OR campaign_start_date IS NULL OR campaign_end_date >= campaign_start_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT ON public.campaigns TO anon;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_public_read_published" ON public.campaigns FOR SELECT USING (status IN ('published','paused','closed','completed'));
CREATE POLICY "campaigns_owner_read" ON public.campaigns FOR SELECT TO authenticated USING (brand_id = auth.uid());
CREATE POLICY "campaigns_owner_insert" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (brand_id = auth.uid() AND public.current_role_is('brand'));
CREATE POLICY "campaigns_owner_update" ON public.campaigns FOR UPDATE TO authenticated USING (brand_id = auth.uid()) WITH CHECK (brand_id = auth.uid());
CREATE POLICY "campaigns_owner_delete" ON public.campaigns FOR DELETE TO authenticated USING (brand_id = auth.uid() AND status = 'draft');
CREATE TRIGGER campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_category ON public.campaigns(category);
CREATE INDEX idx_campaigns_location ON public.campaigns(location);
CREATE INDEX idx_campaigns_brand ON public.campaigns(brand_id);
CREATE INDEX idx_campaigns_created ON public.campaigns(created_at DESC);

CREATE OR REPLACE FUNCTION public.owns_campaign(_campaign_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.campaigns WHERE id = _campaign_id AND brand_id = auth.uid());
$$;

-- ============ applications ============
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  content_idea TEXT,
  availability TEXT,
  proposed_rate NUMERIC(12,2) CHECK (proposed_rate IS NULL OR proposed_rate >= 0),
  brand_note TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','shortlisted','accepted','rejected','withdrawn','completed')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, creator_id)
);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_creator_read" ON public.applications FOR SELECT TO authenticated USING (creator_id = auth.uid());
CREATE POLICY "applications_brand_read" ON public.applications FOR SELECT TO authenticated USING (public.owns_campaign(campaign_id));
CREATE POLICY "applications_creator_insert" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND public.current_role_is('creator')
    AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.status = 'published' AND c.brand_id <> auth.uid())
  );
CREATE POLICY "applications_creator_update" ON public.applications FOR UPDATE TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "applications_brand_update" ON public.applications FOR UPDATE TO authenticated USING (public.owns_campaign(campaign_id)) WITH CHECK (public.owns_campaign(campaign_id));
CREATE TRIGGER applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_applications_campaign ON public.applications(campaign_id);
CREATE INDEX idx_applications_creator ON public.applications(creator_id);
CREATE INDEX idx_applications_status ON public.applications(status);

-- ============ collaborations ============
CREATE TABLE public.collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','work_submitted','revision_requested','completed','cancelled')),
  start_date DATE,
  end_date DATE,
  agreed_budget NUMERIC(12,2),
  deliverables TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, creator_id)
);
GRANT SELECT, INSERT, UPDATE ON public.collaborations TO authenticated;
GRANT ALL ON public.collaborations TO service_role;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collaborations_participant_read" ON public.collaborations FOR SELECT TO authenticated USING (creator_id = auth.uid() OR brand_id = auth.uid());
CREATE POLICY "collaborations_brand_insert" ON public.collaborations FOR INSERT TO authenticated WITH CHECK (brand_id = auth.uid() AND public.owns_campaign(campaign_id));
CREATE POLICY "collaborations_participant_update" ON public.collaborations FOR UPDATE TO authenticated USING (creator_id = auth.uid() OR brand_id = auth.uid()) WITH CHECK (creator_id = auth.uid() OR brand_id = auth.uid());
CREATE TRIGGER collaborations_updated BEFORE UPDATE ON public.collaborations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_collaborations_creator ON public.collaborations(creator_id);
CREATE INDEX idx_collaborations_brand ON public.collaborations(brand_id);

-- ============ saved campaigns ============
CREATE TABLE public.saved_campaigns (
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (creator_id, campaign_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_campaigns TO authenticated;
GRANT ALL ON public.saved_campaigns TO service_role;
ALTER TABLE public.saved_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_own" ON public.saved_campaigns FOR ALL TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE INDEX idx_saved_creator ON public.saved_campaigns(creator_id);

-- ============ conversations + messages ============
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, brand_id, creator_id)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_participant_read" ON public.conversations FOR SELECT TO authenticated USING (brand_id = auth.uid() OR creator_id = auth.uid());
CREATE POLICY "conversations_participant_insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (brand_id = auth.uid() OR creator_id = auth.uid());
CREATE INDEX idx_conversations_brand ON public.conversations(brand_id);
CREATE INDEX idx_conversations_creator ON public.conversations(creator_id);
CREATE INDEX idx_conversations_last ON public.conversations(last_message_at DESC);

CREATE OR REPLACE FUNCTION public.in_conversation(_conversation_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = _conversation_id AND (c.brand_id = auth.uid() OR c.creator_id = auth.uid()));
$$;

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(btrim(body)) > 0 AND length(body) <= 2000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_participant_read" ON public.messages FOR SELECT TO authenticated USING (public.in_conversation(conversation_id));
CREATE POLICY "messages_participant_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.in_conversation(conversation_id));
CREATE POLICY "messages_recipient_update" ON public.messages FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_recipient_unread ON public.messages(recipient_id) WHERE read_at IS NULL;

-- ============ reviews ============
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES public.collaborations(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collaboration_id, reviewer_id)
);
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_participant_insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  reviewer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.collaborations c
    WHERE c.id = collaboration_id AND c.status = 'completed'
      AND (c.creator_id = auth.uid() OR c.brand_id = auth.uid())
      AND reviewee_id IN (c.creator_id, c.brand_id) AND reviewee_id <> auth.uid()
  )
);
CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_id);

-- ============ portfolio ============
CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  external_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT SELECT ON public.portfolio_items TO anon;
GRANT ALL ON public.portfolio_items TO service_role;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portfolio_public_read" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "portfolio_own_write" ON public.portfolio_items FOR ALL TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE TRIGGER portfolio_updated BEFORE UPDATE ON public.portfolio_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_portfolio_creator ON public.portfolio_items(creator_id, sort_order);

-- ============ notifications ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own_read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_own_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_own_delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.push_notification(_user_id UUID, _type TEXT, _title TEXT, _body TEXT, _link TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (_user_id, _type, _title, _body, _link);
END; $$;

-- notification triggers
CREATE OR REPLACE FUNCTION public.on_application_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_brand UUID; v_title TEXT; v_name TEXT;
BEGIN
  SELECT brand_id, title INTO v_brand, v_title FROM public.campaigns WHERE id = NEW.campaign_id;
  SELECT display_name INTO v_name FROM public.profiles WHERE id = NEW.creator_id;
  PERFORM public.push_notification(v_brand, 'application_received', 'New application',
    COALESCE(v_name,'A creator') || ' applied to ' || COALESCE(v_title,'your campaign') || '.', '/brand/applicants');
  RETURN NEW;
END; $$;
CREATE TRIGGER applications_created_notify AFTER INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.on_application_created();

CREATE OR REPLACE FUNCTION public.on_application_status_changed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title TEXT; v_brand UUID;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT title, brand_id INTO v_title, v_brand FROM public.campaigns WHERE id = NEW.campaign_id;
  IF NEW.status = 'withdrawn' THEN
    PERFORM public.push_notification(v_brand, 'application_withdrawn', 'Application withdrawn',
      'A creator withdrew from ' || COALESCE(v_title,'your campaign') || '.', '/brand/applicants');
  ELSE
    PERFORM public.push_notification(NEW.creator_id, 'application_status', 
      CASE NEW.status WHEN 'shortlisted' THEN 'You were shortlisted'
                      WHEN 'accepted' THEN 'You were selected'
                      WHEN 'rejected' THEN 'Application not selected'
                      ELSE 'Application update' END,
      COALESCE(v_title,'A campaign') || ' — status is now ' || NEW.status || '.', '/applications');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER applications_status_notify AFTER UPDATE OF status ON public.applications FOR EACH ROW EXECUTE FUNCTION public.on_application_status_changed();

CREATE OR REPLACE FUNCTION public.on_message_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name TEXT;
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  SELECT display_name INTO v_name FROM public.profiles WHERE id = NEW.sender_id;
  PERFORM public.push_notification(NEW.recipient_id, 'message', 'New message',
    COALESCE(v_name,'Someone') || ': ' || left(NEW.body, 80), '/messages');
  RETURN NEW;
END; $$;
CREATE TRIGGER messages_created_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.on_message_created();

CREATE OR REPLACE FUNCTION public.on_review_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.push_notification(NEW.reviewee_id, 'review', 'New review',
    'You received a ' || NEW.rating || '-star review.', '/profile');
  RETURN NEW;
END; $$;
CREATE TRIGGER reviews_created_notify AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.on_review_created();

-- ============ accept application (transactional) ============
CREATE OR REPLACE FUNCTION public.accept_application(_application_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_app public.applications; v_campaign public.campaigns; v_collab_id UUID; v_conv_id UUID;
BEGIN
  SELECT * INTO v_app FROM public.applications WHERE id = _application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  SELECT * INTO v_campaign FROM public.campaigns WHERE id = v_app.campaign_id;
  IF v_campaign.brand_id <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_app.status IN ('withdrawn','rejected') THEN RAISE EXCEPTION 'Application is no longer active'; END IF;

  UPDATE public.applications SET status = 'accepted' WHERE id = _application_id;

  INSERT INTO public.collaborations (campaign_id, creator_id, brand_id, status, start_date, end_date, agreed_budget, deliverables)
  VALUES (v_campaign.id, v_app.creator_id, v_campaign.brand_id, 'active', v_campaign.campaign_start_date, v_campaign.campaign_end_date, COALESCE(v_app.proposed_rate, v_campaign.budget), v_campaign.deliverables)
  ON CONFLICT (campaign_id, creator_id) DO UPDATE SET status = 'active'
  RETURNING id INTO v_collab_id;

  INSERT INTO public.conversations (campaign_id, brand_id, creator_id)
  VALUES (v_campaign.id, v_campaign.brand_id, v_app.creator_id)
  ON CONFLICT (campaign_id, brand_id, creator_id) DO UPDATE SET last_message_at = now()
  RETURNING id INTO v_conv_id;

  RETURN v_collab_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.accept_application(UUID) TO authenticated;

-- ============ realtime ============
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
