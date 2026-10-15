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
