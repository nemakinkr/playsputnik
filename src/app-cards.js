/* PlaySputnik Cards Module — renderCard, renderHero, renderProfileGameRow, cover visual helpers */
"use strict";
(function () {
  if (!window.PlaySputnikCover) throw new Error("app-cover must load before app-cards");

  function createCardsTools({
    getState,
    explain,
    personalEvidence,
    gameDescription,
    watchOutCopy,
    factList,
    renderEvidenceRows,
    coverBackground,
    posterTheme,
    coverSourceLabel,
    quickReaction,
    setQuickReaction,
    openGameDetail,
    setGameState,
    gameUserState,
    recordFeedback,
    undoLastAction,
    render,
    profileGames,
  }) {
    // ── Cover visual helpers ────────────────────────────────────────────────
    function applyCoverVisual(element, game) {
      element.style.setProperty("--poster", coverBackground(game));
      element.dataset.coverStatus = game.coverMeta?.status || "missing";
      element.dataset.posterTheme = posterTheme(game);
    }

    function renderCoverSourceInto(element, game) {
      if (!element) return;
      element.replaceChildren();
      const cover = game.coverMeta;
      const label = coverSourceLabel(game);
      if (cover?.source === "rawg" && cover.sourceUrl) {
        const link = document.createElement("a");
        link.href = cover.sourceUrl;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = label;
        element.append(link);
        return;
      }
      element.textContent = label;
    }

    // ── Profile game row (liked-games sidebar list) ─────────────────────────
    function renderProfileGameRow(game) {
      const state = getState();
      const reaction = quickReaction(game.title) || (state.liked.has(game.title) ? "loved" : "");
      const row = document.createElement("div");
      row.className = "profile-game-row";
      row.innerHTML = `
        <div class="profile-game-copy">
          <strong>${game.title}</strong>
          <span>${game.axis || t("settings.quickSwipe.tasteSignal")}</span>
          <small>${game.atoms.join(" / ")}</small>
        </div>
        <div class="quick-reactions" role="group" aria-label="${t("settings.reactions.aria", { title: game.title })}">
          <button class="${reaction === "loved" ? "is-selected" : ""}" data-quick-reaction="loved" type="button" aria-pressed="${reaction === "loved"}">${t("settings.reactions.like")}</button>
          <button class="${reaction === "not_for_me" ? "is-selected" : ""}" data-quick-reaction="not_for_me" type="button" aria-pressed="${reaction === "not_for_me"}">${t("settings.reactions.no")}</button>
          <button class="${reaction === "unplayed" ? "is-selected" : ""}" data-quick-reaction="unplayed" type="button" aria-pressed="${reaction === "unplayed"}">${t("settings.reactions.notPlayed")}</button>
        </div>
      `;
      row.querySelectorAll("[data-quick-reaction]").forEach((button) => {
        button.addEventListener("click", () => setQuickReaction(game, button.dataset.quickReaction));
      });
      return row;
    }

    // ── Hero card (top-pick section) ────────────────────────────────────────
    function renderHero(game, topPickEl) {
      const { reason, confidence } = explain(game, game.score);
      const watchout = watchOutCopy(game);
      const evidence = personalEvidence(game);
      const facts = factList(game)
        .slice(0, 5)
        .map((fact) => `<span class="fact ${fact.type}">${fact.label}</span>`)
        .join("");

      topPickEl.innerHTML = `
        <article class="hero-card">
          <div class="hero-visual">
            <span>${confidence} confidence / ${Math.max(game.score, 0)} fit</span>
            <strong class="hero-visual-title">${game.title}</strong>
          </div>
          <div class="hero-body">
            <div>
              <p class="eyebrow">Top recommendation</p>
              <h3>${game.title}</h3>
              <p class="meta">${game.vibe}</p>
            </div>
            <p class="description">${gameDescription(game)}</p>
            <p class="reason">${reason}</p>
            <div class="personal-evidence hero-evidence">
              ${renderEvidenceRows(evidence, 3)}
            </div>
            <p class="watchout"><strong>${watchout.label}:</strong> ${watchout.detail}.</p>
            <div class="facts">${facts}</div>
            <p class="cover-source hero-cover-source"></p>
            <div class="hero-actions">
              <button class="secondary-action" data-hero-detail type="button">Details</button>
              <button class="secondary-action" data-hero-state="saved" type="button">Save</button>
              <button class="secondary-action" data-hero-state="playing" type="button">Play now</button>
              <button class="secondary-action" data-hero-state="owned" type="button">Owned</button>
              <button class="secondary-action" data-hero-state="completed" type="button">Done</button>
            </div>
          </div>
        </article>
      `;
      applyCoverVisual(topPickEl.querySelector(".hero-visual"), game);
      renderCoverSourceInto(topPickEl.querySelector(".hero-cover-source"), game);
      topPickEl.querySelector("[data-hero-detail]").addEventListener("click", () => openGameDetail(game.title));
      topPickEl.querySelectorAll("[data-hero-state]").forEach((button) => {
        button.addEventListener("click", () => {
          setGameState(game.title, button.dataset.heroState);
          render();
        });
      });
    }

    // ── Cluster game card (card-template) ───────────────────────────────────
    function renderCard(game) {
      const template = document.querySelector("#card-template");
      const card = template.content.firstElementChild.cloneNode(true);
      const { reason, confidence } = explain(game, game.score);
      const evidence = personalEvidence(game);
      applyCoverVisual(card.querySelector(".poster"), game);
      card.querySelector(".poster-kind").textContent = (game.atoms || []).slice(0, 2).join(" / ");
      card.querySelector(".poster-title").textContent = game.title;
      card.querySelector("h3").textContent = game.title;
      card.querySelector(".meta").textContent = game.vibe;
      card.querySelector(".score").textContent = `${Math.max(game.score, 0)}`;
      card.querySelector(".score").title = `${confidence} confidence`;
      card.querySelector(".description").textContent = gameDescription(game);
      card.querySelector(".reason").textContent = reason;
      card.querySelector(".card-evidence").innerHTML = renderEvidenceRows(evidence, 2);
      const watchout = watchOutCopy(game);
      card.querySelector(".watchout").innerHTML = `<strong>${watchout.label}:</strong> ${watchout.detail}.`;

      const atoms = card.querySelector(".atom-row");
      game.atoms.slice(0, 4).forEach((atom) => {
        const item = document.createElement("span");
        item.className = "atom-pill";
        item.textContent = atom;
        atoms.appendChild(item);
      });

      const facts = card.querySelector(".facts");
      factList(game).forEach((fact) => {
        const item = document.createElement("span");
        item.className = `fact ${fact.type}`;
        item.textContent = fact.label;
        facts.appendChild(item);
      });
      renderCoverSourceInto(card.querySelector(".card-cover-source"), game);

      card.querySelector('[data-action="detail"]').addEventListener("click", () => openGameDetail(game.title));
      card.querySelector('[data-action="save"]').addEventListener("click", () => {
        getState().saved.add(game.title);
        setGameState(game.title, "saved");
        render();
      });
      card.querySelector('[data-action="good"]').addEventListener("click", () => {
        const state = getState();
        state.saved.add(game.title);
        setGameState(game.title, "playing");
        const similar = profileGames.find((item) => item.atoms.some((atom) => game.atoms.includes(atom))) || profileGames[0];
        if (state.liked.size < 5) state.liked.add(similar.title);
        recordFeedback("good_fit", game.title);
        render();
      });
      card.querySelector('[data-action="hide"]').addEventListener("click", () => {
        getState().hidden.add(game.title);
        setGameState(game.title, "hidden");
        render();
      });
      const stateSelect = card.querySelector(".state-select");
      stateSelect.value = gameUserState(game.title) || "";
      stateSelect.addEventListener("change", () => {
        setGameState(game.title, stateSelect.value);
        render();
      });

      return card;
    }

    // ── Undo / focus helpers ────────────────────────────────────────────────
    function bindUndoButtons(root) {
      root.querySelectorAll("[data-undo-last]").forEach((button) => {
        button.addEventListener("click", undoLastAction);
      });
    }

    function focusKnownGames() {
      const panel = document.querySelector("#liked-title");
      if (!panel) return;
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function focusAnswerAgenda() {
      const panel = document.querySelector(".answer-panel");
      if (!panel) return;
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
      panel.classList.add("is-highlighted");
      window.setTimeout(() => panel.classList.remove("is-highlighted"), 1400);
    }

    function focusTasteImport() {
      const panel = document.querySelector("#rating-import");
      if (!panel) return;
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
      panel.focus();
    }

    return {
      applyCoverVisual,
      renderCoverSourceInto,
      renderProfileGameRow,
      renderHero,
      renderCard,
      bindUndoButtons,
      focusKnownGames,
      focusAnswerAgenda,
      focusTasteImport,
    };
  }

  window.PlaySputnikCards = { createCardsTools };
})();
