-- ============================================
-- Silver Care - Electronic Documents Schema
-- 전자 서류 시스템 (표준약관, 개인정보동의서 등)
-- ============================================

-- 1. Electronic Documents Table
CREATE TABLE IF NOT EXISTS electronic_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES children(id) ON DELETE SET NULL,
    
    -- Document Type & Content
    type TEXT NOT NULL CHECK (type IN ('contract', 'care_plan', 'privacy_consent', 'abuse_prevention', 'needs_assessment')),
    title TEXT NOT NULL,
    content JSONB DEFAULT '{}', -- Form data
    
    -- Signatures: [{role: 'guardian'|'recipient'|'staff', name: string, signature_url: string, signed_at: timestamp}]
    signatures JSONB DEFAULT '[]',
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'signed', 'expired', 'archived')),
    
    -- Timestamps
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_electronic_documents_center_id ON electronic_documents(center_id);
CREATE INDEX IF NOT EXISTS idx_electronic_documents_recipient_id ON electronic_documents(recipient_id);
CREATE INDEX IF NOT EXISTS idx_electronic_documents_status ON electronic_documents(status);
CREATE INDEX IF NOT EXISTS idx_electronic_documents_type ON electronic_documents(type);

-- 3. Row Level Security
ALTER TABLE electronic_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access documents from their center
CREATE POLICY "center_isolation_select" ON electronic_documents
    FOR SELECT
    USING (center_id = (SELECT center_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "center_isolation_insert" ON electronic_documents
    FOR INSERT
    WITH CHECK (center_id = (SELECT center_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "center_isolation_update" ON electronic_documents
    FOR UPDATE
    USING (center_id = (SELECT center_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "center_isolation_delete" ON electronic_documents
    FOR DELETE
    USING (center_id = (SELECT center_id FROM user_profiles WHERE id = auth.uid()));

-- 4. Updated At Trigger
CREATE OR REPLACE FUNCTION update_electronic_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_electronic_documents_updated_at
    BEFORE UPDATE ON electronic_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_electronic_documents_updated_at();

-- 5. Document Templates (Optional - for reference)
COMMENT ON TABLE electronic_documents IS '전자 서류 (표준약관, 급여제공계획서, 개인정보동의서 등)';
COMMENT ON COLUMN electronic_documents.type IS 'contract=표준약관, care_plan=급여제공계획서, privacy_consent=개인정보동의서, abuse_prevention=학대방지서약서, needs_assessment=욕구사정기록지';
COMMENT ON COLUMN electronic_documents.signatures IS 'Array of signature objects [{role, name, signature_url, signed_at}]';
