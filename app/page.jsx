"use client";

import { useEffect, useState } from "react";

function AdjustablePoster({
  src,
  link,
  top = "50%",
  left = "50%",
  width = "20%",
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  skewX = 0,
  skewY = 0,
  opacity = 0.8,
}) {
  // 🚀 CRITICAL FIX: do not render if no image
  if (!src) return null;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        transform: "translate(-50%, -50%)",
        zIndex: 5,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          opacity,
          transform: `
            perspective(1200px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            rotateZ(${rotateZ}deg)
            skew(${skewX}deg, ${skewY}deg)
          `,
          transformStyle: "preserve-3d",
          transition: "transform 0.3s ease",
        }}
      >
        <a href={link || "#"}>
          <img
            src={src}
            alt=""
            style={{
              width: "100%",
              display: "block",
              cursor: "pointer",
              // boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              opacity: "0.9",
            }}
          />
        </a>
      </div>
    </div>
  );
}

export default function Home() {
  const [homePosters, setHomePosters] = useState({
    left: { image: "", link: "" },
    right: { image: "", link: "" },
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/home-posters", {
          cache: "no-store",
        });
        const json = await res.json();
        if (json?.ok && json.data) {
          setHomePosters(json.data);
        }
      } catch (e) {
        console.error("Could not load home posters");
      }
    }
    load();
  }, []);

  return (
    <div className="video-container">
      {/* Background Video */}
      <video className="videobg" autoPlay muted loop playsInline>
        <source src={process.env.NEXT_PUBLIC_HOME_VIDEO_URL} type="video/mp4" />
        Video failed to load
      </video>

      {/* Navigation Icons (UNCHANGED FROM YOUR SITE) */}
      <div className="telephone">
        <a href="/contact">
          <img src="/telephone.png" alt="Contact" />
        </a>
      </div>

      <div className="computer">
        <a href="/corporateportfolio">
          <img src="/computer.png" alt="Corporate Portfolio" />
        </a>
      </div>

      <div className="camera">
        <a href="/photos">
          <img src="/camera.png" alt="Photos" />
        </a>
      </div>

      {/* LEFT POSTER */}
      <AdjustablePoster
        src={homePosters.left.image}
        link={homePosters.left.link}
        top="39%"
        left="18.5%"
        width="21%"
        rotateY={25}
        skewY={-5}
      />

      {/* RIGHT POSTER */}
      <AdjustablePoster
        src={homePosters.right.image}
        link={homePosters.right.link}
        top="44%"
        left="82%"
        width="21%"
        rotateY={-21}
        skewY={6}
      />
    </div>
  );
}
