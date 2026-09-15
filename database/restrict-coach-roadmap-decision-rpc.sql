-- Security hardening for the coach roadmap decision RPC.
-- The function itself still enforces public.is_coach(); this removes anonymous invocation.
revoke execute on function public.coach_decide_roadmap_item(uuid,text,uuid) from public, anon;
grant execute on function public.coach_decide_roadmap_item(uuid,text,uuid) to authenticated, service_role;
