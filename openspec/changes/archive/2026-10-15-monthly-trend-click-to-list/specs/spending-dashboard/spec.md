## MODIFIED Requirements

### Requirement: Category pie chart
The system SHALL display a pie chart breaking down the selected month's spending by category, showing each category's percentage of total spending directly alongside its label (not only on hover), and SHALL let the user list the individual transactions within a category as a table with date, description, and amount columns, sorted oldest-first by date. Each category's slice value SHALL be the signed sum of its line items for the month, with absolute value taken only for that final total - not per line item before summing. A category whose signed total for the month is zero or positive SHALL be excluded from the pie (there is nothing to show as spending for it that month). Slices SHALL be sorted in descending order by amount, and each category SHALL always render in the same color across renders, with no two categories sharing a color. The pie SHALL only include a category currently checked in the category filter sidebar (see the Category filter sidebar requirement); an unchecked category's slice SHALL NOT appear even if it would otherwise be pie-eligible. Clicking the category slice whose transaction list is already open SHALL close that list instead of re-rendering it.

#### Scenario: click a category slice
- **WHEN** the user clicks a category in the pie chart
- **THEN** the system lists the individual transactions within that category

#### Scenario: listed transactions are a table, sorted oldest-first
- **WHEN** the user clicks a category slice
- **THEN** the listed transactions appear as a table with date, description, and amount columns, ordered from the oldest date to the newest

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

#### Scenario: unchecking a category removes its slice
- **WHEN** the user unchecks a category in the category filter sidebar that would otherwise appear in the pie
- **THEN** that category's slice disappears from the pie, and the remaining slices' percentages are recalculated against the new, smaller total

#### Scenario: clicking the open category slice again closes its list
- **WHEN** the user clicks a category slice whose transaction list is already shown
- **THEN** that list closes, rather than being re-rendered or left open

### Requirement: Month-by-month trend with category filter
The system SHALL display a bar chart comparing total spending across all available months, summing only the categories currently checked in the category filter sidebar (see the Category filter sidebar requirement) into a single monthly total per month, and SHALL let the user click a bar to list the individual transactions behind it as a table with date, description, and amount columns, sorted oldest-first by date - mirroring the category pie chart's click-to-list behavior. The listed transactions SHALL be every transaction from that bar's month across every currently-checked category, not a single category. Clicking a bar SHALL NOT change the dashboard's currently-selected month; every other part of the dashboard (the monthly summary, the pie chart, income by source) SHALL continue to reflect whichever month was already selected. Clicking the bar whose transaction list is already open SHALL close that list instead of re-rendering it.

#### Scenario: filter to one category
- **WHEN** the user unchecks every category except "Groceries" (Élelmiszer) in the category filter sidebar
- **THEN** the bar chart updates to show only Élelmiszer spending for each month

#### Scenario: unchecking a category removes it from the trend
- **WHEN** the user unchecks a category in the category filter sidebar
- **THEN** the bar chart's monthly totals no longer include that category's spending

#### Scenario: all categories checked shows the full trend
- **WHEN** every category is checked
- **THEN** the bar chart shows each month's total spending across every category, matching today's "no filter" behavior

#### Scenario: clicking a bar lists that month's transactions
- **WHEN** the user clicks a bar for a given month
- **THEN** the system lists every transaction from that month across every currently-checked category, as a table with date, description, and amount columns, ordered from the oldest date to the newest

#### Scenario: clicking a bar does not change the selected month
- **WHEN** the user clicks a bar for a month other than the one currently selected elsewhere on the dashboard
- **THEN** the monthly summary, the pie chart, and income by source continue showing the originally-selected month, unaffected by the click

#### Scenario: clicking the open bar again closes its list
- **WHEN** the user clicks a bar whose transaction list is already shown
- **THEN** that list closes, rather than being re-rendered or left open
