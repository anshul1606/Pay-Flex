"use strict";

(function () {

    if (window.__analyticsLoaderInitialized__) return;
    window.__analyticsLoaderInitialized__ = true;

    window.__LAMBDA_SPLITZ_DATA__ = window.__LAMBDA_SPLITZ_DATA__ || {};
    window.__COUNTRY_CODE__ = window.__COUNTRY_CODE__ || "IN";
    window.__analyticsQueue__ = window.__analyticsQueue__ || [];

    /* ------------------------------
       ANALYTICS UTILS
    ------------------------------ */

    window.analyticsUtils = (function () {
        let experimentsCache = null;
        let localeCache = null;
        let formattedPathnameCache = null;
        let lastPathname = null;

        return {

            getLocale() {
                if (localeCache) return localeCache;
                localeCache = window.location.pathname.includes("/sg/") ? "SG" : "IN";
                return localeCache;
            },

            getExperiments() {
                if (experimentsCache) return experimentsCache;

                const splitzData = window.__LAMBDA_SPLITZ_DATA__ || {};
                const experiments = {};

                Object.keys(splitzData).forEach((key) => {
                    experiments[key] = splitzData[key]?.name || "";
                });

                experimentsCache = experiments;
                return experiments;
            },

            formatPathname(pathname) {
                if (formattedPathnameCache && lastPathname === pathname) {
                    return formattedPathnameCache;
                }

                lastPathname = pathname;

                formattedPathnameCache = pathname
                    .replace(/^\/|\/$/g, "")
                    .split("-")
                    .filter(Boolean)
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                return formattedPathnameCache;
            },

            resetCache() {
                formattedPathnameCache = null;
                lastPathname = null;
            }

        };
    })();

    /* ------------------------------
       ASYNC SCRIPT LOADER
    ------------------------------ */

    window.loadScriptAsync = function (config) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");

            script.src = config.src;
            script.async = true;

            if (config.id) script.id = config.id;
            if (config.defer) script.defer = true;
            if (config.crossorigin) script.crossOrigin = config.crossorigin;

            if (config.attributes) {
                Object.keys(config.attributes).forEach((attr) => {
                    script.setAttribute(attr, config.attributes[attr]);
                });
            }

            script.onload = () => resolve(script);
            script.onerror = () => reject(new Error("Failed to load script: " + config.src));

            (config.appendTo || document.head).appendChild(script);
        });
    };

    /* ------------------------------
       PAGE IDLE CALLBACK
    ------------------------------ */

    window.whenIdle = function (callback, options = {}) {
        const timeout = options.timeout || 2000;

        if ("requestIdleCallback" in window) {
            requestIdleCallback(callback, { timeout });
        } else {
            setTimeout(callback, timeout);
        }
    };

    /* ------------------------------
       PAGE LOAD / IDLE HANDLERS
    ------------------------------ */

    const pageState = {
        isLoaded: document.readyState === "complete",
        hasInteracted: false,
        loadCallbacks: [],
        idleCallbacks: []
    };

    window.afterPageLoad = function (callback) {
        if (pageState.isLoaded) {
            callback();
        } else {
            pageState.loadCallbacks.push(callback);
        }
    };

    window.afterPageIdle = function (callback, timeout) {
        window.afterPageLoad(() => {
            window.whenIdle(callback, { timeout });
        });
    };

    window.addEventListener("load", () => {
        pageState.isLoaded = true;

        pageState.loadCallbacks.forEach((cb) => {
            try { cb(); }
            catch (err) { console.error("Error in load callback:", err); }
        });

        pageState.loadCallbacks = [];
    });

    /* ------------------------------
       PAGE INTERACTION DETECTOR
    ------------------------------ */

    const interactionEvents = ["click", "touchstart", "keydown", "scroll", "mousemove"];

    const markInteracted = () => {
        if (!pageState.hasInteracted) {
            pageState.hasInteracted = true;

            interactionEvents.forEach((event) => {
                document.removeEventListener(event, markInteracted, { passive: true, capture: true });
            });
        }
    };

    interactionEvents.forEach((event) => {
        document.addEventListener(event, markInteracted, {
            passive: true,
            capture: true,
            once: true
        });
    });

})();
