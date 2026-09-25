# transaction-categorization Specification

## Purpose

Assigns every non-excluded transaction to exactly one of 12 spending categories or 3 non-spending buckets, using a single keyword-based rule set applied uniformly across both banks.

## Requirements

### Requirement: Uniform keyword-based categorization
The system SHALL assign every non-excluded transaction from either bank to exactly one of the 12 spending categories (Élelmiszer, Eating out, Ruházat/bevásárlás, Egészség/szépség, Szolgáltatások, Orvos, Sport, Közlekedés, Számlák/előfizetés, Megtakarítás, Szórakozás, Utalás) using the same keyword-matching rules against the transaction's description text, regardless of source bank. Matching SHALL be accent-insensitive: both the description text and the keyword lists are compared with Hungarian diacritics normalized away, so a merchant name with stripped accents (as commonly occurs in real exports) still matches. A counterparty-name override (see the Counterparty-name override requirement), when it applies, SHALL take priority over keyword matching. OTP's own "Tranzakció kategória" column SHALL NOT be used as an input to categorization.

#### Scenario: Groceries keyword match
- **WHEN** a transaction's description contains "Lidl" or "Spar"
- **THEN** the transaction is categorized as Élelmiszer

#### Scenario: OTP category column ignored
- **WHEN** an OTP transaction's "Tranzakció kategória" column says "Eating out" but its description matches a different category's keywords
- **THEN** the transaction is categorized using the keyword match, not the OTP column value

#### Scenario: accent-stripped merchant name still matches
- **WHEN** a transaction's description contains "Muller" (accent-stripped form of "Müller")
- **THEN** the transaction is categorized as Egészség/szépség, the same as it would be for "Müller"

#### Scenario: bakery-type merchant is Élelmiszer, not Eating out
- **WHEN** a transaction's description indicates a bakery (e.g. contains "pékség" or "bakery")
- **THEN** the transaction is categorized as Élelmiszer

#### Scenario: hobby/book-shop merchant is Szórakozás, not Ruházat/bevásárlás
- **WHEN** a transaction's description indicates a hobby shop or bookstore (e.g. contains "hobby" or "könyvesbolt")
- **THEN** the transaction is categorized as Szórakozás

### Requirement: Income override
The system SHALL categorize any non-excluded transaction with a positive amount as Bevétel, UNLESS its description matches a merchant/service-type spending category's keywords (Élelmiszer, Eating out, Ruházat/bevásárlás, Egészség/szépség, Szolgáltatások, Orvos, Sport, Közlekedés, Számlák/előfizetés, Szórakozás, or Megtakarítás), in which case it SHALL be categorized into that matched category instead, representing a refund or reversal rather than new income. This exception SHALL NOT apply to the Utalás category: a positive-amount transaction matching Utalás's keywords SHALL still be categorized as Bevétel.

#### Scenario: positive amount with no merchant-category match stays Bevétel
- **WHEN** a non-excluded transaction has a positive amount and its description does not match any merchant/service-type spending category's keywords
- **THEN** it is categorized as Bevétel

#### Scenario: Positive-amount transaction with a merchant-like description
- **WHEN** a non-excluded transaction has a positive amount and its description matches a merchant/service-type category's keywords (e.g. a grocery store)
- **THEN** it is categorized into that matching category (e.g. Élelmiszer), representing a refund, not Bevétel

#### Scenario: incoming transfer is still Bevétel, never Utalás
- **WHEN** a non-excluded transaction has a positive amount and its description matches Utalás's keywords (e.g. contains "átutalás")
- **THEN** it is categorized as Bevétel, not Utalás

### Requirement: Counterparty-name override
The system SHALL categorize a transaction into a fixed category whenever its counterparty matches a name in a known counterparty-to-category mapping, regardless of what its description keywords would otherwise indicate. This override SHALL be evaluated before general keyword matching.

#### Scenario: known service-provider name overrides keyword matching
- **WHEN** a transaction's counterparty matches a name mapped to Szolgáltatások
- **THEN** the transaction is categorized as Szolgáltatások, even if its description would otherwise match a different category's keywords or no keywords at all

### Requirement: Savings category
The system SHALL categorize transactions indicating a transfer into savings or investments (e.g. description containing "megtakarítás", "betétlekötés", or "befektetés") as Megtakarítás.

#### Scenario: Savings transfer keyword match
- **WHEN** a transaction's description contains "megtakarítás"
- **THEN** the transaction is categorized as Megtakarítás

### Requirement: Entertainment category
The system SHALL categorize transactions indicating entertainment/leisure activities (e.g. description containing "mozi", "színház", "koncert", or "bowling") as Szórakozás.

#### Scenario: Entertainment keyword match
- **WHEN** a transaction's description contains "mozi"
- **THEN** the transaction is categorized as Szórakozás

### Requirement: Transfer category
The system SHALL categorize outgoing (negative-amount) transactions indicating a generic person-to-person transfer (e.g. description containing "utalás", "átutalás", or "azonnali fizetés") as Utalás, when the transaction is not otherwise excluded as a self-transfer or joint contribution and does not match a more specific category's keywords. This category SHALL NOT apply to incoming (positive-amount) transfers - those remain Bevétel per the income override.

#### Scenario: Outgoing transfer keyword match
- **WHEN** a non-excluded transaction has a negative amount and its description contains "átutalás", and no more specific category keyword matches
- **THEN** the transaction is categorized as Utalás

#### Scenario: Incoming transfer stays Bevétel
- **WHEN** a non-excluded transaction has a positive amount and its description contains "átutalás"
- **THEN** the transaction is categorized as Bevétel, not Utalás

### Requirement: Cash withdrawal category
The system SHALL categorize cash withdrawal transactions (e.g. OTP "KÉSZPÉNZFELVÉT ATM-BŐL") as Készpénzfelvét, separate from the 12 spending categories.

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
