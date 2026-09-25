## MODIFIED Requirements

### Requirement: Monthly summary
The system SHALL display, for the selected month, total spending, total income (Bevétel), and the remaining balance (income minus spending). The total spending figure SHALL be computed as the signed sum of every non-Bevétel category's line items for the month (not the sum of each line item's absolute value), so that a refund correctly reduces total spending rather than adding to it.

#### Scenario: monthly summary values
- **WHEN** a month's transactions are loaded
- **THEN** the summary shows that month's spending total, income total, and remaining balance

#### Scenario: a refund reduces total spending
- **WHEN** a month has both a purchase and a refund of a smaller amount in the same category
- **THEN** the displayed total spending reflects the net amount, not the sum of the purchase and the refund treated as separate spending

### Requirement: Category pie chart
The system SHALL display a pie chart breaking down the selected month's spending by category, showing each category's percentage of total spending directly alongside its label (not only on hover), and SHALL let the user list the individual transactions within a category. Each category's slice value SHALL be the signed sum of its line items for the month, with absolute value taken only for that final total - not per line item before summing. A category whose signed total for the month is zero or positive SHALL be excluded from the pie (there is nothing to show as spending for it that month). Slices SHALL be sorted in descending order by amount, and each category SHALL always render in the same color across renders, with no two categories sharing a color.

#### Scenario: click a category slice
- **WHEN** the user clicks a category in the pie chart
- **THEN** the system lists the individual transactions within that category

#### Scenario: percentage shown per category
- **WHEN** the category pie chart is displayed
- **THEN** each category's legend label includes what percentage of the month's total spending it represents

#### Scenario: a category that nets to a refund is excluded from the pie
- **WHEN** a category's line items for the month sum to zero or a positive amount (refunds meet or exceed purchases)
- **THEN** that category does not appear as a slice in that month's pie chart

#### Scenario: slices are sorted largest to smallest
- **WHEN** the category pie chart is displayed
- **THEN** its slices appear in descending order by amount

#### Scenario: consistent, non-repeating category colors
- **WHEN** the category pie chart is displayed in any month
- **THEN** a given category always renders in the same color, and no two categories displayed at once share a color

## ADDED Requirements

### Requirement: Income by source
The system SHALL display, within the personal dashboard view, a prominent total income figure for the selected month and an itemized list of that month's income grouped by counterparty, with income from the same counterparty summed into a single line. Counterparties SHALL be grouped by a normalized name key (accent-stripped, case-insensitive, word-order-independent) so the same real source is not split across multiple lines due to formatting differences between banks, while the displayed label uses the first-seen raw spelling for that source.

#### Scenario: total income figure
- **WHEN** a month's transactions are loaded
- **THEN** the income-by-source card shows a prominent total matching that month's Bevétel total

#### Scenario: repeated income from the same source is combined
- **WHEN** the selected month has two or more Bevétel transactions with the same counterparty
- **THEN** the income-by-source list shows one line for that counterparty with the summed amount

#### Scenario: the same source written differently is grouped as one
- **WHEN** the selected month has Bevétel transactions from counterparties "Fikció Hanna" and "HANNA FIKCIO"
- **THEN** the income-by-source list shows a single combined line for that source, not two separate lines
