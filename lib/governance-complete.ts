export type GovernanceSection = {
  id: string;
  chapter: string;
  title: string;
  subtitle: string;
  body: string[];
  facts?: string[];
  sourcePages?: string;
};

export const governanceSections: GovernanceSection[] = [
  {
    id: "g1-meaning",
    chapter: "01 • Introduction to Governance",
    title: "Governance : अर्थ, स्वरूप आणि व्याप्ती",
    subtitle: "निर्णयप्रक्रिया, अंमलबजावणी आणि उत्तरदायित्व",
    sourcePages: "pp. 1–4",
    body: [
      "Governance म्हणजे निर्णय घेण्याची प्रक्रिया आणि त्या निर्णयांची अंमलबजावणी करण्याची प्रक्रिया. यात अधिकार कसा वापरला जातो, जबाबदाऱ्या कशा निश्चित होतात आणि कृतींचे निरीक्षण कसे केले जाते यांचा समावेश होतो.",
      "Governance ही केवळ सरकारपुरती मर्यादित नसून संस्था, समुदाय, बाजार, नागरी समाज आणि नागरिक यांच्या परस्पर संबंधांशी जोडलेली व्यापक संकल्पना आहे.",
      "सुशासनात पारदर्शकता, उत्तरदायित्व, कायद्याचे राज्य, परिणामकारकता आणि हितधारकांचा सहभाग यांना महत्त्व दिले जाते."
    ],
    facts: ["Governance = निर्णयप्रक्रिया + अंमलबजावणी + उत्तरदायित्व", "मुख्य हितधारक: राज्य, बाजार, नागरी समाज आणि नागरिक", "Government ही औपचारिक संस्था; Governance ही निर्णय व अंमलबजावणीची व्यापक प्रक्रिया"]
  },
  {
    id: "g1-government-vs-governance",
    chapter: "01 • Introduction to Governance",
    title: "Government आणि Governance मधील फरक",
    subtitle: "औपचारिक शासनसंस्था विरुद्ध व्यापक शासनप्रक्रिया",
    sourcePages: "pp. 1–2",
    body: [
      "Government मध्ये कार्यपालिका, विधायिका आणि न्यायपालिका यांसारख्या औपचारिक संस्था येतात. सरकार कायदे करते, कर आकारते, सार्वजनिक व्यवस्था राखते आणि सेवा पुरवते.",
      "Governance ही या औपचारिक संस्थांपलीकडे जाते. निर्णयांवर परिणाम करणारे बाजार, नागरी समाज, समुदाय आणि नागरिक यांचे संबंधही तिचा भाग असतात.",
      "त्यामुळे शासनाची गुणवत्ता मोजताना केवळ सरकारी रचना नव्हे तर सहभाग, पारदर्शकता, उत्तरदायित्व आणि सेवा-परिणाम यांचा विचार केला जातो."
    ],
    facts: ["Government = औपचारिक अधिकारसंस्था", "Governance = प्रक्रिया, संबंध, संस्था आणि हितधारकांचे परस्परसंवाद", "Good Governance मध्ये transparency + accountability + rule of law + participation"]
  },
  {
    id: "g1-evolution",
    chapter: "01 • Introduction to Governance",
    title: "Governance संकल्पनेचा ऐतिहासिक विकास",
    subtitle: "प्राचीन शासनापासून आधुनिक सुशासनापर्यंत",
    sourcePages: "pp. 1–12",
    body: [
      "स्रोतामध्ये governance च्या मुळांचा प्राचीन संस्कृती, मध्ययुगीन शासनव्यवस्था आणि कायद्याच्या राज्याच्या विकासाशी संबंध जोडला आहे. ‘Kybernan’ या ग्रीक शब्दाचा अर्थ मार्गदर्शन करणे किंवा जहाज चालवणे असा दिला आहे.",
      "Magna Carta (1215) ने राजसत्तेवर मर्यादा आणि rule of law यांना महत्त्व दिले. पुढे लोकशाही, मानवी हक्क, वसाहत-मुक्ती आणि विकासाच्या संकल्पनांनी आधुनिक governance चा विस्तार केला.",
      "द्वितीय महायुद्धानंतर संयुक्त राष्ट्रसंघ आणि Bretton Woods संस्थांच्या निर्मितीमुळे विकास, सहकार्य, मानवी हक्क आणि संस्थात्मक शासन यांचा संबंध अधिक स्पष्ट झाला."
    ],
    facts: ["Magna Carta, 1215 — शासनसत्तेवर कायदेशीर मर्यादेच्या विकासातील महत्त्वाचा टप्पा", "आधुनिक governance मध्ये development, rights, participation आणि accountability यांचा समावेश", "UNDP आणि आंतरराष्ट्रीय विकासविषयक चर्चांनी सुशासनाच्या मापनाला चालना दिली"]
  },
  {
    id: "g1-diversity",
    chapter: "01 • Introduction to Governance",
    title: "विविध समाजांमध्ये प्रभावी Governance",
    subtitle: "समावेशकता, सामाजिक सलोखा आणि धोरण-प्रतिसाद",
    sourcePages: "pp. 12–16",
    body: [
      "विविध भाषा, धर्म, जात, संस्कृती आणि सामाजिक गट असलेल्या समाजात governance चे उद्दिष्ट सर्व गटांना निर्णयप्रक्रियेत स्थान देणे आणि त्यांच्या गरजांना प्रतिसाद देणे हे आहे.",
      "समावेशक governance प्रतिनिधित्व, सामाजिक सलोखा, धोरणांची संवेदनशीलता आणि संघर्ष-निवारण यांना बळकटी देते. भिन्न गटांचा सहभाग धोरणनिर्मितीत विविध अनुभव आणतो.",
      "स्रोतामध्ये सामाजिक न्याय, अल्पसंख्याक हक्क, भेदभावविरोधी उपाय, संवाद आणि कायद्याचे राज्य यांना विविध समाजातील प्रभावी governance शी जोडले आहे."
    ],
    facts: ["Representation + Inclusivity = समावेशक governance चा पाया", "Grievance addressing आणि dialogue संघर्ष कमी करण्यास मदत करतात", "विविधतेला धोरणनिर्मितीतील संसाधन म्हणून पाहिले जाते"]
  },
  {
    id: "g1-constitutional",
    chapter: "01 • Introduction to Governance",
    title: "भारतीय संविधान आणि Good Governance",
    subtitle: "Preamble, DPSP, Fundamental Rights आणि decentralisation",
    sourcePages: "pp. 12–16",
    body: [
      "संविधानात ‘Good Governance’ हा शब्द स्वतंत्र संकल्पना म्हणून केंद्रस्थानी नसला तरी Preamble, Fundamental Rights, Directive Principles, न्यायव्यवस्था आणि स्थानिक स्वराज्य संस्थांमधून सुशासनाची मूल्ये व्यक्त होतात.",
      "स्रोतामध्ये Article 38 मधील सामाजिक कल्याण व विषमता कमी करण्याचे ध्येय, Article 39 मधील न्याय व समानतेचे उद्दिष्ट आणि Article 40 मधील ग्रामपंचायतींची संकल्पना यांना governance शी जोडले आहे.",
      "Article 14, 15 आणि 21 मधील अधिकार, Article 50 मधील न्यायपालिका-कार्यपालिका विभाजन आणि Article 243 मधील स्थानिक स्वराज्य संस्थांचे घटनात्मक स्थान हेही governance चे आधार म्हणून मांडले आहेत."
    ],
    facts: ["Preamble → justice, liberty, equality, fraternity", "DPSP → welfare-oriented governance", "Article 243 → decentralised local governance", "RTI → transparency आणि participatory governance शी संबंधित कायदेशीर साधन"]
  },
  {
    id: "g1-indian-tradition",
    chapter: "01 • Introduction to Governance",
    title: "भारतीय परंपरेतील सुशासन : Raj Dharma",
    subtitle: "लोककल्याण, नैतिकता आणि राज्यकर्त्याची जबाबदारी",
    sourcePages: "pp. 10–16",
    body: [
      "स्रोतामध्ये भारतीय परंपरेतील Good Governance ला ‘Raj Dharma’ शी जोडले आहे. राज्यकर्त्याचे कर्तव्य म्हणजे प्रजेचे कल्याण, न्याय आणि सामाजिक सुव्यवस्था राखणे असे या विचारात मांडले आहे.",
      "Arthashastra, Mahabharata चा Shanti Parva, Ramayana, Jataka परंपरा आणि वैदिक साहित्य यांमध्ये शासनकर्त्याच्या कर्तव्यांविषयी विविध विचार आढळतात.",
      "Kautilya च्या मांडणीत राज्याची सुरक्षा, आर्थिक समृद्धी, न्याय आणि प्रशासन यांना महत्त्व आहे; शासनकर्त्याचे हित प्रजेच्या कल्याणाशी जोडलेले आहे."
    ],
    facts: ["Raj Dharma = सार्वजनिक कर्तव्य आणि लोककल्याणाचा नैतिक आधार", "Kautilya → security, prosperity, justice आणि facilitative state", "Good governance च्या भारतीय संदर्भात ethics आणि public welfare महत्त्वाचे"]
  },
  {
    id: "g1-characteristics",
    chapter: "01 • Introduction to Governance",
    title: "Good Governance ची वैशिष्ट्ये",
    subtitle: "UNDP-आधारित प्रमुख तत्त्वे",
    sourcePages: "pp. 10–16",
    body: [
      "स्रोतामध्ये Good Governance साठी participation, consensus orientation, accountability, transparency, responsiveness, effectiveness and efficiency, equity and inclusiveness आणि rule of law यांसारखी तत्त्वे मांडली आहेत.",
      "ही तत्त्वे परस्पर संबंधित आहेत. पारदर्शक माहितीशिवाय नागरिकांचा अर्थपूर्ण सहभाग मर्यादित होतो; उत्तरदायित्वाशिवाय पारदर्शकता परिणामकारक ठरत नाही.",
      "सुशासनाचा अंतिम अभ्यास केवळ प्रक्रिया किती व्यवस्थित आहे यावर न करता नागरिकांना मिळणाऱ्या सेवा, न्याय, संधी आणि परिणामांवरही केला जातो."
    ],
    facts: ["Participation", "Transparency", "Accountability", "Rule of Law", "Responsiveness", "Effectiveness & Efficiency", "Equity & Inclusiveness", "Consensus Orientation"]
  },
  {
    id: "g2-framework-history",
    chapter: "02 • Framework of Governance in India-I",
    title: "औपनिवेशिक वारसा आणि भारतीय Governance",
    subtitle: "केंद्रीकृत प्रशासनापासून लोकशाही प्रशासनापर्यंत",
    sourcePages: "pp. 17–18",
    body: [
      "स्रोतामध्ये ब्रिटिश काळातील प्रशासनाचे केंद्रीकरण, मर्यादित भारतीय प्रतिनिधित्व, काही दडपशाही कायदे आणि आर्थिक शोषणाचा प्रशासनाच्या पुढील स्वरूपावर झालेला प्रभाव स्पष्ट केला आहे.",
      "Government of India Act 1935 ने प्रांतीय स्वायत्ततेला स्थान दिले; परंतु केंद्रातील महत्त्वाचे अधिकार ब्रिटिश नियंत्रणाखाली राहिले.",
      "स्वातंत्र्यानंतर लोकशाही, सामाजिक न्याय, समानता आणि विकास यांना प्रशासनाच्या उद्दिष्टांशी जोडण्याची प्रक्रिया सुरू झाली."
    ],
    facts: ["Government of India Act 1935 → provincial autonomy", "औपनिवेशिक वारसा → केंद्रीकरण आणि प्रशासकीय hierarchy", "स्वातंत्र्योत्तर governance → democracy + development + social justice"]
  },
  {
    id: "g2-constitution-governance",
    chapter: "02 • Framework of Governance in India-I",
    title: "संवैधानिक मूल्ये आणि Governance",
    subtitle: "Preamble, Fundamental Rights आणि DPSP",
    sourcePages: "pp. 18–21",
    body: [
      "Preamble मधील justice, liberty, equality आणि fraternity ही शासनाच्या उद्दिष्टांना मूल्याधिष्ठित दिशा देतात.",
      "Fundamental Rights नागरिकांच्या स्वातंत्र्य आणि समानतेचे संरक्षण करतात. Governance मध्ये Article 14, 19, 21, 23–24 आणि 25–30 यांसारख्या अधिकारांचा परिणाम दिसतो.",
      "DPSP राज्याला सामाजिक-आर्थिक कल्याण, समान संधी आणि सार्वजनिक हिताभिमुख धोरणांसाठी दिशादर्शन करतात."
    ],
    facts: ["Fundamental Rights → citizen protection", "DPSP → welfare orientation", "Constitutional values → governance ला normative framework"]
  },
  {
    id: "g2-judicial-governance",
    chapter: "02 • Framework of Governance in India-I",
    title: "न्यायपालिका आणि Governance",
    subtitle: "Judicial Review, Rights आणि Institutional Accountability",
    sourcePages: "pp. 20–24",
    body: [
      "स्रोतामध्ये न्यायपालिकेला संविधानाचे संरक्षण, अधिकारांचे रक्षण आणि शासनाच्या कृतींवर कायदेशीर नियंत्रण ठेवणारी संस्था म्हणून मांडले आहे.",
      "Maneka Gandhi प्रकरणात Article 21 मधील procedure ला न्याय्य, योग्य आणि मनमानी नसणे आवश्यक असल्याचे न्यायालयीन दृष्टिकोनातून स्पष्ट केले आहे.",
      "Minerva Mills, S.R. Bommai, Vishakha, I.R. Coelho आणि Puttaswamy यांसारख्या प्रकरणांनी अनुक्रमे basic structure, federalism, workplace safeguards, Ninth Schedule व judicial review आणि privacy यांसारख्या governance प्रश्नांना आकार दिला."
    ],
    facts: ["Judicial Review → executive/legislative action वर घटनात्मक नियंत्रण", "S.R. Bommai → Article 356 च्या वापरावर न्यायालयीन नियंत्रणाशी संबंधित", "Puttaswamy → privacy ला Article 21 शी जोडले"]
  },
  {
    id: "g2-executive-legislature",
    chapter: "02 • Framework of Governance in India-I",
    title: "कार्यपालिका आणि विधायिका : Governance मधील भूमिका",
    subtitle: "धोरणनिर्मिती, अंमलबजावणी आणि संसदीय उत्तरदायित्व",
    sourcePages: "pp. 24–33",
    body: [
      "कार्यपालिका धोरणांची अंमलबजावणी, सार्वजनिक सेवा आणि प्रशासन चालवते; विधायिका कायदे, अर्थसंकल्प आणि कार्यपालिकेची संसदीय छाननी यांद्वारे शासनावर नियंत्रण ठेवते.",
      "संसदीय समित्या, प्रश्नोत्तर, चर्चा आणि आर्थिक नियंत्रणाच्या प्रक्रियांमुळे प्रशासनाला विधायी उत्तरदायित्वाच्या चौकटीत ठेवले जाते.",
      "Governance मध्ये कार्यपालिका-विधायिका संबंधांचा केंद्रबिंदू म्हणजे निर्णयक्षमता आणि उत्तरदायित्व यांचा संतुलित वापर."
    ],
    facts: ["Executive → implementation", "Legislature → law-making + oversight", "Parliamentary accountability → democratic governance चे महत्त्वाचे साधन"]
  },
  {
    id: "g2-administration-structure",
    chapter: "02 • Framework of Governance in India-I",
    title: "भारतीय प्रशासकीय रचना",
    subtitle: "केंद्रापासून जिल्हा, तहसील आणि गावापर्यंत",
    sourcePages: "pp. 34–40",
    body: [
      "स्रोतामध्ये प्रशासनाची बहुस्तरीय रचना केंद्र, राज्य, जिल्हा, उपविभाग, तहसील/तालुका, मंडळ आणि गाव अशा स्तरांत स्पष्ट केली आहे.",
      "जिल्हा प्रशासनात विविध विभागांचे समन्वय, महसूल, कायदा-सुव्यवस्था, विकास आणि सेवा वितरण यांचा समावेश होतो.",
      "तहसील ही जमीन महसूल, जमीन अभिलेख, कोषागार आणि दंडाधिकारी कामांसाठी महत्त्वाची प्रशासकीय एकक म्हणून मांडली आहे; गाव हे सर्वात लहान प्रशासकीय स्तर आहे."
    ],
    facts: ["District → बहुविभागीय समन्वयाचे महत्त्वाचे स्तर", "Tehsil/Taluka → महसूल व जमीन प्रशासन", "Village → grassroots service delivery"]
  },
  {
    id: "g3-institutions",
    chapter: "03 • Framework of Governance in India-II",
    title: "प्रमुख शासन संस्था आणि नियामक",
    subtitle: "सुरक्षा, आपत्ती व्यवस्थापन आणि आर्थिक शासन",
    sourcePages: "pp. 41–56",
    body: [
      "स्रोतामध्ये शासनाच्या विविध कार्यांसाठी विशिष्ट संस्था आणि नियामक यंत्रणांची चर्चा आहे. त्यात राष्ट्रीय सुरक्षा, आपत्ती व्यवस्थापन आणि आर्थिक व्यवस्थापनाशी संबंधित संस्थांचा समावेश आहे.",
      "या संस्थांची भूमिका स्पष्ट कार्यविभाजन, तज्ज्ञता, समन्वय आणि उत्तरदायित्व यांवर आधारित असते.",
      "संस्थात्मक governance मध्ये अधिकारांची स्पष्टता आणि विविध स्तरांमधील coordination हे प्रभावी अंमलबजावणीसाठी महत्त्वाचे घटक आहेत."
    ],
    facts: ["Institutional governance = specialised mandate + coordination + accountability", "Governance architecture अनेक क्षेत्रीय संस्थांवर आधारित असते"]
  },
  {
    id: "g3-nia",
    chapter: "03 • Framework of Governance in India-II",
    title: "National Investigation Agency (NIA)",
    subtitle: "राष्ट्रीय स्तरावरील तपास यंत्रणा",
    sourcePages: "pp. 41–52",
    body: [
      "स्रोतामध्ये NIA Act 2008 अंतर्गत राष्ट्रीय महत्त्वाच्या अनुसूचित गुन्ह्यांच्या तपासासाठी NIA ची भूमिका स्पष्ट केली आहे.",
      "स्रोताच्या मते केंद्र सरकार विशिष्ट अनुसूचित गुन्ह्यांचा तपास NIA कडे देऊ शकते आणि 2019 च्या दुरुस्तीने परदेशात घडलेल्या काही प्रकरणांच्या तपासासंबंधी अधिकारांचा विस्तार केला.",
      "Special Courts आणि अनुसूचित गुन्ह्यांच्या तपासाची स्वतंत्र चौकट ही राष्ट्रीय सुरक्षा governance चा भाग म्हणून मांडली आहे."
    ],
    facts: ["NIA → NIA Act, 2008", "2019 amendment → jurisdiction आणि scheduled offences च्या व्याप्तीशी संबंधित बदल", "Special Courts → अनुसूचित गुन्ह्यांच्या न्यायालयीन प्रक्रियेसाठी"]
  },
  {
    id: "g3-ndma",
    chapter: "03 • Framework of Governance in India-II",
    title: "National Disaster Management Authority",
    subtitle: "आपत्तीपूर्व तयारीपासून प्रतिसादापर्यंत",
    sourcePages: "pp. 49–52",
    body: [
      "NDMA ही Disaster Management Act, 2005 अंतर्गत राष्ट्रीय स्तरावरील वैधानिक आपत्ती व्यवस्थापन संस्था म्हणून स्रोतामध्ये मांडली आहे.",
      "ती राष्ट्रीय आपत्ती व्यवस्थापन धोरण, राष्ट्रीय योजना मंजुरी, केंद्र सरकारच्या मंत्रालयांच्या योजनांमध्ये समन्वय आणि राज्य संस्थांसाठी मार्गदर्शक तत्त्वे यांशी संबंधित कार्य करते.",
      "आपत्ती governance मध्ये prevention, mitigation, preparedness, response आणि capacity building यांना परस्पर जोडणे आवश्यक असल्याचे स्रोत स्पष्ट करतो."
    ],
    facts: ["Disaster Management Act, 2005", "NDMA चे अध्यक्ष — पंतप्रधान", "मुख्य भर: prevention + mitigation + preparedness + response + capacity building"]
  },
  {
    id: "g3-rbi",
    chapter: "03 • Framework of Governance in India-II",
    title: "RBI आणि आर्थिक Governance",
    subtitle: "चलन, पत आणि वित्तीय प्रणालीचे नियमन",
    sourcePages: "pp. 51–56",
    body: [
      "स्रोतामध्ये Reserve Bank of India ला भारताची केंद्रीय बँक आणि banking regulation मधील प्रमुख संस्था म्हणून वर्णन केले आहे.",
      "RBI चलन व पतव्यवस्था, monetary stability आणि बँकिंग क्षेत्राशी संबंधित नियमनात महत्त्वाची भूमिका बजावते.",
      "वित्तीय governance मध्ये नियमन, स्थैर्य, पारदर्शकता आणि ग्राहकहित यांचा समन्वय आवश्यक असतो."
    ],
    facts: ["RBI → central banking and monetary governance", "Banking regulation → financial stability शी जोडलेले", "Data governance → financial sector मध्ये confidentiality आणि security महत्त्वाची"]
  },
  {
    id: "g4-civil-services-role",
    chapter: "04 • Role of Civil Services in Democracy",
    title: "लोकशाहीत नागरी सेवांची भूमिका",
    subtitle: "Policy implementation, continuity आणि public service",
    sourcePages: "pp. 57–60",
    body: [
      "नागरी सेवा ही लोकशाही सरकारच्या निर्णयांना प्रशासनिक अंमलबजावणीशी जोडणारी यंत्रणा आहे. निवडून आलेले प्रतिनिधी धोरणात्मक दिशा देतात आणि प्रशासन त्या धोरणांची अंमलबजावणी करते.",
      "नागरी सेवांकडून तटस्थता, कायद्याचे पालन, व्यावसायिकता, सातत्य आणि नागरिकाभिमुख सेवा अपेक्षित असतात.",
      "लोकशाही governance मध्ये प्रशासनाने संविधानिक मूल्ये, सार्वजनिक हित आणि उत्तरदायित्व यांचा समतोल राखणे महत्त्वाचे आहे."
    ],
    facts: ["Civil services = policy implementation + institutional continuity", "लोकशाही प्रशासनात neutrality, legality आणि accountability महत्त्वाचे"]
  },
  {
    id: "g4-reforms",
    chapter: "04 • Role of Civil Services in Democracy",
    title: "नागरी सेवा सुधारणा आणि Capacity Building",
    subtitle: "कार्यप्रदर्शन, प्रशिक्षण आणि आधुनिक प्रशासन",
    sourcePages: "pp. 61–67",
    body: [
      "स्रोतामध्ये सतत प्रशिक्षण, skill development, performance management, स्पष्ट metrics आणि feedback mechanisms यांना प्रशासन सुधारण्यासाठी महत्त्व दिले आहे.",
      "Mission Karmayogi आणि National Programme for Civil Services Capacity Building यांसारख्या उपक्रमांचा उद्देश नागरी सेवकांची क्षमता आणि बदलत्या प्रशासनिक गरजांशी जुळवून घेण्याची क्षमता वाढवणे असा मांडला आहे.",
      "स्थानिक शासनासाठीही training, resources आणि financial empowerment यांना क्षमता-वृद्धीचा भाग मानले आहे."
    ],
    facts: ["Capacity building → continuous learning", "Performance management → measurable outcomes + feedback", "Mission Karmayogi → civil-service capacity building"]
  },
  {
    id: "g5-e-governance",
    chapter: "05 • Innovating Governance",
    title: "E-Governance : संकल्पना आणि उपयोग",
    subtitle: "ICT च्या माध्यमातून सेवा वितरण आणि पारदर्शकता",
    sourcePages: "pp. 68–72",
    body: [
      "E-Governance म्हणजे माहिती व संप्रेषण तंत्रज्ञानाचा वापर करून शासनाच्या प्रक्रिया, सेवा, माहिती आणि नागरिकांशी संवाद अधिक सुलभ करण्याची पद्धत.",
      "स्रोतामध्ये e-Courts, e-GramSwaraj, UMANG, National e-Governance Plan आणि Digital India यांसारख्या उपक्रमांचा governance सुधारण्यासाठी संदर्भ दिला आहे.",
      "तंत्रज्ञानाचा उपयोग केवळ digitisation म्हणून न पाहता accessibility, transparency, speed, monitoring आणि citizen participation यांच्याशी जोडणे आवश्यक आहे."
    ],
    facts: ["e-Governance = ICT + public service delivery", "e-GramSwaraj → local governance digitisation", "UMANG → अनेक सरकारी सेवांसाठी डिजिटल प्रवेश"]
  },
  {
    id: "g5-digital-india",
    chapter: "05 • Innovating Governance",
    title: "Digital India आणि डिजिटल सार्वजनिक पायाभूत सुविधा",
    subtitle: "Digital inclusion, connectivity आणि service delivery",
    sourcePages: "pp. 72–76",
    body: [
      "Digital India चा उद्देश भारताला digitally empowered society आणि knowledge economy कडे नेण्यासाठी digital infrastructure, governance, literacy आणि empowerment यांना एकत्र आणणे असा स्रोतामध्ये मांडला आहे.",
      "BharatNet, Common Service Centres आणि digital payments यांसारख्या घटकांमधून डिजिटल सेवा ग्रामीण भागापर्यंत पोहोचवण्यावर भर दिला आहे.",
      "डिजिटल governance समोर digital divide, accessibility, data security आणि नागरिकांच्या डिजिटल साक्षरतेची आव्हानेही येतात."
    ],
    facts: ["Digital India → digital infrastructure + digital governance + digital empowerment", "BharatNet → ग्रामपंचायत पातळीवरील connectivity शी संबंधित", "CSC → ग्रामीण डिजिटल सेवा प्रवेश"]
  },
  {
    id: "g5-data-privacy",
    chapter: "05 • Innovating Governance",
    title: "Data Governance, Privacy आणि Emerging Technology",
    subtitle: "AI, blockchain आणि नागरिकांच्या माहितीचे संरक्षण",
    sourcePages: "pp. 77–81",
    body: [
      "स्रोतामध्ये digital governance सोबत data privacy, cybersecurity आणि responsible technology यांचे महत्त्व अधोरेखित केले आहे.",
      "Digital India Act विषयीच्या स्रोताच्या चर्चेत online safety, emerging technologies, blockchain, AI आणि data privacy यांच्यासाठी नियामक चौकट विकसित करण्याची गरज मांडली आहे.",
      "RBI आणि telecom क्षेत्रातील data governance मध्ये access control, security, confidentiality आणि responsible data handling यांना महत्त्व दिले आहे."
    ],
    facts: ["Digital governance मध्ये privacy + security + accessibility यांचा समतोल", "Emerging technologies साठी regulatory adaptability आवश्यक", "Data governance = collection + access + security + responsible use"]
  },
  {
    id: "g6-accountability",
    chapter: "06 • Accountability and Transparency",
    title: "Accountability : अर्थ आणि प्रकार",
    subtitle: "प्रशासनाला उत्तरदायी ठेवण्याची साधने",
    sourcePages: "pp. 82–87",
    body: [
      "Accountability म्हणजे सार्वजनिक अधिकार, निर्णय आणि संसाधनांच्या वापराबद्दल संबंधित संस्थांनी स्पष्टीकरण देणे आणि परिणामांसाठी जबाबदारी स्वीकारणे.",
      "स्रोताच्या चौकटीत legislative accountability, administrative accountability, judicial oversight आणि citizen-based accountability यांचे महत्त्व दिसते.",
      "उत्तरदायित्वासाठी स्पष्ट मानके, नोंदवही, audit, monitoring, grievance redressal आणि corrective action आवश्यक असतात."
    ],
    facts: ["Accountability = answerability + responsibility + corrective action", "Legislative, administrative, judicial आणि social mechanisms परस्परपूरक"]
  },
  {
    id: "g6-transparency",
    chapter: "06 • Accountability and Transparency",
    title: "Transparency आणि माहितीचा अधिकार",
    subtitle: "माहिती → सहभाग → उत्तरदायित्व",
    sourcePages: "pp. 82–90",
    body: [
      "पारदर्शक governance मध्ये निर्णय, नियम, प्रक्रिया आणि सार्वजनिक संसाधनांच्या वापराबाबत आवश्यक माहिती नागरिकांना उपलब्ध करून देण्यावर भर असतो.",
      "Right to Information Act, 2005 नागरिकांना सार्वजनिक प्राधिकरणांकडून माहिती मिळवण्याचे कायदेशीर साधन देतो. स्रोतामध्ये RTI ला participatory governance आणि grassroots democracy शी जोडले आहे.",
      "पारदर्शकतेचा उद्देश केवळ माहिती प्रकाशित करणे नसून नागरिकांना माहिती समजण्यास, प्रश्न विचारण्यास आणि प्रशासनावर देखरेख ठेवण्यास सक्षम करणे आहे."
    ],
    facts: ["RTI Act, 2005 → transparency चे महत्त्वाचे कायदेशीर साधन", "Information access → citizen oversight", "Transparency आणि accountability परस्पर संबंधित"]
  },
  {
    id: "g6-citizen-charter",
    chapter: "06 • Accountability and Transparency",
    title: "Citizen Charter आणि Sevottam",
    subtitle: "नागरिक-केंद्रित सेवा मानके",
    sourcePages: "pp. 90–96",
    body: [
      "Citizen Charter मध्ये सार्वजनिक संस्थेने देऊ केलेल्या सेवांचे स्वरूप, अपेक्षित मानके आणि नागरिकांच्या हक्कांविषयी माहिती देण्याची कल्पना आहे.",
      "स्रोतामध्ये effective grievance redressal, नियमित evaluation, end-user feedback, स्पष्ट responsibility आणि civil society involvement यांना Citizen Charter च्या प्रभावी अंमलबजावणीशी जोडले आहे.",
      "ARC च्या citizen-centric approach मध्ये service definition, standards, capability development आणि performance यांसारख्या टप्प्यांवर भर दिला आहे."
    ],
    facts: ["Citizen Charter → service standards स्पष्ट करणे", "Grievance redressal → Charter ची परिणामकारकता", "Citizen feedback → continuous improvement"]
  },
  {
    id: "g6-social-audit",
    chapter: "06 • Accountability and Transparency",
    title: "Social Audit आणि Public Monitoring",
    subtitle: "नागरिकांचा थेट सामाजिक लेखापरीक्षणातील सहभाग",
    sourcePages: "pp. 96–101",
    body: [
      "Social audit मध्ये सरकारी कार्यक्रमांच्या अंमलबजावणीची माहिती, खर्च, लाभार्थी आणि प्रत्यक्ष परिणाम यांची सामाजिक पातळीवर तपासणी केली जाते.",
      "स्रोतामध्ये citizen participation in social audits आणि public monitoring यांना authorities ला accountable ठेवण्याची साधने म्हणून मांडले आहे.",
      "Social audit प्रभावी होण्यासाठी माहितीची उपलब्धता, समुदायाचा सहभाग, स्वतंत्र पडताळणी आणि निष्कर्षांवर follow-up आवश्यक असतो."
    ],
    facts: ["Social audit = public participation + verification + accountability", "Information disclosure हे social audit चे आधारभूत साधन"]
  },
  {
    id: "g6-grievance",
    chapter: "06 • Accountability and Transparency",
    title: "Grievance Redressal आणि CPGRAMS",
    subtitle: "तक्रारीपासून निराकरणापर्यंत",
    sourcePages: "pp. 88–106",
    body: [
      "Citizen-centric governance मध्ये तक्रार निवारण ही केवळ प्रशासनिक प्रक्रिया नसून सेवा गुणवत्तेचा feedback mechanism आहे.",
      "स्रोतामध्ये CPGRAMS द्वारे नागरिकांना online complaint नोंदवणे, status track करणे आणि निराकरणाची प्रक्रिया पाहणे शक्य असल्याचे नमूद केले आहे.",
      "प्रभावी grievance redressal साठी accessible mechanism, time-bound response, responsibility fixing आणि feedback loop आवश्यक आहेत."
    ],
    facts: ["CPGRAMS → online public grievance registration and tracking", "Grievance system = accountability + service improvement"]
  },
  {
    id: "g7-citizen-participation",
    chapter: "07 • Citizen Participation in Governance",
    title: "Citizen Participation : संकल्पना",
    subtitle: "लोकशाहीतील नागरिकांचा सक्रिय सहभाग",
    sourcePages: "pp. 107–112",
    body: [
      "Citizen participation म्हणजे नागरिकांनी शासनाच्या निर्णयप्रक्रिया, अंमलबजावणी, निरीक्षण आणि मूल्यांकनात अर्थपूर्ण सहभाग घेणे.",
      "स्रोतामध्ये participation ला Good Governance च्या मूलभूत गुणांपैकी एक मानले आहे. सहभागामुळे धोरणांना स्थानिक माहिती आणि नागरिकांच्या अनुभवांचा आधार मिळतो.",
      "Participation केवळ मतदानापुरता मर्यादित नसून Gram Sabha, public consultation, social audit, community organisations आणि feedback mechanisms यांच्यापर्यंत विस्तारतो."
    ],
    facts: ["Participation = decision-making + implementation + monitoring + feedback", "Meaningful participation requires information and institutional channels"]
  },
  {
    id: "g7-ngos",
    chapter: "07 • Citizen Participation in Governance",
    title: "NGOs : भूमिका आणि संस्थात्मक चौकट",
    subtitle: "विकास, समुदाय सहभाग आणि advocacy",
    sourcePages: "pp. 113–121",
    body: [
      "स्रोतामध्ये NGOs ना सरकारपासून स्वतंत्रपणे कार्य करणाऱ्या, सामाजिक सेवा, गरिबी निवारण, पर्यावरण संरक्षण आणि community development यांसारख्या क्षेत्रात काम करणाऱ्या संस्था म्हणून मांडले आहे.",
      "भारतात NGOs विविध कायदेशीर स्वरूपात कार्य करू शकतात, जसे Societies, Trusts आणि Section 8 charitable companies.",
      "NGOs विकास प्रकल्प, समुदाय विकास, आपत्ती मदत व पुनर्वसन, सामाजिक advocacy आणि वंचित गटांपर्यंत सेवा पोहोचवण्यात भूमिका बजावू शकतात."
    ],
    facts: ["NGOs → service delivery + advocacy + community mobilisation", "प्रमुख स्वरूप: Society, Trust, Section 8 company", "NGO governance मध्ये transparency आणि accountability आवश्यक"]
  },
  {
    id: "g7-shg",
    chapter: "07 • Citizen Participation in Governance",
    title: "Self-Help Groups (SHGs)",
    subtitle: "सामूहिक बचत, वित्तीय समावेशन आणि महिला सक्षमीकरण",
    sourcePages: "pp. 122–129",
    body: [
      "SHGs ही समान आर्थिक किंवा सामाजिक उद्दिष्टे असलेल्या सदस्यांची लहान समूह-आधारित रचना आहे. सामूहिक बचत, अंतर्गत कर्जव्यवस्था, कौशल्यविकास आणि livelihood activities यांद्वारे सदस्यांची क्षमता वाढवण्यावर भर असतो.",
      "स्रोतामध्ये SHGs चा महिलांच्या आर्थिक स्वावलंबनाशी आणि household/community decision-making मधील सहभागाशी संबंध स्पष्ट केला आहे.",
      "Maharashtra मधील MAVIM आणि Kerala मधील Kudumbashree यांसारख्या case studies द्वारे community-based empowerment चे विविध नमुने दाखवले आहेत."
    ],
    facts: ["SHG → savings + credit + livelihood + collective action", "SHGs आणि women empowerment यांचा स्रोतामध्ये विशेष संबंध", "MAVIM आणि Kudumbashree → source case studies"]
  },
  {
    id: "g7-microfinance",
    chapter: "07 • Citizen Participation in Governance",
    title: "Microfinance आणि Financial Inclusion",
    subtitle: "लहान कर्ज, बचत आणि वंचित गटांचा आर्थिक सहभाग",
    sourcePages: "pp. 123–129",
    body: [
      "Microfinance म्हणजे कमी उत्पन्न असलेल्या व्यक्ती आणि समूहांना लहान प्रमाणातील वित्तीय सेवा उपलब्ध करून देण्याची व्यवस्था.",
      "SHGs, बँका आणि NABARD यांच्यातील संबंधांद्वारे वित्तीय सेवांचा विस्तार करण्यावर स्रोतामध्ये भर आहे. underserved groups साठी गरजेनुसार वित्तीय उत्पादने विकसित करण्याची शिफारसही दिली आहे.",
      "Governance च्या दृष्टीने microfinance चा संबंध financial inclusion, women empowerment, livelihood आणि local economic participation यांच्याशी जोडता येतो."
    ],
    facts: ["Microfinance → underserved groups साठी financial services", "SHG linkage → collective financial access", "Financial products → स्थानिक गरजांशी जुळणारे असणे आवश्यक"]
  },
  {
    id: "g8-consensus",
    chapter: "08 • Forging Unity",
    title: "Consensus-based Governance",
    subtitle: "मतभेदांमध्ये संवाद, सहमती आणि सामायिक उद्दिष्टे",
    sourcePages: "pp. 130–134",
    body: [
      "Consensus governance म्हणजे विविध हितसंबंध आणि मतभेद असतानाही संवाद, विचारविनिमय आणि समन्वयातून सामायिक निर्णयाकडे जाण्याची प्रक्रिया.",
      "भारतीय समाजातील प्रादेशिक, सामाजिक, भाषिक आणि आर्थिक विविधतेमुळे consensus-building governance मध्ये विशेष महत्त्वाचे ठरते.",
      "सहकार्याची प्रक्रिया मजबूत करण्यासाठी विश्वास, माहितीची देवाणघेवाण, प्रतिनिधित्व, negotiation आणि संस्थात्मक संवाद आवश्यक आहेत."
    ],
    facts: ["Consensus ≠ मतभेदांचा अभाव", "Consensus = dialogue + deliberation + accommodation", "Diverse democracy मध्ये consensus-building महत्त्वाचे"]
  },
  {
    id: "g9-inclusive-governance",
    chapter: "09 • Social Inclusion and Welfare Policies",
    title: "Inclusive Governance",
    subtitle: "समान संधी आणि वंचित गटांचा सहभाग",
    sourcePages: "pp. 135–140",
    body: [
      "Inclusive governance मध्ये समाजातील विविध गटांना निर्णयप्रक्रियेत स्थान, समान संधी आणि सार्वजनिक सेवांमध्ये न्याय्य प्रवेश देण्यावर भर असतो.",
      "स्रोतामध्ये reservation policies, women empowerment, minority rights आणि सामाजिकदृष्ट्या वंचित गटांच्या सहभागाचा समावेश आहे.",
      "समावेशनाचा उद्देश केवळ प्रतिनिधित्व वाढवणे नसून ऐतिहासिक वंचितता, सामाजिक असमानता आणि सेवांमधील प्रवेशातील अडथळे कमी करणे हा आहे."
    ],
    facts: ["Inclusion = representation + equal opportunity + access", "Reservation policies → source मध्ये affirmative action चे उदाहरण", "Women SHGs → economic and social participation"]
  },
  {
    id: "g9-welfare",
    chapter: "09 • Social Inclusion and Welfare Policies",
    title: "Social Welfare आणि Poverty Alleviation",
    subtitle: "सामाजिक सुरक्षा, रोजगार आणि सेवांचा प्रवेश",
    sourcePages: "pp. 141–150",
    body: [
      "स्रोतामध्ये सामाजिक कल्याणाच्या संदर्भात pension, employment services, skill development, unorganised workers आणि digital welfare delivery यांचा आढावा घेतला आहे.",
      "NSAP Portal द्वारे वृद्ध, विधवा आणि दिव्यांगांसाठी सामाजिक सहाय्य योजनांची online administration केली जाते असे स्रोतामध्ये नमूद आहे.",
      "National Career Service, Skill India, Pensioners’ Portal, Shram Suvidha आणि e-SHRAM यांसारख्या platforms चा welfare आणि service delivery शी संबंध दिला आहे."
    ],
    facts: ["NSAP Portal → social assistance administration", "NCS → employment-related services", "e-SHRAM → unorganised workers registration/tracking", "Digital welfare → access + tracking + delivery"]
  },
  {
    id: "g10-environment",
    chapter: "10 • Environmental Governance",
    title: "Environmental Governance : मूलभूत चौकट",
    subtitle: "विकास आणि पर्यावरणीय संरक्षण यांचा समतोल",
    sourcePages: "pp. 151–155",
    body: [
      "Environmental governance मध्ये पर्यावरणीय संसाधनांचा वापर, संरक्षण, नियमन आणि विविध हितधारकांमधील समन्वय यांचा समावेश होतो.",
      "स्रोताच्या governance दृष्टिकोनात sustainable development, regulatory institutions, citizen participation आणि पर्यावरणीय उत्तरदायित्व यांना महत्त्व दिले आहे.",
      "पर्यावरणीय निर्णयांमध्ये दीर्घकालीन परिणाम, स्थानिक समुदाय, आर्थिक गरजा आणि पर्यावरणीय मर्यादा यांचा विचार आवश्यक आहे."
    ],
    facts: ["Environmental governance = regulation + conservation + participation", "Sustainable development → वर्तमान गरजा आणि दीर्घकालीन पर्यावरणीय क्षमता यांचा समतोल"]
  },
  {
    id: "g10-participation",
    chapter: "10 • Environmental Governance",
    title: "पर्यावरणीय सहभाग आणि Accountability",
    subtitle: "नागरिक, समुदाय आणि संस्थांची भूमिका",
    sourcePages: "pp. 156–164",
    body: [
      "पर्यावरणीय governance मध्ये नागरिक, स्थानिक समुदाय, प्रशासन, नियामक संस्था, उद्योग आणि नागरी समाज यांचा सहभाग महत्त्वाचा असतो.",
      "पारदर्शक environmental information, consultation, monitoring आणि grievance mechanisms मुळे विकास प्रकल्पांशी संबंधित पर्यावरणीय प्रश्नांवर उत्तरदायित्व वाढू शकते.",
      "स्रोतामध्ये environmental governance ला broader good governance principles — transparency, accountability, participation आणि rule of law — यांच्याशी जोडले आहे."
    ],
    facts: ["Environmental governance मध्ये multi-stakeholder approach", "Information + participation + monitoring → environmental accountability"]
  },
  {
    id: "g11-economic-governance",
    chapter: "11 • Economic Governance",
    title: "Economic Governance : अर्थ आणि उद्दिष्टे",
    subtitle: "संसाधनांचे कार्यक्षम व्यवस्थापन आणि सार्वजनिक परिणाम",
    sourcePages: "pp. 165–168",
    body: [
      "Economic governance मध्ये सार्वजनिक संसाधनांचे नियोजन, वापर, नियमन आणि आर्थिक धोरणांच्या परिणामांचे निरीक्षण यांचा समावेश होतो.",
      "स्रोतामध्ये resource efficiency, targeting, leakages कमी करणे, wasteful expenditure टाळणे आणि knowledge, research व innovation चा उपयोग यांना महत्त्व दिले आहे.",
      "Budgeting, zero-based budgeting, input-output analysis आणि cost-benefit analysis यांसारख्या साधनांद्वारे सरकारी हस्तक्षेपांचे मूल्यांकन करण्याची दिशा दिली आहे."
    ],
    facts: ["Economic governance → resource allocation + efficiency + accountability", "Cost-benefit analysis → policy/project evaluation", "Zero-based budgeting → expenditure justification वर भर"]
  },
  {
    id: "g11-regulation",
    chapter: "11 • Economic Governance",
    title: "Regulation आणि Institutional Governance",
    subtitle: "नियम, मानके आणि धोरण-समन्वय",
    sourcePages: "pp. 165–168",
    body: [
      "आर्थिक governance मध्ये नियामक संस्था, standards, task forces, steering committees आणि review mechanisms यांची भूमिका महत्त्वाची असते.",
      "सरकारी हस्तक्षेपाचा उद्देश बाजारातील अडथळे, सार्वजनिक हित, resource efficiency आणि सेवा/उत्पादनाच्या गुणवत्तेचा समतोल साधणे असा स्रोताच्या चौकटीत दिसतो.",
      "नियमन परिणामकारक होण्यासाठी स्पष्ट नियम, संस्थात्मक क्षमता, पारदर्शकता आणि नियमित पुनरावलोकन आवश्यक आहे."
    ],
    facts: ["Regulation → rules + standards + monitoring", "Review mechanisms → policy correction आणि continuous improvement"]
  },
  {
    id: "g12-corruption",
    chapter: "12 • Corruption and Ethical Governance",
    title: "Corruption : Governance वरील परिणाम",
    subtitle: "सार्वजनिक विश्वास, संसाधने आणि संस्थात्मक गुणवत्ता",
    sourcePages: "pp. 169–176",
    body: [
      "भ्रष्टाचारामुळे सार्वजनिक अधिकारांचा वैयक्तिक किंवा संकुचित हितासाठी गैरवापर होऊ शकतो. स्रोतामध्ये transparency चा अभाव, nepotism, cronyism आणि सार्वजनिक सेवेत empathy चा अभाव यांसारख्या ethical governance challenges ची चर्चा आहे.",
      "भ्रष्टाचारामुळे निर्णयप्रक्रियेवरील विश्वास कमी होऊ शकतो आणि सार्वजनिक संसाधनांच्या वापराबाबत प्रश्न निर्माण होतात.",
      "Governance सुधारण्यासाठी prevention, detection, investigation, accountability, transparency आणि ethical capacity building या सर्व स्तरांवर उपायांची गरज असते."
    ],
    facts: ["Corruption → public trust आणि institutional integrity वर परिणाम", "Prevention + detection + prosecution + ethics = व्यापक anti-corruption approach"]
  },
  {
    id: "g12-ethics",
    chapter: "12 • Corruption and Ethical Governance",
    title: "Ethical Governance",
    subtitle: "Integrity, fairness आणि public interest",
    sourcePages: "pp. 174–178",
    body: [
      "Ethical governance मध्ये सार्वजनिक निर्णय घेताना transparency, accountability, integrity, rule of law, participation, fairness, efficiency आणि public interest यांचा विचार केला जातो.",
      "स्रोतामध्ये nepotism, cronyism, conflict of interest आणि public needs कडे दुर्लक्ष यांना ethical governance च्या विरोधातील आव्हाने म्हणून मांडले आहे.",
      "Gandhi यांच्या Ramrajya आणि Swaraj विचारांपासून Aristotle, Confucianism, Locke आणि utilitarian विचारांपर्यंत विविध परंपरांमधून ethical governance विषयी वेगवेगळे दृष्टिकोन स्रोतामध्ये दिले आहेत."
    ],
    facts: ["Ethical governance → integrity + fairness + public interest", "Conflict of interest → private interest आणि public duty मधील संभाव्य संघर्ष", "Ethics आणि efficiency यांचा संतुलित विचार आवश्यक"]
  },
  {
    id: "g12-anti-corruption",
    chapter: "12 • Corruption and Ethical Governance",
    title: "भारतामधील Anti-Corruption Framework",
    subtitle: "कायदे, संस्था आणि vigilance",
    sourcePages: "pp. 176–188",
    body: [
      "स्रोतामध्ये Prevention of Corruption Act, Benami Transactions (Prohibition) Act, Prevention of Money Laundering Act, RTI Act, Lokpal and Lokayuktas Act आणि whistleblower protection यांचा anti-corruption framework मध्ये संदर्भ दिला आहे.",
      "Central Vigilance Commission ही केंद्र शासनातील vigilance framework मधील प्रमुख संस्था म्हणून मांडली आहे. CBI भ्रष्टाचार, economic offences आणि special crimes च्या तपासात भूमिका बजावते.",
      "Anti-corruption governance मध्ये संस्थांना पुरेशी स्वायत्तता, संसाधने, whistleblower protection आणि internal oversight यांची गरज स्रोतामध्ये अधोरेखित केली आहे."
    ],
    facts: ["CVC → central vigilance framework", "CBI → investigation of corruption/economic/special crimes", "Lokpal & Lokayuktas → anti-corruption institutional framework", "RTI → transparency-based accountability"]
  },
  {
    id: "g12-civil-code",
    chapter: "12 • Corruption and Ethical Governance",
    title: "Code of Conduct आणि सार्वजनिक नैतिकता",
    subtitle: "मंत्री, संसद सदस्य आणि नागरी सेवक",
    sourcePages: "pp. 176–178",
    body: [
      "स्रोतामध्ये Union आणि State Ministers साठी Code of Conduct, संसदेमधील Ethics Committees आणि Members च्या disclosure of interest यांचा उल्लेख आहे.",
      "Civil servants साठी prescribed conduct rules चा उद्देश private interests मुळे सरकारी निर्णय प्रभावित होऊ नयेत आणि public confidence टिकवणे हा आहे.",
      "Ethical governance मध्ये नियमांची उपस्थिती पुरेशी नसून त्यांची अंमलबजावणी, नेतृत्वाचे उदाहरण आणि संस्थात्मक oversightही महत्त्वाचे असतात."
    ],
    facts: ["Code of Conduct → behavioural standards", "Disclosure of interest → conflict-of-interest transparency", "Ethics committees → legislative ethical oversight"]
  },
  {
    id: "g12-institutional-reforms",
    chapter: "12 • Corruption and Ethical Governance",
    title: "संस्थात्मक सुधारणा आणि Capacity Building",
    subtitle: "स्वायत्तता, कौशल्य आणि परिणामकारक प्रशासन",
    sourcePages: "pp. 185–190",
    body: [
      "स्रोतामध्ये civil services साठी continuous capacity building, performance management आणि feedback mechanisms यांना महत्त्व दिले आहे.",
      "Anti-corruption agencies साठी autonomy, adequate resources, whistleblower protection आणि internal oversight यांची आवश्यकता नमूद आहे.",
      "Local governance मध्ये training, financial empowerment आणि decentralised schemes अंमलबजावणीची क्षमता वाढवणे आवश्यक असल्याचे स्रोत सांगतो."
    ],
    facts: ["Institutional reform → capacity + autonomy + accountability", "Local governance → training + resources + financial empowerment", "Technology आणि performance management → administrative improvement"]
  },
  {
    id: "g12-future-governance",
    chapter: "12 • Corruption and Ethical Governance",
    title: "भारतातील Governance चे Future Prospects",
    subtitle: "डिजिटल, नागरिक-केंद्रित आणि संस्थात्मक परिवर्तन",
    sourcePages: "pp. 189–194",
    body: [
      "स्रोताच्या निष्कर्षात्मक भागात स्वातंत्र्यानंतर भारतातील governance च्या उत्क्रांतीकडे लोकशाही, प्रशासनिक सुधारणा, तंत्रज्ञान आणि नागरिक-केंद्रित सेवा या दिशांनी पाहिले आहे.",
      "Mission Karmayogi, e-Courts, e-GramSwaraj, UMANG, Performance Management System, E-Panchayat आणि One Nation One Ration Card यांसारख्या उपक्रमांना governance capacity आणि service delivery शी जोडले आहे.",
      "भविष्यातील governance साठी government, civil society आणि research institutions यांच्यात collaboration, policy reform, capacity building आणि innovation यांचा समन्वय आवश्यक असल्याचे स्रोत मांडतो."
    ],
    facts: ["Future governance → citizen-centric + technology-enabled + accountable", "Collaboration → government + civil society + research institutions", "Continuous improvement → capacity building + innovation + monitoring"]
  }
];
