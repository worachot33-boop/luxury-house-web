PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plot_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT NOT NULL,
    price_thb INTEGER NOT NULL CHECK (price_thb > 0),
    usable_area_sqm INTEGER NOT NULL CHECK (usable_area_sqm > 0),
    land_sqw REAL NOT NULL CHECK (land_sqw > 0),
    bedrooms INTEGER NOT NULL CHECK (bedrooms > 0),
    bathrooms INTEGER NOT NULL CHECK (bathrooms > 0),
    parking INTEGER NOT NULL CHECK (parking >= 0),
    maid_rooms INTEGER NOT NULL DEFAULT 0 CHECK (maid_rooms >= 0),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
    highlight_badge TEXT DEFAULT '',
    builtin_style TEXT NOT NULL DEFAULT 'Warm Champagne Luxury',
    builtin_value_thb INTEGER NOT NULL DEFAULT 0 CHECK (builtin_value_thb >= 0),
    description TEXT NOT NULL,
    hero_image TEXT NOT NULL,
    before_image TEXT NOT NULL,
    after_image TEXT NOT NULL,
    is_featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_thb);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);

CREATE TABLE IF NOT EXISTS builtin_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    room_name TEXT NOT NULL,
    feature_detail TEXT NOT NULL,
    material_spec TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_builtin_features_property ON builtin_features(property_id);

CREATE TABLE IF NOT EXISTS floor_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    floor_number INTEGER NOT NULL,
    floor_label TEXT NOT NULL,
    area_sqm INTEGER NOT NULL CHECK (area_sqm > 0),
    room_summary TEXT NOT NULL,
    plan_image TEXT NOT NULL,
    UNIQUE (property_id, floor_number),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_floor_plans_property ON floor_plans(property_id);

CREATE TABLE IF NOT EXISTS viewing_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER,
    interested_plot TEXT NOT NULL DEFAULT '',
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    line_id TEXT DEFAULT '',
    preferred_date TEXT NOT NULL,
    preferred_time TEXT NOT NULL DEFAULT '10:00 - 12:00',
    budget_range TEXT NOT NULL DEFAULT '8 - 12 ล้านบาท',
    note TEXT DEFAULT '',
    lead_status TEXT NOT NULL DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'visited', 'closed', 'cancelled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_viewing_leads_property ON viewing_leads(property_id);
CREATE INDEX IF NOT EXISTS idx_viewing_leads_status ON viewing_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_viewing_leads_created ON viewing_leads(created_at DESC);
