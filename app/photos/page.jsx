'use server';

import BackButton from "../components/BackButton";
import { readBlob } from "@/lib/blobStorage";

export default async function PhotosPage() {
  // Fetch photos from blob storage (with fallback to static JSON)
  const photosJson = await readBlob("photos.json");
  const photos = JSON.parse(photosJson || "[]");

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          background-color: #46606a;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 16px;
          color: black;
        }
        * { margin:0; padding:0; line-height:1; box-sizing:border-box; }
        a { color: inherit; }

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
          box-sizing:border-box;
        }

        .mainbody {
          width:100%;
          background-color:white;
          padding:20px;
          padding-bottom:40px;
          min-height: 60vh;
        }

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
          padding:12px;
          border-left:2px solid gray;
          border-right:2px solid gray;
          border-bottom:2px solid gray;
        }

        /* VSCO-style 3-column masonry using CSS columns */
        .masonry {
          column-count: 3;
          column-gap: 14px;
        }
        @media (max-width: 900px) {
          .masonry { column-count: 2; }
        }
        @media (max-width: 600px) {
          .masonry { column-count: 1; }
        }

        .photoCard {
          break-inside: avoid;
          margin-bottom: 14px;
          border: 2px solid gray;
          background: white;
          overflow: hidden;
        }

        .photoCard img {
          width: 100%;
          height: auto;
          display: block;
        }

        .empty {
          padding: 12px;
          color: #444;
          line-height: 1.3;
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
            <div className="title">Photos</div>

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
            <div className="sectionTitle">GALLERY</div>
            <div className="sectionBody">
              {photos.length === 0 ? (
                <div className="empty">
                  No photos available.
                </div>
              ) : (
                <div className="masonry">
                  {photos.map((photo) => (
                    <div key={photo.url} className="photoCard">
                      <img src={photo.url} alt={photo.name || "Photo"} loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="leftrightmargins"></div>
      </div>
    </>
  );
}
