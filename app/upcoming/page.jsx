import BackButton from "../components/BackButton";
import upcoming from "../data/upcoming.json";

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export default function UpcomingPage() {
  const items = Array.isArray(upcoming) ? upcoming : [];

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          background-color: #46606a;
          font-family: Arial, Helvetica, sans-serif;
          font-size:16px;
          color:black;
        }
        * { margin:0; padding:0; line-height:1; box-sizing:border-box; }
        a { color: inherit; text-decoration: none; }

        .backbutton {
          display:flex;
          width:80px;
          height:18px;
          margin-top:4px;
          margin-left:4px;
          background-color:#46606a;
          font-size:small;
          align-items:center;
          justify-content:center;
          font-weight:bolder;
          border:3px solid white;
          color:white;
        }

        .bigcontainer { display:flex; width:100%; }
        .leftrightmargins { flex:1; }
        .middlebody { flex:10; background-color:#46606a; }

        .topsection { display:flex; align-items:stretch; }

        /* ✅ FIX: no fixed height, no clipping */
        .title {
          flex:2;
          padding-left:20px;
          padding-top:26px;
          padding-bottom:18px;
          color:white;
          font-weight:bolder;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: clamp(28px, 3.2vw, 50px);
          line-height: 1.05; /* ✅ avoid cut-off */
        }

        .nav { flex:3; display:flex; min-height:100px; }
        .navbar { display:flex; justify-content:right; width:100%; }
        .navitem {
          flex:1;
          display:flex;
          justify-content:center;
          align-items:center;
          color:white;
          font-weight:bolder;
        }
        .navbar a {
          display:flex;
          justify-content:center;
          align-items:center;
          color:white;
          font-weight:bolder;
          text-decoration:none;
          padding:20px;
          flex:1;
        }

        .mainbody { width:100%; background-color:white; padding: 20px; padding-bottom: 60px; }

        .sectionTitle {
          background-color:#46606a;
          height:30px;
          display:flex;
          align-items:center;
          padding-left:8px;
          color:white;
          font-weight:bolder;
          border-top:2px solid gray;
          border-left:2px solid gray;
          border-right:2px solid gray;
        }
        .sectionBody {
          background-color:#eeeeee;
          padding:14px;
          border-left:2px solid gray;
          border-right:2px solid gray;
          border-bottom:2px solid gray;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 1100px) { .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (max-width: 900px)  { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 650px)  { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

        .card {
          border: 2px solid gray;
          background: #f7f7f7;
          padding: 10px;
        }
        .posterWrap {
          width: 100%;
          aspect-ratio: 2 / 3;
          border: 2px solid #46606a;
          background: #ddd;
          overflow: hidden;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .posterWrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display:block;
        }

        .meta { margin-top: 10px; line-height: 1.2; }
        .metaTitle {
          font-weight: bolder;
          color: #46606a;
          font-size: 16px;
          line-height: 1.15;
        }
        .metaSmall { margin-top: 6px; font-size: 13px; color: #333; line-height: 1.25; }

        .desc {
          margin-top: 8px;
          font-size: 13px;
          color: #222;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .linkBtn {
          margin-top: 10px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          background-color:#46606a;
          border:3px solid white;
          color:white;
          font-weight:bolder;
          padding:6px 10px;
          cursor:pointer;
        }

        .warn {
          margin-top: 8px;
          font-size: 12px;
          color: #b34b4b;
          font-weight: bolder;
        }
      `}</style>

      <div style={{ display: "flex", height: "30px", backgroundColor: "#46606a", width: "100%" }}>
        <BackButton fallbackHref="/">
          <div className="backbutton">&lt; back</div>
        </BackButton>
      </div>

      <div className="bigcontainer">
        <div className="leftrightmargins" />

        <div className="middlebody">
          <div className="topsection">
            <div className="title">Upcoming</div>

            <div className="nav">
              <div className="navbar">
                <div className="navitem"><p> </p></div>

                <a href="/"><div className="navitem">Home</div></a>
                <a href="/photos" style={{ borderLeft: "1px solid white" }}><div className="navitem">Photos</div></a>
                <a href="/corporateportfolio" style={{ borderLeft: "1px solid white" }}><div className="navitem">Portfolio</div></a>
                <a href="/upcoming" style={{ borderLeft: "1px solid white" }}><div className="navitem">Upcoming</div></a>
                <a href="/contact" style={{ borderLeft: "1px solid white" }}><div className="navitem">Contact</div></a>
              </div>
            </div>
          </div>

          <div className="mainbody">
            <div className="sectionTitle">UPCOMING</div>
            <div className="sectionBody">
              {items.length === 0 ? (
                <div style={{ padding: 10, color: "#333", lineHeight: 1.3 }}>
                  No upcoming items yet. Add some to <b>app/data/upcoming.json</b>.
                </div>
              ) : (
                <div className="grid">
                  {items.map((it, idx) => {
                    const safeSlug = it?.slug || slugify(it?.title) || `item-${idx}`;
                    const href = `/upcoming/${safeSlug}`;
                    const missingSlug = !it?.slug;

                    return (
                      <div key={""} className="card">
                        <a aria-label={it?.title || "Poster"}>
                          <div className="posterWrap">
                            <img src={it?.image || ""} alt={it?.title || "Poster"} />
                          </div>
                        </a>

                        <div className="meta">
                          <a href={href}>
                            <div className="metaTitle">{it?.title || "(no title)"}</div>
                          </a>

                          {(it?.date || it?.location) ? (
                            <div className="metaSmall">
                              {it?.date ? <div><b>Date:</b> {it.date}</div> : null}
                              {it?.location ? <div><b>Location:</b> {it.location}</div> : null}
                            </div>
                          ) : null}

                          {it?.description ? <div className="desc">{it.description}</div> : null}

                          {it?.linkUrl ? (
                            <a className="linkBtn" href={it.linkUrl} target="_blank" rel="noreferrer">
                              {it?.linkText ? it.linkText : "Link"}
                            </a>
                          ) : null}

                          {missingSlug ? <div className="warn">Missing slug → please set it in admin.</div> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="leftrightmargins" />
      </div>
    </>
  );
}
