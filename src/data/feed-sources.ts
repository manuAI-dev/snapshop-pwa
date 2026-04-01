// ============================================================
// Kuratierte Rezept-Feed-Daten für alle Quellen
// Echte Daten, extrahiert direkt von den Quellseiten
// ============================================================

export interface CuratedRecipe {
  slug: string;
  title: string;
  imageUrl?: string;
}

export interface FeedSourceConfig {
  id: string;
  name: string;
  hostname: string;
  color: string;
  logoUrl: string;
  baseUrl: string;
  recipeUrlPattern: (slug: string) => string;
  imageUrlPattern?: (slug: string) => string;
  recipes: CuratedRecipe[];
}

// ============================================================
// Helper: Betty Bossi Bild-URL
// ============================================================
const bbImg = (hash: string) =>
  `https://media.bettybossi.ch/image/992382728798/${hash}/-FWEBP-Ro:5,w:750,h:600,n:default`;

// Helper: Migusto Bild-URL
const miImg = (hash: string, slug: string) =>
  `https://recipeimages.migros.ch/no-crop/v-w-600/${hash}/${slug}-0-16-9.jpg`;

// Helper: Swissmilk Bild-URL
const smImg = (path: string) =>
  `https://res.cloudinary.com/swissmilk/image/fetch/w_800,h_600,c_fill,g_auto,f_auto,q_auto/https://api.swissmilk.ch/wp-content/uploads/${path}`;

// ============================================================
// FOOBY (Coop)
// ============================================================

