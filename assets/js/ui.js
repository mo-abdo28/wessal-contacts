/* =====================================================================
 * Wessal Contacts — UI rendering
 * ---------------------------------------------------------------------
 * Renders the contact list (cards on mobile, table on desktop), the
 * stat counters, the category chips, and all admin panels.
 * ===================================================================== */
window.W = window.W || {};

W.ui = {
  state: {
    query: "",
    filterWa: "all",
    filterCat: "all",
    sort: "name",
    editingId: null
  },

  /* ------------------------------------------------------------------
   * Filtering + sorting
   * ---------------------------------------------------------------- */
  visible: function () {
    var st = W.ui.state;
    var list = W.store.contacts.filter(function (c) {
      if (st.filterWa === "yes" && !c.has_whatsapp) return false;
      if (st.filterWa === "no" && c.has_whatsapp) return false;
      if (st.filterCat !== "all" && (c.category || "Other") !== st.filterCat) return false;
      return W.contactMatches(c, st.query);
    });

    var dir = document.documentElement.dir === "rtl" ? -1 : 1;

    list.sort(function (a, b) {
      if (st.sort === "newest") {
        return String(b.created_at || "").localeCompare(String(a.created_at || ""));
      }
      if (st.sort === "category") {
        var ca = (a.category || "Other"), cb = (b.category || "Other");
        var byCat = ca.localeCompare(cb, undefined, { numeric: true });
        if (byCat !== 0) return byCat * dir;
        return W.normalizeSearch(W.store.label(a)).localeCompare(
          W.normalizeSearch(W.store.label(b)), undefined, { numeric: true }) * dir;
      }
      // default: name
      var an = W.normalizeSearch(W.store.label(a));
      var bn = W.normalizeSearch(W.store.label(b));
      if (an < bn) return -1 * dir;
      if (an > bn) return 1 * dir;
      return 0;
    });

    return list;
  },

  /* ------------------------------------------------------------------
   * Main render
   * ---------------------------------------------------------------- */
  render: function () {
    this.renderStats();
    this.renderCatChips();
    this.renderFilters();
    this.renderList();
  },

  renderStats: function () {
    var s = W.store.stats();
    var total = document.getElementById("stat-total");
    var wa = document.getElementById("stat-wa");
    var nowa = document.getElementById("stat-nowa");
    if (total) total.textContent = s.total;
    if (wa) wa.textContent = s.withWa;
    if (nowa) nowa.textContent = s.withoutWa;
  },

  renderCatChips: function () {
    var host = document.getElementById("cat-chips");
    if (!host) return;
    var per = W.store.stats().perCategory;
    var names = W.store.categoryNames().sort(function (a, b) {
      return (per[b] || 0) - (per[a] || 0) || a.localeCompare(b);
    });

    host.innerHTML = "";
    if (!names.length) return;

    names.forEach(function (name) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "cat-chip";
      if (W.ui.state.filterCat === name) chip.classList.add("is-active");
      chip.innerHTML = '<span></span><b></b>';
      chip.querySelector("span").textContent = name;
      chip.querySelector("b").textContent = per[name] || 0;
      chip.addEventListener("click", function () {
        W.ui.state.filterCat = W.ui.state.filterCat === name ? "all" : name;
        var sel = document.getElementById("filter-cat");
        if (sel) sel.value = W.ui.state.filterCat;
        W.ui.render();
      });
      host.appendChild(chip);
    });
  },

  renderFilters: function () {
    var sel = document.getElementById("filter-cat");
    if (!sel) return;
    var current = W.ui.state.filterCat;
    sel.innerHTML = "";

    var allOpt = document.createElement("option");
    allOpt.value = "all";
    allOpt.textContent = W.t("filters.allCategories");
    sel.appendChild(allOpt);

    W.store.categoryNames().sort().forEach(function (name) {
      var o = document.createElement("option");
      o.value = name;
      o.textContent = name;
      sel.appendChild(o);
    });
    sel.value = current;
    if (sel.value !== current) {
      // the selected category no longer exists
      W.ui.state.filterCat = "all";
      sel.value = "all";
    }
  },

  renderList: function () {
    var list = this.visible();
    var cards = document.getElementById("cards");
    var tbody = document.getElementById("tbody");
    var empty = document.getElementById("empty");
    var countEl = document.getElementById("result-count");

    var hasContacts = W.store.contacts.length > 0;

    // Empty state: no contacts at all vs. no search results
    if (empty) {
      empty.hidden = list.length > 0;
      if (!list.length) {
        var title = document.getElementById("empty-title");
        var body = document.getElementById("empty-body");
        if (hasContacts) {
          if (title) title.textContent = W.t("empty.noResults");
          if (body) body.textContent = W.t("empty.noResultsBody");
        } else {
          if (title) title.textContent = W.t("empty.title");
          if (body) body.textContent = W.t("empty.body");
        }
      }
    }

    // Result counter (only when a filter narrows things down)
    if (countEl) {
      if (list.length !== W.store.contacts.length && W.store.contacts.length) {
        countEl.hidden = false;
        countEl.textContent = list.length + " / " + W.store.contacts.length;
      } else {
        countEl.hidden = true;
      }
    }

    if (cards) {
      cards.innerHTML = "";
      list.forEach(function (c) { cards.appendChild(this.card(c)); }, this);
    }
    if (tbody) {
      tbody.innerHTML = "";
      list.forEach(function (c) { tbody.appendChild(this.row(c)); }, this);
    }
  },

  /* ------------------------------------------------------------------
   * Mobile card
   * ---------------------------------------------------------------- */
  card: function (c) {
    var label = W.store.label(c);
    var self = this;

    var el = document.createElement("article");
    el.className = "card";
    el.setAttribute("data-id", c.id);

    var initial = (c.name || c.organization || "?").trim().charAt(0);
    var head = document.createElement("div");
    head.className = "card-head";
    head.innerHTML =
      '<div class="avatar"></div>' +
      '<div class="card-titles">' +
        '<div class="card-name"></div>' +
        '<div class="card-org"></div>' +
      '</div>';
    head.querySelector(".avatar").textContent = initial;
    head.querySelector(".card-name").textContent = c.name || c.organization || "—";
    var orgLine = c.name && c.organization ? c.organization : "";
    head.querySelector(".card-org").textContent = orgLine;
    if (!orgLine) head.querySelector(".card-org").remove();
    el.appendChild(head);

    // Badges: WhatsApp + category
    var badges = document.createElement("div");
    badges.className = "card-badges";
    badges.appendChild(this.badge(c.has_whatsapp ? "badge-wa" : "badge-nowa",
      c.has_whatsapp ? W.t("card.whatsapp") : W.t("card.noWhatsapp"),
      c.has_whatsapp ? "wa" : "nowa"));
    if (c.category) badges.appendChild(this.badge("badge-cat", c.category, "cat"));
    if (c.phone_secondary) {
      badges.appendChild(this.badge("badge-extra", W.t("card.secondary"), "extra"));
    }
    el.appendChild(badges);

    // Phone rows with one-tap actions
    var phones = document.createElement("div");
    phones.className = "card-phones";
    phones.appendChild(this.phoneRow(c.phone, c.has_whatsapp, label, false));
    if (c.phone_secondary) {
      phones.appendChild(this.phoneRow(c.phone_secondary, c.has_whatsapp, label, true));
    }
    el.appendChild(phones);

    // Notes
    if (c.notes) {
      var notes = document.createElement("div");
      notes.className = "notes";
      notes.textContent = c.notes;
      el.appendChild(notes);
    }

    // Footer: who added it + edit/delete
    var foot = document.createElement("div");
    foot.className = "card-foot";
    var meta = document.createElement("span");
    meta.textContent = this.addedLabel(c);
    foot.appendChild(meta);
    foot.appendChild(document.createElement("span")).className = "spacer";

    var edit = this.miniBtn("edit", W.t("btn.edit"), "a11y.edit", label);
    edit.addEventListener("click", function () { W.app.openContact(c.id); });
    foot.appendChild(edit);

    if (W.store.isAdmin()) {
      var del = this.miniBtn("danger", W.t("btn.delete"), "a11y.delete", label);
      del.addEventListener("click", function () { W.app.confirmDelete(c.id); });
      foot.appendChild(del);
    }
    el.appendChild(foot);

    return el;
  },

  badge: function (cls, text, kind) {
    var b = document.createElement("span");
    b.className = "badge " + cls;
    if (kind === "wa") {
      b.insertAdjacentHTML("afterbegin",
        '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.7 15L2 22l5.2-1.3A10 10 0 1 0 12 2Zm5.6 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.2-.9-2.7-1.2-4.4-4-4.6-4.2-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.5c-.1.2-.3.3-.1.6.1.3.6 1.1 1.3 1.7.9.8 1.6 1 1.9 1.1.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.2.1.7-.1 1.3Z"/></svg>');
    }
    b.appendChild(document.createTextNode(text));
    return b;
  },

  /** A phone row: the number, then the WhatsApp + call buttons. */
  phoneRow: function (digits, hasWa, label, isSecondary) {
    var row = document.createElement("div");
    row.className = "phone-row";

    var top = document.createElement("div");
    top.className = "phone-top";

    var num = document.createElement("div");
    num.className = "phone-num";
    num.textContent = W.formatPhoneDisplay(digits);
    top.appendChild(num);

    if (isSecondary) {
      var tag = document.createElement("span");
      tag.className = "phone-tag";
      tag.textContent = W.t("card.secondary");
      top.appendChild(tag);
    }
    row.appendChild(top);

    // Action buttons live in their own row so they never get squeezed.
    var actions = document.createElement("div");
    actions.className = "phone-actions";

    if (hasWa) {
      var wa = document.createElement("a");
      wa.className = "action-btn action-wa";
      wa.href = W.waLink(digits);
      wa.target = "_blank";
      wa.rel = "noopener noreferrer";
      wa.setAttribute("aria-label", W.t("a11y.whatsapp", { name: label }));
      wa.innerHTML =
        '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.7 15L2 22l5.2-1.3A10 10 0 1 0 12 2Zm5.6 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.2-.9-2.7-1.2-4.4-4-4.6-4.2-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.5c-.1.2-.3.3-.1.6.1.3.6 1.1 1.3 1.7.9.8 1.6 1 1.9 1.1.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.2.1.7-.1 1.3Z"/></svg>';
      wa.appendChild(document.createTextNode(W.t("card.whatsapp")));
      actions.appendChild(wa);
    }

    var call = document.createElement("a");
    call.className = "action-btn action-call";
    call.href = W.telLink(digits);
    call.setAttribute("aria-label", W.t("a11y.call", { name: label }));
    call.innerHTML =
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.1.36 2.3.55 3.6.55a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.56 3.6a1 1 0 0 1-.25 1l-2.2 2.2Z"/></svg>';
    call.appendChild(document.createTextNode(W.t("card.call")));
    actions.appendChild(call);

    // A single button (no WhatsApp) should fill the whole row.
    if (actions.children.length === 1) actions.classList.add("single");

    row.appendChild(actions);
    return row;
  },

  miniBtn: function (cls, text, ariaKey, label) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "mini-btn " + cls;
    b.textContent = text;
    if (ariaKey) b.setAttribute("aria-label", W.t(ariaKey, { name: label }));
    return b;
  },

  addedLabel: function (c) {
    var who = c.created_by_name || (c.created_by ? "" : "");
    var when = "";
    if (c.created_at) {
      var d = new Date(c.created_at);
      if (!isNaN(d.getTime())) {
        when = d.toLocaleDateString(W.lang === "ar" ? "ar-EG" : "en-GB", {
          year: "numeric", month: "short", day: "numeric"
        });
      }
    }
    var parts = [];
    if (who) parts.push(W.t("card.addedBy") + " " + who);
    if (when) parts.push(W.t("card.on") + " " + when);
    return parts.join(" · ");
  },

  /* ------------------------------------------------------------------
   * Desktop table row
   * ---------------------------------------------------------------- */
  row: function (c) {
    var label = W.store.label(c);
    var tr = document.createElement("tr");
    tr.setAttribute("data-id", c.id);

    tr.appendChild(this.td(c.name || "—", "td-name"));
    tr.appendChild(this.td(c.organization || "—", "td-org"));

    // Phone cell: number + buttons
    var tdPhone = document.createElement("td");
    var num = document.createElement("div");
    num.className = "td-phone";
    num.textContent = W.formatPhoneDisplay(c.phone);
    tdPhone.appendChild(num);
    if (c.phone_secondary) {
      var sec = document.createElement("div");
      sec.className = "td-phone";
      sec.style.fontSize = ".8rem";
      sec.style.opacity = ".75";
      sec.textContent = W.formatPhoneDisplay(c.phone_secondary);
      tdPhone.appendChild(sec);
    }
    tr.appendChild(tdPhone);

    // WhatsApp column
    var tdWa = document.createElement("td");
    tdWa.className = "td-wa";
    var waBadge = this.badge(c.has_whatsapp ? "badge-wa" : "badge-nowa",
      c.has_whatsapp ? W.t("form.yes") : W.t("form.no"),
      c.has_whatsapp ? "wa" : "nowa");
    tdWa.appendChild(waBadge);
    tr.appendChild(tdWa);

    tr.appendChild(this.td(c.category || "—", ""));
    tr.appendChild(this.td(c.notes || "—", "td-notes"));
    tr.appendChild(this.td(this.addedLabel(c), "td-added"));

    // Actions
    var tdAct = document.createElement("td");
    var wrap = document.createElement("div");
    wrap.className = "row-actions";

    if (c.has_whatsapp) {
      var wa = document.createElement("a");
      wa.className = "action-btn action-wa";
      wa.href = W.waLink(c.phone);
      wa.target = "_blank";
      wa.rel = "noopener noreferrer";
      wa.setAttribute("aria-label", W.t("a11y.whatsapp", { name: label }));
      wa.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.7 15L2 22l5.2-1.3A10 10 0 1 0 12 2Zm5.6 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.2-.9-2.7-1.2-4.4-4-4.6-4.2-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.5c-.1.2-.3.3-.1.6.1.3.6 1.1 1.3 1.7.9.8 1.6 1 1.9 1.1.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.2.1.7-.1 1.3Z"/></svg>';
      wa.appendChild(document.createTextNode(W.t("card.whatsapp")));
      wrap.appendChild(wa);
    }

    var call = document.createElement("a");
    call.className = "action-btn action-call";
    call.href = W.telLink(c.phone);
    call.setAttribute("aria-label", W.t("a11y.call", { name: label }));
    call.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.1.36 2.3.55 3.6.55a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.56 3.6a1 1 0 0 1-.25 1l-2.2 2.2Z"/></svg>';
    call.appendChild(document.createTextNode(W.t("card.call")));
    wrap.appendChild(call);

    var edit = document.createElement("button");
    edit.type = "button";
    edit.className = "icon-btn";
    edit.setAttribute("aria-label", W.t("a11y.edit", { name: label }));
    edit.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"/></svg>';
    edit.addEventListener("click", function () { W.app.openContact(c.id); });
    wrap.appendChild(edit);

    if (W.store.isAdmin()) {
      var del = document.createElement("button");
      del.type = "button";
      del.className = "icon-btn danger";
      del.setAttribute("aria-label", W.t("a11y.delete", { name: label }));
      del.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>';
      del.addEventListener("click", function () { W.app.confirmDelete(c.id); });
      wrap.appendChild(del);
    }

    tdAct.appendChild(wrap);
    tr.appendChild(tdAct);
    return tr;
  },

  td: function (text, cls) {
    var td = document.createElement("td");
    td.textContent = text;
    if (cls) td.className = cls;
    return td;
  },

  /* ------------------------------------------------------------------
   * Admin: categories list
   * ---------------------------------------------------------------- */
  renderCategories: function () {
    var host = document.getElementById("cat-list");
    if (!host) return;
    host.innerHTML = "";

    var per = W.store.stats().perCategory;
    W.store.categoryNames().forEach(function (name) {
      var cat = W.store.categories.find(function (c) { return c.name === name; });
      var li = document.createElement("li");
      li.className = "cat-item";

      var nameEl = document.createElement("span");
      nameEl.className = "cat-name";
      nameEl.textContent = name;
      li.appendChild(nameEl);

      var count = document.createElement("span");
      count.className = "cat-count";
      count.textContent = (per[name] || 0) + "";
      li.appendChild(count);

      if (cat) {
        var rename = this.miniBtn("", W.t("cat.rename"), null, name);
        rename.addEventListener("click", function () {
          var next = window.prompt(W.t("cat.rename"), name);
          if (next && next.trim() && next.trim() !== name) {
            W.store.renameCategory(cat.id, next.trim())
              .then(function () { W.ui.renderCategories(); W.ui.render(); })
              .catch(function () { W.app.toast(W.t("toast.error"), "err"); });
          }
        });
        li.appendChild(rename);

        var del = this.miniBtn("danger", W.t("cat.delete"), null, name);
        del.addEventListener("click", function () {
          var count2 = per[name] || 0;
          var msg = count2
            ? W.t("cat.inUse", { count: count2 })
            : W.t("confirm.deleteText", { name: name });
          if (!window.confirm(msg)) return;
          W.store.removeCategory(cat.id)
            .then(function () {
              W.ui.renderCategories();
              W.ui.render();
              W.app.toast(W.t("cat.deleted", { name: name }), "ok");
            })
            .catch(function () { W.app.toast(W.t("toast.error"), "err"); });
        });
        li.appendChild(del);
      }

      host.appendChild(li);
    });
  }
};
