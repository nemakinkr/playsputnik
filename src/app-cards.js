/* PlaySputnik Cards Module — renderCard, renderHero, renderProfileGameRow, cover visual helpers */
"use strict";
(function () {
  if (!window.PlaySputnikCover) throw new Error("app-cover must load before app-cards");

  function createCardsTools({
    getState,
    getAntiHypeGuard,
    explain,
    personalEvidence,
    personalRatingBadge,
    gameDescription,
    gameTagline,
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

    function quickTasteSignalCountFromState() {
      const reactions = getState().quickReactions || {};
      return Object.values(reactions).filter((item) => item?.reaction && item.reaction !== "unplayed").length;
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
          <span>${labelAtoms((game.atoms || []).slice(0, 2), " + ") || t("settings.quickSwipe.tasteSignal")}</span>
          <small>${labelAtoms(game.atoms)}</small>
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
      const guard = getAntiHypeGuard ? getAntiHypeGuard(game) : null;
      const watchout = watchOutCopy(game);
      const evidence = personalEvidence(game);
      const ratingBadge = personalRatingBadge(game);
      const signalCount = quickTasteSignalCountFromState();
      const isEarlyPick = signalCount >= 5 && signalCount < 8;
      const currentState = gameUserState(game.title);
      const playableStates = new Set(["owned", "owned_forever", "subscription", "playing", "paused", "want_to_finish"]);
      const primaryMove = isEarlyPick
        ? {
          kind: "detail",
          label: t("today.hero.primaryInspect"),
          hint: t("today.hero.primaryInspectHint"),
        }
        : playableStates.has(currentState)
          ? {
            kind: "state",
            state: "playing",
            label: currentState === "playing" ? t("today.hero.primaryContinue") : t("today.hero.primaryPlay"),
            hint: t("today.hero.primaryPlayHint"),
          }
          : {
            kind: "state",
            state: "saved",
            label: t("today.hero.primarySave"),
            hint: t("today.hero.primarySaveHint"),
          };
      const secondaryActions = [
        primaryMove.kind === "detail" ? null : { kind: "detail", label: t("today.hero.details") },
        primaryMove.state === "saved" ? null : { kind: "state", state: "saved", label: t("today.hero.save") },
        primaryMove.state === "playing" ? null : { kind: "state", state: "playing", label: t("today.hero.play") },
        primaryMove.state === "owned" ? null : { kind: "state", state: "owned", label: t("today.hero.owned") },
        primaryMove.state === "completed" ? null : { kind: "state", state: "completed", label: t("today.hero.done") },
      ].filter(Boolean);
      const facts = factList(game)
        .slice(0, isEarlyPick ? 3 : 5)
        .map((fact) => `<span class="fact ${fact.type}">${fact.label}</span>`)
        .join("");
      const decisionStrip = [
        {
          label: t("today.hero.whyLabel"),
          value: isEarlyPick
            ? t("today.hero.earlyBadge")
            : t("today.hero.matureBadge"),
          detail: isEarlyPick
            ? t("today.hero.earlyWhy", { count: signalCount })
            : t("today.hero.matureWhy"),
        },
        {
          label: t("today.hero.riskLabel"),
          value: watchout.label,
          detail: watchout.detail,
        },
        {
          label: t("today.hero.nextLabel"),
          value: isEarlyPick
            ? t("narrative.firstRun.confidenceEnough")
            : confidence,
          detail: isEarlyPick
            ? t("today.hero.nextEarly")
            : t("today.hero.nextMature"),
        },
      ];
      const outcomeItems = [
        {
          label: t("today.hero.outcomePick"),
          value: primaryMove.label,
          detail: t(playableStates.has(currentState) ? "today.hero.outcomePlayDetail" : "today.hero.outcomeSaveDetail"),
        },
        {
          label: t("today.hero.outcomeProof"),
          value: confidence,
          detail: isEarlyPick ? t("today.hero.outcomeEarlyDetail") : t("today.hero.outcomeMatureDetail"),
        },
        {
          label: t("today.hero.outcomeGuard"),
          value: watchout.label,
          detail: t("today.hero.outcomeGuardDetail"),
        },
      ];

      topPickEl.innerHTML = `
        <article class="hero-card ${isEarlyPick ? "is-early-pick" : ""}">
          <div class="hero-visual">
            <span>${t("today.hero.meta", { confidence, fit: Math.max(game.score, 0) })}</span>
            <strong class="hero-visual-title">${game.title}</strong>
          </div>
          <div class="hero-body">
            ${isEarlyPick ? `
              <div class="hero-payoff-banner" data-hero-payoff>
                <span>${t("today.hero.payoffEyebrow")}</span>
                <strong>${t("today.hero.payoffTitle")}</strong>
                <small>${t("today.hero.payoffDetail", { count: signalCount })}</small>
              </div>
            ` : ""}
            <div>
              <p class="eyebrow">${t("today.hero.top")}</p>
              <h3>${game.title}</h3>
              <p class="meta">${gameTagline(game)}</p>
              ${ratingBadge ? `<span class="personal-rating-badge ${ratingBadge.known ? "is-known" : ""}" title="${ratingBadge.detail}">${ratingBadge.label}</span>` : ""}
            </div>
            <p class="description hero-description">${gameDescription(game)}</p>
            <div class="hero-quick-proof" data-hero-quick-proof>
              <div>
                <span>${t("today.hero.whyLabel")}</span>
                <strong>${decisionStrip[0].value}</strong>
                <small>${reason}</small>
              </div>
              <div>
                <span>${t("today.hero.riskLabel")}</span>
                <strong>${watchout.label}</strong>
                <small>${watchout.detail}</small>
              </div>
            </div>
            <div class="hero-primary-cta">
              <button class="primary-action" data-hero-primary data-hero-primary-kind="${primaryMove.kind}" ${primaryMove.state ? `data-hero-primary-state="${primaryMove.state}"` : ""} type="button">${primaryMove.label}</button>
              <small>${primaryMove.hint}</small>
            </div>
            <div class="hero-actions">
              ${secondaryActions.map((action) => action.kind === "detail"
                ? `<button class="secondary-action" data-hero-detail type="button">${action.label}</button>`
                : `<button class="secondary-action" data-hero-state="${action.state}" type="button">${action.label}</button>`
              ).join("")}
            </div>
            <details class="hero-proof-details">
              <summary>${t("narrative.detail.whyPick")}</summary>
              <div class="hero-proof-details-body">
                <div class="hero-outcome-bar" data-hero-outcome>
                  ${outcomeItems.map((item) => `
                <div>
                  <span>${item.label}</span>
                  <strong>${item.value}</strong>
                  <small>${item.detail}</small>
                </div>
                  `).join("")}
                </div>
                <div class="hero-emotional-proof" data-hero-emotional-proof>
                  <span>${t("today.hero.emotionalEyebrow")}</span>
                  <strong>${isEarlyPick ? t("today.hero.emotionalTitleEarly") : t("today.hero.emotionalTitleMature")}</strong>
                  <small>${isEarlyPick
                    ? t("today.hero.emotionalDetailEarly", { count: signalCount })
                    : t("today.hero.emotionalDetailMature")}</small>
                </div>
                <div class="hero-decision-strip" aria-label="${t("today.hero.top")}">
                  ${decisionStrip.map((item) => `
                    <div>
                      <span>${item.label}</span>
                      <strong>${item.value}</strong>
                      <small>${item.detail}</small>
                    </div>
                  `).join("")}
                </div>
                ${isEarlyPick ? `<p class="hero-payoff-note">${t("today.hero.payoffNote")}</p>` : `
                  <div class="personal-evidence hero-evidence">
                    ${renderEvidenceRows(evidence, 3)}
                  </div>
                  <p class="watchout"><strong>${watchout.label}:</strong> ${watchout.detail}.</p>
                  ${guard ? `<span class="deal-guard guard-${guard.kind}" title="${String(guard.detail).replace(/"/g, "&quot;")}">${guard.label}</span>` : ""}
                `}
                <div class="facts">${facts}</div>
                <p class="cover-source hero-cover-source"></p>
              </div>
            </details>
          </div>
        </article>
      `;
      applyCoverVisual(topPickEl.querySelector(".hero-visual"), game);
      renderCoverSourceInto(topPickEl.querySelector(".hero-cover-source"), game);
      topPickEl.querySelector("[data-hero-primary]")?.addEventListener("click", (event) => {
        const button = event.currentTarget;
        if (button.dataset.heroPrimaryKind === "detail") {
          openGameDetail(game.title);
          return;
        }
        setGameState(game.title, button.dataset.heroPrimaryState);
        render();
      });
      topPickEl.querySelector("[data-hero-detail]")?.addEventListener("click", () => openGameDetail(game.title));
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
      const ratingBadge = personalRatingBadge(game);
      const factsList = factList(game);
      applyCoverVisual(card.querySelector(".poster"), game);
      card.querySelector(".poster-kind").textContent = labelAtoms((game.atoms || []).slice(0, 2));
      card.querySelector(".poster-title").textContent = game.title;
      card.querySelector("h3").textContent = game.title;
      card.querySelector(".meta").textContent = gameTagline(game);
      card.querySelector(".score").textContent = `${Math.max(game.score, 0)}`;
      card.querySelector(".score").title = `${confidence} confidence`;
      if (ratingBadge) {
        const badge = document.createElement("span");
        badge.className = `personal-rating-badge ${ratingBadge.known ? "is-known" : ""}`;
        badge.textContent = ratingBadge.label;
        badge.title = ratingBadge.detail;
        card.querySelector(".card-head > div").append(badge);
      }
      card.querySelector(".description").textContent = gameDescription(game);
      card.querySelector(".reason").textContent = reason;
      card.querySelector(".card-evidence").innerHTML = renderEvidenceRows(evidence, 2);
      const watchout = watchOutCopy(game);
      card.querySelector(".watchout").innerHTML = `<strong>${watchout.label}:</strong> ${watchout.detail}.`;

      const atoms = card.querySelector(".atom-row");
      game.atoms.slice(0, 4).forEach((atom) => {
        const item = document.createElement("span");
        item.className = "atom-pill";
        item.textContent = labelAtom(atom);
        atoms.appendChild(item);
      });

      const facts = card.querySelector(".facts");
      factsList.forEach((fact) => {
        const item = document.createElement("span");
        item.className = `fact ${fact.type}`;
        item.textContent = fact.label;
        facts.appendChild(item);
      });
      const trustStrip = card.querySelector(".card-trust-strip");
      const priceFact = factsList.find((fact) => fact.type === "price" || fact.type === "warn");
      const accessFact = factsList.find((fact) => fact.type === "plus" || fact.type === "access");
      [
        { label: t("discover.trustCover"), value: coverSourceLabel(game) },
        { label: t("discover.trustPrice"), value: priceFact?.label || t("narrative.detail.priceMissing") },
        { label: t("discover.trustAccess"), value: accessFact?.label || t("narrative.detail.plusUnknown") },
      ].forEach((item) => {
        const node = document.createElement("span");
        node.innerHTML = `<b>${item.label}</b>${item.value}`;
        trustStrip.append(node);
      });
      renderCoverSourceInto(card.querySelector(".card-cover-source"), game);
      card.querySelector('[data-action="detail"]').textContent = t("discover.actionDetails");
      card.querySelector('[data-action="save"]').textContent = t("discover.actionWishlist");
      card.querySelector('[data-action="good"]').textContent = t("discover.actionLike");
      card.querySelector('[data-action="hide"]').textContent = t("discover.actionNotForMe");
      const stateLabels = {
        "": "discover.setState",
        saved: "discover.stateSaved",
        want_to_finish: "discover.stateFinish",
        paused: "discover.statePaused",
        owned: "discover.stateOwned",
        owned_forever: "discover.stateForever",
        subscription: "discover.stateSubscription",
        playing: "discover.statePlaying",
        completed: "discover.stateCompleted",
        dropped: "discover.stateDropped",
        hidden: "discover.stateHidden",
      };
      card.querySelectorAll(".state-select option").forEach((option) => {
        option.textContent = t(stateLabels[option.value] || "discover.setState");
      });

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
