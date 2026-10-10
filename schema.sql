-- Carrinho da Vitória: isolated, non-exposed schema. All access is mediated by
-- one RPC gated by a server secret; member permissions are checked on every call.
create schema if not exists cv;
revoke all on schema cv from public, anon, authenticated;
create table if not exists cv.settings(key text primary key, value text not null);
create table if not exists cv.members(
 id uuid primary key default gen_random_uuid(), email text unique not null,
 name text not null, role text not null check(role in ('admin','editor','contributor','viewer')),
 password_hash text, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists cv.sessions(
 token_hash text primary key, member_id uuid not null references cv.members(id),
 expires_at timestamptz not null default now()+interval '12 hours'
);
create table if not exists cv.invites(
 token_hash text primary key, member_id uuid references cv.members(id),
 expires_at timestamptz not null default now()+interval '48 hours', consumed_at timestamptz
);
create table if not exists cv.login_attempts(email text, ip text, at timestamptz not null default now());
create index if not exists cv_login_attempts_at on cv.login_attempts(at);
create table if not exists cv.items(
 id text primary key, kind text not null default 'product' check(kind in ('product','coupon')),
 status text not null check(status in ('draft','published','paused')),
 data jsonb not null, revision integer not null default 1,
 owner_id uuid references cv.members(id), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), published_at timestamptz
);
create index if not exists cv_items_status on cv.items(status);
create table if not exists cv.media(
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references cv.members(id),
 mime text not null check(mime in ('image/jpeg','image/png','image/webp')),
 base64 text not null check(length(base64)<=360000), created_at timestamptz not null default now()
);
create table if not exists cv.outbox(
 id uuid primary key default gen_random_uuid(), item_id text not null references cv.items(id),
 revision integer not null, channel text not null, payload jsonb not null,
 status text not null default 'pending' check(status in ('pending','sending','sent','failed','uncertain','cancelled')),
 lease text, leased_at timestamptz, message_id bigint, error text,
 created_at timestamptz not null default now(), sent_at timestamptz,
 unique(item_id,revision,channel)
);
create table if not exists cv.audit(
 id bigint generated always as identity primary key, actor uuid references cv.members(id),
 action text not null, item_id text, at timestamptz not null default now()
);
create table if not exists cv.click_days(day date not null, item_id text not null, source text not null, clicks bigint not null default 0, primary key(day,item_id,source));
create table if not exists cv.click_guard(visitor text not null,item_id text not null,source text not null,last_at timestamptz not null default now(),primary key(visitor,item_id,source));
alter table cv.click_days enable row level security;
alter table cv.click_guard enable row level security;
alter table cv.settings enable row level security;
alter table cv.members enable row level security;
alter table cv.sessions enable row level security;
alter table cv.invites enable row level security;
alter table cv.login_attempts enable row level security;
alter table cv.items enable row level security;
alter table cv.media enable row level security;
alter table cv.outbox enable row level security;
alter table cv.audit enable row level security;
revoke all on all tables in schema cv from public,anon,authenticated;

