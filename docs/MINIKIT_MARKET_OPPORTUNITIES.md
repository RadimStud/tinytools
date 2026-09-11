# MiniKit: trh, příležitosti a první komunitní krok

Průzkum: 11. září 2026. Jde o kvalitativní analýzu veřejných primárních zdrojů
a dostupného projektu, nikoli studii velikosti trhu nebo průzkum zákazníků.

## Rozhodnutí

MiniKit nyní potřebuje důvod k prvnímu použití a návratu. Samotný katalog se dvěma
publikovanými nástroji má slabou distribuční výhodu. Doporučený první experiment:
jedna okamžitě použitelná bezplatná utilita, která řeší srozumitelný problém, a
navazující místo pro zpětnou vazbu. Zvolena byla práce s CSV v prohlížeči.

To není tvrzení, že na trhu chybí CSV nástroje. Konkurence je silná a lokální
zpracování samo o sobě není unikátní. Testujeme kombinaci snadného vstupu,
kontrolovatelného výsledku a konkrétního dialogu s uživateli.

## Konkurenční prostředí

| Produkt | Ověřené veřejné vlastnosti | Důsledek pro MiniKit (interpretace) |
| --- | --- | --- |
| [itch.io](https://itch.io/docs/creators/faq) | Hostuje projekty včetně nástrojů, nabízí bezplatné i placené distribuce a stránky autorů. | Hosting a katalog samy o sobě nepředstavují dostatečné odlišení. |
| [AlternativeTo](https://alternativeto.net/about/) | Doporučení a alternativy pocházejí převážně od uživatelů. | Důvěra roste z konkrétních zkušeností, nikoliv z množství vlastních marketingových popisů. |
| [DevToys](https://devtoys.app/) | Bezplatná aplikace pro Windows, macOS a Linux, přibližně 30 výchozích offline utilit a rozšíření. | Vývojářské utility mají silného konkurenta. Vstup bez instalace je experimentální výhoda, soukromí není exkluzivní vlastnost. |
| [Goblin Tools](https://goblin.tools/) | Sada malých nástrojů formulovaných kolem konkrétních úkolů, například rozdělení úkolu nebo úpravy tónu textu. | Srozumitelný úkol je vhodnější vstupní komunikace než obecné označení „marketplace“. |
| [Product Hunt](https://www.producthunt.com/launch) | Distribuční a diskusní kanál pro nové produkty; oficiální návod nepovoluje přímé žádosti o upvotes. | Vhodný až pro konkrétní funkční ukázku a schopnost reagovat na komentáře. Launch není důkaz retence. |

Nejsou zde odhadována návštěvnost konkurentů, obrat, hledanost klíčových slov,
náklady na získání uživatele ani očekávaný podíl MiniKitu. Pro taková čísla chybí data.

## Stav projektu

Silné stránky: funkční publikování a stahování, bezplatné existující položky,
modulární služby/repozitáře, vlastní R2 úložiště, Supabase Auth, oddělený soukromý
superuser prostor a reálné E2E testy. Uživatel doložil úspěšné produkční testy po
opravě vyčerpání databázových spojení.

Slabiny: malý tematicky nesourodý katalog (MiniLottery a Temperature LED), chybějící
data o pravidelném používání, chybějící zavedená komunita a provoz závislý na jediném
správci. Veřejný GitHub repozitář nemá zapnuté Discussions, ale má Issues. Doména
minikitmarket.com není v tomto kroku připojována. Nejsou ověřené zálohy a obnovitelnost
dat ani rotace dříve zveřejněných přístupových údajů; před propagací ve větším měřítku
je potřeba dokončit provozní údržbu, ne ji prezentovat jako hotovou.

Soukromý trezor řeší vlastní potřebu majitele. Není veřejnou nabídkou pro návštěvníky
a nemá být hlavním argumentem při získávání komunity pro bezplatné utility.

## Prioritizované příležitosti

1. **Užitečnost před registrací:** CSV Cleaner na `/workbench/csv-cleaner`. Lokální
   zpracování, explicitní oddělovač, odstranění duplicit/prázdných řádků, trim,
   náhled, počty změn a stažení nové kopie. Žádné přenosy obsahu do API.
2. **Uzavřená smyčka zpětné vazby:** `/community`, veřejný GitHub board, formuláře
   pro use case a bug report, příspěvková pravidla. Autor reaguje na konkrétní
   problém, propojí ho s opravou a pozve původního přispěvatele k ověření.
3. **Dohledatelnost:** odkazy z homepage, popisné titulky a metadata, sitemap pouze
   veřejných vstupních stránek. Robots pravidla nejsou náhradou autorizace.
4. **Další utility až podle důkazů:** text diff, JSON formátování a práce s exporty
   jsou kandidáti, nikoliv závazný roadmap. Potřebují vlastní reprodukovatelné use cases.
5. **Odložit:** placené členství, reklamní nákup, Discord bez účastníků, automatické
   hromadné příspěvky, AI funkce bez konkrétní potřeby a rozšíření trezoru pro všechny.

Pořadí je kvalitativní odhad dopadu a náročnosti. Nejde o naměřenou ROI.

## Komunita: první čtyři týdny

| Fáze | Konkrétní práce | Důkaz, že to pomáhá |
| --- | --- | --- |
| Start | Zveřejnit komunitní rozcestník, issue templates a otevřenou otázku k malým opakovaným úkolům. | Fungující příspěvková cesta; nulové předstírané členství. |
| První týden | Reagovat na první skutečné příspěvky, ptát se na vstup/výstup a současný workaround. | Alespoň několik nezávislých konkrétních use cases, ne jen stars. |
| Druhý týden | Vybrat opakující se problém, dodat malou opravu a propojit issue s PR. | Původní uživatel potvrdí, že změna řeší jeho situaci. |
| Třetí a čtvrtý týden | Ukázat ověřený výsledek v jednom vhodném kanálu, upravit popis a dokumentaci podle dotazů. | Nový uživatel samostatně dokončí úlohu a někdo se vrátí. |

Toto je pracovní plán, ne nastavená automatizace ani příslib pravidelného běhu
agenta. Bez účtů a vhodného oprávnění nejsou publikovány příspěvky na cizích
platformách ani odesílány soukromé zprávy. První veřejné komunitní místo může
vzniknout přímo v uživatelově existujícím GitHub repozitáři.

## Měření a rozhodovací pravidla

Pro začátek vést ručně seznam: nové nezávislé use cases, odpovědi přispěvatelů,
potvrzená vyřešení, reprodukovatelné chyby a odkud návštěvníci přišli, pokud to sami
sdělí. Stars nejsou aktivní uživatelé. CI testy nejsou uživatelské konverze.

Experimentální cíl na první měsíc: 5 konkrétních use cases od různých lidí,
3 nezávislá potvrzení užitečnosti a alespoň 1 opakované použití dobrovolně
potvrzené uživatelem. Jsou to interní cíle, nikoliv předpověď nebo dnešní výsledky.
Pokud přichází pouze obecná pochvala, ptát se na skutečnou úlohu před dalším vývojem.
Pokud nikdo nereaguje, nejprve zlepšit distribuci a oslovení, ne automaticky přidávat
další funkce. Žádné trackery ani ukládání CSV obsahu nebyly kvůli měření zavedeny.

## Připravený text pro pozdější externí sdílení

Následující návrh není tvrzení, že byl odeslán:

> MiniKit is a small collection of focused tools. The new CSV Cleaner runs in your
> browser: trim spaces, remove duplicate and blank rows, preview the result, and
> download a new file. No signup and no upload of file contents. It supports UTF-8
> files up to 2 MiB. What repetitive CSV task would you want it to handle next?
> A made-up input/output example is more useful than a vote.

Použít až po úspěšných browserových kontrolách a ověření dostupnosti nové stránky.
Před publikováním v cizí komunitě ověřit její aktuální pravidla a vztah tématu ke
čtenářům. Nepřidávat tvrzení o uživatelích, bezpečnostním auditu nebo úsporách času,
které nemáme doložené.
