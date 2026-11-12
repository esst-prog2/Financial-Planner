## MODIFIED Requirements

### Requirement: Select transactions for correction
The system SHALL let the user select one or more individual transactions, in any of the personal income list, personal category list, joint category list, or joint income list, via a checkbox on each row. Once at least one transaction is selected, the system SHALL show a selection action bar offering to delete the selection or to clear it. A transaction's selected state SHALL persist across a month switch: switching the currently-viewed month changes only which transactions are available to select next, not which ones are already selected.

#### Scenario: selecting a transaction reveals the action bar
- **WHEN** the user checks a transaction's checkbox
- **THEN** a selection action bar appears, showing at least a delete option and a clear-selection option

#### Scenario: clearing the selection
- **WHEN** the user clicks "clear selection" with one or more transactions checked
- **THEN** every checked box is unchecked, the action bar disappears, and no transaction data changes

#### Scenario: a selection survives switching to a different month
- **WHEN** the user selects a transaction, then switches to a different month and selects a transaction there too
- **THEN** both transactions remain selected and are both counted by the selection action bar

### Requirement: Deduct an income transaction from one or more expenses
When the current selection contains exactly one income transaction and at least one expense transaction, the system SHALL offer to split the income's amount across the selected expenses. The system SHALL provide, for each selected expense, a way to enter how much of the income to deduct from it, including quick-fill shortcuts for the smaller or larger of the income/expense amounts (in full or halved) and for an explicit percentage of that expense's own original amount (not its currently-remaining amount). The system SHALL NOT allow allocating more than the income's own amount, and SHALL NOT allow a single expense's allocation to exceed that expense's own remaining amount. The system SHALL allow allocating less than the full income; the unallocated remainder SHALL remain as income afterward, not be deleted. The selected income and the selected expense(s) MAY belong to different months; the deduction action SHALL be offered and applied the same way regardless of whether they share a month. The resulting deduction SHALL be tracked against the expense's own month (per the Deduction history requirement), not the income's month or whichever month happened to be displayed when the deduction was applied.

#### Scenario: selecting one income and one expense offers the deduction action
- **WHEN** the user selects exactly one income transaction and at least one expense transaction
- **THEN** the system offers an action to deduct the income across the selected expense(s)

#### Scenario: applying a full deduction removes the income and shrinks the expense
- **WHEN** the user deducts the income's entire amount from a single selected expense
- **THEN** the income transaction is removed and that expense's amount is reduced by the deducted amount

#### Scenario: applying a partial deduction leaves a smaller income behind
- **WHEN** the user deducts less than the income's full amount
- **THEN** the income transaction remains, now showing only the undeducted remainder

#### Scenario: a percentage quick-fill uses the expense's original amount, not its remaining amount
- **WHEN** the user enters a percentage for an expense that has already had an earlier, separate deduction applied to it
- **THEN** the quick-filled amount is that percentage of the expense's full original amount, not of its already-reduced remaining amount

#### Scenario: over-allocating the income is rejected
- **WHEN** the amounts entered for the selected expenses sum to more than the income's own amount
- **THEN** the system does not allow applying the deduction

#### Scenario: deducting across two different months
- **WHEN** the user selects an income transaction dated in one month and an expense transaction dated in a different month, then applies a deduction between them
- **THEN** the deduction is applied the same way as if both had been dated in the same month

#### Scenario: a cross-month deduction is tracked under the expense's own month
- **WHEN** the user applies a deduction between an income dated in one month and an expense dated in a different month, while a third month (or either of the two) happens to be the currently-displayed one
- **THEN** the deduction history entry appears when the expense's own month is selected, not when the income's month or the month active during the action is selected
