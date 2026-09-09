# Elso_projekt

## 1. The demo

I load the CSV files containing my expenses from OTP and Revolut. Several charts appear, including a pie chart that breaks down my spending by category and shows what percentage of my total spending went to each one. When I click on a category, it lists all the individual expenses within that category. At the top, a summary reads: "This month: 180 000 HUF spent, 250 000 HUF income, 60 000 HUF remaining."  


## 2. The shape
In: an OTP CSV export + a Revolut CSV export (monthly or custom date range), one row per transaction
Out: an overview dashboard with spending broken down by category, charts, and a monthly trend
In between: read both files → reconcile the two different formats into one → categorize transactions (keyword-based rules) → filter out duplicate transfers between the two accounts → summarize and display

Important point from the brief: since this is an application you'll use repeatedly (uploading a new CSV every month), the middle line should describe what you do, not what the code does: upload the file, review the categorization, override a miscategorized transaction here and there, check the summary.

## 3. The size

What the first useful version does (adjust to fit your plan):

Parses both banks' CSV formats
Sorts transactions into basic categories (5–8 categories, keyword-based)
Filters out duplicate transfers between the two accounts
Shows a monthly summary (income/spending/balance) and a category pie chart

What it explicitly does NOT do this term:

No live/automatic bank syncing (stays manual CSV upload)
No AI-based "smart" categorization — just keyword rules
No multi-user or sharing features
No budgeting or forecasting (backward-looking analysis only)
No mobile app, browser only

## 4. How we would know it works

Name three concrete behaviors a test could check — not vague statements like "it categorizes correctly," but specific edge cases:

Given a CSV row with a merchant name containing "Lidl" or "Spar," it gets categorized as "Groceries."
Given the same transaction amount and date appearing in both the OTP and Revolut files (an inter-account transfer), only one of them counts toward the total.
Given a CSV file missing an expected column (e.g., no date field), the app shows an error naming the missing column instead of crashing silently.

A useful check: if you can only describe outputs as "it produces the right report," the project isn't observable enough yet. Push on the edges — what's malformed, missing, duplicated, or out of range.

Try filling in your own three — pick edge cases from your actual bank export data (e.g., a transaction in a foreign currency, a refund, a transaction with no clear merchant name).

## 5. What could stop this

Things worth naming honestly now, in week two rather than discovering them in week six:

Inconsistent bank export formats: OTP and Revolut may occasionally change their CSV column names or structure without warning; your parser could break on a new export.
Ambiguous merchant names: some transaction descriptions are cryptic bank codes rather than readable merchant names, making keyword-based categorization unreliable for a chunk of transactions.
Multi-currency transactions: if your Revolut account holds multiple currencies, you'll need to decide how to normalize everything into one currency for the summary.
A technique you haven't tried yet: if this is your first time writing a CSV parser or building any kind of dashboard/chart UI in Python, budget real learning time here — this is the actual technical risk, not a minor detail.
Data sensitivity: since this project uses your real financial data, name how it would run in a demo/classroom setting — e.g., a small fake sample CSV with made-up transactions, so you're not showing your actual spending to anyone.
