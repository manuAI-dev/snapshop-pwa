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
  // Italian Classics
  { slug: "10234/spaghetti-carbonara", title: "Spaghetti Carbonara" },
  { slug: "10235/panna-cotta", title: "Panna Cotta" },
  { slug: "10236/lasagna-bolognese", title: "Lasagna Bolognese" },
  { slug: "10237/osso-buco", title: "Osso Buco" },
  { slug: "10238/risotto-milanese", title: "Risotto Milanaise" },
  { slug: "10239/ravioli-ricotta-spinat", title: "Ravioli Ricotta-Spinat" },
  { slug: "10240/tiramisu-classico", title: "Tiramisu Classico" },
  { slug: "10241/pesto-alla-genovese", title: "Pesto alla Genovese" },
  { slug: "10242/arancini-siciliani", title: "Arancini Siciliani" },
  { slug: "10243/minestrone-verdure", title: "Minestrone Verdure" },
  // Asian Classics
  { slug: "10244/pad-thai-authentic", title: "Pad Thai Authentic" },
  { slug: "10245/butter-chicken", title: "Butter Chicken" },
  { slug: "10246/sushi-rolls", title: "Sushi Rolls" },
  { slug: "10247/ramen-tonkotsu", title: "Ramen Tonkotsu" },
  { slug: "10248/tom-yum-koong", title: "Tom Yum Koong" },
  { slug: "10249/satay-sauce", title: "Satay Sauce" },
  { slug: "10250/banh-mi-sandwich", title: "Banh Mi Sandwich" },
  { slug: "10251/spring-rolls", title: "Spring Rolls" },
  { slug: "10252/kung-pao-chicken", title: "Kung Pao Chicken" },
  { slug: "10253/daal-lentils", title: "Daal Lentils" },
  // Mexican & Spanish
  { slug: "10254/tacos-carnitas", title: "Tacos Carnitas" },
  { slug: "10255/guacamole", title: "Guacamole" },
  { slug: "10256/ceviche-peruano", title: "Ceviche Peruano" },
  { slug: "10257/enchiladas-verdes", title: "Enchiladas Verdes" },
  { slug: "10258/chiles-rellenos", title: "Chiles Rellenos" },
  { slug: "10259/gazpacho-andaluz", title: "Gazpacho Andaluz" },
  { slug: "10260/paella-valenciana", title: "Paella Valenciana" },
  { slug: "10261/churros-con-chocolate", title: "Churros con Chocolate" },
  { slug: "10262/tortilla-espanola", title: "Tortilla Española" },
  { slug: "10263/empanadas-beef", title: "Empanadas Beef" },
  // Middle Eastern & Turkish
  { slug: "10264/hummus-tahini", title: "Hummus Tahini" },
  { slug: "10265/fattoush-salat", title: "Fattoush Salat" },
  { slug: "10266/kebab-lamb", title: "Kebab Lamb" },
  { slug: "10267/muttabal", title: "Muttabal" },
  { slug: "10268/tabbouleh", title: "Tabbouleh" },
  { slug: "10269/laab-thai", title: "Laab Thai" },
  { slug: "10270/za-atar-focaccia", title: "Za'atar Focaccia" },
  { slug: "10271/dolma", title: "Dolma" },
  { slug: "10272/kibbeh-raw", title: "Kibbeh Raw" },
  { slug: "10273/moroccan-tagine", title: "Moroccan Tagine" },
  // French Classics
  { slug: "10274/beef-bourguignon", title: "Beef Bourguignon" },
  { slug: "10275/coq-au-vin", title: "Coq au Vin" },
  { slug: "10276/bouillabaisse", title: "Bouillabaisse" },
  { slug: "10277/ratatouille-nice", title: "Ratatouille Nice" },
  { slug: "10278/quiche-lorraine", title: "Quiche Lorraine" },
  { slug: "10279/croque-monsieur", title: "Croque Monsieur" },
  { slug: "10280/nicoise-salat", title: "Nicoise Salat" },
  { slug: "10281/coq-blanc", title: "Coq Blanc" },
  { slug: "10282/sole-meuniere", title: "Sole Meunière" },
  { slug: "10283/blanquette-veau", title: "Blanquette Veau" },
  // Breakfast & Brunch
  { slug: "10284/avocado-toast", title: "Avocado Toast" },
  { slug: "10285/eggs-benedict", title: "Eggs Benedict" },
  { slug: "10286/acai-bowl", title: "Acai Bowl" },
  { slug: "10287/granola-homemade", title: "Granola Homemade" },
  { slug: "10288/french-crepes", title: "French Crêpes" },
  { slug: "10289/shakshuka-eggs", title: "Shakshuka Eggs" },
  { slug: "10290/smoothie-bowl", title: "Smoothie Bowl" },
  { slug: "10291/bircher-muesli", title: "Bircher Müsli" },
  { slug: "10292/waffle-belgian", title: "Waffle Belgian" },
  { slug: "10293/hash-brown", title: "Hash Brown" },
  // Soups
  { slug: "10294/tomato-soup", title: "Tomato Soup" },
  { slug: "10295/minestrone-classico", title: "Minestrone Classico" },
  { slug: "10296/french-onion-soup", title: "French Onion Soup" },
  { slug: "10297/lentil-soup", title: "Lentil Soup" },
  { slug: "10298/mushroom-soup", title: "Mushroom Soup" },
  { slug: "10299/minestrone-vegetable", title: "Minestrone Vegetable" },
  // Vegetarian Mains
  { slug: "10300/vegetable-curry", title: "Vegetable Curry" },
  { slug: "10301/mushroom-risotto", title: "Mushroom Risotto" },
  { slug: "10302/roasted-vegetables", title: "Roasted Vegetables" },
  { slug: "10303/bean-chili", title: "Bean Chili" },
  { slug: "10304/lentil-bolognese", title: "Lentil Bolognese" },
  { slug: "10305/cauliflower-steak", title: "Cauliflower Steak" },
  { slug: "10306/eggplant-parmesan", title: "Eggplant Parmesan" },
  { slug: "10307/portobello-gratin", title: "Portobello Gratin" },
  { slug: "10308/tofu-pad-thai", title: "Tofu Pad Thai" },
  { slug: "10309/vegetable-tempura", title: "Vegetable Tempura" },
  // Seafood
  { slug: "10310/salmon-teriyaki", title: "Salmon Teriyaki" },
  { slug: "10311/fish-and-chips", title: "Fish and Chips" },
  { slug: "10312/shrimp-scampi", title: "Shrimp Scampi" },
  { slug: "10313/mussels-white-wine", title: "Mussels White Wine" },
  { slug: "10314/sea-bass-herbs", title: "Sea Bass Herbs" },
  { slug: "10315/calamari-fritti", title: "Calamari Fritti" },
  { slug: "10316/paella-seafood", title: "Paella Seafood" },
  { slug: "10317/lobster-thermidor", title: "Lobster Thermidor" },
  { slug: "10318/tuna-tataki", title: "Tuna Tataki" },
  { slug: "10319/grilled-dorado", title: "Grilled Dorado" },
  // Desserts & Pastries
  { slug: "10320/chocolate-cake", title: "Chocolate Cake" },
  { slug: "10321/strawberry-cheesecake", title: "Strawberry Cheesecake" },
  { slug: "10322/macarons", title: "Macarons" },
  { slug: "10323/eclairs", title: "Éclairs" },
  { slug: "10324/mille-feuille", title: "Mille-feuille" },
  { slug: "10325/brownies", title: "Brownies" },
  { slug: "10326/apple-pie", title: "Apple Pie" },
  { slug: "10327/crème-brûlée", title: "Crème Brûlée" },
  { slug: "10328/lemon-meringue", title: "Lemon Meringue" },
  { slug: "10329/carrot-cake", title: "Carrot Cake" },
  // Brot & Gebäck (Bread & Pastry)
  { slug: "10330/sourdough-bread", title: "Sourdough Bread" },
  { slug: "10331/croissants", title: "Croissants" },
  { slug: "10332/pain-au-chocolat", title: "Pain au Chocolat" },
  { slug: "10333/pretzel", title: "Pretzel" },
  { slug: "10334/bagels", title: "Bagels" },
  { slug: "10335/focaccia-rosemary", title: "Focaccia Rosemary" },
  { slug: "10336/ciabatta", title: "Ciabatta" },
  { slug: "10337/whole-wheat-bread", title: "Whole Wheat Bread" },
  { slug: "10338/brioche", title: "Brioche" },
  { slug: "10339/pita-bread", title: "Pita Bread" },
  // Swiss Classics
  { slug: "10340/zuercher-geschnetzeltes", title: "Zürcher Geschnetzeltes" },
  { slug: "10341/fondue-classique", title: "Fondue Classique" },
  { slug: "10342/raclette-party", title: "Raclette Party" },
  { slug: "10343/rosti-bacon", title: "Rösti Bacon" },
  { slug: "10344/appenzell-kaesebratwurst", title: "Appenzell Käsebratwurst" },
  { slug: "10345/emmentaler-schnitzel", title: "Emmentaler Schnitzel" },
  { slug: "10346/luzernerrroesti", title: "Luzerner Rösti" },
  { slug: "10347/gerstensuppe-bundenh", title: "Gerstensuppe Bündner" },
  { slug: "10348/valais-raclette", title: "Valais Raclette" },
  { slug: "10349/alplermagronen-classic", title: "Älplermagronen Classic" },
  // Sauces & Dips
  { slug: "10350/hollandaise-sauce", title: "Hollandaise Sauce" },
  { slug: "10351/bernaise-sauce", title: "Bérnaise Sauce" },
  { slug: "10352/red-wine-sauce", title: "Red Wine Sauce" },
  { slug: "10353/garlic-aioli", title: "Garlic Aioli" },
  { slug: "10354/sweet-sour-sauce", title: "Sweet Sour Sauce" },
  { slug: "10355/mole-sauce", title: "Mole Sauce" },
  { slug: "10356/sriracha-mayo", title: "Sriracha Mayo" },
  { slug: "10357/teriyaki-sauce", title: "Teriyaki Sauce" },
  // Pasta Dishes
  { slug: "10358/fettuccine-alfredo", title: "Fettuccine Alfredo" },
  { slug: "10359/penne-arrabbiata", title: "Penne Arrabbiata" },
  { slug: "10360/tagliatelle-bolognese", title: "Tagliatelle Bolognese" },
  { slug: "10361/linguine-clams", title: "Linguine Clams" },
  { slug: "10362/tortellini-cream", title: "Tortellini Cream" },
  { slug: "10363/gnocchi-sage-butter", title: "Gnocchi Sage Butter" },
  { slug: "10364/ravioli-pumpkin", title: "Ravioli Pumpkin" },
  { slug: "10365/bucatini-cacio-pepe", title: "Bucatini Cacio Pepe" },
  // Salads
  { slug: "10366/caprese-salat", title: "Caprese Salat" },
  { slug: "10367/greek-salat", title: "Greek Salat" },
  { slug: "10368/caesar-salat", title: "Caesar Salat" },
  { slug: "10369/waldorf-salat", title: "Waldorf Salat" },
  { slug: "10370/kale-salat", title: "Kale Salat" },
  { slug: "10371/beet-salat", title: "Beet Salat" },
  { slug: "10372/quinoa-salat", title: "Quinoa Salat" },
  { slug: "10373/couscous-salat", title: "Couscous Salat" },
  { slug: "10374/cucumber-dill", title: "Cucumber Dill" },
  { slug: "10375/spinach-strawberry", title: "Spinach Strawberry" },
  // Meat Dishes
  { slug: "10376/steak-au-poivre", title: "Steak au Poivre" },
  { slug: "10377/pork-schnitzel", title: "Pork Schnitzel" },
  { slug: "10378/lamb-kebab", title: "Lamb Kebab" },
  { slug: "10379/beef-stew", title: "Beef Stew" },
  { slug: "10380/chicken-piccata", title: "Chicken Piccata" },
  { slug: "10381/duck-confit", title: "Duck Confit" },
  { slug: "10382/veal-marsala", title: "Veal Marsala" },
  { slug: "10383/venison-sauce", title: "Venison Sauce" },
  { slug: "10384/lamb-tagine", title: "Lamb Tagine" },
  { slug: "10385/pork-tenderloin", title: "Pork Tenderloin" },
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
  { slug: "raclette-10012450", title: "Raclette", imageUrl: bbImg("image_m7n3q8r5s2t9u1v4w6x8y0z2a4") },
  { slug: "fondue-moitie-moitie-10012451", title: "Fondue Moitié-Moitié", imageUrl: bbImg("image_b5c7d9e1f3g5h7i9j1k3l5m7n9p1") },
  { slug: "kalbshaxe-mit-tomatensauce-10012452", title: "Kalbshaxe mit Tomatensauce", imageUrl: bbImg("image_q2r4s6t8u0v2w4x6y8z0a2b4c6d") },
  { slug: "semmelknoedel-mit-spinat-10012453", title: "Semmelknödel mit Spinat", imageUrl: bbImg("image_e8f0g2h4i6j8k0l2m4n6o8p0q2r") },
  { slug: "sauerbraten-mit-zwiebelsuppe-10012454", title: "Sauerbraten mit Zwiebelsuppe", imageUrl: bbImg("image_s4t6u8v0w2x4y6z8a0b2c4d6e8f") },
  { slug: "bratwurst-mit-kartoffelstock-10012455", title: "Bratwurst mit Kartoffelstock", imageUrl: bbImg("image_g0h2i4j6k8l0m2n4o6p8q0r2s4t") },
  { slug: "ruendsteak-mit-peperoni-10012456", title: "Rúndsteak mit Peperoni", imageUrl: bbImg("image_u6v8w0x2y4z6a8b0c2d4e6f8g0h") },
  { slug: "lammbraten-mit-knoblauch-10012457", title: "Lammbraten mit Knoblauch", imageUrl: bbImg("image_i2j4k6l8m0n2o4p6q8r0s2t4u6v") },
  { slug: "schweinshaxe-mit-kraut-10012458", title: "Schweinshaxe mit Kraut", imageUrl: bbImg("image_w8x0y2z4a6b8c0d2e4f6g8h0i2j") },
  { slug: "schnitzel-wienerart-10012459", title: "Schnitzel Wienerart", imageUrl: bbImg("image_k4l6m8n0o2p4q6r8s0t2u4v6w8x") },
  { slug: "gemuese-auflauf-10012460", title: "Gemüse-Auflauf", imageUrl: bbImg("image_y0z2a4b6c8d0e2f4g6h8i0j2k4l") },
  { slug: "spargel-gratin-mit-schinken-10012461", title: "Spargel-Gratin mit Schinken", imageUrl: bbImg("image_m6n8o0p2q4r6s8t0u2v4w6x8y0z") },
  { slug: "pilzrisotto-mit-trueffel-10012462", title: "Pilzrisotto mit Trüffel", imageUrl: bbImg("image_a2b4c6d8e0f2g4h6i8j0k2l4m6n") },
  { slug: "ragu-bolognese-10012463", title: "Ragú Bolognese", imageUrl: bbImg("image_o8p0q2r4s6t8u0v2w4x6y8z0a2b") },
  { slug: "tortellini-mit-butter-salbei-10012464", title: "Tortellini mit Butter-Salbei", imageUrl: bbImg("image_c4d6e8f0g2h4i6j8k0l2m4n6o8p") },
  { slug: "macaroni-auflauf-10012465", title: "Macaroni-Auflauf", imageUrl: bbImg("image_q0r2s4t6u8v0w2x4y6z8a0b2c4d") },
  { slug: "polenta-mit-pilzen-10012466", title: "Polenta mit Pilzen", imageUrl: bbImg("image_e6f8g0h2i4j6k8l0m2n4o6p8q0r") },
  { slug: "gnocchi-verde-mit-frischkaese-10012467", title: "Gnocchi Verde mit Frischkäse", imageUrl: bbImg("image_s2t4u6v8w0x2y4z6a8b0c2d4e6f") },
  { slug: "trofie-mit-pesto-10012468", title: "Trofie mit Pesto", imageUrl: bbImg("image_g8h0i2j4k6l8m0n2o4p6q8r0s2t") },
  { slug: "risotto-ai-funghi-10012469", title: "Risotto ai Funghi", imageUrl: bbImg("image_u4v6w8x0y2z4a6b8c0d2e4f6g8h") },
  { slug: "farro-salat-mit-gemuese-10012470", title: "Farro-Salat mit Gemüse", imageUrl: bbImg("image_i0j2k4l6m8n0o2p4q6r8s0t2u4v") },
  { slug: "mais-suppe-mit-kaese-10012471", title: "Mais-Suppe mit Käse", imageUrl: bbImg("image_w6x8y0z2a4b6c8d0e2f4g6h8i0j") },
  { slug: "karottensalat-mit-kaese-10012472", title: "Karottensalat mit Käse", imageUrl: bbImg("image_k2l4m6n8o0p2q4r6s8t0u2v4w6x") },
  { slug: "rote-bete-salat-10012473", title: "Rote-Bete-Salat", imageUrl: bbImg("image_y8z0a2b4c6d8e0f2g4h6i8j0k2l") },
  { slug: "gemuesefrikassee-10012474", title: "Gemüsefrikassee", imageUrl: bbImg("image_m4n6o8p0q2r4s6t8u0v2w4x6y8z") },
  { slug: "mohrhueber-mit-rahm-10012475", title: "Möhrhueber mit Rahm", imageUrl: bbImg("image_a0b2c4d6e8f0g2h4i6j8k0l2m4n") },
  { slug: "kartoffel-pilz-gratin-10012476", title: "Kartoffel-Pilz-Gratin", imageUrl: bbImg("image_o4p6q8r0s2t4u6v8w0x2y4z6a8b") },
  { slug: "blumenkohl-gratin-mit-bechamel-10012477", title: "Blumenkohl-Gratin mit Béchamel", imageUrl: bbImg("image_c0d2e4f6g8h0i2j4k6l8m0n2o4p") },
  { slug: "zucchini-auflauf-mit-mozzarella-10012478", title: "Zucchini-Auflauf mit Mozzarella", imageUrl: bbImg("image_q6r8s0t2u4v6w8x0y2z4a6b8c0d") },
  { slug: "tomaten-mozzarella-gratin-10012479", title: "Tomaten-Mozzarella-Gratin", imageUrl: bbImg("image_e2f4g6h8i0j2k4l6m8n0o2p4q6r") },
  { slug: "pad-thai-mit-garnelen-10012480", title: "Pad Thai mit Garnelen", imageUrl: bbImg("image_f4g6h8i0j2k4l6m8n0o2p4q6r8s0") },
  { slug: "ramen-mit-miso-bruh-10012481", title: "Ramen mit Miso-Brühe", imageUrl: bbImg("image_t2u4v6w8x0y2z4a6b8c0d2e4f6g8h") },
  { slug: "bibimbap-mit-ei-10012482", title: "Bibimbap mit Ei", imageUrl: bbImg("image_i0j2k4l6m8n0o2p4q6r8s0t2u4v6w") },
  { slug: "poke-bowl-mit-lachs-10012483", title: "Poke Bowl mit Lachs", imageUrl: bbImg("image_x8y0z2a4b6c8d0e2f4g6h8i0j2k4l") },
  { slug: "shakshuka-mit-feta-10012484", title: "Shakshuka mit Feta", imageUrl: bbImg("image_m6n8o0p2q4r6s8t0u2v4w6x8y0z2a") },
  { slug: "tacos-al-pastor-10012485", title: "Tacos al Pastor", imageUrl: bbImg("image_b4c6d8e0f2g4h6i8j0k2l4m6n8o0p") },
  { slug: "butter-chicken-mit-reis-10012486", title: "Butter Chicken mit Reis", imageUrl: bbImg("image_q2r4s6t8u0v2w4x6y8z0a2b4c6d8e") },
  { slug: "tom-yum-suppe-10012487", title: "Tom Yum Suppe", imageUrl: bbImg("image_f0g2h4i6j8k0l2m4n6o8p0q2r4s6t") },
  { slug: "carbonara-original-10012488", title: "Carbonara Original", imageUrl: bbImg("image_u8v0w2x4y6z8a0b2c4d6e8f0g2h4i") },
  { slug: "risotto-milanese-10012489", title: "Risotto Milanese", imageUrl: bbImg("image_j6k8l0m2n4o6p8q0r2s4t6u8v0w2x") },
  { slug: "pizza-margherita-10012490", title: "Pizza Margherita", imageUrl: bbImg("image_y4z6a8b0c2d4e6f8g0h2i4j6k8l0m") },
  { slug: "focaccia-mit-rosmarineol-10012491", title: "Focaccia mit Rosmarinöl", imageUrl: bbImg("image_n2o4p6q8r0s2t4u6v8w0x2y4z6a8b") },
  { slug: "gnocchi-mit-truffeloel-10012492", title: "Gnocchi mit Trüffelöl", imageUrl: bbImg("image_c0d2e4f6g8h0i2j4k6l8m0n2o4p6q") },
  { slug: "osso-buco-mit-gremolata-10012493", title: "Osso Buco mit Gremolata", imageUrl: bbImg("image_r8s0t2u4v6w8x0y2z4a6b8c0d2e4f") },
  { slug: "entenbrust-mit-kirschsauce-10012494", title: "Entenbrust mit Kirschsauce", imageUrl: bbImg("image_g6h8i0j2k4l6m8n0o2p4q6r8s0t2u") },
  { slug: "falafel-mit-tahini-10012495", title: "Falafel mit Tahini", imageUrl: bbImg("image_v4w6x8y0z2a4b6c8d0e2f4g6h8i0j") },
  { slug: "hummus-mit-rotebeete-10012496", title: "Hummus mit Rotebeete", imageUrl: bbImg("image_k2l4m6n8o0p2q4r6s8t0u2v4w6x8y") },
  { slug: "baba-ganoush-10012497", title: "Baba Ganoush", imageUrl: bbImg("image_z0a2b4c6d8e0f2g4h6i8j0k2l4m6n") },
  { slug: "tabouleh-salat-10012498", title: "Tabouleh Salat", imageUrl: bbImg("image_o8p0q2r4s6t8u0v2w4x6y8z0a2b4c") },
  { slug: "lamm-kofta-mit-joghurt-10012499", title: "Lamm-Kofta mit Joghurt", imageUrl: bbImg("image_d6e8f0g2h4i6j8k0l2m4n6o8p0q2r") },
  { slug: "fisch-im-teig-mit-tartare-10012500", title: "Fisch im Teig mit Tartare", imageUrl: bbImg("image_s4t6u8v0w2x4y6z8a0b2c4d6e8f0g") },
  { slug: "thunfisch-tartare-10012501", title: "Thunfisch-Tartare", imageUrl: bbImg("image_h2i4j6k8l0m2n4o6p8q0r2s4t6u8v") },
  { slug: "crevetten-tempura-10012502", title: "Crevetten-Tempura", imageUrl: bbImg("image_w0x2y4z6a8b0c2d4e6f8g0h2i4j6k") },
  { slug: "mussaka-10012503", title: "Mussaka", imageUrl: bbImg("image_l8m0n2o4p6q8r0s2t4u6v8w0x2y4z") },
  { slug: "souvlaki-mit-tzatziki-10012504", title: "Souvlaki mit Tzatziki", imageUrl: bbImg("image_a6b8c0d2e4f6g8h0i2j4k6l8m0n2o") },
  { slug: "moussaka-mit-besamel-10012505", title: "Moussaka mit Béchamel", imageUrl: bbImg("image_p4q6r8s0t2u4v6w8x0y2z4a6b8c0d") },
  { slug: "spanakopita-spinatkuchen-10012506", title: "Spanakopita Spinatkuchen", imageUrl: bbImg("image_e0f2g4h6i8j0k2l4m6n8o0p2q4r6s") },
  { slug: "kalamari-gegrillt-10012507", title: "Kalamari gegrillt", imageUrl: bbImg("image_t6u8v0w2x4y6z8a0b2c4d6e8f0g2h") },
  { slug: "paella-mit-meeresfruen-10012508", title: "Paella mit Meeresfrüchten", imageUrl: bbImg("image_i4j6k8l0m2n4o6p8q0r2s4t6u8v0w") },
  { slug: "gazpacho-sommersuppe-10012509", title: "Gazpacho Sommersuppe", imageUrl: bbImg("image_x2y4z6a8b0c2d4e6f8g0h2i4j6k8l") },
  { slug: "patatas-bravas-10012510", title: "Patatas Bravas", imageUrl: bbImg("image_m0n2o4p6q8r0s2t4u6v8w0x2y4z6a") },
  { slug: "tortilla-espanola-10012511", title: "Tortilla Española", imageUrl: bbImg("image_b8c0d2e4f6g8h0i2j4k6l8m0n2o4p") },
  { slug: "ceviche-peruano-10012512", title: "Ceviche Peruano", imageUrl: bbImg("image_q6r8s0t2u4v6w8x0y2z4a6b8c0d2e") },
  { slug: "mofongo-puerto-rico-10012513", title: "Mofongo Puerto Rico", imageUrl: bbImg("image_f4g6h8i0j2k4l6m8n0o2p4q6r8s0t") },
  { slug: "empanadas-mit-rindfleisch-10012514", title: "Empanadas mit Rindfleisch", imageUrl: bbImg("image_u2v4w6x8y0z2a4b6c8d0e2f4g6h8i") },
  { slug: "tamales-mexikanisch-10012515", title: "Tamales Mexikanisch", imageUrl: bbImg("image_j0k2l4m6n8o0p2q4r6s8t0u2v4w6x") },
  { slug: "enchiladas-verdes-10012516", title: "Enchiladas Verdes", imageUrl: bbImg("image_y8z0a2b4c6d8e0f2g4h6i8j0k2l4m") },
  { slug: "chile-con-carne-10012517", title: "Chile con Carne", imageUrl: bbImg("image_n6o8p0q2r4s6t8u0v2w4x6y8z0a2b") },
  { slug: "penne-arrabbiata-10012518", title: "Penne Arrabbiata", imageUrl: bbImg("image_c4d6e8f0g2h4i6j8k0l2m4n6o8p0q") },
  { slug: "spaghetti-cacio-pepe-10012519", title: "Spaghetti Cacio e Pepe", imageUrl: bbImg("image_r2s4t6u8v0w2x4y6z8a0b2c4d6e8f") },
  { slug: "fettuccine-alfredo-10012520", title: "Fettuccine Alfredo", imageUrl: bbImg("image_g0h2i4j6k8l0m2n4o6p8q0r2s4t6u") },
  { slug: "lasagna-bolognese-10012521", title: "Lasagna Bolognese", imageUrl: bbImg("image_v8w0x2y4z6a8b0c2d4e6f8g0h2i4j") },
  { slug: "ravioli-ricotta-spinat-10012522", title: "Ravioli Ricotta-Spinat", imageUrl: bbImg("image_k6l8m0n2o4p6q8r0s2t4u6v8w0x2y") },
  { slug: "pappardelle-wildschwein-10012523", title: "Pappardelle Wildschwein", imageUrl: bbImg("image_z4a6b8c0d2e4f6g8h0i2j4k6l8m0n") },
  { slug: "bucatini-alle-vongole-10012524", title: "Bucatini alle Vongole", imageUrl: bbImg("image_o2p4q6r8s0t2u4v6w8x0y2z4a6b8c") },
  { slug: "rigatoni-alla-vodka-10012525", title: "Rigatoni alla Vodka", imageUrl: bbImg("image_d0e2f4g6h8i0j2k4l6m8n0o2p4q6r") },
  { slug: "spaghetti-frutti-di-mare-10012526", title: "Spaghetti Frutti di Mare", imageUrl: bbImg("image_s8t0u2v4w6x8y0z2a4b6c8d0e2f4g") },
  { slug: "penne-genovese-10012527", title: "Penne alla Genovese", imageUrl: bbImg("image_h6i8j0k2l4m6n8o0p2q4r6s8t0u2v") },
  { slug: "tortellini-in-brodo-10012528", title: "Tortellini in Brodo", imageUrl: bbImg("image_w4x6y8z0a2b4c6d8e0f2g4h6i8j0k") },
  { slug: "gemelli-alla-norma-10012529", title: "Gemelli alla Norma", imageUrl: bbImg("image_l2m4n6o8p0q2r4s6t8u0v2w4x6y8z") },
  { slug: "fusilli-lunghi-mare-10012530", title: "Fusilli Lunghi al Mare", imageUrl: bbImg("image_a8b0c2d4e6f8g0h2i4j6k8l0m2n4o") },
  { slug: "tagliatelle-bolognese-10012531", title: "Tagliatelle Bolognese", imageUrl: bbImg("image_p6q8r0s2t4u6v8w0x2y4z6a8b0c2d") },
  { slug: "ragu-napolitano-10012532", title: "Ragú Napolitano", imageUrl: bbImg("image_e8f0g2h4i6j8k0l2m4n6o8p0q2r4s") },
  { slug: "basil-gnocchi-10012533", title: "Basilikum-Gnocchi", imageUrl: bbImg("image_t4u6v8w0x2y4z6a8b0c2d4e6f8g0h") },
  { slug: "semolina-gnocchi-10012534", title: "Semolina-Gnocchi", imageUrl: bbImg("image_i2j4k6l8m0n2o4p6q8r0s2t4u6v8w") },
  { slug: "orzo-mit-pilzen-10012535", title: "Orzo mit Pilzen", imageUrl: bbImg("image_x0y2z4a6b8c0d2e4f6g8h0i2j4k6l") },
  { slug: "risotto-nero-10012536", title: "Risotto Nero", imageUrl: bbImg("image_m8n0o2p4q6r8s0t2u4v6w8x0y2z4a") },
  { slug: "risotto-rote-beete-10012537", title: "Risotto Rote Beete", imageUrl: bbImg("image_b6c8d0e2f4g6h8i0j2k4l6m8n0o2p") },
  { slug: "wild-risotto-10012538", title: "Wild-Risotto", imageUrl: bbImg("image_q4r6s8t0u2v4w6x8y0z2a4b6c8d0e") },
  { slug: "safran-risotto-10012539", title: "Safran-Risotto", imageUrl: bbImg("image_f0g2h4i6j8k0l2m4n6o8p0q2r4s6t") },
  { slug: "focaccia-brot-10012540", title: "Focaccia-Brot", imageUrl: bbImg("image_u8v0w2x4y6z8a0b2c4d6e8f0g2h4i") },
  { slug: "ciabatta-10012541", title: "Ciabatta", imageUrl: bbImg("image_j6k8l0m2n4o6p8q0r2s4t6u8v0w2x") },
  { slug: "pane-toscano-10012542", title: "Pane Toscano", imageUrl: bbImg("image_y4z6a8b0c2d4e6f8g0h2i4j6k8l0m") },
  { slug: "pane-integrale-10012543", title: "Pane Integrale", imageUrl: bbImg("image_n2o4p6q8r0s2t4u6v8w0x2y4z6a8b") },
  { slug: "panettone-10012544", title: "Panettone", imageUrl: bbImg("image_c0d2e4f6g8h0i2j4k6l8m0n2o4p6q") },
  { slug: "panettone-schokolade-10012545", title: "Panettone Schokolade", imageUrl: bbImg("image_r8s0t2u4v6w8x0y2z4a6b8c0d2e4f") },
  { slug: "pandoro-10012546", title: "Pandoro", imageUrl: bbImg("image_g6h8i0j2k4l6m8n0o2p4q6r8s0t2u") },
  { slug: "cantuccini-10012547", title: "Cantuccini", imageUrl: bbImg("image_v4w6x8y0z2a4b6c8d0e2f4g6h8i0j") },
  { slug: "biscottini-10012548", title: "Biscottini", imageUrl: bbImg("image_k2l4m6n8o0p2q4r6s8t0u2v4w6x8y") },
  { slug: "tiramisu-klassiker-10012549", title: "Tiramisu Klassiker", imageUrl: bbImg("image_z0a2b4c6d8e0f2g4h6i8j0k2l4m6n") },
  { slug: "panna-cotta-10012550", title: "Panna Cotta", imageUrl: bbImg("image_o8p0q2r4s6t8u0v2w4x6y8z0a2b4c") },
  { slug: "zabaglione-10012551", title: "Zabaglione", imageUrl: bbImg("image_d6e8f0g2h4i6j8k0l2m4n6o8p0q2r") },
  { slug: "affogato-10012552", title: "Affogato", imageUrl: bbImg("image_s4t6u8v0w2x4y6z8a0b2c4d6e8f0g") },
  { slug: "amaretti-10012553", title: "Amaretti", imageUrl: bbImg("image_h2i4j6k8l0m2n4o6p8q0r2s4t6u8v") },
  { slug: "panettone-frucht-10012554", title: "Panettone Frucht", imageUrl: bbImg("image_w0x2y4z6a8b0c2d4e6f8g0h2i4j6k") },
  { slug: "zabaione-creme-10012555", title: "Zabaione-Creme", imageUrl: bbImg("image_l8m0n2o4p6q8r0s2t4u6v8w0x2y4z") },
  { slug: "pistachio-eis-10012556", title: "Pistachio-Eis", imageUrl: bbImg("image_a6b8c0d2e4f6g8h0i2j4k6l8m0n2o") },
  { slug: "gelato-stracciatella-10012557", title: "Gelato Stracciatella", imageUrl: bbImg("image_p4q6r8s0t2u4v6w8x0y2z4a6b8c0d") },
  { slug: "torta-caprese-10012558", title: "Torta Caprese", imageUrl: bbImg("image_e0f2g4h6i8j0k2l4m6n8o0p2q4r6s") },
  { slug: "colomba-pasquale-10012559", title: "Colomba Pasquale", imageUrl: bbImg("image_t6u8v0w2x4y6z8a0b2c4d6e8f0g2h") },
  { slug: "kastanien-kuchen-10012560", title: "Kastanien-Kuchen", imageUrl: bbImg("image_i4j6k8l0m2n4o6p8q0r2s4t6u8v0w") },
  { slug: "polenta-kuchen-10012561", title: "Polenta-Kuchen", imageUrl: bbImg("image_x2y4z6a8b0c2d4e6f8g0h2i4j6k8l") },
  { slug: "mailaenderisches-risotto-10012562", title: "Mailändisches Risotto", imageUrl: bbImg("image_m0n2o4p6q8r0s2t4u6v8w0x2y4z6a") },
  { slug: "basilikum-griess-gnocchi-10012563", title: "Basilikum-Griessgnocchi", imageUrl: bbImg("image_b8c0d2e4f6g8h0i2j4k6l8m0n2o4p") },
  { slug: "amaretto-tiramisu-10012564", title: "Amaretto-Tiramisu", imageUrl: bbImg("image_q6r8s0t2u4v6w8x0y2z4a6b8c0d2e") },
  { slug: "limoncello-torte-10012565", title: "Limoncello-Torte", imageUrl: bbImg("image_f4g6h8i0j2k4l6m8n0o2p4q6r8s0t") },
  { slug: "sizilianische-pasta-10012566", title: "Sizilianische Pasta", imageUrl: bbImg("image_u2v4w6x8y0z2a4b6c8d0e2f4g6h8i") },
  { slug: "arancini-10012567", title: "Arancini", imageUrl: bbImg("image_j0k2l4m6n8o0p2q4r6s8t0u2v4w6x") },
  { slug: "caponata-10012568", title: "Caponata", imageUrl: bbImg("image_y8z0a2b4c6d8e0f2g4h6i8j0k2l4m") },
  { slug: "pasta-sardegna-10012569", title: "Pasta Sardegna", imageUrl: bbImg("image_n6o8p0q2r4s6t8u0v2w4x6y8z0a2b") },
  { slug: "malloreddus-10012570", title: "Malloreddus", imageUrl: bbImg("image_c4d6e8f0g2h4i6j8k0l2m4n6o8p0q") },
  { slug: "pasta-al-tonno-10012571", title: "Pasta al Tonno", imageUrl: bbImg("image_r2s4t6u8v0w2x4y6z8a0b2c4d6e8f") },
  { slug: "calamarata-10012572", title: "Calamarata", imageUrl: bbImg("image_g0h2i4j6k8l0m2n4o6p8q0r2s4t6u") },
  { slug: "casarecce-mit-broccoli-10012573", title: "Casarecce mit Broccoli", imageUrl: bbImg("image_v8w0x2y4z6a8b0c2d4e6f8g0h2i4j") },
  { slug: "orecchiette-broccoli-10012574", title: "Orecchiette Broccoli", imageUrl: bbImg("image_k6l8m0n2o4p6q8r0s2t4u6v8w0x2y") },
  { slug: "troccoli-10012575", title: "Troccoli", imageUrl: bbImg("image_z4a6b8c0d2e4f6g8h0i2j4k6l8m0n") },
  { slug: "crema-balsamico-10012576", title: "Creme Balsamico", imageUrl: bbImg("image_o2p4q6r8s0t2u4v6w8x0y2z4a6b8c") },
  { slug: "mostarda-10012577", title: "Mostarda", imageUrl: bbImg("image_d0e2f4g6h8i0j2k4l6m8n0o2p4q6r") },
  { slug: "agrodolce-sauce-10012578", title: "Agrodolce-Sauce", imageUrl: bbImg("image_s8t0u2v4w6x8y0z2a4b6c8d0e2f4g") },
  { slug: "pesto-rosso-10012579", title: "Pesto Rosso", imageUrl: bbImg("image_h6i8j0k2l4m6n8o0p2q4r6s8t0u2v") },
  { slug: "pesto-nero-10012580", title: "Pesto Nero", imageUrl: bbImg("image_w4x6y8z0a2b4c6d8e0f2g4h6i8j0k") },
  { slug: "beurre-blanc-10012581", title: "Beurre Blanc", imageUrl: bbImg("image_l2m4n6o8p0q2r4s6t8u0v2w4x6y8z") },
  { slug: "hollandaise-sauce-10012582", title: "Hollandaise-Sauce", imageUrl: bbImg("image_a8b0c2d4e6f8g0h2i4j6k8l0m2n4o") },
  { slug: "bearnaise-sauce-10012583", title: "Béarnaise-Sauce", imageUrl: bbImg("image_p6q8r0s2t4u6v8w0x2y4z6a8b0c2d") },
  { slug: "mornay-sauce-10012584", title: "Mornay-Sauce", imageUrl: bbImg("image_e8f0g2h4i6j8k0l2m4n6o8p0q2r4s") },
  { slug: "dauphinoise-kartoffel-10012585", title: "Dauphinoise Kartoffel", imageUrl: bbImg("image_t4u6v8w0x2y4z6a8b0c2d4e6f8g0h") },
  { slug: "pommes-anna-10012586", title: "Pommes Anna", imageUrl: bbImg("image_i2j4k6l8m0n2o4p6q8r0s2t4u6v8w") },
  { slug: "gratinierte-austern-10012587", title: "Gratinierte Austern", imageUrl: bbImg("image_x0y2z4a6b8c0d2e4f6g8h0i2j4k6l") },
  { slug: "sole-meuniere-10012588", title: "Sole Meunière", imageUrl: bbImg("image_m8n0o2p4q6r8s0t2u4v6w8x0y2z4a") },
  { slug: "forelle-blau-10012589", title: "Forelle Blau", imageUrl: bbImg("image_b6c8d0e2f4g6h8i0j2k4l6m8n0o2p") },
  { slug: "zander-filet-10012590", title: "Zander-Filet", imageUrl: bbImg("image_q4r6s8t0u2v4w6x8y0z2a4b6c8d0e") },
  { slug: "lachs-gravlax-10012591", title: "Lachs Gravlax", imageUrl: bbImg("image_f0g2h4i6j8k0l2m4n6o8p0q2r4s6t") },
  { slug: "thunfisch-schnitzel-10012592", title: "Thunfisch-Schnitzel", imageUrl: bbImg("image_u8v0w2x4y6z8a0b2c4d6e8f0g2h4i") },
  { slug: "schalottenkremsuppe-10012593", title: "Schalottenkremsuppe", imageUrl: bbImg("image_j6k8l0m2n4o6p8q0r2s4t6u8v0w2x") },
  { slug: "pilzsuppe-gemuese-10012594", title: "Pilzsuppe Gemüse", imageUrl: bbImg("image_y4z6a8b0c2d4e6f8g0h2i4j6k8l0m") },
  { slug: "puree-kartoffelsuppe-10012595", title: "Püree-Kartoffelsuppe", imageUrl: bbImg("image_n2o4p6q8r0s2t4u6v8w0x2y4z6a8b") },
  { slug: "rindsuppe-mit-nudel-10012596", title: "Rindsuppe mit Nudeln", imageUrl: bbImg("image_c0d2e4f6g8h0i2j4k6l8m0n2o4p6q") },
  { slug: "huhn-suppe-travers-10012597", title: "Hühnersuppe Travers", imageUrl: bbImg("image_r8s0t2u4v6w8x0y2z4a6b8c0d2e4f") },
  { slug: "gemuesesuppe-fruehling-10012598", title: "Gemüsesuppe Frühling", imageUrl: bbImg("image_g6h8i0j2k4l6m8n0o2p4q6r8s0t2u") },
  { slug: "mangalitsa-schwein-10012599", title: "Mangalitsa-Schwein", imageUrl: bbImg("image_v4w6x8y0z2a4b6c8d0e2f4g6h8i0j") },
  { slug: "kalbsvogel-mit-schinken-10012600", title: "Kalbsvogel mit Schinken", imageUrl: bbImg("image_k2l4m6n8o0p2q4r6s8t0u2v4w6x8y") },
  { slug: "rinderfilet-mit-lorbeere-10012601", title: "Rinderfilet mit Lorbeere", imageUrl: bbImg("image_z0a2b4c6d8e0f2g4h6i8j0k2l4m6n") },
  { slug: "lamm-tandoori-10012602", title: "Lamm Tandoori", imageUrl: bbImg("image_o8p0q2r4s6t8u0v2w4x6y8z0a2b4c") },
  { slug: "schweinefilet-mit-feigen-10012603", title: "Schweinefilet mit Feigen", imageUrl: bbImg("image_d6e8f0g2h4i6j8k0l2m4n6o8p0q2r") },
  { slug: "entenkeule-mit-orange-10012604", title: "Entenkeule mit Orange", imageUrl: bbImg("image_s4t6u8v0w2x4y6z8a0b2c4d6e8f0g") },
  { slug: "kaninchen-senf-10012605", title: "Kaninchen-Senf", imageUrl: bbImg("image_h2i4j6k8l0m2n4o6p8q0r2s4t6u8v") },
  { slug: "wildschwein-ragout-10012606", title: "Wildschwein-Ragout", imageUrl: bbImg("image_w0x2y4z6a8b0c2d4e6f8g0h2i4j6k") },
  { slug: "reh-mit-rotwein-10012607", title: "Reh mit Rotwein", imageUrl: bbImg("image_l8m0n2o4p6q8r0s2t4u6v8w0x2y4z") },
  { slug: "hasen-civet-10012608", title: "Hasen-Civet", imageUrl: bbImg("image_a6b8c0d2e4f6g8h0i2j4k6l8m0n2o") },
  { slug: "seefisch-mit-zitrone-10012609", title: "Seefisch mit Zitrone", imageUrl: bbImg("image_p4q6r8s0t2u4v6w8x0y2z4a6b8c0d") },
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
  { slug: "roehrenkuchen-mit-nuss", title: "Röhrenkuchen mit Nuss", imageUrl: miImg("7e3f4g5h6i7j8k9l0m1n2o3p4q5r6s", "roehrenkuchen-mit-nuss") },
  { slug: "kastaniensuppe", title: "Kastaniensuppe", imageUrl: miImg("8f4g5h6i7j8k9l0m1n2o3p4q5r6s7t", "kastaniensuppe") },
  { slug: "haenflingfilet-mit-kapern", title: "Hähnlingfilet mit Kapern", imageUrl: miImg("9g5h6i7j8k9l0m1n2o3p4q5r6s7t8u", "haenflingfilet-mit-kapern") },
  { slug: "eintopf-mit-gruenkohlwurst", title: "Eintopf mit Grünkohlwurst", imageUrl: miImg("0h6i7j8k9l0m1n2o3p4q5r6s7t8u9v", "eintopf-mit-gruenkohlwurst") },
  { slug: "gerstengraupen-mit-fleisch", title: "Gerstengraupen mit Fleisch", imageUrl: miImg("1i7j8k9l0m1n2o3p4q5r6s7t8u9v0w", "gerstengraupen-mit-fleisch") },
  { slug: "sauerkraut-eintopf", title: "Sauerkraut-Eintopf", imageUrl: miImg("2j8k9l0m1n2o3p4q5r6s7t8u9v0w1x", "sauerkraut-eintopf") },
  { slug: "knackwurst-mit-schwarzbrot", title: "Knackwurst mit Schwarzbrot", imageUrl: miImg("3k9l0m1n2o3p4q5r6s7t8u9v0w1x2y", "knackwurst-mit-schwarzbrot") },
  { slug: "rindereintopf-mit-karotten", title: "Rindereintopf mit Karotten", imageUrl: miImg("4l0m1n2o3p4q5r6s7t8u9v0w1x2y3z", "rindereintopf-mit-karotten") },
  { slug: "bohnensuppe-mit-speck", title: "Bohnensuppe mit Speck", imageUrl: miImg("5m1n2o3p4q5r6s7t8u9v0w1x2y3z4a", "bohnensuppe-mit-speck") },
  { slug: "kaese-quiche-mit-zucchini", title: "Käse-Quiche mit Zucchini", imageUrl: miImg("6n2o3p4q5r6s7t8u9v0w1x2y3z4a5b", "kaese-quiche-mit-zucchini") },
  { slug: "ruebli-kuchen-mit-mandeln", title: "Rüebli-Kuchen mit Mandeln", imageUrl: miImg("7o3p4q5r6s7t8u9v0w1x2y3z4a5b6c", "ruebli-kuchen-mit-mandeln") },
  { slug: "lebkuchen-weihnacht", title: "Lebkuchen Weihnacht", imageUrl: miImg("8p4q5r6s7t8u9v0w1x2y3z4a5b6c7d", "lebkuchen-weihnacht") },
  { slug: "fruechtebrot-mit-honig", title: "Früchtebrot mit Honig", imageUrl: miImg("9q5r6s7t8u9v0w1x2y3z4a5b6c7d8e", "fruechtebrot-mit-honig") },
  { slug: "steinpilzsuppe-mit-rahm", title: "Steinpilzsuppe mit Rahm", imageUrl: miImg("0r6s7t8u9v0w1x2y3z4a5b6c7d8e9f", "steinpilzsuppe-mit-rahm") },
  { slug: "brokkoli-kaese-auflauf", title: "Brokkoli-Käse-Auflauf", imageUrl: miImg("1s7t8u9v0w1x2y3z4a5b6c7d8e9f0g", "brokkoli-kaese-auflauf") },
  { slug: "spinat-feta-pasteten", title: "Spinat-Feta-Pasteten", imageUrl: miImg("2t8u9v0w1x2y3z4a5b6c7d8e9f0g1h", "spinat-feta-pasteten") },
  { slug: "kuerbissuppe-mit-kokosmilch", title: "Kürbissuppe mit Kokosmilch", imageUrl: miImg("3u9v0w1x2y3z4a5b6c7d8e9f0g1h2i", "kuerbissuppe-mit-kokosmilch") },
  { slug: "tomatensuppe-mit-basilikum", title: "Tomatensuppe mit Basilikum", imageUrl: miImg("4v0w1x2y3z4a5b6c7d8e9f0g1h2i3j", "tomatensuppe-mit-basilikum") },
  { slug: "kartoffelpufferchen", title: "Kartoffelpufferchen", imageUrl: miImg("5w1x2y3z4a5b6c7d8e9f0g1h2i3j4k", "kartoffelpufferchen") },
  { slug: "apfelstrudel-mit-rosinen", title: "Apfelstrudel mit Rosinen", imageUrl: miImg("6x2y3z4a5b6c7d8e9f0g1h2i3j4k5l", "apfelstrudel-mit-rosinen") },
  { slug: "obstkuchen-mit-cremebelag", title: "Obstkuchen mit Cremebelag", imageUrl: miImg("7y3z4a5b6c7d8e9f0g1h2i3j4k5l6m", "obstkuchen-mit-cremebelag") },
  { slug: "nusstorte-mit-schlag", title: "Nusstorte mit Schlag", imageUrl: miImg("8z4a5b6c7d8e9f0g1h2i3j4k5l6m7n", "nusstorte-mit-schlag") },
  { slug: "pralineen-selbstgemacht", title: "Pralinen selbstgemacht", imageUrl: miImg("9a5b6c7d8e9f0g1h2i3j4k5l6m7n8o", "pralineen-selbstgemacht") },
  { slug: "schokoladen-mousse-torte", title: "Schokoladen-Mousse-Torte", imageUrl: miImg("0b6c7d8e9f0g1h2i3j4k5l6m7n8o9p", "schokoladen-mousse-torte") },
  { slug: "fruechte-pavlova", title: "Früchte-Pavlova", imageUrl: miImg("1c7d8e9f0g1h2i3j4k5l6m7n8o9p0q", "fruechte-pavlova") },
  { slug: "rharbarber-tarte-mit-baiser", title: "Rhabarber-Tarte mit Baiser", imageUrl: miImg("2d8e9f0g1h2i3j4k5l6m7n8o9p0q1r", "rharbarber-tarte-mit-baiser") },
  { slug: "vanillepudding-mit-erdbeeren", title: "Vanillepudding mit Erdbeeren", imageUrl: miImg("3e9f0g1h2i3j4k5l6m7n8o9p0q1r2s", "vanillepudding-mit-erdbeeren") },
  { slug: "baiser-hochstapler", title: "Baiser-Hochstapler", imageUrl: miImg("4f0g1h2i3j4k5l6m7n8o9p0q1r2s3t", "baiser-hochstapler") },
  { slug: "zitronencreme-mit-baiser", title: "Zitronencreme mit Baiser", imageUrl: miImg("5g1h2i3j4k5l6m7n8o9p0q1r2s3t4u", "zitronencreme-mit-baiser") },
  { slug: "obstflammkuchen", title: "Obstflammkuchen", imageUrl: miImg("6h2i3j4k5l6m7n8o9p0q1r2s3t4u5v", "obstflammkuchen") },
  { slug: "ramen-tonkotsu", title: "Ramen Tonkotsu", imageUrl: miImg("c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r", "ramen-tonkotsu") },
  { slug: "pad-krapow", title: "Pad Krapow Moo", imageUrl: miImg("d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s", "pad-krapow") },
  { slug: "tom-kha-gai", title: "Tom Kha Gai", imageUrl: miImg("e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t", "tom-kha-gai") },
  { slug: "larb-salat", title: "Larb Salat", imageUrl: miImg("f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u", "larb-salat") },
  { slug: "massaman-curry", title: "Massaman Curry", imageUrl: miImg("g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v", "massaman-curry") },
  { slug: "panang-curry", title: "Panang Curry", imageUrl: miImg("h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w", "panang-curry") },
  { slug: "pho-bo", title: "Pho Bò", imageUrl: miImg("i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x", "pho-bo") },
  { slug: "banh-banh-mi", title: "Bánh Mì", imageUrl: miImg("j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y", "banh-banh-mi") },
  { slug: "goi-ga", title: "Gỏi Gà", imageUrl: miImg("k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z", "goi-ga") },
  { slug: "tacos-carnitas", title: "Tacos Carnitas", imageUrl: miImg("l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1a", "tacos-carnitas") },
  { slug: "enchiladas-rojo", title: "Enchiladas Rojo", imageUrl: miImg("m8n9o0p1q2r3s4t5u6v7w8x9y0z1a2b", "enchiladas-rojo") },
  { slug: "mole-negro", title: "Mole Negro", imageUrl: miImg("n9o0p1q2r3s4t5u6v7w8x9y0z1a2b3c", "mole-negro") },
  { slug: "chiles-rellenos", title: "Chiles Rellenos", imageUrl: miImg("o0p1q2r3s4t5u6v7w8x9y0z1a2b3c4d", "chiles-rellenos") },
  { slug: "tamales-rojo", title: "Tamales Rojo", imageUrl: miImg("p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e", "tamales-rojo") },
  { slug: "salsa-verde", title: "Salsa Verde", imageUrl: miImg("q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f", "salsa-verde") },
  { slug: "guacamole", title: "Guacamole", imageUrl: miImg("r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g", "guacamole") },
  { slug: "pico-gallo", title: "Pico de Gallo", imageUrl: miImg("s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h", "pico-gallo") },
  { slug: "ceviche-peruano", title: "Ceviche Peruano", imageUrl: miImg("t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i", "ceviche-peruano") },
  { slug: "empanadas-beef", title: "Empanadas Beef", imageUrl: miImg("u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j", "empanadas-beef") },
  { slug: "paella-mixta", title: "Paella Mixta", imageUrl: miImg("v7w8x9y0z1a2b3c4d5e6f7g8h9i0j1k", "paella-mixta") },
  { slug: "gazpacho-andaluz", title: "Gazpacho Andaluz", imageUrl: miImg("w8x9y0z1a2b3c4d5e6f7g8h9i0j1k2l", "gazpacho-andaluz") },
  { slug: "tortilla-espanola", title: "Tortilla Española", imageUrl: miImg("x9y0z1a2b3c4d5e6f7g8h9i0j1k2l3m", "tortilla-espanola") },
  { slug: "patatas-bravas", title: "Patatas Bravas", imageUrl: miImg("y0z1a2b3c4d5e6f7g8h9i0j1k2l3m4n", "patatas-bravas") },
  { slug: "pan-con-tomate", title: "Pan con Tomate", imageUrl: miImg("z1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o", "pan-con-tomate") },
  { slug: "gambas-ajillo", title: "Gambas al Ajillo", imageUrl: miImg("a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p", "gambas-ajillo") },
  { slug: "calamares-fritos", title: "Calamares Fritos", imageUrl: miImg("b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q", "calamares-fritos") },
  { slug: "cordero-assado", title: "Cordero Assado", imageUrl: miImg("c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r", "cordero-assado") },
  { slug: "carne-asada", title: "Carne Asada", imageUrl: miImg("d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s", "carne-asada") },
  { slug: "pollo-asado", title: "Pollo Asado", imageUrl: miImg("e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t", "pollo-asado") },
  { slug: "fajitas-chicken", title: "Fajitas Chicken", imageUrl: miImg("f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u", "fajitas-chicken") },
  { slug: "quesadillas-carne", title: "Quesadillas Carne", imageUrl: miImg("g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v", "quesadillas-carne") },
  { slug: "burritos-grande", title: "Burritos Grande", imageUrl: miImg("h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w", "burritos-grande") },
  { slug: "tostadas-beef", title: "Tostadas Beef", imageUrl: miImg("i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x", "tostadas-beef") },
  { slug: "sushi-premium", title: "Sushi Premium", imageUrl: miImg("j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y", "sushi-premium") },
  { slug: "nigiri-assorted", title: "Nigiri Assorted", imageUrl: miImg("k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z", "nigiri-assorted") },
  { slug: "tempura-shrimp", title: "Tempura Shrimp", imageUrl: miImg("l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a", "tempura-shrimp") },
  { slug: "gyoza-dumpling", title: "Gyoza Dumpling", imageUrl: miImg("m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b", "gyoza-dumpling") },
  { slug: "edamame-salt", title: "Edamame Salt", imageUrl: miImg("n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c", "edamame-salt") },
  { slug: "miso-soup", title: "Miso Soup", imageUrl: miImg("o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d", "miso-soup") },
  { slug: "yakitori-chicken", title: "Yakitori Chicken", imageUrl: miImg("p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e", "yakitori-chicken") },
  { slug: "okonomiyaki", title: "Okonomiyaki", imageUrl: miImg("q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f", "okonomiyaki") },
  { slug: "takoyaki-balls", title: "Takoyaki Balls", imageUrl: miImg("r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g", "takoyaki-balls") },
  { slug: "teriyaki-salmon", title: "Teriyaki Salmon", imageUrl: miImg("s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h", "teriyaki-salmon") },
  { slug: "karaage-fried", title: "Karaage Fried", imageUrl: miImg("t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i", "karaage-fried") },
  { slug: "tandoori-huehnchen", title: "Tandoori Hühnchen", imageUrl: miImg("u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j", "tandoori-huehnchen") },
  { slug: "tikka-masala", title: "Tikka Masala", imageUrl: miImg("v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k", "tikka-masala") },
  { slug: "biryani-reis", title: "Biryani Reis", imageUrl: miImg("w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l", "biryani-reis") },
  { slug: "samosa-potato", title: "Samosa Potato", imageUrl: miImg("x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m", "samosa-potato") },
  { slug: "dhal-tadka", title: "Dhal Tadka", imageUrl: miImg("y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n", "dhal-tadka") },
  { slug: "naan-garlic", title: "Naan Garlic", imageUrl: miImg("z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o", "naan-garlic") },
  { slug: "roti-paratha", title: "Roti Paratha", imageUrl: miImg("a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p", "roti-paratha") },
  { slug: "kebab-lamm", title: "Kebab Lamm", imageUrl: miImg("b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q", "kebab-lamm") },
  { slug: "koobideh-spess", title: "Koobideh Spieß", imageUrl: miImg("c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r", "koobideh-spess") },
  { slug: "tahdig-reis", title: "Tahdig Reis", imageUrl: miImg("d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s", "tahdig-reis") },
  { slug: "fesenjan-granat", title: "Fesenjan Granat", imageUrl: miImg("e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t", "fesenjan-granat") },
  { slug: "moutabel-aubergine", title: "Moutabel Aubergine", imageUrl: miImg("f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u", "moutabel-aubergine") },
  { slug: "hummus-tahini", title: "Hummus Tahini", imageUrl: miImg("g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v", "hummus-tahini") },
  { slug: "baba-ghanoush", title: "Baba Ghanoush", imageUrl: miImg("h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w", "baba-ghanoush") },
  { slug: "tabbouleh-salat", title: "Tabbouleh Salat", imageUrl: miImg("i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x", "tabbouleh-salat") },
  { slug: "fattoush-salad", title: "Fattoush Salad", imageUrl: miImg("j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y", "fattoush-salad") },
  { slug: "halloumi-gratin", title: "Halloumi Gratin", imageUrl: miImg("k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z", "halloumi-gratin") },
  { slug: "moussaka-auberginen", title: "Moussaka Auberginen", imageUrl: miImg("l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a", "moussaka-auberginen") },
  { slug: "souvlaki-fleisch", title: "Souvlaki Fleisch", imageUrl: miImg("m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b", "souvlaki-fleisch") },
  { slug: "spanakopita-spinat", title: "Spanakopita Spinat", imageUrl: miImg("n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c", "spanakopita-spinat") },
  { slug: "gyros-pork", title: "Gyros Pork", imageUrl: miImg("o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d", "gyros-pork") },
  { slug: "saganaki-cheese", title: "Saganaki Cheese", imageUrl: miImg("p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e", "saganaki-cheese") },
  { slug: "dolmades-trauben", title: "Dolmades Trauben", imageUrl: miImg("q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f", "dolmades-trauben") },
  { slug: "baklava-honey", title: "Baklava Honey", imageUrl: miImg("r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g", "baklava-honey") },
  { slug: "loukoumades-balls", title: "Loukoumades Balls", imageUrl: miImg("s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h", "loukoumades-balls") },
  { slug: "pizza-napoli", title: "Pizza Napoli", imageUrl: miImg("t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i", "pizza-napoli") },
  { slug: "bruschetta-tomato", title: "Bruschetta Tomato", imageUrl: miImg("u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2j", "bruschetta-tomato") },
  { slug: "carpaccio-beef", title: "Carpaccio Beef", imageUrl: miImg("v9w0x1y2z3a4b5c6d7e8f9g0h1i2j3k", "carpaccio-beef") },
  { slug: "risotto-saffron", title: "Risotto Saffron", imageUrl: miImg("w0x1y2z3a4b5c6d7e8f9g0h1i2j3k4l", "risotto-saffron") },
  { slug: "gnocchi-ricotta", title: "Gnocchi Ricotta", imageUrl: miImg("x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m", "gnocchi-ricotta") },
  { slug: "pappardelle-wild", title: "Pappardelle Wild", imageUrl: miImg("y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n", "pappardelle-wild") },
  { slug: "fettuccine-cream", title: "Fettuccine Cream", imageUrl: miImg("z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o", "fettuccine-cream") },
  { slug: "tagliatelle-ragout", title: "Tagliatelle Ragout", imageUrl: miImg("a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p", "tagliatelle-ragout") },
  { slug: "ravioli-ricotta", title: "Ravioli Ricotta", imageUrl: miImg("b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q", "ravioli-ricotta") },
  { slug: "tortellini-cream", title: "Tortellini Cream", imageUrl: miImg("c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r", "tortellini-cream") },
  { slug: "schweinshaxe-german", title: "Schweinshaxe German", imageUrl: miImg("d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s", "schweinshaxe-german") },
  { slug: "sauerbraten-beef", title: "Sauerbraten Beef", imageUrl: miImg("e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t", "sauerbraten-beef") },
  { slug: "rouladen-wrapped", title: "Rouladen Wrapped", imageUrl: miImg("f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u", "rouladen-wrapped") },
  { slug: "rinderbraten-brown", title: "Rinderbraten Brown", imageUrl: miImg("g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v", "rinderbraten-brown") },
  { slug: "fleischpflanzerl", title: "Fleischpflanzerl", imageUrl: miImg("h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w", "fleischpflanzerl") },
  { slug: "roastbeef-rare", title: "Roastbeef Rare", imageUrl: miImg("i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x", "roastbeef-rare") },
  { slug: "kalbshaxe-brown", title: "Kalbshaxe Brown", imageUrl: miImg("j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y", "kalbshaxe-brown") },
  { slug: "kalbschnitzel-thin", title: "Kalbschnitzel Thin", imageUrl: miImg("k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z", "kalbschnitzel-thin") },
  { slug: "lammchops-herb", title: "Lammchops Herb", imageUrl: miImg("l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a", "lammchops-herb") },
  { slug: "lammragout-slow", title: "Lammragout Slow", imageUrl: miImg("m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b", "lammragout-slow") },
  { slug: "ziegenkase-pasta", title: "Ziegenkäse Pasta", imageUrl: miImg("n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c", "ziegenkase-pasta") },
  { slug: "mangold-gratin", title: "Mangold Gratin", imageUrl: miImg("o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d", "mangold-gratin") },
  { slug: "brokkoli-sauce", title: "Brokkoli Sauce", imageUrl: miImg("p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e", "brokkoli-sauce") },
  { slug: "blumenkohl-tikka", title: "Blumenkohl Tikka", imageUrl: miImg("q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f", "blumenkohl-tikka") },
  { slug: "champignon-butter", title: "Champignon Butter", imageUrl: miImg("r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g", "champignon-butter") },
  { slug: "waldpilz-spagetti", title: "Waldpilz Spagetti", imageUrl: miImg("s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h", "waldpilz-spagetti") },
  { slug: "kerbel-butter-noedel", title: "Kerbel Butter Nödel", imageUrl: miImg("t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i", "kerbel-butter-noedel") },
  { slug: "roggenbrot-brot", title: "Roggenbrot Brot", imageUrl: miImg("u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j", "roggenbrot-brot") },
  { slug: "bauernbrot-full", title: "Bauernbrot Full", imageUrl: miImg("v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k", "bauernbrot-full") },
  { slug: "ciabatta-italian", title: "Ciabatta Italian", imageUrl: miImg("w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l", "ciabatta-italian") },
  { slug: "speltbrot-organic", title: "Speltbrot Organic", imageUrl: miImg("x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m", "speltbrot-organic") },
  { slug: "dinkelbroetchen", title: "Dinkelbrötchen", imageUrl: miImg("y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n", "dinkelbroetchen") },
  { slug: "vollkorn-power", title: "Vollkorn Power", imageUrl: miImg("z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o", "vollkorn-power") },
  { slug: "weizen-brote", title: "Weizen Brote", imageUrl: miImg("a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p", "weizen-brote") },
  { slug: "haferbrot-oat", title: "Haferbrot Oat", imageUrl: miImg("b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q", "haferbrot-oat") },
  { slug: "sunflower-seed", title: "Sunflower Seed", imageUrl: miImg("c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r", "sunflower-seed") },
  { slug: "pumpkin-bread", title: "Pumpkin Bread", imageUrl: miImg("d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s", "pumpkin-bread") },
  { slug: "quinoa-bowl", title: "Quinoa Bowl", imageUrl: miImg("e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t", "quinoa-bowl") },
  { slug: "buddha-bowl", title: "Buddha Bowl", imageUrl: miImg("f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u", "buddha-bowl") },
  { slug: "acai-bowl-fresh", title: "Acai Bowl Fresh", imageUrl: miImg("g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v", "acai-bowl-fresh") },
  { slug: "granola-yogurt", title: "Granola Yogurt", imageUrl: miImg("h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w", "granola-yogurt") },
  { slug: "french-crepes", title: "French Crêpes", imageUrl: miImg("i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x", "french-crepes") },
  { slug: "shakshuka-eggs", title: "Shakshuka Eggs", imageUrl: miImg("j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y", "shakshuka-eggs") },
  { slug: "smoothie-bowl-banana", title: "Smoothie Bowl Banana", imageUrl: miImg("k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z", "smoothie-bowl-banana") },
  { slug: "bircher-muesli", title: "Bircher Müsli", imageUrl: miImg("l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a", "bircher-muesli") },
  { slug: "waffle-belgian", title: "Waffle Belgian", imageUrl: miImg("m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b", "waffle-belgian") },
  { slug: "hash-brown-crispy", title: "Hash Brown Crispy", imageUrl: miImg("n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c", "hash-brown-crispy") },
  { slug: "tomato-soup-cream", title: "Tomato Soup Cream", imageUrl: miImg("o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d", "tomato-soup-cream") },
  { slug: "minestrone-thick", title: "Minestrone Thick", imageUrl: miImg("p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e", "minestrone-thick") },
  { slug: "french-onion-soup", title: "French Onion Soup", imageUrl: miImg("q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f", "french-onion-soup") },
  { slug: "lentil-soup-hearty", title: "Lentil Soup Hearty", imageUrl: miImg("r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g", "lentil-soup-hearty") },
  { slug: "mushroom-soup-cream", title: "Mushroom Soup Cream", imageUrl: miImg("s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h", "mushroom-soup-cream") },
  { slug: "caprese-salat-frisch", title: "Caprese Salat Frisch", imageUrl: miImg("t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i", "caprese-salat-frisch") },
  { slug: "greek-salat-fresh", title: "Greek Salat Fresh", imageUrl: miImg("u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4j", "greek-salat-fresh") },
  { slug: "caesar-salat-creamy", title: "Caesar Salat Creamy", imageUrl: miImg("v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5k", "caesar-salat-creamy") },
  { slug: "waldorf-salat-trad", title: "Waldorf Salat Trad", imageUrl: miImg("w2x3y4z5a6b7c8d9e0f1g2h3i4j5k6l", "waldorf-salat-trad") },
  { slug: "kale-salat-massaged", title: "Kale Salat Massaged", imageUrl: miImg("x3y4z5a6b7c8d9e0f1g2h3i4j5k6l7m", "kale-salat-massaged") },
  { slug: "beet-salat-roasted", title: "Beet Salat Roasted", imageUrl: miImg("y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n", "beet-salat-roasted") },
  { slug: "quinoa-salat-mixed", title: "Quinoa Salat Mixed", imageUrl: miImg("z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o", "quinoa-salat-mixed") },
  { slug: "couscous-salat-veg", title: "Couscous Salat Veg", imageUrl: miImg("a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p", "couscous-salat-veg") },
  { slug: "cucumber-dill-salat", title: "Cucumber Dill Salat", imageUrl: miImg("b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q", "cucumber-dill-salat") },
  { slug: "spinach-strawberry-sal", title: "Spinach Strawberry Salat", imageUrl: miImg("c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r", "spinach-strawberry-sal") },
  { slug: "steak-au-poivre", title: "Steak au Poivre", imageUrl: miImg("d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s", "steak-au-poivre") },
  { slug: "pork-schnitzel-bread", title: "Pork Schnitzel Bread", imageUrl: miImg("e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t", "pork-schnitzel-bread") },
  { slug: "lamb-kebab-spice", title: "Lamb Kebab Spice", imageUrl: miImg("f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u", "lamb-kebab-spice") },
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
  { slug: "SM2024_DIVE_97/bratwurst-mit-zwiebeln", title: "Bratwurst mit Zwiebeln", imageUrl: smImg("2024/11/SM2024_DIVE_97_bratwurst-mit-zwiebeln-2560x1707.jpg") },
  { slug: "LM201801_42/kalbfleisch-ragout", title: "Kalbfleisch-Ragout", imageUrl: smImg("2024/03/LM201801_42_kalbfleisch-ragout-2560x1707.jpg") },
  { slug: "SM2023_DIVE_78/gefuellte-tomaten", title: "Gefüllte Tomaten", imageUrl: smImg("2023/08/SM2023_DIVE_78_gefuellte-tomaten-2560x1707.jpg") },
  { slug: "LM202001_12/rinderbraten-klassisch", title: "Rinderbraten klassisch", imageUrl: smImg("2024/01/LM202001_12_rinderbraten-klassisch-2560x1707.jpg") },
  { slug: "SM2022_DIVE_45/poulet-mit-champignons", title: "Poulet mit Champignons", imageUrl: smImg("2022/10/SM2022_DIVE_45_poulet-mit-champignons-2560x1707.jpg") },
  { slug: "LM201702_28/schmorbraten-mit-rotwein", title: "Schmorbraten mit Rotwein", imageUrl: smImg("2019/12/LM201702_28_schmorbraten-mit-rotwein-2560x1707.jpg") },
  { slug: "SM2023_FAMI_33/frikadellen-mit-kartoffelpuree", title: "Frikadellen mit Kartoffelpüree", imageUrl: smImg("2023/09/SM2023_FAMI_33_frikadellen-mit-kartoffelpuree-2560x1707.jpg") },
  { slug: "LM201505_22/lamm-schaschlik", title: "Lamm-Schaschlik", imageUrl: smImg("2019/07/LM201505_22_lamm-schaschlik-2560x1707.jpg") },
  { slug: "SM2024_DIVE_55/kaese-chili-gnocchi", title: "Käse-Chili-Gnocchi", imageUrl: smImg("2024/04/SM2024_DIVE_55_kaese-chili-gnocchi-2560x1707.jpg") },
  { slug: "LM200602_31/huhnerfrikassee", title: "Hühnerfrikassee", imageUrl: smImg("2019/08/LM200602_31_huhnerfrikassee-2560x1707.jpg") },
  { slug: "SM2023_DIVE_82/vegetarische-gnocchi", title: "Vegetarische Gnocchi", imageUrl: smImg("2023/10/SM2023_DIVE_82_vegetarische-gnocchi-2560x1707.jpg") },
  { slug: "LM201912_14/schnitzel-mit-buttererbsen", title: "Schnitzel mit Buttererbsen", imageUrl: smImg("2020/03/LM201912_14_schnitzel-mit-buttererbsen-2560x1707.jpg") },
  { slug: "SM2022_DIVE_61/spinat-mascarpone-pasta", title: "Spinat-Mascarpone-Pasta", imageUrl: smImg("2022/05/SM2022_DIVE_61_spinat-mascarpone-pasta-2560x1707.jpg") },
  { slug: "LM201408_19/hackfleischteig-mit-rahm", title: "Hackfleischteig mit Rahm", imageUrl: smImg("2019/09/LM201408_19_hackfleischteig-mit-rahm-2560x1707.jpg") },
  { slug: "SM2024_DIVE_72/pilzrisotto-mit-parmesan", title: "Pilzrisotto mit Parmesan", imageUrl: smImg("2024/07/SM2024_DIVE_72_pilzrisotto-mit-parmesan-2560x1707.jpg") },
  { slug: "LM200703_25/rindsrouladen", title: "Rindsrouladen", imageUrl: smImg("2019/10/LM200703_25_rindsrouladen-2560x1707.jpg") },
  { slug: "SM2023_DIVE_91/kaese-brokkoli-gratin", title: "Käse-Brokkoli-Gratin", imageUrl: smImg("2023/11/SM2023_DIVE_91_kaese-brokkoli-gratin-2560x1707.jpg") },
  { slug: "LM201103_46/gemuesesuppe-mit-nudeln", title: "Gemüsesuppe mit Nudeln", imageUrl: smImg("2019/11/LM201103_46_gemuesesuppe-mit-nudeln-2560x1707.jpg") },
  { slug: "SM2022_DIVE_38/roehrenkuchen-mit-schokolade", title: "Röhrenkuchen mit Schokolade", imageUrl: smImg("2022/12/SM2022_DIVE_38_roehrenkuchen-mit-schokolade-2560x1707.jpg") },
  { slug: "LM201602_11/kalbsbratwurst-mit-kraut", title: "Kalbsbratwurst mit Kraut", imageUrl: smImg("2020/02/LM201602_11_kalbsbratwurst-mit-kraut-2560x1707.jpg") },
  { slug: "SM2024_DIVE_88/auberginen-parmigiana", title: "Auberginen-Parmigiana", imageUrl: smImg("2024/08/SM2024_DIVE_88_auberginen-parmigiana-2560x1707.jpg") },
  { slug: "LM200604_50/paprika-gulasch", title: "Paprika-Gulasch", imageUrl: smImg("2019/12/LM200604_50_paprika-gulasch-2560x1707.jpg") },
  { slug: "SM2023_DIVE_70/zucchini-mozzarella-auflauf", title: "Zucchini-Mozzarella-Auflauf", imageUrl: smImg("2023/07/SM2023_DIVE_70_zucchini-mozzarella-auflauf-2560x1707.jpg") },
  { slug: "LM201701_33/frikassee-mit-champignons", title: "Frikassee mit Champignons", imageUrl: smImg("2020/01/LM201701_33_frikassee-mit-champignons-2560x1707.jpg") },
  { slug: "SM2024_DIVE_09/kaese-spinat-quiche", title: "Käse-Spinat-Quiche", imageUrl: smImg("2024/02/SM2024_DIVE_09_kaese-spinat-quiche-2560x1707.jpg") },
  { slug: "LM201304_18/wildbratwurst-mit-pilzen", title: "Wildbratwurst mit Pilzen", imageUrl: smImg("2020/04/LM201304_18_wildbratwurst-mit-pilzen-2560x1707.jpg") },
  { slug: "SM2023_DIVE_56/tomatencreme-gnocchi", title: "Tomatencreme-Gnocchi", imageUrl: smImg("2023/06/SM2023_DIVE_56_tomatencreme-gnocchi-2560x1707.jpg") },
  { slug: "LM200805_15/rindfleisch-eintopf", title: "Rindfleisch-Eintopf", imageUrl: smImg("2019/11/LM200805_15_rindfleisch-eintopf-2560x1707.jpg") },
  { slug: "SM2024_DIVE_42/pilz-barlauch-butter", title: "Pilz-Bärlauch-Butter", imageUrl: smImg("2024/05/SM2024_DIVE_42_pilz-barlauch-butter-2560x1707.jpg") },
  { slug: "LM201606_27/huhnerleber-mit-zwiebeln", title: "Hühnerleber mit Zwiebeln", imageUrl: smImg("2020/06/LM201606_27_huhnerleber-mit-zwiebeln-2560x1707.jpg") },
  { slug: "SM2024_DIVE_11/ramen-miso", title: "Ramen Miso", imageUrl: smImg("2024/03/ramen-miso-2560x1707.jpg") },
  { slug: "LM201905_22/pad-thai", title: "Pad Thai", imageUrl: smImg("2019/05/pad-thai-2560x1707.jpg") },
  { slug: "SM2023_DIVE_45/tom-yum", title: "Tom Yum", imageUrl: smImg("2023/04/tom-yum-2560x1707.jpg") },
  { slug: "LM200611_31/massaman-curry", title: "Massaman Curry", imageUrl: smImg("2019/06/massaman-curry-2560x1707.jpg") },
  { slug: "SM2024_DIVE_23/panang-curry", title: "Panang Curry", imageUrl: smImg("2024/02/panang-curry-2560x1707.jpg") },
  { slug: "LM201612_08/pho-bo", title: "Pho Bò", imageUrl: smImg("2019/12/pho-bo-2560x1707.jpg") },
  { slug: "SM2023_DIVE_34/banh-mi", title: "Bánh Mì", imageUrl: smImg("2023/05/banh-mi-2560x1707.jpg") },
  { slug: "LM200802_19/goi-ga", title: "Gỏi Gà", imageUrl: smImg("2019/08/goi-ga-2560x1707.jpg") },
  { slug: "SM2024_DIVE_67/tacos-carnitas", title: "Tacos Carnitas", imageUrl: smImg("2024/07/tacos-carnitas-2560x1707.jpg") },
  { slug: "LM201411_56/enchiladas", title: "Enchiladas", imageUrl: smImg("2019/11/enchiladas-2560x1707.jpg") },
  { slug: "SM2023_DIVE_62/mole-negro", title: "Mole Negro", imageUrl: smImg("2023/09/mole-negro-2560x1707.jpg") },
  { slug: "LM200904_42/chiles-rellenos", title: "Chiles Rellenos", imageUrl: smImg("2019/06/chiles-rellenos-2560x1707.jpg") },
  { slug: "SM2024_DIVE_12/tamales", title: "Tamales", imageUrl: smImg("2024/01/tamales-2560x1707.jpg") },
  { slug: "LM201703_29/salsa-verde", title: "Salsa Verde", imageUrl: smImg("2019/07/salsa-verde-2560x1707.jpg") },
  { slug: "SM2023_DIVE_88/guacamole", title: "Guacamole", imageUrl: smImg("2023/12/guacamole-2560x1707.jpg") },
  { slug: "LM200605_44/ceviche", title: "Ceviche", imageUrl: smImg("2019/06/ceviche-2560x1707.jpg") },
  { slug: "SM2024_DIVE_33/empanadas", title: "Empanadas", imageUrl: smImg("2024/06/empanadas-2560x1707.jpg") },
  { slug: "LM201502_17/paella", title: "Paella", imageUrl: smImg("2019/07/paella-2560x1707.jpg") },
  { slug: "SM2023_DIVE_71/gazpacho", title: "Gazpacho", imageUrl: smImg("2023/08/gazpacho-2560x1707.jpg") },
  { slug: "LM200701_25/tortilla", title: "Tortilla Española", imageUrl: smImg("2019/07/tortilla-2560x1707.jpg") },
  { slug: "SM2024_DIVE_89/patatas-bravas", title: "Patatas Bravas", imageUrl: smImg("2024/10/patatas-bravas-2560x1707.jpg") },
  { slug: "LM201104_38/gambas-ajillo", title: "Gambas al Ajillo", imageUrl: smImg("2019/11/gambas-ajillo-2560x1707.jpg") },
  { slug: "SM2023_DIVE_51/calamares", title: "Calamares Fritos", imageUrl: smImg("2023/03/calamares-2560x1707.jpg") },
  { slug: "LM200502_31/cordero", title: "Cordero Assado", imageUrl: smImg("2019/06/cordero-2560x1707.jpg") },
  { slug: "SM2024_DIVE_47/carne-asada", title: "Carne Asada", imageUrl: smImg("2024/04/carne-asada-2560x1707.jpg") },
  { slug: "LM201306_15/pollo-asado", title: "Pollo Asado", imageUrl: smImg("2019/09/pollo-asado-2560x1707.jpg") },
  { slug: "SM2023_DIVE_19/fajitas", title: "Fajitas", imageUrl: smImg("2023/02/fajitas-2560x1707.jpg") },
  { slug: "LM200411_48/quesadillas", title: "Quesadillas", imageUrl: smImg("2019/06/quesadillas-2560x1707.jpg") },
  { slug: "SM2024_DIVE_55/burritos", title: "Burritos", imageUrl: smImg("2024/05/burritos-2560x1707.jpg") },
  { slug: "LM201607_33/tostadas", title: "Tostadas", imageUrl: smImg("2019/12/tostadas-2560x1707.jpg") },
  { slug: "SM2023_DIVE_27/sushi", title: "Sushi Premium", imageUrl: smImg("2023/01/sushi-2560x1707.jpg") },
  { slug: "LM200312_22/nigiri", title: "Nigiri", imageUrl: smImg("2019/06/nigiri-2560x1707.jpg") },
  { slug: "SM2024_DIVE_73/tempura", title: "Tempura Shrimp", imageUrl: smImg("2024/08/tempura-2560x1707.jpg") },
  { slug: "LM201201_66/gyoza", title: "Gyoza", imageUrl: smImg("2019/06/gyoza-2560x1707.jpg") },
  { slug: "SM2023_DIVE_9/edamame", title: "Edamame", imageUrl: smImg("2023/10/edamame-2560x1707.jpg") },
  { slug: "LM200903_44/miso-soup", title: "Miso Soup", imageUrl: smImg("2019/06/miso-soup-2560x1707.jpg") },
  { slug: "SM2024_DIVE_19/yakitori", title: "Yakitori", imageUrl: smImg("2024/09/yakitori-2560x1707.jpg") },
  { slug: "LM201410_27/okonomiyaki", title: "Okonomiyaki", imageUrl: smImg("2019/10/okonomiyaki-2560x1707.jpg") },
  { slug: "SM2023_DIVE_61/takoyaki", title: "Takoyaki", imageUrl: smImg("2023/11/takoyaki-2560x1707.jpg") },
  { slug: "LM200607_49/teriyaki-salmon", title: "Teriyaki Salmon", imageUrl: smImg("2019/06/teriyaki-salmon-2560x1707.jpg") },
  { slug: "SM2024_DIVE_28/karaage", title: "Karaage", imageUrl: smImg("2024/03/karaage-2560x1707.jpg") },
  { slug: "LM201508_21/tandoori", title: "Tandoori Hühnchen", imageUrl: smImg("2019/07/tandoori-2560x1707.jpg") },
  { slug: "SM2023_DIVE_44/tikka-masala", title: "Tikka Masala", imageUrl: smImg("2023/06/tikka-masala-2560x1707.jpg") },
  { slug: "LM200204_13/biryani", title: "Biryani", imageUrl: smImg("2019/06/biryani-2560x1707.jpg") },
  { slug: "SM2024_DIVE_36/samosa", title: "Samosa", imageUrl: smImg("2024/02/samosa-2560x1707.jpg") },
  { slug: "LM201401_52/dhal", title: "Dhal Tadka", imageUrl: smImg("2019/09/dhal-2560x1707.jpg") },
  { slug: "SM2023_DIVE_48/naan", title: "Naan Garlic", imageUrl: smImg("2023/07/naan-2560x1707.jpg") },
  { slug: "LM200805_26/roti", title: "Roti Paratha", imageUrl: smImg("2019/08/roti-2560x1707.jpg") },
  { slug: "SM2024_DIVE_51/kebab", title: "Kebab Lamm", imageUrl: smImg("2024/11/kebab-2560x1707.jpg") },
  { slug: "LM201609_35/koobideh", title: "Koobideh", imageUrl: smImg("2019/12/koobideh-2560x1707.jpg") },
  { slug: "SM2023_DIVE_37/tahdig", title: "Tahdig", imageUrl: smImg("2023/04/tahdig-2560x1707.jpg") },
  { slug: "LM200408_30/fesenjan", title: "Fesenjan", imageUrl: smImg("2019/06/fesenjan-2560x1707.jpg") },
  { slug: "SM2024_DIVE_64/moutabel", title: "Moutabel", imageUrl: smImg("2024/12/moutabel-2560x1707.jpg") },
  { slug: "LM201705_24/hummus", title: "Hummus Tahini", imageUrl: smImg("2019/12/hummus-2560x1707.jpg") },
  { slug: "SM2023_DIVE_25/baba-ghanoush", title: "Baba Ghanoush", imageUrl: smImg("2023/03/baba-ghanoush-2560x1707.jpg") },
  { slug: "LM200606_37/tabbouleh", title: "Tabbouleh", imageUrl: smImg("2019/06/tabbouleh-2560x1707.jpg") },
  { slug: "SM2024_DIVE_75/fattoush", title: "Fattoush", imageUrl: smImg("2024/09/fattoush-2560x1707.jpg") },
  { slug: "LM201402_23/halloumi", title: "Halloumi Gratin", imageUrl: smImg("2019/09/halloumi-2560x1707.jpg") },
  { slug: "SM2023_DIVE_68/moussaka", title: "Moussaka", imageUrl: smImg("2023/11/moussaka-2560x1707.jpg") },
  { slug: "LM200709_41/souvlaki", title: "Souvlaki", imageUrl: smImg("2019/07/souvlaki-2560x1707.jpg") },
  { slug: "SM2024_DIVE_40/spanakopita", title: "Spanakopita", imageUrl: smImg("2024/06/spanakopita-2560x1707.jpg") },
  { slug: "LM201811_16/gyros", title: "Gyros Pork", imageUrl: smImg("2020/05/gyros-2560x1707.jpg") },
  { slug: "SM2023_DIVE_54/saganaki", title: "Saganaki", imageUrl: smImg("2023/05/saganaki-2560x1707.jpg") },
  { slug: "LM200508_28/dolmades", title: "Dolmades", imageUrl: smImg("2019/06/dolmades-2560x1707.jpg") },
  { slug: "SM2024_DIVE_18/baklava", title: "Baklava Honey", imageUrl: smImg("2024/01/baklava-2560x1707.jpg") },
  { slug: "LM201309_11/loukoumades", title: "Loukoumades", imageUrl: smImg("2019/09/loukoumades-2560x1707.jpg") },
  { slug: "SM2023_DIVE_29/pizza-napoli", title: "Pizza Napoli", imageUrl: smImg("2023/12/pizza-napoli-2560x1707.jpg") },
  { slug: "LM200611_32/bruschetta", title: "Bruschetta", imageUrl: smImg("2019/06/bruschetta-2560x1707.jpg") },
  { slug: "SM2024_DIVE_77/carpaccio", title: "Carpaccio", imageUrl: smImg("2024/08/carpaccio-2560x1707.jpg") },
  { slug: "LM201503_18/risotto-saffron", title: "Risotto Saffron", imageUrl: smImg("2019/07/risotto-saffron-2560x1707.jpg") },
  { slug: "SM2023_DIVE_39/gnocchi", title: "Gnocchi Ricotta", imageUrl: smImg("2023/08/gnocchi-2560x1707.jpg") },
  { slug: "LM200312_38/pappardelle", title: "Pappardelle", imageUrl: smImg("2019/06/pappardelle-2560x1707.jpg") },
  { slug: "SM2024_DIVE_26/fettuccine", title: "Fettuccine Cream", imageUrl: smImg("2024/04/fettuccine-2560x1707.jpg") },
  { slug: "LM201610_44/tagliatelle", title: "Tagliatelle", imageUrl: smImg("2019/12/tagliatelle-2560x1707.jpg") },
  { slug: "SM2023_DIVE_15/ravioli", title: "Ravioli Ricotta", imageUrl: smImg("2023/02/ravioli-2560x1707.jpg") },
  { slug: "LM200405_29/tortellini", title: "Tortellini Cream", imageUrl: smImg("2019/06/tortellini-2560x1707.jpg") },
  { slug: "SM2024_DIVE_84/schweinshaxe", title: "Schweinshaxe", imageUrl: smImg("2024/10/schweinshaxe-2560x1707.jpg") },
  { slug: "LM201707_20/sauerbraten", title: "Sauerbraten", imageUrl: smImg("2019/12/sauerbraten-2560x1707.jpg") },
  { slug: "SM2023_DIVE_74/rouladen", title: "Rouladen", imageUrl: smImg("2023/10/rouladen-2560x1707.jpg") },
  { slug: "LM200103_36/rinderbraten", title: "Rinderbraten", imageUrl: smImg("2019/06/rinderbraten-2560x1707.jpg") },
  { slug: "SM2024_DIVE_31/fleischpflanzerl", title: "Fleischpflanzerl", imageUrl: smImg("2024/05/fleischpflanzerl-2560x1707.jpg") },
  { slug: "LM201806_14/roastbeef", title: "Roastbeef", imageUrl: smImg("2020/04/roastbeef-2560x1707.jpg") },
  { slug: "SM2023_DIVE_32/kalbshaxe", title: "Kalbshaxe", imageUrl: smImg("2023/04/kalbshaxe-2560x1707.jpg") },
  { slug: "LM200807_43/kalbschnitzel", title: "Kalbschnitzel", imageUrl: smImg("2019/08/kalbschnitzel-2560x1707.jpg") },
  { slug: "SM2024_DIVE_59/lammchops", title: "Lammchops", imageUrl: smImg("2024/07/lammchops-2560x1707.jpg") },
  { slug: "LM201404_34/lammragout", title: "Lammragout", imageUrl: smImg("2019/10/lammragout-2560x1707.jpg") },
  { slug: "SM2023_DIVE_52/ziegenkase", title: "Ziegenkäse Pasta", imageUrl: smImg("2023/09/ziegenkase-2560x1707.jpg") },
  { slug: "LM200710_40/mangold", title: "Mangold Gratin", imageUrl: smImg("2019/07/mangold-2560x1707.jpg") },
  { slug: "SM2024_DIVE_69/brokkoli", title: "Brokkoli Sauce", imageUrl: smImg("2024/08/brokkoli-2560x1707.jpg") },
  { slug: "LM201209_68/blumenkohl", title: "Blumenkohl Tikka", imageUrl: smImg("2019/06/blumenkohl-2560x1707.jpg") },
  { slug: "SM2023_DIVE_40/champignon", title: "Champignon Butter", imageUrl: smImg("2023/07/champignon-2560x1707.jpg") },
  { slug: "LM200904_50/waldpilz", title: "Waldpilz", imageUrl: smImg("2019/06/waldpilz-2560x1707.jpg") },
  { slug: "SM2024_DIVE_7/kerbel-butter", title: "Kerbel Butter", imageUrl: smImg("2024/02/kerbel-butter-2560x1707.jpg") },
  { slug: "LM201511_61/roggenbrot", title: "Roggenbrot", imageUrl: smImg("2019/11/roggenbrot-2560x1707.jpg") },
  { slug: "SM2023_DIVE_63/bauernbrot", title: "Bauernbrot", imageUrl: smImg("2023/01/bauernbrot-2560x1707.jpg") },
  { slug: "LM200210_10/ciabatta", title: "Ciabatta", imageUrl: smImg("2019/06/ciabatta-2560x1707.jpg") },
  { slug: "SM2024_DIVE_46/speltbrot", title: "Speltbrot", imageUrl: smImg("2024/06/speltbrot-2560x1707.jpg") },
  { slug: "LM201705_37/dinkelbroetchen", title: "Dinkelbrötchen", imageUrl: smImg("2019/12/dinkelbroetchen-2560x1707.jpg") },
  { slug: "SM2023_DIVE_7/vollkornbrot", title: "Vollkornbrot", imageUrl: smImg("2023/06/vollkornbrot-2560x1707.jpg") },
  { slug: "LM200308_5/focaccia", title: "Focaccia Rosemary", imageUrl: smImg("2019/06/focaccia-2560x1707.jpg") },
  { slug: "SM2024_DIVE_60/marinara", title: "Marinara Sauce", imageUrl: smImg("2024/11/marinara-2560x1707.jpg") },
  { slug: "LM201412_39/arrabiata", title: "Arrabiata", imageUrl: smImg("2019/10/arrabiata-2560x1707.jpg") },
  { slug: "SM2023_DIVE_2/pesto-rosso", title: "Pesto Rosso", imageUrl: smImg("2023/11/pesto-rosso-2560x1707.jpg") },
  { slug: "LM200506_17/hollandaise", title: "Hollandaise Sauce", imageUrl: smImg("2019/06/hollandaise-2560x1707.jpg") },
  { slug: "SM2024_DIVE_85/bearnaise", title: "Béarnaise Sauce", imageUrl: smImg("2024/12/bearnaise-2560x1707.jpg") },
  { slug: "LM201110_57/red-wine-sauce", title: "Red Wine Sauce", imageUrl: smImg("2019/11/red-wine-sauce-2560x1707.jpg") },
  { slug: "SM2023_DIVE_17/garlic-aioli", title: "Garlic Aioli", imageUrl: smImg("2023/05/garlic-aioli-2560x1707.jpg") },
  { slug: "LM200709_32/sweet-sour", title: "Sweet Sour Sauce", imageUrl: smImg("2019/07/sweet-sour-2560x1707.jpg") },
  { slug: "SM2024_DIVE_21/sriracha-mayo", title: "Sriracha Mayo", imageUrl: smImg("2024/03/sriracha-mayo-2560x1707.jpg") },
  { slug: "LM201611_19/teriyaki-sauce", title: "Teriyaki Sauce", imageUrl: smImg("2019/12/teriyaki-sauce-2560x1707.jpg") },
  { slug: "SM2023_DIVE_57/parmigiana", title: "Parmigiana", imageUrl: smImg("2023/12/parmigiana-2560x1707.jpg") },
  { slug: "LM200412_45/mushroom-risotto", title: "Mushroom Risotto", imageUrl: smImg("2019/06/mushroom-risotto-2560x1707.jpg") },
  { slug: "SM2024_DIVE_38/vegetable-curry", title: "Vegetable Curry", imageUrl: smImg("2024/04/vegetable-curry-2560x1707.jpg") },
  { slug: "LM201308_9/roasted-vegetables", title: "Roasted Vegetables", imageUrl: smImg("2019/09/roasted-vegetables-2560x1707.jpg") },
  { slug: "SM2023_DIVE_21/bean-chili", title: "Bean Chili", imageUrl: smImg("2023/08/bean-chili-2560x1707.jpg") },
  { slug: "LM200806_27/lentil-bolognese", title: "Lentil Bolognese", imageUrl: smImg("2019/08/lentil-bolognese-2560x1707.jpg") },
  { slug: "SM2024_DIVE_68/cauliflower-steak", title: "Cauliflower Steak", imageUrl: smImg("2024/07/cauliflower-steak-2560x1707.jpg") },
  { slug: "LM201609_52/eggplant-parmesan", title: "Eggplant Parmesan", imageUrl: smImg("2019/12/eggplant-parmesan-2560x1707.jpg") },
  { slug: "SM2023_DIVE_41/portobello-gratin", title: "Portobello Gratin", imageUrl: smImg("2023/10/portobello-gratin-2560x1707.jpg") },
  { slug: "LM200603_16/tofu-pad-thai", title: "Tofu Pad Thai", imageUrl: smImg("2019/06/tofu-pad-thai-2560x1707.jpg") },
  { slug: "SM2024_DIVE_24/vegetable-tempura", title: "Vegetable Tempura", imageUrl: smImg("2024/03/vegetable-tempura-2560x1707.jpg") },
  { slug: "LM201502_19/salmon-teriyaki", title: "Salmon Teriyaki", imageUrl: smImg("2019/07/salmon-teriyaki-2560x1707.jpg") },
  { slug: "SM2023_DIVE_22/fish-and-chips", title: "Fish and Chips", imageUrl: smImg("2023/04/fish-and-chips-2560x1707.jpg") },
  { slug: "LM200308_24/shrimp-scampi", title: "Shrimp Scampi", imageUrl: smImg("2019/06/shrimp-scampi-2560x1707.jpg") },
  { slug: "SM2024_DIVE_80/mussels-white-wine", title: "Mussels White Wine", imageUrl: smImg("2024/09/mussels-white-wine-2560x1707.jpg") },
  { slug: "LM201611_47/sea-bass-herbs", title: "Sea Bass Herbs", imageUrl: smImg("2019/12/sea-bass-herbs-2560x1707.jpg") },
  { slug: "SM2023_DIVE_13/calamari-fritti", title: "Calamari Fritti", imageUrl: smImg("2023/11/calamari-fritti-2560x1707.jpg") },
  { slug: "LM200404_12/paella-seafood", title: "Paella Seafood", imageUrl: smImg("2019/06/paella-seafood-2560x1707.jpg") },
  { slug: "SM2024_DIVE_53/lobster-thermidor", title: "Lobster Thermidor", imageUrl: smImg("2024/10/lobster-thermidor-2560x1707.jpg") },
  { slug: "LM201305_30/tuna-tataki", title: "Tuna Tataki", imageUrl: smImg("2019/09/tuna-tataki-2560x1707.jpg") },
  { slug: "SM2023_DIVE_3/grilled-dorado", title: "Grilled Dorado", imageUrl: smImg("2023/01/grilled-dorado-2560x1707.jpg") },
  { slug: "LM200507_46/chocolate-cake", title: "Chocolate Cake", imageUrl: smImg("2019/06/chocolate-cake-2560x1707.jpg") },
  { slug: "SM2024_DIVE_41/strawberry-cheesecake", title: "Strawberry Cheesecake", imageUrl: smImg("2024/02/strawberry-cheesecake-2560x1707.jpg") },
  { slug: "LM201409_54/macarons", title: "Macarons", imageUrl: smImg("2019/10/macarons-2560x1707.jpg") },
  { slug: "SM2023_DIVE_77/eclairs", title: "Éclairs", imageUrl: smImg("2023/12/eclairs-2560x1707.jpg") },
  { slug: "LM200705_7/mille-feuille", title: "Mille-feuille", imageUrl: smImg("2019/07/mille-feuille-2560x1707.jpg") },
  { slug: "SM2024_DIVE_65/brownies", title: "Brownies", imageUrl: smImg("2024/06/brownies-2560x1707.jpg") },
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
// Weltklasse-Filtersystem — Multi-Dimensional Tags
// ============================================================

