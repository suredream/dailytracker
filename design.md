# claude.md — Daily State Tracker (Browser Extension) Coding Assistant Brief

## 0) Product Summary
Build a **minimal, local-first browser extension** for daily self-tracking.

On click (extension popup), it:
1) Shows **today’s date** (local timezone).
2) Displays a fixed list of **10 dimensions**, each rated **1–5 stars**.
3) Adds a free-text field **memo**.
4) Allows viewing/editing **today’s record** and auto-saves locally.
5) Exports all records as a **2D CSV** (date × columns) suitable for Excel/Pandas.

**No accounts, no backend, no AI analysis.** This is a pure data capture tool.

---

## 1) Core Requirements (MVP)
### 1.1 Fixed dimensions (1–5 integer)
Columns are stable and must not change order or naming:

- `pre_sleep_arousal`
- `sleep_recovery`
- `wake_up_state`
- `exercise_quality`
- `deep_work`
- `task_backlog_pressure`
- `stress_level`
- `social_interaction`
- `presence`
- `deep_experience`
- `memo` (string)

### 1.2 Today-first UX
- Clicking extension icon opens a popup.
- Popup header shows: `Today: YYYY-MM-DD` (local day).
- For each dimension: show 5-star selector; chosen rating is 1..5.
- A `memo` multiline text area.
- **Auto-save** on any change (star change, memo input debounced).

### 1.3 Local persistence
- Persist data **locally** using extension storage (prefer `chrome.storage.local`).
- Data is keyed by date string `YYYY-MM-DD`.
- Opening popup must load existing data for today (if present) and allow edits.

### 1.4 CSV Export
- Provide a button: **Export CSV**
- Export includes header row:
  `date,pre_sleep_arousal,sleep_recovery,wake_up_state,exercise_quality,deep_work,task_backlog_pressure,stress_level,social_interaction,presence,deep_experience,memo`
- Each row is a date with values; missing values are empty cells.
- Memo must be CSV-escaped (quotes, commas, newlines).
- Export should download a file like: `daily_state_tracker_export.csv`

---

## 2) Non-Goals (Explicitly out of scope)
- No login / cloud sync.
- No reminders / notifications.
- No streaks, gamification, or coaching.
- No analytics, charts, or trend dashboards (can be done externally via CSV).
- No “dimension management” UI: dimensions are fixed.

---

## 3) Data Model
### 3.1 In-memory record type
A record for a day:

```ts
type DailyRecord = {
  date: string; // YYYY-MM-DD
  pre_sleep_arousal?: number;         // 1..5
  sleep_recovery?: number;            // 1..5
  wake_up_state?: number;             // 1..5
  exercise_quality?: number;          // 1..5
  deep_work?: number;                 // 1..5
  task_backlog_pressure?: number;     // 1..5
  stress_level?: number;              // 1..5
  social_interaction?: number;        // 1..5
  presence?: number;                 // 1..5
  deep_experience?: number;          // 1..5
  memo?: string;                     // free text
};
````

### 3.2 Storage shape

Store as a map keyed by date:

```ts
type StorageShape = {
  records: Record<string, Omit<DailyRecord, "date">>;
  schema_version: 1;
};
```

* Keep `schema_version` for future evolution.
* Date key is local date string, not UTC.

---

## 4) UI/UX Requirements

### 4.1 Star control behavior

* Clicking star N sets value = N.
* Clicking the currently selected star again may either:

  * keep as N (simplest), or
  * clear value (optional; if implemented, be consistent).
* Keyboard support is optional in MVP, but keep component structure ready.

### 4.2 Save behavior

* On star change: save immediately.
* On memo input: debounce saves (e.g., 300–500ms).
* Display a subtle “Saved” indicator (optional); do not add modal dialogs.

### 4.3 Error handling

* If storage fails, show a minimal inline error text.
* Never crash the popup.

---

## 5) Technical Constraints & Recommendations

### 5.1 Extension platform

Target **Chrome Manifest V3** (and ideally compatible with Chromium-based browsers).

Recommended structure:

* `manifest.json`
* `popup.html`
* `popup.ts` / `popup.js`
* `styles.css`
* `storage.ts` (get/set helpers)
* `csv.ts` (export helpers)

No background service worker is strictly required for MVP (popup can do everything).

### 5.2 Date handling

* Use local date. Implement `getLocalYYYYMMDD()` reliably.
* Do not rely on locale formatting for storage keys.

### 5.3 CSV escaping rules

* If a field contains `"` or `,` or newline, wrap in quotes and double internal quotes.
* Newlines should be preserved inside quoted memo cells.

---

## 6) Acceptance Criteria (Definition of Done)

1. Open popup → shows today’s date.
2. Changing any star persists; reopening popup shows saved values.
3. Editing memo persists; reopening shows memo text.
4. Export CSV produces correct header + rows for all stored dates.
5. CSV opens cleanly in Excel/Google Sheets and is parsable by Pandas.
6. No network calls (verify via devtools).
7. Works without any setup beyond installing the extension.

---

## 7) Minimal Test Checklist

* [ ] Fresh install: popup loads with empty values, no errors.
* [ ] Set some stars + memo → close popup → reopen → values intact.
* [ ] Create records across multiple days (simulate by temporarily overriding date function) → export contains multiple rows.
* [ ] Memo contains commas/quotes/newlines → export remains valid CSV.
* [ ] Missing ratings produce empty CSV cells (not `null`/`undefined` strings).

---

## 8) Style & Implementation Guidelines (for Claude)

* Keep code small, modular, and readable.
* Prefer typed code (TypeScript) if feasible; otherwise well-structured JS.
* Do not add frameworks unless it materially reduces complexity.
* Avoid overengineering (no state management libraries).
* Ensure deterministic column ordering in CSV export.

---

## 9) Column Order (Must be stable)

**Always export and render dimensions in this exact order:**

1. pre_sleep_arousal
2. sleep_recovery
3. wake_up_state
4. exercise_quality
5. deep_work
6. task_backlog_pressure
7. stress_level
8. social_interaction
9. presence
10. deep_experience
11. memo
