import { buildLineItems, monthOf } from './pipeline.js';
import { parseRevolutSheet } from './parseRevolut.js';
import { resolveSheetName, formatHuf, applyTransactionOverrides } from './util.js';
import { summarizeJointIncome, jointIncomeLabel } from './jointAccount.js';
import { SPENDING_CATEGORIES, NON_SPENDING_CATEGORIES } from './categorize.js';
import { categoryTotals, pieEligibleRows, monthlySummary, monthlyTrend, incomeBySource } from './aggregate.js';
import { categoryColor } from './categoryColors.js';
import { normalizeNameForGrouping } from './util.js';
import { DEFAULT_LANGUAGE, t, categoryLabel, summaryLines, missingSheetMessage, genericErrorMessage } from './i18n.js';
import { loadPreferences, savePreferences } from './preferences.js';

const SHEET_NAMES = ['otp', 'rev-eur', 'rev-hu', 'rev-joint'];
const ALL_CATEGORIES = [...SPENDING_CATEGORIES, ...NON_SPENDING_CATEGORIES.filter((c) => c !== 'Bevétel')];

const fileInput = document.getElementById('file-input');
const errorMessage = document.getElementById('error-message');
const app = document.getElementById('app');
const viewSwitch = document.getElementById('view-switch');
const monthBar = document.getElementById('month-bar');
const monthSelect = document.getElementById('month-select');
const summaryTextEl = document.getElementById('summary-text');
const categoryFilter = document.getElementById('category-filter');
const categoryTransactions = document.getElementById('category-transactions');
const jointCategoryFilter = document.getElementById('joint-category-filter');
const jointContributors = document.getElementById('joint-contributors');
const jointCategoryTransactions = document.getElementById('joint-category-transactions');
const jointMonthSelect = document.getElementById('joint-month-select');
const languageSelect = document.getElementById('language-select');
const incomeTotalEl = document.getElementById('income-total');
const incomeSourcesEl = document.getElementById('income-sources');
const ownerNameInput = document.getElementById('owner-name');
const deleteBar = document.getElementById('delete-bar');
const clearSelectionButton = document.getElementById('clear-selection');
const deleteButton = document.getElementById('delete-selected');
const deleteCountEl = document.getElementById('delete-count');
const allocateButton = document.getElementById('allocate-selected');
const allocationPanel = document.getElementById('allocation-panel');
const allocationRowsEl = document.getElementById('allocation-rows');
const allocationRemainingEl = document.getElementById('allocation-remaining');
const allocationApplyButton = document.getElementById('allocation-apply');
const allocationCancelButton = document.getElementById('allocation-cancel');
const deductionHistoryRowsEl = document.getElementById('deduction-history-rows');

const prefs = loadPreferences();

// The unfiltered parse of the last uploaded file - kept around (not just
// the overridden state.items/jointRaw) so a deletion or a deduction can be
// undone: state is always recomputed by re-filtering/re-adjusting this raw
// source, never by patching the already-overridden arrays directly, since
// a transaction excluded by deletedTransactionIds doesn't exist in
// state.items/jointRaw at all and there would be nothing to "add back".
let rawItems = [];
let rawJointRaw = [];
let state = { items: [], jointRaw: [] };
let lang = prefs.lang || DEFAULT_LANGUAGE;
// Transactions currently ticked for deletion, across every open list at
// once (not scoped to one list) - cleared on every upload and after each
// delete. Not the same thing as deletedTransactionIds below: this is just
// "what's checked right now."
let selectedForDeletion = new Set();
// Every id ever deleted, persisted via preferences.js (keyed by the stable
// transaction id from assignTransactionIds) so a later upload - even of a
// different export covering the same date range - doesn't bring a deleted
// transaction back. Deliberately no restore UI for this: the only way back
// is to find the row again and know it's "supposed" to be there.
let deletedTransactionIds = new Set(prefs.deletedTransactionIds || []);
// Cumulative HUF adjustment per transaction id, from the "deduct an income
// transaction from one or more expenses" feature (e.g. a roommate's rent
// contribution subtracted from the rent payment itself, instead of just
// counting as unrelated income). Positive on an expense (shrinks its
// magnitude toward zero), negative on an income left only partially
// allocated (shrinks it the same way, from the other side) - see
// applyTransactionOverrides in util.js for how this gets applied.
let transactionAdjustments = { ...(prefs.transactionAdjustments || {}) };
// A human-readable log of every deduction ever applied, persisted
// alongside the numbers above but kept entirely separate from them -
// transactionAdjustments is just the net numbers applyTransactionOverrides
// needs; this is "what happened and why", for the deduction-history panel.
// Never scoped to the selected month (it's a permanent record, not
// month-bound content) and never recomputed - only ever appended to.
let deductionHistory = [...(prefs.deductionHistory || [])];
let pieChart = null;
let barChart = null;
let jointPieChart = null;
let jointBarChart = null;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.hidden = true;
  errorMessage.textContent = '';
}

function readSheets(workbook) {
  const sheets = {};
  for (const name of SHEET_NAMES) {
    const actualName = resolveSheetName(workbook.SheetNames, name);
    if (!actualName) throw new Error(missingSheetMessage(name, lang));
    sheets[name] = window.XLSX.utils.sheet_to_json(workbook.Sheets[actualName], { header: 1, raw: true });
  }
  return sheets;
}

function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n, lang);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder, lang);
  });
  document.documentElement.lang = lang;
}