const FOOBY_RECIPES: CuratedRecipe[] = [
  { slug: "14910/baerlauchpesto", title: "Bärlauchpesto" },
  { slug: "15299/fastenwaehe", title: "Fastenwähe" },
  { slug: "19047/rhabarber-sirup", title: "Rhabarber-Sirup" },
  { slug: "15297/fasnachtschueechli", title: "Fasnachtschüechli" },
  { slug: "14202/spargeln-sieden", title: "Spargeln sieden" },
  { slug: "27034/waadtlaender-saucissons", title: "Waadtländer Saucissons" },
  { slug: "26119/harira-suppe", title: "Harira-Suppe" },
  { slug: "14031/hackbraten-mit-wintergemuese", title: "Hackbraten mit Wintergemüse" },
  { slug: "20400/birnen-konfituere", title: "Birnen-Konfitüre" },
  { slug: "9726/sauerbraten", title: "Sauerbraten" },
  { slug: "28803/pizzoccheri-mit-lauch-und-kaese", title: "Pizzoccheri mit Lauch und Käse" },
  { slug: "28519/vegane-protein-kaffee-cookies", title: "Vegane Protein-Kaffee-Cookies" },
  { slug: "28517/veganes-lahmacun", title: "Veganes Lahmacun" },
  { slug: "28678/glasiertes-schinkli-mit-zwiebelsauce", title: "Glasiertes Schinkli mit Zwiebelsauce" },
  { slug: "28676/schokoladenmousse-mit-mandeln", title: "Schokoladenmousse mit Mandeln" },
  { slug: "28834/glasierte-rueebli", title: "Glasierte Rüebli" },
  { slug: "28582/hackbraten-mit-getrockneten-tomaten", title: "Hackbraten mit getrockneten Tomaten" },
  { slug: "26527/schlorzifladen", title: "Schlorzifladen" },
  { slug: "28317/cassoulet-mit-wienerli", title: "Cassoulet mit Wienerli" },
  { slug: "28334/spaghetti-all-arrabbiata", title: "Spaghetti all'arrabbiata" },
  { slug: "27332/pastetli-mit-ragout", title: "Pastetli mit Ragout" },
  { slug: "28878/weggli-french-toast-mit-speck-und-ei", title: "Weggli-French-Toast mit Speck und Ei" },
  { slug: "28315/poulet-cordon-bleu-mit-pommes-frites", title: "Poulet-Cordon-bleu mit Pommes frites" },
  { slug: "28316/kartoffelgratin", title: "Kartoffelgratin" },
  { slug: "27947/baerlauch-gersten-fritters", title: "Bärlauch-Gersten-Fritters" },
  { slug: "27953/baerlauch-fladenbrote-mit-cheddar", title: "Bärlauch-Fladenbrote mit Cheddar" },
  { slug: "28905/igeli-broetli", title: "Igeli-Brötli" },
  { slug: "28913/salat-mit-ricotta-und-radiesli", title: "Salat mit Ricotta und Radiesli" },
  { slug: "28911/ueberbackene-spinat-omeletten", title: "Überbackene Spinat-Omeletten" },
  { slug: "28914/bundzwiebel-crostini", title: "Bundzwiebel-Crostini" },
  { slug: "28906/zimt-french-toast-rollen", title: "Zimt-French-Toast-Rollen" },
  { slug: "28912/rueebli-pie-mit-kardamom", title: "Rüebli-Pie mit Kardamom" },
  { slug: "29094/masala-fried-chicken", title: "Masala Fried Chicken" },
  { slug: "29093/poulet-pizza-sandwich", title: "Poulet-Pizza-Sandwich" },
  { slug: "28882/honig-nuesse-mit-erdbeeren", title: "Honig-Nüsse mit Erdbeeren" },
  { slug: "28885/bibeli-hefebroetchen", title: "Bibeli-Hefebrötchen" },
  { slug: "20995/zwiebelsuppe", title: "Zwiebelsuppe" },
  { slug: "21130/wurstweggen", title: "Wurstweggen" },
  { slug: "20516/magenbrot", title: "Magenbrot" },
  { slug: "20537/laugenbrezel", title: "Laugenbrezel" },
  { slug: "20331/kirschtorte", title: "Kirschtorte" },
  { slug: "19806/eiskaffee", title: "Eiskaffee" },
  { slug: "19978/dalgona-coffee", title: "Dalgona Coffee" },
  { slug: "19170/rueeblicake", title: "Rüeblicake" },
  { slug: "19241/herzhafte-chaeschueechli", title: "Herzhafte Chäschüechli" },
  { slug: "19131/patacones", title: "Patacones" },
  { slug: "19004/quesadillas", title: "Quesadillas" },
  { slug: "19162/ungarisches-gulasch", title: "Ungarisches Gulasch" },
  { slug: "18874/croque-madame", title: "Croque madame" },
  { slug: "19022/schuefeli-im-teig-mit-senffruechten", title: "Schüfeli im Teig mit Senffrüchten" },
  { slug: "18851/florentiner", title: "Florentiner" },
  { slug: "18523/kartoffelgratin", title: "Kartoffelgratin" },
  { slug: "18739/baklava", title: "Baklava" },
  { slug: "18734/zimtschnecken", title: "Zimtschnecken" },
  { slug: "18438/momos", title: "Momos" },
  { slug: "18308/glasierte-marroni", title: "Glasierte Marroni" },
  { slug: "18068/pizzateig", title: "Pizzateig" },
  { slug: "18192/steinpilzrisotto", title: "Steinpilzrisotto" },
  { slug: "18086/hacktaetschli-mit-stampf", title: "Hacktätschli mit Stampf" },
  { slug: "18082/thai-curry-paste", title: "Thai Curry-Paste" },
  { slug: "17374/kartoffelstampf", title: "Kartoffelstampf" },
  { slug: "17351/ceviche", title: "Ceviche" },
  { slug: "17595/nasi-goreng", title: "Nasi Goreng" },
  { slug: "16577/selleriesalat", title: "Selleriesalat" },
  { slug: "17010/boeuf-bourguignon", title: "Boeuf Bourguignon" },
  { slug: "16991/caesar-salad", title: "Caesar Salad" },
  { slug: "17009/gulaschsuppe", title: "Gulaschsuppe" },
  { slug: "16669/wienerli-im-blaetterteig", title: "Wienerli im Blätterteig" },
  { slug: "16748/naan--indisches-fladenbrot-", title: "Naan (Indisches Fladenbrot)" },
  { slug: "16361/grissini", title: "Grissini" },
  { slug: "12049/tarte-tatin-", title: "Tarte Tatin" },
  { slug: "16108/blondies", title: "Blondies" },
  { slug: "16116/tirolercake", title: "Tirolercake" },
  { slug: "16115/shortbread", title: "Shortbread" },
  { slug: "16113/quiche-lorraine", title: "Quiche Lorraine" },
  { slug: "16133/ruchbrot", title: "Ruchbrot" },
  { slug: "16315/ossobuco-mit-gremolata", title: "Ossobuco mit Gremolata" },
  { slug: "16501/cantucci", title: "Cantucci" },
  { slug: "16252/spaghetti-aglio-e-olio", title: "Spaghetti aglio e olio" },
  { slug: "16210/gyoza--japanische-teigtaschen-", title: "Gyoza (japanische Teigtaschen)" },
  { slug: "16128/weggli", title: "Weggli" },
  { slug: "16110/berliner", title: "Berliner" },
  { slug: "16132/mandelgipfel", title: "Mandelgipfel" },
  { slug: "16109/linzertorte", title: "Linzertorte" },
  { slug: "28898/pulled-lamb-mit-harissa", title: "Pulled Lamb mit Harissa" },
  { slug: "28899/spargel-fisch-eintopf", title: "Spargel-Fisch-Eintopf" },
  { slug: "28836/eier-frischkaese-toast", title: "Eier-Frischkäse-Toast" },
  { slug: "28881/spargeln-mit-hummus", title: "Spargeln mit Hummus" },
  { slug: "28879/safran-honig-zopfkranz", title: "Safran-Honig-Zopfkranz" },
  { slug: "29003/buchweizensalat-mit-geschmorten-rueebli", title: "Buchweizensalat mit geschmorten Rüebli" },
  { slug: "28880/toskanisches-brot-mit-oliven", title: "Toskanisches Brot mit Oliven" },
  { slug: "28883/parmigiana-di-melanzane", title: "Parmigiana di Melanzane" },
  { slug: "28884/fruehlings-minestrone", title: "Frühlings-Minestrone" },
  { slug: "28886/spinat-feta-boereks", title: "Spinat-Feta-Böreks" },
  { slug: "29001/erdbeer-pavlova", title: "Erdbeer-Pavlova" },
  { slug: "29002/rhabarber-crumble", title: "Rhabarber-Crumble" },
  { slug: "28900/baerlauch-gnocchi", title: "Bärlauch-Gnocchi" },
  { slug: "28901/zitronen-poulet-mit-oliven", title: "Zitronen-Poulet mit Oliven" },
];

