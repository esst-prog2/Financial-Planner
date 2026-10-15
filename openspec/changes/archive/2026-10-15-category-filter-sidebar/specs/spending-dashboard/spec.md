## MODIFIED Requirements

### Requirement: Category pie chart
The system SHALL display a pie chart breaking down the selected month's spending by category, showing each category's percentage of total spending directly alongside its label (not only on hover), and SHALL let the user list the individual transactions within a category as a table with date, description, and amount columns, sorted oldest-first by date. Each category's slice value SHALL be the signed sum of its line items for the month, with absolute value taken only for that final total - not per line item before summing. A category whose signed total for the month is zero or positive SHALL be excluded from the pie (there is nothing to show as spending for it that month). Slices SHALL be sorted in descending order by amount, and each category SHALL always render in the same color across renders, with no two categories sharing a color. The pie SHALL only include a category currently checked in the category filter sidebar (see the Category filter sidebar requirement); an unchecked category's slice SHALL NOT appear even if it would otherwise be pie-eligible.

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

### Requirement: Month-by-month trend with category filter
The system SHALL display a bar chart comparing total spending across all available months, summing only the categories currently checked in the category filter sidebar (see the Category filter sidebar requirement) into a single monthly total per month.

#### Scenario: filter to one category
- **WHEN** the user unchecks every category except "Groceries" (Élelmiszer) in the category filter sidebar
- **THEN** the bar chart updates to show only Élelmiszer spending for each month

#### Scenario: unchecking a category removes it from the trend
- **WHEN** the user unchecks a category in the category filter sidebar
- **THEN** the bar chart's monthly totals no longer include that category's spending

#### Scenario: all categories checked shows the full trend
- **WHEN** every category is checked
- **THEN** the bar chart shows each month's total spending across every category, matching today's "no filter" behavior

## ADDED Requirements

### Requirement: Category filter sidebar
The system SHALL display a persistent, multi-select category filter - one checkbox per spending category plus the non-income, non-spending categories (Készpénzfelvét, Egyéb) - positioned to the left of the category pie chart and the monthly trend bar chart, with every category checked by default. The system SHALL provide a "select all" control that re-checks every category in one action. The personal view and the joint view SHALL each maintain their own independent filter state, so checking or unchecking a category in one view SHALL NOT affect the other.

#### Scenario: all categories checked by default
- **WHEN** a file is uploaded and the dashboard first renders
- **THEN** every category in the filter sidebar is checked, and both the pie chart and the bar chart reflect every category

#### Scenario: select-all re-checks everything
- **WHEN** the user has unchecked one or more categories, then clicks "select all"
- **THEN** every category becomes checked again, and both charts reflect the full, unfiltered set

#### Scenario: personal and joint filter state are independent
- **WHEN** the user unchecks a category in the personal view's filter sidebar, then switches to the joint view
- **THEN** the joint view's filter sidebar still shows every category checked (or whatever its own state was previously), unaffected by the personal view's change

#### Scenario: unchecking every category leaves both charts empty, not broken
- **WHEN** the user unchecks every category in the filter sidebar
- **THEN** the pie chart and the bar chart both render with no data, rather than erroring or showing stale data
