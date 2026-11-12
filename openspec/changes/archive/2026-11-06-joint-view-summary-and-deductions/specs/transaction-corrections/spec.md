## MODIFIED Requirements

### Requirement: Deduction history
The system SHALL maintain a visible, permanent record of every applied deduction, grouped by the expense it was deducted from. The system SHALL display this record as two independent panels, scoped by the deducted-from expense's source: a personal-view panel showing only deductions against non-joint-sourced expenses, scoped to the currently-selected personal month by that expense's own date; and a joint-view panel showing only deductions against joint-sourced (revolut-joint) expenses, scoped to the currently-selected joint month by that expense's own date. For each expense with at least one deduction still in effect, its panel SHALL show its original amount (before any deduction), the percentage of that original amount deducted so far, and each individual deduction underneath it (naming the income it came from and the amount). An expense whose entire original amount has been deducted away SHALL no longer appear in either panel.

#### Scenario: a deduction appears in the record immediately after being applied
- **WHEN** the user applies a deduction
- **THEN** the appropriate panel (personal or joint, depending on the deducted-from expense's source) shows that expense's group, including the new deduction entry

#### Scenario: the record switches with the selected month
- **WHEN** the user switches the personal view to a different month
- **THEN** the personal deduction-history panel shows only deductions against non-joint-sourced expenses dated in that month

#### Scenario: the joint record switches with the selected joint month
- **WHEN** the user switches the joint view to a different month
- **THEN** the joint deduction-history panel shows only deductions against joint-sourced expenses dated in that month

#### Scenario: a fully-deducted expense drops out of the record
- **WHEN** an expense's entire original amount has been deducted away, whether by one deduction or by several accumulated over time
- **THEN** that expense's group no longer appears in either deduction-history panel

#### Scenario: a joint deduction never appears in the personal panel, and vice versa
- **WHEN** a deduction was applied against a joint-sourced expense
- **THEN** that deduction's group appears only in the joint view's deduction-history panel, never in the personal view's panel, even if the personal and joint months currently selected are the same
