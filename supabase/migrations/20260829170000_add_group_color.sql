alter table public.tack_groups
add column color text not null default '#ffff99';

alter table public.tack_groups
add constraint tack_groups_color_hex_check
check (color ~ '^#[0-9a-fA-F]{6}$');
