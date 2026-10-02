# transaction-import Specification

## Purpose

Parses OTP and Revolut Excel exports into a single, unified transaction list, handling each bank's real export shape and excluding transfers between the user's own accounts so they are never double-counted as spending or income.

## Requirements

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

### Requirement: Counterparty field
For every transaction, the system SHALL populate a `counterparty` field identifying who the money moved to or from: OTP's "Ellenoldali név" column value for OTP rows; for Revolut rows, the name extracted from an "Átutalás tőle: `<name>`" or "Átutalás neki: `<name>`" description pattern when present, otherwise the transaction's raw description.

#### Scenario: OTP counterparty from Ellenoldali név
- **WHEN** an OTP row has a non-empty "Ellenoldali név" value
- **THEN** the transaction's `counterparty` field is set to that value

#### Scenario: Revolut counterparty extracted from a transfer pattern
- **WHEN** a Revolut row's description reads "Átutalás tőle: Teszt Anna"
- **THEN** the transaction's `counterparty` field is set to "Teszt Anna"

#### Scenario: Revolut counterparty falls back to the raw description
- **WHEN** a Revolut row's description does not match a transfer pattern (e.g. a card purchase merchant name)
- **THEN** the transaction's `counterparty` field is set to the raw description

### Requirement: OTP piggy-bank sub-account exclusion
The system SHALL exclude a transaction whose counterparty identifies the OTP piggy-bank sub-account ("persely számla") from both income and spending totals, regardless of amount sign, the same way a self-transfer is excluded - it represents the user's own money moving between their own OTP sub-accounts, never real income or real spending.

#### Scenario: money returning from the piggy-bank sub-account
- **WHEN** a positive-amount OTP transaction's counterparty is "PERSELY SZÁMLA"
- **THEN** the transaction is excluded entirely from income and spending totals

#### Scenario: money going into the piggy-bank sub-account
- **WHEN** a negative-amount OTP transaction's counterparty is "PERSELY SZÁMLA"
- **THEN** the transaction is excluded entirely from income and spending totals, not categorized as Megtakarítás

### Requirement: Currency conversion exclusion
The system SHALL exclude a Revolut own-pocket currency-conversion transaction (description matching a currency-conversion keyword, e.g. "Devizaváltás HUF pénznemre") from both income and spending totals, regardless of amount sign. Such a row appears on both the source-currency and destination-currency sheets, and neither side represents real spending or income - it is the user's own money moving between their own currency pockets. A nonzero fee attached to the row is unaffected by this exclusion and still counts as Egyéb.

#### Scenario: currency conversion appears on both the EUR and HUF sheets
- **WHEN** a "Devizaváltás HUF pénznemre" row appears on the EUR sheet with a negative amount and a matching row appears on the HUF sheet with a positive amount
- **THEN** neither row is counted toward spending or income totals

#### Scenario: a fee on a currency-conversion row still counts
- **WHEN** a currency-conversion row carries a nonzero fee
- **THEN** the fee is still categorized as Egyéb and counted as spending, even though the row's own amount is excluded

### Requirement: OTP Revolut-link exclusion
The system SHALL exclude an OTP transaction whose description identifies it as tied to the user's own Revolut account or card (matching a Revolut-link keyword, e.g. "Revolut**2024*", "Revolut\*HANNA ESZTER") from both income and spending totals, regardless of amount sign, independent of whether a matching Revolut-side row exists in the uploaded date range. This complements the pair-matched self-transfer exclusion for the case where the counterpart transaction falls outside the uploaded range and pair-matching cannot find it.

#### Scenario: an OTP Revolut-link row with no matching Revolut-side row in range
- **WHEN** an OTP row's description is "Revolut\*HANNA ESZTER" and no Revolut sheet contains a matching counterpart transaction
- **THEN** the row is still excluded entirely, not counted as Bevétel

#### Scenario: the exclusion never applies to Revolut-side rows themselves
- **WHEN** a Revolut sheet row's description happens to contain the word "Revolut"
- **THEN** the exclusion does not apply, since it only matches OTP-side rows
