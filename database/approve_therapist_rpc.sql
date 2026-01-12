-- 관리자가 치료사를 승인하는 함수
-- 이 함수는 SECURITY DEFINER로 실행되어 RLS를 우회합니다.
create or replace function approve_therapist(target_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  caller_role text;
begin
  -- 호출자가 관리자인지 확인
  select role into caller_role
  from public.user_profiles
  where id = auth.uid();

  if caller_role not in ('admin', 'super_admin') then
    return json_build_object('success', false, 'message', '관리자 권한이 필요합니다.');
  end if;

  -- 프로필 업데이트: role='therapist', status='active'
  update public.user_profiles
  set status = 'active', role = 'therapist'
  where id = target_user_id;

  -- therapists 테이블 업데이트 (선택 사항)
  update public.therapists
  set color = '#3b82f6'
  where id = target_user_id;

  return json_build_object('success', true, 'message', '승인되었습니다.');
end;
$$;
