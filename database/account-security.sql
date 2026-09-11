-- Limit account internals to server-side use.
-- Keep the signed-in role check and training entrypoint available.
revoke execute on function public.is_coach() from public, anon;
grant execute on function public.is_coach() to authenticated;
revoke execute on function public.log_training_session(text,text,text,integer,text) from public, anon;
grant execute on function public.log_training_session(text,text,text,integer,text) to authenticated;
-- Only log_training_session calls this helper; its owner retains access.
revoke execute on function public.award_learning_xp(text,text,integer,text,jsonb) from public, anon, authenticated;
-- Existing Auth triggers retain their server execution context.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_mentorship_user() from public, anon, authenticated;
