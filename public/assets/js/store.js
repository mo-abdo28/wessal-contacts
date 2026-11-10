/* =====================================================================
 * Wessal Contacts — application store
 * ---------------------------------------------------------------------
 * Holds the in-memory state (contacts, categories, current user, role)
 * and exposes the operations the UI needs. Role comes from the
 * `profiles` table in Supabase — the same source the Row Level Security
 * policies use, so the UI and the database always agree.
 * ===================================================================== */
window.W = window.W || {};

W.store = {
  contacts: [],
  categories: [],
  user: null,        // { id, email, username }
  role: "member",    // "admin" | "member"
  previewRole: "admin", // used only in local preview mode
  _unsub: null,

  /* ---------------- loading ---------------- */

  /** Load everything the app needs for the signed-in user. */
  load: function () {
    var self = this;
    return Promise.all([W.db.listContacts(), W.db.listCategories()])
      .then(function (res) {
        self.contacts = res[0] || [];
        self.categories = res[1] || [];
        self._ensureCategories();
        return self;
      });
  },

  /** Make sure the standard categories exist (used in local mode). */
  _ensureCategories: function () {
    if (!this.categories.length) {
      this.categories = (W.DEFAULT_CATEGORIES || []).map(function (name, i) {
        return { id: "cat-" + i, name: name, sort_order: i };
      });
    }
  },

  /* ---------------- identity & role ---------------- */

  /**
   * Resolve the signed-in user's identity and role.
   * Online mode reads the `profiles` row; local mode uses the preview
   * role switcher in the header.
   */
  identify: function (user) {
    var self = this;
    this.user = user || null;

    if (!W.isOnline) {
      this.role = this.previewRole;
      return Promise.resolve(this);
    }

    if (!user) {
      this.role = "member";
      return Promise.resolve(this);
    }

    return W.db.load()
      .then(function (client) {
        return client
          .from("profiles")
          .select("id, username, role")
          .eq("id", user.id)
          .maybeSingle();
      })
      .then(function (res) {
        if (res && res.data) {
          self.role = res.data.role || "member";
          self.user.username = res.data.username;
          return self;
        }
        // No profile row (e.g. account created without running setup):
        // fall back to the email local-part as the display name.
        self.role = "member";
        self.user.username = (user.email || "").split("@")[0];
        return self;
      })
      .catch(function () {
        self.role = "member";
        return self;
      });
  },

  isAdmin: function () {
    return this.role === "admin";
  },

  /* ---------------- contact operations ---------------- */

  /** Build a database row from form values, normalising the numbers. */
  buildRow: function (values) {
    var row = {
      name: (values.name || "").trim(),
      organization: (values.organization || "").trim(),
      phone: W.normalizePhoneDigits(values.phone),
      phone_secondary: W.normalizePhoneDigits(values.phone2),
      has_whatsapp: !!values.has_whatsapp,
      category: (values.category || "Other").trim() || "Other",
      notes: (values.notes || "").trim()
    };
    // A short hotline is never a WhatsApp number.
    if (W.isShortCode(values.phone)) row.has_whatsapp = false;
    return row;
  },

  addContact: function (values) {
    var row = this.buildRow(values);
    row.created_by = this.user ? this.user.id : null;
    row.created_by_name = this.user ? (this.user.username || "") : "";
    return W.db.insertContact(row).then(function (rec) {
      return rec;
    });
  },

  editContact: function (id, values) {
    var row = this.buildRow(values);
    return W.db.updateContact(id, row);
  },

  removeContact: function (id) {
    return W.db.deleteContact(id);
  },

  /**
   * Find a contact that already uses the given number (primary or
   * secondary), so the UI can warn before saving.
   */
  findByNumber: function (digits, ignoreId) {
    if (!digits) return null;
    return this.contacts.find(function (c) {
      if (ignoreId && c.id === ignoreId) return false;
      return c.phone === digits ||
        (c.phone_secondary && c.phone_secondary === digits);
    }) || null;
  },

  /** All numbers in use, for duplicate checks during import. */
  usedNumbers: function () {
    var set = {};
    this.contacts.forEach(function (c) {
      if (c.phone) set[c.phone] = true;
      if (c.phone_secondary) set[c.phone_secondary] = true;
    });
    return set;
  },

  /** Only the MAIN numbers — used to decide which import rows to skip. */
  usedPrimaryNumbers: function () {
    var set = {};
    this.contacts.forEach(function (c) {
      if (c.phone) set[c.phone] = true;
    });
    return set;
  },

  /** Human label for a contact (name, else organisation). */
  label: function (c) {
    if (!c) return "";
    return c.name || c.organization || "—";
  },

  /** Counts for the dashboard tiles and the per-category chips. */
  stats: function () {
    var total = this.contacts.length;
    var withWa = this.contacts.filter(function (c) { return c.has_whatsapp; }).length;
    var perCat = {};
    this.contacts.forEach(function (c) {
      var k = c.category || "Other";
      perCat[k] = (perCat[k] || 0) + 1;
    });
    return {
      total: total,
      withWa: withWa,
      withoutWa: total - withWa,
      perCategory: perCat
    };
  },

  /* ---------------- categories ---------------- */

  categoryNames: function () {
    var names = this.categories.map(function (c) { return c.name; });
    // Categories actually used by contacts should always be selectable.
    this.contacts.forEach(function (c) {
      var k = c.category || "Other";
      if (names.indexOf(k) === -1) names.push(k);
    });
    return names;
  },

  addCategory: function (name) {
    var clean = (name || "").trim();
    if (!clean) return Promise.reject(new Error("empty"));
    if (this.categoryNames().indexOf(clean) !== -1) {
      return Promise.reject(new Error("duplicate"));
    }
    return W.db.insertCategory(clean).then(function (cat) {
      this.categories.push(cat);
      return cat;
    }.bind(this));
  },

  renameCategory: function (id, name) {
    var clean = (name || "").trim();
    if (!clean) return Promise.reject(new Error("empty"));
    var cat = this.categories.find(function (c) { return c.id === id; });
    if (!cat) return Promise.reject(new Error("missing"));
    var old = cat.name;
    return W.db.updateCategory(id, clean).then(function () {
      cat.name = clean;
      this.contacts.forEach(function (c) {
        if (c.category === old) c.category = clean;
      });
      return cat;
    }.bind(this));
  },

  removeCategory: function (id) {
    var cat = this.categories.find(function (c) { return c.id === id; });
    if (!cat) return Promise.resolve();
    return W.db.deleteCategory(id).then(function () {
      this.categories = this.categories.filter(function (c) { return c.id !== id; });
      this.contacts.forEach(function (c) {
        if (c.category === cat.name) c.category = "Other";
      });
      return true;
    }.bind(this));
  },

  /* ---------------- realtime ---------------- */

  startRealtime: function (onChange) {
    if (this._unsub) this._unsub();
    this._unsub = W.db.subscribe(onChange);
  }
};
