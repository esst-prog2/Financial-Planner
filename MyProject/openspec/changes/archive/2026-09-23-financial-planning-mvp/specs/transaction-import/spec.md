## Purpose

Parses OTP and Revolut Excel exports into a single, unified transaction list, handling each bank's real export shape and excluding transfers between the user's own accounts so they are never double-counted as spending or income.

## ADDED Requirements

### Requirement: Parse OTP export sheet
The system SHALL parse the `otp` sheet's transaction table starting at its fixed header row (row 15), ignoring the preceding 14-row report-header block (account number, query timestamp, filter conditions).

#### Scenario: OTP sheet with standard report header
- **WHEN** a workbook containing an `otp` sheet with the standard 14-row report-header block followed by a header row and transaction rows is uploaded
- **THEN** the system extracts each transaction row into the unified transaction model, ignoring rows 1-14

#### Scenario: missing expected column
- **WHEN** the `otp` sheet's header row is missing an expected column (e.g. no date field)
- **THEN** the system shows an error message instead of crashing or silently skipping rows

### Requirement: Parse Revolut export sheets
The system SHALL parse each of the three Revolut sheets (`rev-eur`, `rev-hu`, `rev-joint`) using their shared column schema (Típus, Termék, Kezdés dátuma, Teljesítés dátuma, Leírás, Összeg, Díj, Pénznem, State, Egyenleg).

#### Scenario: three Revolut sheets present
- **WHEN** a workbook contains `rev-eur`, `rev-hu`, and `rev-joint` sheets
- **THEN** the system extracts transactions from all three sheets into the unified model, tagging each with its source account (personal EUR, personal HUF, joint)

### Requirement: Unified transaction date field
For every transaction, the system SHALL use OTP's "Tranzakció idő" or Revolut's "Kezdés dátuma" as the transaction's canonical date - never Revolut's "Teljesítés dátuma".

#### Scenario: Revolut row with differing start and completion dates
- **WHEN** a Revolut row has a "Kezdés dátuma" of one day and a "Teljesítés dátuma" of the next day
- **THEN** the system records the transaction's canonical date as the "Kezdés dátuma" value

### Requirement: Self-transfer exclusion
The system SHALL exclude transactions representing a transfer of the user's own money between their own accounts (OTP-to-Revolut top-up, Revolut-to-own-name transfer) from both spending and income totals, matched by the same amount and the same canonical date across the OTP and Revolut sheets.

#### Scenario: OTP-to-Revolut top-up
- **WHEN** an OTP row transferring money to Revolut has the same amount and canonical date as a matching Revolut top-up row
- **THEN** neither row is counted toward spending or income totals

#### Scenario: Revolut-to-own-name transfer
- **WHEN** a Revolut row is a transfer to the user's own name
- **THEN** it is excluded from spending and income totals
