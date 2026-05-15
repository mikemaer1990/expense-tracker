-- Migration 009: Explicit table grants for Supabase Data API
-- Required ahead of Supabase breaking change (enforced October 30, 2026)
-- See: https://github.com/orgs/supabase/discussions/45329
--
-- No anonymous access — all routes are behind authentication.
-- RLS policies remain the real security boundary.

grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.expense_types to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.income to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;
