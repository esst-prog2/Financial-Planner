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

### Requirement: Undo a single deduction
The system SHALL let the user reverse one individual deduction entry from the deduction history, independently of any other deduction - including other deductions against the same expense or from the same income. Reversing an entry SHALL restore its amount to the expense it was taken from, and SHALL restore that amount to the income it came from (fully, if no other still-active entry also drew from that income; otherwise leaving the income at whatever amount the remaining entries still account for).

#### Scenario: undoing the only deduction against an expense fully restores it
- **WHEN** the user undoes an expense's only deduction entry
- **THEN** that expense returns to its original amount and its group disappears from the deduction history

#### Scenario: undoing one of several entries against the same income only restores that entry's share
- **WHEN** one income was split across two expenses and the user undoes only one of the two resulting deduction entries
- **THEN** only that entry's amount is restored to its expense and to the income; the other entry's effect on the other expense and on the income is unchanged

### Requirement: Recover deletions and deductions on upload
When the user uploads a file and a corrupted-preferences backup (see the user-preferences capability) exists and contains any of deleted-transaction ids, deduction amounts, or deduction-history entries, the system SHALL merge that backup's data into the live state - as a union, so nothing currently active is dropped - re-applying it against the newly-parsed transactions via the existing transaction-identity matching (an id with no matching transaction in this upload has no effect, same as today's cross-upload persistence). The system SHALL show a visible notice stating how many deletions and how many deductions were restored, and SHALL clear the backup afterward so it is not reapplied on a later upload.

#### Scenario: a backup is restored on the next upload
- **WHEN** a corrupted-preferences backup exists containing deleted-transaction ids and deduction entries, and the user uploads a file whose transactions include some of those ids
- **THEN** those deletions and deductions are restored and reflected in the dashboard, and a notice states how many were restored

#### Scenario: restoring a backup does not drop anything already active
- **WHEN** the live state already has its own deletions or deductions and a backup also exists
- **THEN** after the upload, both the already-active corrections and the backup's recoverable corrections are in effect

#### Scenario: a consumed backup is not reapplied
- **WHEN** a backup was restored on one upload, then the user uploads another file
- **THEN** nothing is restored the second time, since the backup was cleared after the first restore

#### Scenario: an id with no match in the new upload is harmless
- **WHEN** a backed-up deletion or deduction references a transaction id that does not appear in the newly-uploaded file
- **THEN** that entry has no effect and nothing errors

### Requirement: Export and import corrections to a file
The system SHALL let the user download their current deleted-transaction ids, deduction amounts, and deduction-history as a single JSON file, and SHALL let the user later select such a file to merge its contents back into the live state the same way an automatic backup-restore does (union with whatever's currently active, re-applied against whatever transactions are currently loaded via transaction-identity matching). This is the only recovery path that survives a full browser-storage wipe, since that also removes any in-browser backup.

#### Scenario: exporting downloads a file with the current corrections
- **WHEN** the user clicks the export control
- **THEN** a JSON file downloads containing the current deleted-transaction ids, deduction amounts, and deduction-history

#### Scenario: importing a file restores its corrections
- **WHEN** the user selects a previously-exported file via the import control, with a file already uploaded
- **THEN** the file's deletions and deductions are merged into the live state and reflected in the dashboard

#### Scenario: importing merges rather than replaces
- **WHEN** the live state already has its own deletions or deductions and the user imports a file
- **THEN** after the import, both the already-active corrections and the imported file's corrections are in effect
