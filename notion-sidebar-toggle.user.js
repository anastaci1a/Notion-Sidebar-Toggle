// ==UserScript==
// @name         Notion - Sidebar Toggle Button
// @namespace    https://github.com/anastaci1a/Notion-Sidebar-Toggle
// @version      1.0.0
// @description  Adds a button to the Notion dom which toggles the sidebar visibility
// @author       Roznoshchik, forked by anastaci1a
// @match        https://www.notion.so/*
// @grant        none
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @run-at document-idle
// ==/UserScript==

// config
let hideOnStart = true;

(function () {
    'use strict';

    // sidebar-adjacent vars
    let sidebarDisable = false;
    let NshowSidebarButton, NScontainer, Nframe, Nsidebar, Ntopbar;

    // toggle button vars
    let toggleButton, toggleButton_exists = false;
    const toggleButton_innerHTML_enabled  = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#d2d2d2" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>';
    const toggleButton_innerHTML_disabled = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#d2d2d2" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>';

    // toggle button spacer vars
    // let toggleButtonSpacer;
    // const toggleButtonSpacer_innerHTML = '';

    // ~

    // because Notion creates the page from JS, script must wait for elements
    waitForKeyElements(".notion-sidebar", a);
    function a() { waitForKeyElements(".notion-sidebar-container", b); }
    function b() { waitForKeyElements(".notion-frame", c); }
    function c() { waitForKeyElements(".notion-topbar", d); }
    function d() { waitForKeyElements(".notion-topbar > div", e); }
    function e() { waitForKeyElements(".notion-open-sidebar", setVariables); }

    // after loading, query everything and set initial values
    function setVariables() {
        NScontainer = document.querySelector(".notion-sidebar-container");
        Nframe = document.querySelector(".notion-frame");
        Nsidebar = document.querySelector(".notion-sidebar");
        Ntopbar = document.querySelector(".notion-topbar");
        NshowSidebarButton = document.querySelector(".notion-open-sidebar");

        // load main function
        addToggleToDOM();

        // hide on first load
        if (hideOnStart) {
            toggleSidebar();
            hideOnStart = false;
        }
    };

    // change the sidebar position and visibility on button click
    function toggleSidebar() {
        // toggle
        sidebarDisable = !sidebarDisable;

        // hide the damn thing
        if (sidebarDisable) {
            // hide sidebar
            NScontainer.style.visibility = "hidden";
            Nsidebar.style.display = "none";

            // hide the "normal" sidebar toggle (hamburger menu)
            NshowSidebarButton.style.visibility = "hidden";
            NshowSidebarButton.parentElement.parentElement.style.visibility = "hidden";
            NshowSidebarButton.parentElement.parentElement.parentElement.style.width = "25px";

            // set toggle icon
            toggleButton.innerHTML = toggleButton_innerHTML_enabled;
        }

        // re-enable sidebar
        else {
            // show sidebar
            NScontainer.style.visibility = "visible";
            NshowSidebarButton.style.visibility = "visible";
            Nsidebar.style.display = "flex";

            // show the "normal" sidebar toggle (hamburger menu)
            NshowSidebarButton.style.visibility = "visible";
            NshowSidebarButton.parentElement.parentElement.style.visibility = "visible";
            NshowSidebarButton.parentElement.parentElement.parentElement.style.width = "56px";

            // set toggle icon
            toggleButton.innerHTML = toggleButton_innerHTML_disabled;
        }
    };

    // main function that creates the button and inserts it into the dom
    function addToggleToDOM() {
        // add toggle if it doesn't exist (yet!!)
        if (!toggleButton_exists) {
            // toggle html config
            toggleButton = document.createElement("button");
            toggleButton.innerHTML = toggleButton_innerHTML_disabled;

            toggleButton.classList.add('notion-sidebar-toggle');
            toggleButton.style.cssText = "background-color: transparent; border: none; flex-shrink: 0; width: 48px; height: 48px; margin: -12px -3px -12px -12px; padding: 12px;"

            // click behavior
            toggleButton.onclick = () => toggleSidebar();

            // actually add the toggle to dom
            const child = Ntopbar.firstElementChild.firstElementChild;
            (child ? child : Ntopbar).insertBefore(toggleButton, (child ? child : Ntopbar).firstChild);
            toggleButton_exists = true;
        }

        // if sidebar is opened, remove toggle (should only happen when toggle is inactive)
        waitForKeyElements(".notion-close-sidebar", () => {
            // remove
            toggleButton.remove();
            toggleButton_exists = false;

            // if sidebar is closed, re-add toggle
            const closeSidebarButton = document.querySelector(".notion-close-sidebar");
            closeSidebarButton.addEventListener("click", () => {
                a();
            });
        });
    };
})();
