import { buildLineItems, monthOf } from './pipeline.js';
import { parseRevolutSheet } from './parseRevolut.js';
import { summarizeContributors } from './jointAccount.js';
import { SPENDING_CATEGORIES, NON_SPENDING_CATEGORIES } from './categorize.js';
import { categoryTotals, pieEligibleRows, monthlySummary, monthlyTrend, incomeBySource } from './aggregate.js';
import { categoryColor } from './categoryColors.js';
import { DEFAULT_LANGUAGE, t, categoryLabel, summaryText as formatSummaryText, missingSheetMessage, genericErrorMessage } from './i18n.js';

const SHEET_NAMES = ['otp', 'rev-eur', 'rev-hu', 'rev-joint'];
const ALL_CATEGORIES = [...SPENDING_CATEGORIES, ...NON_SPENDING_CATEGORIES.filter((c) => c !== 'Bevétel')];

const fileInput = document.getElementById('file-input');
const errorMessage = document.getElementById('error-message');
const app = document.getElementById('app');
const viewSwitch = document.getElementById('view-switch');
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

let state = { items: [], jointRaw: [] };
let lang = DEFAULT_LANGUAGE;
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
    const sheet = workbook.Sheets[name];
    if (!sheet) throw new Error(missingSheetMessage(name, lang));
    sheets[name] = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
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

function populateMonthOptions(selectEl, items) {
  const months = [...new Set(items.map((i) => monthOf(i.date)).filter(Boolean))].sort();
  selectEl.innerHTML = months.map((m) => `<option value="${m}">${m}</option>`).join('');
  if (months.length) selectEl.value = months[months.length - 1];
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
  summaryTextEl.textContent = formatSummaryText(lang, { spending, income, balance });
}

function renderIncomeBySource() {
  const month = monthSelect.value;
  const rows = incomeBySource(state.items, month);
  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);
  incomeTotalEl.textContent = `${total.toLocaleString('hu-HU')} HUF`;
  incomeSourcesEl.innerHTML = rows
    .map(([source, amount]) => `<li>${source || t('noDescription', lang)}: ${amount.toLocaleString('hu-HU')} HUF</li>`)
    .join('');
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
  categoryTransactions.innerHTML = `<h3>${categoryLabel(category, lang)}</h3><ul>${rows
    .map((r) => `<li>${r.date} - ${r.description || t('noDescription', lang)} - ${Math.abs(r.personalAmountHuf).toLocaleString('hu-HU')} HUF</li>`)
    .join('')}</ul>`;
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
  jointCategoryTransactions.innerHTML = `<h3>${categoryLabel(category, lang)}</h3><ul>${rows
    .map((r) => `<li>${r.date} - ${r.description || t('noDescription', lang)} - ${Math.abs(r.amountHuf).toLocaleString('hu-HU')} HUF</li>`)
    .join('')}</ul>`;
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

function renderJointView() {
  renderJointCategoryPie();
  renderJointMonthlyBar();

  const contributorTotals = summarizeContributors(state.jointRaw);
  jointContributors.innerHTML = `<ul>${[...contributorTotals.entries()]
    .map(([name, total]) => `<li>${name}: ${total.toLocaleString('hu-HU')} HUF</li>`)
    .join('')}</ul>`;
}

function renderAll() {
  renderSummary();
  renderIncomeBySource();
  renderCategoryPie();
  renderMonthlyBar();
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

    const items = buildLineItems(sheets, { ownerName: document.getElementById('owner-name')?.value });
    const jointRaw = parseRevolutSheet(sheets['rev-joint'], 'revolut-joint');

    state = { items, jointRaw };

    renderMonthOptions(items);
    renderJointMonthOptions(items);
    renderCategoryFilterOptions();
    app.hidden = false;
    viewSwitch.hidden = false;
    renderAll();
  } catch (err) {
    showError(err.message || genericErrorMessage(lang));
  }
});

monthSelect.addEventListener('change', () => {
  renderSummary();
  renderIncomeBySource();
  renderCategoryPie();
});
categoryFilter.addEventListener('change', renderMonthlyBar);
jointCategoryFilter.addEventListener('change', renderJointMonthlyBar);
jointMonthSelect.addEventListener('change', renderJointCategoryPie);

viewSwitch.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-view]');
  if (!button) return;
  const view = button.dataset.view;
  viewSwitch.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
  document.getElementById('personal-view').hidden = view !== 'personal';
  document.getElementById('joint-view').hidden = view !== 'joint';

  if (view === 'joint' && state.items.length) renderJointView();
});

languageSelect.addEventListener('change', () => {
  lang = languageSelect.value;
  applyStaticTranslations();
  renderCategoryFilterOptions();
  if (state.items.length) {
    renderSummary();
    renderIncomeBySource();
    renderCategoryPie();
    renderMonthlyBar();
    if (!document.getElementById('joint-view').hidden) renderJointView();
  }
});

applyStaticTranslations();
renderCategoryFilterOptions();
languageSelect.value = lang;
