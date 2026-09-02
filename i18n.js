const TRANSLATIONS = {
  pl: {
    title: "wats2sats — ile bitcoina wykopiesz ze swojego prądu?",
    subtitle: "Ile satoshi* wykopiesz przy zadanej, ciągłej mocy?",
    satoshi_note: "* 100 000 000 satoshi = 1 BTC",
    watts_label: "Dostępna moc (W, ciągła)",
    miner_label: "Koparka",
    custom_efficiency: "Własna efektywność (J/TH)",
    efficiency_label: "Efektywność koparki (J/TH)",
    efficiency_hint: "17.5 J/TH to mniej więcej dzisiejszy nowoczesny ASIC.",
    r_setup: "Konfiguracja",
    r_used_watts: "Wykorzystana moc",
    r_hashrate: "Szacowany hashrate",
    r_btc_day: "BTC / dzień",
    r_sats_day: "Sats / dzień",
    r_sats_month: "Sats / miesiąc",
    r_value_day: "Wartość / dzień",
    r_value_month: "Wartość / miesiąc",
    r_share: "Udział w sieci",
    r_cost: "Koszt zakupu",
    cost_single: (price, estimated) => `${estimated ? "~" : ""}${price}`,
    cost_multi: (unitPrice, units, totalPrice, estimated) => `${estimated ? "~" : ""}${unitPrice} / szt. × ${units} = ${estimated ? "~" : ""}${totalPrice}`,
    r_payback: "Zwrot inwestycji (prąd gratis)",
    price_unknown: "brak danych",
    miners_heading: "Koparki, które zmieszczą się w tej mocy",
    miners_hint: "Przybliżone specyfikacje producentów (mogą się różnić w praktyce). Pokazujemy modele o poborze mocy równym lub mniejszym od wpisanego powyżej.",
    miners_price_hint: "Ceny brutto, przeliczone po bieżącym kursie. <strong>Cena będąca linkiem</strong> prowadzi do sklepu, w którym ją zweryfikowano (stan na 2026-09-01) — na razie dotyczy to koparek domowych do 400 W. Ceny bez linku pochodzą z asicminervalue.com i są orientacyjne. Ceny oznaczone „~” to szacunek (interpolacja z podobnych modeli). Cena „?” = brak wiarygodnej oferty. Ceny w sklepach się zmieniają — sprawdź przed zakupem.",
    miners_data_date: date => `Dane sprzętowe (specyfikacje, ceny) zaktualizowane: ${date}.`,
    use_this: "Użyj",
    best_value: (units, name, totalHs, payback) => `💡 Maksymalna moc obliczeniowa: ${units} × ${name} (moc: ${totalHs} TH/s, zwrot: ${payback})`,
    min_equipment: (units, name, totalHs, payback) => `📦 Minimalna ilość sprzętu: ${units} × ${name} (moc: ${totalHs} TH/s, zwrot: ${payback})`,
    optimal: (units, name, totalHs, payback) => `🎯 Optymalna: ${units} × ${name} (moc: ${totalHs} TH/s, zwrot: ${payback})`,
    table_price_gross: "Cena (brutto)",
    table_price_th: "$/TH",
    footer_note: 'Dane sieci (hashrate, trudność) pobierane na żywo z <a href="https://mempool.space" target="_blank" rel="noopener">mempool.space</a>, kurs BTC z CoinGecko. Nagroda za blok: 3.125 BTC. Kalkulator ma charakter szacunkowy — nie uwzględnia opłat, przestojów, kosztów prądu ani zmian trudności w czasie.',
    footer_contact: 'Kontakt: <a href="mailto:wats2sats@pm.me">wats2sats@pm.me</a>',
    watts_placeholder: "np. 3500",
    watts_needed_no_net: "",
    net_info: (eh, diff) => `Sieć Bitcoin na żywo: ~${eh} EH/s, trudność ~${diff} T (mempool.space)`,
    net_info_error: "Nie udało się pobrać aktualnego hashrate/trudności sieci — spróbuj odświeżyć stronę.",
    one_btc_info: (eff, w, mw, eh) => `Przy ${eff} J/TH, żeby wykopać 1 BTC w 24h, potrzeba ~${w} W (~${mw} MW) mocy obliczeniowej, czyli hashrate ~${eh} EH/s.`,
    price_info: price => `Kurs BTC: ${price} (CoinGecko)`,
    price_info_error: "Nie udało się pobrać aktualnego kursu BTC.",
    miner_hint_empty: "Wpisz dostępną moc, żeby zobaczyć koparki, które się w niej mieszczą.",
    miner_hint_none: max => `Żadna z uwzględnionych koparek nie mieści się w ${max} W — możesz podać własną efektywność.`,
    miner_hint_count: n => `${n} model(i) mieści się w podanej mocy.`,
    miners_table_empty: "Wpisz dostępną moc powyżej, żeby zobaczyć pasujące koparki.",
    miners_table_none: max => `Żadna z uwzględnionych koparek nie mieści się w ${max} W.`,
    table_model: "Model",
    table_units: "Ilość",
    table_watts: "Pobór",
    table_hashrate: "Hashrate",
    table_sats_day: "Sats/dzień",
    table_payback: "Zwrot",
    table_legend: max => `Wyszarzone modele nie mieszczą się w ${max} W. Dla pasujących liczymy tyle sztuk, ile zmieści się w mocy (×N), dla reszty — jedną sztukę.`,
    payback_days: d => `~${d} dni`,
    payback_lt_day: "<1 dzień",
    payback_gt_10y: ">10 lat",
    payback_disclaimer: "Zwrot inwestycji liczony przy założeniu, że prąd jest darmowy — nie uwzględnia kosztów energii, chłodzenia ani przestojów.",
    buy_link_title: "Otwórz sklep, w którym zweryfikowano tę cenę",
    setup_custom: eff => `${eff} J/TH (własna)`,
  },
  en: {
    title: "wats2sats — how much bitcoin can your power mine?",
    subtitle: "How many satoshis* can you mine at a given (continuous) power?",
    satoshi_note: "* 100,000,000 satoshis = 1 BTC",
    watts_label: "Available power (W, continuous)",
    miner_label: "Miner",
    custom_efficiency: "Custom efficiency (J/TH)",
    efficiency_label: "Miner efficiency (J/TH)",
    efficiency_hint: "17.5 J/TH is roughly today's modern ASIC.",
    r_setup: "Setup",
    r_used_watts: "Power used",
    r_hashrate: "Estimated hashrate",
    r_btc_day: "BTC / day",
    r_sats_day: "Sats / day",
    r_sats_month: "Sats / month",
    r_value_day: "Value / day",
    r_value_month: "Value / month",
    r_share: "Network share",
    r_cost: "Purchase cost",
    cost_single: (price, estimated) => `${estimated ? "~" : ""}${price}`,
    cost_multi: (unitPrice, units, totalPrice, estimated) => `${estimated ? "~" : ""}${unitPrice} / unit × ${units} = ${estimated ? "~" : ""}${totalPrice}`,
    r_payback: "Payback period (free electricity)",
    price_unknown: "no data",
    miners_heading: "Miners that fit within this power budget",
    miners_hint: "Approximate manufacturer specs (real-world results may vary). Showing models with power draw equal to or below the value above.",
    miners_price_hint: "Gross prices, converted at the current rate. <strong>A price that is a link</strong> points to the shop where it was verified (as of 2026-09-01) — so far this covers home miners up to 400 W. Prices without a link come from asicminervalue.com and are indicative only. Prices marked \"~\" are estimated (interpolated from similar models). A \"?\" price means no reliable listing. Shop prices change — check before buying.",
    miners_data_date: date => `Hardware data (specs, prices) last updated: ${date}.`,
    use_this: "Use it",
    best_value: (units, name, totalHs, payback) => `💡 Maximum compute power: ${units} × ${name} (power: ${totalHs} TH/s, payback: ${payback})`,
    min_equipment: (units, name, totalHs, payback) => `📦 Fewest devices: ${units} × ${name} (power: ${totalHs} TH/s, payback: ${payback})`,
    optimal: (units, name, totalHs, payback) => `🎯 Optimal: ${units} × ${name} (power: ${totalHs} TH/s, payback: ${payback})`,
    table_price_gross: "Price (gross)",
    table_price_th: "$/TH",
    footer_note: 'Network data (hashrate, difficulty) fetched live from <a href="https://mempool.space" target="_blank" rel="noopener">mempool.space</a>, BTC price from CoinGecko. Block reward: 3.125 BTC. This calculator is an estimate — it doesn\'t account for pool fees, downtime, electricity cost, or difficulty changes over time.',
    footer_contact: 'Contact: <a href="mailto:wats2sats@pm.me">wats2sats@pm.me</a>',
    watts_placeholder: "e.g. 3500",
    net_info: (eh, diff) => `Live Bitcoin network: ~${eh} EH/s, difficulty ~${diff} T (mempool.space)`,
    net_info_error: "Couldn't fetch current network hashrate/difficulty — try refreshing.",
    one_btc_info: (eff, w, mw, eh) => `At ${eff} J/TH, mining 1 BTC in 24h needs ~${w} W (~${mw} MW) of compute power, i.e. a hashrate of ~${eh} EH/s.`,
    price_info: price => `BTC price: ${price} (CoinGecko)`,
    price_info_error: "Couldn't fetch the current BTC price.",
    miner_hint_empty: "Enter the available power to see which miners fit.",
    miner_hint_none: max => `None of the listed miners fit within ${max} W — you can enter a custom efficiency instead.`,
    miner_hint_count: n => `${n} model(s) fit within the given power.`,
    miners_table_empty: "Enter the available power above to see matching miners.",
    miners_table_none: max => `None of the listed miners fit within ${max} W.`,
    table_model: "Model",
    table_units: "Units",
    table_watts: "Power",
    table_hashrate: "Hashrate",
    table_sats_day: "Sats/day",
    table_payback: "Payback",
    table_legend: max => `Greyed-out models don't fit within ${max} W. For fitting ones we count as many units as the power allows (×N), for the rest — a single unit.`,
    payback_days: d => `~${d} days`,
    payback_lt_day: "<1 day",
    payback_gt_10y: ">10 years",
    payback_disclaimer: "Payback period assumes electricity is free — it ignores power cost, cooling, and downtime.",
    buy_link_title: "Open the shop where this price was verified",
    setup_custom: eff => `${eff} J/TH (custom)`,
  },
};

let currentLang = localStorage.getItem("wats2sats_lang") || (navigator.language.startsWith("pl") ? "pl" : "en");

function t(key, ...args) {
  const entry = TRANSLATIONS[currentLang][key];
  return typeof entry === "function" ? entry(...args) : entry;
}

// Klucze, ktorych tresc zawiera wlasny markup i musi trafic do DOM jako HTML.
const HTML_KEYS = new Set(["footer_note", "footer_contact", "miners_price_hint"]);

function applyStaticTranslations() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const val = TRANSLATIONS[currentLang][key];
    if (typeof val === "string") {
      if (HTML_KEYS.has(key)) {
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
