## ADDED Requirements

### Requirement: Month navigation
The system SHALL present the available months as a row of tab buttons, one column per calendar month (January-December), so that a calendar month recurring in a later year stacks directly under its earlier occurrence in the same column instead of continuing the row. The row SHALL fit the available width without requiring horizontal scrolling. When the user switches between the personal and joint views, the system SHALL carry the currently-selected month over to the view being switched to, when that month also exists there; otherwise the target view SHALL fall back to its own default month.

#### Scenario: the same calendar month across years shares a column
- **WHEN** the uploaded data spans more than one occurrence of the same calendar month (e.g. both October 2025 and October 2026)
- **THEN** both months' tabs appear in the same column, one above the other, rather than both continuing the horizontal row

#### Scenario: the month row fits without scrolling
- **WHEN** the month-tab row is displayed with its full set of available months
- **THEN** every month tab is visible without needing to scroll horizontally

#### Scenario: switching views carries the selected month over
- **WHEN** the user has a specific month selected in the personal view and switches to the joint view, and that month also has joint-account data
- **THEN** the joint view opens on that same month, not its own default

#### Scenario: switching views falls back gracefully when the month doesn't exist there
- **WHEN** the user switches views and the currently-selected month has no data in the view being switched to
- **THEN** the target view falls back to its own default month instead of showing an empty or invalid selection

## MODIFIED Requirements

### Requirement: Monthly summary
The system SHALL display, for the selected month, total spending, total income (Bevétel), and the remaining balance (income minus spending), as a bulleted list in a fixed order: income first, then spending, then the balance. The total spending figure SHALL be computed as the signed sum of every non-Bevétel category's line items for the month (not the sum of each line item's absolute value), so that a refund correctly reduces total spending rather than adding to it.

#### Scenario: monthly summary values
- **WHEN** a month's transactions are loaded
- **THEN** the summary shows that month's spending total, income total, and remaining balance

#### Scenario: summary lines appear in income, spending, balance order
- **WHEN** the monthly summary is displayed
- **THEN** its three lines appear in that fixed order - income, then spending, then the balance - regardless of amount or sign

#### Scenario: a refund reduces total spending
- **WHEN** a month has both a purchase and a refund of a smaller amount in the same category
- **THEN** the displayed total spending reflects the net amount, not the sum of the purchase and the refund treated as separate spending

### Requirement: Category pie chart
The system SHALL display a pie chart breaking down the selected month's spending by category, showing each category's percentage of total spending directly alongside its label (not only on hover), and SHALL let the user list the individual transactions within a category as a table with date, description, and amount columns, sorted oldest-first by date. Each category's slice value SHALL be the signed sum of its line items for the month, with absolute value taken only for that final total - not per line item before summing. A category whose signed total for the month is zero or positive SHALL be excluded from the pie (there is nothing to show as spending for it that month). Slices SHALL be sorted in descending order by amount, and each category SHALL always render in the same color across renders, with no two categories sharing a color.

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
