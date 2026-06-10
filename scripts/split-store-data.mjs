import { readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const gamesUrl = new URL("data/games.json", ROOT);
const games = JSON.parse(await readFile(gamesUrl, "utf8"));

const checkedAt = "2026-05-26T12:00:00Z";
const source = "sample_prices";
const subscriptionSource = "sample_ps_plus";
const currencyByRegion = {
  US: "USD",
  TR: "TRY",
  UK: "GBP",
};

const hasEmbeddedStoreData = games.some((game) => game.prices || game.discount || game.psPlus);

if (!hasEmbeddedStoreData) {
  console.log("Store data already split. No files changed.");
} else {
  const priceSnapshots = [];
  const subscriptionAvailability = [];
  const metadataOnly = games.map((game) => {
    Object.entries(game.prices || {}).forEach(([region, price]) => {
      priceSnapshots.push({
        title: game.title,
        region,
        price,
        currency: currencyByRegion[region] || "USD",
        discount: game.discount?.[region] || 0,
        source,
        checkedAt,
        freshnessState: "sample",
        confidence: "low",
      });
    });

    (game.psPlus || []).forEach((region) => {
      subscriptionAvailability.push({
        title: game.title,
        region,
        tier: "Extra",
        source: subscriptionSource,
        checkedAt,
        freshnessState: "sample",
        confidence: "low",
      });
    });

    const { prices, discount, psPlus, ...metadata } = game;
    return metadata;
  });

  await writeFile(gamesUrl, `${JSON.stringify(metadataOnly, null, 2)}\n`);
  await writeFile(new URL("data/price-snapshots.json", ROOT), `${JSON.stringify(priceSnapshots, null, 2)}\n`);
  await writeFile(new URL("data/subscription-availability.json", ROOT), `${JSON.stringify(subscriptionAvailability, null, 2)}\n`);

  console.log(`Split ${games.length} games into ${priceSnapshots.length} price snapshots and ${subscriptionAvailability.length} subscription records.`);
}
