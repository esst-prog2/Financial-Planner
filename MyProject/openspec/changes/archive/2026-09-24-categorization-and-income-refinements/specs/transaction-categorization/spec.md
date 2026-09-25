## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Counterparty-name override
The system SHALL categorize a transaction into a fixed category whenever its counterparty matches a name in a known counterparty-to-category mapping, regardless of what its description keywords would otherwise indicate. This override SHALL be evaluated before general keyword matching.

#### Scenario: known service-provider name overrides keyword matching
- **WHEN** a transaction's counterparty matches a name mapped to Szolgáltatások
- **THEN** the transaction is categorized as Szolgáltatások, even if its description would otherwise match a different category's keywords or no keywords at all
