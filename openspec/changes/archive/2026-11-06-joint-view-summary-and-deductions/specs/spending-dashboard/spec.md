## ADDED Requirements

### Requirement: Joint monthly summary
The system SHALL display, within the joint account view, a monthly summary for the currently-selected joint month mirroring the personal view's Monthly summary requirement: total joint spending, total joint contributions (income), and the remaining balance (contributions minus spending), as a bulleted list in the same fixed order (income first, then spending, then the balance). Unlike the personal summary, the joint summary SHALL use each joint-sourced transaction's full (unhalved) amount rather than its personal-view (halved) amount, consistent with the rest of the joint view (its pie chart and monthly-trend chart already show full joint amounts). The joint summary's total spending figure SHALL be computed the same way as the personal summary's - the signed sum of every non-Bevétel joint-sourced line item for the month, so a refund correctly reduces total spending rather than adding to it.

#### Scenario: joint monthly summary values
- **WHEN** the joint view is open and a joint month's transactions are loaded
- **THEN** the joint summary shows that month's full (unhalved) joint spending total, joint contribution total, and remaining balance

#### Scenario: joint summary lines appear in income, spending, balance order
- **WHEN** the joint monthly summary is displayed
- **THEN** its three lines appear in that fixed order - income, then spending, then the balance - regardless of amount or sign

#### Scenario: a refund reduces joint total spending
- **WHEN** a joint month has both a purchase and a refund of a smaller amount in the same category
- **THEN** the displayed joint total spending reflects the net amount, not the sum of the purchase and the refund treated as separate spending

#### Scenario: the joint summary uses full amounts, not halved ones
- **WHEN** a joint-sourced expense would be halved for the personal view's own totals
- **THEN** the joint summary's spending total still reflects that expense's full, unhalved amount