// Rebuilds both category-filter dropdowns with labels in the current
// language, while keeping their canonical (Hungarian) values - filtering
// logic never depends on the display language.
function renderCategoryFilterOptions() {
  const previousPersonal = categoryFilter.value;
  const previousJoint = jointCategoryFilter.value;
  const optionsHtml = `<option value="">${t('allCategoriesOption', lang)}</option>${ALL_CATEGORIES.map(
    (c) => `<option value="${c}">${categoryLabel(c, lang)}</option>`,
  ).join('')}`;
  categoryFilter.innerHTML = optionsHtml;
  jointCategoryFilter.innerHTML = optionsHtml;
  categoryFilter.value = previousPersonal;
  jointCategoryFilter.value = previousJoint;
}

// Renders the available months as a row of tab buttons instead of a
// native <select> dropdown, while keeping the same interface the rest of
// this file already relies on: a settable/readable `.value` and a
// 'change' event on click - a plain element happily carries an ad-hoc
// `.value` property, so nothing elsewhere needs to change. selectEl keeps
// its name for that reason, even though it's a <div> now, not a <select>.
// Sets a month-tabs element's value the same way clicking a tab does
// (updates .value, the .active class, and fires 'change' for whichever
// listener re-renders that view) - used both by the click handler below and
// by the view switch, which carries the currently-selected month over to
// the other view's month-select when that month exists there too, instead
// of letting it silently reset to its own default.
function selectMonth(selectEl, month) {
  const button = selectEl.querySelector(`button[data-month="${month}"]`);
  if (!button || month === selectEl.value) return;
  selectEl.value = month;
  selectEl.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
  selectEl.dispatchEvent(new Event('change'));
}

// Laid out as a grid, not a plain wrapping row: each calendar month
// (01-12) owns one column, assigned in the order it first appears, so a
// month that recurs in a later year (e.g. both 2025-10 and 2026-10) stacks
// directly under its earlier occurrence instead of just continuing the
// horizontal flow wherever the row happened to wrap.
function populateMonthOptions(selectEl, items) {
  const months = [...new Set(items.map((i) => monthOf(i.date)).filter(Boolean))].sort();
  const columnByCalendarMonth = new Map();
  const rowByCalendarMonth = new Map();
  const cells = months.map((m) => {
    const calendarMonth = m.slice(5, 7);
    if (!columnByCalendarMonth.has(calendarMonth)) columnByCalendarMonth.set(calendarMonth, columnByCalendarMonth.size + 1);
    const row = (rowByCalendarMonth.get(calendarMonth) || 0) + 1;
    rowByCalendarMonth.set(calendarMonth, row);
    return { m, column: columnByCalendarMonth.get(calendarMonth), row };
  });
  selectEl.style.setProperty('--month-columns', columnByCalendarMonth.size || 1);
  selectEl.innerHTML = cells
    .map(({ m, column, row }) => `<button type="button" data-month="${m}" style="grid-column:${column};grid-row:${row}">${m}</button>`)
    .join('');
  selectEl.onclick = (event) => {
    const button = event.target.closest('button[data-month]');
    if (!button) return;
    selectMonth(selectEl, button.dataset.month);
  };
  if (months.length) {
    selectEl.value = months[months.length - 1];
    selectEl.querySelector(`button[data-month="${selectEl.value}"]`)?.classList.add('active');
  }
  return months;
}

function renderMonthOptions(items) {
  return populateMonthOptions(monthSelect, items);
}

function renderJointMonthOptions(items) {
  return populateMonthOptions(jointMonthSelect, items.filter((i) => i.source === 'revolut-joint'));
}

function renderSummary() {
  const month = monthSelect.value;
  const { income, spending, balance } = monthlySummary(state.items, month);
  summaryTextEl.innerHTML = summaryLines(lang, { spending, income, balance })
    .map(({ label, amount }) => `<li>${label}: ${formatHuf(amount)} HUF</li>`)
    .join('');
}

function renderIncomeBySource() {
  const month = monthSelect.value;
  const rows = incomeBySource(state.items, month);
  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);
  incomeTotalEl.textContent = `${formatHuf(total)} HUF`;
  incomeSourcesEl.innerHTML = rows
    .map(
      ([source, amount]) =>
        `<li data-key="${normalizeNameForGrouping(source)}" data-label="${source}">` +
        `<span class="row-summary">${source || t('noDescription', lang)}: ${formatHuf(amount)} HUF</span>` +
        `<ul class="row-detail" hidden></ul>` +
        `</li>`,
    )
    .join('');
}

// Shared by both income detail toggles below (personal and joint), which
// were two near-identical copies of this same open/close-sort-render logic
// before being factored out here - only what rows to show and which field
// holds the amount actually differ between them.
function toggleTransactionDetail(row, rows, amountOf) {
  const detail = row.querySelector('.row-detail');
  if (!detail.hidden) {
    detail.hidden = true;
    return;
  }
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  detail.innerHTML = sorted.map((r) => transactionRowHtml(r.id, `${r.date} - ${formatHuf(Math.abs(amountOf(r)))} HUF`, 'income')).join('');
  detail.hidden = false;
}

// Toggles a clicked income source's individual Bevétel transactions - date
// order - open or closed, right under that row (not in a separate area).
// Mirrors renderCategoryTransactionList's click-to-list behavior, but keyed
// by the normalized source name rather than category, since several raw
// labels can collapse into one row.
function toggleIncomeSourceDetail(row, key, month) {
  const rows = state.items.filter(
    (i) => i.category === 'Bevétel' && monthOf(i.date) === month && normalizeNameForGrouping(i.counterparty || i.description || '') === key,
  );
  toggleTransactionDetail(row, rows, (r) => r.personalAmountHuf);
}

