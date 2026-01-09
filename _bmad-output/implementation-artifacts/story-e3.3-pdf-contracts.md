# Story E3.3: Generate PDF Contracts

**Epic:** E3 - Payment Gateway Integration  
**Story Points:** 3  
**Status:** ready-for-dev  
**Dependencies:** E3.1 (Banking Webhook), E3.2 (USDT Webhook)

---

## User Story

**As a** developer,  
**I want** system tự động tạo PDF hợp đồng sau payment,  
**So that** users nhận được legal documents.

---

## Acceptance Criteria

1. HTML template với đầy đủ thông tin order:
   - Customer name, phone, email
   - Order code, date, quantity
   - Payment method và amount
   - Tree codes assigned
   - Terms và conditions

2. Convert to PDF và upload S3:
   - Use Puppeteer hoặc similar
   - High quality PDF output
   - Upload to S3 với key: contracts/{orderCode}.pdf

3. Send email với attachment:
   - Email template
   - PDF attachment
   - Link to download từ S3

4. Store URL trong order.contractPdfUrl

---

## Technical Tasks

- [ ] Task 1: HTML Template
  - [ ] Subtask 1.1: Design contract template
  - [ ] Subtask 1.2: Vietnamese content
  - [ ] Subtask 1.3: Responsive layout

- [ ] Task 2: PDF Generation
  - [ ] Subtask 2.1: Setup Puppeteer
  - [ ] Subtask 2.2: HTML → PDF conversion
  - [ ] Subtask 2.3: Upload to S3

- [ ] Task 3: Email Integration
  - [ ] Subtask 3.1: Design email template
  - [ ] Subtask 3.2: Attach PDF
  - [ ] Subtask 3.3: Track email delivery

- [ ] Task 4: Testing
  - [ ] Subtask 4.1: Unit tests
  - [ ] Subtask 4.2: Visual preview tests

---

## Notes

- Similar to frontend PDF generation in E4.2 but server-side
- Legal template needs review by business owner
