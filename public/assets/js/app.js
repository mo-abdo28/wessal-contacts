/* =====================================================================
 * Wessal Contacts — application controller
 * ---------------------------------------------------------------------
 * Wires everything together: login, language & theme switching, the
 * add/edit/delete flow, the import wizard, and toasts.
 * ===================================================================== */
window.W = window.W || {};

W.app = {
  /* ------------------------------------------------------------------
   * Boot
   * ---------------------------------------------------------------- */
  init: function () {
    this.bindLogin();
    this.bindHeader();
    this.bindFilters();
    this.bindContactForm();
    this.bindAdmin();
    this.bindImport();
    this.bindCategories();

    // Remembered preferences
    this.setLang(localStorage.getItem("wessal-lang") || this.detectLang(), true);
    this.setTheme(localStorage.getItem("wessal-theme") || "light", true);

    var self = this;

    if (!W.isOnline) {
      // No database configured.
      if (W.previewMode() === "locked") {
        // Published site with no database: show the login screen and
        // nothing else. No directory, no admin tools, no sample data.
        self.showLogin();
        self.lockLogin();
        return;
      }

      // Local preview: no server configured, so skip authentication and
      // open the app directly with the sample data.
      W.store.previewRole = localStorage.getItem("wessal-preview-role") || "admin";
      W.store.identify(null).then(function () {
        W.store.role = W.store.previewRole;
        // Pretend we are signed in so new/imported rows are attributed
        // the same way they would be in the real app.
        self.previewUser();
        self.showApp();
        self.refresh();
      });
    } else {
      this.showLogin();
      this.tryRestore();
    }

    // Keep the pending badge and the approval list fresh, even when the
    // admin leaves the page open on their phone.
    var self = this;
    setInterval(function () {
      if (!W.store.user) return;
      W.store.loadReview().then(function () {
        self.updateBadge();
        var sheet = document.getElementById("activity-sheet");
        if (sheet && !sheet.hidden) W.ui.renderActivity();
      });
    }, 30000);
  },

  /** Live updates: the list refreshes when a teammate changes something. */
  startLive: function () {
    var self = this;
    if (!W.isOnline || this._liveStarted) return;
    this._liveStarted = true;
    W.store.startRealtime(function () { self.refresh(); });
  },

  detectLang: function () {
    var nav = (navigator.language || "ar").toLowerCase();
    return nav.indexOf("ar") === 0 ? "ar" : "en";
  },

  /** Preview mode: pretend we are signed in with the matching account. */
  previewUser: function () {
    var isAdmin = W.store.role === "admin";
    W.store.user = {
      id: null,
      username: isAdmin ? "Abdo" : "wessal",
      email: (isAdmin ? "abdo" : "wessal") + "@wessal.app"
    };
  },

  /* ------------------------------------------------------------------
   * Login / session
   * ---------------------------------------------------------------- */
  showLogin: function () {
    document.getElementById("login-screen").hidden = false;
    document.getElementById("app").hidden = true;
    setTimeout(function () {
      var el = document.getElementById("login-username");
      if (el) el.focus();
    }, 60);
  },

  /**
   * The site is published but no database is connected yet: say so
   * plainly and refuse to pretend that a sign-in can succeed. Nobody
   * can reach the directory or the admin tools without a real login.
   */
  lockLogin: function () {
    var notice = document.getElementById("login-notice");
    var btn = document.getElementById("login-submit");
    var user = document.getElementById("login-username");
    var pass = document.getElementById("login-password");
    var help = document.querySelector(".auth-foot");

    if (notice) {
      notice.hidden = false;
      notice.textContent = W.t("auth.noDb");
    }
    if (btn) btn.disabled = true;
    if (user) user.disabled = true;
    if (pass) pass.disabled = true;
    if (help) help.textContent = W.t("auth.noDbHelp");
  },

  showApp: function () {
    document.getElementById("login-screen").hidden = true;
    document.getElementById("app").hidden = false;
  },

  tryRestore: function () {
    var self = this;
    W.db.load()
      .then(function () { return W.db.restore(); })
      .then(function (user) {
        if (user) {
          return W.store.identify(user).then(function () {
            self.showApp();
            self.startLive();
            return self.refresh();
          });
        }
        self.showLogin();
        return null;
      })
      .catch(function () { self.showLogin(); });
  },

  bindLogin: function () {
    var self = this;
    var form = document.getElementById("login-form");
    var err = document.getElementById("login-error");
    var btn = document.getElementById("login-submit");

    var pwToggle = document.getElementById("pw-toggle");
    var pwInput = document.getElementById("login-password");
    if (pwToggle && pwInput) {
      pwToggle.addEventListener("click", function () {
        var showing = pwInput.type === "text";
        pwInput.type = showing ? "password" : "text";
        pwToggle.setAttribute("aria-label", W.t(showing ? "auth.showPassword" : "auth.hidePassword"));
      });
    }

    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var u = document.getElementById("login-username").value.trim();
      var p = document.getElementById("login-password").value;

      // No database connected: the login can never work, so say so.
      if (!W.isOnline && W.previewMode() === "locked") {
        err.hidden = false;
        err.textContent = W.t("auth.noDb");
        return;
      }

      if (!u || !p) {
        err.hidden = false;
        err.textContent = W.t("auth.error.empty");
        return;
      }
      err.hidden = true;
      btn.disabled = true;
      btn.querySelector("span").textContent = W.t("auth.signingIn");

      W.db.signIn(u, p)
        .then(function (res) {
          if (res.error || !res.data || !res.data.user) {
            var e2 = new Error("invalid");
            if (res && res.error && /fetch|network/i.test(res.error.message || "")) {
              e2.message = "network";
            }
            throw e2;
          }
          return W.store.identify(res.data.user).then(function () {
            document.getElementById("login-password").value = "";
            self.showApp();
            self.startLive();
            return self.refresh();
          });
        })
        .catch(function (e) {
          var msg = W.t("auth.error.invalid");
          if (e && e.message === "network") msg = W.t("auth.error.network");
          else if (e && e.message === "config") msg = W.t("auth.error.config");
          err.hidden = false;
          err.textContent = msg;
        })
        .then(function () {
          btn.disabled = false;
          btn.querySelector("span").textContent = W.t("auth.signIn");
        });
    });
  },

  /* ------------------------------------------------------------------
   * Header: language, theme, logout, role chip
   * ---------------------------------------------------------------- */
  bindHeader: function () {
    var self = this;

    var langBtn = document.getElementById("lang-toggle");
    if (langBtn) {
      langBtn.addEventListener("click", function () {
        var next = W.lang === "ar" ? "en" : "ar";
        self.setLang(next);
        localStorage.setItem("wessal-lang", next);
      });
    }

    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        self.setTheme(next);
        localStorage.setItem("wessal-theme", next);
      });
    }

    var logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        if (!W.isOnline) {
          // Preview mode: return to the start of the app.
          window.location.reload();
          return;
        }
        W.db.signOut().then(function () {
          W.store.user = null;
          W.store.role = "member";
          self.showLogin();
        });
      });
    }

    var previewRole = document.getElementById("preview-role");
    if (previewRole) {
      previewRole.addEventListener("change", function () {
        W.store.previewRole = previewRole.value;
        W.store.role = previewRole.value;
        localStorage.setItem("wessal-preview-role", previewRole.value);
        self.previewUser();
        self.applyRoleUI();
        W.ui.render();
      });
    }
  },

  /** Switch language: updates text, direction and the toggle label. */
  setLang: function (lang, silent) {
    if (W.LANGS.indexOf(lang) === -1) lang = W.DEFAULT_LANG;
    W.lang = lang;

    var html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    var label = document.getElementById("lang-label");
    if (label) label.textContent = lang === "ar" ? "EN" : "ع";

    var langBtn = document.getElementById("lang-toggle");
    if (langBtn) langBtn.setAttribute("aria-label", W.t("header.language"));

    W.applyTranslations(document);
    if (!silent) {
      W.ui.render();
      var catSheet = document.getElementById("cat-sheet");
      if (catSheet && !catSheet.hidden) W.ui.renderCategories();
      var actSheet = document.getElementById("activity-sheet");
      if (actSheet && !actSheet.hidden) W.ui.renderActivity();
    }
  },

  setTheme: function (theme) {
    document.documentElement.setAttribute("data-theme", theme);
  },

  /** Show/hide admin-only UI based on the role. */
  applyRoleUI: function () {
    var admin = W.store.isAdmin();
    var adminBtn = document.getElementById("admin-open");
    if (adminBtn) adminBtn.hidden = !admin;

    var chip = document.getElementById("role-chip");
    var chipText = document.getElementById("role-chip-text");
    if (chip && chipText) {
      chipText.textContent = W.t(admin ? "role.admin" : "role.member");
      chip.hidden = !admin;
    }

    var banner = document.getElementById("preview-banner");
    if (banner) banner.hidden = W.isOnline;

    var previewSelect = document.getElementById("preview-role");
    if (previewSelect) previewSelect.value = W.store.role;

    this.updateBadge();
  },

  /* ------------------------------------------------------------------
   * Search & filters
   * ---------------------------------------------------------------- */
  bindFilters: function () {
    var self = this;
    var search = document.getElementById("search");
    var clear = document.getElementById("search-clear");

    if (search) {
      var timer = null;
      search.addEventListener("input", function () {
        clear.hidden = !search.value;
        clearTimeout(timer);
        timer = setTimeout(function () {
          W.ui.state.query = search.value;
          W.ui.render();
        }, 120);
      });
    }
    if (clear) {
      clear.addEventListener("click", function () {
        search.value = "";
        clear.hidden = true;
        W.ui.state.query = "";
        W.ui.render();
        search.focus();
      });
    }

    var fw = document.getElementById("filter-wa");
    if (fw) {
      fw.addEventListener("change", function () {
        W.ui.state.filterWa = fw.value;
        W.ui.render();
      });
    }

    var fc = document.getElementById("filter-cat");
    if (fc) {
      fc.addEventListener("change", function () {
        W.ui.state.filterCat = fc.value;
        W.ui.render();
      });
    }

    var fs = document.getElementById("filter-sort");
    if (fs) {
      fs.addEventListener("change", function () {
        W.ui.state.sort = fs.value;
        W.ui.render();
      });
    }
  },

  /* ------------------------------------------------------------------
   * Add / edit contact
   * ---------------------------------------------------------------- */
  bindContactForm: function () {
    var self = this;

    var addTop = document.getElementById("add-top");
    if (addTop) addTop.addEventListener("click", function () { self.openContact(null); });

    var fab = document.getElementById("fab-add");
    if (fab) fab.addEventListener("click", function () { self.openContact(null); });

    // WhatsApp yes/no segmented control
    var group = document.getElementById("f-wa-group");
    if (group) {
      group.addEventListener("click", function (e) {
        var btn = e.target.closest(".seg");
        if (!btn) return;
        group.querySelectorAll(".seg").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
      });
    }

    // Live duplicate warning while typing
    var phone = document.getElementById("f-phone");
    if (phone) {
      phone.addEventListener("input", function () { self.checkDuplicate(); });
      phone.addEventListener("blur", function () { self.checkDuplicate(); });
    }
    var phone2 = document.getElementById("f-phone2");
    if (phone2) phone2.addEventListener("input", function () { self.checkDuplicate(); });

    var form = document.getElementById("contact-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        self.saveContact();
      });
    }

    document.querySelectorAll("[data-close-contact]").forEach(function (b) {
      b.addEventListener("click", function () { self.closeSheet("contact-sheet"); });
    });
  },

  /** Open the add/edit sheet. id = null means "add". */
  openContact: function (id) {
    var form = document.getElementById("contact-form");
    var title = document.getElementById("contact-sheet-title");
    var sheet = document.getElementById("contact-sheet");
    if (!form || !sheet) return;

    W.ui.state.editingId = id || null;
    form.reset();

    var waGroup = document.getElementById("f-wa-group");
    if (waGroup) {
      waGroup.querySelectorAll(".seg").forEach(function (b) {
        b.classList.toggle("active", b.dataset.wa === "true");
      });
    }

    // Category options
    var catSel = document.getElementById("f-cat");
    if (catSel) {
      catSel.innerHTML = "";
      var names = W.store.categoryNames().sort();
      names.forEach(function (name) {
        var o = document.createElement("option");
        o.value = name;
        o.textContent = name;
        catSel.appendChild(o);
      });
      if (!names.length) {
        var o2 = document.createElement("option");
        o2.value = "Other";
        o2.textContent = "Other";
        catSel.appendChild(o2);
      }
    }

    if (id) {
      var c = W.store.contacts.find(function (x) { return x.id === id; });
      if (c) {
        document.getElementById("f-name").value = c.name || "";
        document.getElementById("f-org").value = c.organization || "";
        document.getElementById("f-phone").value = c.phone || "";
        document.getElementById("f-phone2").value = c.phone_secondary || "";
        document.getElementById("f-notes").value = c.notes || "";
        if (catSel) catSel.value = c.category || "Other";
        if (waGroup) {
          waGroup.querySelectorAll(".seg").forEach(function (b) {
            b.classList.toggle("active", b.dataset.wa === String(!!c.has_whatsapp));
          });
        }
        if (title) title.textContent = W.t("form.editTitle");
      }
    } else {
      if (title) title.textContent = W.t("form.addTitle");
      if (catSel && catSel.options.length) catSel.value = "Other";
    }

    var dup = document.getElementById("dup-warning");
    if (dup) dup.hidden = true;

    sheet.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(function () {
      var first = document.getElementById("f-name");
      if (first) first.focus();
    }, 120);
  },

  /** Show/hide the duplicate warning under the phone field. */
  checkDuplicate: function () {
    var warn = document.getElementById("dup-warning");
    var text = document.getElementById("dup-text");
    if (!warn) return;

    var input = document.getElementById("f-phone").value.trim();
    var input2 = document.getElementById("f-phone2").value.trim();
    var raw = input || input2;
    if (!raw) { warn.hidden = true; return; }

    var res = W.normalizePhone(raw);
    if (!res || !res.valid) { warn.hidden = true; return; }

    var existing = W.store.findByNumber(res.digits, W.ui.state.editingId);
    if (!existing) { warn.hidden = true; return; }

    warn.hidden = false;
    if (text) {
      text.textContent = W.t("dup.body", {
        phone: res.digits,
        name: W.store.label(existing)
      });
    }
  },

  saveContact: function () {
    var self = this;
    var name = document.getElementById("f-name").value.trim();
    var org = document.getElementById("f-org").value.trim();
    var phoneRaw = document.getElementById("f-phone").value.trim();
    var phone2Raw = document.getElementById("f-phone2").value.trim();
    var notes = document.getElementById("f-notes").value.trim();
    var catSel = document.getElementById("f-cat");
    var category = catSel ? catSel.value : "Other";

    var activeWa = document.querySelector("#f-wa-group .seg.active");
    var hasWa = activeWa ? activeWa.dataset.wa === "true" : true;

    var phoneRes = W.normalizePhone(phoneRaw);

    if (!name && !org) {
      this.toast(W.t("form.error.nameOrg"), "err");
      return;
    }
    if (!phoneRes || !phoneRes.valid) {
      this.toast(W.t("form.error.phone"), "err");
      return;
    }

    var values = {
      name: name,
      organization: org,
      phone: phoneRaw,
      phone2: phone2Raw,
      has_whatsapp: hasWa,
      category: category,
      notes: notes
    };

    // Duplicate check — warn, but let the admin decide.
    var existing = W.store.findByNumber(phoneRes.digits, W.ui.state.editingId);
    if (existing) {
      var msg = W.t("confirm.saveText", {
        phone: phoneRes.digits,
        name: W.store.label(existing)
      });
      if (!window.confirm(msg)) return;
    }

    var editingId = W.ui.state.editingId;

    // A member's edit is not applied straight away: it is sent to the
    // admin as a change request and only lands once it is approved.
    var needsApproval = !!editingId && !W.store.isAdmin() && W.store.approvalsReady;

    var p = needsApproval
      ? W.store.requestEdit(editingId, values)
      : (editingId
        ? W.store.editContact(editingId, values)
        : W.store.addContact(values));

    p.then(function () {
      return self.refresh();
    })
     .then(function () {
       self.closeSheet("contact-sheet");
       self.updateBadge();
       self.toast(W.t(needsApproval
         ? "toast.sentForApproval"
         : (editingId ? "toast.updated" : "toast.added")), "ok");
     })
     .catch(function (err) {
       console.error(err);
       if (err && err.message === "nochange") {
         self.toast(W.t("act.noChanges"), "err");
         return;
       }
       self.toast(W.t("toast.error"), "err");
     });
  },

  /* ------------------------------------------------------------------
   * Delete (admin only)
   * ---------------------------------------------------------------- */
  confirmDelete: function (id) {
    var self = this;
    if (!W.store.isAdmin()) return;

    var c = W.store.contacts.find(function (x) { return x.id === id; });
    if (!c) return;

    var sheet = document.getElementById("confirm-sheet");
    var text = document.getElementById("confirm-text");
    var ok = document.getElementById("confirm-ok");
    if (!sheet) return;

    if (text) text.textContent = W.t("confirm.deleteText", { name: W.store.label(c) });
    sheet.hidden = false;

    if (ok) {
      ok.onclick = function () {
        W.store.removeContact(id)
          .then(function () {
            return self.refresh();
          })
          .then(function () {
            self.closeSheet("confirm-sheet");
            self.toast(W.t("toast.deleted"), "ok");
          })
          .catch(function (err) {
            console.error(err);
            self.closeSheet("confirm-sheet");
            self.toast(W.t("toast.error"), "err");
          });
      };
    }
  },

  /* ------------------------------------------------------------------
   * Admin panel
   * ---------------------------------------------------------------- */
  bindAdmin: function () {
    var self = this;

    var open = document.getElementById("admin-open");
    if (open) {
      open.addEventListener("click", function () {
        var p = document.getElementById("admin-panel");
        if (p) p.hidden = false;
        document.body.style.overflow = "hidden";
      });
    }
    document.querySelectorAll("[data-close-admin]").forEach(function (b) {
      b.addEventListener("click", function () { self.closeSheet("admin-panel"); });
    });
    document.querySelectorAll("[data-close-export]").forEach(function (b) {
      b.addEventListener("click", function () { self.closeSheet("export-sheet"); });
    });

    var imp = document.getElementById("admin-import");
    if (imp) {
      imp.addEventListener("click", function () {
        self.closeSheet("admin-panel");
        self.openImport();
      });
    }

    var exp = document.getElementById("admin-export");
    if (exp) {
      exp.addEventListener("click", function () {
        self.closeSheet("admin-panel");
        self.exportSheet();
      });
    }

    var cats = document.getElementById("admin-cats");
    if (cats) {
      cats.addEventListener("click", function () {
        self.closeSheet("admin-panel");
        var p = document.getElementById("cat-sheet");
        if (p) {
          p.hidden = false;
          document.body.style.overflow = "hidden";
        }
        W.ui.renderCategories();
      });
    }

    document.querySelectorAll("[data-close-confirm]").forEach(function (b) {
      b.addEventListener("click", function () { self.closeSheet("confirm-sheet"); });
    });

    // Approvals + activity log
    var act = document.getElementById("admin-activity");
    if (act) {
      act.addEventListener("click", function () {
        self.closeSheet("admin-panel");
        self.openActivity("pending");
      });
    }
    document.querySelectorAll("[data-close-activity]").forEach(function (b) {
      b.addEventListener("click", function () { self.closeSheet("activity-sheet"); });
    });
    document.querySelectorAll("[data-act-tab]").forEach(function (b) {
      b.addEventListener("click", function () { self.switchActivityTab(b.dataset.actTab); });
    });
  },

  /** Open the export sheet and let the user pick CSV or Excel. */
  exportSheet: function () {
    var self = this;
    if (!W.store.isAdmin()) return;

    var sheet = document.getElementById("export-sheet");
    if (!sheet) return;

    var count = document.getElementById("export-count");
    if (count) count.textContent = W.t("export.done", { count: W.store.contacts.length });

    sheet.hidden = false;
    document.body.style.overflow = "hidden";

    var csv = document.getElementById("export-csv");
    if (csv) {
      csv.onclick = function () {
        W.io.downloadCsv(W.store.contacts);
        self.closeSheet("export-sheet");
        self.toast(W.t("export.done", { count: W.store.contacts.length }), "ok");
      };
    }

    var xlsx = document.getElementById("export-xlsx");
    if (xlsx) {
      xlsx.onclick = function () {
        self.closeSheet("export-sheet");
        W.io.downloadXlsx(W.store.contacts).then(function () {
          self.toast(W.t("export.done", { count: W.store.contacts.length }), "ok");
        });
      };
    }
  },

  /* ------------------------------------------------------------------
   * Categories
   * ---------------------------------------------------------------- */
  bindCategories: function () {
    var self = this;
    document.querySelectorAll("[data-close-cats]").forEach(function (b) {
      b.addEventListener("click", function () { self.closeSheet("cat-sheet"); });
    });

    var form = document.getElementById("cat-add-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = document.getElementById("cat-new");
        var name = input.value.trim();
        if (!name) return;
        W.store.addCategory(name)
          .then(function () {
            input.value = "";
            W.ui.renderCategories();
            W.ui.render();
            self.toast(W.t("toast.saved"), "ok");
          })
          .catch(function (err) {
            self.toast(err.message === "duplicate" ? W.t("toast.duplicate") : W.t("toast.error"), "err");
          });
      });
    }
  },

  /* ------------------------------------------------------------------
   * Import wizard
   * ---------------------------------------------------------------- */
  bindImport: function () {
    var self = this;

    document.querySelectorAll("[data-close-import]").forEach(function (b) {
      b.addEventListener("click", function () { self.closeSheet("import-sheet"); });
    });

    var fileInput = document.getElementById("file-input");
    var dropzone = document.getElementById("dropzone");

    if (fileInput) {
      fileInput.addEventListener("change", function () {
        if (fileInput.files && fileInput.files[0]) self.handleFile(fileInput.files[0]);
      });
    }

    if (dropzone) {
      ["dragenter", "dragover"].forEach(function (ev) {
        dropzone.addEventListener(ev, function (e) {
          e.preventDefault();
          dropzone.classList.add("dragover");
        });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        dropzone.addEventListener(ev, function (e) {
          e.preventDefault();
          dropzone.classList.remove("dragover");
        });
      });
      dropzone.addEventListener("drop", function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) self.handleFile(f);
      });
    }

    var back = document.getElementById("import-back");
    if (back) back.addEventListener("click", function () { self.importStep(1); });

    var back2 = document.getElementById("import-back2");
    if (back2) back2.addEventListener("click", function () { self.importStep(2); });

    var preview = document.getElementById("import-preview");
    if (preview) preview.addEventListener("click", function () { self.buildImportPreview(); });

    var run = document.getElementById("import-run");
    if (run) run.addEventListener("click", function () { self.runImport(); });
  },

  importState: null,

  openImport: function () {
    var sheet = document.getElementById("import-sheet");
    if (!sheet) return;
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
    this.importStep(1);
  },

  importStep: function (n) {
    ["import-pane-1", "import-pane-2", "import-pane-3"].forEach(function (id, i) {
      var el = document.getElementById(id);
      if (el) el.hidden = (i + 1) !== n;
    });
    document.querySelectorAll("#import-steps .step").forEach(function (s) {
      var step = parseInt(s.dataset.step, 10);
      s.classList.toggle("active", step === n);
      s.classList.toggle("done", step < n);
    });
  },

  handleFile: function (file) {
    var self = this;
    this.openImport();

    W.io.readFile(file)
      .then(function (parsed) {
        self.importState = parsed;
        self.importState.mapping = W.io.guessMapping(parsed.headers);
        self.renderMapping();
        self.importStep(2);
      })
      .catch(function (err) {
        console.error(err);
        self.toast(W.t("import.error.parse"), "err");
      });
  },

  renderMapping: function () {
    var host = document.getElementById("mapping-grid");
    if (!host || !W.app.importState) return;
    host.innerHTML = "";

    W.IMPORT_FIELDS.forEach(function (field) {
      var row = document.createElement("div");
      row.className = "map-row";

      var label = document.createElement("label");
      label.textContent = W.t(field.label);
      row.appendChild(label);

      var arrow = document.createElement("span");
      arrow.className = "map-arrow";
      arrow.textContent = "←";
      row.appendChild(arrow);

      var sel = document.createElement("select");
      var none = document.createElement("option");
      none.value = "-1";
      none.textContent = field.required
        ? W.t("import.notMapped")
        : W.t("import.ignoreColumn");
      sel.appendChild(none);

      W.app.importState.headers.forEach(function (h, i) {
        var o = document.createElement("option");
        o.value = String(i);
        o.textContent = h || (W.t("import.row") + " " + (i + 1));
        sel.appendChild(o);
      });

      var current = W.app.importState.mapping[field.key];
      sel.value = String(current === undefined ? -1 : current);
      sel.addEventListener("change", function () {
        W.app.importState.mapping[field.key] = parseInt(sel.value, 10);
      });
      row.appendChild(sel);

      host.appendChild(row);
    });
  },

  buildImportPreview: function () {
    if (!this.importState) return;

    var mapping = this.importState.mapping;
    var phoneCol = mapping.phone;
    if (phoneCol === undefined || phoneCol === null || phoneCol < 0) {
      this.toast(W.t("import.error.noPhone"), "err");
      return;
    }

    var used = W.store.usedPrimaryNumbers();
    var usedAll = W.store.usedNumbers();
    var built = W.io.buildRows(
      this.importState.headers,
      this.importState.rows,
      mapping,
      used,
      usedAll
    );
    this.importState.built = built;

    // Summary
    var sum = document.getElementById("preview-summary");
    if (sum) {
      sum.innerHTML = "";
      var items = [
        { cls: "summary-ok", label: W.t("import.okCount"), n: built.rows.length },
        { cls: "summary-dup", label: W.t("import.dupCount"), n: built.duplicates.length },
        { cls: "summary-bad", label: W.t("import.badCount"), n: built.invalid.length }
      ];
      if (built.shared.length) {
        items.push({ cls: "summary-shared", label: W.t("import.sharedCount"), n: built.shared.length });
      }
      items.forEach(function (item) {
        var d = document.createElement("div");
        d.className = "summary-row " + item.cls;
        d.innerHTML = '<span></span><b></b>';
        d.querySelector("span").textContent = item.label;
        d.querySelector("b").textContent = item.n;
        sum.appendChild(d);
      });
    }

    // Preview table
    var head = document.getElementById("preview-head");
    var body = document.getElementById("preview-body");
    if (head) head.innerHTML = "";
    if (body) body.innerHTML = "";

    var cols = [
      { label: W.t("import.row"), get: function (r) { return r.line; } },
      { label: W.t("col.name"), get: function (r) { return r.name || r.organization; } },
      { label: W.t("col.phone"), get: function (r) { return r.phone || "—"; } },
      { label: W.t("col.wa"), get: function (r) { return r.has_whatsapp ? W.t("form.yes") : W.t("form.no"); } },
      { label: W.t("col.category"), get: function (r) { return r.category; } }
    ];

    cols.forEach(function (c) {
      var th = document.createElement("th");
      th.textContent = c.label;
      head.appendChild(th);
    });

    var all = built.rows.concat(built.duplicates, built.invalid).slice(0, 200);
    all.forEach(function (r) {
      var tr = document.createElement("tr");
      if (!r.valid) tr.className = "row-bad";
      else if (r.duplicate) tr.className = "row-dup";
      else if (r.shared) tr.className = "row-shared";
      cols.forEach(function (c) {
        var td = document.createElement("td");
        td.textContent = c.get(r);
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });

    this.importStep(3);
  },

  runImport: function () {
    var self = this;
    if (!this.importState || !this.importState.built) return;

    var built = this.importState.built;
    var skipDupes = document.getElementById("skip-dupes");
    var skip = skipDupes ? skipDupes.checked : true;

    var toInsert = built.rows.slice();
    if (!skip) {
      built.duplicates.forEach(function (d) { toInsert.push(d); });
    }

    if (!toInsert.length) {
      this.closeSheet("import-sheet");
      this.toast(W.t("import.done", { count: 0 }), "ok");
      return;
    }

    var rows = toInsert.map(function (r) {
      return {
        name: r.name,
        organization: r.organization,
        phone: r.phone,
        phone_secondary: r.phone_secondary || null,
        has_whatsapp: r.has_whatsapp,
        category: r.category || "Other",
        notes: r.notes,
        created_by: W.store.user ? W.store.user.id : null,
        created_by_name: W.store.user ? (W.store.user.username || "") : ""
      };
    });

    var chain = Promise.resolve();
    if (W.isOnline) {
      chain = W.db.load().then(function (client) {
        return client.from("contacts").insert(rows).select();
      }).then(function (res) {
        if (res.error) throw res.error;
        return res.data;
      });
    } else {
      chain = Promise.resolve(rows.map(function (r) { return W.local.insert(r); }));
    }

    chain
      .then(function () {
        return self.refresh();
      })
      .then(function () {
        self.closeSheet("import-sheet");
        self.toast(W.t("import.done", { count: toInsert.length }), "ok");
        self.importState = null;
        var fi = document.getElementById("file-input");
        if (fi) fi.value = "";
        self.importStep(1);
      })
      .catch(function (err) {
        console.error(err);
        self.toast(W.t("toast.error"), "err");
      });
  },

  /* ------------------------------------------------------------------
   * Approvals + activity log
   * ---------------------------------------------------------------- */
  activityTab: "pending",

  /** Open the admin panel that shows pending changes and the log. */
  openActivity: function (tab) {
    var self = this;
    var sheet = document.getElementById("activity-sheet");
    if (!sheet) return;

    this.activityTab = tab || "pending";
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
    W.ui.renderActivity();

    W.store.loadReview().then(function () {
      self.updateBadge();
      W.ui.renderActivity();
    });
  },

  switchActivityTab: function (tab) {
    this.activityTab = tab;
    W.ui.renderActivity();
  },

  /** The admin approves a proposed change: it is applied immediately. */
  approveRequest: function (id) {
    var self = this;
    W.store.approveChange(id)
      .then(function () {
        self.updateBadge();
        W.ui.renderActivity();
        W.ui.render();
        self.toast(W.t("toast.approved"), "ok");
      })
      .catch(function (err) {
        console.error(err);
        self.toast(W.t("toast.error"), "err");
      });
  },

  /** The admin rejects a proposed change: nothing is applied. */
  rejectRequest: function (id, name) {
    var self = this;
    var sheet = document.getElementById("confirm-sheet");
    var title = document.getElementById("confirm-title");
    var text = document.getElementById("confirm-text");
    var ok = document.getElementById("confirm-ok");
    if (!sheet) return;

    if (title) title.textContent = W.t("act.rejectTitle");
    if (text) text.textContent = W.t("act.rejectText", { name: name || "" });
    if (ok) ok.textContent = W.t("act.reject");
    sheet.hidden = false;

    if (ok) {
      ok.onclick = function () {
        W.store.rejectChange(id)
          .then(function () {
            self.closeSheet("confirm-sheet");
            self.updateBadge();
            W.ui.renderActivity();
            W.ui.render();
            self.toast(W.t("toast.rejected"), "ok");
          })
          .catch(function (err) {
            console.error(err);
            self.closeSheet("confirm-sheet");
            self.toast(W.t("toast.error"), "err");
          });
      };
    }
  },

  /** Show how many changes are waiting for the admin, on the shield. */
  updateBadge: function () {
    var badge = document.getElementById("pending-badge");
    var btn = document.getElementById("admin-open");
    var n = W.store.isAdmin() ? W.store.pendingCount() : 0;

    if (badge) {
      badge.textContent = n;
      badge.hidden = !n;
    }
    if (btn) {
      btn.setAttribute("aria-label", n
        ? W.t("header.pending") + " (" + n + ")"
        : W.t("header.adminTools"));
    }
  },

  /* ------------------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------------- */
  closeSheet: function (id) {
    var el = document.getElementById(id);
    if (el) el.hidden = true;
    if (!document.querySelector(".sheet:not([hidden])")) {
      document.body.style.overflow = "";
    }
  },

  /** Reload data from the database and repaint. */
  refresh: function () {
    var self = this;
    return W.store.load().then(function () {
      self.applyRoleUI();
      self.updateBadge();
      W.ui.render();
      return self;
    });
  },

  /** Small toast message at the bottom of the screen. */
  toast: function (message, kind) {
    var host = document.getElementById("toasts");
    if (!host) return;
    var t = document.createElement("div");
    t.className = "toast " + (kind || "");
    t.textContent = message;
    host.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .25s ease";
      t.style.opacity = "0";
      setTimeout(function () { t.remove(); }, 260);
    }, 3200);
  }
};

/* Start the app once the DOM is ready. */
document.addEventListener("DOMContentLoaded", function () {
  W.app.init();
});
