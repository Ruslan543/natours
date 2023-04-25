/* eslint-disable */

export const hideAlert = function () {
  const element = document.querySelector(".alert");

  if (!element) return;

  element.parentElement.removeChild(element);
};

// Type is "success" or "error"
export const showAlert = function (type, message) {
  hideAlert();

  const markup = `<div class="alert alert--${type}">${message}</div>`;
  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);

  window.setTimeout(hideAlert, 5000);
};
