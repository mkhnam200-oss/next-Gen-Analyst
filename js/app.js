const sample = [
            {Age: 41, Attrition: "Yes", Department: "Sales", MonthlyIncome: 5993, OverTime: "Yes", JobSatisfaction: 2, YearsAtCompany: 6, Gender: "Female", JobRole: "Sales Executive"},
            {Age: 49, Attrition: "No", Department: "Research & Development", MonthlyIncome: 5130, OverTime: "No", JobSatisfaction: 3, YearsAtCompany: 10, Gender: "Male", JobRole: "Research Scientist"},
            {Age: 37, Attrition: "Yes", Department: "Research & Development", MonthlyIncome: 2090, OverTime: "Yes", JobSatisfaction: 3, YearsAtCompany: 0, Gender: "Male", JobRole: "Laboratory Technician"},
            {Age: 33, Attrition: "No", Department: "Research & Development", MonthlyIncome: 2909, OverTime: "Yes", JobSatisfaction: 3, YearsAtCompany: 8, Gender: "Female", JobRole: "Research Scientist"},
            {Age: 27, Attrition: "No", Department: "Research & Development", MonthlyIncome: 3468, OverTime: "No", JobSatisfaction: 2, YearsAtCompany: 2, Gender: "Male", JobRole: "Laboratory Technician"},
            {Age: 32, Attrition: "No", Department: "Research & Development", MonthlyIncome: 3068, OverTime: "No", JobSatisfaction: 4, YearsAtCompany: 7, Gender: "Male", JobRole: "Laboratory Technician"},
            {Age: 59, Attrition: "No", Department: "Research & Development", MonthlyIncome: 2670, OverTime: "Yes", JobSatisfaction: 1, YearsAtCompany: 1, Gender: "Female", JobRole: "Laboratory Technician"},
            {Age: 30, Attrition: "No", Department: "Research & Development", MonthlyIncome: 2693, OverTime: "No", JobSatisfaction: 3, YearsAtCompany: 1, Gender: "Male", JobRole: "Laboratory Technician"},
            {Age: 38, Attrition: "No", Department: "Research & Development", MonthlyIncome: 9526, OverTime: "No", JobSatisfaction: 3, YearsAtCompany: 8, Gender: "Male", JobRole: "Manufacturing Director"},
            {Age: 36, Attrition: "No", Department: "Research & Development", MonthlyIncome: 5237, OverTime: "No", JobSatisfaction: 3, YearsAtCompany: 7, Gender: "Male", JobRole: "Healthcare Representative"},
            {Age: 35, Attrition: "Yes", Department: "Sales", MonthlyIncome: 3407, OverTime: "Yes", JobSatisfaction: 1, YearsAtCompany: 2, Gender: "Female", JobRole: "Sales Representative"},
            {Age: 29, Attrition: "No", Department: "Sales", MonthlyIncome: 4193, OverTime: "No", JobSatisfaction: 4, YearsAtCompany: 4, Gender: "Male", JobRole: "Sales Executive"},
            {Age: 45, Attrition: "No", Department: "Human Resources", MonthlyIncome: 5000, OverTime: "No", JobSatisfaction: 3, YearsAtCompany: 12, Gender: "Female", JobRole: "Human Resources"},
            {Age: 26, Attrition: "Yes", Department: "Human Resources", MonthlyIncome: 2300, OverTime: "Yes", JobSatisfaction: 2, YearsAtCompany: 1, Gender: "Male", JobRole: "Human Resources"},
            {Age: 42, Attrition: "No", Department: "Sales", MonthlyIncome: 6800, OverTime: "Yes", JobSatisfaction: 4, YearsAtCompany: 9, Gender: "Female", JobRole: "Sales Executive"},
            {Age: 31, Attrition: "No", Department: "Research & Development", MonthlyIncome: 4200, OverTime: "No", JobSatisfaction: 3, YearsAtCompany: 5, Gender: "Female", JobRole: "Research Scientist"},
            {Age: 24, Attrition: "Yes", Department: "Sales", MonthlyIncome: 1900, OverTime: "Yes", JobSatisfaction: 2, YearsAtCompany: 1, Gender: "Male", JobRole: "Sales Representative"},
            {Age: 50, Attrition: "No", Department: "Research & Development", MonthlyIncome: 11000, OverTime: "No", JobSatisfaction: 4, YearsAtCompany: 20, Gender: "Male", JobRole: "Research Director"},
            {Age: 39, Attrition: "No", Department: "Human Resources", MonthlyIncome: 4800, OverTime: "No", JobSatisfaction: 3, YearsAtCompany: 8, Gender: "Female", JobRole: "Human Resources"},
            {Age: 28, Attrition: "Yes", Department: "Sales", MonthlyIncome: 2600, OverTime: "Yes", JobSatisfaction: 1, YearsAtCompany: 2, Gender: "Male", JobRole: "Sales Representative"}
        ];
        const STORAGE_KEY = "hrEmployeeAnalyticsData_real_v3";
        const ACCOUNT_KEY = "hrEmployeeAnalyticsAccount_v1";
        let data = sample.map(x => ({...x})); let charts = {};
        let currentMode = null;
        let linkedFileHandle = null;
        let fileWriteQueue = Promise.resolve();
        let cloudSaveQueue = Promise.resolve();
        let supabaseUser = null;
        let activeOrganizationId = null;
        let passwordRecoveryMode = false;
        const supabaseConfig = window.PEOPLESCOPE_SUPABASE_CONFIG || {};
        const supabaseClient = window.supabase?.createClient && supabaseConfig.url && supabaseConfig.anonKey
            ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey, {auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true}})
            : null;
        const $ = id => document.getElementById(id);
        function updateAuthExperience() {
            const cloudAuth = Boolean(supabaseClient);
            document.querySelectorAll(".local-auth-field").forEach(field => field.hidden = cloudAuth);
            document.querySelectorAll(".supabase-auth-field").forEach(field => field.hidden = !cloudAuth);
            $("supabasePasswordUpdateForm").hidden = !cloudAuth || !passwordRecoveryMode;
            $("supabaseResetRequestForm").hidden = !cloudAuth || passwordRecoveryMode;
            $("setupUsername").required = !cloudAuth;
            $("setupRecovery").required = !cloudAuth;
            $("supabaseFullName").required = cloudAuth;
            $("supabaseOrganizationName").required = cloudAuth;
            $("supabaseSignupEmail").required = cloudAuth;
            $("supabaseLoginEmail").required = cloudAuth;
            $("supabaseResetEmail").required = cloudAuth;
            $("setupHelp").textContent = cloudAuth
                ? "Create your account with work email. Your organization gets an isolated employee workspace."
                : "First-time setup. Create a username, password and recovery code.";
            $("forgotHelp").textContent = cloudAuth
                ? "We will email you a secure password reset link."
                : "Enter your username and recovery code set during account creation.";
            $("authSecurityNote").textContent = cloudAuth
                ? "Employee records are scoped by organization using Supabase Auth and database row-level security."
                : "Note: This is a local HTML dashboard. Login and data are stored in this browser only; this is not server-grade security and does not sync between devices.";
        }
        async function ensureOrganization(user) {
            const {data: membership, error: membershipError} = await supabaseClient
                .from("organization_members")
                .select("organization_id")
                .eq("user_id", user.id)
                .limit(1)
                .maybeSingle();
            if (membershipError) throw membershipError;
            if (membership?.organization_id) return membership.organization_id;

            const organizationName = String(user.user_metadata?.organization_name || user.email?.split("@")[0] || "My organization").trim();
            const {data: organization, error: organizationError} = await supabaseClient
                .from("organizations")
                .insert({name: organizationName, created_by: user.id})
                .select("id")
                .single();
            if (organizationError) throw organizationError;

            const {error: ownerError} = await supabaseClient.from("organization_members").insert({
                organization_id: organization.id,
                user_id: user.id,
                role: "owner"
            });
            if (ownerError) throw ownerError;
            return organization.id;
        }
        async function loadSupabaseData() {
            activeOrganizationId = await ensureOrganization(supabaseUser);
            const {data: dataset, error} = await supabaseClient
                .from("employee_datasets")
                .select("records")
                .eq("organization_id", activeOrganizationId)
                .maybeSingle();
            if (error) throw error;
            if (dataset && !Array.isArray(dataset.records)) throw new Error("Database records are not in the expected format.");
            data = dataset?.records || [];
            if (!dataset) {
                const {error: createError} = await supabaseClient.from("employee_datasets").insert({
                    organization_id: activeOrganizationId,
                    records: []
                });
                if (createError) throw createError;
            }
            $("status").innerHTML = `<strong>● Supabase workspace</strong> — ${data.length.toLocaleString("en-IN")} employee records loaded.`;
            setFileMessage("Changes save to your organization database.");
        }
        function queueSupabaseSave() {
            if (!supabaseClient || !supabaseUser || !activeOrganizationId) return;
            const snapshot = JSON.parse(JSON.stringify(data));
            const organizationId = activeOrganizationId;
            cloudSaveQueue = cloudSaveQueue.catch(() => {}).then(async () => {
                const {error} = await supabaseClient.from("employee_datasets").upsert({
                    organization_id: organizationId,
                    records: snapshot,
                    updated_at: new Date().toISOString()
                }, {onConflict: "organization_id"});
                if (error) throw error;
                if (activeOrganizationId === organizationId) setFileMessage("Saved to your Supabase organization database.");
            }).catch(error => {
                console.error("Could not save employee records to Supabase", error);
                setFileMessage("Database save failed. Check your connection and database policies.");
            });
        }
        function csvCell(value) {
            const text = String(value ?? "");
            return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
        }
        function serializeCsv(rows) {
            const defaultHeaders = rows.length ? [] : Object.keys(sample[0]);
            const headers = Array.from(new Set([...defaultHeaders, ...rows.flatMap(row => Object.keys(row))]));
            return [headers.map(csvCell).join(","), ...rows.map(row => headers.map(header => csvCell(row[header])).join(","))].join("\r\n");
        }
        function setFileMessage(message) { $("fileStorageStatus").textContent = message; }
        function queueFileSave() {
            if (!linkedFileHandle || currentMode !== "real") return;
            const handle = linkedFileHandle;
            const csv = serializeCsv(data);
            fileWriteQueue = fileWriteQueue.catch(() => {}).then(async () => {
                const writable = await handle.createWritable();
                await writable.write("\uFEFF" + csv);
                await writable.close();
                if (linkedFileHandle === handle) setFileMessage(`Auto-saved to ${handle.name}.`);
            }).catch(error => {
                console.warn("Could not save the linked CSV file", error);
                setFileMessage(`Could not save ${handle.name}. Reconnect the file to continue auto-saving.`);
            });
        }
        function saveData() {
            if (currentMode !== "real") return true;
            let savedLocally = true;
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
            catch (err) { console.warn("Could not save dashboard data in this browser", err); alert("Browser storage is unavailable. Download CSV to back up your data."); savedLocally = false; }
            queueFileSave();
            queueSupabaseSave();
            return savedLocally;
        }
        function activateCsvFile(handle, rows) {
            linkedFileHandle = handle;
            currentMode = "real";
            data = rows;
            $("productPage").hidden = true;
            $("authScreen").hidden = true;
            $("appShell").hidden = false;
            render();
            $("status").innerHTML = `<strong>● CSV file mode</strong> — ${data.length.toLocaleString("en-IN")} records loaded from ${escapeHtml(handle.name)}.`;
            setFileMessage(`Linked to ${handle.name}. Changes auto-save to this file.`);
            saveData();
        }
        async function requestWritePermission(handle) {
            const permission = await handle.requestPermission({mode: "readwrite"});
            if (permission !== "granted") throw new Error("Write access was not granted for this file.");
        }
        function parseCsvFile(file) {
            return new Promise((resolve, reject) => Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: result => {
                    if (!result.meta.fields?.length) { reject(new Error("This CSV needs a header row.")); return; }
                    resolve(result.data);
                },
                error: reject
            }));
        }
        function loadRazorpayCheckout() {
            if (window.Razorpay) return Promise.resolve();
            return new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.onload = resolve;
                script.onerror = () => reject(new Error("Could not load Razorpay Checkout. Check your internet connection."));
                document.head.appendChild(script);
            });
        }
        async function startRazorpayTestPayment() {
            const button = $("startPaymentBtn");
            button.disabled = true;
            $("paymentMessage").textContent = "Preparing secure test checkout...";
            try {
                await loadRazorpayCheckout();
                const orderResponse = await fetch("/api/create-order", {method: "POST"});
                let order;
                try { order = await orderResponse.json(); }
                catch (_) { throw new Error("Payment API unavailable. Run python server.py, then open http://127.0.0.1:8000."); }
                if (!orderResponse.ok) throw new Error(order.error || "Could not create the test order.");

                const checkout = new window.Razorpay({
                    key: order.key_id,
                    amount: order.amount,
                    currency: order.currency,
                    order_id: order.order_id,
                    name: "Next-Gen Analyst",
                    description: "₹1 Razorpay test transaction",
                    theme: {color: "#1877f2"},
                    handler: async response => {
                        try {
                            const verificationResponse = await fetch("/api/verify-payment", {
                                method: "POST",
                                headers: {"Content-Type": "application/json"},
                                body: JSON.stringify(response)
                            });
                            const verification = await verificationResponse.json();
                            if (!verificationResponse.ok || !verification.verified) {
                                throw new Error(verification.error || "Payment verification failed.");
                            }
                            $("paymentMessage").textContent = "Test payment verified: ₹1.00. No real money was charged.";
                        } catch (error) {
                            $("paymentMessage").textContent = error.message || "Could not verify the test payment.";
                        }
                    },
                    modal: {ondismiss: () => {
                        if ($("paymentMessage").textContent === "Checkout opened. Finish payment or close the window.") {
                            $("paymentMessage").textContent = "Test checkout closed without payment.";
                        }
                    }}
                });
                checkout.on("payment.failed", event => {
                    $("paymentMessage").textContent = event.error?.description || "Test payment failed. Please try again.";
                });
                $("paymentMessage").textContent = "Checkout opened. Finish payment or close the window.";
                checkout.open();
            } catch (error) {
                $("paymentMessage").textContent = error.message || "Could not start the test checkout.";
            } finally {
                button.disabled = false;
            }
        }
        function loadSavedData() {
            if (currentMode === "trial") {
                data = sample.map(x => ({...x}));
                $("status").innerHTML = "<strong>● Trial mode</strong> — sample records only; edits are temporary.";
                return;
            }
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved !== null) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        data = parsed;
                        $("status").innerHTML = `<strong>● Real mode</strong> — ${data.length.toLocaleString("en-IN")} saved employee records loaded.`;
                        return;
                    }
                }
            } catch (err) { console.warn("Could not restore saved dashboard data", err); }
            data = [];
            $("status").innerHTML = "<strong>● Real mode</strong> — empty workspace. Add employees manually or upload your own CSV.";
            saveData();
        }
        function showAuth(panel) {
            updateAuthExperience();
            ["setupPanel","loginPanel","forgotPanel"].forEach(id => $(id).hidden = id !== panel);
            $("productPage").hidden = true;
            $("authScreen").hidden = false;
            $("appShell").hidden = true;
        }
        function showProduct() {
            $("productPage").hidden = false;
            $("authScreen").hidden = true;
            $("appShell").hidden = true;
        }
        async function startMode(mode) {
            currentMode = mode;
            $("productPage").hidden = true;
            $("authScreen").hidden = true;
            $("appShell").hidden = false;
            if (mode === "real" && supabaseClient && supabaseUser) {
                data = [];
                $("status").innerHTML = "<strong>● Connecting</strong> — loading your organization workspace.";
                try {
                    await loadSupabaseData();
                } catch (error) {
                    console.error("Could not load Supabase workspace", error);
                    currentMode = null;
                    activeOrganizationId = null;
                    showAuth("loginPanel");
                    $("loginMessage").textContent = "Could not load your database workspace. Check the Supabase schema and access policies.";
                    return;
                }
            } else {
                activeOrganizationId = null;
                loadSavedData();
            }
            render();
        }
        function getAccount() {
            try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null"); }
            catch (_) { return null; }
        }
        function saveAccount(account) { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account)); }
        const norm = v => String(v ?? "").trim().toLowerCase().replace(/[\s_-]/g, "");
        function get(row, names) {const keys = Object.keys(row); for (const n of names) {const k = keys.find(x => norm(x) === norm(n)); if (k !== undefined) return row[k];} return undefined}
        function num(v) {if (v === undefined || v === null || String(v).trim() === "") return null; const n = Number(v); return Number.isFinite(n) ? n : null}
        function yes(v) {return ["yes", "y", "true", "1", "left"].includes(String(v ?? "").trim().toLowerCase())}
        function money(n) {return n === null || !Number.isFinite(n) ? "N/A" : n.toLocaleString("en-IN", {maximumFractionDigits: 0})}
        function groupBy(rows, keyFn) {const out = {}; rows.forEach(r => {let k = keyFn(r) || "Unknown"; out[k] ??= []; out[k].push(r)}); return out}
        function avg(vals) {const a = vals.filter(v => v !== null && Number.isFinite(v)); return a.length ? a.reduce((s, v) => s + v, 0) / a.length : null}
        function makeChart(id, type, labels, datasets, opts = {}) {if (charts[id]) charts[id].destroy(); charts[id] = new Chart($(id), {type, data: {labels, datasets}, options: {responsive: true, maintainAspectRatio: false, plugins: {legend: {display: type !== "bar" || datasets.length > 1, position: "bottom"}}, scales: type === "doughnut" ? {} : {y: {beginAtZero: true, ticks: {precision: 0}}}, ...opts}})}
        function render() {
            const rows = data; const total = rows.length;
            const attr = rows.filter(r => yes(get(r, ["Attrition"])));
            const ages = rows.map(r => num(get(r, ["Age"]))).filter(v => v !== null);
            const incomes = rows.map(r => num(get(r, ["MonthlyIncome", "Monthly Income", "Income"]))).filter(v => v !== null);
            const depts = groupBy(rows, r => String(get(r, ["Department"]) ?? "Unknown").trim());
            const attrLabel = r => yes(get(r, ["Attrition"])) ? "Left" : "Stayed";
            $("total").textContent = total.toLocaleString("en-IN");
            $("rate").textContent = total ? (attr.length / total * 100).toFixed(1) + "%" : "0%";
            $("attritionFoot").textContent = `${attr.length.toLocaleString("en-IN")} employees left`;
            $("income").textContent = incomes.length ? "₹" + money(avg(incomes)) : "N/A";
            $("age").textContent = ages.length ? avg(ages).toFixed(1) : "N/A";
            const attrGroups = groupBy(rows, attrLabel);
            makeChart("attritionChart", "doughnut", ["Stayed", "Left"], [{data: [(attrGroups.Stayed || []).length, (attrGroups.Left || []).length], backgroundColor: ["#1877f2", "#ed716b"], borderWidth: 0}]);
            const deptNames = Object.keys(depts).sort((a, b) => depts[b].length - depts[a].length);
            makeChart("departmentChart", "bar", deptNames, [{label: "Employees", data: deptNames.map(d => depts[d].length), backgroundColor: "#1877f2", borderRadius: 6}], {plugins: {legend: {display: false}}});
            makeChart("deptAttritionChart", "bar", deptNames, [{label: "Left", data: deptNames.map(d => depts[d].filter(r => yes(get(r, ["Attrition"]))).length), backgroundColor: "#ed716b", borderRadius: 6}], {plugins: {legend: {display: false}}});
            const otGroups = groupBy(rows, r => yes(get(r, ["OverTime"])) ? "Overtime: Yes" : String(get(r, ["OverTime"]) ?? "Unknown").toLowerCase() === "no" ? "Overtime: No" : "Overtime: Unknown");
            const otLabels = Object.keys(otGroups);
            makeChart("overtimeChart", "bar", otLabels, [{label: "Left", data: otLabels.map(k => otGroups[k].filter(r => yes(get(r, ["Attrition"]))).length), backgroundColor: "#ed716b", borderRadius: 6}, {label: "Stayed", data: otLabels.map(k => otGroups[k].filter(r => !yes(get(r, ["Attrition"]))).length), backgroundColor: "#1877f2", borderRadius: 6}], {scales: {x: {stacked: true}, y: {stacked: true, beginAtZero: true, ticks: {precision: 0}}}});
            $("deptTable").innerHTML = deptNames.map(d => {const group = depts[d], left = group.filter(r => yes(get(r, ["Attrition"]))).length, inc = group.map(r => num(get(r, ["MonthlyIncome", "Monthly Income", "Income"]))).filter(v => v !== null); return `<tr><td>${escapeHtml(d)}</td><td>${group.length}</td><td><span class="pill ${left ? "yes" : "no"}">${left}</span></td><td>${(left / group.length * 100).toFixed(1)}%</td><td>${inc.length ? "₹" + money(avg(inc)) : "N/A"}</td></tr>`}).join("");
            $("employeeTable").innerHTML = rows.map((r, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(get(r, ["Age"]) ?? "")}</td><td>${escapeHtml(get(r, ["Department"]) ?? "")}</td><td>${escapeHtml(get(r, ["MonthlyIncome", "Monthly Income", "Income"]) ?? "")}</td><td><span class="pill ${yes(get(r, ["Attrition"])) ? "yes" : "no"}">${yes(get(r, ["Attrition"])) ? "Yes" : "No"}</span></td><td>${escapeHtml(get(r, ["OverTime"]) ?? "")}</td><td>${escapeHtml(get(r, ["JobRole"]) ?? "")}</td><td><button type="button" class="delete-btn" data-delete-index="${i}">Delete</button></td></tr>`).join("");
            const highest = deptNames.slice().sort((a, b) => (depts[b].filter(r => yes(get(r, ["Attrition"]))).length / depts[b].length) - (depts[a].filter(r => yes(get(r, ["Attrition"]))).length / depts[a].length))[0];
            const otYes = otGroups["Overtime: Yes"] || [], otNo = otGroups["Overtime: No"] || [];
            const otRate = arr => arr.length ? arr.filter(r => yes(get(r, ["Attrition"]))).length / arr.length * 100 : null;
            const insights = [
                ["Largest department", `${deptNames[0] || "N/A"} has ${depts[deptNames[0]]?.length || 0} employee records.`],
                ["Highest department attrition", highest ? `${highest}: ${(depts[highest].filter(r => yes(get(r, ["Attrition"]))).length / depts[highest].length * 100).toFixed(1)}% of its records.` : "Not enough data."],
                ["Overtime comparison", `Attrition: overtime yes ${otRate(otYes) === null ? "N/A" : otRate(otYes).toFixed(1) + "%"}; no ${otRate(otNo) === null ? "N/A" : otRate(otNo).toFixed(1) + "%"} (descriptive, not causal).`]
            ];
            $("insights").innerHTML = insights.map(([a, b]) => `<div class="insight"><strong>${escapeHtml(a)}</strong><span>${escapeHtml(b)}</span></div>`).join("");
        }
        function escapeHtml(s) {return String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]))}
        $("csvFile").addEventListener("change", e => {
            const file = e.target.files[0]; if (!file) return; if (!window.Papa) {alert("CSV parser load nahi hua. Internet connect karke page reload karein."); return }
            Papa.parse(file, {header: true, skipEmptyLines: true, complete: res => {if (!res.data.length) {alert("CSV empty hai ya format sahi nahi."); return } data = res.data; saveData(); render(); $("status").innerHTML = `<strong>● Your data loaded</strong> — ${escapeHtml(file.name)} · ${data.length.toLocaleString("en-IN")} rows`;}, error: err => alert("CSV read error: " + err.message)});
        });
        $("employeeForm").addEventListener("submit", e => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            const employee = {
                Age: Number(fd.get("Age")),
                Attrition: String(fd.get("Attrition") || "No"),
                Department: String(fd.get("Department") || "").trim(),
                MonthlyIncome: Number(fd.get("MonthlyIncome")),
                OverTime: String(fd.get("OverTime") || "No"),
                JobSatisfaction: fd.get("JobSatisfaction") === "" ? "" : Number(fd.get("JobSatisfaction")),
                YearsAtCompany: fd.get("YearsAtCompany") === "" ? "" : Number(fd.get("YearsAtCompany")),
                Gender: String(fd.get("Gender") || "").trim(),
                JobRole: String(fd.get("JobRole") || "").trim()
            };
            if (!employee.Department) { $("formMessage").textContent = "Please enter a department."; return; }
            data.push(employee);
            saveData();
            render();
            form.reset();
            $("formMessage").textContent = "Employee added and dashboard updated.";
            $("status").innerHTML = `<strong>● ${currentMode === "trial" ? "Trial mode" : "Real mode"}</strong> — ${data.length.toLocaleString("en-IN")} employee records${currentMode === "trial" ? " (temporary)" : " saved in this browser"}.`;
        });
        $("clearFormBtn").addEventListener("click", () => {
            $("employeeForm").reset();
            $("formMessage").textContent = "";
        });
        $("employeeTable").addEventListener("click", e => {
            const btn = e.target.closest("[data-delete-index]");
            if (!btn) return;
            const index = Number(btn.dataset.deleteIndex);
            if (!Number.isInteger(index) || index < 0 || index >= data.length) return;
            data.splice(index, 1);
            saveData();
            render();
            $("formMessage").textContent = "Employee record deleted.";
            $("status").innerHTML = `<strong>● ${currentMode === "trial" ? "Trial mode" : "Real mode"}</strong> — ${data.length.toLocaleString("en-IN")} employee records${currentMode === "trial" ? " (temporary)" : " saved in this browser"}.`;
        });
        $("exportCsvBtn").addEventListener("click", () => {
            if (!data.length) { alert("No employee records to export."); return; }
            const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))));
            const csvCell = value => {
                const text = String(value ?? "");
                return /[",\\n\\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
            };
            const csv = [headers.map(csvCell).join(","), ...data.map(row => headers.map(h => csvCell(row[h])).join(","))].join("\\r\\n");
            const blob = new Blob(["\\uFEFF" + csv], {type:"text/csv;charset=utf-8;"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "hr_employee_data.csv"; a.click();
            URL.revokeObjectURL(url);
        });
        $("linkCsvBtn").addEventListener("click", () => {
            $("fileDialogMessage").textContent = "";
            $("csvLinkDialog").showModal();
        });
        $("closeCsvDialog").addEventListener("click", () => $("csvLinkDialog").close());
        $("openExistingCsvBtn").addEventListener("click", async () => {
            if (!window.showOpenFilePicker || !window.Papa) {
                $("fileDialogMessage").textContent = "File linking is not supported here. Use Download CSV to save a copy, then Upload HR CSV to view it.";
                return;
            }
            try {
                const [handle] = await window.showOpenFilePicker({
                    multiple: false,
                    types: [{description: "CSV spreadsheet", accept: {"text/csv": [".csv"]}}]
                });
                await requestWritePermission(handle);
                const rows = await parseCsvFile(await handle.getFile());
                $("csvLinkDialog").close();
                activateCsvFile(handle, rows);
            } catch (error) {
                if (error.name !== "AbortError") $("fileDialogMessage").textContent = error.message || "Could not open this CSV file.";
            }
        });
        $("createCsvBtn").addEventListener("click", async () => {
            if (!window.showSaveFilePicker) {
                $("fileDialogMessage").textContent = "File linking is not supported here. Use Download CSV to save a copy.";
                return;
            }
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: "hr_employee_data.csv",
                    types: [{description: "CSV spreadsheet", accept: {"text/csv": [".csv"]}}]
                });
                await requestWritePermission(handle);
                $("csvLinkDialog").close();
                activateCsvFile(handle, []);
                await fileWriteQueue;
            } catch (error) {
                if (error.name !== "AbortError") $("fileDialogMessage").textContent = error.message || "Could not create this CSV file.";
            }
        });
        $("setupForm").addEventListener("submit", async e => {
            e.preventDefault();
            const username = $("setupUsername").value.trim();
            const password = $("setupPassword").value;
            const confirmPassword = $("setupConfirm").value;
            const recovery = $("setupRecovery").value.trim();
            if (password !== confirmPassword) { $("setupMessage").textContent = "Passwords do not match."; return; }
            if (!supabaseClient && recovery.length < 4) { $("setupMessage").textContent = "Recovery code must be at least 4 characters."; return; }
            if (supabaseClient) {
                try {
                    const {data:authData, error} = await supabaseClient.auth.signUp({
                        email: $("supabaseSignupEmail").value.trim(),
                        password,
                        options: {data: {
                            full_name: $("supabaseFullName").value.trim(),
                            organization_name: $("supabaseOrganizationName").value.trim()
                        }}
                    });
                    if (error) throw error;
                    if (authData.session && authData.user) {
                        supabaseUser = authData.user;
                        await startMode("real");
                    } else {
                        showAuth("loginPanel");
                        $("loginMessage").textContent = "Check your email to confirm your account, then sign in.";
                    }
                } catch (error) {
                    $("setupMessage").textContent = error.message || "Could not create your Supabase account.";
                }
                return;
            }
            try {
                saveAccount({username, password, recovery});
                $("setupMessage").textContent = "";
                showAuth("loginPanel");
                $("loginUsername").value = username;
                $("loginMessage").textContent = "Account created. Please log in.";
            } catch (_) { $("setupMessage").textContent = "Could not save account in this browser."; }
        });
        $("loginForm").addEventListener("submit", async e => {
            e.preventDefault();
            if (supabaseClient) {
                try {
                    const {data:authData, error} = await supabaseClient.auth.signInWithPassword({
                        email: $("supabaseLoginEmail").value.trim(),
                        password: $("loginPassword").value
                    });
                    if (error) throw error;
                    supabaseUser = authData.user;
                    await startMode("real");
                } catch (error) {
                    $("loginMessage").textContent = error.message || "Could not sign in to Supabase.";
                }
                return;
            }
            const account = getAccount();
            if (account && $("loginUsername").value.trim() === account.username && $("loginPassword").value === account.password) {
                $("loginMessage").textContent = "";
                startMode("real");
            } else {
                $("loginMessage").textContent = "Incorrect username or password.";
            }
        });
        $("showForgot").addEventListener("click", () => showAuth("forgotPanel"));
        $("backToLogin").addEventListener("click", () => showAuth("loginPanel"));
        $("forgotForm").addEventListener("submit", e => {
            e.preventDefault();
            const account = getAccount();
            const username = $("forgotUsername").value.trim();
            const recovery = $("forgotRecovery").value.trim();
            const newPassword = $("forgotNewPassword").value;
            if (!account || username !== account.username || recovery !== account.recovery) {
                $("forgotMessage").textContent = "Username or recovery code is incorrect."; return;
            }
            if (newPassword !== $("forgotConfirmPassword").value) {
                $("forgotMessage").textContent = "New passwords do not match."; return;
            }
            try {
                account.password = newPassword;
                saveAccount(account);
                $("forgotForm").reset();
                showAuth("loginPanel");
                $("loginMessage").textContent = "Password reset successfully. Log in with your new password.";
            } catch (_) { $("forgotMessage").textContent = "Could not save the new password."; }
        });
        $("supabaseResetRequestForm").addEventListener("submit", async e => {
            e.preventDefault();
            try {
                const {error} = await supabaseClient.auth.resetPasswordForEmail($("supabaseResetEmail").value.trim(), {
                    redirectTo: window.location.origin + window.location.pathname
                });
                if (error) throw error;
                $("supabaseResetMessage").textContent = "If the account exists, a password reset link has been sent.";
            } catch (error) {
                $("supabaseResetMessage").textContent = error.message || "Could not send a password reset email.";
            }
        });
        $("supabasePasswordUpdateForm").addEventListener("submit", async e => {
            e.preventDefault();
            const password = $("supabaseNewPassword").value;
            if (password !== $("supabaseConfirmPassword").value) {
                $("supabaseUpdateMessage").textContent = "New passwords do not match.";
                return;
            }
            try {
                const {error} = await supabaseClient.auth.updateUser({password});
                if (error) throw error;
                passwordRecoveryMode = false;
                await supabaseClient.auth.signOut();
                supabaseUser = null;
                showAuth("loginPanel");
                $("loginMessage").textContent = "Password updated. Sign in with your new password.";
            } catch (error) {
                $("supabaseUpdateMessage").textContent = error.message || "Could not update the password.";
            }
        });
        ["navTrialBtn", "heroTrialBtn", "sectionTrialBtn"].forEach(id => $(id).addEventListener("click", () => startMode("trial")));
        $("signInBtn").addEventListener("click", () => showAuth(supabaseClient || getAccount() ? "loginPanel" : "setupPanel"));
        $("backToProductBtn").addEventListener("click", showProduct);
        $("showLoginFromSetup").addEventListener("click", () => showAuth("loginPanel"));
        $("showSetupFromLogin").addEventListener("click", () => showAuth("setupPanel"));
        $("pricingTrialBtn").addEventListener("click", () => startMode("trial"));
        $("dashboardNav").addEventListener("click", e => {
            const link = e.target.closest("a");
            if (!link) return;
            $("dashboardNav").querySelectorAll("a").forEach(item => item.classList.toggle("active", item === link));
        });
        $("logoutBtn").addEventListener("click", () => {
            if (supabaseClient && supabaseUser) {
                supabaseClient.auth.signOut().catch(error => console.error("Could not sign out", error));
            }
            currentMode = null;
            supabaseUser = null;
            activeOrganizationId = null;
            $("loginForm").reset();
            showProduct();
        });
        updateAuthExperience();
        showProduct();
        if (supabaseClient) {
            supabaseClient.auth.onAuthStateChange((event, session) => {
                supabaseUser = session?.user || null;
                if (event === "PASSWORD_RECOVERY") {
                    passwordRecoveryMode = true;
                    setTimeout(() => showAuth("forgotPanel"), 0);
                }
                if (event === "SIGNED_OUT") {
                    activeOrganizationId = null;
                    currentMode = null;
                    showProduct();
                }
            });
            supabaseClient.auth.getSession().then(({data, error}) => {
                if (error) throw error;
                if (data.session?.user) {
                    supabaseUser = data.session.user;
                    startMode("real");
                }
            }).catch(error => console.error("Could not restore Supabase session", error));
        }
