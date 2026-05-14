-- ============================================================
-- Migration: Availability slots + booking requests
-- Run in Supabase SQL Editor
-- ============================================================

-- Instructor availability slots
CREATE TABLE IF NOT EXISTS availability_slots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id   UUID NOT NULL REFERENCES instructor_profiles(id) ON DELETE CASCADE,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  slot_type       TEXT NOT NULL DEFAULT 'open', -- 'open' = requestable, 'blocked' = not available
  is_booked       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_slot CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS avail_instr_idx ON availability_slots(instructor_id);
CREATE INDEX IF NOT EXISTS avail_time_idx  ON availability_slots(start_time, end_time);

-- Booking requests (learner requests a slot, instructor approves/declines)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_id UUID REFERENCES availability_slots(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS request_note TEXT; -- learner's short description
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- RLS for availability slots
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Anyone can view open slots
CREATE POLICY IF NOT EXISTS "avail_public_read" ON availability_slots
FOR SELECT USING (slot_type = 'open');

-- Instructor manages their own slots
CREATE POLICY IF NOT EXISTS "avail_instr_manage" ON availability_slots
FOR ALL USING (
  instructor_id = (SELECT id FROM instructor_profiles WHERE user_id = auth.uid())
);

-- Admin can see all
CREATE POLICY IF NOT EXISTS "avail_admin_all" ON availability_slots
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS for bookings (learner can insert requests)
DROP POLICY IF EXISTS "bookings_insert_learner" ON bookings;
CREATE POLICY "bookings_insert_learner" ON bookings
FOR INSERT WITH CHECK (learner_id = auth.uid());

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE availability_slots;
