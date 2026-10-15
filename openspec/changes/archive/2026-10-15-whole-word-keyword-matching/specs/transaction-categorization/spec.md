## MODIFIED Requirements

### Requirement: Uniform keyword-based categorization
The system SHALL assign every non-excluded transaction from either bank to exactly one of the 12 spending categories (Élelmiszer, Eating out, Ruházat/bevásárlás, Egészség/szépség, Szolgáltatások, Orvos, Sport, Közlekedés, Számlák/előfizetés, Megtakarítás, Szórakozás, Utalás) using the same keyword-matching rules against the transaction's description text, regardless of source bank. Matching SHALL be accent-insensitive: both the description text and the keyword lists are compared with Hungarian diacritics normalized away, so a merchant name with stripped accents (as commonly occurs in real exports) still matches. A keyword short or generic enough that matching it anywhere in the description risks matching unrelated merchants SHALL instead be matched only as its own whole word. A counterparty-name override (see the Counterparty-name override requirement), when it applies, SHALL take priority over keyword matching. OTP's own "Tranzakció kategória" column SHALL NOT be used as an input to categorization.

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

#### Scenario: a whole-word keyword does not match as a mere substring
- **WHEN** a transaction's description contains a short, generic keyword only as part of a longer, unrelated word (e.g. "one" inside "vodafone")
- **THEN** that keyword does not match, unlike a keyword meant to match as a substring anywhere

#### Scenario: a whole-word keyword matches when it stands on its own
- **WHEN** a transaction's description is exactly a short, generic keyword with no other text
- **THEN** that keyword matches and the transaction is categorized accordingly