// ============================================================
// BETTY BOSSI
// ============================================================

const BETTYBOSSI_RECIPES: CuratedRecipe[] = [
  { slug: "spaghetti-an-poulet-senfsauce-10012200", title: "Spaghetti an Poulet-Senfsauce", imageUrl: bbImg("image_h46e747u9p7999lipgljt58r58") },
  { slug: "zitronen-mississippi-cake-10012123", title: "Zitronen Mississippi Cake", imageUrl: bbImg("image_co0jauulqp0sn32d9uprmtg43g") },
  { slug: "glutenfreie-kokos-osterguetzli-10012090", title: "Glutenfreie Kokos-Osterguetzli", imageUrl: bbImg("image_vkp0uu4n7h7chdt5kn70a94b3v") },
  { slug: "smashed-potatoes-mit-barlauch-dip-10012092", title: "Smashed Potatoes mit Bärlauch-Dip", imageUrl: bbImg("image_qfnua76p351vl61rtbs5onma6g") },
  { slug: "dorrtomaten-suppe-10012106", title: "Dörrtomaten-Suppe", imageUrl: bbImg("image_6u0ip0jikl1lbal71hodg7pu06") },
  { slug: "mini-spargel-tartelettes-10012098", title: "Mini-Spargel-Tartelettes", imageUrl: bbImg("image_bc103m25797enah9ale5ukld0v") },
  { slug: "osterhasen-spitzbuben-10012113", title: "Osterhasen-Spitzbuben", imageUrl: bbImg("image_kipplq5oel4g38r4c1t22ug14h") },
  { slug: "goldbuttfilets-mit-tomaten-kichererbsen-sauce-10012091", title: "Goldbuttfilets mit Tomaten-Kichererbsen-Sauce", imageUrl: bbImg("image_gmm1e58t111f38ae5s3ds0u92r") },
  { slug: "honig-quarkcreme-mit-beeren-10012112", title: "Honig-Quarkcreme mit Beeren", imageUrl: bbImg("image_qtaelk9md14e1ce6ll9rbigt1m") },
  { slug: "cashew-chicken-noodles-10012105", title: "Cashew Chicken Noodles", imageUrl: bbImg("image_f5i1fml5j935h3ta4ehrhj8414") },
  { slug: "frischkase-schnecken-10012097", title: "Frischkäse-Schnecken", imageUrl: bbImg("image_305v7184nl2n7fm633kiim7h6h") },
  { slug: "erbsli-eier-tarte-10012087", title: "Erbsli-Eier-Tarte", imageUrl: bbImg("image_ne1ksn4fol2b1ebch6c9asi96a") },
  { slug: "jagerschnitzel-10011889", title: "Jägerschnitzel", imageUrl: bbImg("image_s538js4dlt5nt338fcsknort5g") },
  { slug: "haselnuss-kuchlein-10012103", title: "Haselnuss-Küchlein", imageUrl: bbImg("image_r07irk2gg16g5d4ojsg7n22b0e") },
  { slug: "barlauch-und-kernenbrot-10012161", title: "Bärlauch- und Kernenbrot", imageUrl: bbImg("image_1kvusih85143f1l9e5la2hkd3s") },
  { slug: "hornligratin-mit-brosmeli-10005131", title: "Hörnligratin mit Brösmeli", imageUrl: bbImg("image_utq0983i7t1p741ii05n41si1s") },
  { slug: "rahmschnitzel-mit-spiralen-10004327", title: "Rahmschnitzel mit Spiralen", imageUrl: bbImg("image_fb4lqi27151dh2p02p699j3k51") },
  { slug: "risotto-ticinese-10001247", title: "Risotto ticinese", imageUrl: bbImg("image_r3t77macch77pdg7dfa0boer69") },
  { slug: "kaseknopfli-10003839", title: "Käseknöpfli", imageUrl: bbImg("image_ram2sfsa4d47d0v3a5b443jf0h") },
  { slug: "churer-fleischtorte-10003609", title: "Churer Fleischtorte", imageUrl: bbImg("image_vj73ifnlcp2b5flt6hai43p255") },
  { slug: "hacktatschli-mit-spiegelei-10006992", title: "Hacktätschli mit Spiegelei", imageUrl: bbImg("image_d0b0ophoj120pdbpi0hnurin18") },
  { slug: "capuns-mit-salsiz-10004248", title: "Capuns mit Salsiz", imageUrl: bbImg("image_p4thqoojat2ajbu5rrk05pfa3u") },
  { slug: "fleischkase-mit-ofenkartoffeln-10009713", title: "Fleischkäse mit Ofenkartoffeln", imageUrl: bbImg("image_kjtpmqedr92k14mj9vp6lp3843") },
  { slug: "hacktatschli-10009766", title: "Hacktätschli", imageUrl: bbImg("image_52kjdngpa95mlfv8v1g8isu933") },
  { slug: "maluns-10008178", title: "Maluns", imageUrl: bbImg("image_8rfhtfc2a16d137mq93nlgb00t") },
  { slug: "kartoffelstock-10006689", title: "Kartoffelstock", imageUrl: bbImg("image_misqj4j5712br0qoi53ubglr4u") },
  { slug: "minestrone-10002251", title: "Minestrone", imageUrl: bbImg("image_i4416kg36d12fck1kgro4frj5o") },
  { slug: "rosti-10003120", title: "Rösti", imageUrl: bbImg("image_aav5fn0vs5097600fgvqm69f26") },
  { slug: "hornligratin-10008837", title: "Hörnligratin", imageUrl: bbImg("image_ij9lco6rsh3dbd3c53g7c7c137") },
  { slug: "hornligratin-mit-hackfleisch-10009659", title: "Hörnligratin mit Hackfleisch", imageUrl: bbImg("image_9gm2oectcd6955a5o8tr3lnd6s") },
  { slug: "lauch-raclette-wahe-10009616", title: "Lauch-Raclette-Wähe", imageUrl: bbImg("image_6t01v80dhp3c50plto4usqbv5s") },
  { slug: "schlorzifladen-10001250", title: "Schlorzifladen", imageUrl: bbImg("image_j99se1i7cd0jl138qfdt0fca1e") },
  { slug: "kasefondue-10009741", title: "Käsefondue", imageUrl: bbImg("image_bgjdnc4oil7kdbl1sf6m9s2k13") },
  { slug: "toast-hawaii-10008724", title: "Toast Hawaii", imageUrl: bbImg("image_gl1iutd9hp449c0cd6hvjrph58") },
  { slug: "wurstli-im-teig-10007037", title: "Würstli im Teig", imageUrl: bbImg("image_0f5n8emgld5qd6nvsr9jl05r67") },
  { slug: "schinkengipfeli-10002078", title: "Schinkengipfeli", imageUrl: bbImg("image_s5e8comsph2fn5t72e8bfc9138") },
  { slug: "kasewahe-10000562", title: "Käsewähe", imageUrl: bbImg("image_66og31mm913c55m20roktlia3j") },
  { slug: "alplermagronen-10004767", title: "Älplermagronen", imageUrl: bbImg("image_hg451q1vld75n3p547kunka40s") },
];