// A single deletable transaction row: a checkbox (picked up by the
// delegated `.tx-select` change listener below) plus whatever text the
// caller already built, wrapped in a <label> so clicking the text also
// toggles the box.
// kind is 'income' or 'expense' - lets the action bar tell whether enough
// of each is selected to offer the "deduct one from the other" action, not
// just plain delete.
function transactionRowHtml(id, text, kind) {
  // Re-checks a box whose id is still selected across a rebuild of its
  // list (e.g. closing and reopening the same detail, or clicking a
  // different pie slice) - otherwise the fresh markup would render
  // unchecked while selectedForDeletion still silently counted it.
  const checked = selectedForDeletion.has(id) ? ' checked' : '';
  return `<li><label><input type="checkbox" class="tx-select" data-tx-id="${id}" data-kind="${kind}"${checked}> ${text}</label></li>`;
}

// The two expense (category-click) lists render as a table - date,
// description, amount columns, sorted oldest-first - rather than the
// one-line-per-row lists the income lists still use. `amountField` is
// 'personalAmountHuf' for the personal view or 'amountHuf' for the joint
// view, since a joint-sourced row carries both (see pipeline.js).
function expenseTableHtml(category, rows, amountField) {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const bodyRows = sorted
    .map((r) => {
      const checked = selectedForDeletion.has(r.id) ? ' checked' : '';
      return (
        '<tr>' +
        `<td><input type="checkbox" class="tx-select" data-tx-id="${r.id}" data-kind="expense"${checked}></td>` +
        `<td>${r.date}</td>` +
        `<td>${r.description || t('noDescription', lang)}</td>` +
        `<td>${formatHuf(Math.abs(r[amountField]))} HUF</td>` +
        '</tr>'
      );
    })
    .join('');
  return (
    `<h3>${categoryLabel(category, lang)}</h3>` +
    '<table><thead><tr><th></th>' +
    `<th>${t('tableDateLabel', lang)}</th><th>${t('tableDescriptionLabel', lang)}</th><th>${t('tableAmountLabel', lang)}</th>` +
    `</tr></thead><tbody>${bodyRows}</tbody></table>`
  );
}

// Looks a transaction up by id across both arrays state holds (an income
// transaction may only exist in one of them - personal Bevétel items live
// in state.items, joint contributions only in state.jointRaw, since
// pipeline.js excludes joint contributions from items entirely) and
// returns its description plus a single signed HUF amount. Prefers the
// full amount (amountHuf, same thing the joint category list displays)
// over the halved personalAmountHuf (what the personal category list shows
// for the same joint-sourced row) - for a non-joint transaction the two are
// identical anyway, which covers this feature's actual use case (deducting
// a personal, non-joint expense).
function findTransactionById(id) {
  const found = state.items.find((i) => i.id === id) || state.jointRaw.find((t) => t.id === id);
  if (!found) return null;
  const amount = found.amountHuf ?? found.personalAmountHuf ?? found.amount;
  return { id, description: found.description || t('noDescription', lang), amount, date: found.date };
}

// An expense's full magnitude before any deduction ever chipped away at
// it: its current (live, already-shrunk) remaining amount plus every
// deduction logged against it added back. Not a stored snapshot, so it
// stays correct across however many separate deduction actions have
// targeted the same expense over time - used both by the deduction-history
// panel's "Eredeti összeg" line and by the allocation panel's %-of-original
// quick-fill, which must compute against this, not against whatever
// happens to remain after earlier deductions.
function originalAmountForExpense(expenseId) {
  const current = findTransactionById(expenseId);
  const remaining = Math.round(Math.abs(current?.amount ?? 0));
  const totalDeducted = deductionHistory.filter((e) => e.expenseId === expenseId).reduce((sum, e) => sum + e.amount, 0);
  return remaining + totalDeducted;
}

// Adds a legend label (with that category's percentage of the pie's total
// baked in) to pie-eligible rows ({category, value}, value already
// non-negative - see aggregate.js's pieEligibleRows).
function withPercentages(rows) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return rows.map((r) => {
    const pct = total > 0 ? Math.round((r.value / total) * 1000) / 10 : 0;
    return { ...r, label: `${categoryLabel(r.category, lang)} (${pct}%)` };
  });
}

function renderCategoryPie() {
  const month = monthSelect.value;
  const rows = withPercentages(pieEligibleRows(categoryTotals(state.items, { month })));

  if (pieChart) pieChart.destroy();
  pieChart = new window.Chart(document.getElementById('category-pie'), {
    type: 'pie',
    data: { labels: rows.map((r) => r.label), datasets: [{ data: rows.map((r) => r.value), backgroundColor: rows.map((r) => categoryColor(r.category)) }] },
    options: {
      onClick: (evt, elements) => {
        if (!elements.length) return;
        renderCategoryTransactionList(rows[elements[0].index].category, month);
      },
    },
  });
}

function renderCategoryTransactionList(category, month) {
  const rows = state.items.filter((i) => i.category === category && monthOf(i.date) === month);
  categoryTransactions.innerHTML = expenseTableHtml(category, rows, 'personalAmountHuf');
}

function renderMonthlyBar() {
  const category = categoryFilter.value;
  const trend = monthlyTrend(state.items, category);

  if (barChart) barChart.destroy();
  barChart = new window.Chart(document.getElementById('monthly-bar'), {
    type: 'bar',
    data: {
      labels: trend.map(([month]) => month),
      datasets: [{ label: category ? categoryLabel(category, lang) : t('allCategoriesOption', lang), data: trend.map(([, total]) => total) }],
    },
  });
}

