## MODIFIED Requirements

### Requirement: Income by source
The system SHALL display, within the personal dashboard view, a prominent total income figure for the selected month and an itemized list of that month's income grouped by counterparty, with income from the same counterparty summed into a single line. Counterparties SHALL be grouped by a normalized name key (accent-stripped, case-insensitive, word-order-independent) so the same real source is not split across multiple lines due to formatting differences between banks, while the displayed label uses the first-seen raw spelling for that source. Clicking a line SHALL list that source's individual transactions for the selected month, with their date and amount, mirroring the category pie chart's click-to-list behavior.

#### Scenario: total income figure
- **WHEN** a month's transactions are loaded
- **THEN** the income-by-source card shows a prominent total matching that month's Bevétel total

#### Scenario: repeated income from the same source is combined
- **WHEN** the selected month has two or more Bevétel transactions with the same counterparty
- **THEN** the income-by-source list shows one line for that counterparty with the summed amount

#### Scenario: the same source written differently is grouped as one
- **WHEN** the selected month has Bevétel transactions from counterparties "Fikció Hanna" and "HANNA FIKCIO"
- **THEN** the income-by-source list shows a single combined line for that source, not two separate lines

#### Scenario: clicking a source lists its individual transactions
- **WHEN** the user clicks a line in the income-by-source list
- **THEN** the view lists that source's individual Bevétel transactions for the selected month, each with its date and amount
