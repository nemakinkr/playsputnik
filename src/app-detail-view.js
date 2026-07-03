/* PlaySputnik Detail View — pure game-detail markup composition */
"use strict";
(function () {
  function createDetailViewTools({ detailAttr }) {
    function detailHeroHtml(game, badgesHtml) {
      return `<strong>${game.title}</strong>${badgesHtml}`;
    }

    function detailBodyHtml(model) {
      const {
        game,
        statusCards,
        editionNote,
        cockpit,
        description,
        rationale,
        watchout,
        tasteFit,
        amnesty,
        valueCard,
        market,
        priceWatch,
        trustRows,
        providerImport,
        facts,
        passport,
        cachedAiExplanation,
        similar,
        actions,
        queued,
        currentSputniks,
        sputnikSvg,
        chunk,
        links,
      } = model;
      return `
        <section class="game-detail-status" aria-label="${t("narrative.detail.stateSummaryAria")}">
          ${statusCards.map((item) => `
            <div class="detail-status-card tone-${item.tone}">
              <span>${item.label}</span>
              <strong>${item.value}</strong>
              ${item.detail ? `<small>${item.detail}</small>` : ""}
            </div>
          `).join("")}
        </section>
        ${editionNote}
        ${cockpit}
        <section class="game-detail-section detail-decision-copy">
          <h3>${t("narrative.detail.whyPick")}</h3>
          <p>${description}</p>
          <p><strong>${t("narrative.detail.sameLogic")}:</strong> ${rationale.detail}</p>
          <p><strong>${watchout.label}:</strong> ${watchout.detail}.</p>
        </section>
        ${tasteFit}
        ${amnesty ? `<section class="game-detail-section game-detail-amnesty-restore">
          <h3>${t("narrative.detail.amnesty")}</h3>
          <p>${t("narrative.detail.amnestyDetail", { count: amnesty.skips })}</p>
          <div class="amnesty-actions amnesty-actions--inline">
            <button data-amnesty-restore type="button">${t("narrative.detail.restoreWishlist")}</button>
          </div>
        </section>` : ""}
        ${valueCard ? `
        <section class="game-detail-section game-detail-value">
          <h3>${t("narrative.detail.valueTitle")}</h3>
          <div class="value-cards">
            ${valueCard.criticScore != null ? `
              <div class="value-chip band-${valueCard.criticScoreBand}">
                <span>${t("narrative.detail.critic")}</span>
                <strong>${valueCard.criticScoreLabel}</strong>
              </div>` : ""}
            ${valueCard.hltbHours != null ? `
              <div class="value-chip">
                <span>${t("narrative.detail.length")}</span>
                <strong>${valueCard.hltbHoursLabel}</strong>
              </div>` : ""}
            ${valueCard.valueScore != null ? `
              <div class="value-chip band-${valueCard.valueScoreBand}">
                <span>${t("narrative.detail.valueScore")}</span>
                <strong>${valueCard.valueScore} · ${valueCard.valueScoreLabel}</strong>
              </div>` : ""}
            ${valueCard.progress != null ? `
              <div class="value-chip">
                <span>${t("narrative.detail.progressValue")}</span>
                <strong>${valueCard.progress.label} (${valueCard.progress.pct}%)</strong>
              </div>` : ""}
            ${valueCard.roi?.perHourLabel != null ? `
              <div class="value-chip">
                <span>${t("narrative.detail.costPerHour")}</span>
                <strong>${valueCard.roi.perHourLabel} · ${valueCard.roi.verdict}</strong>
              </div>` : ""}
            ${market}
          </div>
        </section>` : ""}
        ${priceWatch ? `<section class="game-detail-section game-detail-price-alert">
          <h3>${t("narrative.detail.priceAlert")}</h3>
          ${priceWatch}
        </section>` : ""}
        <section class="game-detail-section detail-source-trust" data-detail-source-trust>
          <h3>${t("narrative.detail.dataTrust")}</h3>
          <div class="detail-source-grid">
            ${trustRows.map((row) => `
              <div class="detail-source-row tone-${row.tone}">
                <span>${row.label}</span>
                <strong>${row.value}</strong>
                <small>${row.detail}</small>
              </div>
            `).join("")}
          </div>
          <div class="facts">${facts.map((fact) => `<span class="fact ${fact.type}">${fact.label}</span>`).join("")}</div>
          ${passport}
        </section>
        ${providerImport || ""}
        <section class="game-detail-section game-detail-ai" id="detail-ai-section" ${cachedAiExplanation ? "" : "hidden"}>
          <h3>${t("narrative.ai.detailTitle")}</h3>
          <div id="detail-ai-body" class="detail-ai-body" aria-live="polite">${cachedAiExplanation
            ? `<p data-ai-detail-copy></p>`
            : `<p class="detail-ai-placeholder">${t("narrative.ai.detailPlaceholder")}</p>`}</div>
          <button class="secondary-action detail-ai-btn" id="detail-ai-btn" type="button">${t("narrative.ai.detailButton")}</button>
        </section>
        ${similar.length ? `<section class="game-detail-section">
          <h3>${t("narrative.detail.similar")}</h3>
          <div class="similar-games-list">${similar.map(({ game: item, shared }) => `
            <button class="similar-game-card" data-similar-title="${detailAttr(item.title)}" type="button">
              <strong>${item.title}</strong>
              <span>${shared.slice(0, 3).join(" · ")}</span>
            </button>`).join("")}</div>
        </section>` : ""}
        <section class="game-detail-section">
          <h3>${t("narrative.detail.actions")}</h3>
          <div class="game-detail-actions">
            ${actions.map((action) => `<button class="${action.className}" data-detail-state="${action.state}" type="button">${action.label}</button>`).join("")}
            <button class="${queued ? "is-selected" : ""}" data-detail-rate-later type="button">${queued ? t("discover.actionRateQueued") : t("discover.actionRateLater")}</button>
            <button data-detail-compare type="button">${t("discover.actionCompare")}</button>
          </div>
        </section>
        <section class="game-detail-section">
          <h3>${t("narrative.detail.yourRating")}</h3>
          <div class="sputnik-rating" role="radiogroup" aria-label="${t("narrative.detail.rateAria", { title: game.title })}">
            ${[1, 2, 3, 4, 5].map((number) => `
              <button class="sputnik-btn ${currentSputniks >= number ? "is-filled" : ""}" data-rate-sputniks="${number}"
                type="button" role="radio" aria-checked="${currentSputniks === number}" aria-label="${t("narrative.detail.ratingButtonAria", { count: number })}">
                ${sputnikSvg}
              </button>`).join("")}
            <span class="sputnik-rating-label">${currentSputniks
              ? t("narrative.detail.ratingKnown", { count: currentSputniks })
              : t("narrative.detail.ratingEmpty")}</span>
          </div>
        </section>
        <section class="game-detail-section">
          <h3>${t("narrative.detail.getIt")}</h3>
          <p class="detail-chunk-note">${t("narrative.detail.naturalSession", { chunk: chunk.label, minutes: chunk.minutes })}</p>
          <div class="detail-get-links">
            ${links.map((link) => `<a class="detail-get-link detail-get-link--${link.kind}" href="${detailAttr(link.href)}" target="_blank" rel="noopener noreferrer">${link.label} ↗</a>`).join("")}
          </div>
        </section>
      `;
    }

    return { detailHeroHtml, detailBodyHtml };
  }

  window.PlaySputnikDetailView = { createDetailViewTools };
})();