function renderJointMonthlyBar() {
  const category = jointCategoryFilter.value;
  const trend = monthlyTrend(state.items, category, { jointOnly: true });

  if (jointBarChart) jointBarChart.destroy();
  jointBarChart = new window.Chart(document.getElementById('joint-monthly-bar'), {
    type: 'bar',
    data: {
      labels: trend.map(([month]) => month),
      datasets: [{ label: category ? categoryLabel(category, lang) : t('allCategoriesOption', lang), data: trend.map(([, total]) => total) }],
    },
  });
}

function renderJointCategoryTransactionList(category, month) {
  const rows = state.items.filter((i) => i.source === 'revolut-joint' && i.category === category && monthOf(i.date) === month);
  jointCategoryTransactions.innerHTML = expenseTableHtml(category, rows, 'amountHuf');
}

function renderJointCategoryPie() {
  const month = jointMonthSelect.value;
  const rows = withPercentages(pieEligibleRows(categoryTotals(state.items, { month, jointOnly: true })));

  if (jointPieChart) jointPieChart.destroy();
  jointPieChart = new window.Chart(document.getElementById('joint-category-pie'), {
    type: 'pie',
    data: { labels: rows.map((r) => r.label), datasets: [{ data: rows.map((r) => r.value), backgroundColor: rows.map((r) => categoryColor(r.category)) }] },
    options: {
      onClick: (evt, elements) => {
        if (!elements.length) return;
        renderJointCategoryTransactionList(rows[elements[0].index].category, month);
      },
    },
  });
}

// Scoped to the joint-account view's selected month, like the joint
// category pie - a found-via-real-use fix: an earlier all-time version
// mixed every month's top-ups/contributions together, which didn't match a
// single month's bank statement.
function renderJointIncome() {
  const month = jointMonthSelect.value;
  const incomeRows = summarizeJointIncome(state.jointRaw, month);
  jointContributors.innerHTML = `<ul>${incomeRows
    .map(
      ([label, total]) =>
        `<li data-key="${normalizeNameForGrouping(label)}" data-label="${label}">` +
        `<span class="row-summary">${label || t('noDescription', lang)}: ${formatHuf(total)} HUF</span>` +
        `<ul class="row-detail" hidden></ul>` +
        `</li>`,
    )
    .join('')}</ul>`;
}

function renderJointView() {
  renderJointCategoryPie();
  renderJointMonthlyBar();
  renderJointIncome();
}

// Toggles a clicked row's individual transactions - date order - open or
// closed, right under that row, scoped to the same month the summary row
// was computed for - keyed by the same normalized grouping it was summed
// by, since several raw labels (e.g. accent variants) can collapse into
// one row.
function toggleJointIncomeDetail(row, key, month) {
  const rows = state.jointRaw.filter((tx) => tx.amount > 0 && monthOf(tx.date) === month && normalizeNameForGrouping(jointIncomeLabel(tx)) === key);
  toggleTransactionDetail(row, rows, (r) => r.amount);
}

// Grouped by the expense that was deducted from, each group's own
// deductions listed underneath it (insertion order, so oldest-first within
// a group) - the shape the user asked for: "always which item I deducted
// from, and below it, what I deducted."
// Scoped to the selected month, like every other personal-view content -
// grouped by (and filtered on) the month the deducted-from EXPENSE itself
// falls in, not the month the deduction action happened to be made in.
function renderDeductionHistory() {
  const month = monthSelect.value;
  const groups = new Map();
  for (const entry of deductionHistory) {
    if (!groups.has(entry.expenseId)) groups.set(entry.expenseId, { description: entry.expenseDescription, entries: [] });
    groups.get(entry.expenseId).entries.push(entry);
  }

  const visibleGroups = [...groups.values()]
    .map(({ description, entries }) => {
      const expenseId = entries[0].expenseId;
      const current = findTransactionById(expenseId);
      const remaining = Math.round(Math.abs(current?.amount ?? 0));
      const originalAmount = originalAmountForExpense(expenseId);
      const totalDeducted = entries.reduce((sum, e) => sum + e.amount, 0);
      const deductedPct = originalAmount > 0 ? Math.round((totalDeducted / originalAmount) * 1000) / 10 : 0;
      return { description, entries, originalAmount, remaining, deductedPct, date: current?.date };
    })
    // Once an expense has been fully deducted away (nothing left of it, or
    // it's gone entirely - e.g. separately deleted), it drops out of this
    // panel rather than lingering at 0. Also drops anything whose expense
    // isn't in the currently-selected month.
    .filter((g) => g.remaining > 0 && monthOf(g.date) === month);

  if (!visibleGroups.length) {
    deductionHistoryRowsEl.innerHTML = `<p>${t('deductionHistoryEmpty', lang)}</p>`;
    return;
  }

  deductionHistoryRowsEl.innerHTML = visibleGroups
    .map(
      ({ description, entries, originalAmount, deductedPct }) =>
        `<div class="deduction-group"><h4>${description || t('noDescription', lang)}</h4>` +
        `<p class="deduction-original">${t('deductionOriginalAmountLabel', lang)}: ${formatHuf(originalAmount)} HUF (${deductedPct}% ${t('deductionPercentLabel', lang)})</p>` +
        '<ul>' +
        entries
          .map((e) => {
            // Undo needs both an entry id and the source income's id to
            // reverse correctly - neither existed on entries logged before
            // this feature, so those legacy rows just don't get a bin icon
            // rather than risk undoing the wrong thing.
            const undo = e.id && e.incomeId ? `<button type="button" class="deduction-undo" data-entry-id="${e.id}" title="${t('deductionUndoLabel', lang)}">🗑</button>` : '';
            return `<li><span>${e.incomeDescription || t('noDescription', lang)}: ${formatHuf(e.amount)} HUF</span>${undo}</li>`;
          })
          .join('') +
        '</ul></div>',
    )
    .join('');
}

