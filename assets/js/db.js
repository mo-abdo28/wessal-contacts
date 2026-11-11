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
  KEY: "wessal-contacts-local-v4",
  CAT_KEY: "wessal-categories-local-v4",

  _read: function () {
    try {
      var raw = localStorage.getItem(this.KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.contacts) return parsed;
    } catch (e) { /* ignore corrupt storage */ }

    // "Start from scratch" mode for previewing the import flow.
    // Add ?empty=1 to the page address to begin with an empty directory.
    var startEmpty = /[?&]empty=1\b/.test(window.location.search);

    // First run: seed with the provided contacts
    var fresh = {
      contacts: startEmpty ? [] : (W.SEED_CONTACTS || []).map(function (c, i) {
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
      }),
      categories: (W.DEFAULT_CATEGORIES || []).map(function (name, i) {
        return { id: "cat-" + (i + 1), name: name, sort_order: i };
      })
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
    return rec;
  },

  update: function (id, row) {
    var data = this._read();
    var idx = data.contacts.findIndex(function (c) { return c.id === id; });
    if (idx === -1) throw new Error("Contact not found");
    data.contacts[idx] = Object.assign({}, data.contacts[idx], row, {
      updated_at: new Date().toISOString()
    });
    this._write(data);
    return data.contacts[idx];
  },

  remove: function (id) {
    var data = this._read();
    data.contacts = data.contacts.filter(function (c) { return c.id !== id; });
    this._write(data);
    return true;
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
