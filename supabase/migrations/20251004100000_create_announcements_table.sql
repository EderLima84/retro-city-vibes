CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON announcements
FOR SELECT USING (true);