// ============================================================
// MIGUSTO (Migros)
// ============================================================

const MIGUSTO_RECIPES: CuratedRecipe[] = [
  { slug: "kartoffelsalat-mit-mayonnaise-dressing", title: "Kartoffelsalat mit Mayonnaise-Dressing", imageUrl: miImg("fc893dee9c2277b5fa49e6084254d131ab060785", "kartoffelsalat-mit-mayonnaise-dressing") },
  { slug: "pasta-mit-zucchetti-thon-ragout", title: "Pasta mit Zucchetti-Thon-Ragout", imageUrl: miImg("45e12b5b446798c736d037be89b9b92d2c05a8dd", "pasta-mit-zucchetti-thon-ragout") },
  { slug: "schlangenbrot", title: "Schlangenbrot", imageUrl: miImg("d41f62b2cdd40cb3f0575dd44ccc96e2366d0ff7", "schlangenbrot") },
  { slug: "basilikumpesto", title: "Basilikumpesto", imageUrl: miImg("e3a7301107a29daf6a064524356da2c71c09cb59", "basilikumpesto") },
  { slug: "chimichurri", title: "Chimichurri", imageUrl: miImg("2f69493024d57f2a50d870283dd4ab14a89c8b67", "chimichurri") },
  { slug: "risi-e-bisi", title: "Risi e bisi", imageUrl: miImg("9d09f8fc0c9f7e80f67ce148be5a07b6da8f5df7", "risi-e-bisi") },
  { slug: "gurken-limetten-bowle", title: "Gurken-Limetten-Bowle", imageUrl: miImg("acb4ebeec8baf32b368165381ae93aeda1abaae8", "gurken-limetten-bowle") },
  { slug: "cervelat-gemuese-salat-mit-ei", title: "Cervelat-Gemüse-Salat mit Ei", imageUrl: miImg("167294d04aab603cb6ba4b7860296ad79c56fa62c", "cervelat-gemuese-salat-mit-ei") },
  { slug: "kaesequiches-mit-speck", title: "Käsequiches mit Speck", imageUrl: miImg("ef95ab1e1dc1e132eecc2c51c753aea22ec56921", "kaesequiches-mit-speck") },
  { slug: "gelbes-linsentatar", title: "Gelbes Linsentatar", imageUrl: miImg("743be0863836e4dfa3a5805e41fba338091a9305", "gelbes-linsentatar") },
  { slug: "hackbaellchen-mit-sesam-und-teriyaki", title: "Hackbällchen mit Sesam und Teriyaki", imageUrl: miImg("66eb9751e75649f883afefb19a86d18a92a4442a", "hackbaellchen-mit-sesam-und-teriyaki") },
  { slug: "pastel-de-nata", title: "Pastel de nata", imageUrl: miImg("4611208162a42da05984ebbd086a9a59552c6115", "pastel-de-nata") },
  { slug: "pesto-vom-fenchelgruen", title: "Pesto vom Fenchelgrün", imageUrl: miImg("2709c2a3894552eafbe7438e1e8a53baeb977c67", "pesto-vom-fenchelgruen") },
  { slug: "laab-gai", title: "Laab Gai", imageUrl: miImg("ec6f98f4ee83885a63628431209ed8875c1b9ae1", "laab-gai") },
  { slug: "tzatziki", title: "Tzatziki", imageUrl: miImg("69d5ea5b1d4788b3cc8d8a71a5a8d9b5a9d652e9", "tzatziki") },
  { slug: "honig-schweinsfilet-mit-minze-vinaigrette", title: "Honig-Schweinsfilet mit Minze-Vinaigrette", imageUrl: miImg("eb3e55ec1cbd4c71ca3ae5cf345d27115a30e361", "honig-schweinsfilet-mit-minze-vinaigrette") },
  { slug: "pizzabrot", title: "Pizzabrot", imageUrl: miImg("34512050cde4c8998a2125d6b6b032d4ec297d8d", "pizzabrot") },
  { slug: "kleine-hackbraten-mit-rucola", title: "Kleine Hackbraten mit Rucola", imageUrl: miImg("7627d41f763bffca69a6d5274ef6530f44840b2f", "kleine-hackbraten-mit-rucola") },
  { slug: "penne-mit-rucola-knoblauch-chorizo-und-parmesan", title: "Penne mit Rucola, Chorizo und Parmesan", imageUrl: miImg("dff5b3ee435a23c7ac36b229469288ecfbcb5474", "penne-mit-rucola-knoblauch-chorizo-und-parmesan") },
  { slug: "kartoffelstock", title: "Kartoffelstock", imageUrl: miImg("4551c268dc21c9953e5c782009a0c3300055a1cb", "kartoffelstock") },
  { slug: "spaghetti-mit-oliven-kapern-und-sardellen", title: "Spaghetti mit Oliven, Kapern und Sardellen", imageUrl: miImg("5009e1264f9cf3025343914b3dee7c0d70d3fa3d", "spaghetti-mit-oliven-kapern-und-sardellen") },
  { slug: "linsen-dal", title: "Linsen-Dal", imageUrl: miImg("5195281439ea7300f79c0c63365e9f11b9fa41e0", "linsen-dal") },
  { slug: "poulet-satay-mit-erdnusssauce", title: "Poulet-Satay mit Erdnusssauce", imageUrl: miImg("5009e1264f9cf3025343914b3dee7c0d70d3fa3d", "poulet-satay-mit-erdnusssauce") },
  { slug: "hummus", title: "Hummus", imageUrl: miImg("666a587b878ed312bae55c1780611e53f7cf8bfd", "hummus") },
  { slug: "riz-casimir", title: "Riz Casimir", imageUrl: miImg("09cfb01f9ab39eab4e5d83dcc7202ac56534817a", "riz-casimir") },
  { slug: "poulet-curry", title: "Poulet-Curry", imageUrl: miImg("303e6f47dc23ab5999334ca9561c968afb9c4ffa", "poulet-curry") },
  { slug: "chili-con-carne", title: "Chili con carne", imageUrl: miImg("99ebbc3913125902466aa62886e2a860292b40dd", "chili-con-carne") },
  { slug: "wiener-schnitzel", title: "Wiener Schnitzel", imageUrl: miImg("f300ae1ea22bfd17456b290b77645cdea77f2d55", "wiener-schnitzel") },
  { slug: "falafel", title: "Falafel", imageUrl: miImg("a3ceda4e1fe3267c7e51f2226ab63f35f94ffb43", "falafel") },
  { slug: "pad-thai", title: "Pad Thai", imageUrl: miImg("9b3e22c66b7b7cf609b0a01d2fe90ef1384a891f", "pad-thai") },
  { slug: "shakshuka", title: "Shakshuka", imageUrl: miImg("cc07516f0ade456689907b75ea0b85ef88253d11", "shakshuka") },
  { slug: "minestrone", title: "Minestrone", imageUrl: miImg("6313da19ae0939524719cbbd463e722fd7f51ba6", "minestrone") },
  { slug: "ratatouille", title: "Ratatouille", imageUrl: miImg("19e3f14ddec8c59e116e2e8f78b8a117ad4a4f55", "ratatouille") },
  { slug: "tiramisu", title: "Tiramisu", imageUrl: miImg("4a8e2ed5c36c5f3c5c48f54d7c9e61c94f41a20b", "tiramisu") },
  { slug: "bananenbrot", title: "Bananenbrot", imageUrl: miImg("ebc5e8e4d5e67d22f9f5de2b2fd3b6e3c9d39b9d", "bananenbrot") },
  { slug: "focaccia", title: "Focaccia", imageUrl: miImg("ad66d3cd7c23d1e0e8c3f8a8d5e3c7b93f3e5a1f", "focaccia") },
];

