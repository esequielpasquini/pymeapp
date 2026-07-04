grant usage on schema public to service_role;

grant select, insert, update, delete on
  organizations,
  profiles,
  suppliers,
  products,
  imports,
  import_items,
  price_changes,
  missing_reports
to service_role;