# user-preferences Specification

## Purpose

Remembers a small set of per-browser display settings - language, the user's own name, and the last-viewed month/view - across page reloads, so reopening the dashboard doesn't reset everything to its defaults.

## Requirements

### Requirement: Persist language and owner name
The system SHALL remember the selected display language and the entered owner name across a page reload, restoring both immediately on load, before any file is uploaded.

#### Scenario: language survives a reload
- **WHEN** the user switches the display language, then reloads the page
- **THEN** the dashboard loads in the previously-selected language

#### Scenario: owner name survives a reload
- **WHEN** the user enters their own name, then reloads the page
- **THEN** the owner-name field shows the previously-entered name

### Requirement: Persist last-viewed month and view
The system SHALL remember the last-selected month and the last-active view (personal or joint) and restore them after the next file upload, preferring the remembered month over that view's own default when the newly-uploaded data has a month matching the remembered one.

#### Scenario: last view is restored after the next upload
- **WHEN** the user switches to the joint view, then reloads the page and uploads a file
- **THEN** the dashboard opens on the joint view

#### Scenario: last month is restored when the new upload has data for it
- **WHEN** the user selects a specific month, then reloads the page and uploads a file that includes a month matching the remembered one
- **THEN** that month is selected, not whichever month the newly-uploaded file would otherwise default to

#### Scenario: a remembered month absent from the new upload falls back gracefully
- **WHEN** the remembered month does not appear in the newly-uploaded file's data
- **THEN** the view falls back to its own normal default month, without error

### Requirement: Graceful degradation without storage
The system SHALL continue to function normally, with nothing remembered, when browser storage is unavailable or fails (e.g. private browsing, storage disabled, or quota exceeded) - the application SHALL NOT fail to load or throw an unhandled error in this case.

#### Scenario: app still works without storage
- **WHEN** browser storage is unavailable
- **THEN** the dashboard loads and functions normally, simply without restoring any prior settings

### Requirement: Repair a mildly corrupted preferences blob in place
When the stored preferences value exists but does not parse as JSON as-is, the system SHALL attempt to repair it before giving up: trying progressively shorter prefixes of the value (recovering a value with unrelated bytes appended after otherwise-intact JSON), and trying to close whatever brackets are still open (recovering a value from a write cut short mid-structure). When a repair succeeds, the system SHALL use the repaired value exactly as if it had parsed normally, with no data loss and no separate backup needed.

#### Scenario: trailing garbage after otherwise-valid JSON is repaired automatically
- **WHEN** the stored preferences value is valid JSON followed by unrelated trailing bytes
- **THEN** the system recovers the original value and continues normally, with every previously-saved field intact

#### Scenario: a value cut short mid-structure is repaired automatically
- **WHEN** the stored preferences value ends partway through a nested object or array, as if a write were interrupted
- **THEN** the system recovers the value by closing the structure that was left open, with every field that was actually written intact

#### Scenario: a value that cannot be safely repaired is not guessed at
- **WHEN** the stored preferences value is cut off in the middle of a text value (an unterminated quoted string)
- **THEN** the system does not attempt to repair it, since there is no way to tell how much of that text was lost

### Requirement: Preserve a corrupted preferences blob
When the stored preferences value exists but cannot be parsed, even after attempting the repair above, the system SHALL copy that raw value to a separate backup storage key before the next save overwrites the original key, rather than letting the save silently discard it. The system SHALL NOT overwrite an existing backup with a later corrupted value - the first (oldest) backup is preserved until something explicitly consumes and clears it.

#### Scenario: a corrupted blob is backed up before being overwritten
- **WHEN** the stored preferences value cannot be parsed or repaired, and a setting is then saved
- **THEN** the unrepairable raw value is copied to the backup key before the save writes the new value, and the setting still saves normally

#### Scenario: an existing backup is not replaced by a second corruption event
- **WHEN** a backup already exists and the preferences value becomes unparsable again before that backup has been consumed
- **THEN** the existing backup is left unchanged
