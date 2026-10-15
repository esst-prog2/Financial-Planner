# transaction-corrections Specification

## Purpose

Lets the user correct a transaction after the fact - delete one that should not count at all, or deduct an income transaction's amount from one or more expenses it actually offsets (e.g. a roommate's rent contribution reducing the rent expense) instead of counting it as unrelated income.

## Requirements

### Requirement: Transaction identity
The system SHALL assign every parsed transaction a stable identity derived from its source, date, description, amount, and currency, disambiguated by an occurrence counter when two transactions are otherwise identical, so the same underlying bank row is recognized consistently across the personal and joint views and across repeated uploads of overlapping exports.

#### Scenario: a joint-sourced transaction has the same identity in both views
- **WHEN** a joint-account transaction is parsed
- **THEN** its personal-view mirror and its joint-view entry carry the same identity

#### Scenario: two genuinely distinct transactions with identical fields get distinct identities
- **WHEN** two transactions share the same source, date, description, amount, and currency
- **THEN** they are each assigned a distinct identity, not merged into one

### Requirement: Select transactions for correction
The system SHALL let the user select one or more individual transactions, in any of the personal income list, personal category list, joint category list, or joint income list, via a checkbox on each row. Once at least one transaction is selected, the system SHALL show a selection action bar offering to delete the selection or to clear it.

#### Scenario: selecting a transaction reveals the action bar
- **WHEN** the user checks a transaction's checkbox
- **THEN** a selection action bar appears, showing at least a delete option and a clear-selection option

#### Scenario: clearing the selection
- **WHEN** the user clicks "clear selection" with one or more transactions checked
- **THEN** every checked box is unchecked, the action bar disappears, and no transaction data changes

### Requirement: Delete selected transactions
The system SHALL let the user permanently remove every currently-selected transaction from the dashboard. A deletion SHALL persist across a page reload and across a later upload of a different export covering an overlapping date range, matched by the deleted transaction's identity. Deleting a joint-account transaction SHALL remove it from both the joint view and its personal-view mirror.

#### Scenario: deleting a selection removes it from the dashboard
- **WHEN** the user selects one or more transactions and confirms deletion
- **THEN** those transactions no longer appear in any list or total

#### Scenario: a deletion survives a later, different upload
- **WHEN** the user deletes a transaction, then uploads a different export file that contains a transaction with the same identity
- **THEN** that transaction is excluded again, without the user repeating the deletion

#### Scenario: deleting a joint transaction removes its personal-view mirror too
- **WHEN** the user deletes a transaction sourced from the joint account
- **THEN** it disappears from the joint view and from its mirrored entry in the personal view

### Requirement: Deduct an income transaction from one or more expenses
When the current selection contains exactly one income transaction and at least one expense transaction, the system SHALL offer to split the income's amount across the selected expenses. The system SHALL provide, for each selected expense, a way to enter how much of the income to deduct from it, including quick-fill shortcuts for the smaller or larger of the income/expense amounts (in full or halved) and for an explicit percentage of that expense's own original amount (not its currently-remaining amount). The system SHALL NOT allow allocating more than the income's own amount, and SHALL NOT allow a single expense's allocation to exceed that expense's own remaining amount. The system SHALL allow allocating less than the full income; the unallocated remainder SHALL remain as income afterward, not be deleted.

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

### Requirement: Deduction history
The system SHALL maintain a visible, permanent record of every applied deduction, grouped by the expense it was deducted from, scoped to the currently-selected month by that expense's own date. For each expense with at least one deduction still in effect, the system SHALL show its original amount (before any deduction), the percentage of that original amount deducted so far, and each individual deduction underneath it (naming the income it came from and the amount). An expense whose entire original amount has been deducted away SHALL no longer appear in this record.

#### Scenario: a deduction appears in the record immediately after being applied
- **WHEN** the user applies a deduction
- **THEN** the deduction history shows that expense's group, including the new deduction entry

#### Scenario: the record switches with the selected month
- **WHEN** the user switches to a different month
- **THEN** the deduction history shows only deductions against expenses dated in that month

#### Scenario: a fully-deducted expense drops out of the record
- **WHEN** an expense's entire original amount has been deducted away, whether by one deduction or by several accumulated over time
- **THEN** that expense's group no longer appears in the deduction history

### Requirement: Undo a single deduction
The system SHALL let the user reverse one individual deduction entry from the deduction history, independently of any other deduction - including other deductions against the same expense or from the same income. Reversing an entry SHALL restore its amount to the expense it was taken from, and SHALL restore that amount to the income it came from (fully, if no other still-active entry also drew from that income; otherwise leaving the income at whatever amount the remaining entries still account for).

#### Scenario: undoing the only deduction against an expense fully restores it
- **WHEN** the user undoes an expense's only deduction entry
- **THEN** that expense returns to its original amount and its group disappears from the deduction history

#### Scenario: undoing one of several entries against the same income only restores that entry's share
- **WHEN** one income was split across two expenses and the user undoes only one of the two resulting deduction entries
- **THEN** only that entry's amount is restored to its expense and to the income; the other entry's effect on the other expense and on the income is unchanged
