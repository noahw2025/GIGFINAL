# TrackMyGig
Static front-end (HTML/CSS/JS) with Supabase for auth/data and Supabase Edge Functions for Ticketmaster/OpenAI. Deployed as pure static hosting (GitHub Pages/Vercel) with no long-lived server.

## Tech stack
- Frontend: Vanilla HTML/CSS/JS in `client/`.
- Auth + DB: Supabase (Postgres + Auth).
- Edge Functions (Deno): `ticketmaster`, `chatbot`, `artist-summary` (secrets stay server-side).
- Hosting: Any static host (GitHub Pages / Vercel static export).
- Legacy: `server/` is an old Express/SQLite backend (not used by the static app).

## Quickstart (local)
```bash
npx serve client
```
Open the printed URL (e.g., http://localhost:3000).

## Deploy
- GitHub Pages: publish the `client/` folder.
- Vercel (static): set root to `client/` and use “Other / static”.

## Environment / secrets
- Safe in client: Supabase anon URL/key (`client/scripts/supabaseClient.js`).
- Kept in Edge Functions: `TICKETMASTER_API_KEY`, `OPENAI_API_KEY` (via `supabase secrets set`).
- If you redeploy to a new project/ref, update the URLs in `client/scripts/api.js`.

## Supabase Edge Functions (deployed project `ugldbwwpjcjtfhlpxbip`)
- ticketmaster: `https://ugldbwwpjcjtfhlpxbip.functions.supabase.co/ticketmaster`
- chatbot: `https://ugldbwwpjcjtfhlpxbip.functions.supabase.co/chatbot`
- artist-summary: `https://ugldbwwpjcjtfhlpxbip.functions.supabase.co/artist-summary`
Deploy command: `supabase functions deploy <name> --no-verify-jwt`

## Functional requirements (FRD)
- Auth: Email/password signup/login via Supabase Auth; store profile (name, city, preferences).
- Browse/Search: Browse concerts, filter by genre/location/date; view details (title, venue, date, price range, status, ticket URL).
- Favorites/Wishlist: Save concerts; list and remove favorites.
- Reviews: Rate and review concerts (1–5), view recent reviews.
- Journal: Create entries tied to concerts with mood/badge/attended date.
- Notifications: Store and mark notifications (e.g., reminders, updates).
- Reminders: Set reminders (N days before a concert).
- Chatbot: Conversational search; returns up to 3 shows from Ticketmaster proxy; falls back to OpenAI response when no events found.
- AI summaries: Short artist/show summary for cards/details.
- Responsiveness: Mobile/desktop layouts for browsing, modals, and chat.
- Hosting: Must run fully in the browser; only Supabase and Edge Functions are called.

## Data model (Supabase)
Tables: `users`, `concerts`, `favorites`, `wishlists`, `reviews`, `journal_entries`, `notifications`, `reminders`. RLS should be configured per table before production (demo may be permissive).

### Reference SQL (do not run as-is; adjust constraints/RLS for your project)
```sql
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.concerts (
  id bigint NOT NULL DEFAULT nextval('concerts_id_seq'::regclass),
  external_id text UNIQUE,
  artist text NOT NULL,
  title text,
  location text,
  venue text,
  date text,
  description text,
  ticket_url text,
  source text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  genre text,
  min_price numeric,
  max_price numeric,
  ticket_status text,
  venue_address text,
  latitude numeric,
  longitude numeric,
  last_checked_at timestamp with time zone,
  last_notified_price numeric,
  last_notified_status text,
  CONSTRAINT concerts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.favorites (
  id bigint NOT NULL DEFAULT nextval('favorites_id_seq'::regclass),
  user_id bigint NOT NULL,
  concert_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT favorites_concert_id_fkey FOREIGN KEY (concert_id) REFERENCES public.concerts(id)
);
CREATE TABLE public.journal_entries (
  id bigint NOT NULL DEFAULT nextval('journal_entries_id_seq'::regclass),
  user_id bigint NOT NULL,
  concert_id bigint NOT NULL,
  entry_text text,
  mood text,
  badge_type text,
  attended_at text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT journal_entries_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT journal_entries_concert_id_fkey FOREIGN KEY (concert_id) REFERENCES public.concerts(id)
);
CREATE TABLE public.notifications (
  id bigint NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id bigint NOT NULL,
  type text,
  title text,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reminders (
  id bigint NOT NULL DEFAULT nextval('reminders_id_seq'::regclass),
  user_id bigint NOT NULL,
  concert_id bigint NOT NULL,
  remind_days_before integer DEFAULT 2,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reminders_pkey PRIMARY KEY (id),
  CONSTRAINT reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reminders_concert_id_fkey FOREIGN KEY (concert_id) REFERENCES public.concerts(id)
);
CREATE TABLE public.reviews (
  id bigint NOT NULL DEFAULT nextval('reviews_id_seq'::regclass),
  user_id bigint NOT NULL,
  concert_id bigint NOT NULL,
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reviews_concert_id_fkey FOREIGN KEY (concert_id) REFERENCES public.concerts(id)
);
CREATE TABLE public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  full_name text,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  city text,
  favorite_artists text,
  favorite_genre text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.wishlists (
  id bigint NOT NULL DEFAULT nextval('wishlists_id_seq'::regclass),
  user_id bigint NOT NULL,
  concert_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wishlists_pkey PRIMARY KEY (id),
  CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT wishlists_concert_id_fkey FOREIGN KEY (concert_id) REFERENCES public.concerts(id)
);
```

## Key files
- `client/scripts/supabaseClient.js`: anon URL/key.
- `client/scripts/api.js`: Edge Function endpoints.
- `client/scripts/chatbot.js`: chat UI + function calls.
- `supabase/functions/*`: Edge Function source (Deno).

## Notes on security
- Do not expose service role keys in the client.
- Use RLS before production; lock tables to authenticated users.
- Keep Ticketmaster/OpenAI keys only in Supabase secrets for the functions.