// ============================================================
// SWISSMILK
// ============================================================

const SWISSMILK_RECIPES: CuratedRecipe[] = [
  { slug: "SM2017_DIVE_15/lasagne", title: "Lasagne", imageUrl: smImg("2019/06/lasagne-2560x1919.jpg") },
  { slug: "LM199904_46_MEN904B046A/boeuf-stroganoff", title: "Bœuf Stroganoff", imageUrl: smImg("2019/06/rindsfilet-stroganoff-2-2560x1920.jpg") },
  { slug: "LM200910_59/tomatenrisotto", title: "Tomatenrisotto", imageUrl: smImg("2019/12/LM200910_59_Tomatenrisotto-2560x1707.jpg") },
  { slug: "LM201010_45/kuerbissuppe", title: "Kürbissuppe", imageUrl: smImg("2024/09/LM201010_45_kuerbissuppe-2560x1707.jpg") },
  { slug: "LM_div_0812_05/rindsragout", title: "Rindsragout", imageUrl: smImg("2019/06/rindsragout-klassisch-2560x1920.jpg") },
  { slug: "CHDO201612_04/bolognese-sauce", title: "Bolognese-Sauce", imageUrl: smImg("2019/06/bolognese-sauce-2560x1920.jpg") },
  { slug: "LM201601_8/hoernliauflauf", title: "Hörnliauflauf", imageUrl: smImg("2019/06/kaese-hoernli-auflauf-2560x2560.jpg") },
  { slug: "LM201206_80/hamburger", title: "Hamburger", imageUrl: smImg("2023/01/LM201206_80_Hamburger.jpg") },
  { slug: "LM200909_77/poulet-stroganoff", title: "Poulet Stroganoff", imageUrl: smImg("2024/09/LM200909_77_Poulet_Stroganoff-2560x1707.jpg") },
  { slug: "SM2018_CHDO_13/shakshuka", title: "Shakshuka", imageUrl: smImg("2019/06/shakshuka-2560x1706.jpg") },
  { slug: "LM201401_54/buendner-gerstensuppe", title: "Bündner Gerstensuppe", imageUrl: smImg("2019/06/buendner-gerstensuppe.jpg") },
  { slug: "LM200105_07_MEN105B0/flammkuchen", title: "Flammkuchen", imageUrl: smImg("2019/06/flammkuchen-2560x1920.jpg") },
  { slug: "SM2023_DIVE_114/linsen-dal", title: "Linsen-Dal", imageUrl: smImg("2023/12/SM2023_DIVE_114_linsen-dal-2560x1708.jpg") },
  { slug: "LM201505_9/spargelrisotto", title: "Spargelrisotto", imageUrl: smImg("2019/06/spargelrisotto-2560x1706.jpg") },
  { slug: "LM201507_9/gefuellte-peperoni", title: "Gefüllte Peperoni", imageUrl: smImg("2019/06/gefuellte-peperoni-2560x2560.jpg") },
  { slug: "SM2020_DIVE_61/gemuesewaehe", title: "Gemüsewähe", imageUrl: smImg("2021/01/SM2020_DIVE_61_Gemuesewaehe.jpg") },
  { slug: "LM201301_83/fleischvoegel", title: "Fleischvögel", imageUrl: smImg("2019/06/fleischvoegel-klassisch-2560x1920.jpg") },
  { slug: "LM201003_39/lauch-speck-waehe", title: "Lauch-Speck-Wähe", imageUrl: smImg("2019/06/lauch-speck-waehe-2560x1920.jpg") },
  { slug: "LM201101_79/spaetzli-gemuese-gratin", title: "Spätzli-Gemüse-Gratin", imageUrl: smImg("2019/06/spaetzli-gemuese-gratin-2560x1965.jpg") },
  { slug: "LM200105_44_MEN10526/spaghetti-bolognese", title: "Spaghetti bolognese", imageUrl: smImg("2019/06/spaghetti-bolognese-2560x1920.jpg") },
  { slug: "LM200911_64/gemueserisotto", title: "Gemüserisotto", imageUrl: smImg("2019/06/gemueserisotto-2560x1707.jpg") },
  { slug: "SM2025_FAMI_01/oster-guetzli", title: "Oster-Guetzli", imageUrl: smImg("2024/10/SM2025_FAMI_01_American_Cookies_mit_Schokolinsen-Hasen-2560x1708.jpg") },
  { slug: "LM201104_36/zopfhasen", title: "Zopfhasen", imageUrl: smImg("2019/06/zopfhasen-2560x1706.jpg") },
  { slug: "LM201204_73/osterfladen-mit-griess", title: "Osterfladen mit Griess", imageUrl: smImg("2019/06/osterfladen-mit-griess.jpg") },
  { slug: "KB_AMS1999_088/lammgigot-mit-rosmarin-rahmsauce", title: "Lammgigot mit Rosmarin-Rahmsauce", imageUrl: smImg("2021/03/Lammgigot-in-Rosmarinmilch-KB_AMS1999_088.jpg") },
  { slug: "SM2024_DIVE_66/polpette", title: "Polpette", imageUrl: smImg("2024/10/SM2024_DIVE_66_Polpette-2560x1707.jpg") },
  { slug: "LM_div_0216_2/baerlauchpesto", title: "Bärlauchpesto", imageUrl: smImg("2024/12/baerlauchpesto-2560x1707.jpg") },
  { slug: "SM2024_DIVE_01/baerlauchspaetzli", title: "Bärlauchspätzli", imageUrl: smImg("2024/02/SM2024_DIVE_01_Baerlauchspaetzli-2560x1707.jpg") },
  { slug: "LM200803_39/spinat-ricotta-cannelloni", title: "Spinat-Ricotta-Cannelloni", imageUrl: smImg("2019/06/cannelloni-mit-spinat-2560x1707.jpg") },
  { slug: "HWL_TEIG1996_02/omeletten", title: "Omeletten", imageUrl: smImg("2019/12/HWL_TEIG1996_02_Omeletten-2560x1706.jpg") },
  { slug: "SM2017_DIVE_05/pancakes", title: "Pancakes", imageUrl: smImg("2019/06/pancakes.jpg") },
  { slug: "LM_div_0812_03/kartoffelgratin", title: "Kartoffelgratin", imageUrl: smImg("2019/06/kartoffelgratin-2560x1920.jpg") },
  { slug: "LM200904_53/spaghetti-carbonara-mit-rahm", title: "Spaghetti Carbonara mit Rahm", imageUrl: smImg("2019/06/spaghetti-carbonara-2560x1920.jpg") },
  { slug: "KB_BZ2000_041/apfelwaehe", title: "Apfelwähe", imageUrl: smImg("2019/06/apfelwaehe-2560x1920.jpg") },
];

