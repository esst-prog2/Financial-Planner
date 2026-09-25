# joint-account-handling Specification

## Purpose

Lets the user track only their fair share of the joint account's spending in their personal totals, while still exposing the full picture of the joint account in a dedicated view.

## Requirements

### Requirement: 50% personal split
The system SHALL count exactly 50% of every joint-account (`rev-joint`) expense amount toward the user's personal spending totals and category breakdown.

#### Scenario: joint expense in personal totals
- **WHEN** a `rev-joint` transaction with amount X is categorized as a spending category
- **THEN** the personal dashboard's totals and category breakdown include X/2 for that transaction

### Requirement: Dedicated joint-account view
The system SHALL provide a view scoped only to the joint account showing spending by category at full (unhalved) amounts, scoped to a month the user selects from a dedicated joint-account month selector, mirroring the personal dashboard's month-scoped category pie. Each category's total SHALL be the signed sum of its line items for the selected month, with absolute value taken only on that final total; a category whose signed total is zero or positive SHALL be excluded from the joint pie chart. The joint pie chart's slices SHALL be sorted in descending order by amount and SHALL use the same fixed, category-specific color mapping as the personal category pie, so a given category always renders in the same color there too. Clicking a slice SHALL list the individual joint-account transactions making up that category's total for the selected month, mirroring the personal category pie's click-to-list behavior.

#### Scenario: full amounts in joint view
- **WHEN** viewing the dedicated joint-account view
- **THEN** each joint-account transaction's full amount (not halved) is reflected in its category total

#### Scenario: a joint category that nets to a refund is excluded from the pie
- **WHEN** a joint-account category's line items for the selected month sum to zero or a positive amount
- **THEN** that category does not appear as a slice in the joint pie chart

#### Scenario: joint pie slices are sorted and consistently colored
- **WHEN** the joint category pie chart is displayed
- **THEN** its slices appear in descending order by amount, and each category renders in the same color it uses on the personal category pie

#### Scenario: selecting a month scopes the joint pie chart
- **WHEN** the user picks a different month from the joint-account view's month selector
- **THEN** the joint category pie chart re-renders using only that month's joint-account transactions

#### Scenario: clicking a joint pie slice lists its transactions
- **WHEN** the user clicks a category slice in the joint category pie chart
- **THEN** the view lists the individual joint-account transactions for that category and the selected month

### Requirement: Joint-account monthly trend
The system SHALL display, in the dedicated joint-account view, a month-by-month bar chart of the joint account's full (unhalved) spending, with the same category-filter behavior as the personal dashboard's monthly trend chart.

#### Scenario: joint monthly trend filtered by category
- **WHEN** the user selects a category from the joint-account view's category filter
- **THEN** the joint monthly trend chart updates to show only that category's full spending per month

### Requirement: Contributor breakdown
The system SHALL show, in the dedicated joint-account view, how much each contributor transferred into the joint account, identified from the "Átutalás tőle: <name>" description pattern. Contributors SHALL be grouped by a normalized name key (accent-stripped, case-insensitive, word-order-independent) so that the same real person is not split across multiple rows due to formatting differences between banks or entry order (e.g. "Tóth Tibor" vs "TIBOR TOTH"), while the displayed label uses the first-seen raw spelling for that contributor.

#### Scenario: two contributors
- **WHEN** the joint account has incoming transfers described as "Átutalás tőle: <name>" from two different names
- **THEN** the joint-account view shows a total contributed amount per name

#### Scenario: the same contributor written differently is grouped as one
- **WHEN** the joint account has incoming transfers from "Átutalás tőle: Tóth Tibor" and "Átutalás tőle: TIBOR TOTH"
- **THEN** the joint-account view shows a single combined total for that contributor, not two separate rows

### Requirement: Contribution exclusion from personal income
The system SHALL exclude joint-account contribution-in transactions (both the user's own top-ups and the co-holder's) from the user's personal Bevétel total.

#### Scenario: co-holder contribution
- **WHEN** the co-holder transfers money into the joint account
- **THEN** that amount is not counted as the user's personal Bevétel; it appears only in the joint-account contributor breakdown

#### Scenario: user's own contribution
- **WHEN** the user transfers their own money into the joint account
- **THEN** that amount is not counted as the user's personal Bevétel or spending; it appears only in the joint-account contributor breakdown
