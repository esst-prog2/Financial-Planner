## Purpose

Lets the user track only their fair share of the joint account's spending in their personal totals, while still exposing the full picture of the joint account in a dedicated view.

## ADDED Requirements

### Requirement: 50% personal split
The system SHALL count exactly 50% of every joint-account (`rev-joint`) expense amount toward the user's personal spending totals and category breakdown.

#### Scenario: joint expense in personal totals
- **WHEN** a `rev-joint` transaction with amount X is categorized as a spending category
- **THEN** the personal dashboard's totals and category breakdown include X/2 for that transaction

### Requirement: Dedicated joint-account view
The system SHALL provide a view scoped only to the joint account showing spending by category at full (unhalved) amounts.

#### Scenario: full amounts in joint view
- **WHEN** viewing the dedicated joint-account view
- **THEN** each joint-account transaction's full amount (not halved) is reflected in its category total

### Requirement: Joint-account monthly trend
The system SHALL display, in the dedicated joint-account view, a month-by-month bar chart of the joint account's full (unhalved) spending, with the same category-filter behavior as the personal dashboard's monthly trend chart.

#### Scenario: joint monthly trend filtered by category
- **WHEN** the user selects a category from the joint-account view's category filter
- **THEN** the joint monthly trend chart updates to show only that category's full spending per month

### Requirement: Contributor breakdown
The system SHALL show, in the dedicated joint-account view, how much each contributor transferred into the joint account, identified from the "Átutalás tőle: <name>" description pattern.

#### Scenario: two contributors
- **WHEN** the joint account has incoming transfers described as "Átutalás tőle: <name>" from two different names
- **THEN** the joint-account view shows a total contributed amount per name

### Requirement: Contribution exclusion from personal income
The system SHALL exclude joint-account contribution-in transactions (both the user's own top-ups and the co-holder's) from the user's personal Bevétel total.

#### Scenario: co-holder contribution
- **WHEN** the co-holder transfers money into the joint account
- **THEN** that amount is not counted as the user's personal Bevétel; it appears only in the joint-account contributor breakdown

#### Scenario: user's own contribution
- **WHEN** the user transfers their own money into the joint account
- **THEN** that amount is not counted as the user's personal Bevétel or spending; it appears only in the joint-account contributor breakdown