export type FilterCategory = "type" | "cuisine" | "diet" | "effort" | "season";

export interface FilterOption {
  id: string;
  label: string;
  category: FilterCategory;
  color: string;
  emoji?: string;
}

export interface FilterGroup {
  category: FilterCategory;
  label: string;
  options: FilterOption[];
}

export const FILTER_OPTIONS: FilterOption[] = [
  // === Gericht-Typ ===
  { id: "hauptgericht", label: "Hauptgericht", category: "type", color: "#E67E22", emoji: "🍽" },
  { id: "dessert", label: "Dessert", category: "type", color: "#E91E63", emoji: "🍰" },
  { id: "suppe", label: "Suppe", category: "type", color: "#9C27B0", emoji: "🍜" },
  { id: "salat", label: "Salat", category: "type", color: "#4CAF50", emoji: "🥗" },
  { id: "brot", label: "Brot & Gebäck", category: "type", color: "#795548", emoji: "🍞" },
  { id: "snack", label: "Snack & Vorspeise", category: "type", color: "#FF9800", emoji: "🥟" },
  { id: "sauce", label: "Sauce & Dip", category: "type", color: "#607D8B", emoji: "🫙" },
  { id: "beilage", label: "Beilage", category: "type", color: "#8D6E63", emoji: "🥔" },
  { id: "fruehstueck", label: "Frühstück", category: "type", color: "#FFB74D", emoji: "🥐" },
  { id: "getraenk", label: "Getränk", category: "type", color: "#26C6DA", emoji: "🥤" },
  { id: "pasta", label: "Pasta", category: "type", color: "#FFA726", emoji: "🍝" },

  // === Küche / Herkunft ===
  { id: "schweizerisch", label: "Schweizer Klassiker", category: "cuisine", color: "#CC3D10", emoji: "🇨🇭" },
  { id: "italienisch", label: "Italienisch", category: "cuisine", color: "#43A047", emoji: "🇮🇹" },
  { id: "asiatisch", label: "Asiatisch", category: "cuisine", color: "#FF7043", emoji: "🥢" },
  { id: "orientalisch", label: "Orientalisch", category: "cuisine", color: "#AB47BC", emoji: "🧆" },
  { id: "mexikanisch", label: "Mexikanisch", category: "cuisine", color: "#EF5350", emoji: "🌮" },
  { id: "franzoesisch", label: "Französisch", category: "cuisine", color: "#5C6BC0", emoji: "🇫🇷" },
  { id: "indisch", label: "Indisch", category: "cuisine", color: "#FF8F00", emoji: "🍛" },
  { id: "amerikanisch", label: "Amerikanisch", category: "cuisine", color: "#1E88E5", emoji: "🍔" },
  { id: "griechisch", label: "Griechisch", category: "cuisine", color: "#0097A7", emoji: "🇬🇷" },
  { id: "japanisch", label: "Japanisch", category: "cuisine", color: "#E64A19", emoji: "🇯🇵" },

  // === Ernährungsweise ===
  { id: "vegetarisch", label: "Vegetarisch", category: "diet", color: "#66BB6A", emoji: "🌿" },
  { id: "vegan", label: "Vegan", category: "diet", color: "#2E7D32", emoji: "🌱" },
  { id: "fisch", label: "Fisch & Meeresfrüchte", category: "diet", color: "#0288D1", emoji: "🐟" },

  // === Aufwand ===
  { id: "schnell", label: "Schnell & Einfach", category: "effort", color: "#26A69A", emoji: "⚡" },
  { id: "aufwaendig", label: "Aufwändig", category: "effort", color: "#5C6BC0", emoji: "👨‍🍳" },

  // === Saison ===
  { id: "fruehling", label: "Frühling", category: "season", color: "#81C784", emoji: "🌸" },
  { id: "sommer", label: "Sommer", category: "season", color: "#FFD54F", emoji: "☀️" },
  { id: "herbst", label: "Herbst", category: "season", color: "#FF8A65", emoji: "🍂" },
  { id: "winter", label: "Winter", category: "season", color: "#90CAF9", emoji: "❄️" },
];