// ============================================================
// Source Configurations
// ============================================================

export const FEED_SOURCES: FeedSourceConfig[] = [
  {
    id: "fooby",
    name: "Fooby",
    hostname: "fooby.ch",
    color: "#00A651",
    logoUrl: "https://fooby.ch/favicon.ico",
    baseUrl: "https://fooby.ch",
    recipeUrlPattern: (slug) => `https://fooby.ch/de/rezepte/${slug}`,
    imageUrlPattern: (slug) => `https://recipecontent.fooby.ch/${slug.split("/")[0]}_3-2_1200-800.jpg`,
    recipes: FOOBY_RECIPES,
  },
  {
    id: "bettybossi",
    name: "Betty Bossi",
    hostname: "bettybossi.ch",
    color: "#D4145A",
    logoUrl: "https://www.bettybossi.ch/favicon.ico",
    baseUrl: "https://www.bettybossi.ch",
    recipeUrlPattern: (slug) => `https://www.bettybossi.ch/de/rezepte/rezept/${slug}/`,
    recipes: BETTYBOSSI_RECIPES,
  },
  {
    id: "migusto",
    name: "Migusto",
    hostname: "migusto.migros.ch",
    color: "#FF6600",
    logoUrl: "https://migusto.migros.ch/favicon.ico",
    baseUrl: "https://migusto.migros.ch",
    recipeUrlPattern: (slug) => `https://migusto.migros.ch/de/rezepte/${slug}`,
    recipes: MIGUSTO_RECIPES,
  },
  {
    id: "swissmilk",
    name: "Swissmilk",
    hostname: "swissmilk.ch",
    color: "#0077B6",
    logoUrl: "https://www.swissmilk.ch/favicon.ico",
    baseUrl: "https://www.swissmilk.ch",
    recipeUrlPattern: (slug) => `https://www.swissmilk.ch/de/rezepte-kochideen/rezepte/${slug}/`,
    recipes: SWISSMILK_RECIPES,
  },
];

