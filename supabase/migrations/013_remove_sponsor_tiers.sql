-- All partners are now shown as "Tour Partners" with no tier distinction;
-- ordering is managed via display_order (drag-and-drop in the admin panel).
alter table partners drop column sponsor_level;
drop type sponsor_level;
