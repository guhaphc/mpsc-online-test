export type PolitySection = {
  id: string;
  part: "Part 1" | "Part 2";
  chapter: string;
  title: string;
  subtitle: string;
  body: string[];
  facts?: string[];
};

export const polityPart1Sections: PolitySection[] = [
  {id:"p1-01",part:"Part 1",chapter:"01 • Historical Underpinnings",title:"Historical Underpinnings of the Constitution",subtitle:"ब्रिटिश काळातील घटनात्मक विकासाचा प्रवास",body:[
    "भारतीय संविधानाची निर्मिती ही 1946 नंतर अचानक झालेली प्रक्रिया नव्हती; ब्रिटिश राजवटीतील कायदे, प्रशासनिक प्रयोग, प्रतिनिधित्वाची वाढ आणि स्वातंत्र्यलढ्याच्या राजकीय अनुभवातून घटनात्मक विकासाची पायाभरणी झाली.",
    "Regulating Act 1773, Pitt’s India Act 1784, Charter Acts, Government of India Act 1858, Indian Councils Acts, Morley–Minto reforms 1909, Government of India Act 1919 आणि Government of India Act 1935 यांचा क्रमाने आढावा घेतला आहे.",
    "Government of India Act 1935 मधील federal scheme, Governor, judiciary, Public Service Commissions आणि emergency-related provisions यांचा पुढील संविधानावर प्रभाव अधोरेखित केला आहे.",
    "स्वातंत्र्यपूर्व कायदे समजून घेतल्यास भारतीय संविधानातील केंद्र-राज्य संबंध, प्रतिनिधित्व आणि प्रशासनिक संस्थांची पार्श्वभूमी स्पष्ट होते."
  ],facts:["1773 → Regulating Act","1909 → Morley–Minto reforms","1919 → dyarchy आणि प्रांतीय प्रतिनिधित्वाचा विस्तार","1935 → पुढील संविधानासाठी महत्त्वाची घटनात्मक पायाभरणी"]},
  {id:"p1-02",part:"Part 1",chapter:"02 • Concept and Making of Constitution",title:"संविधानाची संकल्पना आणि निर्मिती",subtitle:"Constituent Assembly, Drafting आणि enactment",body:[
    "संविधानाची संकल्पना, विविध प्रकारची राज्यघटना आणि भारतीय संविधान निर्मितीची प्रक्रिया यांचा क्रमबद्ध आढावा आहे.",
    "Constituent Assembly ची स्थापना, विविध समित्या, Objective Resolution आणि Drafting Committee यांच्या माध्यमातून अंतिम संविधानाची रचना झाली.",
    "Drafting Committee ने पहिला मसुदा 1948 मध्ये प्रकाशित केला; सार्वजनिक सूचना व चर्चेनंतर पुढील मसुदा तयार झाला. अंतिम मसुद्यावर प्रथम, द्वितीय आणि तृतीय वाचनाची प्रक्रिया झाली.",
    "26 नोव्हेंबर 1949 रोजी संविधान स्वीकारण्यात आले आणि 26 जानेवारी 1950 रोजी ते अमलात आले. संविधानाच्या विविध परदेशी घटनात्मक स्रोतांचे तुलनात्मक स्वरूपही दिले आहे."
  ],facts:["Drafting Committee → डॉ. B.R. Ambedkar यांच्या अध्यक्षतेखाली","Objective Resolution → संविधानाच्या मूलभूत मूल्यांची दिशा","26 Nov 1949 → संविधान स्वीकृती","26 Jan 1950 → संविधान अंमलबजावणी"]},
  {id:"p1-03",part:"Part 1",chapter:"03 • Salient Features",title:"भारतीय संविधानाची वैशिष्ट्ये",subtitle:"Federal, parliamentary आणि rights-based constitutional framework",body:[
    "लिखित व विस्तृत संविधान, संघराज्यात्मक रचना, संसदीय शासनपद्धती, स्वतंत्र न्यायपालिका, मूलभूत अधिकार, राज्याच्या मार्गदर्शक तत्त्वे आणि मूलभूत कर्तव्ये यांचा समन्वय स्पष्ट केला आहे.",
    "भारतीय व्यवस्था federal features आणि strong Centre यांचे मिश्रण दर्शवते. संसदीय पद्धतीत कार्यपालिका विधिमंडळाप्रती उत्तरदायी असते.",
    "संविधानाची सर्वोच्चता, न्यायालयीन पुनरावलोकन, सार्वत्रिक प्रौढ मताधिकार आणि एकल नागरिकत्व यांसारखी वैशिष्ट्ये लोकशाही संस्थात्मक चौकट मजबूत करतात.",
    "भारतीय संविधानाला परिस्थितीनुसार संघराज्यात्मक तसेच केंद्रीकृत वैशिष्ट्ये असलेली व्यवस्था म्हणून समजावले आहे."
  ],facts:["Written Constitution","Parliamentary government","Federal structure with strong Centre","Independent judiciary + judicial review"]},
  {id:"p1-04",part:"Part 1",chapter:"04 • Preamble",title:"प्रस्तावना (Preamble)",subtitle:"संविधानाची मूल्यात्मक दिशा",body:[
    "प्रस्तावना संविधानाच्या उद्दिष्टांचा संक्षिप्त मूल्यात्मक आराखडा देते. Sovereign, Socialist, Secular, Democratic, Republic तसेच Justice, Liberty, Equality आणि Fraternity या संकल्पनांचे स्पष्टीकरण केले आहे.",
    "42व्या घटनादुरुस्तीने ‘Socialist’, ‘Secular’ आणि ‘Integrity’ या शब्दांचा समावेश करण्यात आला असल्याचे स्पष्ट केले आहे.",
    "प्रस्तावना स्वतःहून स्वतंत्र अधिकारांचा स्रोत नसली तरी संविधानाच्या तरतुदींचे अर्थ लावताना ती मार्गदर्शक भूमिका बजावते.",
    "प्रस्तावनेची उद्दिष्टे, तिचे महत्त्व आणि तिच्या न्यायालयीन व्याख्येतील स्थान यांचा अभ्यास दिला आहे."
  ],facts:["Justice → social, economic, political","Liberty → thought, expression, belief, faith, worship","Equality → status and opportunity","Fraternity → dignity + unity and integrity"]},
  {id:"p1-05",part:"Part 1",chapter:"05 • System of Government",title:"भारताची शासनपद्धती",subtitle:"Parliamentary, Presidential आणि federal तुलना",body:[
    "parliamentary आणि presidential systems ची तुलना करून भारताने parliamentary system स्वीकारल्याचे स्पष्ट केले आहे.",
    "भारतामध्ये President हा nominal/de jure executive आणि Prime Minister हा real/de facto executive म्हणून कार्य करतो; Council of Ministers लोकसभेसमोर सामूहिकरीत्या उत्तरदायी असते.",
    "संसदीय व्यवस्थेत कार्यपालिका आणि विधिमंडळ यांच्यात घनिष्ठ संबंध असतो, तर राष्ट्रपती पद्धतीत कार्यपालिकेचे पद विधिमंडळापासून अधिक स्वतंत्र असते.",
    "भारतीय संघराज्याची रचना, Seventh Schedule आणि Centre–State legislative relations यांच्याशी शासनपद्धतीचा संबंधही स्पष्ट केला आहे."
  ],facts:["Nominal executive → President","Real executive → Prime Minister + Council of Ministers","Collective responsibility → Lok Sabha","India → parliamentary democracy with federal features"]},
  {id:"p1-06",part:"Part 1",chapter:"06 • Union and Its Territory",title:"संघ आणि त्याचे राज्यक्षेत्र",subtitle:"States, Union Territories आणि territorial changes",body:[
    "Articles 1–4, भारताचे संघराज्य, States आणि Union Territories तसेच राज्यांची निर्मिती, विलिनीकरण किंवा सीमाबदल यांचा आढावा आहे.",
    "Parliament ला राज्यांच्या सीमांमध्ये बदल करण्याची घटनात्मक प्रक्रिया उपलब्ध आहे; संबंधित राज्य विधानमंडळाचे मत मागवले जाते, परंतु त्याला अंतिम संमतीचे स्वरूप दिलेले नाही.",
    "भाषिक आणि प्रशासकीय गरजांनुसार राज्य पुनर्रचना भारतीय संघराज्याच्या उत्क्रांतीतील महत्त्वाचा भाग ठरली.",
    "Delhi सारख्या केंद्रशासित प्रदेशातील विशेष प्रतिनिधिक व्यवस्थेचाही उल्लेख आहे."
  ],facts:["Article 1 → India, that is Bharat, Union of States","Articles 2–3 → admission/formation and alteration of States","Article 4 → consequential changes","State reorganisation → federal adaptation"]},
  {id:"p1-07",part:"Part 1",chapter:"07 • Citizenship",title:"नागरिकत्व",subtitle:"संवैधानिक तरतुदी आणि Citizenship Act, 1955",body:[
    "संविधानाच्या प्रारंभीच्या नागरिकत्वाच्या तरतुदी आणि Citizenship Act, 1955 अंतर्गत नागरिकत्व मिळवण्याचे व गमावण्याचे मार्ग दिले आहेत.",
    "जन्म, वंश, नोंदणी, naturalisation आणि territory incorporation या मार्गांचा आढावा घेतला आहे.",
    "भारत एकल नागरिकत्वाची संकल्पना स्वीकारतो. नागरिकत्वाशी संबंधित विषयात संसदेला कायदे करण्याचा अधिकार आहे.",
    "Assam Accord आणि Citizenship Amendment Act, 2019 यांसारख्या विशेष संदर्भांचाही उल्लेख आहे."
  ],facts:["Constitutional citizenship → Part II","Citizenship Act → 1955","Single citizenship → भारतीय संघासाठी एकच नागरिकत्व","Citizenship ≠ domicile"]},
  {id:"p1-08",part:"Part 1",chapter:"08 • Amendment to the Constitution",title:"संविधान दुरुस्ती",subtitle:"Article 368 आणि amendment procedures",body:[
    "संविधान बदलण्याची गरज आणि संविधानाच्या स्थैर्याबरोबर बदलाची क्षमता राखण्याची आवश्यकता स्पष्ट केली आहे.",
    "दुरुस्तीच्या पद्धतींमध्ये काही तरतुदी साध्या बहुमताने, काही विशेष बहुमताने आणि संघराज्यात्मक महत्त्वाच्या विषयांमध्ये किमान निम्म्या राज्यांच्या मान्यतेसह बदलल्या जातात.",
    "Article 368 अंतर्गत Parliament ची भूमिका महत्त्वाची आहे; परंतु basic structure doctrine मुळे amendment power अमर्यादित नाही.",
    "विविध घटनादुरुस्त्या आणि amendment process चे तुलनात्मक विश्लेषण दिले आहे."
  ],facts:["Simple majority → काही विशिष्ट घटनात्मक बाबी","Special majority → Article 368 procedure","State ratification → federal provisions","Amendment power → basic structure limitation"]},
  {id:"p1-09",part:"Part 1",chapter:"09 • Basic Structure",title:"मूलभूत रचना सिद्धांत",subtitle:"Parliamentary amendment power वर घटनात्मक मर्यादा",body:[
    "Basic Structure doctrine नुसार संसदेला संविधान दुरुस्त करण्याचा व्यापक अधिकार असला तरी संविधानाची मूलभूत ओळख नष्ट करता येत नाही.",
    "Kesavananda Bharati v. State of Kerala (1973) या निर्णयाला या सिद्धांताच्या विकासातील निर्णायक टप्पा म्हणून मांडले आहे.",
    "Judicial review, constitutional supremacy, secularism, federalism, democracy आणि rule of law यांसारखी तत्त्वे न्यायालयीन व्याख्यांमध्ये basic structure शी जोडली गेली आहेत.",
    "हा सिद्धांत constitutional continuity आणि constitutional change यांच्यातील संतुलन म्हणून अभ्यासता येतो."
  ],facts:["Kesavananda Bharati → 1973","Basic structure → amendment power वर substantive limitation","Constitutional supremacy → मूलभूत चौकटीचे संरक्षण","Judicial review → doctrine च्या संरक्षणातील महत्त्वाचे साधन"]},
  {id:"p1-10",part:"Part 1",chapter:"10 • Fundamental Rights",title:"मूलभूत अधिकार",subtitle:"Articles 12–35 आणि न्यायालयीन संरक्षण",body:[
    "Fundamental Rights चा उद्देश व्यक्तीच्या स्वातंत्र्याचे आणि समानतेचे संरक्षण करणे असा मांडला आहे. Part III मधील अधिकार राज्याच्या कृतीवर घटनात्मक मर्यादा आणतात.",
    "Article 14 समानता, Articles 15–16 भेदभाव व सार्वजनिक रोजगारातील समान संधी, Article 17 अस्पृश्यता निर्मूलन आणि Article 18 titles बाबत तरतुदी देतात.",
    "Article 19 मधील स्वातंत्र्ये, Article 20 गुन्हेगारी प्रकरणातील संरक्षण, Article 21 जीवन व वैयक्तिक स्वातंत्र्य आणि Article 21A शिक्षणाचा अधिकार यांचा सविस्तर अभ्यास आहे.",
    "Articles 25–30 धर्मस्वातंत्र्य आणि सांस्कृतिक/शैक्षणिक अधिकारांशी संबंधित आहेत. Article 32 constitutional remedies देतो; Articles 33–35 विशेष परिस्थितींमध्ये Parliament ची भूमिका स्पष्ट करतात."
  ],facts:["Article 14 → equality before law + equal protection","Article 19 → specified freedoms","Article 21 → life and personal liberty","Article 32 → constitutional remedies","Articles 33–35 → special restrictions/legislative competence"]},
  {id:"p1-11",part:"Part 1",chapter:"11 • DPSP",title:"राज्याच्या मार्गदर्शक तत्त्वे",subtitle:"Part IV: welfare-oriented constitutional goals",body:[
    "Directive Principles of State Policy हे राज्याच्या धोरणनिर्मितीसाठी मार्गदर्शक तत्त्वे आहेत. ते न्यायालयीन अंमलबजावणीयोग्य नसले तरी शासनासाठी मूलभूत मानले जातात.",
    "सामाजिक, आर्थिक आणि राजकीय न्याय, समानता, ग्रामपंचायती, कामगार कल्याण, सार्वजनिक आरोग्य, पर्यावरण, आंतरराष्ट्रीय शांतता आणि समान नागरी संहितेचा संदर्भ दिला आहे.",
    "Fundamental Rights आणि DPSP यांच्यातील संबंध भारतीय संविधानातील rights–welfare balance समजण्यासाठी महत्त्वाचा आहे.",
    "Minerva Mills सारख्या न्यायालयीन दृष्टिकोनातून Fundamental Rights आणि DPSP यांच्यातील संतुलनावर भर दिला आहे."
  ],facts:["Part IV → Articles 36–51","Non-justiciable but fundamental in governance","Welfare State orientation","FR + DPSP → constitutional balance"]},
  {id:"p1-12",part:"Part 1",chapter:"12 • Fundamental Duties",title:"मूलभूत कर्तव्ये",subtitle:"Article 51A आणि नागरिकांची घटनात्मक जबाबदारी",body:[
    "मूलभूत कर्तव्ये Part IV-A मध्ये Article 51A अंतर्गत आहेत. ती नागरिकांच्या नैतिक व नागरी जबाबदाऱ्या म्हणून स्पष्ट केली आहेत.",
    "42व्या घटनादुरुस्तीने कर्तव्यांचा समावेश केला; वैज्ञानिक दृष्टिकोन, पर्यावरण संरक्षण, सार्वजनिक मालमत्तेचे संरक्षण, राष्ट्रीय एकात्मता आणि संविधानाचा आदर यांसारख्या कर्तव्यांचा संदर्भ आहे.",
    "मूलभूत कर्तव्ये Fundamental Rights प्रमाणे थेट न्यायालयीन remedies देत नाहीत; त्यांचे स्वरूप प्रामुख्याने civic obligations चे आहे.",
    "Rights आणि Duties यांच्यातील परस्परपूरक संबंधावरही चर्चा आहे."
  ],facts:["Part IV-A → Article 51A","42nd Amendment → मूलभूत कर्तव्यांचा समावेश","Non-justiciable character → थेट न्यायालयीन remedy नाही","Rights + Duties → नागरिकत्वाचा संतुलित दृष्टिकोन"]},
  {id:"p1-13",part:"Part 1",chapter:"13 • Centre-State Relations",title:"केंद्र–राज्य संबंध",subtitle:"Legislative, administrative आणि financial relations",body:[
    "Centre–State relations चे legislative, administrative आणि financial असे तीन प्रमुख आयाम स्पष्ट केले आहेत.",
    "Seventh Schedule मधील Union, State आणि Concurrent Lists हे legislative distribution चे केंद्र आहे. काही exceptional परिस्थितीत Parliament ला State List वर कायदे करण्याचे अधिकार मिळतात.",
    "Articles 249, 250, 252, 253 आणि 356 यांसारख्या घटनात्मक मार्गांनी केंद्राची legislative भूमिका विशिष्ट परिस्थितीत वाढू शकते.",
    "Governor reservation, President sanction आणि financial emergency-related mechanisms यांसारख्या बाबींमधून केंद्राचा प्रभाव राज्य विधिमंडळावर कसा पडतो हे मांडले आहे."
  ],facts:["3 Lists → Union, State, Concurrent","Article 249 → national interest","Article 253 → international agreements","Article 356 → President’s Rule context"]},
  {id:"p1-14",part:"Part 1",chapter:"14 • Emergency Provisions",title:"आणीबाणीच्या तरतुदी",subtitle:"National, State आणि Financial Emergency",body:[
    "संविधानातील exceptional situations साठी तीन प्रकारच्या emergency provisions चा अभ्यास आहे.",
    "National Emergency, President’s Rule आणि Financial Emergency यांच्या घटनात्मक आधार, परिणाम आणि संसदीय नियंत्रणाचा तुलनात्मक विचार केला आहे.",
    "Emergency powers मध्ये केंद्राची भूमिका वाढते; त्यामुळे constitutional safeguards, legislative approval आणि अधिकारांवरील परिणाम महत्त्वाचे ठरतात.",
    "मूलभूत अधिकारांवर emergency चा परिणाम आणि constitutional accountability यांचाही अभ्यास केला आहे."
  ],facts:["Article 352 → National Emergency","Article 356 → President’s Rule","Article 360 → Financial Emergency","Emergency → Centre-State balance वर परिणाम"]},
  {id:"p1-15",part:"Part 1",chapter:"15 • Union Executive-I",title:"संघ कार्यपालिका–I",subtitle:"President आणि Vice-President",body:[
    "President चे constitutional position, election, qualifications, term, powers, impeachment आणि emergency-related role यांचा अभ्यास आहे.",
    "President हा constitutional head असून संसदीय व्यवस्थेत अनेक कार्यकारी अधिकार Council of Ministers च्या advice च्या चौकटीत वापरतो.",
    "Vice-President हा Rajya Sabha चा ex-officio Chairman असतो आणि त्याच्या election व removal ची स्वतंत्र घटनात्मक प्रक्रिया आहे.",
    "President च्या legislative, executive, financial, judicial आणि diplomatic functions चा वर्गीकरणात्मक आढावा दिला आहे."
  ],facts:["Article 52 → President","Article 54 → election","Article 61 → impeachment","Vice-President → ex-officio Chairman of Rajya Sabha"]},
  {id:"p1-16",part:"Part 1",chapter:"16 • Union Executive-II",title:"संघ कार्यपालिका–II",subtitle:"Prime Minister, Council of Ministers आणि Attorney General",body:[
    "Prime Minister हा भारतातील real executive चा केंद्रबिंदू आहे. President आणि Prime Minister यांच्या de jure/de facto भूमिकेतील फरक स्पष्ट केला आहे.",
    "Article 75 नुसार Prime Minister ची नियुक्ती President करतो; सामान्यतः लोकसभेतील बहुमत पक्ष/आघाडीचा नेता या पदावर येतो.",
    "Council of Ministers लोकसभेसमोर collective responsibility तत्त्वावर कार्य करते. Cabinet decision-making आणि Prime Minister चे coordination role दिले आहे.",
    "Attorney General हा Union चा सर्वोच्च कायदेविषयक अधिकारी आहे; त्याची नियुक्ती President करतो आणि त्याचे constitutional functions स्पष्ट केले आहेत."
  ],facts:["PM → head of government","Council of Ministers → collective responsibility to Lok Sabha","Cabinet → core decision-making body","Attorney General → highest law officer of Union"]},
  {id:"p1-17",part:"Part 1",chapter:"17 • State Executive",title:"राज्य कार्यपालिका",subtitle:"Governor, Chief Minister आणि State Council of Ministers",body:[
    "Governor चे constitutional position, appointment, powers, discretion, tenure आणि Centre–State relations मधील भूमिका स्पष्ट केली आहे.",
    "Chief Minister हा राज्यातील real executive चा प्रमुख असतो आणि Council of Ministers त्याच्या नेतृत्वाखाली कार्य करते.",
    "Governor ची काही कार्ये discretionary असू शकतात; sources मध्ये सरकार स्थापनेच्या परिस्थिती, bill reservation आणि constitutional machinery यांसारख्या बाबींचा संदर्भ आहे.",
    "Sarkaria Commission ने Governor नियुक्तीबाबत eminent person, non-partisan background, consultation आणि tenure safeguards यांसारख्या शिफारसी केल्याचे नमूद आहे."
  ],facts:["Governor → constitutional head of State","CM → real executive","Council of Ministers → collective responsibility to State Assembly","Sarkaria Commission → Governor-related recommendations"]},
  {id:"p1-18",part:"Part 1",chapter:"18 • Parliament",title:"संसद",subtitle:"Lok Sabha, Rajya Sabha आणि parliamentary procedure",body:[
    "Parliament ची रचना, अधिकार, sessions, legislative procedure, financial business, privileges आणि parliamentary control over executive यांचा सविस्तर अभ्यास आहे.",
    "Lok Sabha आणि Rajya Sabha यांच्या रचनेत, निवड पद्धतीत, कार्यकाळात आणि विशेष अधिकारांमध्ये फरक आहे.",
    "Bill पास होण्याची प्रक्रिया, Money Bill, Budget, joint sitting, parliamentary privileges आणि executive accountability हे प्रमुख भाग आहेत.",
    "संसद ही कायदे निर्मितीबरोबरच चर्चा, प्रतिनिधित्व, आर्थिक नियंत्रण आणि कार्यपालिकेची उत्तरदायित्व तपासणारी संस्था आहे."
  ],facts:["Parliament → President + Lok Sabha + Rajya Sabha","Money Bill → Lok Sabha विशेष भूमिका","Budget → parliamentary financial control","Collective responsibility → executive accountability"]},
  {id:"p1-19",part:"Part 1",chapter:"19 • Parliamentary Committees",title:"संसदीय समित्या आणि Indian Parliamentary Groups",subtitle:"Detailed legislative scrutiny",body:[
    "Parliamentary committees संसदेला विधेयक, खर्च, प्रशासन आणि धोरणांची अधिक सखोल तपासणी करण्यास मदत करतात.",
    "Public Accounts Committee, Estimates Committee आणि Committee on Public Undertakings यांसारख्या financial committees चा अभ्यास आहे.",
    "Department-related Standing Committees, Joint Parliamentary Committees आणि इतर समित्या executive accountability आणि detailed scrutiny साठी वापरल्या जातात.",
    "Indian Parliamentary Group ही संसदीय diplomacy आणि आंतर-संसदीय संबंधांशी संबंधित व्यवस्था म्हणून मांडली आहे."
  ],facts:["PAC → public expenditure scrutiny","Estimates Committee → estimates आणि economy/efficiency","DRSCs → ministry-wise scrutiny","JPC → specified matters वर संयुक्त तपासणी"]},
  {id:"p1-20",part:"Part 1",chapter:"20 • State Legislature",title:"राज्य विधिमंडळ",subtitle:"Legislative Assembly आणि Legislative Council",body:[
    "State Legislature ची रचना, bicameralism, सदस्यत्व, sessions, legislative procedure आणि financial powers यांचा अभ्यास आहे.",
    "Legislative Assembly ही राज्यातील प्रमुख directly elected chamber आहे; काही राज्यांमध्ये Legislative Council हे second chamber असते.",
    "Governor ची भूमिका, Money Bills, Council ची निर्मिती/रद्दबातल प्रक्रिया आणि State Legislature चे privileges स्पष्ट केले आहेत.",
    "State Legislature च्या माध्यमातून राज्य कार्यपालिकेवर प्रश्नोत्तर, चर्चा, समित्या आणि financial control द्वारे उत्तरदायित्व आणले जाते."
  ],facts:["Assembly → directly elected chamber","Council → काही राज्यांत second chamber","State Money Bill → Assembly ची प्रमुख भूमिका","Legislative accountability → प्रश्न, चर्चा, समित्या"]},
  {id:"p1-21",part:"Part 1",chapter:"21 • Supreme Court",title:"सर्वोच्च न्यायालय",subtitle:"Constitutional court आणि guardian of rights",body:[
    "Supreme Court ची रचना, न्यायाधीशांची नियुक्ती, jurisdiction, writs, appellate powers, advisory jurisdiction आणि contempt powers यांचा अभ्यास आहे.",
    "Article 32 अंतर्गत Fundamental Rights च्या enforcement साठी Supreme Court ला writ jurisdiction आहे. Article 141 नुसार Supreme Court ने घोषित केलेले law सर्व courts वर binding असते.",
    "Judicial review अंतर्गत legislative आणि executive actions ची constitutionality तपासता येते. review आणि curative petition चा संदर्भही दिला आहे.",
    "PIL, judicial interpretation आणि constitutional adjudication यांमधून Supreme Court ची भूमिका विकसित झाली आहे."
  ],facts:["Article 32 → writ jurisdiction for FR","Article 137 → review power","Article 141 → binding precedent","Article 142 → complete justice"]},
  {id:"p1-22",part:"Part 1",chapter:"22 • High Court",title:"उच्च न्यायालय",subtitle:"State-level constitutional and appellate court",body:[
    "High Court ची स्थापना, composition, appointment, jurisdiction, writ power आणि judicial control यांचा अभ्यास आहे.",
    "Article 226 अंतर्गत High Courts Fundamental Rights तसेच अन्य legal rights च्या enforcement साठी writs जारी करू शकतात.",
    "High Court ची territorial jurisdiction आणि judicial superintendence over subordinate courts ही महत्त्वाची वैशिष्ट्ये आहेत.",
    "Judicial independence साठी judges च्या tenure, removal आणि constitutional safeguards यांचा आढावा आहे."
  ],facts:["Article 214 → High Court for State","Article 226 → writ jurisdiction","Article 227 → superintendence","High Court → FR + other legal rights enforcement"]},
  {id:"p1-23",part:"Part 1",chapter:"23 • Subordinate Courts",title:"अधीनस्थ न्यायालये",subtitle:"District judiciary आणि State judicial administration",body:[
    "subordinate judiciary ची रचना आणि High Court च्या नियंत्रणाखाली तिचे कार्य यांचा संक्षिप्त अभ्यास आहे.",
    "District courts आणि subordinate civil/criminal courts नागरिकांना न्यायप्रवेशाची मूलभूत पातळी उपलब्ध करून देतात.",
    "Judicial independence, appointment mechanisms आणि High Court supervision हे subordinate judiciary च्या कार्यक्षमतेसाठी महत्त्वाचे घटक आहेत.",
    "न्यायालयीन सुधारणा आणि pendency reduction च्या व्यापक संदर्भात district judiciary चे महत्त्व न्यायव्यवस्था चर्चेशी जोडलेले आहे."
  ],facts:["District judiciary → grassroots justice delivery","High Court → control/superintendence","Civil + criminal jurisdiction → subordinate court structure"]},
  {id:"p1-24",part:"Part 1",chapter:"24 • ADR and Other Courts",title:"पर्यायी विवाद निवारण आणि इतर न्यायव्यवस्था",subtitle:"ADR, Lok Adalat आणि specialised forums",body:[
    "Alternative Dispute Resolution चा उद्देश पारंपरिक न्यायालयीन प्रक्रियेवरील भार कमी करून विवाद जलद आणि कमी खर्चात सोडवण्याचे पर्याय उपलब्ध करणे हा आहे.",
    "arbitration, mediation, conciliation आणि Lok Adalat यांसारख्या mechanisms चा अभ्यास आहे.",
    "Lok Adalat मध्ये settlement-oriented प्रक्रिया वापरली जाते; न्यायप्रवेश, कमी खर्च आणि तडजोडीला प्रोत्साहन हे त्याचे प्रमुख पैलू आहेत.",
    "विशेषीकृत न्यायव्यवस्था आणि ADR mechanisms न्यायालयीन pendency कमी करण्याच्या व्यापक reform agenda शी जोडलेले आहेत."
  ],facts:["ADR → speed + flexibility + reduced litigation burden","Lok Adalat → settlement-oriented mechanism","Mediation → facilitated negotiation","Arbitration → private adjudicatory process"]},
  {id:"p1-25",part:"Part 1",chapter:"25 • Tribunals",title:"न्यायाधिकरणे (Tribunals)",subtitle:"Specialised adjudication",body:[
    "Tribunals हे विशिष्ट प्रकारच्या disputes साठी specialised adjudicatory forums म्हणून विकसित झाले. त्यांचा constitutional आणि statutory आधार स्पष्ट केला आहे.",
    "Administrative, tax, service, environment आणि इतर क्षेत्रांमध्ये specialised expertise वापरणे हा tribunal system चा महत्त्वाचा उद्देश आहे.",
    "Tribunal reforms मध्ये appointment, tenure, independence, jurisdiction आणि judicial review यासंबंधी प्रश्न उद्भवतात.",
    "tribunals मुळे regular courts वरील भार कमी होण्याची शक्यता आणि त्यांच्या institutional independence ची गरज दोन्ही मांडली आहे."
  ],facts:["Specialised adjudication","Expertise-based dispute resolution","Judicial review remains relevant","Independence + efficiency → tribunal reform priorities"]},
  {id:"p1-26",part:"Part 1",chapter:"26 • Judicial Review, Activism and Overreach",title:"Judicial Review, Judicial Activism आणि Judicial Overreach",subtitle:"Judiciary–legislature–executive balance",body:[
    "Judicial review म्हणजे legislative आणि executive actions ची constitutional validity तपासण्याचा न्यायालयाचा अधिकार. हा power constitutional supremacy शी जोडला आहे.",
    "Judicial activism मध्ये न्यायालये constitutional values आणि rights च्या संरक्षणासाठी व्यापक व्याख्या किंवा सक्रिय intervention करतात.",
    "Judicial overreach हा शब्द अशा परिस्थितीच्या चर्चेसाठी वापरला जातो जिथे न्यायालयीन intervention separation of powers च्या सीमांबद्दल प्रश्न निर्माण करते.",
    "Golaknath, Kesavananda Bharati, Minerva Mills आणि NJAC यांसारख्या प्रकरणांच्या माध्यमातून judicial review चा विकास दाखवला आहे."
  ],facts:["Judicial review → constitutionality test","Judicial activism → active constitutional interpretation","Judicial overreach → separation-of-powers concern","Basic structure → amendment review"]},
  {id:"p1-27",part:"Part 1",chapter:"27 • Judiciary Reforms",title:"न्यायव्यवस्था: सुधारणा आणि अलीकडील प्रवाह",subtitle:"Access, pendency, independence आणि technology",body:[
    "judicial pendency, न्यायप्रवेश, infrastructure, vacancies, case management आणि technology-based reforms यांसारख्या समस्यांचा अभ्यास आहे.",
    "E-Courts, digitisation, alternative dispute resolution आणि process reforms यांचा उद्देश न्यायप्रक्रिया अधिक accessible आणि efficient करणे हा आहे.",
    "Judicial independence आणि accountability यांच्यात संतुलन राखणे हा न्यायव्यवस्थेतील प्रमुख institutional प्रश्न म्हणून मांडला आहे.",
    "PIL आणि न्यायालयीन सक्रियतेच्या सकारात्मक परिणामांसोबत frivolous litigation आणि judicial overreach बाबत सावधगिरीची गरजही नमूद केले आहे."
  ],facts:["Pendency → access to justice challenge","E-Courts → technology-enabled justice delivery","Infrastructure + vacancies → capacity concerns","Independence + accountability → reform balance"]},
  {id:"p1-28",part:"Part 1",chapter:"28 • Panchayati Raj",title:"पंचायतराज",subtitle:"73rd Amendment आणि rural decentralisation",body:[
    "73व्या घटनादुरुस्तीने Panchayati Raj Institutions ला घटनात्मक चौकट दिली. rural decentralisation, representation आणि local planning यांचा अभ्यास आहे.",
    "Gram Sabha, three-tier Panchayati Raj structure, reservation, State Election Commission आणि State Finance Commission हे प्रमुख घटक आहेत.",
    "Eleventh Schedule मध्ये स्थानिक संस्थांशी संबंधित विषयांची यादी दिली आहे; वास्तविक devolution राज्यांच्या धोरणांवर अवलंबून राहते.",
    "स्थानिक लोकशाहीचा उद्देश decision-making नागरिकांच्या जवळ नेणे आणि participatory development मजबूत करणे हा आहे."
  ],facts:["73rd Amendment → Panchayati Raj constitutionalisation","Gram Sabha → direct local participation","11th Schedule → 29 subjects","Reservation → SC/ST + women representation"]},
  {id:"p1-29",part:"Part 1",chapter:"29 • Municipalities",title:"नगरपालिका",subtitle:"74th Amendment आणि urban local governance",body:[
    "74व्या घटनादुरुस्तीने urban local bodies ला घटनात्मक चौकट दिली. नगरपालिकांची रचना, प्रकार आणि functions चा अभ्यास आहे.",
    "Nagar Panchayat, Municipal Council आणि Municipal Corporation हे urban local bodies चे प्रमुख प्रकार आहेत.",
    "Twelfth Schedule मध्ये urban planning, public health, sanitation, water supply आणि इतर नागरी कार्यांचा संदर्भ आहे.",
    "Urban governance मध्ये finance, capacity, planning आणि citizen participation यांचा समन्वय आवश्यक असल्याचे decentralisation framework मधून दिसते."
  ],facts:["74th Amendment → urban local governance","Nagar Panchayat → transitional area","Municipal Council → smaller urban area","Municipal Corporation → larger urban area"]},
  {id:"p1-30",part:"Part 1",chapter:"30 • Cooperative Societies",title:"सहकारी संस्था",subtitle:"Cooperative federalism आणि member-driven institutions",body:[
    "cooperative societies ची रचना, सदस्य-आधारित व्यवस्थापन आणि सहकाराच्या घटनात्मक स्थानाचा अभ्यास आहे.",
    "Cooperative institutions मध्ये voluntary participation, democratic member control आणि collective economic activity या संकल्पना महत्त्वाच्या आहेत.",
    "97व्या घटनादुरुस्तीने cooperative societies संदर्भातील घटनात्मक चौकट विकसित केली; cooperative federalism च्या व्यापक संदर्भाचाही उल्लेख आहे.",
    "सहकारी क्षेत्राच्या स्वायत्तता, पारदर्शकता आणि उत्तरदायित्व यांचा संस्थात्मक कार्यक्षमतेशी संबंध जोडला आहे."
  ],facts:["Cooperation → member-driven collective institution","97th Amendment → cooperative constitutional framework","Democratic control → member participation","Autonomy + accountability → cooperative governance"]},
];