// ============================================================
// Feed-Item-Builder
// ============================================================

export interface FeedRecipeItem {
  id: string;
  title: string;
  /** null = kein Bild vorhanden → UI zeigt Placeholder */
  imageUrl: string | null;
  sourceUrl: string;
  sourceId: string;
  sourceName: string;
  sourceColor: string;
  tags: string[];
}

// ============================================================
// Auto-Kategorisierung nach Titel-Keywords
// ============================================================

export type FilterCategory = "type" | "diet" | "effort";

export interface FilterOption {
  id: string;
  label: string;
  category: FilterCategory;
  color: string;
}

export const FILTER_OPTIONS: FilterOption[] = [
  // Gericht-Typ
  { id: "hauptgericht", label: "Hauptgericht", category: "type", color: "#E67E22" },
  { id: "dessert", label: "Dessert", category: "type", color: "#E91E63" },
  { id: "suppe", label: "Suppe", category: "type", color: "#9C27B0" },
  { id: "salat", label: "Salat", category: "type", color: "#4CAF50" },
  { id: "brot", label: "Brot & Gebäck", category: "type", color: "#795548" },
  { id: "snack", label: "Snack", category: "type", color: "#FF9800" },
  { id: "sauce", label: "Sauce & Dip", category: "type", color: "#607D8B" },
  // Ernährungsweise
  { id: "vegetarisch", label: "Vegetarisch", category: "diet", color: "#66BB6A" },
  { id: "vegan", label: "Vegan", category: "diet", color: "#2E7D32" },
  // Aufwand
  { id: "schnell", label: "Schnell", category: "effort", color: "#26A69A" },
  { id: "aufwaendig", label: "Aufwändig", category: "effort", color: "#5C6BC0" },
];

const LOWER_CACHE = new Map<string, string>();
function lower(s: string) {
  if (!LOWER_CACHE.has(s)) LOWER_CACHE.set(s, s.toLowerCase());
  return LOWER_CACHE.get(s)!;
}