// Best-effort backfill for deduction-history entries logged before id/
// incomeId existed on them (every entry from before this feature shipped):
// for each one, search the raw (unfiltered) parse for a transaction whose
// description matches the entry's recorded incomeDescription AND is
// currently excluded/adjusted (deleted, or carrying a negative
// transactionAdjustments entry) - i.e. a plausible "this is the income that
// got deducted" candidate. Only migrates when exactly one such candidate
// exists; an ambiguous (more than one) or absent match is left alone rather
// than risk wiring an undo button to the wrong income. Runs once per
// upload, since it needs rawItems/rawJointRaw to search.
function migrateLegacyDeductionEntries() {
  let changed = false;
  deductionHistory = deductionHistory.map((entry) => {
    if (entry.id && entry.incomeId) return entry;
    const candidateIds = new Set(
      [...rawItems, ...rawJointRaw]
        .filter((t) => t.description === entry.incomeDescription && (deletedTransactionIds.has(t.id) || (transactionAdjustments[t.id] || 0) < 0))
        .map((t) => t.id),
    );
    if (candidateIds.size !== 1) return entry;
    changed = true;
    return { ...entry, id: entry.id || crypto.randomUUID(), incomeId: [...candidateIds][0] };
  });
  if (changed) savePreferences({ deductionHistory });
}

// Reverses exactly one logged deduction, leaving every other entry (even
// ones from the same income or against the same expense) untouched: adds
// the entry's amount back to the expense (shrinks its stored adjustment),
// then recomputes the income's own state from whatever entries still
// reference it after this one is removed - fully restoring it if none are
// left, or leaving it as a smaller genuine income if some still are (the
// same income may have funded several expenses in one action; undoing just
// one of those should only give back that one's share, not the whole
// thing).
function undoDeductionEntry(entryId) {
  const entry = deductionHistory.find((e) => e.id === entryId);
  if (!entry) return;

  deductionHistory = deductionHistory.filter((e) => e.id !== entryId);
  savePreferences({ deductionHistory });

  transactionAdjustments[entry.expenseId] = (transactionAdjustments[entry.expenseId] || 0) - entry.amount;
  if (!transactionAdjustments[entry.expenseId]) delete transactionAdjustments[entry.expenseId];

  deletedTransactionIds.delete(entry.incomeId);
  const stillAllocated = deductionHistory.filter((e) => e.incomeId === entry.incomeId).reduce((sum, e) => sum + e.amount, 0);
  if (stillAllocated > 0) transactionAdjustments[entry.incomeId] = -stillAllocated;
  else delete transactionAdjustments[entry.incomeId];

  savePreferences({ deletedTransactionIds: [...deletedTransactionIds], transactionAdjustments });
  recomputeState();
  afterTransactionsChanged();
}

deductionHistoryRowsEl.addEventListener('click', (event) => {
  const undoButton = event.target.closest('.deduction-undo');
  if (!undoButton) return;
  undoDeductionEntry(undoButton.dataset.entryId);
});

function renderAll() {
  renderSummary();
  renderIncomeBySource();
  renderCategoryPie();
  renderMonthlyBar();
  renderDeductionHistory();
  // renderJointView() is intentionally not called here: Chart.js sizes a
  // canvas from its container's layout box at creation time, and the
  // joint-view section starts out hidden (display: none), so a chart
  // created there would render at zero size. It's rendered lazily instead,
  // the first time the user actually switches to that tab (see below).
}

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  clearError();

  try {
    const buffer = await file.arrayBuffer();
    // cellDates converts natively-dated Excel cells to JS Date objects
    // instead of raw serial numbers - toIsoDate() in util.js still has a
    // serial-number fallback in case a date column wasn't formatted as a
    // date type in the source file.
    const workbook = window.XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheets = readSheets(workbook);

    const items = buildLineItems(sheets, { ownerName: ownerNameInput?.value });
    const jointRaw = parseRevolutSheet(sheets['rev-joint'], 'revolut-joint');

    // Kept around unfiltered so a later undo can recompute state from
    // scratch - see recomputeState(). Re-applies every deletion and
    // deduction made on a previous upload, including a different export
    // file, as long as the same transaction's id (date + description +
    // amount + source) still matches - so neither comes back just because
    // the new file happens to cover the same dates.
    rawItems = items;
    rawJointRaw = jointRaw;
    migrateLegacyDeductionEntries();
    recomputeState();
    // Any selection from the old upload's (now-replaced) list elements is
    // meaningless against the new one.
    selectedForDeletion = new Set();
    deleteBar.hidden = true;

    renderMonthOptions(items);
    renderJointMonthOptions(items);
    // Prefer the month last looked at (if this file has data for it) over
    // the "last month in the data" default renderMonthOptions just picked -
    // selectMonth() already no-ops when that month isn't among this view's
    // options, so this only takes effect when it's actually available.
    if (prefs.lastMonth) {
      selectMonth(monthSelect, prefs.lastMonth);
      selectMonth(jointMonthSelect, prefs.lastMonth);
    }
    renderCategoryFilterOptions();
    app.hidden = false;
    monthBar.hidden = false;
    viewSwitch.hidden = false;
    // Any previously-shown category/income detail is for the old upload's
    // data - clear it rather than leave it stale.
    categoryTransactions.innerHTML = '';
    jointCategoryTransactions.innerHTML = '';
    renderAll();
    // If the joint view is the one currently visible, it needs its own
    // re-render too - renderAll() deliberately skips it (see its comment),
    // and otherwise it would keep showing the previous upload's data.
    if (!document.getElementById('joint-view').hidden) renderJointView();
    // First upload of the session: restore whichever view was active last
    // time, by driving the real click handler (same toggling/rendering path
    // a manual click takes) rather than duplicating its logic here.
    if (prefs.lastView === 'joint' && document.getElementById('personal-view').hidden === false) {
      viewSwitch.querySelector('button[data-view="joint"]')?.click();
    }
  } catch (err) {
    showError(err.message || genericErrorMessage(lang));
  }
});

