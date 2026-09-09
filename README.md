# Elso_projekt

## 1. The demo

I load the CSV files containing my expenses from OTP and Revolut. Several charts appear, including a pie chart that breaks down my spending by category and shows what percentage of my total spending went to each one. When I click on a category, it lists all the individual expenses within that category. At the top, a summary reads: "This month: 180 000 HUF spent, 250 000 HUF income, 60 000 HUF remaining." Below, a bar chart shows every month side by side, so I can see my total spending trend across the whole year at a glance. I select "Groceries" from a category dropdown, and the same chart updates to show only my grocery spending, month by month.


## 2. The shape
In: an OTP CSV export + a Revolut CSV export, one row per transaction.
Out: an overview dashboard with spending broken down by category, charts, and a monthly trend.
In between: I upload the files; I review the auto-categorized expenses; I click a category to see the details; I pick which months/category to compare on the chart.

## 3. The size

What the first useful version does:

- Parses both banks' CSV formats
- Sorts transactions into basic categories (5–8 categories, keyword-based)
- Filters out duplicate transfers between the two accounts
- Shows a monthly summary (income/spending/balance) and a category pie chart
- Shows a month-by-month comparison view (bar chart across all available months), with the option to filter down to a single category
  
What it explicitly does NOT do this term:

- No live/automatic bank syncing
- No AI-based "smart" categorization — just keyword rules
- No multi-user or sharing features
- No budgeting or forecasting (backward-looking analysis only)
- No mobile app, browser only

## 4. How we would know it works

- Given a CSV row with a merchant name containing "Lidl" or "Spar," it gets categorized as "Groceries."
- Given the same transaction amount and date appearing in both the OTP and Revolut files (an inter-account transfer), only one of them counts toward the total.
- Given a CSV file missing an expected column (e.g., no date field), the app shows an error instead of crashing silently.


## 5. What could stop this

- The bank export formats might not stay consistent: OTP or Revolut could change their column names or file structure at some point, and if that happens mid-project, it can cause trouble.
- A lot of the transaction descriptions probably won't be readable merchant names, more likely some codes. That means my keyword-based categorization won't catch everything, and some transactions will just end up uncategorized or miscategorized.
- My Revolut account has multiple currencies, so I'll need to figure out how to convert everything into one currency for the totals to make sense. I haven't decided yet how I'll handle exchange rates for that.
- I haven't built a CSV parser or a dashboard with charts before, so this is genuinely new territory for me.
- Since I'll be working with my actual spending data, I'll need a fake sample CSV with made-up transactions for anything I show to other people.
