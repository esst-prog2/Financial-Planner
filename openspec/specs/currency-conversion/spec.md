# currency-conversion Specification

## Purpose

Converts non-HUF Revolut transaction amounts to HUF using a bundled offline historical exchange-rate table, so all totals and charts are expressed in a single currency.

## Requirements

### Requirement: HUF as universal currency
The system SHALL express every transaction amount used in totals and charts in HUF.

#### Scenario: HUF-denominated transaction
- **WHEN** a transaction's Pénznem/Devizanem is HUF
- **THEN** its amount is used as-is with no conversion

### Requirement: Offline historical rate conversion
For a transaction with a non-HUF currency, the system SHALL convert its amount to HUF using the bundled historical daily exchange rate for that currency on the transaction's canonical date, without making a live network request.

#### Scenario: EUR transaction conversion
- **WHEN** a `rev-eur` transaction has a non-HUF (EUR) currency and a canonical date
- **THEN** the system converts the amount to HUF using the bundled rate table's entry for EUR on that date

### Requirement: Missing rate handling
The system SHALL show an error identifying the missing currency/date pair rather than silently using a wrong or zero rate when the bundled rate table has no entry for a required conversion.

#### Scenario: no rate for the transaction's date
- **WHEN** the bundled rate table has no entry for a transaction's currency and canonical date
- **THEN** the system shows an error naming the missing currency and date instead of computing a HUF amount
