"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function isValidEmail(s) {
  const str = (s || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}



function normalizePhone(input) {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return "";
}

function slugifyTitle(title) {
  return (title || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <div className="field">
      <div className="label">{label}</div>
      <input
        className="input"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder = "" }) {
  return (
    <div className="field">
      <div className="label">{label}</div>
      <textarea
        className="textarea"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** Existing upload endpoint (uploads to /images/uploads/...) */
async function uploadImage(file, { scope = "projects", slug = "misc" } = {}) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("scope", scope);
  fd.append("slug", slug);

  const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.message || "Upload failed.");
  return json.path;
}

/** NEW: photos folder upload endpoint (public/images/photos) */
async function uploadPhotoToPhotosFolder(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/admin/photos", { method: "POST", body: fd, credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.message || "Upload failed.");
  return json; // {name, url}
}

function ImagePathWithUpload({ label, value, onChange, scope = "projects", slugForUpload = "misc" }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr("");
    setBusy(true);
    try {
      const p = await uploadImage(file, { scope, slug: slugForUpload });
      onChange(p);
    } catch (e2) {
      setErr(e2.message || "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="field">
      <div className="label">{label}</div>

      <div className="imgRow">
        <div className="imgPreview">
          {value ? <img src={value} alt="" /> : <div className="imgEmpty">No image</div>}
        </div>

        <div style={{ flex: 1 }}>
          <div className="btnRow" style={{ marginTop: 8 }}>
            <label className="fileBtn">
              Choose file
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={onPick}
                style={{ display: "none" }}
              />
            </label>

            <button className="btn" type="button" onClick={() => onChange("")}>
              Clear
            </button>

            {busy ? <div className="muted">Uploading…</div> : null}
            {err ? <div className="statusErr">{err}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function CarouselEditor({ items, onChange, slugForUpload = "misc" }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setErr("");
    setBusy(true);
    try {
      const uploaded = [];
      for (const f of files) {
        const p = await uploadImage(f, { scope: "projects", slug: slugForUpload });
        uploaded.push(p);
      }
      onChange([...(items || []), ...uploaded]);
    } catch (e) {
      setErr(e.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <div className="label">Carousel images</div>

      <div className="carouselGrid">
        {(items || []).map((src, idx) => (
          <div key={idx} className="carouselItem">
            <div className="carouselImg">
              {src ? <img src={src} alt="" /> : <div className="imgEmpty">Empty</div>}
            </div>

            <div className="btnRow" style={{ marginTop: 6 }}>
              <button
                className="btn danger"
                type="button"
                onClick={() => {
                  const next = [...items];
                  next.splice(idx, 1);
                  onChange(next);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="btnRow" style={{ marginTop: 10 }}>
        <label className="fileBtn">
          + Add images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
            style={{ display: "none" }}
          />
        </label>
        {busy ? <div className="muted">Uploading…</div> : null}
        {err ? <div className="statusErr">{err}</div> : null}
      </div>
    </div>
  );
}

/* ===== Upcoming Posters Editor ===== */

function UpcomingEditor({ item, onChange, slugForUpload }) {
  return (
    <>
      <Field label="Title" value={item.title} onChange={(v) => onChange({ ...item, title: v })} />
      <Field label="Slug" value={item.slug} onChange={(v) => onChange({ ...item, slug: slugifyTitle(v) })} />
      <ImagePathWithUpload
        label="Poster image"
        value={item.image}
        onChange={(v) => onChange({ ...item, image: v })}
        scope="upcoming"
        slugForUpload={slugForUpload}
      />
      <Field label="Date (optional)" value={item.date || ""} onChange={(v) => onChange({ ...item, date: v })} />
      <Field
        label="Location (optional)"
        value={item.location || ""}
        onChange={(v) => onChange({ ...item, location: v })}
      />
      <TextArea
        label="Description (optional)"
        value={item.description || ""}
        onChange={(v) => onChange({ ...item, description: v })}
      />
      <Field
        label="Link URL (optional)"
        value={item.linkUrl || ""}
        onChange={(v) => onChange({ ...item, linkUrl: v })}
        placeholder="https://..."
      />
      <Field
        label="Link Text (optional)"
        value={item.linkText || ""}
        onChange={(v) => onChange({ ...item, linkText: v })}
        placeholder="RSVP / Donate / Learn more"
      />
    </>
  );
}

/* ===== Photos Tab ===== */

function PhotosManager({ photos, setPhotos, setStatus }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function reload() {
    setErr("");
    try {
      const res = await fetch("/api/admin/photos", { cache: "no-store", credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.message || "Could not load photos");
      setPhotos(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setErr(e.message || "Load failed");
    }
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setErr("");
    setBusy(true);
    try {
      for (const f of files) {
        await uploadPhotoToPhotosFolder(f);
      }
      await reload();
      setStatus({ type: "ok", text: "Photos uploaded." });
    } catch (e) {
      setErr(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(name) {
    if (!name) return;
    setErr("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/photos?name=${encodeURIComponent(name)}`, { method: "DELETE", credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.message || "Delete failed");
      await reload();
    } catch (e) {
      setErr(e.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="h">Photos (public/images/photos)</div>
      <div className="muted">Upload and delete photos shown on /photos.</div>

      <div className="btnRow" style={{ marginTop: 10 }}>
        <label className="fileBtn">
          + Upload photos
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
            style={{ display: "none" }}
          />
        </label>
        <button className="btn" type="button" onClick={reload} disabled={busy}>
          Reload
        </button>
        {busy ? <div className="muted">Working…</div> : null}
        {err ? <div className="statusErr">{err}</div> : null}
      </div>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 10,
        }}
      >
        {photos.map((p) => (
          <div key={p.name} style={{ border: "2px solid #fff", padding: 10 }}>
            <div style={{ border: "2px solid #fff", height: 140, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="tiny" style={{ marginTop: 8, wordBreak: "break-word" }}>
              {p.name}
            </div>
            <div className="btnRow" style={{ marginTop: 8 }}>
              <button className="btn danger" type="button" onClick={() => remove(p.name)} disabled={busy}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState("projects");


  const [projectsDraft, setProjectsDraft] = useState([]);
  const [upcomingDraft, setUpcomingDraft] = useState([]);

  const [photos, setPhotos] = useState([]);

  const [homePosters, setHomePosters] = useState({
    left: { image: "", link: "" },
    right: { image: "", link: "" },
  });


  // contact.json (we'll store extra "about" fields in the same object)
  const [contactDraft, setContactDraft] = useState([
    {
      name: "",
      phone: "",
      email: "",
      picture: "",
      aboutPhoto: "",
      aboutParagraph: "",
      aboutLinks: [
        { label: "IMDB", url: "" },
        { label: "FilmFreeway", url: "" },
        { label: "GoFundMe", url: "" },
        { label: "Instagram", url: "" },
      ],
    },
  ]);

  const [importantDraft, setImportantDraft] = useState([{ email: "" }]);

  const [selectedSlug, setSelectedSlug] = useState("");
  const selectedProject = useMemo(
    () => projectsDraft.find((p) => p.slug === selectedSlug) || null,
    [projectsDraft, selectedSlug]
  );

  const [selectedUpcomingSlug, setSelectedUpcomingSlug] = useState("");
  const selectedUpcoming = useMemo(
    () => upcomingDraft.find((p) => p.slug === selectedUpcomingSlug) || null,
    [upcomingDraft, selectedUpcomingSlug]
  );

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", text: "" });

  async function loadAll() {
    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const [pRes, cRes, iRes, uRes] = await Promise.all([
        fetch("/api/admin/projects", { cache: "no-store", credentials: "include" }),
        fetch("/api/admin/contact", { cache: "no-store", credentials: "include" }),
        fetch("/api/admin/important", { cache: "no-store", credentials: "include" }),
        fetch("/api/admin/upcoming", { cache: "no-store", credentials: "include" }),
      ]);

      const pJson = await pRes.json().catch(() => ({}));
      const cJson = await cRes.json().catch(() => ({}));
      const iJson = await iRes.json().catch(() => ({}));
      const uJson = await uRes.json().catch(() => ({}));
      const hRes = await fetch("/api/admin/home-posters", { cache: "no-store", credentials: "include" });
      const hJson = await hRes.json().catch(() => ({}));
      if (hRes.ok && hJson.ok) setHomePosters(hJson.data);


      if (!pRes.ok || !pJson.ok) throw new Error(pJson.message || "Could not read projects.");
      if (!cRes.ok || !cJson.ok) throw new Error(cJson.message || "Could not read contact.");
      if (!iRes.ok || !iJson.ok) throw new Error(iJson.message || "Could not read important.");
      if (!uRes.ok || !uJson.ok) throw new Error(uJson.message || "Could not read upcoming.");

      const pData = Array.isArray(pJson.data) ? pJson.data : [];
      const uData = Array.isArray(uJson.data) ? uJson.data : [];
      const cData = Array.isArray(cJson.data) ? cJson.data : [];
      const iData = Array.isArray(iJson.data) ? iJson.data : [{ email: "" }];

      setProjectsDraft(deepClone(pData));
      setUpcomingDraft(deepClone(uData));

      // merge-in defaults for about fields if missing
      const base = cData?.[0] || {};
      const mergedContact = {
        name: base.name || "",
        phone: base.phone || "",
        email: base.email || "",
        picture: base.picture || "",
        aboutPhoto: base.aboutPhoto || "",
        aboutParagraph: base.aboutParagraph || "",
        aboutLinks: Array.isArray(base.aboutLinks) && base.aboutLinks.length
          ? base.aboutLinks
          : [
              { label: "IMDB", url: "" },
              { label: "FilmFreeway", url: "" },
              { label: "GoFundMe", url: "" },
              { label: "Instagram", url: "" },
            ],
      };

      setContactDraft([deepClone(mergedContact)]);
      setImportantDraft(deepClone(iData.length ? iData : [{ email: "" }]));

      const firstSlug = pData?.[0]?.slug || "";
      setSelectedSlug((prev) => prev || firstSlug);

      const firstUpcoming = uData?.[0]?.slug || "";
      setSelectedUpcomingSlug((prev) => prev || firstUpcoming);

      setSlugManuallyEdited(false);
    } catch (e) {
      setStatus({ type: "err", text: e.message || "Load failed." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function updateProjectField(slug, key, value) {
    setProjectsDraft((prev) => prev.map((p) => (p.slug === slug ? { ...p, [key]: value } : p)));
  }

  function uniqueSlug(desired, existingSet) {
    let base = desired || "new-project";
    if (!existingSet.has(base)) return base;

    let n = 2;
    let s = `${base}-${n}`;
    while (existingSet.has(s)) {
      n += 1;
      s = `${base}-${n}`;
    }
    return s;
  }

  function addProject() {
    const existing = new Set(projectsDraft.map((p) => p.slug));
    const title = "New Project";
    const desired = slugifyTitle(title) || "new-project";
    const slug = uniqueSlug(desired, existing);

    const newProj = {
      slug,
      title,
      directorBiography:
        "Macro Steel is a second year student at Tufts University in the Film and Media Studies program. He is an emerging filmmaker and local to the Boston area who works primarily in horror.",
      directorStatement: "",
      overview: "",
      completionDate: "",
      projectType: "",
      genres: "",
      runtime: "",
      productionBudget: "",
      countryOfOrigin: "United States",
      countryOfFilming: "United States",
      shootingFormat: "",
      aspectRatio: "",
      filmColor: "Color",
      firstTimeFilmmaker: "No",
      studentProject: "Yes - Tufts University",
      credits: "",
      mainPicture: "",
      carousel: [],
    };

    setProjectsDraft((prev) => [newProj, ...prev]);
    setSelectedSlug(slug);
    setSlugManuallyEdited(false);
    setStatus({ type: "", text: "" });
  }

  function deleteProject(slug) {
    if (!slug) return;
    const next = projectsDraft.filter((p) => p.slug !== slug);
    setProjectsDraft(next);
    setSelectedSlug(next?.[0]?.slug || "");
    setSlugManuallyEdited(false);
  }

  async function saveProjects() {
    setStatus({ type: "", text: "" });

    const slugs = projectsDraft.map((p) => (p.slug || "").trim());
    if (slugs.some((s) => !s)) {
      setStatus({ type: "err", text: "Every project must have a non-empty slug." });
      return;
    }
    const uniq = new Set(slugs);
    if (uniq.size !== slugs.length) {
      setStatus({ type: "err", text: "Project slugs must be unique." });
      return;
    }

    try {
      const res = await fetch("/api/admin/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectsDraft, null, 2),
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.message || "Save failed");
      setStatus({ type: "ok", text: "Projects saved" });
    } catch (e) {
      setStatus({ type: "err", text: e.message || "Save failed" });
    }
  }

  /* ===== Upcoming CRUD ===== */

  function addUpcoming() {
    const existing = new Set(upcomingDraft.map((p) => p.slug));
    const title = "New Poster";
    const desired = slugifyTitle(title) || "new-poster";
    const slug = uniqueSlug(desired, existing);

    const newItem = {
      slug,
      title,
      image: "",
      date: "",
      location: "",
      description: "",
      linkUrl: "",
      linkText: "",
    };

    setUpcomingDraft((prev) => [newItem, ...prev]);
    setSelectedUpcomingSlug(slug);
    setStatus({ type: "", text: "" });
  }

  function updateUpcoming(slug, nextItem) {
    setUpcomingDraft((prev) => prev.map((p) => (p.slug === slug ? nextItem : p)));
  }

  function deleteUpcoming(slug) {
    if (!slug) return;
    const next = upcomingDraft.filter((p) => p.slug !== slug);
    setUpcomingDraft(next);
    setSelectedUpcomingSlug(next?.[0]?.slug || "");
  }

  async function saveUpcoming() {
    setStatus({ type: "", text: "" });

    const slugs = upcomingDraft.map((p) => (p.slug || "").trim());
    if (slugs.some((s) => !s)) {
      setStatus({ type: "err", text: "Every poster must have a non-empty slug." });
      return;
    }
    const uniq = new Set(slugs);
    if (uniq.size !== slugs.length) {
      setStatus({ type: "err", text: "Poster slugs must be unique." });
      return;
    }
    for (const it of upcomingDraft) {
      if (!it.title || !String(it.title).trim()) {
        setStatus({ type: "err", text: "Every poster must have a title." });
        return;
      }
      if (!it.image || !String(it.image).trim()) {
        setStatus({ type: "err", text: "Every poster must have a poster image." });
        return;
      }
    }

    try {
      const res = await fetch("/api/admin/upcoming", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(upcomingDraft, null, 2),
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.message || "Save failed");
      setStatus({ type: "ok", text: "Upcoming saved" });
    } catch (e) {
      setStatus({ type: "err", text: e.message || "Save failed" });
    }
  }

  /* ===== Save About/Contact (same /api/admin/contact) ===== */

  async function saveContact() {
    setStatus({ type: "", text: "" });

    const c = contactDraft?.[0] || {};
    const phone = normalizePhone(c.phone);
    const emailOk = !c.email || isValidEmail(c.email);

    if (c.email && !emailOk) {
      setStatus({ type: "err", text: "Contact email is invalid." });
      return;
    }
    if (c.phone && !phone) {
      setStatus({ type: "err", text: "Contact phone must be 10 digits (optionally +1)." });
      return;
    }

    const links = Array.isArray(c.aboutLinks) ? c.aboutLinks.slice(0, 8) : [];
    const payload = [
      {
        name: (c.name || "").trim(),
        phone: c.phone ? normalizePhone(c.phone) : "",
        email: (c.email || "").trim(),
        picture: (c.picture || "").trim(),

        // NEW about fields (safe to add)
        aboutPhoto: (c.aboutPhoto || "").trim(),
        aboutParagraph: (c.aboutParagraph || "").trim(),
        aboutLinks: links.map((x) => ({
          label: (x.label || "").trim(),
          url: (x.url || "").trim(),
        })),
      },
    ];

    try {
      const res = await fetch("/api/admin/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload, null, 2),
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.message || "Save failed.");
      setContactDraft(deepClone(payload));
      setStatus({ type: "ok", text: "About/Contact saved." });
    } catch (e) {
      setStatus({ type: "err", text: e.message || "Save failed." });
    }
  }

  async function saveHomePosters() {
    setStatus({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/home-posters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(homePosters, null, 2),
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.message || "Save failed");

      setStatus({ type: "ok", text: "Home posters saved." });
    } catch (e) {
      setStatus({ type: "err", text: e.message || "Save failed." });
    }
  }

  async function saveImportant() {
    setStatus({ type: "", text: "" });
    const email = (importantDraft?.[0]?.email || "").trim();

    if (!email || !isValidEmail(email)) {
      setStatus({ type: "err", text: "Email must be a valid email address." });
      return;
    }

    const payload = [{ email }];

    try {
      const res = await fetch("/api/admin/important", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload, null, 2),
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.message || "Save failed.");
      setImportantDraft(deepClone(payload));
      setStatus({ type: "ok", text: "Email saved." });
    } catch (e) {
      setStatus({ type: "err", text: e.message || "Save failed." });
    }
  }

  const about = contactDraft?.[0] || {};
  const aboutLinks = Array.isArray(about.aboutLinks) ? about.aboutLinks : [];

  return (
    <>
      <style>{`
        html, body { margin:0; padding:0; background:#000; color:#fff; font-family: Arial, Helvetica, sans-serif; }
        * { box-sizing:border-box; }
        a { color:#fff; }
        .wrap { min-height:100vh; background:#000; color:#fff; }
        .topbar {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 18px; border-bottom:2px solid #fff;
        }
        .brand { font-weight:900; letter-spacing:0.5px; }
        .tabs { display:flex; gap:10px; flex-wrap:wrap; }
        .tabBtn {
          background:#000; color:#fff; border:2px solid #fff;
          padding:8px 12px; cursor:pointer; font-weight:800;
        }
        .tabBtn.active { background:#fff; color:#000; }
        .content { padding:18px; max-width:1200px; margin:0 auto; }
        .panel { border:2px solid #fff; padding:14px; }
        .row { display:flex; gap:14px; }
        .left { width:320px; min-width:320px; border-right:2px solid #fff; padding-right:14px; }
        .right { flex:1; }
        .h { font-size:18px; font-weight:900; margin-bottom:10px; }
        .muted { color:#bbb; font-size:13px; line-height:1.3; }
        .field { margin-bottom:12px; }
        .label { font-weight:900; margin-bottom:6px; }
        .input, .textarea {
          width:100%; background:#000; color:#fff;
          border:2px solid #fff; padding:10px; outline:none;
        }
        .textarea { min-height:110px; resize:vertical; }
        .btnRow { display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; align-items:center; }
        .btn {
          background:#000; color:#fff; border:2px solid #fff;
          padding:9px 12px; cursor:pointer; font-weight:900;
        }
        .btn:hover { background:#111; }
        .btn.danger { border-color:#ff6b6b; color:#ffb3b3; }
        .btn.danger:hover { background:#1a0000; }
        .statusOk { margin-top:10px; color:#7CFF9B; font-weight:900; }
        .statusErr { margin-top:10px; color:#FF7C7C; font-weight:900; }
        .projItem {
          padding:10px; border:2px solid #fff; cursor:pointer; margin-bottom:10px;
        }
        .projItem.active { background:#fff; color:#000; }
        .tiny { font-size:12px; opacity:0.85; margin-top:4px; }
        .split { display:flex; gap:14px; flex-wrap:wrap; }
        .col { flex:1; min-width:280px; }

        .imgRow { display:flex; gap:12px; align-items:flex-start; }
        .imgPreview {
          width: 140px; height: 100px; border:2px solid #fff; overflow:hidden;
          display:flex; align-items:center; justify-content:center; background:#000;
        }
        .imgPreview img { width:100%; height:100%; object-fit:contain; display:block; }
        .imgEmpty { color:#bbb; font-size:12px; }

        .carouselGrid {
          display:grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 10px;
        }
        .carouselItem { border:2px solid #fff; padding:10px; }
        .carouselImg {
          width: 100%;
          height: 130px;
          border:2px solid #fff;
          margin-bottom:8px;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          background:#000;
        }
        .carouselImg img { width:100%; height:100%; object-fit:contain; }
        .fileBtn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding:9px 12px;
          cursor:pointer;
          font-weight:900;
          background:#000;
          color:#fff;
          border:2px solid #fff;
        }
        .fileBtn:hover{ background:#111; }

        .twoCols {
          display:flex;
          gap:14px;
          flex-wrap:wrap;
        }
        .box {
          border:2px solid #fff;
          padding:12px;
          flex:1;
          min-width:320px;
        }
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <div className="brand">WELCOME, MARCO</div>

          <div className="tabs">
            <button className={`tabBtn ${tab === "projects" ? "active" : ""}`} onClick={() => setTab("projects")}>
              Projects
            </button>
            <button className={`tabBtn ${tab === "upcoming" ? "active" : ""}`} onClick={() => setTab("upcoming")}>
              Upcoming
            </button>
            <button className={`tabBtn ${tab === "photos" ? "active" : ""}`} onClick={() => setTab("photos")}>
              Photos
            </button>
            <button className={`tabBtn ${tab === "about" ? "active" : ""}`} onClick={() => setTab("about")}>
              About/Contact
            </button>
            <button className={`tabBtn ${tab === "important" ? "active" : ""}`} onClick={() => setTab("important")}>
              Destination Email
            </button>
            <button className={`tabBtn ${tab === "home" ? "active" : ""}`} onClick={() => setTab("home")}>
              Home Posters
            </button>
          </div>

          <div className="tabs">
            <button
              className="tabBtn"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST", credentials: "include" }).catch(() => {});
                window.location.href = "/admin/login";
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="content">
          <div className="panel">
            {loading ? <div>Loading…</div> : null}
            {status.type === "ok" ? <div className="statusOk">{status.text}</div> : null}
            {status.type === "err" ? <div className="statusErr">{status.text}</div> : null}

            {!loading && tab === "photos" ? (
              <PhotosManager photos={photos} setPhotos={setPhotos} setStatus={setStatus} />
            ) : null}

            {!loading && tab === "about" ? (
              <>
                <div className="h">About + Contact (same data file)</div>
                <div className="muted">This edits your about section + your existing contact section.</div>

                <div className="twoCols" style={{ marginTop: 12 }}>
                  <div className="box">
                    <div className="h">About section</div>

                    <ImagePathWithUpload
                      label="About photo"
                      value={about.aboutPhoto || ""}
                      onChange={(v) => setContactDraft([{ ...about, aboutPhoto: v }])}
                      scope="about"
                      slugForUpload="about"
                    />

                    <TextArea
                      label="About paragraph"
                      value={about.aboutParagraph || ""}
                      onChange={(v) => setContactDraft([{ ...about, aboutParagraph: v }])}
                    />

                    <div className="h" style={{ marginTop: 12 }}>About links</div>
                    <div className="muted">Label + URL. (Your page can render “LABEL: username” if you want later.)</div>

                    {aboutLinks.slice(0, 4).map((lnk, idx) => (
                      <div key={idx} style={{ border: "2px solid #fff", padding: 10, marginTop: 10 }}>
                        <Field
                          label={`Link ${idx + 1} label`}
                          value={lnk.label || ""}
                          onChange={(v) => {
                            const next = [...aboutLinks];
                            next[idx] = { ...next[idx], label: v };
                            setContactDraft([{ ...about, aboutLinks: next }]);
                          }}
                        />
                        <Field
                          label={`Link ${idx + 1} url`}
                          value={lnk.url || ""}
                          onChange={(v) => {
                            const next = [...aboutLinks];
                            next[idx] = { ...next[idx], url: v };
                            setContactDraft([{ ...about, aboutLinks: next }]);
                          }}
                          placeholder="https://..."
                        />
                      </div>
                    ))}

                    <div className="btnRow" style={{ marginTop: 14 }}>
                      <button className="btn" onClick={saveContact}>Save About/Contact</button>
                    </div>
                  </div>

                  <div className="box">
                    <div className="h">Contact section (existing)</div>

                    <Field
                      label="Name"
                      value={about.name || ""}
                      onChange={(v) => setContactDraft([{ ...about, name: v }])}
                    />

                    <Field
                      label="Phone (10 digits, optional)"
                      value={about.phone || ""}
                      onChange={(v) => setContactDraft([{ ...about, phone: v }])}
                    />

                    <Field
                      label="Email (optional)"
                      value={about.email || ""}
                      onChange={(v) => setContactDraft([{ ...about, email: v }])}
                    />

                    <ImagePathWithUpload
                      label="Contact picture"
                      value={about.picture || ""}
                      onChange={(v) => setContactDraft([{ ...about, picture: v }])}
                      scope="contact"
                      slugForUpload="contact"
                    />

                    <div className="btnRow" style={{ marginTop: 14 }}>
                      <button className="btn" onClick={saveContact}>Save About/Contact</button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {!loading && tab === "important" ? (
              <>
                <div className="h">Email (where messages are sent)</div>

                <div style={{ marginTop: 12 }}>
                  <Field
                    label="Destination email"
                    value={importantDraft?.[0]?.email || ""}
                    onChange={(v) => setImportantDraft([{ email: v }])}
                    placeholder="you@example.com"
                  />

                  <div className="btnRow">
                    <button className="btn" onClick={saveImportant}>Save</button>
                  </div>
                </div>
              </>
            ) : null}

            {!loading && tab === "upcoming" ? (
              <>
                <div className="h">Upcoming posters (full edit)</div>
                <div className="muted">These power /upcoming and /upcoming/[slug].</div>

                <div className="row" style={{ marginTop: 12 }}>
                  <div className="left">
                    <button className="btn" onClick={addUpcoming} style={{ width: "100%", marginBottom: 12 }}>
                      + Add poster
                    </button>

                    {upcomingDraft.map((p) => (
                      <div
                        key={p.slug}
                        className={`projItem ${p.slug === selectedUpcomingSlug ? "active" : ""}`}
                        onClick={() => setSelectedUpcomingSlug(p.slug)}
                        role="button"
                        tabIndex={0}
                      >
                        <div style={{ fontWeight: 900 }}>{p.title || "(no title)"}</div>
                      </div>
                    ))}
                  </div>

                  <div className="right">
                    {!selectedUpcoming ? (
                      <div>Select a poster.</div>
                    ) : (
                      <>
                        <div className="btnRow" style={{ justifyContent: "space-between" }}>
                          <div className="btnRow">
                            <button className="btn" onClick={saveUpcoming}>Save upcoming</button>
                          </div>

                          <button className="btn danger" onClick={() => deleteUpcoming(selectedUpcoming.slug)}>
                            Delete poster
                          </button>
                        </div>

                        <div className="split" style={{ marginTop: 14 }}>
                          <div className="col">
                            <UpcomingEditor
                              item={selectedUpcoming}
                              onChange={(nextItem) => {
                                const oldSlug = selectedUpcoming.slug;
                                const newSlug = (nextItem.slug || "").trim();

                                if (newSlug && newSlug !== oldSlug) {
                                  const existing = new Set(upcomingDraft.map((x) => x.slug));
                                  existing.delete(oldSlug);
                                  const safe = uniqueSlug(newSlug, existing);

                                  const patched = { ...nextItem, slug: safe };
                                  updateUpcoming(oldSlug, patched);
                                  setSelectedUpcomingSlug(safe);
                                  return;
                                }

                                updateUpcoming(oldSlug, nextItem);
                              }}
                              slugForUpload={selectedUpcoming.slug}
                            />
                          </div>
                        </div>

                        <div className="btnRow" style={{ marginTop: 14 }}>
                          <button className="btn" onClick={saveUpcoming}>Save upcoming</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {tab === "home" && (
              <div className="panel">
                <div className="h">Home Posters</div>

                {["left", "right"].map((side) => (
                  <div key={side} className="box">
                    <div className="label">{side.toUpperCase()} Poster</div>

                    <ImagePathWithUpload
                      label="Image"
                      value={homePosters[side].image}
                      onChange={(v) =>
                        setHomePosters((prev) => ({
                          ...prev,
                          [side]: { ...prev[side], image: v },
                        }))
                      }
                      scope="projects"
                      slugForUpload="home"
                    />

                    <div className="field">
                      <div className="label">Custom Link</div>
                      <input
                        className="input"
                        value={homePosters[side].link}
                        onChange={(e) =>
                          setHomePosters((prev) => ({
                            ...prev,
                            [side]: { ...prev[side], link: e.target.value },
                          }))
                        }
                        placeholder="/projects/larrys-spot"
                      />
                    </div>

                    <div className="field">
                      <div className="label">Or Select Project</div>
                      <select
                        className="input"
                        onChange={(e) =>
                          setHomePosters((prev) => ({
                            ...prev,
                            [side]: { ...prev[side], link: `/projects/${e.target.value}` },
                          }))
                        }
                      >
                        <option value="">-- Select --</option>
                        {projectsDraft.map((p) => (
                          <option key={p.slug} value={p.slug}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                <div className="btnRow">
                  <button className="btn" onClick={saveHomePosters}>
                    Save Home Posters
                  </button>
                </div>
              </div>
            )}


            {!loading && tab === "projects" ? (
              <>
                <div className="h">Projects (full edit)</div>

                <div className="row" style={{ marginTop: 12 }}>
                  <div className="left">
                    <button className="btn" onClick={addProject} style={{ width: "100%", marginBottom: 12 }}>
                      + Add project
                    </button>

                    {projectsDraft.map((p) => (
                      <div
                        key={p.slug}
                        className={`projItem ${p.slug === selectedSlug ? "active" : ""}`}
                        onClick={() => {
                          setSelectedSlug(p.slug);
                          setSlugManuallyEdited(false);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div style={{ fontWeight: 900 }}>{p.title || "(no title)"}</div>
                      </div>
                    ))}
                  </div>

                  <div className="right">
                    {!selectedProject ? (
                      <div>Select a project.</div>
                    ) : (
                      <>
                        <div className="btnRow" style={{ justifyContent: "space-between" }}>
                          <div className="btnRow">
                            <button className="btn" onClick={saveProjects}>Save changes</button>
                          </div>

                          <button className="btn danger" onClick={() => deleteProject(selectedProject.slug)}>
                            Delete project
                          </button>
                        </div>

                        <div className="split" style={{ marginTop: 14 }}>
                          <div className="col">
                            <Field
                              label="Title"
                              value={selectedProject.title}
                              onChange={(v) => {
                                const nextTitle = v;
                                updateProjectField(selectedProject.slug, "title", nextTitle);

                                if (!slugManuallyEdited) {
                                  const desired = slugifyTitle(nextTitle) || "new-project";
                                  const existing = new Set(projectsDraft.map((p) => p.slug));
                                  existing.delete(selectedProject.slug);

                                  const newSlug = uniqueSlug(desired, existing);

                                  setProjectsDraft((prev) =>
                                    prev.map((p) => (p.slug === selectedProject.slug ? { ...p, slug: newSlug } : p))
                                  );
                                  setSelectedSlug(newSlug);
                                }
                              }}
                            />

                            <Field
                              label="Slug (auto from title unless you edit here)"
                              value={selectedProject.slug}
                              onChange={(v) => {
                                setSlugManuallyEdited(true);

                                const newSlugRaw = (v || "").trim();
                                const existing = new Set(projectsDraft.map((p) => p.slug));
                                existing.delete(selectedProject.slug);

                                const safe = uniqueSlug(slugifyTitle(newSlugRaw) || newSlugRaw || "new-project", existing);

                                setProjectsDraft((prev) =>
                                  prev.map((p) => (p.slug === selectedProject.slug ? { ...p, slug: safe } : p))
                                );
                                setSelectedSlug(safe);
                              }}
                              placeholder="e.g. larrys-spot"
                            />

                            <TextArea
                              label="Overview"
                              value={selectedProject.overview}
                              onChange={(v) => updateProjectField(selectedProject.slug, "overview", v)}
                            />

                            <ImagePathWithUpload
                              label="Main picture"
                              value={selectedProject.mainPicture}
                              onChange={(v) => updateProjectField(selectedProject.slug, "mainPicture", v)}
                              scope="projects"
                              slugForUpload={selectedProject.slug}
                            />

                            <CarouselEditor
                              items={selectedProject.carousel || []}
                              onChange={(arr) => updateProjectField(selectedProject.slug, "carousel", arr)}
                              slugForUpload={selectedProject.slug}
                            />
                          </div>

                          <div className="col">
                            <TextArea
                              label="Director Biography"
                              value={selectedProject.directorBiography}
                              onChange={(v) => updateProjectField(selectedProject.slug, "directorBiography", v)}
                            />

                            <TextArea
                              label="Director Statement"
                              value={selectedProject.directorStatement}
                              onChange={(v) => updateProjectField(selectedProject.slug, "directorStatement", v)}
                            />

                            <TextArea
                              label="Credits"
                              value={selectedProject.credits}
                              onChange={(v) => updateProjectField(selectedProject.slug, "credits", v)}
                            />

                            <Field
                              label="Completion Date"
                              value={selectedProject.completionDate}
                              onChange={(v) => updateProjectField(selectedProject.slug, "completionDate", v)}
                              placeholder="July 27, 2025"
                            />

                            <Field
                              label="Project Type"
                              value={selectedProject.projectType}
                              onChange={(v) => updateProjectField(selectedProject.slug, "projectType", v)}
                            />

                            <Field
                              label="Genres"
                              value={selectedProject.genres}
                              onChange={(v) => updateProjectField(selectedProject.slug, "genres", v)}
                            />

                            <Field
                              label="Runtime"
                              value={selectedProject.runtime}
                              onChange={(v) => updateProjectField(selectedProject.slug, "runtime", v)}
                              placeholder="5 minutes 10 seconds"
                            />

                            <Field
                              label="Production Budget"
                              value={selectedProject.productionBudget}
                              onChange={(v) => updateProjectField(selectedProject.slug, "productionBudget", v)}
                              placeholder="0 USD"
                            />

                            <Field
                              label="Country of Origin"
                              value={selectedProject.countryOfOrigin}
                              onChange={(v) => updateProjectField(selectedProject.slug, "countryOfOrigin", v)}
                            />

                            <Field
                              label="Country of Filming"
                              value={selectedProject.countryOfFilming}
                              onChange={(v) => updateProjectField(selectedProject.slug, "countryOfFilming", v)}
                            />

                            <Field
                              label="Shooting Format"
                              value={selectedProject.shootingFormat}
                              onChange={(v) => updateProjectField(selectedProject.slug, "shootingFormat", v)}
                            />

                            <Field
                              label="Aspect Ratio"
                              value={selectedProject.aspectRatio}
                              onChange={(v) => updateProjectField(selectedProject.slug, "aspectRatio", v)}
                              placeholder="4:3"
                            />

                            <Field
                              label="Film Color"
                              value={selectedProject.filmColor}
                              onChange={(v) => updateProjectField(selectedProject.slug, "filmColor", v)}
                            />

                            <Field
                              label="First-time Filmmaker"
                              value={selectedProject.firstTimeFilmmaker}
                              onChange={(v) => updateProjectField(selectedProject.slug, "firstTimeFilmmaker", v)}
                            />

                            <Field
                              label="Student Project"
                              value={selectedProject.studentProject}
                              onChange={(v) => updateProjectField(selectedProject.slug, "studentProject", v)}
                            />
                          </div>
                        </div>

                        <div className="btnRow" style={{ marginTop: 14 }}>
                          <button className="btn" onClick={saveProjects}>Save changes</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
