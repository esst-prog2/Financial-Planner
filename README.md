# Elso_projekt

## 1. The demo
~Egy kb. 6 mondatos bemutatása, hogy mit fogok bemutatni a végén, konkrétumokkal.
Start at the end. In the last session you have three minutes and a projector. Write what happens in those three minutes, in the present tense, as if it already worked:

I open a terminal and run check-survey data/2026-wave1.csv. It prints eleven problems, grouped by severity. I open the CSV it wrote next to it, and the eleven rows are highlighted with a reason in the last column.

Or, if you are building an application someone sits down to and uses repeatedly:

I open the app in the browser and pick the 2026 wave. It shows one open-ended answer at a time, with the codebook on the right; I click a code, or type a new one, and it moves to the next answer. The header says 128 of 340 coded and 9 disagreements with the automatic suggestion. When I stop, Download gives me the coding table and a one-page agreement report.

Interfaces that fit this field: a browser for a codebook that spans several waves · a data-quality dashboard someone opens after every export · a screen for reviewing and fixing the records a validator flagged · anything that replaces a spreadsheet somebody is currently maintaining by hand.

Or, if what you are building is a service, the demo is a request and its answer:

I start the server and run curl localhost:8000/score -d @sample.json. It returns a JSON object with a score of 0.82 and the three fields that drove it, in about 200 ms. I send a malformed record and get a 400 naming the field that is wrong.

Three to six sentences. Concrete nouns: real filenames, real screens, a real number. Not "I demonstrate the validation functionality" — that sentence can be written about a project that does not exist.

If you cannot write this paragraph, that is the finding. It means the idea is still a topic, not a project. Write the version you can, and say what you could not fill in.

## 2. The shape
Three lines. What goes in, what comes out, and what happens between:

in     a CSV export from the survey tool, one row per respondent
out    a report of problems + a copy of the file with flagged rows
in between   check each row against rules from a codebook; classify open
             answers; count and group what failed
For an application, the middle line describes what the person does, not what the code does — the interface is the project, not a wrapper on one:

in     a CSV of open-ended answers, one row per response
out    a corrected coding table + a short agreement report
on screen   one answer at a time with the suggested code; the coder accepts
            or overrides it; corrections and progress counted at the top
For a service, in is a request and out is a response: name the endpoint, and show one real example of each — including one that fails.

If you cannot name the middle, you have a wish, not a design — and that is worth knowing in week two rather than week ten.

## 3. The size
Two short lists: what the first useful version does, and what it explicitly does not do this term.

The second list is the one that matters. It is where you write down the features you can already imagine and are choosing not to build yet. A brief with an empty "not this term" list has not been thought about.

A useful test: could someone use the first version, as described, and get something out of it? If it is only useful once three more things are added, cut until what is left is useful alone.

## 4. How we would know it works
Name three behaviours a test could check. Not the tests themselves — just three things that must be true:

Given a file with a missing required column, it exits with an error naming the column. · Given a clean file, it reports zero problems. · Given a row with an out-of-range age, that row appears in the report.

If all three are "it produces the right output", the project is not yet observable enough to test. Look for the edges: what is missing, what is malformed, what is out of range.

## 5. What could stop this
Data you cannot legally use. An API you have no access to. A technique you have never tried. A file format you have not seen yet. Name them now; naming a risk in week two is planning, in week ten it is an excuse.

Also say where your data comes from and whether it can be shown in class. If it is personal or sensitive, say how the project runs without it — a small made-up sample file is a perfectly good answer.
