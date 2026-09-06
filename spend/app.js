(function () {
  const $ = (id) => document.getElementById(id);

  function fmtMin(n) {
    n = Number(n) || 0;
    if (n < 0.05) return "0";
    if (n < 10) return n.toFixed(1);
    return String(Math.round(n));
  }
  function pct(used, cap) {
    if (!cap) return 0;
    return Math.max(0, Math.min(100, (used / cap) * 100));
  }
  function when(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function ring(title, value, unit, sub, barClass, used, cap) {
    const width = pct(used, cap);
    return (
      '<article class="ring-card"><h2>' +
      esc(title) +
      '</h2><div class="big">' +
      esc(value) +
      '<span class="unit">' +
      esc(unit) +
      "</span></div><div class=\"sub\">" +
      esc(sub) +
      '</div><div class="bar ' +
      barClass +
      '"><i style="width:' +
      width +
      '%"></i></div></article>'
    );
  }

  function render(data) {
    $("stamp").textContent =
      "Snapshot " +
      when(data.generated_at) +
      " · month " +
      (data.month || "") +
      " · today " +
      (data.today || "");

    const ga = data.github_actions || {};
    const grok = data.grok || {};
    const rev = data.reviews || {};
    const claudeM = (rev.month && rev.month.claude) || {};
    const gptM = (rev.month && rev.month.codex) || {};
    const claudeT = (rev.today && rev.today.claude) || {};
    const gptT = (rev.today && rev.today.codex) || {};

    $("hero").innerHTML =
      ring(
        "GitHub Actions this month",
        fmtMin(ga.wall_month_min || ga.used_month_min),
        "min",
        fmtMin(ga.used_month_min) +
          " billed of " +
          fmtMin(ga.allowance_min) +
          " included · " +
          (ga.runs_today || 0) +
          " runs today",
        "gh",
        ga.used_month_min,
        ga.allowance_min
      ) +
      ring(
        "Grok this month",
        String(grok.sessions_month || 0),
        "sessions",
        (grok.turns_month || 0) +
          " turns · " +
          (grok.sessions_today || 0) +
          " sessions today",
        "grok",
        grok.sessions_month || 0,
        Math.max(20, (grok.sessions_month || 0) + 4)
      ) +
      ring(
        "Claude reviews",
        String(claudeM.runs || 0),
        "this month",
        (claudeT.runs || 0) +
          " today · " +
          (claudeM.fail || 0) +
          " failed · Max plan",
        "claude",
        claudeM.runs || 0,
        Math.max(10, (claudeM.runs || 0) + 3)
      ) +
      ring(
        "Codex reviews",
        String(gptM.runs || 0),
        "this month",
        (gptT.runs || 0) +
          " today · " +
          (gptM.fail || 0) +
          " failed · ChatGPT plan",
        "gpt",
        gptM.runs || 0,
        Math.max(10, (gptM.runs || 0) + 3)
      );

    const products = [
      {
        color: "var(--gh)",
        name: "GitHub Actions",
        plan: (data.plans && data.plans.github_actions && data.plans.github_actions.plan) || "",
        line:
          fmtMin(ga.wall_month_min) +
          " min runner time · " +
          fmtMin(ga.used_month_min) +
          " billed of " +
          fmtMin(ga.allowance_min) +
          " · " +
          (ga.runs_month || 0) +
          " runs",
      },
      {
        color: "var(--grok)",
        name: "Grok Build TUI",
        plan: (data.plans && data.plans.grok && data.plans.grok.plan) || "",
        line:
          (grok.sessions_month || 0) +
          " sessions · " +
          (grok.turns_month || 0) +
          " turns · " +
          (grok.messages_month || 0) +
          " messages",
      },
      {
        color: "var(--claude)",
        name: "Claude Code (Max)",
        plan: (data.plans && data.plans.claude && data.plans.claude.plan) || "",
        line:
          (claudeM.runs || 0) +
          " dual-review passes this month · " +
          Math.round((claudeM.duration_ms || 0) / 60000) +
          " min wall",
      },
      {
        color: "var(--gpt)",
        name: "Codex / ChatGPT",
        plan: (data.plans && data.plans.chatgpt && data.plans.chatgpt.plan) || "",
        line:
          (gptM.runs || 0) +
          " dual-review passes this month · " +
          Math.round((gptM.duration_ms || 0) / 60000) +
          " min wall",
      },
      {
        color: "#64748b",
        name: "GitHub Pages",
        plan: "previews.heylead.com on the public repo",
        line: "Public Pages bandwidth is included. Not billed as Actions minutes.",
      },
    ];
    $("products").innerHTML = products
      .map(function (p) {
        return (
          '<div class="product"><span class="dot" style="background:' +
          p.color +
          '"></span><div><h3>' +
          esc(p.name) +
          "</h3><p>" +
          esc(p.plan) +
          '</p><div class="statline">' +
          esc(p.line) +
          "</div></div></div>"
        );
      })
      .join("");

    const commits = ga.commits || [];
    if (!commits.length) {
      $("commits").innerHTML =
        '<div class="empty">No Actions runs this month yet, or the collector has not finished.</div>';
    } else {
      $("commits").innerHTML =
        "<table><thead><tr><th>When</th><th>Repo / commit</th><th>Actions</th></tr></thead><tbody>" +
        commits
          .slice(0, 40)
          .map(function (c) {
            const bill = c.billable_min || 0;
            const wall = c.wall_min || 0;
            const mins =
              (wall ? fmtMin(wall) + " min" : "0 min") +
              (bill > 0 ? " · " + fmtMin(bill) + " billed" : "");
            return (
              "<tr><td class=\"mono\">" +
              esc(when(c.when)) +
              "</td><td>" +
              (c.private ? '<span class="pill priv">private</span> ' : "") +
              "<strong>" +
              esc(c.repo) +
              "</strong> " +
              '<span class="mono">' +
              esc(c.sha) +
              "</span><br>" +
              (c.url
                ? '<a href="' + esc(c.url) + '" target="_blank" rel="noreferrer">' +
                  esc(c.title || c.workflow) +
                  "</a>"
                : esc(c.title || c.workflow)) +
              "</td><td>" +
              esc(mins) +
              "<br><span class=\"mono\">" +
              esc(c.workflow || "") +
              "</span></td></tr>"
            );
          })
          .join("") +
        "</tbody></table>";
    }

    const repos = ga.by_repo || [];
    $("repos").innerHTML = repos.length
      ? "<table><thead><tr><th>Repo</th><th>Runs</th><th>Min</th></tr></thead><tbody>" +
        repos
          .map(function (r) {
            return (
              "<tr><td>" +
              (r.private ? '<span class="pill priv">priv</span> ' : "") +
              esc(r.repo) +
              "</td><td>" +
              r.runs +
              "</td><td>" +
              fmtMin(r.wall_min || r.billable_min) +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table>"
      : '<div class="empty">No repo usage yet.</div>';

    const sessions = grok.items || [];
    $("sessions").innerHTML = sessions.length
      ? "<table><thead><tr><th>Session</th><th>Turns</th></tr></thead><tbody>" +
        sessions
          .slice(0, 12)
          .map(function (s) {
            return (
              "<tr><td><strong>" +
              esc(s.title) +
              "</strong><br><span class=\"mono\">" +
              esc(s.repo || s.cwd || "") +
              " · " +
              esc(s.model) +
              "</span></td><td>" +
              (s.turns || 0) +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table>"
      : '<div class="empty">No Grok sessions this month.</div>';

    const notes = data.notes || [];
    $("notes").innerHTML = notes.map(function (n) {
      return "<li>" + esc(n) + "</li>";
    }).join("");
  }

  fetch("data.json", { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("Could not load data.json (" + r.status + ")");
      return r.json();
    })
    .then(render)
    .catch(function (err) {
      $("stamp").textContent = "No snapshot yet";
      $("fatal").hidden = false;
      $("fatal").textContent =
        String(err.message || err) +
        ". Run: python3 ~/.grok/scripts/collect-spend.py";
    });
})();
