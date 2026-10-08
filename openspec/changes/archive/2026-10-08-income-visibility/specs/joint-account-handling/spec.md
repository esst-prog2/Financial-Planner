## MODIFIED Requirements

### Requirement: Contributor breakdown
The system SHALL show, in the dedicated joint-account view, every positive-amount joint-account transaction for the period - not only ones matching the "Átutalás tőle: <name>" description pattern - grouped by the same counterparty extraction the rest of the app already uses (the named sender when extractable, otherwise falling back to the raw description, e.g. a card/Apple Pay top-up). This list SHALL include transactions that are excluded from the user's personal Bevétel total elsewhere in the app (e.g. a card top-up) - its purpose is to show everything that put money into the joint account, not to duplicate the Bevétel definition. Rows SHALL be grouped by a normalized name key (accent-stripped, case-insensitive, word-order-independent) so that the same real person or source is not split across multiple rows due to formatting differences between banks or entry order (e.g. "Tóth Tibor" vs "TIBOR TOTH"), while the displayed label uses the first-seen raw spelling. Clicking a row SHALL list the individual transactions making up that row's total, with their date and amount, mirroring the personal income-by-source list's click-to-list behavior.

#### Scenario: two contributors
- **WHEN** the joint account has incoming transfers described as "Átutalás tőle: <name>" from two different names
- **THEN** the joint-account view shows a total contributed amount per name

#### Scenario: the same contributor written differently is grouped as one
- **WHEN** the joint account has incoming transfers from "Átutalás tőle: Tóth Tibor" and "Átutalás tőle: TIBOR TOTH"
- **THEN** the joint-account view shows a single combined total for that contributor, not two separate rows

#### Scenario: a card top-up appears in the list even though it is not Bevétel
- **WHEN** the joint account has a positive-amount card/Apple Pay top-up transaction (excluded from the user's personal Bevétel total)
- **THEN** it still appears as its own row in the joint-account view's income list, grouped by its description

#### Scenario: clicking a row lists its individual transactions
- **WHEN** the user clicks a row in the joint-account view's income list
- **THEN** the view lists that row's individual transactions for the period, each with its date and amount
