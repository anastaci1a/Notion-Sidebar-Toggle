// ==UserScript==
// @name         Notion - Sidebar Toggle Button
// @namespace    https://github.com/anastaci1a/Notion-Sidebar-Toggle
// @version      1.1.0
// @description  Adds a button to the Notion dom which toggles the sidebar visibility
// @author       Roznoshchik, forked by anastaci1a
// @match        https://app.notion.com/*
// @grant        none
// @require      https://gist.githubusercontent.com/Anemone95/d133848ae16055ea0efc5d0f45d33e1e/raw/a0f48d1c1664afc17bc81a5dd83337a16c9dea31/waitForKeyElements.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // config

    const FORCE_HIDE_ON_START = false;
    const DEBUG_LOG_ENABLE    = false;

    // debug

    const DEBUG_LOG_FORMAT = '•—––· 🪰 SIDEBAR TOGGLE DEBUG 🪲 ·––—•\n\n%s\n\n•—————————————————————————————————————•';

    function debugLog(...obj) {
        const LINE_START = "> "

        if (!DEBUG_LOG_ENABLE) return;
        const msg_body = obj.join('\n').replace(/(?<=^|\n)/g, LINE_START);
        console.log(
            DEBUG_LOG_FORMAT, msg_body
        );
    }

    // notion elems

    const JQ_ELEM_TOPBAR        = '.notion-topbar';
    const JQ_ELEMS_TOPBAR_INNER = `${JQ_ELEM_TOPBAR} > div > div`;

    const JQ_ELEM_BT_SIDEBAR_CLOSE  = '.notion-sidebar-switcher .notion-close-sidebar';
    const JQ_ELEM_BT_SIDEBAR_OPEN   = '.notion-open-sidebar';
    const JQ_ELEM_BT_SIDEBAR_OPEN_2 = '.notion-sidebar [aria-label="Lock sidebar open"]';

    const JQ_ELEMS_LAYOUT_AWAIT = [
        '.notion-sidebar-container',
        '.notion-sidebar',
        '.notion-frame',
        JQ_ELEM_TOPBAR,
        JQ_ELEMS_TOPBAR_INNER
    ];

    // toggle button

    const CLASS_BT_TOGGLE = 'sidebar-visible-toggle';

    const SVG_BT_TOGGLE_ENABLED  = /* crossed out eye */ `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#d2d2d2" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>`;
    const SVG_BT_TOGGLE_DISABLED = /* normal eye      */ `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#d2d2d2" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`;

    const CSS_BT_TOGGLE_ENABLED  = `background-color: transparent; border: none; flex-shrink: 0; width: 48px; height: 48px; margin: -12px -3px -12px -12px; padding: 12px;`;
    const CSS_BT_TOGGLE_DISABLED = CSS_BT_TOGGLE_ENABLED;

    const BT_TOGGLE = {
        elem: (() => {
            const bt = document.createElement("button");
            bt.classList.add(CLASS_BT_TOGGLE);
            bt.onclick = () => BT_TOGGLE.toggle();

            return bt;
        })(),

        enabled: undefined,

        toggle() {
            if (this.enabled) {
                this.setDisabled();
            } else {
                this.setEnabled();
            }
        },

        set(enabled) {
          enabled ? this.setEnabled() : this.setDisabled()
        },

        setEnabled() {
            this.enabled = true;
            this.setVis(
                SVG_BT_TOGGLE_ENABLED,
                CSS_BT_TOGGLE_ENABLED
            );
            sidebarHide();
        },

        setDisabled() {
            this.enabled = false;
            this.setVis(
                SVG_BT_TOGGLE_DISABLED,
                CSS_BT_TOGGLE_DISABLED
            );
            sidebarShow();
        },

        setVis(html, css) {
            this.elem.innerHTML     = html;
            this.elem.style.cssText = css;
        }
    };

    // detect and handle sidebar state (whether it is open or not)

    debugLog('Waiting for page to generate...');
    waitForElems(JQ_ELEMS_LAYOUT_AWAIT, () => {
        debugLog('Necessary elements detected.', 'Handling sidebar state...');
        detectSidebarState(
            () => {
                handleSidebarOpened();
                manageSidebarOpened();
            }, () => {
                handleSidebarClosed();
                manageSidebarClosed();
            }
        );
    });

    function detectSidebarOpened(handle) {
        waitForElem(JQ_ELEM_BT_SIDEBAR_CLOSE, handle);
    }

    function detectSidebarClosed(handle) {
        waitForElem(JQ_ELEM_BT_SIDEBAR_OPEN, handle);
    }

    function detectSidebarState(handleOpened, handleClosed) {
        const detectState = new Promise((resolve, reject) => {
            detectSidebarOpened(resolve);
            detectSidebarClosed(reject);
        });

        detectState.then(handleOpened, handleClosed);
    }

    function handleSidebarOpened() {
        debugLog('[handleSidebarOpened]', 'Removing sidebar toggle button...');

        BT_TOGGLE.elem.remove(); // remove toggle
    }

    function handleSidebarClosed() {
        debugLog('[handleSidebarClosed]', 'Adding sidebar toggle button...');

        sidebarInjectToggle(); // add toggle
    }

    async function manageSidebarClosed() {
        // debugLog('[manageSidebarClosed]', 'Waiting for open sidebar buttons...');

        if (!BT_TOGGLE.enabled) { // if sidebar is visible, await closing
            waitForElemsLive([JQ_ELEM_BT_SIDEBAR_OPEN, JQ_ELEM_BT_SIDEBAR_OPEN_2], () => {
                debugLog('[manageSidebarClosed]', 'Waiting for sidebar to open...');

                const btsSidebarOpen = [
                    document.querySelector(JQ_ELEM_BT_SIDEBAR_OPEN),
                    document.querySelector(JQ_ELEM_BT_SIDEBAR_OPEN_2)
                ];

                for (const bt of btsSidebarOpen) {
                    bt.addEventListener("click", () => {
                        debugLog('[manageSidebarClosed]', 'Sidebar was opened!');

                        handleSidebarOpened();
                        manageSidebarOpened();
                    });
                }
            });
        }
    }

    async function manageSidebarOpened() {
        // debugLog('[manageSidebarOpened]', 'Waiting for close sidebar button...');

        waitForElemLive(JQ_ELEM_BT_SIDEBAR_CLOSE, () => {
            debugLog('[manageSidebarOpened]', 'Waiting for sidebar to close...');

            const btSidebarClose = document.querySelector(JQ_ELEM_BT_SIDEBAR_CLOSE);
            btSidebarClose.addEventListener("click", () => {
                debugLog('[manageSidebarOpened]', 'Sidebar was closed!');

                handleSidebarClosed();
                manageSidebarClosed();
            });
        });
    }

    // sidebar force hide/show (custom toggle)

    function sidebarInjectToggle() { // assumes sidebar is closed
        const topbar = document.querySelector(JQ_ELEMS_TOPBAR_INNER);

        if (typeof BT_TOGGLE.enabled == 'undefined') {
            BT_TOGGLE.set(FORCE_HIDE_ON_START);
        }

        topbar.insertBefore(
            BT_TOGGLE.elem,
            topbar.firstChild
        );
    }

    function sidebarHide() {
        waitForElemsLive(JQ_ELEMS_LAYOUT_AWAIT, () => {
            debugLog('[sidebarHide]', 'HIDING SIDEBAR!!!');

            const btSidebarOpen = document.querySelector(".notion-open-sidebar");
            const sidebarContainer = document.querySelector(".notion-sidebar-container");
            const sidebar = document.querySelector(".notion-sidebar");
            const frame = document.querySelector(".notion-frame");
            const topbar = document.querySelector(".notion-topbar");

            // hide sidebar
            sidebarContainer.style.visibility = "hidden";
            sidebar.style.display = "none";

            // hide the "normal" sidebar toggle (hamburger menu)
            btSidebarOpen.style.visibility = "hidden";
            btSidebarOpen.parentElement.parentElement.style.visibility = "hidden";
            btSidebarOpen.parentElement.parentElement.parentElement.style.width = "25px";
        });
    }

    function sidebarShow() {
        waitForElemsLive(JQ_ELEMS_LAYOUT_AWAIT, () => {
            debugLog('[sidebarShow]', 'SHOWING SIDEBAR!');

            const btSidebarOpen = document.querySelector(".notion-open-sidebar");
            const sidebarContainer = document.querySelector(".notion-sidebar-container");
            const sidebar = document.querySelector(".notion-sidebar");
            const frame = document.querySelector(".notion-frame");
            const topbar = document.querySelector(".notion-topbar");

            // show sidebar
            sidebarContainer.style.visibility = "visible";
            sidebar.style.display = "flex";

            // show the "normal" sidebar toggle (hamburger menu)
            btSidebarOpen.style.visibility = "visible";
            btSidebarOpen.parentElement.parentElement.style.visibility = "visible";
            btSidebarOpen.parentElement.parentElement.parentElement.style.width = "56px";

            // reassign button event listener(s)
            manageSidebarClosed();
        });
    }

    // util

    function waitForElem(elemSelector, callback) {
        waitForKeyElements(elemSelector, (context) => {
            callback.apply(context);
        });
    }

    function waitForElems(elemSelectors, callback) {
        if (typeof elemSelectors == 'undefined' || elemSelectors.length == 0) {
            callback.apply(this);
            return;
        }

        waitForElem(elemSelectors[0], () => {
            elemSelectors.shift();
            waitForElems(elemSelectors, callback);
        })
    }

    function waitForElemLive(elemSelector, callback) {
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        const wait = new Promise(async (resolve) => {
            while (true) {
                const found = document.querySelector(elemSelector);
                if (typeof found != 'undefined' && found !== null) {
                    // debugLog(`Found: (${elemSelector}):`, found);
                    resolve(found);
                    break;
                }
                await delay(200);
            }
        });

        wait.then(() => {
            callback.apply(this);
        });
    }

    function waitForElemsLive(elemSelectors, callback) {
        if (typeof elemSelectors == 'undefined' || elemSelectors.length == 0) {
            callback.apply(this);
            return;
        }

        waitForElemLive(elemSelectors[0], () => {
            elemSelectors.shift();
            waitForElemsLive(elemSelectors, callback);
        })
    }
})();