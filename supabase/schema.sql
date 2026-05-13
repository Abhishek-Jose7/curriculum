-- Supabase/PostgreSQL schema for the Curriculum Management and Publishing System.
-- This mirrors the Django domain model while using Supabase Auth identities.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create type app_role as enum ('ADMIN', 'HOD', 'FACULTY', 'REVIEWER', 'PUBLIC');
create type course_type as enum ('THEORY', 'LAB', 'PROJECT', 'ELECTIVE', 'INTERDISCIPLINARY');
create type course_status as enum ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'LOCKED');
create type workflow_decision as enum ('REQUEST_CHANGES', 'APPROVE', 'REJECT', 'PUBLISH');

create table departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  college_name text,
  university_name text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'FACULTY',
  department_id uuid references departments(id) on delete set null,
  first_name text,
  last_name text,
  designation text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table semesters (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  academic_year_id uuid not null references academic_years(id) on delete cascade,
  number smallint not null check (number > 0),
  title text not null,
  ordinance text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (department_id, academic_year_id, number)
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references semesters(id) on delete cascade,
  faculty_id uuid references profiles(id) on delete set null,
  code text not null,
  title text not null,
  course_type course_type not null default 'THEORY',
  status course_status not null default 'DRAFT',
  lecture_hours smallint not null default 0 check (lecture_hours >= 0),
  tutorial_hours smallint not null default 0 check (tutorial_hours >= 0),
  practical_hours smallint not null default 0 check (practical_hours >= 0),
  credits numeric(4,1) not null default 0,
  internal_marks smallint not null default 0,
  external_marks smallint not null default 0,
  duration_hours numeric(3,1) not null default 3,
  passing_marks smallint not null default 0,
  pre_requisites text,
  objectives text,
  syllabus_intro text,
  online_resources jsonb not null default '[]'::jsonb,
  section_order jsonb not null default '[]'::jsonb,
  approved_by uuid references profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (semester_id, code)
);

create index courses_status_idx on courses(status);
create index courses_faculty_idx on courses(faculty_id);
create index courses_type_idx on courses(course_type);

create table course_outcomes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  code text not null,
  description text not null,
  bloom_level text,
  sort_order smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, code)
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  number smallint not null,
  title text not null,
  contact_hours smallint not null default 0,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, number)
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  description text,
  sort_order smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table experiments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  number smallint not null,
  title text not null,
  description text,
  hours smallint not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, number)
);

create table assessment_schemes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  component text not null,
  marks smallint not null check (marks >= 0),
  description text,
  sort_order smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table reference_books (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  authors text,
  publisher text,
  edition text,
  year text,
  is_textbook boolean not null default false,
  sort_order smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table course_versions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  version_number integer not null,
  edited_by uuid references profiles(id) on delete set null,
  previous_version_id uuid references course_versions(id) on delete set null,
  snapshot jsonb not null,
  change_summary text,
  created_at timestamptz not null default now(),
  unique (course_id, version_number)
);

create table reviewer_comments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  reviewer_id uuid references profiles(id) on delete set null,
  section_key text not null,
  section_label text not null,
  body text not null,
  is_resolved boolean not null default false,
  resolved_by uuid references profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviewer_comments_section_idx on reviewer_comments(course_id, section_key, is_resolved);

create table approval_workflows (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  from_status course_status not null,
  to_status course_status not null,
  decision workflow_decision not null,
  note text,
  created_at timestamptz not null default now()
);

