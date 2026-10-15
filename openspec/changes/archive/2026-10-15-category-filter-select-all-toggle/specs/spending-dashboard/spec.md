## MODIFIED Requirements

### Requirement: Category filter sidebar
The system SHALL display a persistent, multi-select category filter - one checkbox per spending category plus the non-income, non-spending categories (Készpénzfelvét, Egyéb) - positioned to the left of the category pie chart and the monthly trend bar chart, with every category checked by default. The system SHALL provide a "select all" checkbox that both reflects and controls whether every category is currently checked: checked when every category is checked, and unchecked the moment the user leaves out any one category; checking it SHALL select every category, and unchecking it SHALL deselect every category. The personal view and the joint view SHALL each maintain their own independent filter state, so checking or unchecking a category in one view SHALL NOT affect the other.

#### Scenario: all categories checked by default
- **WHEN** a file is uploaded and the dashboard first renders
- **THEN** every category in the filter sidebar is checked, and both the pie chart and the bar chart reflect every category

#### Scenario: select-all re-checks everything
- **WHEN** the user has unchecked one or more categories, then checks the "select all" checkbox
- **THEN** every category becomes checked again, and both charts reflect the full, unfiltered set

#### Scenario: unchecking "select all" deselects everything
- **WHEN** every category is checked and the user unchecks the "select all" checkbox
- **THEN** every category becomes unchecked, and both charts render with no data

#### Scenario: "select all" unchecks itself when any one category is left out
- **WHEN** every category is checked and the user manually unchecks a single category
- **THEN** the "select all" checkbox becomes unchecked, reflecting that not every category is currently selected

#### Scenario: personal and joint filter state are independent
- **WHEN** the user unchecks a category in the personal view's filter sidebar, then switches to the joint view
- **THEN** the joint view's filter sidebar still shows every category checked (or whatever its own state was previously), unaffected by the personal view's change

#### Scenario: unchecking every category leaves both charts empty, not broken
- **WHEN** the user unchecks every category in the filter sidebar
- **THEN** the pie chart and the bar chart both render with no data, rather than erroring or showing stale data