monthSelect.addEventListener('change', () => {
  renderSummary();
  renderIncomeBySource();
  renderCategoryPie();
  renderDeductionHistory();
  // A previously-clicked category's transaction list is now stale (it was
  // for the old month) - clear it rather than leave it showing until the
  // user happens to click a slice again.
  categoryTransactions.innerHTML = '';
  savePreferences({ lastMonth: monthSelect.value });
});
categoryFilter.addEventListener('change', renderMonthlyBar);
jointCategoryFilter.addEventListener('change', renderJointMonthlyBar);
jointMonthSelect.addEventListener('change', () => {
  renderJointCategoryPie();
  renderJointIncome();
  jointCategoryTransactions.innerHTML = '';
  savePreferences({ lastMonth: jointMonthSelect.value });
});

// Delegated on #app rather than on each individual checkbox, since every
// transaction list gets rebuilt via innerHTML on every render - a listener
// on the checkbox itself would be gone the next time its list re-renders.
// The "deduct" action only makes sense with at least one income and at
// least one expense ticked at once (otherwise there's nothing to deduct
// from) - re-evaluated against the live DOM's checked boxes every time the
// selection changes, rather than tracked separately from selectedForDeletion.
function updateActionBar() {
  deleteBar.hidden = selectedForDeletion.size === 0;
  deleteCountEl.textContent = selectedForDeletion.size;
  const hasIncome = app.querySelector('.tx-select:checked[data-kind="income"]');
  const hasExpense = app.querySelector('.tx-select:checked[data-kind="expense"]');
  allocateButton.hidden = !(hasIncome && hasExpense);
}

app.addEventListener('change', (event) => {
  const checkbox = event.target.closest('.tx-select');
  if (!checkbox) return;
  if (checkbox.checked) selectedForDeletion.add(checkbox.dataset.txId);
  else selectedForDeletion.delete(checkbox.dataset.txId);
  updateActionBar();
});

// Re-derives state.items/state.jointRaw from the raw (unfiltered) last
// parse, applying the current deletedTransactionIds/transactionAdjustments
// from scratch - the single source of truth every mutation (delete,
// deduct, undo) goes through, so undoing one is just "change the overrides,
// recompute" rather than trying to patch the already-filtered arrays
// in place (impossible for a fully-deleted transaction, which isn't in
// them at all to patch).
function recomputeState() {
  const overrides = { deletedIds: deletedTransactionIds, adjustments: transactionAdjustments };
  state = {
    items: applyTransactionOverrides(rawItems, overrides),
    jointRaw: applyTransactionOverrides(rawJointRaw, overrides),
  };
}

// Shared by both the delete button and the allocation panel's Apply button -
// both mutate state.items/state.jointRaw and then need the exact same
// refresh: clear the selection and both action-bar elements, clear the two
// pie-click detail lists (the only ones that don't rebuild themselves from
// scratch below), and re-render everything currently visible.
function afterTransactionsChanged() {
  selectedForDeletion = new Set();
  deleteBar.hidden = true;
  allocationPanel.hidden = true;
  categoryTransactions.innerHTML = '';
  jointCategoryTransactions.innerHTML = '';
  renderAll();
  if (!document.getElementById('joint-view').hidden) renderJointView();
}

// Deliberately simple: removes the selected ids from both state.items and
// state.jointRaw unconditionally. A joint-sourced row lives in both arrays
// under the same id (see assignTransactionIds/pipeline.js), so one filter
// pass over each array is enough to make a joint-account deletion
// disappear from the personal view too - a plain personal-only or
// joint-income-only id just finds no match in the array it isn't in, a
// no-op there. No confirmation, and no restore UI - but the ids themselves
// persist (see deletedTransactionIds above), so a deletion survives a
// reload and a later upload of a different, overlapping export.
// Unchecks every currently-ticked box across every open list (not just one)
// without touching any transaction data - the bar's own "never mind" exit.
clearSelectionButton.addEventListener('click', () => {
  for (const checkbox of app.querySelectorAll('.tx-select:checked')) checkbox.checked = false;
  selectedForDeletion = new Set();
  updateActionBar();
});

deleteButton.addEventListener('click', () => {
  const ids = selectedForDeletion;
  for (const id of ids) deletedTransactionIds.add(id);
  savePreferences({ deletedTransactionIds: [...deletedTransactionIds] });
  recomputeState();
  afterTransactionsChanged();
});

// "Deduct an income transaction from one or more expenses" - e.g. a
// roommate's rent contribution, which isn't really income so much as it
// reduces what the rent actually cost. Requires exactly one income
// transaction selected (the thing being distributed) and at least one
// expense (what it gets distributed across); the income amount must be
// fully allocated before Apply is enabled - a left-over, partially-used
// income isn't supported yet, same as splitting one income across more
// than one expense works but splitting across several incomes at once
// doesn't.
let allocationIncomeId = null;