create table curriculum_templates (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  name text not null,
  html_template text not null,
  css text not null,
  template_pdf_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table published_curricula (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  academic_year_id uuid not null references academic_years(id) on delete cascade,
  template_id uuid not null references curriculum_templates(id) on delete restrict,
  published_by uuid references profiles(id) on delete set null,
  pdf_url text not null,
  docx_url text,
  version_label text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (department_id, academic_year_id, version_label)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete set null,
  method text not null,
  path text not null,
  status_code integer,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_departments before update on departments for each row execute function touch_updated_at();
create trigger touch_profiles before update on profiles for each row execute function touch_updated_at();
create trigger touch_academic_years before update on academic_years for each row execute function touch_updated_at();
create trigger touch_semesters before update on semesters for each row execute function touch_updated_at();
create trigger touch_courses before update on courses for each row execute function touch_updated_at();
create trigger touch_course_outcomes before update on course_outcomes for each row execute function touch_updated_at();
create trigger touch_modules before update on modules for each row execute function touch_updated_at();
create trigger touch_topics before update on topics for each row execute function touch_updated_at();
create trigger touch_experiments before update on experiments for each row execute function touch_updated_at();
create trigger touch_assessment_schemes before update on assessment_schemes for each row execute function touch_updated_at();
create trigger touch_reference_books before update on reference_books for each row execute function touch_updated_at();
create trigger touch_reviewer_comments before update on reviewer_comments for each row execute function touch_updated_at();
create trigger touch_curriculum_templates before update on curriculum_templates for each row execute function touch_updated_at();
create trigger touch_published_curricula before update on published_curricula for each row execute function touch_updated_at();
create trigger touch_notifications before update on notifications for each row execute function touch_updated_at();

create or replace function current_role()
returns app_role language sql stable as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_academic_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('ADMIN', 'HOD')
      and is_active = true
  )
$$;

alter table departments enable row level security;
alter table profiles enable row level security;
alter table academic_years enable row level security;
alter table semesters enable row level security;
alter table courses enable row level security;
alter table course_outcomes enable row level security;
alter table modules enable row level security;
alter table topics enable row level security;
alter table experiments enable row level security;
alter table assessment_schemes enable row level security;
alter table reference_books enable row level security;
alter table course_versions enable row level security;
alter table reviewer_comments enable row level security;
alter table approval_workflows enable row level security;
alter table curriculum_templates enable row level security;
alter table published_curricula enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

create policy "public can read published curricula" on published_curricula
  for select using (is_public = true or is_academic_admin() or published_by = auth.uid());

create policy "authenticated read departments" on departments for select to authenticated using (true);
create policy "admins manage departments" on departments for all to authenticated using (is_academic_admin()) with check (is_academic_admin());

create policy "profiles read authenticated" on profiles for select to authenticated using (true);
create policy "users update own profile" on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "admins manage profiles" on profiles for all to authenticated using (is_academic_admin()) with check (is_academic_admin());

create policy "authenticated read academic structure" on academic_years for select to authenticated using (true);
create policy "admins manage academic years" on academic_years for all to authenticated using (is_academic_admin()) with check (is_academic_admin());
create policy "authenticated read semesters" on semesters for select to authenticated using (true);
create policy "admins manage semesters" on semesters for all to authenticated using (is_academic_admin()) with check (is_academic_admin());

create policy "course visible to participants" on courses for select to authenticated using (
  is_academic_admin()
  or faculty_id = auth.uid()
  or current_role() = 'REVIEWER'
  or status in ('PUBLISHED')
);

create policy "faculty edit editable assigned courses" on courses for update to authenticated using (
  faculty_id = auth.uid()
  and status in ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED')
) with check (
  faculty_id = auth.uid()
  and status in ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED')
);

create policy "admins manage courses" on courses for all to authenticated using (is_academic_admin()) with check (is_academic_admin());

create policy "course children readable" on course_outcomes for select to authenticated using (exists (select 1 from courses c where c.id = course_id));
create policy "course outcomes editable by owner/admin" on course_outcomes for all to authenticated using (
  is_academic_admin() or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid() and c.status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED'))
) with check (
  is_academic_admin() or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid() and c.status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED'))
);

create policy "modules readable" on modules for select to authenticated using (exists (select 1 from courses c where c.id = course_id));
create policy "modules editable by owner/admin" on modules for all to authenticated using (
  is_academic_admin() or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid() and c.status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED'))
) with check (
  is_academic_admin() or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid() and c.status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED'))
);

create policy "topics readable" on topics for select to authenticated using (exists (select 1 from modules m join courses c on c.id = m.course_id where m.id = module_id));
create policy "topics editable by owner/admin" on topics for all to authenticated using (
  is_academic_admin() or exists (select 1 from modules m join courses c on c.id = m.course_id where m.id = module_id and c.faculty_id = auth.uid() and c.status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED'))
) with check (
  is_academic_admin() or exists (select 1 from modules m join courses c on c.id = m.course_id where m.id = module_id and c.faculty_id = auth.uid() and c.status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED'))
);

create policy "experiments readable" on experiments for select to authenticated using (exists (select 1 from courses c where c.id = course_id));
create policy "experiments editable by owner/admin" on experiments for all to authenticated using (
  is_academic_admin() or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid() and c.status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED'))
) with check (
  is_academic_admin() or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid() and c.status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED'))
);

create policy "assessments readable" on assessment_schemes for select to authenticated using (exists (select 1 from courses c where c.id = course_id));
create policy "assessments editable by owner/admin" on assessment_schemes for all to authenticated using (
  is_academic_admin() or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid() and c.status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED'))
) with check (
  is_academic_admin() or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid() and c.status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED'))
);

create policy "references readable" on reference_books for select to authenticated using (exists (select 1 from courses c where c.id = course_id));
create policy "references editable by owner/admin" on reference_books for all to authenticated using (
  is_academic_admin() or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid() and c.status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED'))
) with check (
  is_academic_admin() or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid() and c.status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED'))
);

create policy "versions readable by participants" on course_versions for select to authenticated using (
  is_academic_admin()
  or exists (select 1 from courses c where c.id = course_id and (c.faculty_id = auth.uid() or current_role() = 'REVIEWER'))
);
create policy "versions created by participants" on course_versions for insert to authenticated with check (
  is_academic_admin()
  or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid())
);

create policy "comments readable by participants" on reviewer_comments for select to authenticated using (
  is_academic_admin()
  or reviewer_id = auth.uid()
  or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid())
);
create policy "reviewers write comments" on reviewer_comments for insert to authenticated with check (current_role() in ('REVIEWER','ADMIN','HOD'));
create policy "reviewers resolve own comments or admin" on reviewer_comments for update to authenticated using (reviewer_id = auth.uid() or is_academic_admin()) with check (reviewer_id = auth.uid() or is_academic_admin());

create policy "workflow readable by participants" on approval_workflows for select to authenticated using (
  is_academic_admin()
  or actor_id = auth.uid()
  or exists (select 1 from courses c where c.id = course_id and c.faculty_id = auth.uid())
);
create policy "reviewers create workflow decisions" on approval_workflows for insert to authenticated with check (current_role() in ('REVIEWER','ADMIN','HOD'));

create policy "templates read authenticated" on curriculum_templates for select to authenticated using (true);
create policy "admins manage templates" on curriculum_templates for all to authenticated using (is_academic_admin()) with check (is_academic_admin());

create policy "users read own notifications" on notifications for select to authenticated using (user_id = auth.uid());
create policy "users update own notifications" on notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "admins read audit logs" on audit_logs for select to authenticated using (is_academic_admin());
