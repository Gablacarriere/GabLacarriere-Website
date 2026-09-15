-- Security hardening for the coach roadmap decision RPC.
-- Coaches already have RLS-gated access to mentorship_roadmap_items, so elevated
-- SECURITY DEFINER privileges are not needed here.
alter function public.coach_decide_roadmap_item(uuid,text,uuid) security invoker;
revoke execute on function public.coach_decide_roadmap_item(uuid,text,uuid) from public, anon;
grant execute on function public.coach_decide_roadmap_item(uuid,text,uuid) to authenticated, service_role;
