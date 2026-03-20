<<:hail: 0.9

<<:context: {
Our database migration failed in production last night.
The users table got a new column `preferences_json` but
the backfill script timed out after 2 hours. 40% of rows
have NULL in that column. The app doesn't crash but the
preferences page shows "something went wrong" for those users.
No data was lost. The old preferences are still in the
`user_settings` table.
}

Write three messages about this incident.

<<:shape: {
message_name: string
content: the message text
}

First: a Slack message for the engineering team.

<<:audience: engineers who know the codebase
<<:tone: honest, brief
<<:avoid: sugar-coating it

---

**#engineering**

Preferences migration partially failed last night. The
backfill script for `preferences_json` timed out at the
2 hour mark. About 40% of user rows have NULLs in that
column. App-side, those users see "something went wrong"
on their preferences page. No data loss, the old values
are still in `user_settings`.

Plan: we're going to rerun the backfill in batches of 10k
during off-peak tonight. ETA to full backfill is ~4 hours.
The preferences page needs a fallback to read from
`user_settings` when `preferences_json` is NULL. PR going
up this morning.

If you're working on anything that touches user preferences
today, ping me first.

>>:assumed: there's a #engineering Slack channel
>>:suggestion: add a temporary feature flag to fall back to user_settings rather than a code-level NULL check

---

Now the same incident for the customer support team.

<<:audience: support agents, non-technical
<<:tone: calm, practical
<<:format: {
short paragraph explaining what happened,
then a bullet list of what to tell affected customers
}

---

Some customers are seeing a "something went wrong" error on
their preferences page. This started last night and affects
roughly 40% of accounts. Their data is safe and their
preferences haven't been lost. The engineering team is
fixing it tonight and everything should be back to normal
by tomorrow morning.

If a customer contacts you about this:

- Acknowledge the issue. It's a known bug, not something on their end.
- Their preferences and settings are not lost.
- The fix is scheduled for tonight. Preferences will be restored by tomorrow morning.
- If they need to change a preference urgently, they can contact us and we'll update it manually.

>>:uncertain: do support agents have the ability to manually update preferences? if not, cut that last bullet

---

<<:audience: the CEO, who is not technical but wants to know what happened
<<:tone: confident, no jargon
<<:length: 3 sentences max
<<:format: prose

Last one. A summary for the CEO.

---

A software update last night didn't fully complete, which is
causing some customers to see an error on their preferences
page. No customer data was lost and the fix is going out tonight.
About 40% of accounts are affected and everything will be
back to normal by tomorrow morning.

>>:assumed: the CEO gets these via email or a direct message, not Slack
>>:suggestion: {
If the CEO is likely to get customer complaints forwarded
to them, add one line: "Support has been briefed and is
handling any incoming tickets."
}
