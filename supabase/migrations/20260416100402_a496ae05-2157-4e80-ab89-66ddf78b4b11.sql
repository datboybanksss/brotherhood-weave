
-- 1. Extend lessons table
ALTER TABLE public.lessons
  ADD COLUMN video_url text,
  ADD COLUMN body_markdown text,
  ADD COLUMN worksheet_pdf_url text,
  ADD COLUMN duration_seconds integer;

-- 2. Create user_lesson_progress
CREATE TABLE public.user_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at timestamptz,
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own lesson progress"
  ON public.user_lesson_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lesson progress"
  ON public.user_lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lesson progress"
  ON public.user_lesson_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all lesson progress"
  ON public.user_lesson_progress FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

-- 3. Module completion trigger
CREATE OR REPLACE FUNCTION public.handle_lesson_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module_id uuid;
  v_total int;
  v_completed int;
BEGIN
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT module_id INTO v_module_id FROM public.lessons WHERE id = NEW.lesson_id;

  SELECT COUNT(*) INTO v_total FROM public.lessons WHERE module_id = v_module_id;
  SELECT COUNT(*) INTO v_completed
    FROM public.user_lesson_progress ulp
    JOIN public.lessons l ON l.id = ulp.lesson_id
    WHERE l.module_id = v_module_id
      AND ulp.user_id = NEW.user_id
      AND ulp.completed_at IS NOT NULL;

  -- Update lessons_completed count
  INSERT INTO public.user_module_progress (user_id, module_id, lessons_completed)
  VALUES (NEW.user_id, v_module_id, v_completed)
  ON CONFLICT (user_id, module_id)
  DO UPDATE SET lessons_completed = v_completed;

  -- If all done, mark module complete and evaluate tier
  IF v_completed >= v_total THEN
    UPDATE public.user_module_progress
    SET completed_at = now()
    WHERE user_id = NEW.user_id AND module_id = v_module_id;

    PERFORM public.evaluate_tier_upgrade(NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lesson_completion
  AFTER INSERT OR UPDATE ON public.user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_lesson_completion();

-- 4. Create archives table
CREATE TABLE public.archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  recording_url text NOT NULL,
  recorded_at timestamptz NOT NULL,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  is_published boolean NOT NULL DEFAULT true
);

ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paid users can read published archives"
  ON public.archives FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND payment_status = 'paid'
    )
  );

CREATE POLICY "Admins can read all archives"
  ON public.archives FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can insert archives"
  ON public.archives FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update archives"
  ON public.archives FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can delete archives"
  ON public.archives FOR DELETE
  TO authenticated
  USING (public.is_current_user_admin());

-- 5. Create playbook_category enum and playbooks table
CREATE TYPE public.playbook_category AS ENUM ('money', 'career', 'relationships', 'health', 'mindset', 'craft');

CREATE TABLE public.playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  summary text NOT NULL,
  body_markdown text NOT NULL,
  category public.playbook_category NOT NULL,
  author_id uuid NOT NULL REFERENCES public.users(id),
  pdf_attachment_url text,
  last_reviewed_at timestamptz NOT NULL DEFAULT now(),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paid users can read published playbooks"
  ON public.playbooks FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND payment_status = 'paid'
    )
  );

CREATE POLICY "Admins can read all playbooks"
  ON public.playbooks FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can insert playbooks"
  ON public.playbooks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update playbooks"
  ON public.playbooks FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can delete playbooks"
  ON public.playbooks FOR DELETE
  TO authenticated
  USING (public.is_current_user_admin());

-- Auto-update updated_at on playbooks
CREATE OR REPLACE FUNCTION public.update_playbooks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_playbooks_updated_at
  BEFORE UPDATE ON public.playbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_playbooks_updated_at();

-- 6. Add unique constraint on user_module_progress for upsert
ALTER TABLE public.user_module_progress
  ADD CONSTRAINT user_module_progress_user_module_unique UNIQUE (user_id, module_id);

-- 7. Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('lesson-worksheets', 'lesson-worksheets', true, 10485760, ARRAY['application/pdf']),
  ('playbook-attachments', 'playbook-attachments', true, 10485760, ARRAY['application/pdf']);

-- Storage policies: authenticated can read
CREATE POLICY "Authenticated can read lesson worksheets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'lesson-worksheets');

CREATE POLICY "Authenticated can read playbook attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'playbook-attachments');

