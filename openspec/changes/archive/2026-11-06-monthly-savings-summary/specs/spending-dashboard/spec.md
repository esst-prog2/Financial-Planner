## MODIFIED Requirements

### Requirement: Monthly summary
The system SHALL display, for the selected month, total income (Bevétel), total Megtakarítás-category spending for that month, total spending, and the remaining balance (income minus spending), as a bulleted list in a fixed order: income first, then the Megtakarítás total, then spending, then the balance. The total spending figure SHALL be computed as the signed sum of every non-Bevétel category's line items for the month (not the sum of each line item's absolute value), so that a refund correctly reduces total spending rather than adding to it. The Megtakarítás total SHALL be computed the same way - the signed sum of that category's line items for the month, with absolute value taken only on the final figure - so a withdrawal reduces it rather than being added as additional savings; a month where it nets to zero or positive SHALL show 0, not a negative figure. The Megtakarítás line SHALL also show what percentage of that month's income it represents, rounded to one decimal place, shown as 0% when income is zero (never a division error). This Megtakarítás line applies to the personal view's monthly summary only, not the joint view's.

#### Scenario: monthly summary values
- **WHEN** a month's transactions are loaded
- **THEN** the summary shows that month's income total, Megtakarítás total (with its percentage of income), spending total, and remaining balance

#### Scenario: summary lines appear in income, spending, balance order
- **WHEN** the monthly summary is displayed
- **THEN** its four lines appear in that fixed order - income, then the Megtakarítás total, then spending, then the balance - regardless of amount or sign

#### Scenario: a refund reduces total spending
- **WHEN** a month has both a purchase and a refund of a smaller amount in the same category
- **THEN** the displayed total spending reflects the net amount, not the sum of the purchase and the refund treated as separate spending

#### Scenario: a withdrawal reduces the displayed Megtakarítás total
- **WHEN** a month has both a deposit into and a withdrawal from Megtakarítás, the withdrawal smaller than the deposit
- **THEN** the displayed Megtakarítás total reflects the net amount, not the deposit alone

#### Scenario: a month with no net savings shows zero, not a negative figure
- **WHEN** a month's Megtakarítás-category line items sum to zero or a positive (net withdrawal) amount
- **THEN** the Megtakarítás line shows 0 and 0%

#### Scenario: the Megtakarítás line shows its share of income
- **WHEN** a month's Megtakarítás total is a nonzero fraction of that month's income
- **THEN** the Megtakarítás line shows that percentage, rounded to one decimal place

#### Scenario: zero income does not break the percentage
- **WHEN** a month has zero income but a nonzero Megtakarítás total
- **THEN** the Megtakarítás line shows 0%, not an error or an undefined value

#### Scenario: the joint view's summary has no Megtakarítás line
- **WHEN** the joint view's monthly summary is displayed
- **THEN** it shows only income, spending, and balance - no Megtakarítás line
