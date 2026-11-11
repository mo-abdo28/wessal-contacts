/* =====================================================================
 * Wessal Contacts — database adapter
 * ---------------------------------------------------------------------
 * Two backends behind one API:
 *
 *   1. SUPABASE MODE (production)
 *      Uses the Supabase REST API through the official JS client loaded
 *      from a CDN. All permission checks are enforced by Row Level
 *      Security in the database — the client cannot bypass them.
 *
 *   2. LOCAL MODE (preview / offline)
 *      When config.js has no Supabase credentials the app stores contacts
 *      in this browser's localStorage. Useful for a quick look before
 *      the database is set up. Nothing leaves the device.
 * ===================================================================== */
window.W = window.W || {};

W.CFG = window.WESSAL_CONFIG || {};
W.CFG.SUPABASE_URL = (W.CFG.SUPABASE_URL || "").trim();
W.CFG.SUPABASE_ANON_KEY = (W.CFG.SUPABASE_ANON_KEY || "").trim();

/* True when the app is talking to a real Supabase project. */
W.isOnline = !!(W.CFG.SUPABASE_URL && W.CFG.SUPABASE_ANON_KEY);

/**
 * How the app behaves when there is no database connected.
 *
 *   "auto"   (default) — open for preview on your own computer
 *                      (localhost or a file you double-clicked),
 *                      locked everywhere else.
 *   "open"   — always show the offline preview with the sample data.
 *   "locked" — always show the login screen only. Nobody can see the
 *              directory or the admin tools without a real login.
 *
 * "auto" is what keeps a published site safe: on the public URL the
 * visitor gets the login screen and nothing else.
 */
W.previewMode = function () {
  var cfg = (W.CFG.PREVIEW_MODE || "auto").toLowerCase();
  if (cfg === "open" || cfg === "locked") return cfg;

  var host = String(window.location.hostname || "").toLowerCase();
  var isLocal = !host ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "0.0.0.0" ||
    window.location.protocol === "file:";
  return isLocal ? "open" : "locked";
};

W.CDN = {
  supabase: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js",
  xlsx: "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"
};