function renderAllocationPanel() {
  const incomeIds = [...app.querySelectorAll('.tx-select:checked[data-kind="income"]')].map((cb) => cb.dataset.txId);
  const expenseIds = [...app.querySelectorAll('.tx-select:checked[data-kind="expense"]')].map((cb) => cb.dataset.txId);
  if (incomeIds.length !== 1 || expenseIds.length === 0) return false;

  allocationIncomeId = incomeIds[0];
  const income = findTransactionById(allocationIncomeId);
  const expenses = expenseIds.map(findTransactionById).filter(Boolean);
  const incomeTotal = Math.round(Math.abs(income.amount));

  // Default split: fill each expense in turn, up to its own magnitude,
  // until the income is used up - a reasonable starting point the user can
  // still edit by hand.
  let remaining = incomeTotal;
  allocationRowsEl.innerHTML = expenses
    .map((e) => {
      const cap = Math.round(Math.abs(e.amount));
      const prefill = Math.min(cap, Math.max(remaining, 0));
      remaining -= prefill;
      return (
        `<div class="allocation-row" data-expense-id="${e.id}" data-cap="${cap}">` +
        `<span>${e.description} (${formatHuf(cap)} HUF)</span>` +
        '<div class="allocation-row-controls">' +
        `<button type="button" class="allocation-quick" data-ref="smaller" data-frac="1">${t('allocationSmallerFullLabel', lang)}</button>` +
        `<button type="button" class="allocation-quick" data-ref="smaller" data-frac="0.5">${t('allocationSmallerHalfLabel', lang)}</button>` +
        `<button type="button" class="allocation-quick" data-ref="bigger" data-frac="1">${t('allocationBiggerFullLabel', lang)}</button>` +
        `<button type="button" class="allocation-quick" data-ref="bigger" data-frac="0.5">${t('allocationBiggerHalfLabel', lang)}</button>` +
        '<span class="allocation-pct-group">' +
        `<input type="number" class="allocation-pct-input" min="0" max="100" step="1" placeholder="%">` +
        `<button type="button" class="allocation-quick-pct">${t('allocationPercentApplyLabel', lang)}</button>` +
        '</span>' +
        `<input type="number" class="allocation-amount-input" min="0" max="${cap}" step="1" value="${Math.round(prefill)}">` +
        '</div>' +
        '</div>'
      );
    })
    .join('');
  updateAllocationRemaining(incomeTotal);
  return true;
}

function updateAllocationRemaining(incomeTotal) {
  // .allocation-amount-input specifically - each row also has a separate
  // %-of-original input now (see the quick-fill section below), which must
  // not count toward the allocated total itself.
  const allocated = [...allocationRowsEl.querySelectorAll('.allocation-amount-input')].reduce((sum, input) => sum + (Number(input.value) || 0), 0);
  const remaining = incomeTotal - allocated;
  allocationRemainingEl.textContent = `${t('allocationRemainingLabel', lang)}: ${formatHuf(remaining)} HUF`;
  allocationRemainingEl.classList.toggle('over-allocated', remaining < 0);
  // The income doesn't have to be fully allocated - a leftover (remaining >
  // 0) just stays behind as a smaller, genuine income transaction (see the
  // Apply handler). What's still blocked: allocating more than the income
  // actually has (remaining < 0), allocating nothing at all, and any single
  // row exceeding the expense it's attached to (the input's own max already
  // stops that, but a prefilled value could still be edited past it by hand
  // in some browsers, so re-check here too).
  const overAnyRow = [...allocationRowsEl.querySelectorAll('.allocation-row')].some(
    (row) => Number(row.querySelector('.allocation-amount-input').value || 0) > Number(row.dataset.cap),
  );
  allocationApplyButton.disabled = remaining < 0 || allocated <= 0 || overAnyRow;
}

allocateButton.addEventListener('click', () => {
  if (!renderAllocationPanel()) return;
  deleteBar.hidden = true;
  allocationPanel.hidden = false;
});

allocationRowsEl.addEventListener('input', () => {
  const income = findTransactionById(allocationIncomeId);
  updateAllocationRemaining(Math.round(Math.abs(income.amount)));
});

