-- TP TOUR — turn off membership approval; anyone can sign up
-- Handicap change approval is untouched (submit_handicap_change still
-- requires admin sign-off) -- this only removes the gate on new members.

alter table member_profiles alter column status set default 'approved';

-- Auto-approve anyone currently stuck waiting, since the gate is gone.
update member_profiles set status = 'approved' where status = 'pending';