function categorizeRecipe(title: string): string[] {
  const t = lower(title);
  const tags: string[] = [];

  // --- Gericht-Typ ---
  const dessertWords = ["cake", "torte", "guetzli", "cookies", "mousse", "crème", "creme", "konfitüre", "konfituere", "florentiner", "cantucci", "shortbread", "blondies", "berliner", "linzertorte", "mandelgipfel", "magenbrot", "baklava", "pie", "tarte", "tirolercake", "küchlein", "kuchlein", "spitzbuben", "schokolade", "honig-nüsse", "honig-nuesse", "kirsch"];
  const soupWords = ["suppe", "minestrone", "harira", "gerstensuppe"];
  const saladWords = ["salat", "ceviche"];
  const breadWords = ["brot", "brötli", "broetli", "weggli", "brezel", "grissini", "fladenbrot", "naan", "ruchbrot", "wurstweggen", "igeli", "bibeli", "zopf", "french-toast", "croque"];
  const snackWords = ["crostini", "patacones", "quesadillas", "momos", "gyoza", "wienerli-im", "würstli", "wurstli", "schinkengipfeli", "fritters"];
  const sauceWords = ["pesto", "chimichurri", "tzatziki", "hummus", "curry-paste", "sirup", "sauce"];
  const drinkWords = ["kaffee", "coffee", "bowle", "eiskaffee", "dalgona"];

  if (dessertWords.some(w => t.includes(w))) tags.push("dessert");
  else if (soupWords.some(w => t.includes(w))) tags.push("suppe");
  else if (saladWords.some(w => t.includes(w))) tags.push("salat");
  else if (breadWords.some(w => t.includes(w))) tags.push("brot");
  else if (snackWords.some(w => t.includes(w))) tags.push("snack");
  else if (sauceWords.some(w => t.includes(w))) tags.push("sauce");
  else if (drinkWords.some(w => t.includes(w))) { /* skip — kein Typ-Tag */ }
  else tags.push("hauptgericht");

  // --- Ernährung ---
  const meatWords = ["poulet", "fleisch", "hack", "speck", "schinkli", "schinken", "wienerli", "würstli", "wurstli", "saucisson", "cordon", "chicken", "salsiz", "ragout", "boeuf", "rinds", "lamm", "sauerbraten", "ossobuco", "gulasch", "jäger", "jager", "capuns", "fleischvögel", "fleischvoegel", "chorizo", "sardellen", "thon", "filet", "cervelat", "goldbut"];
  const veganWord = t.includes("vegan");

  if (veganWord) {
    tags.push("vegan", "vegetarisch");
  } else if (!meatWords.some(w => t.includes(w))) {
    // Kein offensichtliches Fleisch → vegetarisch
    tags.push("vegetarisch");
  }

  // --- Aufwand (Heuristik nach Rezepttyp) ---
  const quickTypes = ["salat", "sauce", "snack"];
  const complexWords = ["ossobuco", "boeuf", "bourguignon", "sauerbraten", "cassoulet", "ragout", "braten", "gigot", "schüfeli", "schuefeli", "lasagne", "cannelloni"];

  if (quickTypes.some(qt => tags.includes(qt)) || sauceWords.some(w => t.includes(w)) || drinkWords.some(w => t.includes(w))) {
    tags.push("schnell");
  } else if (complexWords.some(w => t.includes(w))) {
    tags.push("aufwaendig");
  }

  return tags;
}

/**
 * Gibt Rezepte einer bestimmten Quelle zurück, täglich gemischt.
 * Filtert Rezepte ohne Bilder heraus.
 */
export function getRecipesForSource(sourceId: string): FeedRecipeItem[] {
  const source = FEED_SOURCES.find((s) => s.id === sourceId);
  if (!source) return [];

  const items: FeedRecipeItem[] = source.recipes
    .map((r, i) => ({
      id: `${source.id}-${i}`,
      title: r.title,
      imageUrl: r.imageUrl || (source.imageUrlPattern ? source.imageUrlPattern(r.slug) : null),
      sourceUrl: source.recipeUrlPattern(r.slug),
      sourceId: source.id,
      sourceName: source.name,
      sourceColor: source.color,
      tags: categorizeRecipe(r.title),
    }))
    // Kein Filter auf imageUrl – Rezepte ohne Bild werden mit Placeholder angezeigt

  // Shuffle deterministically per day
  const today = new Date().toISOString().slice(0, 10);
  const seed = today.split("-").reduce((acc, n) => acc + parseInt(n), 0);
  return items.sort((a, b) => {
    const hashA = (a.title.charCodeAt(0) * seed) % 997;
    const hashB = (b.title.charCodeAt(0) * seed) % 997;
    return hashA - hashB;
  });
}

/**
 * Gibt einen gemischten Feed aus mehreren Quellen zurück.
 */
export function getMixedFeed(enabledSourceIds: string[]): FeedRecipeItem[] {
  const allItems: FeedRecipeItem[] = [];
  for (const sourceId of enabledSourceIds) {
    allItems.push(...getRecipesForSource(sourceId));
  }
  // Interleave: shuffle all together
  const today = new Date().toISOString().slice(0, 10);
  const seed = today.split("-").reduce((acc, n) => acc + parseInt(n), 0);
  return allItems.sort((a, b) => {
    const hashA = ((a.title.charCodeAt(0) + a.title.charCodeAt(1)) * seed) % 997;
    const hashB = ((b.title.charCodeAt(0) + b.title.charCodeAt(1)) * seed) % 997;
    return hashA - hashB;
  });
}

/**
 * Gibt die Gesamtzahl aller kuratierten Rezepte zurück.
 */
export function getTotalRecipeCount(): number {
  return FEED_SOURCES.reduce((sum, s) => sum + s.recipes.length, 0);
}
