"use client";

import { useState } from "react";
import BackButton from "../components/BackButton";
import contactData from "../data/contact.json";
import aboutData from "../data/about.json";

function normalizePhone(input) {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return null;
}

function isValidEmail(input) {
  const s = (input || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Extract a nice "username-ish" display from URL
function displayFromUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";

  try {
    const parsed = new URL(u.startsWith("http") ? u : `https://${u}`);
    let p = decodeURIComponent(parsed.pathname || "");
    p = p.replace(/\/+$/, ""); // trim trailing slashes
    const last = p.split("/").filter(Boolean).pop() || "";

    // common cleanup
    const cleaned = last.replace(/^@/, "");
    return cleaned || parsed.hostname.replace(/^www\./, "");
  } catch {
    // fallback if URL is not parseable
    const parts = u.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return last.replace(/^@/, "") || u;
  }
}

export default function Contact() {
  const profile = contactData?.[0] || {};

  const name = profile.name || "";
  const phone = profile.phone || "";
  const email = profile.email || "";
  const picture = profile.picture || "";

  const formattedPhone =
    phone && phone.replace(/\D/g, "").length === 10
      ? `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
      : "";

  const about = aboutData?.[0] || {};
  const aboutPhoto = about.photo || "";
  const aboutParagraph = about.paragraph || "";
  const aboutLinks = Array.isArray(about.links) ? about.links.slice(0, 4) : [];

  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const [contactError, setContactError] = useState("");
  const [messageError, setMessageError] = useState("");

  const [status, setStatus] = useState({ type: "", text: "" }); // type: "ok" | "err" | ""

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", text: "" });

    setContactError("");
    setMessageError("");

    const contactTrim = contact.trim();
    const messageTrim = message.trim();

    if (!contactTrim) {
      setContactError("Remember to add a phone number or email address");
      return;
    }

    const phone10 = normalizePhone(contactTrim);
    const emailOk = isValidEmail(contactTrim);

    if (!phone10 && !emailOk) {
      setContactError("Invalid number or email");
      return;
    }

    if (!messageTrim) {
      setMessageError("Add a message here");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contactTrim, message: messageTrim }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        if (data.field === "contact") setContactError(data.message || "invalid number or email");
        if (data.field === "message") setMessageError(data.message || "Add a message here");

        setStatus({ type: "err", text: data.message || "Could not send message." });
        return;
      }

      setStatus({ type: "ok", text: "Message sent successfully." });
      setContact("");
      setMessage("");
    } catch (err) {
      setStatus({ type: "err", text: "Network error. Please try again." });
    }
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
        }
        .mainbody { width:100%; background-color:white; display:flex; }
        .leftcol { flex:8; padding:20px; }

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

        .contactRow {
          display:flex;
          gap:14px;
          align-items:flex-start;
        }

        .contactPicWrap {
          width: 220px;
          border:2px solid gray;
          background: #dddddd;
          display:flex;
          align-items:flex-start;
          justify-content:center;
        }
        .contactPicWrap img {
          width: 100%;
          height: auto;
          display:block;
        }

        .contactText .nameLine {
          font-size: 20px;
          font-weight: bolder;
          color: #46606a;
          margin-bottom: 6px;
        }
        .contactText p { margin-bottom: 6px; line-height: 1.2; }
        .emphasis { font-weight: bold; }

        .formRow { margin-top: 14px; }
        label { display:block; font-weight:bolder; margin-bottom:6px; color:#46606a; }

        input, textarea {
          width:100%;
          padding:10px;
          border:2px solid gray;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
          outline: none;
        }
        textarea { min-height: 160px; resize: vertical; }

        .invalid {
          border-color: #c04b4b !important;
          background: #fff5f5;
        }

        .errorText {
          color:#c04b4b;
          font-size: 13px;
          margin-top: 6px;
        }

        .submitBtn {
          margin-top: 14px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          background-color:#46606a;
          border:3px solid white;
          color:white;
          font-weight:bolder;
          padding:8px 14px;
          cursor:pointer;
        }

        .statusOk { color: #1c6b2a; font-weight: bold; margin-top: 12px; }
        .statusErr { color: #c04b4b; font-weight: bold; margin-top: 12px; }

        /* ABOUT layout */
        .aboutRow{
          display:flex;
          gap:14px;
          align-items:flex-start;
        }
        .aboutPicWrap{
          width: 260px;
          border:2px solid gray;
          background:#dddddd;
          display:flex;
          justify-content:center;
          align-items:flex-start;
        }
        .aboutPicWrap img{
          width:100%;
          height:auto;
          display:block;
        }
        .aboutMain{
          flex:1;
          display:flex;
          gap:16px;
          align-items:flex-start;
        }
        .aboutParagraph{
          flex:3;
        }
        .aboutParagraph p{
          line-height:1.2;
          margin-bottom:10px;
          white-space:pre-line;
        }
        .aboutLinks{
          flex:2;
          display:flex;
          flex-direction:column;
          gap:10px;
        }
        .linkCard{
          display:flex;
          align-items:center;
          justify-content:center;
          background:#46606a;
          color:white;
          font-weight:bolder;
          text-decoration:none;
          border:3px solid white;
          padding:10px 12px;
          text-align:center;
        }
        .linkCard:hover{ opacity:0.92; }
        .linkMuted{ opacity:0.9; font-weight:normal; }
      `}</style>

      <div style={{ display: "flex", height: "30px", backgroundColor: "#46606a", width: "100%" }}>
        <BackButton fallbackHref="/">
          <div className="backbutton">&lt; back</div>
        </BackButton>
      </div>

      <div className="bigcontainer">
        <div className="leftrightmargins"></div>

        <div className="middlebody">
          <div className="topsection">
            <div className="title">Contact</div>

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
            <div className="leftcol">

              {/* ABOUT */}
              <div className="sectionTitle">ABOUT ME</div>
              <div className="sectionBody">
                <div className="aboutRow">
                  <div className="aboutPicWrap">
                    {aboutPhoto ? <img src={aboutPhoto} alt="About" /> : <div style={{ padding: 12 }}>No photo</div>}
                  </div>

                  <div className="aboutMain">
                    <div className="aboutParagraph">
                      <p className="contactText nameLine" style={{ marginBottom: 10 }}>{name || "About"}</p>
                      <p>{aboutParagraph || ""}</p>
                    </div>

                    <div className="aboutLinks">
                      {aboutLinks.map((x, idx) => {
                        const label = (x?.label || "").trim();
                        const url = (x?.url || "").trim();
                        if (!label && !url) return null;

                        const who = displayFromUrl(url);
                        return (
                          <a key={idx} className="linkCard" href={url || "#"} target="_blank" rel="noreferrer">
                            <span>
                              {label}
                              {who ? <span className="linkMuted">{`: ${who}`}</span> : null}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height: 16 }} />

              {/* YOUR EXISTING CONTACT SECTION (UNCHANGED) */}
              <div className="sectionTitle">CONTACT INFORMATION</div>
              <div className="sectionBody">
                <div className="contactRow">
                  <div className="contactPicWrap">
                    <img src={picture} alt="Contact" />
                  </div>

                  <div className="contactText">
                    <p className="nameLine">{name}</p>

                    {formattedPhone ? (
                      <p>
                        Call at: <span className="emphasis">{formattedPhone}</span>
                      </p>
                    ) : null}

                    {email ? (
                      <p>
                        Mail at: <span className="emphasis">{email}</span>
                      </p>
                    ) : null}

                    <p>Or send a message below:</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="formRow">
                  <label>Email or number:</label>
                  <input
                    className={contactError ? "invalid" : ""}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder=""
                  />
                  {contactError ? <div className="errorText">{contactError}</div> : null}
                </div>

                <div className="formRow">
                  <label>Message:</label>
                  <textarea
                    className={messageError ? "invalid" : ""}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder=""
                  />
                  {messageError ? <div className="errorText">{messageError}</div> : null}
                </div>

                <button type="submit" className="submitBtn">
                  Submit
                </button>

                {status.type === "ok" ? <div className="statusOk">{status.text}</div> : null}
                {status.type === "err" ? <div className="statusErr">{status.text}</div> : null}
              </form>
            </div>
          </div>
        </div>

        <div className="leftrightmargins"></div>
      </div>
    </>
  );
}