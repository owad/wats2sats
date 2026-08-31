const TRANSLATIONS = {
  pl: {
    title: "wats2sats — ile satoshi z Twoich watów?",
    subtitle: "Ile satoshi da się wykopać przy zadanej mocy (ciągłej)?",
    watts_label: "Dostępna moc (W, ciągła)",
    miner_label: "Koparka",
    custom_efficiency: "Własna efektywność (J/TH)",
    efficiency_label: "Efektywność koparki (J/TH)",
    efficiency_hint: "17.5 J/TH to mniej więcej dzisiejszy nowoczesny ASIC.",
    calc_button: "Oblicz",
    r_setup: "Konfiguracja",
    r_used_watts: "Wykorzystana moc",
    r_hashrate: "Szacowany hashrate",
    r_btc_day: "BTC / dzień",
    r_sats_day: "Sats / dzień",
    r_sats_month: "Sats / miesiąc",
    r_value_day: "Wartość / dzień",
    r_value_month: "Wartość / miesiąc",
    r_share: "Udział w sieci",
    miners_heading: "Koparki, które zmieszczą się w tej mocy",
    miners_hint: "Przybliżone specyfikacje producentów (mogą się różnić w praktyce). Pokazujemy modele o poborze mocy równym lub mniejszym od wpisanego powyżej.",
    miners_price_hint: "Ceny orientacyjne (rynek nowy/używany) — służą tylko do porównania $/TH, nie traktuj ich jako oferty zakupu.",
    use_this: "Użyj",
    best_value: (units, name, perTh) => `💡 Najlepszy stosunek ceny do mocy: ${units} × ${name} (~$${perTh}/TH)`,
    table_price_th: "$/TH",
    footer_note: 'Dane sieci (hashrate, trudność) pobierane na żywo z <a href="https://mempool.space" target="_blank" rel="noopener">mempool.space</a>, kurs BTC z CoinGecko. Nagroda za blok: 3.125 BTC. Kalkulator ma charakter szacunkowy — nie uwzględnia opłat, przestojów, kosztów prądu ani zmian trudności w czasie.',
    watts_placeholder: "np. 3500",
    watts_needed_no_net: "",
    net_info: (eh, diff) => `Sieć Bitcoin na żywo: ~${eh} EH/s, trudność ~${diff} T (mempool.space)`,
    net_info_error: "Nie udało się pobrać aktualnego hashrate/trudności sieci — spróbuj odświeżyć stronę.",
    one_btc_info: (eff, w, mw) => `Przy ${eff} J/TH, żeby wykopać 1 BTC w 24h, potrzeba ~${w} W (~${mw} MW) mocy obliczeniowej.`,
    price_info: (usd, eur, pln) => `Kurs BTC: $${usd} / €${eur} / ${pln} zł (CoinGecko)`,
    price_info_error: "Nie udało się pobrać aktualnego kursu BTC.",
    miner_hint_empty: "Wpisz dostępną moc, żeby zobaczyć koparki, które się w niej mieszczą.",
    miner_hint_none: max => `Żadna z uwzględnionych koparek nie mieści się w ${max} W — możesz podać własną efektywność.`,
    miner_hint_count: n => `${n} model(i) mieści się w podanej mocy.`,
    miners_table_empty: "Wpisz dostępną moc powyżej, żeby zobaczyć pasujące koparki.",
    miners_table_none: max => `Żadna z uwzględnionych koparek nie mieści się w ${max} W.`,
    table_model: "Model",
    table_watts: "Pobór",
    table_hashrate: "Hashrate",
    table_sats_day: "Sats/dzień",
    setup_custom: eff => `${eff} J/TH (własna)`,
  },
  en: {
    title: "wats2sats — how many sats from your watts?",
    subtitle: "How many satoshis can you mine at a given (continuous) power?",
    watts_label: "Available power (W, continuous)",
    miner_label: "Miner",
    custom_efficiency: "Custom efficiency (J/TH)",
    efficiency_label: "Miner efficiency (J/TH)",
    efficiency_hint: "17.5 J/TH is roughly today's modern ASIC.",
    calc_button: "Calculate",
    r_setup: "Setup",
    r_used_watts: "Power used",
    r_hashrate: "Estimated hashrate",
    r_btc_day: "BTC / day",
    r_sats_day: "Sats / day",
    r_sats_month: "Sats / month",
    r_value_day: "Value / day",
    r_value_month: "Value / month",
    r_share: "Network share",
    miners_heading: "Miners that fit within this power budget",
    miners_hint: "Approximate manufacturer specs (real-world results may vary). Showing models with power draw equal to or below the value above.",
    miners_price_hint: "Prices are rough ballpark figures (new/used market) — for comparing $/TH only, not a purchase offer.",
    use_this: "Use it",
    best_value: (units, name, perTh) => `💡 Best price-to-power ratio: ${units} × ${name} (~$${perTh}/TH)`,
    table_price_th: "$/TH",
    footer_note: 'Network data (hashrate, difficulty) fetched live from <a href="https://mempool.space" target="_blank" rel="noopener">mempool.space</a>, BTC price from CoinGecko. Block reward: 3.125 BTC. This calculator is an estimate — it doesn\'t account for pool fees, downtime, electricity cost, or difficulty changes over time.',
    watts_placeholder: "e.g. 3500",
    net_info: (eh, diff) => `Live Bitcoin network: ~${eh} EH/s, difficulty ~${diff} T (mempool.space)`,
    net_info_error: "Couldn't fetch current network hashrate/difficulty — try refreshing.",
    one_btc_info: (eff, w, mw) => `At ${eff} J/TH, mining 1 BTC in 24h needs ~${w} W (~${mw} MW) of compute power.`,
    price_info: (usd, eur, pln) => `BTC price: $${usd} / €${eur} / ${pln} PLN (CoinGecko)`,
    price_info_error: "Couldn't fetch the current BTC price.",
    miner_hint_empty: "Enter the available power to see which miners fit.",
    miner_hint_none: max => `None of the listed miners fit within ${max} W — you can enter a custom efficiency instead.`,
    miner_hint_count: n => `${n} model(s) fit within the given power.`,
    miners_table_empty: "Enter the available power above to see matching miners.",
    miners_table_none: max => `None of the listed miners fit within ${max} W.`,
    table_model: "Model",
    table_watts: "Power",
    table_hashrate: "Hashrate",
    table_sats_day: "Sats/day",
    setup_custom: eff => `${eff} J/TH (custom)`,
  },
};

let currentLang = localStorage.getItem("wats2sats_lang") || (navigator.language.startsWith("pl") ? "pl" : "en");

function t(key, ...args) {
  const entry = TRANSLATIONS[currentLang][key];
  return typeof entry === "function" ? entry(...args) : entry;
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const val = TRANSLATIONS[currentLang][key];
    if (typeof val === "string") {
      if (key === "footer_note") {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    }
  });
  document.getElementById("watts").placeholder = t("watts_placeholder");
  document.querySelectorAll("#lang-pl, #lang-en").forEach(btn => btn.classList.remove("active"));
  document.getElementById(`lang-${currentLang}`).classList.add("active");
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("wats2sats_lang", lang);
  applyStaticTranslations();
  if (typeof onLanguageChanged === "function") onLanguageChanged();
}

document.getElementById("lang-pl").addEventListener("click", () => setLang("pl"));
document.getElementById("lang-en").addEventListener("click", () => setLang("en"));
applyStaticTranslations();
