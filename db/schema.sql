CREATE TABLE projects (
  id          serial PRIMARY KEY,
  name        text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  description text NOT NULL DEFAULT '',
  color       text NOT NULL DEFAULT '#6366f1',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id          serial PRIMARY KEY,
  github_id   text NOT NULL UNIQUE,
  name        text,
  email       text,
  image       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects
  ADD COLUMN owner_id integer REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX projects_owner_idx ON projects(owner_id);

CREATE TABLE tasks (
  id          serial PRIMARY KEY,
  project_id  integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 140),
  status      text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','done')),
  priority    text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date    date,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tasks_project_idx ON tasks(project_id);

CREATE TABLE task_comments (
  id          serial PRIMARY KEY,
  task_id     integer NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id   integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX task_comments_task_created_idx ON task_comments(task_id, created_at, id);

INSERT INTO projects (name, description, color) VALUES
  ('Website Redesign', 'Refresh the company marketing site', '#0ea5e9'),
  ('Mobile App MVP', 'First release of the customer app', '#22c55e');
INSERT INTO tasks (project_id, title, status, priority, due_date) VALUES
  (1, 'Audit current pages', 'done', 'medium', CURRENT_DATE - 2),
  (1, 'Design new homepage', 'doing', 'high', CURRENT_DATE + 2),
  (2, 'Set up authentication', 'todo', 'high', CURRENT_DATE + 5);