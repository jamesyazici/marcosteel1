"use client";

import BackButton from "../components/BackButton";
import projects from "../data/projects.json";

export default function CorporatePortfolio() {
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

        .topsection { display:flex; }
        .title {
          flex:2;
          height:60px;
          padding-left:20px;
          padding-top:30px;
          font-size:50px;
          color:white;
          font-weight:bolder;
        }
        .nav { flex:3; display:flex; height:100px; }
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

        .mainbody { width:100%; background-color:white; }

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
          padding:16px;
          border-left:2px solid gray;
          border-right:2px solid gray;
          border-bottom:2px solid gray;
        }

        /* GRID: aim for 5 across like you asked */
        .grid {
          display:grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }
        @media (max-width: 1200px) {
          .grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 800px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .grid { grid-template-columns: repeat(1, 1fr); }
        }

        .card {
          background:#fff;
          border:2px solid gray;
          overflow:hidden;
          cursor:pointer;
        }
        .posterWrap {
          width:100%;
          aspect-ratio: 2 / 3; /* poster vibe */
          background:#ddd;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
        }
        .posterWrap img {
          width:100%;
          height:100%;
          object-fit: cover;
          display:block;
        }

        .cardText {
          padding:10px;
          background:#fff;
        }
        .cardTitle {
          font-weight:bolder;
          color:#46606a;
          margin-bottom:6px;
          line-height:1.15;
        }
        .cardGenre {
          font-size:13px;
          color:#333;
          line-height:1.2;
        }
      `}</style>

      {/* top bar */}
      <div style={{ display: "flex", height: "30px", backgroundColor: "#46606a", width: "100%" }}>
        <BackButton fallbackHref="/">
          <div className="backbutton">&lt; back</div>
        </BackButton>
      </div>

      <div className="bigcontainer">
        <div className="leftrightmargins"></div>

        <div className="middlebody">
          <div className="topsection">
            <div className="title">Portfolio</div>

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
            <div style={{ padding: 20 }}>
              <div className="sectionTitle">FILMS</div>
              <div className="sectionBody">
                <div className="grid">
                  {(projects || []).map((p) => (
                    <a key={p.slug} href={`/projects/${p.slug}`} className="card">
                      <div className="posterWrap">
                        {p.mainPicture ? (
                          <img src={p.mainPicture} alt={p.title || p.slug} />
                        ) : (
                          <div style={{ color: "#666", fontWeight: "bold" }}>No poster</div>
                        )}
                      </div>

                      <div className="cardText">
                        <div className="cardTitle">{p.title || "(Untitled)"}</div>
                        <div className="cardGenre">{p.genres || ""}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="leftrightmargins"></div>
      </div>
    </>
  );
}