-- Storage policies: admins can write
CREATE POLICY "Admins can upload lesson worksheets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lesson-worksheets' AND public.is_current_user_admin());

CREATE POLICY "Admins can update lesson worksheets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'lesson-worksheets' AND public.is_current_user_admin());

CREATE POLICY "Admins can delete lesson worksheets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'lesson-worksheets' AND public.is_current_user_admin());

CREATE POLICY "Admins can upload playbook attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'playbook-attachments' AND public.is_current_user_admin());

CREATE POLICY "Admins can update playbook attachments"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'playbook-attachments' AND public.is_current_user_admin());

CREATE POLICY "Admins can delete playbook attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'playbook-attachments' AND public.is_current_user_admin());

-- 8. Seed lesson content
UPDATE public.lessons SET
  title = 'Who You Were Told You Are',
  video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  body_markdown = E'## Key Concepts\n\nEvery man inherits a story about who he is before he can choose one for himself.\n\n- **Family narratives** — the roles assigned at birth\n- **Cultural scripts** — what society expects of young men\n- **Peer pressure** — the mask your friends reward\n\n> "Until you make the unconscious conscious, it will direct your life and you will call it fate." — Carl Jung\n\nReflect on three beliefs about yourself that you did not choose.',
  duration_seconds = 180
WHERE id = '438e3574-b073-402c-83de-9452cc32bb42';

UPDATE public.lessons SET
  title = 'Naming Your Inheritance',
  video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  body_markdown = E'## Key Concepts\n\nYour inheritance is not just money or property — it is patterns, fears, and unspoken rules.\n\n- **Emotional inheritance** — what your father never said\n- **Behavioral patterns** — cycles that repeat across generations\n- **Breaking the chain** — choosing which legacies to carry forward\n\nWrite down three things you inherited that serve you, and three that hold you back.',
  duration_seconds = 240
WHERE id = 'e907998c-fe85-4517-a0ef-ee4a2c04b496';

UPDATE public.lessons SET
  title = 'The Masks You Wear',
  video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  body_markdown = E'## Key Concepts\n\nEvery man wears masks. The question is whether you chose them or they chose you.\n\n- **The Provider mask** — worth equals earnings\n- **The Stoic mask** — emotions are weakness\n- **The Performer mask** — always on, never real\n\nIdentify your top three masks and ask: *Who am I when I take them off?*',
  duration_seconds = 200
WHERE id = 'fbb195e6-7122-4ef7-8a3b-779f5ed30ed0';

UPDATE public.lessons SET
  title = 'Your Code, Written Down',
  video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  body_markdown = E'## Key Concepts\n\nA personal code is not a wish list — it is a set of non-negotiables.\n\n- **Values vs. goals** — what you stand for vs. what you chase\n- **Writing your code** — 5-7 principles that define your conduct\n- **Testing your code** — does your last week reflect your principles?\n\nDraft your personal code. Keep it under 7 lines. Make it something you would be proud to read aloud.',
  duration_seconds = 300
WHERE id = '51425f94-a350-4c3b-9b4f-7fca63446c67';

UPDATE public.lessons SET
  title = 'Betraying the Old Self',
  video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  body_markdown = E'## Key Concepts\n\nGrowth requires betraying the version of you that people are comfortable with.\n\n- **The comfort trap** — why staying the same feels safe\n- **Social friction** — when your circle resists your growth\n- **The grief of change** — mourning who you were\n\nName one relationship that is threatened by your growth. How will you handle it with integrity?',
  duration_seconds = 260
WHERE id = 'f8d39b7e-87ad-4ba7-a8b1-7715cdcd39de';

UPDATE public.lessons SET
  title = 'The Man You Are Becoming',
  video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  body_markdown = E'## Key Concepts\n\nIdentity is not a destination — it is a daily practice.\n\n- **Future self visualization** — who are you in 5 years?\n- **Daily rituals** — small acts that compound into character\n- **Accountability** — the brotherhood as your mirror\n\nWrite a letter to yourself one year from now. What will you have done? Who will you have become?',
  duration_seconds = 280
WHERE id = '28c98cec-aaaa-4a0b-9c51-722211376951';