create or replace function cv.api(p_gate text,p_action text,p_data jsonb default '{}'::jsonb,p_session text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 m cv.members; target cv.members; item cv.items; job cv.outbox; inv cv.invites;
 v_token text; v_hash text; v_id text; v_email text; v_password text;
 v_status text; v_doc jsonb; v_channel text; v_revision integer; v_img jsonb; v_role text;
begin
 if not exists(select 1 from cv.settings where key='gate_hash' and value=encode(extensions.digest(coalesce(p_gate,''),'sha256'),'hex')) then
  return jsonb_build_object('ok',false,'error','service_denied');
 end if;
 if p_action='catalog' then
  return jsonb_build_object('ok',true,'items',coalesce((select jsonb_agg(data||jsonb_build_object('id',id,'kind',kind) order by published_at desc nulls last,created_at desc) from cv.items where status='published' and (kind<>'coupon' or nullif(data->>'expiresAt','') is null or (data->>'expiresAt')::timestamptz>now())),'[]'::jsonb));
 end if;
 if p_action='media' then
  if p_session<>'' then select u.* into m from cv.sessions s join cv.members u on u.id=s.member_id where s.token_hash=encode(extensions.digest(p_session,'sha256'),'hex') and s.expires_at>now() and u.active; end if;
  return coalesce((select jsonb_build_object('ok',true,'mime',x.mime,'base64',x.base64) from cv.media x where x.id::text=p_data->>'id' and (m.id is not null and (m.role in ('admin','editor','viewer') or x.owner_id=m.id) or exists(select 1 from cv.items i where i.status='published' and i.data->'images' @> jsonb_build_array('/api/media?id='||x.id::text)))) ,jsonb_build_object('ok',false,'error','not_found'));
 end if;
 if p_action in ('click','view') then
  v_id=case when p_action='view' then '__site__' else p_data->>'id' end;
  if p_action='click' then
   select * into item from cv.items where id=v_id and status='published' and (kind<>'coupon' or nullif(data->>'expiresAt','') is null or (data->>'expiresAt')::timestamptz>now());
   if item.id is null then return jsonb_build_object('ok',false,'error','not_found'); end if;
  end if;
  v_channel=case when p_data->>'source'='telegram' then 'telegram' else 'site' end;
  if coalesce((p_data->>'count')::boolean,false) then
   delete from cv.click_guard where last_at<now()-interval '3 days';
   v_hash=p_data->>'visitor';
   if length(v_hash)=64 then
    insert into cv.click_guard(visitor,item_id,source) values(v_hash,v_id,v_channel) on conflict(visitor,item_id,source) do update set last_at=now() where cv.click_guard.last_at<now()-interval '30 seconds';
    if found then
     insert into cv.click_days(day,item_id,source,clicks) values((now() at time zone 'America/Sao_Paulo')::date,v_id,v_channel,1) on conflict(day,item_id,source) do update set clicks=cv.click_days.clicks+1;
    end if;
   end if;
  end if;
  return jsonb_build_object('ok',true,'link',item.data->>'link');
 end if;
 if p_action='setup_status' then return jsonb_build_object('ok',true,'initialized',exists(select 1 from cv.members where role='admin' and active)); end if;
 if p_action in ('activate','login') then
  v_email=lower(trim(p_data->>'email')); v_password=p_data->>'password';
  if v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(v_email)>254 then return jsonb_build_object('ok',false,'error','invalid_credentials'); end if;
  delete from cv.login_attempts where at<now()-interval '1 day';
  if (select count(*) from cv.login_attempts where at>now()-interval '15 minutes' and (email=v_email or ip=p_data->>'ip'))>=10 then return jsonb_build_object('ok',false,'error','rate_limited'); end if;
  insert into cv.login_attempts(email,ip) values(v_email,left(p_data->>'ip',100));
  if p_action='activate' then
   if octet_length(coalesce(v_password,''))<10 or octet_length(v_password)>72 then return jsonb_build_object('ok',false,'error','password_length'); end if;
   v_hash=encode(extensions.digest(coalesce(p_data->>'code',''),'sha256'),'hex');
   select * into inv from cv.invites where token_hash=v_hash and consumed_at is null and expires_at>now() for update;
   if not found then return jsonb_build_object('ok',false,'error','activation_invalid'); end if;
   if inv.member_id is null then
    if exists(select 1 from cv.members where role='admin') then return jsonb_build_object('ok',false,'error','activation_invalid'); end if;
    insert into cv.members(email,name,role,password_hash) values(v_email,left(coalesce(nullif(trim(p_data->>'name'),''),'Filipe Fortunato'),80),'admin',extensions.crypt(v_password,extensions.gen_salt('bf',12))) returning * into m;
   else
    select * into m from cv.members where id=inv.member_id and email=v_email and active for update;
    if not found then return jsonb_build_object('ok',false,'error','activation_invalid'); end if;
    update cv.members set password_hash=extensions.crypt(v_password,extensions.gen_salt('bf',12)) where id=m.id returning * into m;
    delete from cv.sessions where member_id=m.id;
   end if;
   update cv.invites set consumed_at=now() where token_hash=v_hash;
  else
   select * into m from cv.members where email=v_email and active;
   if m.id is null or m.password_hash is null or octet_length(coalesce(v_password,''))>72 or extensions.crypt(coalesce(v_password,''),m.password_hash)<>m.password_hash then return jsonb_build_object('ok',false,'error','invalid_credentials'); end if;
  end if;
  delete from cv.login_attempts where email=v_email;
  delete from cv.sessions where expires_at<now();
  v_token=encode(extensions.gen_random_bytes(32),'hex');
  insert into cv.sessions(token_hash,member_id) values(encode(extensions.digest(v_token,'sha256'),'hex'),m.id);
  return jsonb_build_object('ok',true,'session',v_token,'user',jsonb_build_object('id',m.id,'name',m.name,'email',m.email,'role',m.role));
 end if;
 select u.* into m from cv.sessions s join cv.members u on u.id=s.member_id where s.token_hash=encode(extensions.digest(coalesce(p_session,''),'sha256'),'hex') and s.expires_at>now() and u.active;
 if m.id is null then return jsonb_build_object('ok',false,'error','unauthorized'); end if;
 if p_action='me' then return jsonb_build_object('ok',true,'user',jsonb_build_object('id',m.id,'name',m.name,'email',m.email,'role',m.role)); end if;
 if p_action='logout' then delete from cv.sessions where token_hash=encode(extensions.digest(p_session,'sha256'),'hex'); return jsonb_build_object('ok',true); end if;
 if p_action='password' then
  v_password=p_data->>'password';
  if extensions.crypt(coalesce(p_data->>'currentPassword',''),m.password_hash)<>m.password_hash then return jsonb_build_object('ok',false,'error','invalid_credentials'); end if;
  if octet_length(coalesce(v_password,''))<10 or octet_length(v_password)>72 then return jsonb_build_object('ok',false,'error','password_length'); end if;
  update cv.members set password_hash=extensions.crypt(v_password,extensions.gen_salt('bf',12)) where id=m.id;
  delete from cv.sessions where member_id=m.id and token_hash<>encode(extensions.digest(p_session,'sha256'),'hex');
  return jsonb_build_object('ok',true);
 end if;
 if p_action='dashboard' then
  return jsonb_build_object('ok',true,'items',coalesce((select jsonb_agg(jsonb_build_object('id',id,'kind',kind,'status',status,'data',data,'revision',revision,'ownerId',owner_id,'createdAt',created_at,'updatedAt',updated_at) order by updated_at desc) from cv.items where m.role<>'contributor' or owner_id=m.id),'[]'::jsonb),
  'deliveries',coalesce((select jsonb_agg(to_jsonb(j)-'payload'-'lease' order by created_at desc) from (select * from cv.outbox order by created_at desc limit 100) j),'[]'::jsonb),
  'activity',coalesce((select jsonb_agg(jsonb_build_object('action',a.action,'itemId',a.item_id,'at',a.at,'name',u.name) order by a.at desc) from (select * from cv.audit order by at desc limit 20) a left join cv.members u on a.actor=u.id),'[]'::jsonb));
 end if;
 if p_action='analytics' then
  return jsonb_build_object('ok',true,
   'days',coalesce((select jsonb_agg(to_jsonb(c) order by day) from cv.click_days c where day>=coalesce(nullif(p_data->>'from','')::date,current_date-29) and day<=coalesce(nullif(p_data->>'to','')::date,current_date)),'[]'::jsonb),
   'since',(select min(day) from cv.click_days));
 end if;
 if p_action='members' then
  if m.role<>'admin' then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  return jsonb_build_object('ok',true,'members',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'email',email,'role',role,'active',active,'activated',password_hash is not null) order by created_at) from cv.members),'[]'::jsonb));
 end if;
 if p_action in ('invite','member') then
  if m.role<>'admin' then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  perform pg_advisory_xact_lock(81981010);
  v_role=p_data->>'role';
  if v_role not in ('admin','editor','contributor','viewer') then return jsonb_build_object('ok',false,'error','invalid_role'); end if;
  if p_action='member' then
   select * into target from cv.members where id::text=p_data->>'id' for update;
   if target.id is null then return jsonb_build_object('ok',false,'error','not_found'); end if;
   if target.id=m.id then return jsonb_build_object('ok',false,'error','own_access'); end if;
   if target.role='admin' and (v_role<>'admin' or not (p_data->>'active')::boolean) and (select count(*) from cv.members where role='admin' and active)<=1 then return jsonb_build_object('ok',false,'error','last_admin'); end if;
   update cv.members set role=v_role,active=(p_data->>'active')::boolean where id=target.id;
   delete from cv.sessions where member_id=target.id;
   insert into cv.audit(actor,action,item_id) values(m.id,'Acesso da equipe atualizado',target.id::text);
   return jsonb_build_object('ok',true);
  end if;
  v_email=lower(trim(p_data->>'email'));
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(v_email)>254 or coalesce(length(trim(p_data->>'name')),0)<2 then return jsonb_build_object('ok',false,'error','invalid_member'); end if;
  select * into target from cv.members where email=v_email;
  if target.id=m.id then return jsonb_build_object('ok',false,'error','own_access'); end if;
  if target.id is null then insert into cv.members(email,name,role) values(v_email,left(trim(p_data->>'name'),80),v_role) returning * into target; end if;
  update cv.invites set consumed_at=now() where member_id=target.id and consumed_at is null;
  v_token=encode(extensions.gen_random_bytes(32),'hex');
  insert into cv.invites(token_hash,member_id) values(encode(extensions.digest(v_token,'sha256'),'hex'),target.id);
  insert into cv.audit(actor,action,item_id) values(m.id,'Link de acesso criado',target.id::text);
  return jsonb_build_object('ok',true,'code',v_token,'email',target.email);
 end if;
 if p_action='upload' then
  if m.role='viewer' then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  if p_data->>'mime' not in ('image/jpeg','image/png','image/webp') or coalesce(length(p_data->>'base64'),0)>360000 or coalesce(length(p_data->>'base64'),0)<20 then return jsonb_build_object('ok',false,'error','invalid_image'); end if;
  insert into cv.media(owner_id,mime,base64) values(m.id,p_data->>'mime',p_data->>'base64') returning id::text into v_id;
  return jsonb_build_object('ok',true,'url','/api/media?id='||v_id);
 end if;
 if p_action='save' then
  if m.role='viewer' then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  v_id=p_data->>'id'; v_status=p_data->>'status'; v_doc=p_data->'data';
  if v_id !~ '^[a-z0-9][a-z0-9-]{0,119}$' or v_status not in ('draft','published','paused') or p_data->>'kind' not in ('product','coupon') or jsonb_typeof(v_doc)<>'object' then return jsonb_build_object('ok',false,'error','invalid_item'); end if;
  select * into item from cv.items where id=v_id for update;
  if m.role='contributor' and (v_status<>'draft' or item.id is not null and (item.owner_id is distinct from m.id or item.status<>'draft')) then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  if item.id is not null and coalesce((p_data->>'revision')::int,0)<>item.revision then return jsonb_build_object('ok',false,'error','conflict'); end if;
  if jsonb_array_length(coalesce(v_doc->'images','[]'::jsonb))>5 or coalesce(length(v_doc->>'title'),0)<2 or coalesce(length(v_doc->>'title'),0)>180 or coalesce(v_doc->>'link','') !~ '^https://' then return jsonb_build_object('ok',false,'error','invalid_item'); end if;
  if v_status='published' and p_data->>'kind'='product' and jsonb_array_length(coalesce(v_doc->'images','[]'::jsonb))=0 then return jsonb_build_object('ok',false,'error','image_required'); end if;
  for v_img in select jsonb_array_elements(coalesce(v_doc->'images','[]'::jsonb)) loop
   if (v_img#>>'{}') like '/api/media?id=%' and not exists(select 1 from cv.media where id::text=split_part(v_img#>>'{}','=',2) and (owner_id=m.id or m.role in ('admin','editor'))) then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  end loop;
  v_doc=v_doc||jsonb_build_object('id',v_id,'kind',p_data->>'kind'); v_revision=coalesce(item.revision,0)+1;
  insert into cv.items(id,kind,status,data,revision,owner_id,published_at) values(v_id,p_data->>'kind',v_status,v_doc,v_revision,m.id,case when v_status='published' then now() end)
  on conflict(id) do update set status=excluded.status,data=excluded.data,revision=excluded.revision,updated_at=now(),published_at=case when excluded.status='published' then coalesce(cv.items.published_at,now()) else cv.items.published_at end;
  if v_status<>'published' then update cv.outbox set status='cancelled' where item_id=v_id and status in ('pending','failed'); end if;
  if v_status='published' and coalesce(item.status,'draft')<>'published' and coalesce((p_data->>'notify')::boolean,true) then
   for v_channel in select jsonb_array_elements_text(coalesce(p_data->'channels','[]'::jsonb)) loop
    insert into cv.outbox(item_id,revision,channel,payload) values(v_id,v_revision,v_channel,v_doc) on conflict do nothing;
   end loop;
  end if;
  insert into cv.audit(actor,action,item_id) values(m.id,case v_status when 'published' then 'Achado publicado' when 'paused' then 'Achado pausado' else 'Rascunho salvo' end,v_id);
  return jsonb_build_object('ok',true,'id',v_id,'revision',v_revision);
 end if;
 if p_action in ('claim','complete','retry') then
  if m.role not in ('admin','editor') then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  if p_action='retry' then
   update cv.outbox set status='pending',error=null where id::text=p_data->>'id' and status='failed' and exists(select 1 from cv.items i where i.id=item_id and i.status='published');
   return jsonb_build_object('ok',true);
  end if;
  if p_action='claim' then
   update cv.outbox set status='uncertain',error='Envio interrompido. Confira o grupo antes de reenviar.' where status='sending' and leased_at<now()-interval '2 minutes';
   select j.* into job from cv.outbox j join cv.items i on i.id=j.item_id where j.status='pending' and i.status='published' order by j.created_at limit 1 for update of j skip locked;
   if job.id is null then return jsonb_build_object('ok',true,'job',null); end if;
   v_token=encode(extensions.gen_random_bytes(16),'hex');
   update cv.outbox set status='sending',lease=v_token,leased_at=now() where id=job.id;
   return jsonb_build_object('ok',true,'job',to_jsonb(job)||jsonb_build_object('lease',v_token));
  end if;
  update cv.outbox set status=case when p_data->>'status' in ('sent','failed','uncertain') then p_data->>'status' else 'failed' end,message_id=(p_data->>'messageId')::bigint,error=left(p_data->>'error',200),sent_at=case when p_data->>'status'='sent' then now() end
  where id::text=p_data->>'id' and lease=p_data->>'lease' and status='sending';
  return jsonb_build_object('ok',true);
 end if;
 return jsonb_build_object('ok',false,'error','unknown_action');
end $$;
revoke all on function cv.api(text,text,jsonb,text) from public,anon,authenticated;
-- The exposed wrapper has no privileged rights. The private implementation is
-- deliberately SECURITY DEFINER to serve an isolated app, and requires both the
-- deployment secret and, for privileged operations, a current member session.
grant usage on schema cv to anon;
grant execute on function cv.api(text,text,jsonb,text) to anon;
create or replace function public.cv_rpc(p_gate text,p_action text,p_data jsonb default '{}'::jsonb,p_session text default '')
returns jsonb language sql security invoker set search_path='' as $$ select cv.api(p_gate,p_action,p_data,p_session) $$;
revoke all on function public.cv_rpc(text,text,jsonb,text) from public,authenticated;
grant execute on function public.cv_rpc(text,text,jsonb,text) to anon;
