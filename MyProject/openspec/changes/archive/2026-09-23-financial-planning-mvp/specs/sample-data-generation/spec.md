## Purpose

Produces a synthetic Excel workbook matching the real 4-sheet export structure, with no real personal data, so the user has something safe to demo to their class.

## ADDED Requirements

### Requirement: Structural match, no real data
The system SHALL generate a workbook with the same 4 sheets (`otp`, `rev-eur`, `rev-hu`, `rev-joint`) and the same columns as the real exports, populated entirely with fabricated names, merchants, dates, and amounts.

#### Scenario: no real data present
- **WHEN** the synthetic workbook is generated
- **THEN** none of its values are copied from the user's real uploaded file

### Requirement: Plausible transaction values
The system SHALL generate a transaction amount for every row, and an Egyenleg running balance for every row on the three Revolut sheets, with values plausible for the row's description/category.

#### Scenario: generated amounts present
- **WHEN** the synthetic workbook is generated
- **THEN** every transaction row has a non-empty Összeg value, and every Revolut sheet row has a non-empty Egyenleg value

### Requirement: Recurring and one-off names
The system SHALL include some merchant/person names that repeat across multiple rows (representing regular services) and some that appear only once (representing occasional/one-off transactions).

#### Scenario: mixed name frequency
- **WHEN** the synthetic workbook is generated
- **THEN** at least one merchant/person name appears in multiple rows and at least one appears in only one row

### Requirement: Equal joint-account contributions
The system SHALL generate joint-account (`rev-joint`) contribution transactions such that the two co-holders' total contributed amounts are exactly equal.

#### Scenario: equal contributor totals
- **WHEN** the synthetic workbook is generated
- **THEN** summing the joint account's "Átutalás tőle: <name>" transactions per contributor yields the same total for both contributors
