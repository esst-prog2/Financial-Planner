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
The system SHALL show, in the dedicated joint-account view, every positive-amount joint-account transaction for the month selected from the joint-account view's month selector - not only ones matching the "Átutalás tőle: <name>" description pattern - grouped by the same counterparty extraction the rest of the app already uses (the named sender when extractable, otherwise falling back to the raw description, e.g. a card/Apple Pay top-up). This list SHALL include transactions that are excluded from the user's personal Bevétel total elsewhere in the app (e.g. a card top-up) - its purpose is to show everything that put money into the joint account, not to duplicate the Bevétel definition. Rows SHALL be grouped by a normalized name key (accent-stripped, case-insensitive, word-order-independent) so that the same real person or source is not split across multiple rows due to formatting differences between banks or entry order (e.g. "Tóth Tibor" vs "TIBOR TOTH"), while the displayed label uses the first-seen raw spelling. Clicking a row SHALL toggle a list of the individual transactions making up that row's total open or closed, displayed directly beneath that row (not in a separate area), sorted chronologically by date, each with its date and amount, mirroring the personal income-by-source list's click-to-list behavior.

#### Scenario: two contributors
- **WHEN** the joint account has incoming transfers described as "Átutalás tőle: <name>" from two different names
- **THEN** the joint-account view shows a total contributed amount per name

#### Scenario: the same contributor written differently is grouped as one
- **WHEN** the joint account has incoming transfers from "Átutalás tőle: Tóth Tibor" and "Átutalás tőle: TIBOR TOTH"
- **THEN** the joint-account view shows a single combined total for that contributor, not two separate rows

#### Scenario: a card top-up appears in the list even though it is not Bevétel
- **WHEN** the joint account has a positive-amount card/Apple Pay top-up transaction (excluded from the user's personal Bevétel total)
- **THEN** it still appears as its own row in the joint-account view's income list, grouped by its description or by its resolved device owner name, if one is configured

#### Scenario: a card top-up with a known device owner is labeled and grouped by that owner's name
- **WHEN** a card/Apple Pay top-up's device reference has a configured owner name, and that same person also has a named "Átutalás tőle:" transfer in the same month
- **THEN** the income list shows one combined row under that person's name, not a separate device-code row

#### Scenario: a configured name alias groups a name variant with its canonical name
- **WHEN** the same real person's contributions appear under two name variants the general accent/case/word-order grouping treats as different (e.g. with vs. without a middle name), and a name alias mapping that variant to a canonical name is configured
- **THEN** the income list shows a single combined row under the canonical name

#### Scenario: clicking a row lists its individual transactions, in date order, directly underneath it
- **WHEN** the user clicks a row in the joint-account view's income list
- **THEN** that row's individual transactions for the selected month appear directly beneath it, sorted chronologically by date, each with its date and amount

#### Scenario: clicking an already-open row closes it
- **WHEN** the user clicks a row whose individual-transaction list is currently shown
- **THEN** that list is hidden again

#### Scenario: selecting a different month scopes the income list
- **WHEN** the same contributor sent money into the joint account in two different months and the user picks one of those months from the joint-account view's month selector
- **THEN** the income list shows only that month's amount for the contributor, not the combined total across both months

### Requirement: Contribution exclusion from personal income
The system SHALL exclude joint-account contribution-in transactions (both the user's own top-ups and the co-holder's) from the user's personal Bevétel total.

#### Scenario: co-holder contribution
- **WHEN** the co-holder transfers money into the joint account
- **THEN** that amount is not counted as the user's personal Bevétel; it appears only in the joint-account contributor breakdown

#### Scenario: user's own contribution
- **WHEN** the user transfers their own money into the joint account
- **THEN** that amount is not counted as the user's personal Bevétel or spending; it appears only in the joint-account contributor breakdown
