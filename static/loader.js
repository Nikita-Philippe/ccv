/* The loader is in a js script, to be loaded independently of the rest of the page,
to make the loader appear as soon as possible, and disappear as soon as the page is loaded. */

const loader = document.createElement("div");
loader.id = "page-loader";
loader.className = "page-loader";

document.body.appendChild(loader);

// Lock scroll while loading
document.body.style.overflow = "hidden";

const removeLoader = () => {
  if (document.readyState === "complete") {
    requestAnimationFrame(() => {
      loader.remove();
      document.body.style.overflow = "initial";
    });
  }
};

globalThis.addEventListener("DOMContentLoaded", removeLoader);

// Fallback in case the load event is not triggered
globalThis.addEventListener("load", () => {
  removeLoader();
  clearInterval(intervalId);
});
const intervalId = setInterval(removeLoader, 1000);
