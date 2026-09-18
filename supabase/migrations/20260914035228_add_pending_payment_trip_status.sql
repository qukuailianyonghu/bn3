/*
# Add pending_payment status to trips table

1. Modified Tables
- `trips`: Add 'pending_payment' as a valid status value alongside existing 'planning', 'active', 'completed'.
  This allows trips to have a "Pending Payment" state before moving to "Not Yet Traveled" (planning).

2. Important Notes
- Existing trips with status 'planning' remain unchanged.
- The status constraint is replaced to include the new value.
- No data is lost; this is a non-destructive constraint change.
*/

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;

ALTER TABLE trips ADD CONSTRAINT trips_status_check
  CHECK (status IN ('pending_payment', 'planning', 'active', 'completed'));
