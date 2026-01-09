# Story E6.3: Harvest Notification Automation

**Epic:** E6 - Growth Features  
**Story Points:** 3  
**Status:** ready-for-dev  
**Dependencies:** E2.4 (Quarterly Update Cron)

---

## User Story

**As a** tree owner (5 years),  
**I want** nhận thông báo khi cây sẵn sàng harvest,  
**So that** tôi có thể quyết định next steps.

---

## Acceptance Criteria

1. Cron job check trees approaching 60 months:
   - Run weekly
   - Check plantingDate + 60 months
   - 30-day advance notice

2. Email notification với 3 options:
   - Option 1: Harvest và nhận tiền
   - Option 2: Harvest và trồng lại
   - Option 3: Continue nurturing (extend contract)

3. Link to harvest contract page:
   - Dedicated page với form
   - Select preferred option
   - E-signature integration

4. Reminder after 7 days if no response:
   - Track notification status
   - Auto-send reminder
   - Escalate to phone call if needed

---

## Technical Tasks

- [ ] Task 1: Harvest Check Cron
  - [ ] Subtask 1.1: Weekly cron schedule
  - [ ] Subtask 1.2: Query approaching harvest
  - [ ] Subtask 1.3: Flag trees for notification

- [ ] Task 2: Notification Email
  - [ ] Subtask 2.1: Email template với options
  - [ ] Subtask 2.2: Personalized content
  - [ ] Subtask 2.3: Track delivery

- [ ] Task 3: Harvest Page
  - [ ] Subtask 3.1: /harvest/{treeCode} route
  - [ ] Subtask 3.2: Option selection form
  - [ ] Subtask 3.3: Confirmation flow

- [ ] Task 4: Reminder System
  - [ ] Subtask 4.1: Track response status
  - [ ] Subtask 4.2: 7-day reminder cron
  - [ ] Subtask 4.3: Admin dashboard for follow-up

- [ ] Task 5: Testing
  - [ ] Subtask 5.1: Unit tests
  - [ ] Subtask 5.2: E2E notification flow

---

## Notes

- Business decision: What happens after harvest?
- Legal: Contract extension terms
- Financial: Payout calculation for harvest
