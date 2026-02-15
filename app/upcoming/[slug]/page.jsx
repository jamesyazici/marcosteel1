import BackButton from "../../components/BackButton";
import upcoming from "../../data/upcoming.json";

export default function UpcomingDetailPage({ params }) {
  const slug = params?.slug;
  const items = Array.isArray(upcoming) ? upcoming : [];
  const item = items.find((x) => x.slug === slug);

  if (!item) {
    return (
      <div style={{ padding: 20, fontFamily: "Arial" }}>
        <h1>Not found</h1>
        <p>Unknown slug: {String(slug)}</p>
        <a href="/upcoming">Back to Upcoming</a>
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
          font-family: Arial, Helvetica, sans-serif;
          font-size:16px;
          color:black;
        }
        * { margin:0; padding:0; line-height:1; box-sizing:border-box; }
        a { color: inherit; text-decoration: none; }

        .backbutton {
          display:flex;
          width:100px;
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
          color:white;
          font-weight:bolder;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 50px;
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

        .hero {
          display:flex;
          gap: 18px;
          align-items:flex-start;
        }
        .poster {
          width: 260px;
          border: 2px solid gray;
          background:#ddd;
        }
        .poster img {
          width:100%;
          height:auto;
          display:block;
        }
        .info h2 {
          color:#46606a;
          font-weight:bolder;
          margin-bottom: 10px;
          line-height: 1.1;
        }
        .info p { margin-bottom: 8px; line-height: 1.25; }

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
      `}</style>

      <div style={{ display: "flex", height: "30px", backgroundColor: "#46606a", width: "100%" }}>
        <BackButton fallbackHref="/upcoming">
          <div className="backbutton">&lt; upcoming</div>
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
                <a href="/contact" style={{ borderLeft: "1px solid white" }}><div className="navitem">Contact</div></a>
              </div>
            </div>
          </div>

          <div className="mainbody">
            <div className="sectionTitle">{item.title}</div>
            <div className="sectionBody">
              <div className="hero">
                <div className="poster">
                  <img src={item.image} alt={item.title} />
                </div>

                <div className="info">
                  <h2>{item.title}</h2>

                  {item.date ? <p><b>Date:</b> {item.date}</p> : null}
                  {item.location ? <p><b>Location:</b> {item.location}</p> : null}
                  {item.description ? <p style={{ whiteSpace: "pre-line" }}>{item.description}</p> : null}

                  {item.linkUrl ? (
                    <a className="linkBtn" href={item.linkUrl} target="_blank" rel="noreferrer">
                      {item.linkText ? item.linkText : "Link"}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="leftrightmargins" />
      </div>
    </>
  );
}
