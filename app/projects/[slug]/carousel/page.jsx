import projects from "../../../data/projects.json";

export default function CarouselPage({ params }) {
  const slug = params?.slug;
  const project = (projects || []).find((p) => p.slug === slug);

  const images = Array.isArray(project?.carousel)
    ? project.carousel.filter(Boolean)
    : [];

  // fallback so it still shows something if empty
  const slides = images.length ? images : ["/camera.png"];

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>Carousel</title>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" />
        <style>{`
          body { margin:0; padding:0; background:transparent; }
          .carousel-container {
            margin-left: 5%;
            width: 90%;
            box-sizing: border-box;
            padding: 7px 7px 0px 7px;
            background-color:#eeeeee;
            border-top:2px solid gray;
            border-left:2px solid gray;
            border-right:2px solid gray;
          }
          .carousel-controls-container {
            background-color:#46606a;
            display:flex;
            margin-left:5%;
            width:90%;
            height:30px;
          }
          .carousel-prev, .carousel-next {
            display:flex;
            align-items:center;
            justify-content:center;
            flex:1;
          }
          .cbutton {
            margin: 0 5px;
            background-color:#46606a;
            border:none;
            font-weight:bolder;
            color:white;
          }
            .carousel-inner img {
            width: 100%;
            height: 320px;
            object-fit: contain;
            background: #eeeeee;
          }
        `}</style>
      </head>

      <body>
        <div id="wrap">
          <div id="myCarousel" className="carousel slide carousel-container">
            <div className="carousel-inner">
              {slides.map((src, idx) => (
                <div
                  key={src + idx}
                  className={`carousel-item ${idx === 0 ? "active" : ""}`}
                >
                  <img
                    src={src}
                    className="d-block w-100"
                    alt={`Slide ${idx + 1}`}
                    style={{ objectFit: "contain" }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="carousel-controls-container">
            <div className="carousel-prev">
              <button
                className="cbutton"
                type="button"
                data-bs-target="#myCarousel"
                data-bs-slide="prev"
              >
                &lt; back
              </button>
            </div>
            <div className="carousel-next">
              <button
                className="cbutton"
                type="button"
                data-bs-target="#myCarousel"
                data-bs-slide="next"
              >
                next &gt;
              </button>
            </div>
          </div>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                const wrap = document.getElementById('wrap');
                const car  = document.getElementById('myCarousel');

                function measure() {
                  return Math.ceil(wrap.getBoundingClientRect().height);
                }

                function send() {
                  parent.postMessage({ type: 'carouselHeight', height: measure() }, '*');
                }

                function sendBurst() {
                  send();
                  requestAnimationFrame(send);
                  setTimeout(send, 120);
                  setTimeout(send, 300);
                }

                window.addEventListener('load', sendBurst);
                window.addEventListener('resize', sendBurst);

                new ResizeObserver(sendBurst).observe(wrap);

                car.addEventListener('slide.bs.carousel', sendBurst);
                car.addEventListener('slid.bs.carousel',  sendBurst);

                document.querySelectorAll('img').forEach(img => {
                  if (!img.complete) img.addEventListener('load', sendBurst, { once: true });
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
