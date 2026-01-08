-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read settings
CREATE POLICY "Public read access" ON admin_settings
    FOR SELECT
    USING (true);

-- Policy: Only admins/managers can insert or update
CREATE POLICY "Admin write access" ON admin_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Seed initial data
INSERT INTO admin_settings (key, value)
VALUES 
    ('kakao_url', 'https://pf.kakao.com/_example'),
    ('main_banner_url', 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?auto=format&fit=crop&q=80&w=2000'),
    ('notice_text', '센터 소식: 3월 신규 아동 모집 중입니다. (선착순 마감)')
ON CONFLICT (key) DO NOTHING;
