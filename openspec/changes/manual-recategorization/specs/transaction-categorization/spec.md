## ADDED Requirements

### Requirement: Manual recategorization override
The system SHALL let the user change a transaction's assigned category. The system SHALL remember that correction, keyed by the transaction's merchant (matched the same accent/case-insensitive, substring way the counterparty-name override already matches a counterparty), and SHALL apply the remembered correction to every other transaction - already categorized or categorized in the future - from that same merchant. A remembered manual correction SHALL take priority over both keyword matching and the counterparty-name override.

This requirement exists because keyword-based categorization alone was measured (spike, 2026-10-02) to be only 62.5-64.8% accurate on merchants never used to tune the keywords - below the threshold at which keyword rules alone are considered sufficient - so the system needs a way to improve on a specific user's real data over time instead of relying solely on keyword coverage.

#### Scenario: user corrects a miscategorized transaction
- **WHEN** the user changes a transaction's category away from what the system assigned
- **THEN** the system records that correction for the transaction's merchant

#### Scenario: a remembered correction is applied to other transactions from the same merchant
- **WHEN** a transaction's merchant matches a previously-recorded manual correction
- **THEN** the transaction is categorized using the recorded correction, including transactions from that merchant that were already categorized before the correction was made

#### Scenario: a manual correction overrides the counterparty-name override
- **WHEN** a transaction's counterparty matches both a known counterparty-to-category mapping and a separately recorded manual correction
- **THEN** the transaction is categorized using the manual correction, not the counterparty-name override

## MODIFIED Requirements

### Requirement: Uniform keyword-based categorization
The system SHALL assign every non-excluded transaction from either bank to exactly one of the 12 spending categories (Élelmiszer, Eating out, Ruházat/bevásárlás, Egészség/szépség, Szolgáltatások, Orvos, Sport, Közlekedés, Számlák/előfizetés, Megtakarítás, Szórakozás, Utalás) using the same keyword-matching rules against the transaction's description text, regardless of source bank. Matching SHALL be accent-insensitive: both the description text and the keyword lists are compared with Hungarian diacritics normalized away, so a merchant name with stripped accents (as commonly occurs in real exports) still matches. A manual recategorization (see the Manual recategorization override requirement), when one is recorded for the transaction's merchant, SHALL take priority over everything else. Otherwise, a counterparty-name override (see the Counterparty-name override requirement), when it applies, SHALL take priority over keyword matching. OTP's own "Tranzakció kategória" column SHALL NOT be used as an input to categorization.

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

### Requirement: Counterparty-name override
The system SHALL categorize a transaction into a fixed category whenever its counterparty matches a name in a known counterparty-to-category mapping, regardless of what its description keywords would otherwise indicate. This override SHALL be evaluated before general keyword matching, but SHALL itself be overridden by a manual recategorization recorded for that counterparty (see the Manual recategorization override requirement).

#### Scenario: known service-provider name overrides keyword matching
- **WHEN** a transaction's counterparty matches a name mapped to Szolgáltatások
- **THEN** the transaction is categorized as Szolgáltatások, even if its description would otherwise match a different category's keywords or no keywords at all