export const polityPart2Sections: PolitySection[] = [
  {id:"p2-31",part:"Part 2",chapter:"31 • Special Provisions for Some States",title:"काही राज्यांसाठी विशेष तरतुदी",subtitle:"Articles 371–371J आणि asymmetric federalism",body:[
    "Part XXI अंतर्गत काही राज्यांच्या ऐतिहासिक, सामाजिक, सांस्कृतिक आणि प्रशासकीय वैशिष्ट्यांनुसार विशेष तरतुदी करण्यात आल्या आहेत.",
    "Maharashtra आणि Gujarat साठी Article 371 अंतर्गत development boards, निधीचे equitable allocation, technical education आणि employment opportunities यांचा संदर्भ आहे.",
    "Nagaland, Assam, Manipur, Andhra Pradesh/Telangana, Sikkim, Mizoram, Arunachal Pradesh, Goa आणि Karnataka संदर्भातील विविध विशेष provisions चा आढावा आहे.",
    "या तरतुदी भारतीय संघराज्यात plurality, integration, protection आणि decentralisation यांच्यात संतुलन साधण्याच्या दृष्टिकोनातून मांडल्या आहेत."
  ],facts:["Article 371 → Maharashtra/Gujarat specific provisions","371A → Nagaland","371G → Mizoram","371J → Karnataka special provisions"]},
  {id:"p2-32",part:"Part 2",chapter:"32 • Scheduled and Tribal Areas",title:"अनुसूचित आणि आदिवासी क्षेत्रे",subtitle:"Fifth आणि Sixth Schedule",body:[
    "Article 244 अंतर्गत Fifth Schedule आणि Sixth Schedule द्वारे Scheduled Areas आणि Tribal Areas साठी विशेष प्रशासनिक व्यवस्था दिली आहे.",
    "Fifth Schedule Assam, Meghalaya, Tripura आणि Mizoram वगळता इतर संबंधित Scheduled Areas च्या प्रशासनाशी संबंधित आहे; Sixth Schedule या चार ईशान्य राज्यांतील tribal areas शी संबंधित आहे.",
    "Governor, Tribes Advisory Council आणि President यांची भूमिका Fifth Schedule administration मध्ये महत्त्वाची आहे. Sixth Schedule मध्ये autonomous district/regional councils ला विशेष अधिकार आहेत.",
    "tribal self-governance, customary practices, land protection आणि development यांच्यातील संतुलनाचा अभ्यास केला आहे."
  ],facts:["Article 244 → Scheduled/Tribal Areas","Fifth Schedule → Scheduled Areas","Sixth Schedule → specified North-East tribal areas","Autonomous Councils → local self-governance"]},
  {id:"p2-33",part:"Part 2",chapter:"33 • CAG",title:"भारताचे नियंत्रक आणि महालेखापरीक्षक (CAG)",subtitle:"Public financial accountability",body:[
    "CAG हा संविधानिक प्राधिकरण असून सार्वजनिक निधीच्या वापराचे audit करून legislative financial accountability मजबूत करतो.",
    "CAG ची नियुक्ती, tenure, removal safeguards आणि audit jurisdiction चा आढावा आहे.",
    "Union आणि State accounts, government expenditure, public sector-related audit आणि performance-oriented audit हे त्याच्या व्यापक कार्यक्षेत्राशी जोडले आहेत.",
    "CAG reports संसद किंवा संबंधित State Legislature समोर मांडले जातात आणि Public Accounts Committee सारख्या संस्थांद्वारे त्यांची पुढील तपासणी होते."
  ],facts:["Article 148 → CAG","Audit → financial accountability","Reports → Legislature","PAC → audit findings वर संसदीय scrutiny"]},
  {id:"p2-34",part:"Part 2",chapter:"34 • GST Council",title:"GST Council",subtitle:"Cooperative federalism in indirect taxation",body:[
    "GST Council ही संविधानिक संस्था असून Centre आणि States यांच्या सहभागातून GST-related recommendations करण्यासाठी तयार झाली आहे.",
    "Council ची composition, voting framework, functions आणि cooperative federalism मधील भूमिका स्पष्ट केली आहे.",
    "Rate structure, exemptions, model laws, place-of-supply-related matters आणि GST implementation शी संबंधित policy coordination यांचा अभ्यास केला आहे.",
    "consensus-building, transparency, stakeholder engagement आणि capacity building यांसारख्या सुधारणा उपायांचाही उल्लेख आहे."
  ],facts:["Article 279A → GST Council","Centre + States → joint institutional platform","GST → indirect tax harmonisation","Cooperative federalism → core institutional principle"]},
  {id:"p2-35",part:"Part 2",chapter:"35 • Finance Commission",title:"वित्त आयोग",subtitle:"Vertical आणि horizontal fiscal devolution",body:[
    "Article 280 अंतर्गत Finance Commission हा President कडून सामान्यतः प्रत्येक पाच वर्षांनी स्थापन होणारा constitutional body आहे.",
    "divisible pool मधील Union–State tax sharing, States मधील horizontal distribution आणि grants-in-aid बाबत recommendations यांचा अभ्यास आहे.",
    "Finance Commission मध्ये Chairman आणि चार अन्य members असतात; qualifications आणि procedure Parliament च्या कायद्याने ठरवले आहेत.",
    "हा आयोग quasi-judicial powers सारख्या काही procedural powers वापरू शकतो आणि fiscal federalism मध्ये महत्त्वाची भूमिका बजावतो."
  ],facts:["Article 280 → Finance Commission","Vertical devolution → Union–States","Horizontal devolution → States among themselves","Fiscal federalism → core function"]},
  {id:"p2-36",part:"Part 2",chapter:"36 • Services Under Union and State",title:"केंद्र आणि राज्यांच्या सेवा",subtitle:"Civil services, recruitment आणि service safeguards",body:[
    "Union आणि State services ची घटनात्मक चौकट, recruitment, conditions of service आणि All India Services यांचा अभ्यास आहे.",
    "Public Service Commissions merit-based recruitment आणि service-related constitutional functions पार पाडतात.",
    "Article 311 अंतर्गत civil servants ना dismissal, removal किंवा reduction in rank बाबत काही procedural safeguards दिले आहेत.",
    "Civil services कडून policy implementation, continuity, neutrality, expertise आणि public administration मध्ये institutional memory यांची अपेक्षा केली जाते."
  ],facts:["Article 309 → service rules","Article 310 → pleasure doctrine","Article 311 → safeguards","All India Services → Union-State administrative linkage"]},
  {id:"p2-37",part:"Part 2",chapter:"37 • Election Commission",title:"भारताचा निवडणूक आयोग",subtitle:"Free and fair electoral administration",body:[
    "Election Commission of India हा Article 324 अंतर्गत निवडणूक व्यवस्थापनासाठी constitutional authority आहे.",
    "electoral rolls, election scheduling, recognition of political parties, symbols आणि Model Code of Conduct-संबंधित भूमिका यांचा आढावा आहे.",
    "स्वतंत्र आणि विश्वासार्ह निवडणूक व्यवस्थेसाठी voter registration, polling administration, counting आणि electoral reforms महत्त्वाचे आहेत.",
    "Election Commission च्या स्वायत्ततेशी संबंधित आव्हाने आणि निवडणूक प्रक्रियेतील सुधारणा यांचाही अभ्यास केला आहे."
  ],facts:["Article 324 → Election Commission","Electoral rolls → voter administration","Political party recognition → ECI role","Free and fair elections → constitutional objective"]},
  {id:"p2-38",part:"Part 2",chapter:"38 • Special Provisions Related to Certain Classes",title:"विशिष्ट वर्गांसाठी विशेष तरतुदी",subtitle:"SC, ST आणि अन्य संवैधानिक संरक्षण",body:[
    "सामाजिकदृष्ट्या वंचित वर्गांसाठी constitutional safeguards, representation, commissions आणि affirmative measures यांचा अभ्यास आहे.",
    "Scheduled Castes आणि Scheduled Tribes साठी legislative representation, safeguards आणि constitutional commissions ची चौकट दिली आहे.",
    "National Commission for Scheduled Castes आणि National Commission for Scheduled Tribes यांच्या माध्यमातून safeguards चे monitoring आणि grievances चा विचार केला जातो.",
    "समानता आणि सामाजिक न्याय साध्य करण्यासाठी formal equality सोबत protective/affirmative measures चा उपयोग स्पष्ट केला आहे."
  ],facts:["Protective discrimination → substantive equality","SC/ST safeguards → constitutional protection","Representation → political inclusion","Commissions → monitoring and grievance functions"]},
  {id:"p2-39",part:"Part 2",chapter:"39 • Linguistic Minorities and Official Language",title:"भाषिक अल्पसंख्याक आणि अधिकृत भाषा",subtitle:"Articles 346–351 आणि linguistic safeguards",body:[
    "Official Language संबंधी constitutional provisions, Union–State communication आणि न्यायालयीन भाषेचा आढावा आहे.",
    "Articles 346–348 अंतर्गत inter-government communication आणि courts मधील language framework समजावले आहे.",
    "Official Languages Act, 1963 चा संदर्भ देत official language policy च्या व्यावहारिक पैलूंची चर्चा केली आहे.",
    "भाषिक अल्पसंख्याकांसाठी Special Officer ची व्यवस्था आणि भाषिक विविधतेचे संरक्षण हे भारतीय संघराज्याच्या समावेशक स्वरूपाशी जोडले आहे."
  ],facts:["Article 343 → Union official language framework","Articles 346–348 → communication/judiciary language","Official Languages Act 1963","Linguistic minorities → constitutional safeguards"]},
  {id:"p2-40",part:"Part 2",chapter:"40 • NITI Aayog",title:"NITI Aayog",subtitle:"Policy think tank आणि cooperative federalism",body:[
    "NITI Aayog ही Government of India ची policy think tank संस्था म्हणून कार्य करते. Planning Commission नंतरच्या policy architecture चा संदर्भ दिला आहे.",
    "Governing Council, specialised wings, Development Monitoring and Evaluation Office आणि research-oriented functions यांचा अभ्यास आहे.",
    "Cooperative federalism, competitive federalism, bottom-up planning, innovation आणि outcome-oriented policy support हे NITI Aayog च्या प्रमुख दृष्टिकोनांशी जोडले आहेत.",
    "Five-Year Plans च्या पारंपरिक framework ऐवजी long-term vision, strategy आणि action-oriented policy framework वर भर दिला आहे."
  ],facts:["NITI Aayog → policy think tank","Governing Council → Centre-State platform","Cooperative + competitive federalism","Vision → Strategy → Action Plan"]},
  {id:"p2-41",part:"Part 2",chapter:"41 • Human Rights Commission",title:"मानवाधिकार आयोग",subtitle:"Human rights protection framework",body:[
    "National Human Rights Commission हा human rights protection साठी statutory institutional mechanism आहे. त्याची रचना, functions आणि limitations चा अभ्यास आहे.",
    "NHRC complaints, inquiries, prison/other institutional conditions, human rights awareness आणि recommendations यांसारख्या कार्यांशी संबंधित आहे.",
    "State Human Rights Commissions आणि human rights courts यांचाही संदर्भ आहे.",
    "Human rights institutions च्या प्रभावासाठी independence, resources, implementation of recommendations आणि awareness महत्त्वाचे असल्याचे चर्चेत दिसते."
  ],facts:["NHRC → statutory human-rights body","Inquiry + recommendations → प्रमुख functions","SHRC → state-level mechanism","Human rights → dignity + liberty + equality"]},
  {id:"p2-42",part:"Part 2",chapter:"42 • National Commission for Women",title:"राष्ट्रीय महिला आयोग",subtitle:"Women’s rights and institutional advocacy",body:[
    "National Commission for Women हा महिलांच्या हक्कांशी संबंधित कायदे, धोरणे आणि तक्रारींच्या संदर्भात statutory mechanism आहे.",
    "complaints, investigation-related functions, legal awareness, policy recommendations आणि review of safeguards यांचा अभ्यास आहे.",
    "महिलांविरुद्ध भेदभाव, violence आणि unequal access यांसारख्या प्रश्नांवर institutional monitoring महत्त्वाचे आहे.",
    "NCW च्या कार्यक्षमतेसाठी awareness, coordination आणि recommendations च्या implementation शी जोडलेले प्रश्न विचारात घेतले आहेत."
  ],facts:["NCW → statutory women’s rights institution","Complaints + inquiry","Legal awareness","Policy and legislative recommendations"]},
  {id:"p2-43",part:"Part 2",chapter:"43 • NCPCR",title:"राष्ट्रीय बालहक्क संरक्षण आयोग",subtitle:"Children’s rights आणि protection mechanisms",body:[
    "NCPCR हा मुलांच्या हक्कांच्या संरक्षणासाठी statutory commission आहे. child rights framework आणि institutional functions चा आढावा आहे.",
    "बालहक्क, शिक्षण, संरक्षण, exploitation आणि child-friendly justice या संदर्भातील safeguards ची तपासणी आयोगाच्या व्यापक कार्याशी जोडली आहे.",
    "Complaints, inquiry, monitoring आणि policy recommendations ही institutional tools आहेत.",
    "बालकांच्या सर्वोत्तम हिताचा दृष्टिकोन आणि constitutional/statutory protections यांच्यातील संबंध अधोरेखित केला आहे."
  ],facts:["NCPCR → child rights protection","Monitoring + inquiry","Child-friendly governance","Best interests of child → policy principle"]},
  {id:"p2-44",part:"Part 2",chapter:"44 • National Commission for Minorities",title:"राष्ट्रीय अल्पसंख्याक आयोग",subtitle:"Minority safeguards and institutional oversight",body:[
    "National Commission for Minorities हा notified minorities च्या safeguards आणि development-related concerns च्या institutional monitoring साठी statutory body आहे.",
    "minority rights, complaints, safeguards, development programmes आणि government recommendations यांचा अभ्यास आहे.",
    "धार्मिक व भाषिक विविधतेच्या संदर्भात equality, non-discrimination आणि cultural identity यांचा समतोल महत्त्वाचा आहे.",
    "Institutional effectiveness साठी awareness, data, coordination आणि recommendations च्या implementation ची भूमिका मांडली आहे."
  ],facts:["NCM → minority safeguards","Complaints + monitoring","Development concerns","Pluralism → constitutional context"]},
  {id:"p2-45",part:"Part 2",chapter:"45 • Information Commissions",title:"माहिती आयोग",subtitle:"RTI framework आणि transparency",body:[
    "Right to Information framework मध्ये transparency आणि accountable governance वाढवण्यासाठी Information Commissions ची भूमिका महत्त्वाची आहे.",
    "Central Information Commission आणि State Information Commissions RTI-related appeals आणि complaints हाताळतात.",
    "information disclosure, exemptions, public authorities आणि institutional functioning यांचा अभ्यास आहे.",
    "RTI हा citizen-centric accountability mechanism म्हणून administrative opacity कमी करण्याशी जोडला आहे."
  ],facts:["RTI Act 2005 → transparency framework","CIC → central level","SIC → state level","Information disclosure → accountability tool"]},
  {id:"p2-46",part:"Part 2",chapter:"46 • Anti-Corruption Watchdogs",title:"भ्रष्टाचारविरोधी देखरेख संस्था",subtitle:"CBI, CVC, Lokpal, CIC आणि ED",body:[
    "भारतातील anti-corruption architecture मधील CBI, CVC, Lokpal/Lokayukta, CIC आणि Enforcement Directorate यांची स्वतंत्र भूमिका स्पष्ट केली आहे.",
    "CBI ची मुळे 1941 च्या Special Police Establishment मध्ये असून DSPE Act 1946 आणि 1963 मधील CBI establishment यांचा क्रम दिला आहे.",
    "CVC central vigilance framework मधील प्रमुख संस्था आहे; Lokpal आणि Lokayukta corruption complaints साठी ombudsman-style institutions म्हणून विकसित झाले.",
    "या संस्थांच्या प्रभावी कार्यासाठी independence, resources, coordination, whistleblower protection आणि clear jurisdiction यांसारख्या सुधारणा मुद्द्यांवर स्रोत चर्चा करतो."
  ],facts:["CBI → DSPE Act framework","CVC → vigilance","Lokpal → Union-level ombudsman framework","Lokayukta → State-level counterpart","RTI → transparency-based anti-corruption support"]},
  {id:"p2-47",part:"Part 2",chapter:"47 • NIA",title:"National Investigation Agency",subtitle:"राष्ट्रीय पातळीवरील दहशतवादविरोधी तपास",body:[
    "NIA ही राष्ट्रीय सुरक्षेशी संबंधित विशिष्ट गंभीर गुन्ह्यांच्या तपासासाठी statutory agency म्हणून मांडली आहे.",
    "NIA ची स्थापना, scheduled offences, investigation powers आणि State agencies सोबत coordination यांचा अभ्यास आहे.",
    "राष्ट्रीय पातळीवरील तपासासाठी specialised capacity, inter-state coordination आणि central investigative mechanism यांचे महत्त्व स्पष्ट केले आहे.",
    "Agency च्या कार्यात rule of law, due process आणि federal coordination यांचा समतोल आवश्यक आहे."
  ],facts:["NIA → statutory investigative agency","Scheduled offences → jurisdictional basis","National security → specialised investigation","Centre-State coordination → operational importance"]},
  {id:"p2-48",part:"Part 2",chapter:"48 • Bar Council of India",title:"Bar Council of India",subtitle:"Legal profession regulation आणि legal education",body:[
    "Bar Council of India ही Advocates Act framework अंतर्गत legal profession चे standards आणि professional conduct यांचे नियमन करणारी संस्था आहे.",
    "professional conduct, disciplinary committees, legal education standards आणि law universities च्या recognition ची भूमिका दिली आहे.",
    "BCI legal aid, law reform, seminars, publications आणि advocates’ welfare यांसारख्या कार्यांशीही संबंधित आहे.",
    "Institutional committees मध्ये Executive, Legal Education, Disciplinary आणि Advocate Welfare functions चा संदर्भ आहे."
  ],facts:["Professional conduct → BCI standards","Legal education → recognition and standards","Disciplinary mechanism","Legal aid + welfare"]},
  {id:"p2-49",part:"Part 2",chapter:"49 • Law Commission",title:"भारताचा विधी आयोग",subtitle:"Law reform आणि legal policy review",body:[
    "Law Commission ही law reform आणि existing laws च्या review साठी advisory/recommendatory institution म्हणून मांडली आहे.",
    "references, consultation, reports आणि legislative reform suggestions यांचा अभ्यास आहे.",
    "Law Commission च्या reports मुळे संसद आणि सरकारला कायद्यांतील बदल, codification आणि procedural सुधारणा याबाबत policy input मिळू शकतो.",
    "ही संस्था न्यायव्यवस्था, समाज आणि बदलत्या सार्वजनिक गरजा यांच्यातील कायदेशीर दुवा म्हणून पाहता येते."
  ],facts:["Law reform → core purpose","Reports → recommendations","Consultation → reform process","Legal review → policy input"]},
  {id:"p2-50",part:"Part 2",chapter:"50 • Party System",title:"पक्षव्यवस्था",subtitle:"Political parties, regional parties आणि internal democracy",body:[
    "national आणि regional political parties, party functions, internal democracy आणि भारतीय पक्षव्यवस्थेतील बदलांचा अभ्यास आहे.",
    "राजकीय पक्ष प्रतिनिधित्व, policy aggregation, political recruitment, government formation आणि opposition functions पार पाडतात.",
    "Regional parties भारताच्या संघराज्यात्मक आणि सामाजिक विविधतेचे राजकीय प्रतिनिधित्व करतात; त्याच वेळी coalition politics वर त्यांचा प्रभाव असू शकतो.",
    "Internal party democracy, funding, candidate selection आणि transparency यांना party-system reforms शी जोडले आहे."
  ],facts:["Party functions → representation + aggregation + government formation","Regional parties → federal/social representation","Internal democracy → organisational accountability","Party funding → transparency concern"]},
  {id:"p2-51",part:"Part 2",chapter:"51 • Elections, Electoral Reforms and Delimitation",title:"निवडणुका, निवडणूक सुधारणा आणि परिसीमन",subtitle:"Electoral integrity आणि representation",body:[
    "भारतीय निवडणूक प्रक्रियेतील representation, electoral rolls, campaign finance, criminalisation, voting technology, delimitation आणि free-and-fair elections यांचा विस्तृत अभ्यास आहे.",
    "Delimitation चा उद्देश लोकसंख्येच्या बदलांनुसार electoral constituencies ची पुनर्रचना करणे हा आहे; representation आणि federal balance यावर त्याचा परिणाम होतो.",
    "Electoral reforms मध्ये transparency, political funding, candidate disclosures, voter awareness आणि institutional independence यांसारख्या बाबींचा समावेश आहे.",
    "Freebies आणि subsidies यांमध्ये फरक करणे आवश्यक असल्याचे नमूद केले आहे आणि public finance व electoral fairness या दोन्ही दृष्टिकोनातून चर्चा करतो."
  ],facts:["Delimitation → constituency boundaries","Electoral reforms → transparency + fairness","Campaign finance → accountability issue","Freebies ≠ automatically subsidies → policy context matters"]},
  {id:"p2-52",part:"Part 2",chapter:"52 • Anti-Defection Law",title:"पक्षांतरबंदी कायदा",subtitle:"Political stability आणि legislative accountability",body:[
    "Anti-Defection Law चा उद्देश elected representatives च्या पक्षबदलामुळे निर्माण होणारी अस्थिरता नियंत्रित करणे हा आहे.",
    "Tenth Schedule, disqualification grounds, voluntary giving up of membership आणि voting contrary to party direction यांचा अभ्यास आहे.",
    "Speaker/Chairman ची adjudicatory role आणि judicial review यासंबंधी प्रश्नही विचारात घेतले आहेत.",
    "कायद्याने stability वाढवण्याचा प्रयत्न केला असला तरी legislative deliberation, dissent आणि party whip यांच्यातील संतुलन महत्त्वाचे आहे."
  ],facts:["Tenth Schedule → anti-defection framework","Disqualification → specified grounds","Speaker/Chairman → decision-making role","Judicial review → constitutional scrutiny"]},
  {id:"p2-53",part:"Part 2",chapter:"53 • Pressure Groups",title:"दबावगट (Pressure Groups)",subtitle:"Policy influence without direct government formation",body:[
    "Pressure groups विशिष्ट हितसंबंध किंवा मुद्द्यांचे प्रतिनिधित्व करून public policy वर प्रभाव टाकण्याचा प्रयत्न करतात, परंतु ते सामान्यतः सत्ता मिळवण्याच्या उद्देशाने निवडणूक लढवत नाहीत.",
    "interest groups चे प्रकार, lobbying, professional associations, business groups, farmers’ organisations आणि civil society organisations यांचा अभ्यास आहे.",
    "Pressure groups policy inputs, public mobilisation आणि specialised information देऊ शकतात; त्याच वेळी unequal influence आणि transparency च्या समस्या उद्भवू शकतात.",
    "लोकशाहीतील हितसंबंधांचे प्रतिनिधित्व आणि public interest यांच्यात संतुलन राखण्यासाठी transparent consultation महत्त्वाची आहे."
  ],facts:["Pressure group → policy influence","Political party → government formation seeking","Lobbying → policy advocacy","Risk → unequal/opaque influence"]},
  {id:"p2-54",part:"Part 2",chapter:"54 • Appendix",title:"Appendix: Polity Revision Framework",subtitle:"संविधान, संस्था आणि परीक्षाभिमुख पुनरावृत्ती",body:[
    "Part 2 च्या appendix मध्ये विविध constitutional/statutory institutions, articles, bodies आणि polity-related revision points एकत्रित स्वरूपात दिले आहेत.",
    "Revision करताना Article–Institution–Function–Accountability mechanism या चार घटकांच्या चौकटीत facts जोडणे उपयोगी ठरते.",
    "Prelims साठी constitutional articles, composition, appointment, tenure आणि functions यांचे mapping महत्त्वाचे आहे; Mains साठी federalism, accountability, representation, reform आणि institutional challenges यांचा analytical linkage आवश्यक आहे.",
    "या appendix चा उपयोग संपूर्ण Polity Part 1 आणि Part 2 चे rapid revision index म्हणून करता येईल."
  ],facts:["Article → Institution → Function → Accountability","Prelims → factual mapping","Mains → constitutional principle + issue + reform","Part 1 + Part 2 → integrated revision"]},
];

export const politySections: PolitySection[] = [...polityPart1Sections, ...polityPart2Sections];