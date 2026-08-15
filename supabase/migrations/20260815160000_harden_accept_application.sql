-- Align accept_application with live schema columns and create deliverables + conversation members.
CREATE OR REPLACE FUNCTION public.accept_application(_application_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app public.applications;
  v_campaign public.campaigns;
  v_collab_id UUID;
  v_conv_id UUID;
  v_title TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_app FROM public.applications WHERE id = _application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  SELECT * INTO v_campaign FROM public.campaigns WHERE id = v_app.campaign_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  IF v_campaign.brand_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_app.status IN ('withdrawn', 'rejected', 'accepted') THEN
    RAISE EXCEPTION 'Application is no longer selectable';
  END IF;

  UPDATE public.applications
  SET status = 'accepted', updated_at = now()
  WHERE id = _application_id;

  INSERT INTO public.collaborations (
    campaign_id, creator_id, brand_id, application_id, status, deadline
  )
  VALUES (
    v_campaign.id,
    v_app.creator_id,
    v_campaign.brand_id,
    _application_id,
    'active',
    v_campaign.deadline
  )
  ON CONFLICT (campaign_id, creator_id) DO UPDATE
    SET status = 'active',
        application_id = EXCLUDED.application_id,
        updated_at = now()
  RETURNING id INTO v_collab_id;

  INSERT INTO public.conversations (
    campaign_id, brand_id, creator_id, application_id
  )
  VALUES (
    v_campaign.id, v_campaign.brand_id, v_app.creator_id, _application_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_conv_id;

  IF v_conv_id IS NULL THEN
    SELECT id INTO v_conv_id FROM public.conversations
    WHERE campaign_id = v_campaign.id
      AND brand_id = v_campaign.brand_id
      AND creator_id = v_app.creator_id
    LIMIT 1;
  END IF;

  IF v_conv_id IS NOT NULL THEN
    INSERT INTO public.conversation_members (conversation_id, user_id, member_role)
    VALUES
      (v_conv_id, v_campaign.brand_id, 'brand'),
      (v_conv_id, v_app.creator_id, 'creator')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Create deliverables from campaign.deliverables text array
  IF v_campaign.deliverables IS NOT NULL THEN
    FOREACH v_title IN ARRAY v_campaign.deliverables
    LOOP
      INSERT INTO public.deliverables (application_id, title, kind, status)
      VALUES (_application_id, v_title, 'reel', 'pending');
    END LOOP;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    v_app.creator_id,
    'application_selected',
    'You were selected',
    coalesce(v_campaign.title, 'A campaign') || ' selected your application.',
    jsonb_build_object('campaign_id', v_campaign.id, 'application_id', _application_id, 'collaboration_id', v_collab_id)
  );

  RETURN v_collab_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_application(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_application(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_application(UUID) TO authenticated;
