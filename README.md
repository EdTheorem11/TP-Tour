# TP Tour

**Golf. Network. Compete.** The UAE's golf society management platform for professionals across Finance, Crypto, Digital Assets and FinTech.

Built with Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres, Auth, RLS).

## What's here

- **Public marketing site** — home, tour schedule, event detail, order of merit, results, about, partners.
- **Member platform** — registration/login, My TP Tour dashboard, event entry + waiting list, personal results, handicap submission, profile & directory-visibility controls, players directory, player profiles.
- **Admin panel** (`/admin`) — dashboard, events CRUD, entries & waiting list management, members (approve/suspend/role/handicap), scoring & results publishing with corrections, Order of Merit configuration + manual adjustments, golf clubs/courses, partners, site content, settings.
- **Database** — full relational schema with Row Level Security, handicap history, Order of Merit calculation (configurable points table, best-N-results dropping, major multipliers, manual adjustments), audit log. See `supabase/migrations`.

## First-time setup

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then from **Project Settings → API** copy the Project URL and anon public key into `.env.local` (copy `.env.local.example` as a starting point):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Until real credentials are set, the app runs with placeholder values and every page renders with graceful empty states (no crashes) — useful for reviewing layout/design before the database is wired up.

### 2. Run the database migrations

In the Supabase SQL Editor, run these files **in order**:

1. `supabase/migrations/001_schema.sql` — tables & enums
2. `supabase/migrations/002_functions.sql` — triggers, handicap workflow, results publishing, Order of Merit calculation
3. `supabase/migrations/003_rls.sql` — Row Level Security policies
4. `supabase/migrations/004_views.sql` — public-safe views (player directory with privacy masking, event capacity, next event, latest results)

Then run `supabase/seed/seed.sql` to load the golf clubs, the **TP Tour 2026/27** season and its 7 scheduled events (Yas Links, The Els Club, Dubai Hills, Saadiyat ×2, The Montgomerie, Yas Links), plus starter homepage content. Unknown details (times, prices, formats, capacity, sponsors) are left as `TBC`/`null` on purpose, editable from **Admin → Events**.

### 3. Create your first Super Admin

Register a normal account through `/register`, then in the Supabase SQL Editor run:

```sql
update member_profiles set role = 'super_admin', status = 'approved' where email = 'you@example.com';
```

You can now sign in and manage the platform from `/admin`.

### 4. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes for what's next

- **Payments**: handled manually by design — admins mark each entry Paid / Unpaid / Complimentary from Admin → Entries. No online checkout is planned.
- **Email**: `notifications` rows are created for key events (approval, entry confirmed, waiting list promoted, results published, handicap updated) with a `channel` and `status` column — connect Resend (or similar) to actually send them.
- **WhatsApp / push**: `notifications.channel` already supports `whatsapp` and `push` as values, ready for a future sender.
- **Tee sheets**: entries already carry `tee_time` / `starting_hole` / `group_number` columns, ready for a future tee-time publishing UI.