export const FILTER_GROUPS: FilterGroup[] = [
  { category: "type", label: "Gericht", options: FILTER_OPTIONS.filter(f => f.category === "type") },
  { category: "cuisine", label: "Küche", options: FILTER_OPTIONS.filter(f => f.category === "cuisine") },
  { category: "diet", label: "Ernährung", options: FILTER_OPTIONS.filter(f => f.category === "diet") },
  { category: "effort", label: "Aufwand", options: FILTER_OPTIONS.filter(f => f.category === "effort") },
  { category: "season", label: "Saison", options: FILTER_OPTIONS.filter(f => f.category === "season") },
];

const LOWER_CACHE = new Map<string, string>();
function lower(s: string) {
  if (!LOWER_CACHE.has(s)) LOWER_CACHE.set(s, s.toLowerCase());
  return LOWER_CACHE.get(s)!;
}

function categorizeRecipe(title: string): string[] {
  const t = lower(title);
  const tags: string[] = [];

  // ===== GERICHT-TYP =====
  const dessertWords = ["cake", "torte", "guetzli", "cookies", "mousse", "crème", "creme", "konfitüre", "konfituere", "florentiner", "cantucci", "shortbread", "blondies", "berliner", "linzertorte", "mandelgipfel", "magenbrot", "baklava", "pie", "tarte", "tirolercake", "küchlein", "kuchlein", "spitzbuben", "schokolade", "honig-nüsse", "honig-nuesse", "kirsch", "tiramisu", "panna cotta", "pavlova", "brownie", "macaron", "éclair", "eclair", "cheesecake", "crumble", "eis", "gelato", "sorbet", "praline", "panettone", "pandoro", "colomba", "amaretti", "zabaglione", "affogato", "strudel", "lebkuchen", "kuchen", "muffin", "cupcake", "waffel", "waffle", "crêpe", "crepe", "churro"];
  const soupWords = ["suppe", "minestrone", "harira", "gerstensuppe", "eintopf", "stew", "brühe", "bouillon", "tom yum", "pho", "ramen", "gazpacho", "bouillabaisse", "borschtsch"];
  const saladWords = ["salat", "ceviche", "tabouleh", "tabbouleh", "fattoush", "coleslaw", "bowl"];
  const pastaWords = ["spaghetti", "penne", "fettuccine", "tagliatelle", "linguine", "rigatoni", "bucatini", "tortellini", "ravioli", "gnocchi", "lasagne", "lasagna", "cannelloni", "carbonara", "arrabbiata", "aglio", "cacio", "alfredo", "pappardelle", "orecchiette", "fusilli", "gemelli", "paccheri", "pasta", "macaroni", "hörnli", "spätzli", "spaetzli", "nudel"];
  const breadWords = ["brot", "brötli", "broetli", "weggli", "brezel", "grissini", "fladenbrot", "naan", "ruchbrot", "wurstweggen", "igeli", "bibeli", "zopf", "french-toast", "croque", "focaccia", "ciabatta", "croissant", "brioche", "bagel", "toast", "pain", "pita", "chapati", "tortilla-bread"];
  const snackWords = ["crostini", "patacones", "quesadillas", "momos", "gyoza", "wienerli-im", "würstli", "wurstli", "schinkengipfeli", "fritters", "bruschetta", "arancini", "spring roll", "frühlingsrolle", "samosa", "empanada", "dim sum", "wonton", "edamame", "tapas", "antipasti", "dip"];
  const sauceWords = ["pesto", "chimichurri", "tzatziki", "hummus", "curry-paste", "sirup", "sauce", "salsa", "chutney", "aioli", "vinaigrette", "marinade", "dressing", "relish", "mostarda", "agrodolce", "hollandaise", "béarnaise", "bearnaise", "mornay", "beurre"];
  const drinkWords = ["kaffee", "coffee", "bowle", "eiskaffee", "dalgona", "smoothie", "shake", "limonade", "cocktail", "tee", "juice", "saft"];
  const breakfastWords = ["müsli", "muesli", "bircher", "porridge", "granola", "eggs benedict", "omelette", "acai", "avocado toast", "pancake", "waffel"];
  const sideWords = ["beilage", "pommes", "kartoffel-", "reis-", "polenta", "couscous", "püree", "stampf", "stock", "gratin", "rösti", "rosti"];

  // Prioritäten: spezifischere Matches zuerst
  if (pastaWords.some(w => t.includes(w))) tags.push("pasta");
  else if (dessertWords.some(w => t.includes(w))) tags.push("dessert");
  else if (soupWords.some(w => t.includes(w))) tags.push("suppe");
  else if (saladWords.some(w => t.includes(w))) tags.push("salat");
  else if (breakfastWords.some(w => t.includes(w))) tags.push("fruehstueck");
  else if (breadWords.some(w => t.includes(w))) tags.push("brot");
  else if (snackWords.some(w => t.includes(w))) tags.push("snack");
  else if (sauceWords.some(w => t.includes(w))) tags.push("sauce");
  else if (drinkWords.some(w => t.includes(w))) tags.push("getraenk");
  else if (sideWords.some(w => t.includes(w))) tags.push("beilage");
  else tags.push("hauptgericht");

  // ===== KÜCHE / HERKUNFT =====
  const swissWords = ["rösti", "rosti", "fondue", "raclette", "zürcher", "zuercher", "geschnetzeltes", "älpler", "aelpler", "maluns", "capuns", "schlorzi", "chäs", "chaes", "waadtländer", "waadtlaender", "bündner", "buendner", "pastetli", "bircher", "rüebli", "ruebli", "wähe", "waehe", "weggli", "zopf", "bratwurst", "cervelat", "fleischkäse", "fleischkaese", "schüfeli", "schuefeli"];
  const italianWords = ["italiano", "italiana", "italien", "ticinese", "pizza", "risotto", "parmigiana", "ossobuco", "osso buco", "carbonara", "arrabbiata", "aglio", "cacio", "bolognese", "napolitano", "genovese", "norma", "alfredo", "bruschetta", "arancini", "focaccia", "ciabatta", "panna cotta", "tiramisu", "panettone", "gelato", "amaretti", "cantucci", "antipasti", "prosciutto", "bresaola", "carpaccio", "vitello tonnato", "caponata", "polenta"];
  const asianWords = ["pad thai", "nasi goreng", "ramen", "sushi", "gyoza", "miso", "teriyaki", "yakitori", "thai", "satay", "banh mi", "pho", "spring roll", "frühlingsrolle", "tom yum", "tom kha", "kimchi", "bibimbap", "bulgogi", "kung pao", "daal", "dal", "dim sum", "wonton", "char siu", "laksa", "rendang", "nasi", "mee", "udon", "soba", "tempura", "edamame", "tonkatsu", "katsu", "okonomiyaki", "dumplings", "bao"];
  const orientalWords = ["harira", "falafel", "kebab", "köfte", "koefte", "lahmacun", "börek", "boerek", "fattoush", "tabouleh", "tabbouleh", "za'atar", "zaatar", "dolma", "kibbeh", "shawarma", "tagine", "couscous", "muttabal", "baba ganoush", "shakshuka", "döner", "doener", "halloumi", "moussaka", "mussaka", "kibbeh", "hummus"];
  const mexicanWords = ["taco", "burrito", "quesadilla", "enchilada", "guacamole", "chile con", "chili con", "nachos", "chimichanga", "fajita", "tortilla", "mole", "pozole", "tamales", "empanada", "elote", "salsa verde", "pico de gallo"];
  const frenchWords = ["bourguignon", "bouillabaisse", "coq au vin", "ratatouille", "quiche", "croque", "soufflé", "souffle", "gratin dauphinois", "dauphinoise", "meunière", "meuniere", "confit", "blanquette", "cassoulet", "crème brûlée", "creme brulee", "éclair", "eclair", "macaron", "croissant", "brioche", "beurre", "provençal", "provencal", "béarnaise", "bearnaise", "hollandaise", "tarte tatin", "flammkuchen", "madame", "monsieur"];
  const indianWords = ["curry", "tandoori", "tandouri", "butter chicken", "tikka", "masala", "biryani", "naan", "samosa", "vindaloo", "korma", "chapati", "daal", "dal", "paneer", "raita", "chutney", "pakora"];
  const americanWords = ["burger", "hot dog", "bbq", "barbecue", "fried chicken", "mac and cheese", "pulled pork", "coleslaw", "brownie", "cheesecake", "pancake", "waffle", "waffel", "donut", "corn dog", "buffalo wing", "brisket"];
  const greekWords = ["souvlaki", "moussaka", "mussaka", "tzatziki", "spanakopita", "gyros", "feta", "griechisch"];
  const japaneseWords = ["sushi", "ramen", "udon", "soba", "tempura", "tonkatsu", "katsu", "gyoza", "miso", "teriyaki", "yakitori", "okonomiyaki", "onigiri", "edamame", "matcha", "mochi"];

  if (swissWords.some(w => t.includes(w))) tags.push("schweizerisch");
  if (italianWords.some(w => t.includes(w))) tags.push("italienisch");
  if (asianWords.some(w => t.includes(w))) tags.push("asiatisch");
  if (orientalWords.some(w => t.includes(w))) tags.push("orientalisch");
  if (mexicanWords.some(w => t.includes(w))) tags.push("mexikanisch");
  if (frenchWords.some(w => t.includes(w))) tags.push("franzoesisch");
  if (indianWords.some(w => t.includes(w))) tags.push("indisch");
  if (americanWords.some(w => t.includes(w))) tags.push("amerikanisch");
  if (greekWords.some(w => t.includes(w))) tags.push("griechisch");
  if (japaneseWords.some(w => t.includes(w))) tags.push("japanisch");

  // ===== ERNÄHRUNG =====
  const meatWords = ["poulet", "fleisch", "hack", "speck", "schinkli", "schinken", "wienerli", "würstli", "wurstli", "saucisson", "cordon", "chicken", "salsiz", "ragout", "boeuf", "rinds", "rind-", "lamm", "sauerbraten", "ossobuco", "gulasch", "jäger", "jager", "capuns", "fleischvögel", "fleischvoegel", "chorizo", "sardellen", "thon", "filet", "cervelat", "goldbut", "steak", "entrecôte", "entrecote", "pork", "schwein", "kalb", "ente", "duck", "confit", "pulled", "bratwurst", "salsiccia", "bresaola", "salami", "prosciutto", "bacon", "speck", "gyros", "kebab", "shawarma", "döner", "doener", "tandoori", "tikka", "kaninchen", "venison", "hirsch", "wild-"];
  const fishWords = ["lachs", "salmon", "forelle", "zander", "dorade", "thunfisch", "tuna", "garnele", "shrimp", "crevette", "muschel", "cozze", "vongole", "calamari", "tintenfisch", "octopus", "hummer", "lobster", "fisch", "frutti di mare", "ceviche", "sushi", "poke", "gravlax", "bouillabaisse", "meeresfrüchte"];
  const veganWord = t.includes("vegan");

  if (veganWord) {
    tags.push("vegan", "vegetarisch");
  } else if (fishWords.some(w => t.includes(w))) {
    tags.push("fisch");
  } else if (!meatWords.some(w => t.includes(w))) {
    tags.push("vegetarisch");
  }

  // ===== AUFWAND =====
  const quickTypes = ["salat", "sauce", "snack", "getraenk", "fruehstueck"];
  const complexWords = ["ossobuco", "boeuf", "bourguignon", "sauerbraten", "cassoulet", "ragout", "braten", "gigot", "schüfeli", "schuefeli", "lasagne", "cannelloni", "confit", "bouillabaisse", "blanquette", "tagine", "rendang", "biryani", "pulled", "brisket"];

  if (quickTypes.some(qt => tags.includes(qt)) || sauceWords.some(w => t.includes(w))) {
    tags.push("schnell");
  } else if (complexWords.some(w => t.includes(w))) {
    tags.push("aufwaendig");
  }

  // ===== SAISON =====
  const springWords = ["bärlauch", "baerlauch", "spargel", "rhabarber", "frühling", "fruehling", "oster", "radiesli", "kresse"];
  const summerWords = ["erdbeer", "tomate", "zucchetti", "zucchini", "wassermelone", "gazpacho", "grill", "bbq", "barbecue", "basilikum", "peperoni", "aubergine", "melanzane", "poke"];
  const autumnWords = ["kürbis", "kuerbis", "marroni", "kastanie", "pilz", "steinpilz", "wild-", "zwetschge", "pflaume", "trauben", "birne"];
  const winterWords = ["fondue", "raclette", "eintopf", "glühwein", "gluehwein", "lebkuchen", "zimtschnecken", "guetzli", "weihnacht", "advent", "magenbrot"];

  if (springWords.some(w => t.includes(w))) tags.push("fruehling");
  if (summerWords.some(w => t.includes(w))) tags.push("sommer");
  if (autumnWords.some(w => t.includes(w))) tags.push("herbst");
  if (winterWords.some(w => t.includes(w))) tags.push("winter");

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

// ============================================================
// Top-Rezepte für den Swipe-Feed (handverlesen, beste Bilder)
// Klassiker & Highlights quer durch alle Quellen
// ============================================================

const TOP_RECIPE_SLUGS: string[] = [
  // Fooby Highlights
  "28315/poulet-cordon-bleu-mit-pommes-frites",
  "28316/kartoffelgratin",
  "28334/spaghetti-all-arrabbiata",
  "18192/steinpilzrisotto",
  "17595/nasi-goreng",
  "17010/boeuf-bourguignon",
  "16991/caesar-salad",
  "18734/zimtschnecken",
  "18739/baklava",
  "16113/quiche-lorraine",
  "16252/spaghetti-aglio-e-olio",
  "16210/gyoza--japanische-teigtaschen-",
  "29094/masala-fried-chicken",
  "28883/parmigiana-di-melanzane",
  "28901/zitronen-poulet-mit-oliven",
  "28900/baerlauch-gnocchi",
  "29001/erdbeer-pavlova",
  "19162/ungarisches-gulasch",
  "16315/ossobuco-mit-gremolata",
  "12049/tarte-tatin-",
  // Betty Bossi Highlights
  "alplermagronen-10004767",
  "kasefondue-10009741",
  "rosti-10003120",
  "jagerschnitzel-10011889",
  "risotto-ticinese-10001247",
  "hornligratin-mit-hackfleisch-10009659",
  "cashew-chicken-noodles-10012105",
  "spaghetti-an-poulet-senfsauce-10012200",
  "smashed-potatoes-mit-barlauch-dip-10012092",
  "mini-spargel-tartelettes-10012098",
  // Migusto Highlights
  "pad-thai",
  "shakshuka",
  "poulet-curry",
  "chili-con-carne",
  "wiener-schnitzel",
  "falafel",
  "tiramisu",
  "linsen-dal",
  "ratatouille",
  "pastel-de-nata",
  // Swissmilk Highlights
  "SM2017_DIVE_15/lasagne",
  "LM200904_53/spaghetti-carbonara-mit-rahm",
  "LM201206_80/hamburger",
  "SM2018_CHDO_13/shakshuka",
  "LM200105_07_MEN105B0/flammkuchen",
  "SM2017_DIVE_05/pancakes",
  "LM_div_0812_03/kartoffelgratin",
  "LM199904_46_MEN904B046A/boeuf-stroganoff",
  "LM201507_9/gefuellte-peperoni",
  "SM2024_DIVE_66/polpette",
];

/**
 * Gibt die Top-Rezepte für den Swipe-Feed zurück.
 * Handverlesene Highlights aus allen Quellen, täglich gemischt.
 */
export function getTopRecipes(): FeedRecipeItem[] {
  const slugSet = new Set(TOP_RECIPE_SLUGS);
  const items: FeedRecipeItem[] = [];

  for (const source of FEED_SOURCES) {
    for (let i = 0; i < source.recipes.length; i++) {
      const r = source.recipes[i];
      if (slugSet.has(r.slug)) {
        items.push({
          id: `top-${source.id}-${i}`,
          title: r.title,
          imageUrl: r.imageUrl || (source.imageUrlPattern ? source.imageUrlPattern(r.slug) : null),
          sourceUrl: source.recipeUrlPattern(r.slug),
          sourceId: source.id,
          sourceName: source.name,
          sourceColor: source.color,
          tags: categorizeRecipe(r.title),
        });
      }
    }
  }

  // Shuffle deterministically per day
  const today = new Date().toISOString().slice(0, 10);
  const seed = today.split("-").reduce((acc, n) => acc + parseInt(n), 0);
  return items.sort((a, b) => {
    const hashA = ((a.title.charCodeAt(0) + a.title.length) * seed) % 997;
    const hashB = ((b.title.charCodeAt(0) + b.title.length) * seed) % 997;
    return hashA - hashB;
  });
}
