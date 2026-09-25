## Purpose

Gives the user a visual overview of their categorized spending in the browser - a monthly summary, a category breakdown, and a month-by-month trend they can filter by category.

## ADDED Requirements

### Requirement: File upload
The system SHALL let the user upload an Excel workbook containing the OTP and Revolut sheets directly in the browser, with no server round-trip.

#### Scenario: upload and parse
- **WHEN** the user selects a valid workbook file
- **THEN** the dashboard populates from its parsed, categorized, deduplicated transactions

### Requirement: Monthly summary
The system SHALL display, for the selected month, total spending, total income (Bevétel), and the remaining balance (income minus spending).

#### Scenario: monthly summary values
- **WHEN** a month's transactions are loaded
- **THEN** the summary shows that month's spending total, income total, and remaining balance

### Requirement: Category pie chart
The system SHALL display a pie chart breaking down the selected month's spending by category, showing each category's percentage of total spending directly alongside its label (not only on hover), and SHALL let the user list the individual transactions within a category.

#### Scenario: click a category slice
- **WHEN** the user clicks a category in the pie chart
- **THEN** the system lists the individual transactions within that category

#### Scenario: percentage shown per category
- **WHEN** the category pie chart is displayed
- **THEN** each category's legend label includes what percentage of the month's total spending it represents

### Requirement: Month-by-month trend with category filter
The system SHALL display a bar chart comparing total spending across all available months, with a category dropdown that filters the chart to a single category's spending per month when selected.

#### Scenario: filter to one category
- **WHEN** the user selects "Groceries" (Élelmiszer) from the category dropdown
- **THEN** the bar chart updates to show only Élelmiszer spending for each month

### Requirement: Language toggle
The system SHALL let the user switch the displayed language between Hungarian and English, translating all static UI text and category display labels; the underlying category identity used for filtering and categorization SHALL remain unaffected by the selected display language.

#### Scenario: switch to English
- **WHEN** the user selects English from the language control
- **THEN** all headings, labels, and category names on screen switch to their English translation

#### Scenario: filtering is unaffected by display language
- **WHEN** the user has selected English and then picks a category from a filter dropdown
- **THEN** the dashboard filters using the same underlying category regardless of which language its label was shown in