// Four per-row shortcuts so the user doesn't have to reach for a
// calculator, covering every combination of which side (the smaller or the
// bigger of this expense vs. the income) and how much of it (the whole
// thing, or half) - e.g. "Nagyobb fele" is the user's own motivating case,
// a roommate's rent contribution being exactly half of the rent, the
// larger of the two. Always clamped to this row's own cap so a quick-fill
// can never leave the row itself over its max even before the
// overall-remaining check runs (relevant for "Nagyobb" when the income is
// bigger than this specific expense).
allocationRowsEl.addEventListener('click', (event) => {
  // A separate, more specific button: % of this row's TRUE original amount
  // - before any deduction ever made against it, even from an earlier,
  // separate action - not tied to the smaller/bigger-of-income-and-expense
  // reference the four quick buttons use, and deliberately not based on
  // whatever currently remains (cap) either: "30% of the rent" should mean
  // 30% of the whole rent, the same answer whether or not this expense has
  // already been partly deducted from before. Still clamped to cap, since
  // that's the most this specific action can take regardless of how the
  // percentage was computed.
  const pctButton = event.target.closest('.allocation-quick-pct');
  if (pctButton) {
    const row = pctButton.closest('.allocation-row');
    const cap = Number(row.dataset.cap);
    const original = originalAmountForExpense(row.dataset.expenseId);
    const pct = Number(row.querySelector('.allocation-pct-input').value) || 0;
    row.querySelector('.allocation-amount-input').value = Math.min(cap, Math.round((original * pct) / 100));
    row.querySelector('.allocation-amount-input').dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }

  const quickButton = event.target.closest('.allocation-quick');
  if (!quickButton) return;
  const row = quickButton.closest('.allocation-row');
  const cap = Number(row.dataset.cap);
  const input = row.querySelector('.allocation-amount-input');
  const income = findTransactionById(allocationIncomeId);
  const incomeTotal = Math.round(Math.abs(income.amount));
  const reference = quickButton.dataset.ref === 'bigger' ? Math.max(cap, incomeTotal) : Math.min(cap, incomeTotal);
  const fraction = Number(quickButton.dataset.frac);
  input.value = Math.min(cap, Math.round(reference * fraction));
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

allocationCancelButton.addEventListener('click', () => {
  allocationPanel.hidden = true;
  deleteBar.hidden = selectedForDeletion.size === 0;
});

allocationApplyButton.addEventListener('click', () => {
  if (allocationApplyButton.disabled) return;
  const income = findTransactionById(allocationIncomeId);
  const incomeTotal = Math.round(Math.abs(income.amount));

  // newLogEntries is the human-readable side of this action, for the
  // deduction-history panel - "which expense this came out of, and what
  // came out of it" - each one carries incomeId (not just the income's
  // description text) and its own id, both needed to undo that specific
  // entry later without touching any other deduction.
  const newLogEntries = [];
  let totalAllocated = 0;
  for (const row of allocationRowsEl.querySelectorAll('.allocation-row')) {
    const expenseId = row.dataset.expenseId;
    const amount = Number(row.querySelector('.allocation-amount-input').value) || 0;
    if (amount <= 0) continue;
    totalAllocated += amount;
    transactionAdjustments[expenseId] = (transactionAdjustments[expenseId] || 0) + amount;
    const expense = findTransactionById(expenseId);
    newLogEntries.push({
      id: crypto.randomUUID(),
      expenseId,
      expenseDescription: expense?.description,
      incomeId: allocationIncomeId,
      incomeDescription: income.description,
      amount,
    });
  }
  deductionHistory = [...deductionHistory, ...newLogEntries];
  savePreferences({ deductionHistory });

  if (totalAllocated >= incomeTotal) {
    // Fully used up (validation already blocks allocating more than the
    // income has) - remove it the same way plain delete does.
    deletedTransactionIds.add(allocationIncomeId);
    savePreferences({ deletedTransactionIds: [...deletedTransactionIds] });
  } else {
    // Only partially used - shrink the income by what got deducted from
    // it, rather than deleting it; it's still genuine income for the
    // remainder. A negative delta on a positive amount moves it toward
    // zero, the same "toward zero" rule applyTransactionOverrides already
    // uses for an expense's positive delta.
    transactionAdjustments[allocationIncomeId] = (transactionAdjustments[allocationIncomeId] || 0) - totalAllocated;
  }
  savePreferences({ transactionAdjustments });

  recomputeState();
  afterTransactionsChanged();
});

incomeSourcesEl.addEventListener('click', (event) => {
  // A click on a checkbox (or its label) inside an already-open detail list
  // bubbles up too - ignore it here, or ticking a box would immediately
  // re-toggle (close) the detail list it's in.
  if (event.target.closest('.row-detail')) return;
  const row = event.target.closest('li[data-key]');
  if (!row) return;
  toggleIncomeSourceDetail(row, row.dataset.key, monthSelect.value);
});

jointContributors.addEventListener('click', (event) => {
  if (event.target.closest('.row-detail')) return;
  const row = event.target.closest('li[data-key]');
  if (!row) return;
  toggleJointIncomeDetail(row, row.dataset.key, jointMonthSelect.value);
});

viewSwitch.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-view]');
  if (!button) return;
  const view = button.dataset.view;
  savePreferences({ lastView: view });
  viewSwitch.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
  document.getElementById('personal-view').hidden = view !== 'personal';
  document.getElementById('joint-view').hidden = view !== 'joint';
  // The month-tabs row above the view switch shows whichever month set
  // belongs to the now-active view - the two can differ, since the joint
  // account doesn't necessarily have data in every month the personal
  // view does.
  monthSelect.hidden = view !== 'personal';
  jointMonthSelect.hidden = view !== 'joint';

  // Carry the currently-selected month over to the view being switched to,
  // when that month also exists there - so picking a month doesn't get
  // silently forgotten just by flipping between Personal and Joint.
  if (view === 'joint') selectMonth(jointMonthSelect, monthSelect.value);
  else selectMonth(monthSelect, jointMonthSelect.value);

  if (view === 'joint' && state.items.length) renderJointView();
});

languageSelect.addEventListener('change', () => {
  lang = languageSelect.value;
  savePreferences({ lang });
  applyStaticTranslations();
  renderCategoryFilterOptions();
  if (state.items.length) {
    renderSummary();
    renderIncomeBySource();
    renderCategoryPie();
    renderMonthlyBar();
    // A previously-shown detail list's heading (category label, or a "no
    // description" fallback) is still in the old language - clear it
    // rather than leave it stale.
    categoryTransactions.innerHTML = '';
    jointCategoryTransactions.innerHTML = '';
    if (!document.getElementById('joint-view').hidden) renderJointView();
  }
});

applyStaticTranslations();
renderCategoryFilterOptions();
languageSelect.value = lang;
if (ownerNameInput && prefs.ownerName) ownerNameInput.value = prefs.ownerName;
ownerNameInput?.addEventListener('change', () => savePreferences({ ownerName: ownerNameInput.value }));
