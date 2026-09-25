## Purpose

Assigns every non-excluded transaction to exactly one of 10 spending categories or 3 non-spending buckets, using a single keyword-based rule set applied uniformly across both banks.

## ADDED Requirements

### Requirement: Uniform keyword-based categorization
The system SHALL assign every non-excluded transaction from either bank to exactly one of the 10 spending categories (Élelmiszer, Vendéglátás, Ruházat/bevásárlás, Egészség/szépség, Szolgáltatások, Orvos, Sport, Közlekedés, Számlák/előfizetés, Megtakarítás) using the same keyword-matching rules against the transaction's description text, regardless of source bank. OTP's own "Tranzakció kategória" column SHALL NOT be used as an input to categorization.

#### Scenario: Groceries keyword match
- **WHEN** a transaction's description contains "Lidl" or "Spar"
- **THEN** the transaction is categorized as Élelmiszer

#### Scenario: OTP category column ignored
- **WHEN** an OTP transaction's "Tranzakció kategória" column says "Vendéglátás" but its description matches a different category's keywords
- **THEN** the transaction is categorized using the keyword match, not the OTP column value

### Requirement: Income override
The system SHALL categorize any non-excluded transaction with a positive amount as Bevétel, regardless of keyword matches against its description.

#### Scenario: Positive-amount transaction with a merchant-like description
- **WHEN** a non-excluded transaction has a positive amount
- **THEN** it is categorized as Bevétel, even if its description would otherwise match a spending-category keyword

### Requirement: Savings category
The system SHALL categorize transactions indicating a transfer into savings or investments (e.g. description containing "megtakarítás", "betétlekötés", or "befektetés") as Megtakarítás.

#### Scenario: Savings transfer keyword match
- **WHEN** a transaction's description contains "megtakarítás"
- **THEN** the transaction is categorized as Megtakarítás

### Requirement: Cash withdrawal category
The system SHALL categorize cash withdrawal transactions (e.g. OTP "KÉSZPÉNZFELVÉT ATM-BŐL") as Készpénzfelvét, separate from the 10 spending categories.

#### Scenario: ATM withdrawal
- **WHEN** a transaction's description indicates a cash withdrawal
- **THEN** it is categorized as Készpénzfelvét

### Requirement: Bank fee category
The system SHALL categorize any bank-imposed fee amount (e.g. a Revolut row's "Díj" value) as Egyéb, even when the fee is attached to a transaction row that is otherwise excluded as a self-transfer.

#### Scenario: Fee on an excluded currency-conversion row
- **WHEN** a Revolut currency-conversion row is excluded as a self-transfer but has a nonzero "Díj" value
- **THEN** the fee amount is recorded under Egyéb, separately from the excluded transaction amount

### Requirement: Uncategorized fallback
The system SHALL NOT crash or drop a transaction when no spending-category keyword matches; it SHALL categorize such a transaction as Egyéb.

#### Scenario: no keyword match
- **WHEN** a non-excluded, non-positive-amount transaction's description matches no spending-category keyword
- **THEN** it is categorized as Egyéb rather than causing an error
