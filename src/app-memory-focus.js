/* PlaySputnik Memory Focus Module — handoff from search/import into Library and Wishlist */
"use strict";
(function () {
  function createMemoryFocusTools({
    getState,
    titleKey,
    titleMatches,
    canonicalSearchResultTitle,
    detailAttr,
    t,
    openAppView,
    focusAfterRender,
    render,
  }) {
    function memoryFocusSelector(title) {
      return `[data-memory-focus-key="${detailAttr(titleKey(title))}"]`;
    }

    function isFocusedMemoryTitle(title, surface) {
      const state = getState();
      return Boolean(
        state.focusedMemoryTitle
        && state.focusedMemorySurface === surface
        && titleMatches(state.focusedMemoryTitle, title),
      );
    }

    function openFocusedMemoryTitle(title, surface) {
      const state = getState();
      if (!title) {
        openAppView(surface);
        return;
      }
      state.focusedMemoryTitle = title;
      state.focusedMemorySurface = surface;
      if (surface === "wishlist") state.wishlistFilter = "all";
      if (surface === "library") state.libraryFilter = "all";
      openAppView(surface);
      focusAfterRender(memoryFocusSelector(title));
    }

    function openFocusedSearchMemory(result, surface) {
      openFocusedMemoryTitle(canonicalSearchResultTitle(result), surface);
    }

    function focusedMemoryBadgeHtml(isFocused) {
      return isFocused ? `<span class="focused-memory-pill">${t("memoryFocus.fromSearch")}</span>` : "";
    }

    function createFocusedMemoryBanner(surface) {
      const state = getState();
      if (!state.focusedMemoryTitle || state.focusedMemorySurface !== surface) return null;
      const isWishlist = surface === "wishlist";
      const banner = document.createElement("div");
      banner.className = `focused-memory-banner tone-${surface}`;
      banner.innerHTML = `
        <div>
          <span>${t("memoryFocus.eyebrow")}</span>
          <strong>${t(isWishlist ? "memoryFocus.wishlistTitle" : "memoryFocus.libraryTitle", { title: state.focusedMemoryTitle })}</strong>
          <small>${t(isWishlist ? "memoryFocus.wishlistDetail" : "memoryFocus.libraryDetail")}</small>
        </div>
        <button class="secondary-action" data-clear-focused-memory type="button">${t("memoryFocus.clear")}</button>
      `;
      banner.querySelector("[data-clear-focused-memory]")?.addEventListener("click", () => {
        state.focusedMemoryTitle = "";
        state.focusedMemorySurface = "";
        render();
      });
      return banner;
    }

    return {
      memoryFocusSelector,
      isFocusedMemoryTitle,
      openFocusedMemoryTitle,
      openFocusedSearchMemory,
      focusedMemoryBadgeHtml,
      createFocusedMemoryBanner,
    };
  }

  window.PlaySputnikMemoryFocus = { createMemoryFocusTools };
})();
