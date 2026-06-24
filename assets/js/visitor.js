(() => {
  const isRecordsPage = document.body.dataset.page === "visitor-records";
  const state = {
    adminLoaded: false,
    adminPage: 0,
    adminLimit: isRecordsPage ? 50 : 10,
    total: 0,
    currentCount: 0,
    sinceHours: isRecordsPage ? 0 : 24
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const text = (selector, value) => {
    const node = $(selector);
    if (node) node.textContent = value || "--";
  };

  const formatTime = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  };

  const visitorLocation = (visitor = {}) => {
    const parts = [visitor.country, visitor.region, visitor.city].filter(Boolean);
    return parts.length ? parts.join(" / ") : visitor.geo_status || "--";
  };

  const visitorBrowser = (visitor = {}) => {
    return [visitor.browser_name, visitor.browser_version].filter(Boolean).join(" ") || "--";
  };

  const visitorSystem = (visitor = {}) => {
    const os = [visitor.os_name, visitor.os_version].filter(Boolean).join(" ");
    return [os, visitor.device_type].filter(Boolean).join(" / ") || "--";
  };

  const setStatus = (message, mode = "") => {
    const node = $("[data-visitor-status]");
    if (!node) return;
    node.textContent = message;
    node.classList.toggle("is-online", mode === "online");
    node.classList.toggle("is-error", mode === "error");
  };

  const setAdminMessage = (message = "", mode = "") => {
    const node = $("[data-admin-error]");
    if (!node) return;
    node.textContent = message;
    node.classList.toggle("is-success", mode === "success");
  };

  const getSessionId = () => {
    const key = "bookerVisitorSessionId";
    try {
      let value = window.localStorage.getItem(key);
      if (!value) {
        value = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        window.localStorage.setItem(key, value);
      }
      return value;
    } catch {
      return "";
    }
  };

  const api = async (path, options = {}) => {
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    return payload;
  };

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const renderCurrentVisitor = (visitor) => {
    text('[data-field="visited_at"]', formatTime(visitor.visited_at));
    text('[data-field="ip"]', visitor.ip);
    text('[data-field="ip_version"]', visitor.ip_version);
    text('[data-field="location"]', visitorLocation(visitor));
    text('[data-field="isp"]', visitor.isp || visitor.timezone || visitor.geo_status);
    text('[data-field="browser"]', visitorBrowser(visitor));
    text('[data-field="system"]', visitorSystem(visitor));
  };

  const renderPublicStats = (stats = {}) => {
    $$("[data-stat]").forEach((node) => {
      const key = node.dataset.stat;
      node.textContent = stats[key] ?? "--";
    });

    const list = $("[data-public-list]");
    if (!list) return;

    const pages = stats.top_pages || [];
    const locations = stats.recent_locations || [];
    const rows = [
      ...pages.slice(0, 4).map((page) => ({
        title: page.page_path || "/",
        meta: "热门页面",
        pill: `${page.visits} 次`
      })),
      ...locations.slice(0, 4).map((visit) => ({
        title: visitorLocation(visit),
        meta: `${formatTime(visit.visited_at)} · ${visit.browser_name || "Unknown"} · ${visit.page_path || "/"}`,
        pill: visit.device_type || "visit"
      }))
    ];

    list.innerHTML = rows.length
      ? rows.map((row) => `
          <div class="visitor-list-item">
            <div>
              <strong>${escapeHtml(row.title)}</strong>
              <span>${escapeHtml(row.meta)}</span>
            </div>
            <span class="visitor-pill">${escapeHtml(row.pill)}</span>
          </div>
        `).join("")
      : '<p class="visitor-muted">还没有访问记录。</p>';
  };

  const collectVisitPayload = () => ({
    path: `${window.location.pathname}${window.location.search}`,
    title: document.title,
    referrer: document.referrer,
    language: navigator.language,
    screen: window.screen ? `${window.screen.width}x${window.screen.height}` : "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionId: getSessionId()
  });

  const loadPublic = async () => {
    const visitResult = await api("/api/visit", {
      method: "POST",
      body: JSON.stringify(collectVisitPayload())
    });
    const statsResult = await api("/api/public-stats");
    renderCurrentVisitor(visitResult.visitor || {});
    renderPublicStats(statsResult.stats || {});
    setStatus("访客记录服务已连接", "online");
  };

  const adminColspan = () => (isRecordsPage ? 7 : 6);

  const showAdminPanel = () => {
    $("[data-admin-panel]")?.classList.add("is-visible");
    const locked = $("[data-admin-locked]");
    if (locked) locked.hidden = true;
    const fullLink = $("[data-admin-full-link]");
    if (fullLink) fullLink.hidden = false;
    setStatus(isRecordsPage ? "后台登录已验证" : "访客记录服务已连接", "online");
  };

  const showLockedPanel = () => {
    const locked = $("[data-admin-locked]");
    if (locked) locked.hidden = false;
    $("[data-admin-panel]")?.classList.remove("is-visible");
    setStatus("需要先登录访客后台", "error");
  };

  const renderPagination = () => {
    const totalPages = Math.max(1, Math.ceil(state.total / state.adminLimit));
    const currentPage = Math.min(state.adminPage + 1, totalPages);
    const start = state.total ? state.adminPage * state.adminLimit + 1 : 0;
    const end = state.total ? Math.min(state.total, state.adminPage * state.adminLimit + state.currentCount) : 0;

    text("[data-admin-range-label]", state.sinceHours ? `最近 ${state.sinceHours} 小时记录` : "全部记录");
    text("[data-admin-total]", `${state.total} 条，当前 ${start}-${end}`);
    text("[data-admin-page]", `第 ${currentPage} / ${totalPages} 页`);

    const prev = $("[data-admin-prev]");
    const next = $("[data-admin-next]");
    if (prev) prev.disabled = state.adminPage <= 0;
    if (next) next.disabled = state.adminPage + 1 >= totalPages;
  };

  const renderAdminVisits = (visits = []) => {
    const tbody = $("[data-admin-visits]");
    if (!tbody) return;

    const selectAll = $("[data-admin-select-all]");
    if (selectAll) selectAll.checked = false;

    if (!visits.length) {
      tbody.innerHTML = `<tr><td colspan="${adminColspan()}">没有匹配的访客记录。</td></tr>`;
      return;
    }

    tbody.innerHTML = visits.map((visit) => {
      const selectCell = isRecordsPage
        ? `<td><input type="checkbox" data-visit-select data-visit-id="${escapeHtml(visit.id)}" aria-label="选择记录 ${escapeHtml(visit.id)}"></td>`
        : "";
      return `
        <tr>
          ${selectCell}
          <td>${escapeHtml(formatTime(visit.visited_at))}</td>
          <td><strong>${escapeHtml(visit.ip)}</strong><span>${escapeHtml(visit.ip_version || "")}</span></td>
          <td>${escapeHtml(visitorLocation(visit))}<br><span>${escapeHtml(visit.isp || visit.timezone || "")}</span></td>
          <td>${escapeHtml(visitorBrowser(visit))}<br><span>${escapeHtml(visitorSystem(visit))}</span></td>
          <td><strong>${escapeHtml(visit.page_path || "/")}</strong><span>${escapeHtml(visit.page_title || "")}</span></td>
          <td>${escapeHtml(visit.user_agent || "")}</td>
        </tr>
      `;
    }).join("");
  };

  const syncLimitFromControl = () => {
    const limitControl = $("[data-admin-limit]");
    if (!limitControl) return;
    const nextLimit = Number.parseInt(limitControl.value, 10);
    if (Number.isFinite(nextLimit) && nextLimit > 0) {
      state.adminLimit = nextLimit;
    }
  };

  const loadAdminVisits = async ({ resetPage = false } = {}) => {
    syncLimitFromControl();
    if (resetPage) state.adminPage = 0;

    const search = $("[data-admin-search]")?.value.trim() || "";
    const query = new URLSearchParams({
      limit: String(state.adminLimit),
      offset: String(state.adminPage * state.adminLimit)
    });
    if (search) query.set("q", search);
    if (state.sinceHours) query.set("since_hours", String(state.sinceHours));

    const result = await api(`/api/admin/visits?${query.toString()}`);
    const visits = Array.isArray(result.visits) ? result.visits.slice(0, state.adminLimit) : [];
    state.total = Number(result.total ?? visits.length);
    state.currentCount = visits.length;

    if (state.total === 0) {
      state.adminPage = 0;
    } else if (state.adminPage * state.adminLimit >= state.total) {
      state.adminPage = Math.max(0, Math.ceil(state.total / state.adminLimit) - 1);
      return loadAdminVisits();
    }

    renderAdminVisits(visits);
    renderPagination();
    state.adminLoaded = true;
  };

  const deleteSelectedVisits = async () => {
    const ids = $$("[data-visit-select]:checked").map((node) => node.dataset.visitId).filter(Boolean);
    if (!ids.length) {
      setAdminMessage("请先勾选要删除的记录。");
      return;
    }
    if (!window.confirm(`确定删除选中的 ${ids.length} 条访客记录吗？`)) return;

    const result = await api("/api/admin/visits", {
      method: "DELETE",
      body: JSON.stringify({ ids })
    });
    setAdminMessage(`已删除 ${result.deleted || 0} 条记录。`, "success");
    await loadAdminVisits();
  };

  const bindAdminControls = () => {
    const error = $("[data-admin-error]");

    $("[data-admin-refresh]")?.addEventListener("click", () => {
      loadAdminVisits().catch((err) => {
        if (error) error.textContent = err.message || "刷新失败";
      });
    });

    $("[data-admin-search-button]")?.addEventListener("click", () => {
      loadAdminVisits({ resetPage: true }).catch((err) => {
        if (error) error.textContent = err.message || "搜索失败";
      });
    });

    $("[data-admin-search]")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        loadAdminVisits({ resetPage: true }).catch((err) => {
          if (error) error.textContent = err.message || "搜索失败";
        });
      }
    });

    $("[data-admin-prev]")?.addEventListener("click", () => {
      if (state.adminPage <= 0) return;
      state.adminPage -= 1;
      loadAdminVisits().catch((err) => {
        if (error) error.textContent = err.message || "上一页加载失败";
      });
    });

    $("[data-admin-next]")?.addEventListener("click", () => {
      state.adminPage += 1;
      loadAdminVisits().catch((err) => {
        state.adminPage = Math.max(0, state.adminPage - 1);
        if (error) error.textContent = err.message || "下一页加载失败";
      });
    });

    $("[data-admin-limit]")?.addEventListener("change", () => {
      loadAdminVisits({ resetPage: true }).catch((err) => {
        if (error) error.textContent = err.message || "分页加载失败";
      });
    });

    $("[data-admin-select-all]")?.addEventListener("change", (event) => {
      $$("[data-visit-select]").forEach((node) => {
        node.checked = event.currentTarget.checked;
      });
    });

    $("[data-admin-delete]")?.addEventListener("click", () => {
      deleteSelectedVisits().catch((err) => {
        if (error) error.textContent = err.message || "删除失败";
      });
    });
  };

  const setupAdmin = () => {
    const form = $("[data-admin-login]");
    const error = $("[data-admin-error]");

    bindAdminControls();

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      setAdminMessage("");
      const password = new FormData(form).get("password") || "";

      try {
        await api("/api/admin/login", {
          method: "POST",
          body: JSON.stringify({ password })
        });
        form.reset();
        showAdminPanel();
        await loadAdminVisits({ resetPage: true });
      } catch (err) {
        if (error) error.textContent = err.message || "登录失败";
      }
    });

    const sessionQuery = new URLSearchParams({
      limit: "1",
      offset: "0"
    });
    if (state.sinceHours) sessionQuery.set("since_hours", String(state.sinceHours));

    api(`/api/admin/visits?${sessionQuery.toString()}`)
      .then(() => {
        showAdminPanel();
        return loadAdminVisits({ resetPage: true });
      })
      .catch(() => {
        state.adminLoaded = false;
        if (isRecordsPage) showLockedPanel();
      });
  };

  if (window.location.protocol === "file:") {
    setStatus("当前是 file:// 静态打开，访客接口不可用。请访问 http://127.0.0.1:8765/visitor.html", "error");
    return;
  }

  if (!isRecordsPage) {
    loadPublic().catch((err) => {
      setStatus(`访客记录服务不可用：${err.message || "连接失败"}`, "error");
    });
  }
  setupAdmin();
})();
