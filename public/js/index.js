/* eslint-disable */
import "@babel/polyfill";
import { displayMap } from "./mapbox";
import { login, authentification, logout } from "./login";
import { updateSettings } from "./updateSettings";
import { bookTour } from "./stripe";
import axios from "axios";

// DOM ELEMENTS
// const loginForm = document.querySelector(".login-form .form");
const mapbox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const authentificationForm = document.querySelector(".form--authentification");
const logOutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const sectionCta = document.querySelector(".section-cta");

// DELEGATION
if (mapbox) {
  const locations = JSON.parse(mapbox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    login(email, password);
  });
}

if (authentificationForm) {
  authentificationForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const code = document.getElementById("code").value;

    await authentification(code);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener("click", logout);
}

if (userDataForm) {
  userDataForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const photo = document.getElementById("photo").files[0];

    const form = new FormData();
    form.append("name", name);
    form.append("email", email);
    form.append("photo", photo);

    const result = await updateSettings(form, "data");

    if (!result || !photo) return;

    const srcUserPhoto = `/img/users/${result.data.data.user.photo}`;

    document.querySelector(".form__user-photo").src = srcUserPhoto;
    document.querySelector(".nav__user-img").src = srcUserPhoto;
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const btnSavePassword = document.querySelector(".btn--save-password");
    btnSavePassword.textContent = "Updating...";

    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password"
    );

    btnSavePassword.textContent = "Save password";

    document.getElementById("password-current").value =
      document.getElementById("password").value =
      document.getElementById("password-confirm").value =
        "";
  });
}

if (sectionCta) {
  sectionCta.addEventListener("click", async function (event) {
    const btn = event.target.closest("#book-now");

    if (!btn) return;
    btn.textContent = "Processing...";

    const clearLocalStorageAndBody = function (event) {
      this.scroll(0, 0);

      // this.removeEventListener("pageshow", clearLocalStorageAndBody);
    };

    window.addEventListener("pagehide", clearLocalStorageAndBody, {
      once: true,
    });

    const { tourId, startDate } = btn.dataset;
    await bookTour(tourId, startDate);
  });
}

// if (location.href === "http://127.0.0.1:3000/") {
//   (async function () {
//     try {
//       const result = await axios({
//         url: "http://127.0.0.1:3000/",
//         headers: {
//           Authorization:
//             "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjOGExZDViMDE5MGIyMTQzNjBkYzA1NyIsImlhdCI6MTY4MjMyODY0NSwiZXhwIjoxNjkwMTA0NjQ1fQ.KJnYaAmSRc3pMM-5JVDWnIXY3QNDT0rVBzlmmOOQVB4",
//         },
//       });
//       console.log(result);

//       const { user } = result.data.data;

//       const cards = result.data.data.tours
//         .map((tour) => {
//           const markup = `
//           <div class="card">
//             <div class="card__header">
//               <div class="card__picture">
//                 <div class="card__picture-overlay">&nbsp;</div>
//                 <img
//                   src="/img/tours/${tour.imageCover}"
//                   alt="${tour.name}"
//                   class="card__picture-img"
//                 />
//               </div>

//               <h3 class="heading-tertirary">
//                 <span>${tour.name}</span>
//               </h3>
//             </div>

//             <div class="card__details">
//               <h4 class="card__sub-heading">Easy 5-day tour</h4>
//               <p class="card__text">
//                 Breathtaking hike through the Canadian Banff National Park
//               </p>
//               <div class="card__data">
//                 <svg class="card__icon">
//                   <use xlink:href="img/icons.svg#icon-map-pin"></use>
//                 </svg>
//                 <span>Banff, Canada</span>
//               </div>
//               <div class="card__data">
//                 <svg class="card__icon">
//                   <use xlink:href="img/icons.svg#icon-calendar"></use>
//                 </svg>
//                 <span>April 2021</span>
//               </div>
//               <div class="card__data">
//                 <svg class="card__icon">
//                   <use xlink:href="img/icons.svg#icon-flag"></use>
//                 </svg>
//                 <span>3 stops</span>
//               </div>
//               <div class="card__data">
//                 <svg class="card__icon">
//                   <use xlink:href="img/icons.svg#icon-user"></use>
//                 </svg>
//                 <span>25 people</span>
//               </div>
//             </div>

//             <div class="card__footer">
//               <p>
//                 <span class="card__footer-value">$297</span>
//                 <span class="card__footer-text">per person</span>
//               </p>
//               <p class="card__ratings">
//                 <span class="card__footer-value">4.9</span>
//                 <span class="card__footer-text">rating (21)</span>
//               </p>
//               <a href="#" class="btn btn--green btn--small">Details</a>
//             </div>
//           </div>
//         `;
//         })
//         .join("");

//       console.log(cards);

//       const check = user
//         ? `
//             <a href="#" class="nav__el">Log out</a>
//             <a href="#" class="nav__el">
//               <img src="img/user.jpg" alt="User photo" class="nav__user-img" />
//               <span>${user.name}</span>
//             </a>
//         `
//         : `<button class="nav__el">Log in</button> <button class="nav__el nav__el--cta">Sign up</button>`;

//       const html = `
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />

//         <link
//           href="https://fonts.googleapis.com/css?family=Lato:300,300i,700"
//           rel="stylesheet"
//         />

//         <link rel="stylesheet" href="css/style.css" />
//         <link rel="shortcut icon" type="image/png" href="img/favicon.png" />

//         <title>Natours | Exciting tours for adventurous people</title>
//       </head>
//       <body>
//         <header class="header">
//           <nav class="nav nav--tours">
//             <a href="#" class="nav__el">All tours</a>
//             <form class="nav__search">
//               <button class="nav__search-btn">
//                 <svg>
//                   <use xlink:href="img/icons.svg#icon-search"></use>
//                 </svg>
//               </button>
//               <input
//                 type="text"
//                 placeholder="Search tours"
//                 class="nav__search-input"
//               />
//             </form>
//           </nav>
//           <div class="header__logo">
//             <img src="img/logo-white.png" alt="Natours logo" />
//           </div>
//           <nav class="nav nav--user">
//             ${check}
//           </nav>
//         </header>

//         <!-- In video, this <main> element is wrongly called: <section class="overview">. So in pug template, please use main.main instead of section.overview -->
//         <main class="main">
//           <div class="card-container">
//             ${cards}
//           </div>
//         </main>

//         <div class="footer">
//           <div class="footer__logo">
//             <img src="img/logo-green.png" alt="Natours logo" />
//           </div>
//           <ul class="footer__nav">
//             <li><a href="#">About us</a></li>
//             <li><a href="#">Download apps</a></li>
//             <li><a href="#">Become a guide</a></li>
//             <li><a href="#">Careers</a></li>
//             <li><a href="#">Contact</a></li>
//           </ul>
//           <p class="footer__copyright">
//             &copy; by Jonas Schmedtmann. All rights reserved.
//           </p>
//         </div>
//       </body>
//     </html>
//       `;

//       document.querySelector("html").innerHTML = html;

//       console.log(result);
//     } catch (error) {
//       console.error(error);
//     }
//   })();
// }

// if (location.href === "http://127.0.0.1:3000") {
//   (async function () {
//     await axios({
//       url: "http://127.0.0.1:3000",
//       headers: {
//         authorization: `Bearer ${localStorage.getItem("accessToken")}`,
//       },
//     });
//   })();
// }
