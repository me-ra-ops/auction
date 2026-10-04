# Tool auction

1. Supabase (free): new project, SQL editor, run:
   `create table auction_state(id int primary key, data jsonb); alter table auction_state enable row level security;`
   Copy the project URL and the service_role key (Settings, API).
2. Push this folder to GitHub. Render: New, Web Service, connect repo. Build `npm install`, start `npm start`, plan Free.
3. Render env vars: SUPABASE_URL, SUPABASE_KEY (service_role), ADMIN_PASS.
4. Open the site 5 minutes before the event to wake the server.

Local test: `npm install && ADMIN_PASS=x npm start`, open http://localhost:3000 (works without Supabase, state is then in memory only).
