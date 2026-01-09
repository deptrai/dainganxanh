# Story E2.4: Setup Quarterly Update Cron Job

**Epic:** E2 - Tree Tracking Integration  
**Story Points:** 5  
**Status:** done  
**Dependencies:** E2.1 (TreeService), E2.2 (TreePhotoService)

---

## User Story

**As a** developer,  
**I want** cron job gửi quarterly updates tự động,  
**So that** users nhận được báo cáo định kỳ về cây của họ.

---

## Acceptance Criteria

1. Cron job chạy vào tuần cuối của mỗi quý:
   - Q1: Tuần cuối tháng 3
   - Q2: Tuần cuối tháng 6
   - Q3: Tuần cuối tháng 9
   - Q4: Tuần cuối tháng 12

2. Email template đẹp và responsive:
   - HTML template với branding
   - Mobile-friendly design
   - Fallback plain text

3. Include trong report:
   - Số cây sở hữu
   - Tổng CO2 absorbed
   - Health status summary
   - Latest photos
   - Link to dashboard

---

## Technical Tasks

- [x] Task 1: Cron Job Setup
  - [x] Subtask 1.1: Define cron schedule
  - [x] Subtask 1.2: Create QuarterlyUpdateJob
  - [x] Subtask 1.3: Fetch all owners với trees

- [x] Task 2: Email Template
  - [x] Subtask 2.1: Design HTML template
  - [x] Subtask 2.2: Implement email service
  - [x] Subtask 2.3: Test trên multiple email clients

- [x] Task 3: Data Aggregation
  - [x] Subtask 3.1: Aggregate tree stats per owner
  - [x] Subtask 3.2: Include latest photos
  - [x] Subtask 3.3: Generate dashboard links

- [x] Task 4: Testing
  - [x] Subtask 4.1: Unit tests
  - [x] Subtask 4.2: Manual test với preview emails

---

## Notes

- Sử dụng Twenty's email infrastructure nếu có
- Consider rate limiting để tránh spam throttle
