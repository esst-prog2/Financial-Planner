## ADDED Requirements

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
The system SHALL exclude a positive-amount transaction whose counterparty identifies the OTP piggy-bank sub-account ("persely számla") from both income and spending totals, the same way a self-transfer is excluded - it represents the user's own money moving between their own OTP sub-accounts, not real income. A negative-amount transaction to the same sub-account is unaffected by this exclusion.

#### Scenario: money returning from the piggy-bank sub-account
- **WHEN** a positive-amount OTP transaction's counterparty is "PERSELY SZÁMLA"
- **THEN** the transaction is excluded entirely from income and spending totals

#### Scenario: money going into the piggy-bank sub-account is unaffected
- **WHEN** a negative-amount OTP transaction's counterparty is "PERSELY SZÁMLA"
- **THEN** the transaction is categorized normally (as Megtakarítás), not excluded

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
