"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import projects from "../../data/projects.json";
import BackButton from "../../components/BackButton";

export default function ProjectPage() {
  const params = useParams();
  const slug = params?.slug; // string for [slug]
  const project = projects.find((p) => p.slug === slug);

  useEffect(() => {
    const frame = document.getElementById("carouselFrame");
    if (!frame) return;

    const handler = (e) => {
        if (!e.data || e.data.type !== "carouselHeight") return;
        const h = Math.max(1, Number(e.data.height) || 0);
        frame.style.height = h + "px";
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    }, []);


  // If slug missing (shouldn't happen if route is correct), show fallback
  if (!slug) {
    return (
      <div style={{ padding: 20, fontFamily: "Arial" }}>
        <h1>Missing slug</h1>
        <a href="/">Go home</a>
      </div>
    );
  }

  // If slug doesn't exist in JSON, show fallback
  if (!project) {
    return (
      <div style={{ padding: 20, fontFamily: "Arial" }}>
        <h1>Project not found</h1>
        <p>Requested slug: {slug}</p>
        <p>Known slugs: {projects.map((p) => p.slug).join(", ")}</p>
        <a href="/">Go home</a>
      </div>
    );
  }

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          background-color: #46606a;
          background-size: 100%;
          font-family: Arial, Helvetica, sans-serif;
          font-size:16px;
          color:black;
        }
        h1, h2, h3, p, div, a {
          font-family: Arial, Helvetica, sans-serif;
        }
        * {
          margin:0px;
          padding:0px;
          box-sizing: border-box;
        }
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
        .bigcontainer {
          display:flex;
          padding:0px;
          margin:0px;
          width:100%;
        }
        .leftrightmargins {
          flex:1;
        }
        .middlebody {
          flex:10;
          background-color:#46606a;
          height:100%;
          padding-bottom:60px;
        }
        .topsection {
          display:flex;
        }
        .title {
          flex: 2;

          padding-left: 20px;
          padding-top: 30px;
          padding-bottom: 10px;

          color: white;
          font-weight: bolder;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          line-height: 1.05;         /* important: prevents clipping */
          font-size: clamp(22px, 2.6vw, 50px);

          /* REMOVE height:60px; */
        }
        .nav {
          flex:3;
          // min-width:820px;
          display:flex;
          height:100px;
        }
        .mainbody {
          width:100%;
          background-color:white;
          display:flex;
          padding-bottom:15px;
        }
        .directorsection {
          flex:3;
        }
        .overviewsection {
          flex:5;
        }
        .detailssection {
          flex:3;
        }
        .filmoverviewcontainer {
          width:90%;
          height:90px;
          margin-left:5%;
          margin-top:20px;
        }
        .filmoverviewtitle {
          background-color:#46606a;
          width:100%;
          height:30px;
          display:flex;
          color:white;
          font-weight:bolder;
          align-items:center;
          padding-left:5px;
          box-sizing:border-box;
          border-top:2px solid gray;
          border-left:2px solid gray;
          border-right:2px solid gray;
        }
        .filmoverview {
          background-color:#eeeeee;
          width:100%;
          box-sizing:border-box;
          padding:10px;
          border-left:2px solid gray;
          border-bottom:2px solid gray;
          border-right:2px solid gray;
          white-space:pre-line;
          line-height:1.1;
        }
        .navbar {
          display:flex;
          justify-content:right;
          width:100%;
          box-sizing: border-box;
        }
        .navitem {
          flex:1;
          display:flex;
          justify-content:center;
          align-items:center;
          color:white;
          font-weight:bolder;
          box-sizing: border-box;
        }
        .navbar a {
          display:flex;
          justify-content:center;
          align-items:center;
          color:white;
          font-weight:bolder;
          text-decoration:none;
          box-sizing:border-box;
          padding:20px;
          flex:1;
        }
        .detailscontainer {
          background-color:#eeeeee;
          width:100%;
          padding-top:20px;
          box-sizing:border-box;
          height:100%;
        }
        .detailscontainer2 {
          margin-left:10%;
          width:90%;
          background-color:#46606a;
          height:20px;
          color:white;
          font-weight:bolder;
          display:flex;
          align-items:center;
          box-sizing:border-box;
          padding-left:15px;
        }
        .detailsdetail {
          margin-left:20%;
          margin-top:5px;
          margin-bottom:5px;
        }
      `}</style>

      <div
        style={{
          display: "flex",
          height: "30px",
          backgroundColor: "#46606a",
          margin: "0%",
          width: "100%",
        }}
      >
        <BackButton fallbackHref="/">
            <div className="backbutton">&lt; back</div>
        </BackButton>
      </div>

      <div className="bigcontainer">
        <div className="leftrightmargins"></div>

        <div className="middlebody" style={{ borderTop: "0px solid white" }}>
          <div className="topsection">
            <div className="title">{project.title}</div>

            <div className="nav">
              <div className="navbar">
                <div className="navitem">
                  <p> </p>
                </div>

                <a href="/">
                  <div className="navitem">Home</div>
                </a>

                <a href="/photos" style={{ borderLeft: "1px solid white" }}>
                  <div className="navitem">Photos</div>
                </a>

                <a
                  href="/corporateportfolio"
                  style={{ borderLeft: "1px solid white" }}
                >
                  <div className="navitem">Portfolio</div>
                </a>

                <a href="/upcoming" style={{ borderLeft: "1px solid white" }}><div className="navitem">Upcoming</div></a>

                <a href="/contact" style={{ borderLeft: "1px solid white" }}>
                  <div className="navitem">Contact</div>
                </a>
              </div>
            </div>
          </div>

          <div className="mainbody">
            <div className="directorsection">
              <img
                src={project.mainPicture}
                style={{ padding: "5% 5% 0% 5%", width: "100%" }}
                alt={`${project.title} main`}
              />

              <h3
                style={{
                  color: "gray",
                  fontWeight: "bolder",
                  marginLeft: "10px",
                  marginTop: "20px",
                }}
              >
                Director Biography
              </h3>
              <p
                style={{
                  marginLeft: "15px",
                  marginRight: "15px",
                  marginTop: "5px",
                  whiteSpace: "pre-line",
                  lineHeight: "1.2",
                }}
              >
                {project.directorBiography}
              </p>

              <h3
                style={{
                  color: "gray",
                  fontWeight: "bolder",
                  marginLeft: "10px",
                  marginTop: "10px",
                }}
              >
                Director Statement
              </h3>
              <p
                style={{
                  marginLeft: "15px",
                  marginRight: "15px",
                  marginTop: "5px",
                  whiteSpace: "pre-line",
                  lineHeight: "1.2",
                }}
              >
                {project.directorStatement}
              </p>
            </div>

            <div className="overviewsection">
              <div className="filmoverviewcontainer">
                <div className="filmoverviewtitle">FILM OVERVIEW</div>
                <div className="filmoverview">{project.overview}</div>
              </div>

              <iframe
                id="carouselFrame"
                src={`/carousel.html?slug=${project.slug}`}
                style={{ width: "100%", border: "none", overflow: "hidden", marginTop: "15px"}}
                scrolling="no"
                title="carousel"
              />

              <div className="filmoverviewcontainer">
                <div className="filmoverviewtitle">CREDITS</div>
                <div className="filmoverview">{project.credits}</div>
              </div>
            </div>

            <div className="detailssection">
              <div className="detailscontainer">
                <div className="detailscontainer2">PROJECT TYPE</div>
                <div className="detailsdetail">{project.projectType}</div>

                <div className="detailscontainer2">GENRES</div>
                <div className="detailsdetail">{project.genres}</div>

                <div className="detailscontainer2">RUNTIME</div>
                <div className="detailsdetail">{project.runtime}</div>

                <div className="detailscontainer2">COMPLETION DATE</div>
                <div className="detailsdetail">{project.completionDate}</div>

                <div className="detailscontainer2">PRODUCTION BUDGET</div>
                <div className="detailsdetail">{project.productionBudget}</div>

                {/* <div className="detailscontainer2">COUNTRY OF ORIGIN</div>
                <div className="detailsdetail">{project.countryOfOrigin}</div> */}

                <div className="detailscontainer2">COUNTRY OF FILMING</div>
                <div className="detailsdetail">{project.countryOfFilming}</div>

                <div className="detailscontainer2">SHOOTING FORMAT</div>
                <div className="detailsdetail">{project.shootingFormat}</div>

                <div className="detailscontainer2">ASPECT RATIO</div>
                <div className="detailsdetail">{project.aspectRatio}</div>

                <div className="detailscontainer2">FILM COLOR</div>
                <div className="detailsdetail">{project.filmColor}</div>

                {/* <div className="detailscontainer2">FIRST-TIME FILMMAKER</div>
                <div className="detailsdetail">{project.firstTimeFilmmaker}</div> */}

                <div className="detailscontainer2">STUDENT PROJECT</div>
                <div className="detailsdetail">{project.studentProject}</div>

                <div className="detailsdetail">
                  <p style={{ color: "#eeeeee" }}>yo</p>
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
