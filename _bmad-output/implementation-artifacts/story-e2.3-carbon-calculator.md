# Story E2.3: Kết nối CarbonCalculatorService

**Epic:** E2 - Tree Tracking Integration  
**Story Points:** 3  
**Status:** done  
**Dependencies:** E2.1 (TreeService)

---

## User Story

**As a** developer,  
**I want** CarbonCalculatorService tính CO2 cho từng cây,  
**So that** users thấy được impact của họ.

---

## Acceptance Criteria

1. ✅ Calculate total CO2 absorbed từ planting date

2. ✅ Absorption rates đúng theo age:
   - 5kg/year Year 1
   - 10kg/year Year 2-3
   - 15kg/year Year 4-5
   - 20kg/year Year 5+

3. ✅ getCO2Equivalents trả về meaningful comparisons:
   - Km lái xe ô tô
   - Giờ sử dụng máy tính
   - Chai nhựa tái chế

---

## Technical Tasks

- [x] Task 1: Backend CarbonCalculatorService
  - [x] Subtask 1.1: calculateTotalCO2Absorbed
  - [x] Subtask 1.2: getCO2Equivalents
  - [x] Subtask 1.3: getAgeInMonths

- [x] Task 2: Frontend utils
  - [x] Subtask 2.1: Port logic to frontend
  - [x] Subtask 2.2: Unit tests (12 tests)

- [x] Task 3: Integration with Tree Detail
  - [x] Subtask 3.1: Display in CO2ImpactSection
  - [x] Subtask 3.2: Animated progress bar

---

## Implementation Notes

- Frontend utility: `packages/twenty-front/src/modules/dainganxanh/tree-detail/utils/carbonCalculator.ts`
- 12 unit tests passing
- Used in E4.2 Tree Detail Page
