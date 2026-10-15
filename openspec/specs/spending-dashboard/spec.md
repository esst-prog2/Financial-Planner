# spending-dashboard Specification

## Purpose

Gives the user a visual overview of their categorized spending in the browser - a monthly summary, a category breakdown, and a month-by-month trend they can filter by category.

## Requirements

### Requirement: File upload
The system SHALL let the user upload an Excel workbook containing the OTP and Revolut sheets directly in the browser, with no server round-trip.

#### Scenario: upload and parse
- **WHEN** the user selects a valid workbook file
- **THEN** the dashboard populates from its parsed, categorized, deduplicated transactions

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

### Requirement: Month-by-month trend with category filter
The system SHALL display a bar chart comparing total spending across all available months, with a category dropdown that filters the chart to a single category's spending per month when selected.

#### Scenario: filter to one category
- **WHEN** the user selects "Groceries" (Élelmiszer) from the category dropdown
- **THEN** the bar chart updates to show only Élelmiszer spending for each month

### Requirement: Income by source
The system SHALL display, within the personal dashboard view, a prominent total income figure for the selected month and an itemized list of that month's income grouped by counterparty, with income from the same counterparty summed into a single line. Counterparties SHALL be grouped by a normalized name key (accent-stripped, case-insensitive, word-order-independent) so the same real source is not split across multiple lines due to formatting differences between banks, while the displayed label uses the first-seen raw spelling for that source. Clicking a line SHALL toggle a list of that source's individual transactions open or closed, displayed directly beneath that line (not in a separate area), sorted chronologically by date, each with its date and amount, mirroring the category pie chart's click-to-list behavior.

#### Scenario: total income figure
- **WHEN** a month's transactions are loaded
- **THEN** the income-by-source card shows a prominent total matching that month's Bevétel total

#### Scenario: repeated income from the same source is combined
- **WHEN** the selected month has two or more Bevétel transactions with the same counterparty
- **THEN** the income-by-source list shows one line for that counterparty with the summed amount

#### Scenario: the same source written differently is grouped as one
- **WHEN** the selected month has Bevétel transactions from counterparties "Fikció Hanna" and "HANNA FIKCIO"
- **THEN** the income-by-source list shows a single combined line for that source, not two separate lines

#### Scenario: clicking a source lists its individual transactions, in date order, directly underneath it
- **WHEN** the user clicks a line in the income-by-source list
- **THEN** that source's individual Bevétel transactions for the selected month appear directly beneath it, sorted chronologically by date, each with its date and amount

#### Scenario: clicking an already-open source closes it
- **WHEN** the user clicks a line whose individual-transaction list is currently shown
- **THEN** that list is hidden again

### Requirement: Language toggle
The system SHALL let the user switch the displayed language between Hungarian and English, translating all static UI text and category display labels; the underlying category identity used for filtering and categorization SHALL remain unaffected by the selected display language.

#### Scenario: switch to English
- **WHEN** the user selects English from the language control
- **THEN** all headings, labels, and category names on screen switch to their English translation

#### Scenario: filtering is unaffected by display language
- **WHEN** the user has selected English and then picks a category from a filter dropdown
- **THEN** the dashboard filters using the same underlying category regardless of which language its label was shown in
