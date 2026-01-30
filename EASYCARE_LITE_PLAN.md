# EasyCare Lite Implementation Plan

## 1. Overview
The goal is to create a lightweight version of the EasyCare platform ("EasyCare Lite") tailored for long-term care (Silver Care) centers, specifically home visit nursing (방문 요양). This version will leverage the existing robust infrastructure of the Zarada/Silver platform but will introduce specialized modules for silver care requirements while reusing core components like scheduling and basic user management.

## 2. Core Strategy: Modular Separation with Shared Core
We will adopt a "Shared Core, Specialized Modules" architecture.
- **Shared Core**: Auth, Basic Scheduling Logic, Admin Management, Super Admin Console.
- **Specialized Modules**: 
    - `Silver/Recipients`: Specialized user management for elderly care (Long-term care grade, copay rates).
    - `Silver/CareWorkers`: Specialized staff management (if distinct from therapists, or extended).
    - `Silver/Payroll`: Complex payroll calculations based on hourly rates, night/holiday shifts, and family care rules.
    - `Silver/Documents`: Digital signatures and document generation for government compliance.

## 3. Database Schema Extensions (Supabase)

### 3.1 New Table: `recipients` (수급자)
Instead of overloading the `children` table, we create a dedicated table for elderly care recipients.
- `id` (UUID, PK)
- `center_id` (UUID, FK) -> RLS enabled
- `name` (Text)
- `birth_date` (Date)
- `long_term_care_grade` (Enum/Int): 1~5등급, 인지지원등급
- `care_number` (Text): 장기요양인정번호 (L-number)
- `copay_rate` (Float): 본인부담율 (15%, 9%, 6%, 0%)
- `is_dementia` (Boolean): 치매 여부 (가산 수당 관련)
- `guardian_name` (Text)
- `guardian_contact` (Text)
- `address` (Text)
- `status` (Enum): active, suspended, deceased

### 3.2 New Table: `care_schedules` (Optional or Extended)
We might be able to reuse `schedules` but add a `type` column ('therapy', 'silver_care'). However, given the complexity of silver care billing (time-based vs session-based), a separate extension table or fully separate table is safer.
**Decision**: Use `schedules` table but extending with a linked `silver_care_details` table for billing specifics if needed, or simply adding necessary columns to `schedules` if they are sparse.
**Refined Decision**: Let's stick to the `schedules` table but add a `service_category` ('development', 'silver') to distinguish.

### 3.3 New Module: `electronic_documents` (전자문서)
- `id` (UUID, PK)
- `center_id` (UUID, FK)
- `recipient_id` (UUID, FK)
- `type` (Enum): 'contract', 'privacy_consent', 'care_plan', 'risk_assessment'
- `content` (JSONB): Form data
- `signatures` (JSONB): Array of signature objects {role, signature_url, timestamp}
- `status` (Enum): 'draft', 'signed', 'expired'
- `created_at`, `updated_at`

## 4. Feature Implementation Roadmap

### Phase 1: Foundation & Data Structure (Week 1)
- [ ] Create `recipients` table in Supabase.
- [ ] Create `electronic_documents` table.
- [ ] Update `schedules` table to support 'silver' category (if not present).
- [ ] Create API/Hooks for Recipients (`useRecipients`).

### Phase 2: Recipient Management & Documents (Week 1-2)
- [ ] **Recipient List/Detail Page**: CRUD for elderly recipients.
- [ ] **Digital Signature Integration**: Implement `react-signature-canvas` for contracts.
- [ ] **Document Generation**: Generate PDF/Print view for "Standard Service Contract" (표준약관).

### Phase 3: Specialized Scheduling & Payroll (Week 2-3)
- [ ] **Care Schedule View**: Calendar view specific for home visits (often recurring daily).
  - *Note*: Reuse `FullCalendar` but with specialized event rendering.
- [ ] **Payroll Calculator**: Implement the complex Korean Long-term Care Insurance formulas.
  - Base Rate per Grade/Time
  - Night/Holiday Add-ons (+30%, +50%)
  - Family Care deductions.
  - Generating "Pay Stub" (급여명세서).

### Phase 4: Mobile Worker App (PWA) (Week 4)
- [ ] **Visit Tag Application**: Simple interface for Care Workers to "Start Visit" and "End Visit" (RFID/Beacon alternative using Geolocation/Time).
- [ ] **Care Log**: "Did you assist with bath?", "Meal status", etc.

## 5. UI/UX Integration
- **Sidebar**:
    - If `CenterType == 'silver'`, show: [Dashboard, Recipients, Schedule, Payroll, Documents].
    - If `CenterType == 'development'`, show: [Dashboard, Children, Therapists, Schedule, Billing].
- **Theme**:
    - Silver: Warmer, larger fonts, high contrast (Senior-friendly).
    - Development: Bright, playful colors.

## 6. Action Items for Immediate Next Step
1.  **Schema Check**: Verify current DB state and run SQL to create `recipients` table.
2.  **Navigation Logic**: update `Sidebar` to conditionally render menus based on center type.
