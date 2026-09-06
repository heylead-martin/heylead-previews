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
  function usedPct(n) {
    n = Number(n);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
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
  function resetLabel(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const now = Date.now();
    const diff = d.getTime() - now;
    if (diff > 0 && diff < 48 * 3600 * 1000) {
      const h = Math.floor(diff / 3600000);
      const m = Math.round((diff % 3600000) / 60000);
      return "Resets in " + h + " hr " + m + " min";
    }
    return (
      "Resets " +
      d.toLocaleString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    );
  }
  function money(n) {
    n = Number(n);
    if (!Number.isFinite(n)) return "$0.00";
    return (
      "$" +
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function ring(title, value, unit, sub, barClass, used, cap) {
    const width = cap == null ? usedPct(used) : pct(used, cap);
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

  function meterRow(label, used, extra) {
    const p = usedPct(used);
    const remain = Math.max(0, Math.round(100 - p));
    return (
      '<div class="meter"><div class="meter-head"><span>' +
      esc(label) +
      "</span><strong>" +
      Math.round(p) +
      "% used</strong></div><div class=\"bar\"><i style=\"width:" +
      p +
      '%"></i></div><div class="meter-foot">' +
      remain +
      "% remaining" +
      (extra ? " · " + esc(extra) : "") +
      "</div></div>"
    );
  }

  function usageCard(kind, title, plan, block, extraHtml) {
    const ok = block && block.ok;
    const windows = (block && block.windows) || [];
    let body;
    if (!ok) {
      body =
        '<p class="empty">' +
        esc((block && block.error) || "No live usage yet. Run collect-spend.py.") +
        "</p>";
    } else {
      body = windows
        .map(function (w) {
          return meterRow(w.label || w.id, w.used_pct, w.resets_at ? resetLabel(w.resets_at) : "");
        })
        .join("");
      if (!windows.length && block.used_pct != null) {
        body = meterRow(title, block.used_pct, resetLabel(block.resets_at));
      }
    }
    const source = block && block.source ? '<div class="src">' + esc(block.source) + "</div>" : "";
    return (
      '<article class="usage-card ' +
      kind +
      '"><header><h2>' +
      esc(title) +
      '</h2><span class="plan-pill">' +
      esc(plan || "") +
      "</span></header>" +
      body +
      (extraHtml || "") +
      source +
      "</article>"
    );
  }

  function grokExtras(g) {
    if (!g || !g.ok) return "";
    const bits = [];
    const ra = g.reset_available || {};
    if (ra.count) {
      bits.push(
        "<div><strong>Reset Available</strong> · expires " +
          esc(when(ra.expires_at) || "soon") +
          "</div>"
      );
    }
    bits.push(
      "<div>Extra Usage Credits <strong>" + money(g.extra_credits_usd) + "</strong></div>"
    );
    if (g.auto_topup && g.auto_topup !== "TOP_UP_METHOD_UNSPECIFIED") {
      const on = Number(g.on_demand_cap_usd) > 0;
      bits.push(
        "<div>Auto Top-Up " +
          (on ? money(g.on_demand_cap_usd) : "off (cap " + money(g.on_demand_cap_usd) + ")") +
          "</div>"
      );
    }
    return '<div class="extras">' + bits.join("") + "</div>";
  }

  function claudeExtras(c) {
    if (!c || !c.ok) return "";
    const bits = [];
    if (c.sampled_at) bits.push("<div>Sampled " + esc(when(c.sampled_at)) + "</div>");
    if (c.stale) bits.push("<div>Cache is more than 6 hours old. Open Claude desktop to refresh.</div>");
    if (c.extra_usage_enabled === false) bits.push("<div>Usage credits off</div>");
    if (c.extra_usage_enabled === true) bits.push("<div>Usage credits on</div>");
    return bits.length ? '<div class="extras">' + bits.join("") + "</div>" : "";
  }

  function gptExtras(g) {
    if (!g || !g.ok) return "";
    const bits = [];
    const ra = g.reset_available || {};
    if (ra.count) bits.push("<div>Reset credits available: " + ra.count + "</div>");
    const cr = g.credits || {};
    if (cr.has_credits) bits.push("<div>Usage credits " + money(cr.balance) + "</div>");
    else bits.push("<div>No extra usage credits</div>");
    return '<div class="extras">' + bits.join("") + "</div>";
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
    const usage = data.usage || {};
    const ug = usage.grok || {};
    const uc = usage.claude || {};
    const ut = usage.chatgpt || {};
    const claudeM = (rev.month && rev.month.claude) || {};
    const gptM = (rev.month && rev.month.codex) || {};
    const claudeT = (rev.today && rev.today.claude) || {};
    const gptT = (rev.today && rev.today.codex) || {};

    $("hero").innerHTML =
      ring(
        "Grok weekly pool",
        ug.ok && ug.used_pct != null ? String(Math.round(ug.used_pct)) : "-",
        "% used",
        ug.ok
          ? Math.round(ug.remaining_pct || 0) +
              "% remaining · " +
              (ug.plan || "SuperGrok") +
              (ug.resets_at ? " · " + resetLabel(ug.resets_at) : "")
          : ug.error || "no live meter",
        "grok",
        ug.used_pct,
        null
      ) +
      ring(
        "Claude weekly",
        uc.ok && uc.used_pct != null ? String(Math.round(uc.used_pct)) : "-",
        "% used",
        uc.ok
          ? Math.round(uc.remaining_pct || 0) +
              "% remaining · all models" +
              (uc.resets_at ? " · " + resetLabel(uc.resets_at) : "")
          : uc.error || "no live meter",
        "claude",
        uc.used_pct,
        null
      ) +
      ring(
        "Codex / ChatGPT",
        ut.ok && ut.used_pct != null ? String(Math.round(ut.used_pct)) : "-",
        "% used",
        ut.ok
          ? Math.round(ut.remaining_pct || 0) +
              "% remaining · " +
              (ut.plan || "ChatGPT") +
              (ut.resets_at ? " · " + resetLabel(ut.resets_at) : "")
          : ut.error || "no live meter",
        "gpt",
        ut.used_pct,
        null
      ) +
      ring(
        "GitHub Actions this month",
        fmtMin(ga.used_month_min),
        "billed min",
        fmtMin(ga.wall_month_min) +
          " wall · " +
          fmtMin(ga.remaining_min) +
          " of " +
          fmtMin(ga.allowance_min) +
          " left · " +
          (ga.runs_today || 0) +
          " runs today",
        "gh",
        ga.used_month_min,
        ga.allowance_min
      );

    $("meters").innerHTML =
      usageCard("grok", "Grok", ug.plan || "SuperGrok", ug, grokExtras(ug)) +
      usageCard("claude", "Claude Code", uc.plan || "claude.ai", uc, claudeExtras(uc)) +
      usageCard(
        "gpt",
        "Codex / ChatGPT",
        ({ go: "ChatGPT Go", plus: "ChatGPT Plus", pro: "Pro" }[String(ut.plan || "").toLowerCase()] ||
          ut.plan ||
          "ChatGPT"),
        ut,
        gptExtras(ut)
      );

    const products = [
      {
        color: "var(--grok)",
        name: "Grok / SuperGrok",
        plan: ug.plan || ((data.plans && data.plans.grok && data.plans.grok.plan) || ""),
        line: ug.ok
          ? Math.round(ug.used_pct || 0) +
            "% of weekly pool used · " +
            (grok.sessions_month || 0) +
            " local sessions · " +
            (grok.turns_month || 0) +
            " turns"
          : (grok.sessions_month || 0) + " local sessions this month",
      },
      {
        color: "var(--claude)",
        name: "Claude Code",
        plan: (data.plans && data.plans.claude && data.plans.claude.plan) || "",
        line: uc.ok
          ? "Weekly " +
            Math.round(uc.used_pct || 0) +
            "% · " +
            (claudeM.runs || 0) +
            " dual-review passes this month"
          : (claudeM.runs || 0) + " dual-review passes this month",
      },
      {
        color: "var(--gpt)",
        name: "Codex / ChatGPT",
        plan: ut.plan || ((data.plans && data.plans.chatgpt && data.plans.chatgpt.plan) || ""),
        line: ut.ok
          ? Math.round(ut.used_pct || 0) +
            "% of window · " +
            (gptM.runs || 0) +
            " dual-review passes this month"
          : (gptM.runs || 0) + " dual-review passes this month",
      },
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
    $("notes").innerHTML = notes
      .map(function (n) {
        return "<li>" + esc(n) + "</li>";
      })
      .join("");
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
