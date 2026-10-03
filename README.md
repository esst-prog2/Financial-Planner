# Project brief

## 1. The demo

I load the Excel files containing my expenses from OTP and Revolut (a personal EUR account, a personal HUF account, and a joint HUF account I share with someone else). Several charts appear, including a pie chart that breaks down my spending by category and shows, right in the legend, what percentage of my total spending went to each one - always in the same color per category, largest slice first. When I click on a category, it lists all the individual expenses within that category. At the top, a summary reads: "This month: 180 000 HUF spent, 250 000 HUF income, 60 000 HUF remaining," and right below it a card shows my total income for the month broken down by source, with repeated income from the same person or employer combined into one line. Below that, a bar chart shows every month side by side, so I can see my total spending trend across the whole year at a glance. I select "Groceries" from a category dropdown, and the same chart updates to show only my grocery spending, month by month. A separate view shows the joint account on its own: the full (not halved) spending by category with its own pie and monthly-trend chart, and how much each of us has transferred into it. A language switch lets me flip the whole UI between Hungarian and English.

## 2. The shape
In: an OTP Excel export + a Revolut Excel export (three sheets: personal EUR, personal HUF, and a joint HUF account), one row per transaction.
Out: a personal overview dashboard (spending broken down by category, charts, monthly trend) plus a separate joint-account view.
In between: I upload the file; I review the auto-categorized expenses; I click a category to see the details; I pick which months/category to compare on the chart; I switch to the joint-account view to see the full picture there.

## 3. The size

What the first useful version does:

- Parses both banks' Excel formats (including OTP's fixed report-header block)
- Sorts transactions into 12 spending categories (Élelmiszer, Eating out, Ruházat/bevásárlás, Egészség/szépség, Szolgáltatások, Orvos, Sport, Közlekedés, Számlák/előfizetés, Megtakarítás, Szórakozás, Utalás) plus 3 non-spending buckets (Bevétel, Készpénzfelvét, Egyéb), all keyword-based and accent-insensitive (so "Muller" still matches "Müller")
- A small list of known counterparty names always maps to a fixed category (e.g. a specific person I pay by transfer is always "Szolgáltatások"), overriding keyword matching for the cases keywords can't tell apart
- Excludes transfers between my own accounts (OTP↔Revolut top-ups, Revolut-to-own-name, and money returning from the OTP piggy-bank sub-account) from both spending and income, instead of double-counting them
- A refund - a positive amount matching a merchant/service category's keywords - reduces that category instead of counting as generic income; an incoming person-to-person transfer still always counts as income
- Converts non-HUF Revolut transactions to HUF using a bundled offline historical exchange-rate table
- Counts only 50% of joint-account expenses toward my personal totals, with a dedicated joint-account view showing the full amounts, its own monthly-trend chart, and who contributed how much
- Shows a monthly summary (income/spending/balance, correctly netting any refunds rather than double-counting them) and a category pie chart with each category's percentage of the total, sorted largest-first with a fixed color per category
- Shows my total income for the month broken down by source, combining repeated income from the same person/employer
- Shows a month-by-month comparison view (bar chart across all available months), with the option to filter down to a single category
- Lets me switch the whole UI between Hungarian and English

What it explicitly does NOT do this term:

- No live/automatic bank syncing
- No AI-based "smart" categorization — just keyword rules. Measured (spike, 2026-10-02): 95.5% accurate on merchants already used to tune the keywords, but only 62.5–64.8% on merchants never seen before - below the ~70% bar for "keyword rules scale." Manual recategorization is therefore no longer a later-level nice-to-have; it needs to become part of this term's MVP (see PLANNING_LOG.md)
- No accounts, login, or multi-device sharing — the joint-account view is read-only insight into a shared account, not a multi-user app
- No budgeting or forecasting (backward-looking analysis only)
- No mobile app, browser only, and no backend — everything runs client-side

## 4. How we would know it works

- Given a row with a merchant name containing "Lidl" or "Spar," it gets categorized as "Élelmiszer."
- Given the same transaction amount and date appearing in both the OTP and Revolut files (an inter-account transfer), neither counts toward spending or income.
- Given a Revolut transaction in a foreign currency, its HUF amount is computed from the bundled historical rate table for that date, not a live lookup.
- Given a joint-account expense, only half of it appears in my personal totals, while the dedicated joint-account view shows the full amount and the contributor breakdown.
- Given a file missing an expected column (e.g., no date field), the app shows an error instead of crashing silently.
- Given a refund from a grocery store (a positive amount matching Élelmiszer's keywords), it reduces that month's Élelmiszer total instead of showing up as income.
- Given two payments from the same employer or person in one month, my income-by-source card shows them combined as a single line, not two.

## 5. What could stop this

- The bank export formats might not stay consistent: OTP or Revolut could change their column names or file structure at some point, and if that happens mid-project, it can cause trouble.
- A lot of the transaction descriptions probably won't be readable merchant names, more likely some codes. That means my keyword-based categorization won't catch everything, and some transactions will just end up in "Egyéb." Partly resolved: comparing the categorizer against ~130 real, manually-categorized transactions found and fixed a systematic gap - real exports often strip Hungarian accents (e.g. "Muller" instead of "Müller"), which the keyword matching now handles - plus several real merchant names that had no matching keyword at all.
- My Revolut account has multiple currencies. Resolved: everything converts to HUF using a bundled offline historical exchange-rate table rather than a live lookup, so the dashboard still works without network access.
- I hadn't built an Excel parser or a dashboard with charts before, so this was genuinely new territory for me.
- Since I'll be working with my actual spending data, I generate a synthetic sample workbook (`npm run generate-sample`, written to `sample-data/`) with made-up transactions for anything I show to other people — it's built from scratch, not derived from my real file.
