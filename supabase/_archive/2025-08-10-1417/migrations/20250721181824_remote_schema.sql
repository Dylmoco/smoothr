create policy "Allow service role read access"
on "public"."store_integrations"
as permissive
for select
to service_role
using (true);