W.db = {
  client: null,
  _loaded: false,

  /* Load the Supabase client script once (only when needed). */
  load: function () {
    var self = this;
    if (self.client || self._loaded) return Promise.resolve(self.client);
    self._loaded = true;

    return new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) {
        self.client = window.supabase.createClient(
          W.CFG.SUPABASE_URL,
          W.CFG.SUPABASE_ANON_KEY,
          {
            auth: {
              persistSession: true,      // stay logged in on this device
              autoRefreshToken: true,
              detectSessionInUrl: false,
              storageKey: "wessal-auth"
            },
            global: { headers: { "x-application-name": "wessal-contacts" } }
          }
        );
        return resolve(self.client);
      }
      var s = document.createElement("script");
      s.src = W.CDN.supabase;
      s.onload = function () {
        self.client = window.supabase.createClient(
          W.CFG.SUPABASE_URL,
          W.CFG.SUPABASE_ANON_KEY,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: false,
              storageKey: "wessal-auth"
            },
            global: { headers: { "x-application-name": "wessal-contacts" } }
          }
        );
        resolve(self.client);
      };
      s.onerror = function () {
        self._loaded = false;
        reject(new Error("Could not load the Supabase library (offline?)."));
      };
      document.head.appendChild(s);
    });
  },

  /* ---------------- Authentication ---------------- */

  /**
   * Sign in with a username + password.
   * The username is mapped to a fake email: "Abdo" -> "abdo@wessal.app"
   * so the team only ever types a username.
   */
  signIn: function (username, password) {
    var domain = W.CFG.AUTH_EMAIL_DOMAIN || "wessal.app";
    var email = String(username).trim().toLowerCase() + "@" + domain;

    return this.load().then(function (client) {
      return client.auth.signInWithPassword({ email: email, password: password });
    });
  },

  signOut: function () {
    if (!this.client) return Promise.resolve();
    return this.client.auth.signOut();
  },

  /** Returns the current session's user record, or null. */
  currentUser: function () {
    if (!this.client) return Promise.resolve(null);
    return this.client.auth.getUser().then(function (res) {
      return (res && res.data && res.data.user) || null;
    }).catch(function () { return null; });
  },

  /** Restore a persisted session on page load (keeps users logged in). */
  restore: function () {
    if (!this.client) return Promise.resolve(null);
    return this.client.auth.getSession().then(function (res) {
      var s = res && res.data ? res.data.session : null;
      return s ? s.user : null;
    }).catch(function () { return null; });
  },

  /* ---------------- Data ---------------- */

  /**
   * Read every contact the current user is allowed to see.
   * RLS decides what "allowed" means.
   */
  listContacts: function () {
    if (!W.isOnline) return Promise.resolve(W.local.list());
    return this.load().then(function (client) {
      return client
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data || [];
    });
  },

  insertContact: function (row) {
    if (!W.isOnline) return Promise.resolve(W.local.insert(row));
    return this.load().then(function (client) {
      return client.from("contacts").insert(row).select().single();
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  },

  updateContact: function (id, row) {
    if (!W.isOnline) return Promise.resolve(W.local.update(id, row));
    return this.load().then(function (client) {
      return client.from("contacts").update(row).eq("id", id).select().single();
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  },

  /** RLS blocks this for members — the admin policy allows it. */
  deleteContact: function (id) {
    if (!W.isOnline) return Promise.resolve(W.local.remove(id));
    return this.load().then(function (client) {
      return client.from("contacts").delete().eq("id", id);
    }).then(function (res) {
      if (res.error) throw res.error;
      return true;
    });
  },

  listCategories: function () {
    if (!W.isOnline) return Promise.resolve(W.local.categories());
    return this.load().then(function (client) {
      return client.from("categories").select("*").order("sort_order", { ascending: true });
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data || [];
    });
  },

  insertCategory: function (name) {
    if (!W.isOnline) return Promise.resolve(W.local.addCategory(name));
    return this.load().then(function (client) {
      return client.from("categories").insert({ name: name }).select().single();
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  },

  updateCategory: function (id, name) {
    if (!W.isOnline) return Promise.resolve(W.local.renameCategory(id, name));
    return this.load().then(function (client) {
      return client.from("categories").update({ name: name }).eq("id", id).select().single();
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  },

  deleteCategory: function (id) {
    if (!W.isOnline) return Promise.resolve(W.local.removeCategory(id));
    return this.load().then(function (client) {
      return client.from("categories").delete().eq("id", id);
    }).then(function (res) {
      if (res.error) throw res.error;
      return true;
    });
  },

  /* ---------------- Approval workflow + activity log ---------------- */

  /**
   * Change requests waiting for approval.
   * RLS gives the admin every request and a member only their own.
   */
  listPending: function () {
    if (!W.isOnline) return Promise.resolve(W.local.pending());
    return this.load().then(function (client) {
      return client
        .from("change_requests")
        .select("*")
        .order("created_at", { ascending: false });
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data || [];
    });
  },

  /** Send a proposed edit to the admin for approval. */
  submitChange: function (row) {
    if (!W.isOnline) return Promise.resolve(W.local.submitChange(row));
    return this.load().then(function (client) {
      return client.from("change_requests").insert(row).select().single();
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  },

  /** Approve or reject a request. Admins only (enforced by RLS too). */
  reviewChange: function (id, status, note) {
    if (!W.isOnline) return Promise.resolve(W.local.reviewChange(id, status, note));
    return this.load().then(function (client) {
      return client
        .from("change_requests")
        .update({
          status: status,
          review_note: note || "",
          reviewed_by: W.store.user ? W.store.user.id : null,
          reviewed_by_username: W.store.user ? (W.store.user.username || "") : "",
          reviewed_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  },

  /** The audit trail. Admins only (enforced by RLS too). */
  listActivity: function (limit) {
    if (!W.isOnline) return Promise.resolve(W.local.activity(limit));
    return this.load().then(function (client) {
      return client
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit || 200);
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data || [];
    });
  },

  /* Realtime: refresh the list when another teammate edits something. */
  subscribe: function (onChange) {
    if (!W.isOnline) return function () {};
    var self = this;
    var channel = null;
    this.load().then(function (client) {
      channel = client
        .channel("wessal-contacts")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "contacts" },
          function () { onChange(); }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "categories" },
          function () { onChange(); }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "change_requests" },
          function () { onChange(); }
        )
        .subscribe();
    }).catch(function () { /* realtime is optional */ });
    return function () {
      if (channel) self.client.removeChannel(channel);
    };
  }
};

/* =====================================================================
 * Local (offline) storage — used only when Supabase is not configured
 * ===================================================================== */
W.local = {
  KEY: "wessal-contacts-local-v5",
  PREV_KEY: "wessal-contacts-local-v4",
  CAT_KEY: "wessal-categories-local-v4",

  /** Who is acting right now (preview mode has no real accounts). */
  actor: function () {
    var u = W.store && W.store.user;
    return {
      username: (u && u.username) || "unknown",
      role: (W.store && W.store.role) || "member"
    };
  },

  /** Append one line to the local activity log. */
  logActivity: function (entry) {
    var data = this._read();
    var a = this.actor();
    data.activity.unshift({
      id: "act-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      contact_id: entry.contact_id || null,
      contact_name: entry.contact_name || "",
      action: entry.action,
      details: entry.details || {},
      actor_username: a.username,
      actor_role: a.role,
      created_at: new Date().toISOString()
    });
    if (data.activity.length > 300) data.activity.length = 300;
    this._write(data);
  },

  _read: function () {
    try {
      var raw = localStorage.getItem(this.KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.contacts) {
        if (!parsed.pending) parsed.pending = [];
        if (!parsed.activity) parsed.activity = [];
        return parsed;
      }
    } catch (e) { /* ignore corrupt storage */ }

    // Carry over the data saved by the previous version.
    var prev = null;
    try {
      var old = localStorage.getItem(this.PREV_KEY);
      prev = old ? JSON.parse(old) : null;
    } catch (e2) { prev = null; }

    // "Start from scratch" mode for previewing the import flow.
    // Add ?empty=1 to the page address to begin with an empty directory.
    var startEmpty = /[?&]empty=1\b/.test(window.location.search);

    // First run: seed with the provided contacts
    var fresh = {
      contacts: startEmpty ? [] : (prev && prev.contacts ? prev.contacts : (W.SEED_CONTACTS || []).map(function (c, i) {
        return {
          id: "seed-" + (i + 1),
          name: c.name,
          organization: c.organization,
          phone: c.phone,
          phone_secondary: c.phone_secondary,
          has_whatsapp: c.has_whatsapp,
          category: c.category,
          notes: c.notes,
          created_by: c.created_by,
          created_by_name: c.created_by || "Abdo",
          created_at: new Date(Date.now() - (17 - i) * 86400000).toISOString()
        };
      })),
      categories: (prev && prev.categories ? prev.categories : (W.DEFAULT_CATEGORIES || []).map(function (name, i) {
        return { id: "cat-" + (i + 1), name: name, sort_order: i };
      })),
      pending: [],
      activity: []
    };
    this._write(fresh);
    return fresh;
  },

  _write: function (data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) { /* quota or private mode */ }
  },

  list: function () {
    return this._read().contacts;
  },

  insert: function (row) {
    var data = this._read();
    var rec = Object.assign({
      id: "loc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      created_at: new Date().toISOString()
    }, row);
    data.contacts.unshift(rec);
    this._write(data);
    this.logActivity({
      contact_id: rec.id,
      contact_name: rec.name || rec.organization || "",
      action: "create",
      details: {
        phone: rec.phone,
        category: rec.category,
        whatsapp: rec.has_whatsapp
      }
    });
    return rec;
  },

  update: function (id, row) {
    var data = this._read();
    var idx = data.contacts.findIndex(function (c) { return c.id === id; });
    if (idx === -1) throw new Error("Contact not found");
    var before = data.contacts[idx];
    data.contacts[idx] = Object.assign({}, before, row, {
      updated_at: new Date().toISOString()
    });
    this._write(data);
    this.logActivity({
      contact_id: id,
      contact_name: data.contacts[idx].name || data.contacts[idx].organization || "",
      action: "update",
      details: W.contactDiff(before, data.contacts[idx])
    });
    return data.contacts[idx];
  },

  remove: function (id) {
    var data = this._read();
    var gone = data.contacts.filter(function (c) { return c.id === id; })[0];
    data.contacts = data.contacts.filter(function (c) { return c.id !== id; });
    this._write(data);
    if (gone) {
      this.logActivity({
        contact_id: id,
        contact_name: gone.name || gone.organization || "",
        action: "delete",
        details: {
          phone: gone.phone,
          category: gone.category,
          whatsapp: gone.has_whatsapp
        }
      });
    }
    return true;
  },

  /* ---------------- approval workflow (local) ---------------- */

  pending: function () {
    return this._read().pending;
  },

  submitChange: function (row) {
    var data = this._read();
    var a = this.actor();
    var rec = Object.assign({
      id: "req-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      status: "pending",
      requested_by_username: a.username,
      created_at: new Date().toISOString()
    }, row);
    data.pending.unshift(rec);
    this._write(data);
    this.logActivity({
      contact_id: rec.contact_id,
      contact_name: rec.contact_name,
      action: "request",
      details: { diff: rec.diff, requested_by: rec.requested_by_username }
    });
    return rec;
  },

  reviewChange: function (id, status, note) {
    var data = this._read();
    var idx = data.pending.findIndex(function (r) { return String(r.id) === String(id); });
    if (idx === -1) throw new Error("Request not found");

    var req = data.pending[idx];
    var a = this.actor();

    // Approving applies the proposed values to the contact itself.
    if (status === "approved" && req.contact_id && req.payload) {
      var ci = data.contacts.findIndex(function (c) { return String(c.id) === String(req.contact_id); });
      if (ci !== -1) {
        var before = data.contacts[ci];
        data.contacts[ci] = Object.assign({}, before, req.payload, {
          updated_at: new Date().toISOString(),
          updated_by_name: a.username
        });
        data.pending.splice(idx, 1);
        this._write(data);
        this.logActivity({
          contact_id: req.contact_id,
          contact_name: req.contact_name,
          action: "update",
          details: W.contactDiff(before, data.contacts[ci])
        });
      } else {
        data.pending.splice(idx, 1);
        this._write(data);
      }
    } else {
      req.status = status;
      req.review_note = note || "";
      req.reviewed_by_username = a.username;
      req.reviewed_at = new Date().toISOString();
      data.pending.splice(idx, 1);
      this._write(data);
    }

    this.logActivity({
      contact_id: req.contact_id,
      contact_name: req.contact_name,
      action: status === "approved" ? "approve" : "reject",
      details: { requested_by: req.requested_by_username, note: note || "", diff: req.diff }
    });

    return req;
  },

  activity: function (limit) {
    return this._read().activity.slice(0, limit || 200);
  },

  categories: function () {
    return this._read().categories;
  },

  addCategory: function (name) {
    var data = this._read();
    var rec = {
      id: "cat-" + Date.now(),
      name: name,
      sort_order: data.categories.length
    };
    data.categories.push(rec);
    this._write(data);
    return rec;
  },

  renameCategory: function (id, name) {
    var data = this._read();
    var cat = data.categories.find(function (c) { return c.id === id; });
    if (cat) {
      var old = cat.name;
      cat.name = name;
      data.contacts.forEach(function (c) {
        if (c.category === old) c.category = name;
      });
      this._write(data);
    }
    return cat;
  },

  removeCategory: function (id) {
    var data = this._read();
    var cat = data.categories.find(function (c) { return c.id === id; });
    if (cat) {
      data.contacts.forEach(function (c) {
        if (c.category === cat.name) c.category = "Other";
      });
      data.categories = data.categories.filter(function (c) { return c.id !== id; });
      this._write(data);
    }
    return true;
  }
};
