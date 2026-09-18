/*
# Add payment_status column to event_attendees

1. Modified Tables
- `event_attendees`: Add `payment_status` text column to track the attendee's
  participation lifecycle: pending_payment, paid, not_attended, attended.
  Default is 'paid' (for free events where no payment is needed).

2. Important Notes
- Non-destructive: existing attendees get 'paid' as default.
- No data is lost.
*/

ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'paid';

ALTER TABLE event_attendees DROP CONSTRAINT IF EXISTS event_attendees_payment_status_check;
ALTER TABLE event_attendees ADD CONSTRAINT event_attendees_payment_status_check
  CHECK (payment_status IN ('pending_payment', 'paid', 'not_attended', 'attended'));