-- 9. Seed archives
INSERT INTO public.archives (title, description, recording_url, recorded_at, created_by)
VALUES
  ('Founding Circle — March 2026', 'The first official gathering of the brotherhood. We discussed our vision, values, and what it means to build something from nothing.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '2026-03-15T18:00:00Z', '2d41cefd-56dd-4eb1-b519-a8a2fbf2e863'),
  ('The Money Conversation — April 2026', 'A raw conversation about money, debt, and financial responsibility for young men in South Africa.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '2026-04-02T18:00:00Z', '2d41cefd-56dd-4eb1-b519-a8a2fbf2e863');

-- 10. Seed playbooks
INSERT INTO public.playbooks (title, slug, summary, body_markdown, category, author_id)
VALUES
  (
    'How to Run Your First Sales Call',
    'how-to-run-your-first-sales-call',
    'A step-by-step framework for young men making their first sales call — from preparation to close.',
    E'# How to Run Your First Sales Call\n\nSelling is not about manipulation. It is about solving a problem for someone who needs your help.\n\n## Before the Call\n\n- **Research** — know who you are talking to\n- **Prepare your pitch** — 30 seconds, clear value proposition\n- **Set your intention** — you are there to serve, not to beg\n\n## During the Call\n\n1. **Open with warmth** — be human, not a script\n2. **Ask questions** — understand their pain before offering solutions\n3. **Present your offer** — connect it directly to their stated problem\n4. **Handle objections** — listen, acknowledge, reframe\n5. **Close with confidence** — ask for the sale directly\n\n## After the Call\n\n- Send a follow-up within 24 hours\n- Log what worked and what did not\n- Celebrate the effort regardless of outcome\n\n> "Every master was once a disaster." — T.D. Jakes\n\nThe first call is never perfect. The tenth is better. The hundredth is where you find your voice.',
    'career',
    '2d41cefd-56dd-4eb1-b519-a8a2fbf2e863'
  ),
  (
    'The Financial Baseline Every 21-Year-Old Needs',
    'financial-baseline-21',
    'The minimum financial foundation every young man should build before chasing bigger goals.',
    E'# The Financial Baseline Every 21-Year-Old Needs\n\nYou do not need to be rich. You need to be stable.\n\n## The Four Pillars\n\n### 1. Emergency Fund\n\nSave 3 months of expenses. Not negotiable.\n\n- Open a separate savings account\n- Automate R500/month minimum\n- Do not touch it unless you lose your income\n\n### 2. Budget That Works\n\n- **50%** needs (rent, food, transport)\n- **30%** wants (entertainment, clothing)\n- **20%** savings and debt repayment\n\nTrack every rand for 30 days. The awareness alone changes behavior.\n\n### 3. Debt Strategy\n\n- List all debts smallest to largest\n- Pay minimums on everything except the smallest\n- Attack the smallest with everything extra\n- Roll payments forward as each debt dies\n\n### 4. Income Growth\n\nYour budget has a ceiling. Your income does not.\n\n- Learn one marketable skill this quarter\n- Ask for a raise or find a side income\n- Invest in yourself before you invest in markets\n\n> "Financial freedom is not about having millions. It is about your money not controlling your decisions."',
    'money',
    '3b2baaf7-5f59-4002-9611-5de826ed1eb6'
  ),
  (
    'Hard Conversations: A Script',
    'hard-conversations-a-script',
    'A practical script for having difficult conversations with people you care about without destroying the relationship.',
    E'# Hard Conversations: A Script\n\nAvoiding hard conversations does not protect relationships — it slowly poisons them.\n\n## When to Have the Conversation\n\n- When resentment is building\n- When you are losing respect for the other person\n- When silence is costing you more than honesty\n\n## The Framework\n\n### Step 1: Set the Stage\n\n*"I need to talk to you about something important. Is now a good time?"*\n\nNever ambush someone. Give them the dignity of choosing when.\n\n### Step 2: Lead with Observation\n\n*"I have noticed that [specific behavior]..."*\n\nFacts, not feelings. Not "you always" or "you never."\n\n### Step 3: Share Impact\n\n*"When that happens, I feel [emotion] because [reason]..."*\n\nOwn your feelings. Do not blame.\n\n### Step 4: Make a Request\n\n*"What I need is [specific, actionable request]..."*\n\nBe clear. Vague requests get vague results.\n\n### Step 5: Listen\n\nThe hardest step. Let them respond. Do not defend. Do not interrupt.\n\n## After the Conversation\n\n- Thank them for listening\n- Follow up in a week\n- Accept that some conversations change nothing — and have them anyway\n\n> "The quality of your life is determined by the quality of your conversations."',
    'relationships',
    '85167985-da08-49ca-842c-3c4a4ff69ed9'
  );
