Next-Gen Analyst - HR Employee Analytics Dashboard
================================

Project files:
- Next-Gen-Analyst.html Generated single-file app; open directly in Chrome or Edge
- build_standalone.py Regenerates the single-file app from the source files
- index.html       Main dashboard page and structure
- css/styles.css   Dashboard and login page styling
- js/app.js        Login, password reset, trial/real mode, employee data and charts
- js/config.js     Optional Supabase project URL and public anon key
- database/schema.sql Supabase organization, dataset, and row-level security schema
- server.py        Local web server
- README.txt       This guide

How to run:
1. Extract the ZIP file.
2. Open `Next-Gen-Analyst.html` in Chrome or Edge. Internet is needed for the chart/CSV libraries and font.
3. Review the overview and choose Try Trial, or sign in to create a local account.
4. In the dashboard, choose Link CSV file to load an existing spreadsheet or create a new CSV that auto-saves changes.
5. To rebuild the standalone file after editing source files, run `python build_standalone.py` from the project folder.

Optional local server:
1. Install Python 3.10 or newer.
2. In PowerShell, run `python server.py` from the project folder.
3. Open http://127.0.0.1:8000 in Chrome or Edge. Use this mode for Supabase Auth redirect testing.

Optional Supabase database setup:
1. Create a Supabase project.
2. Run `database/schema.sql` once in the Supabase SQL Editor.
3. Copy the project URL and public anon/publishable key into `js/config.js`.
4. In Supabase Auth settings, allow the local URL `http://127.0.0.1:8000/**` as a redirect URL.
5. Restart `python server.py`, then use Create an account. The first account creates its organization workspace.

Notes:
- Internet is required for the PapaParse and Chart.js CDN libraries used by the dashboard.
- The product page includes feature details, trial/full-access pricing information, and FAQs. Without Supabase config, login and Real Mode data stay in localStorage. With Supabase config, users authenticate by email and the organization dataset uses database row-level security.
- Trial mode uses sample records and does not save changes. The full-access workspace saves changes in the current browser.
- CSV files are Excel-compatible. Link a CSV from the dashboard to load it and auto-save changes; reconnect the file after reopening the page. If file access is unavailable, use Download CSV and Upload HR CSV.
- Razorpay checkout is paused. Paid access is quote-based through WhatsApp; this page does not open checkout or charge money. The test server code remains parked for later.
- The dashboard adapts to phone, tablet, and laptop widths. Tables scroll inside their panels on narrow screens.
- Without Supabase config, login is local-only and not production-grade security. Do not use local mode to protect sensitive employee information.
- Supabase configuration requires the public anon/publishable key only. Never put a service-role key in `js/config.js` or browser code.
- Use Download CSV to keep a backup of employee records.
