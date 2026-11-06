## ADDED Requirements

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
