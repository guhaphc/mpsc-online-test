export type GovernanceEnhancement = {
  subtopics: { title: string; points: string[] }[];
  facts?: string[];
};

export const governanceComprehensiveEnhancements: Record<string, GovernanceEnhancement> = {
  "g1-meaning": {
    subtopics: [
      { title: "Governance चे प्रमुख घटक", points: ["Actors: राज्य, बाजार, नागरी समाज आणि नागरिक; Processes: निर्णय, अंमलबजावणी, समन्वय व निरीक्षण; Outcomes: सेवा, न्याय, सुरक्षा आणि विकास.", "Governance ही input–process–output–outcome या साखळीतून समजता येते."] },
      { title: "Mains linkage", points: ["चांगले governance हे केवळ नियमांचे पालन नसून नागरिकांना वेळेवर, गुणवत्तापूर्ण आणि न्याय्य सेवा मिळण्याशी संबंधित आहे.", "Capacity, accountability आणि participation यांचा समन्वय governance outcomes ठरवतो."] }
    ],
    facts: ["Governance = institutions + processes + relationships + outcomes", "Good governance is outcome-oriented as well as process-oriented"]
  },
  "g1-government-vs-governance": {
    subtopics: [
      { title: "तुलनात्मक चौकट", points: ["Government ही औपचारिक authority structure आहे; Governance मध्ये formal आणि non-state actors मधील coordination समाविष्ट आहे.", "Government कडे वैध coercive authority असू शकते; governance अधिक व्यापक networked decision-making दर्शवते."] },
      { title: "परीक्षाभिमुख मुद्दा", points: ["Government → who governs; Governance → how decisions are made, implemented and reviewed.", "Privatisation, PPP, NGOs आणि community participation मुळे governance ची व्याप्ती सरकारच्या संस्थांपलीकडे जाते."] }
    ],
    facts: ["Government is an institution; governance is a process/system of steering", "Non-state actors can influence governance without exercising sovereign authority"]
  },
  "g1-evolution": {
    subtopics: [
      { title: "संकल्पनेतील बदल", points: ["Classical administration मध्ये hierarchy आणि command वर भर होता; आधुनिक governance मध्ये networks, participation, responsiveness आणि outcomes वर अधिक भर आहे.", "Development administration पासून good governance, digital governance आणि citizen-centric governance पर्यंत संकल्पनेचा विस्तार झाला."] },
      { title: "महत्त्वाचे संदर्भ", points: ["Rule of law, human rights, welfare state, decentralisation आणि development हे आधुनिक governance च्या उत्क्रांतीतील प्रमुख संदर्भ आहेत.", "UNDP आणि आंतरराष्ट्रीय विकास चर्चेत governance indicators व institutional quality ला महत्त्व मिळाले."] }
    ],
    facts: ["Classical administration → hierarchy", "Modern governance → networks + participation + outcomes", "Good governance debates expanded strongly from the late 20th century"]
  },
  "g1-diversity": {
    subtopics: [
      { title: "Diversity-sensitive governance", points: ["भाषिक, धार्मिक, जातीय, प्रादेशिक आणि आर्थिक विविधता लक्षात घेऊन policies तयार केल्यास exclusion कमी होऊ शकते.", "Representation, consultation आणि grievance redressal हे विविध समाजात trust-building ची साधने आहेत."] },
      { title: "आव्हाने आणि उपाय", points: ["Identity conflicts, unequal access आणि discrimination governance ला आव्हान देऊ शकतात.", "Constitutional equality, affirmative measures, decentralisation आणि dialogue यांद्वारे समावेशकता वाढवता येते."] }
    ],
    facts: ["Inclusive governance is not merely representation; it also requires equal access and voice", "Social trust is an important governance outcome"]
  },
  "g1-constitutional": {
    subtopics: [
      { title: "घटनात्मक आधार", points: ["Preamble मूल्यात्मक दिशा देतो; Fundamental Rights नागरिकांचे संरक्षण करतात; DPSP welfare orientation देतात.", "Articles 14, 19, 21 आणि 38–40 यांसारख्या तरतुदी equality, liberty, welfare आणि decentralisation शी संबंधित governance dimensions दाखवतात."] },
      { title: "Decentralisation आणि accountability", points: ["73वी व 74वी घटनादुरुस्ती स्थानिक स्वराज्य संस्थांना घटनात्मक आधार देतात.", "Constitutionalism governance ला discretion वर कायदेशीर मर्यादा आणि institutional accountability देते."] }
    ],
    facts: ["Preamble + FR + DPSP + local self-government form a broad constitutional governance framework", "Constitutional governance = power with legal limits and accountability"]
  },
  "g1-indian-tradition": {
    subtopics: [
      { title: "Raj Dharma", points: ["राज्यकर्त्याचे कर्तव्य लोककल्याण, न्याय, सुरक्षा आणि सुव्यवस्था यांच्याशी जोडले जाते.", "राजसत्तेच्या नैतिकतेत ruler's welfare आणि public welfare यांच्यातील संबंधावर भर दिसतो."] },
      { title: "Kautilyan perspective", points: ["Arthashastra मध्ये राज्यसुरक्षा, अर्थव्यवस्था, न्याय, प्रशासन आणि माहितीव्यवस्था यांचा परस्परसंबंध दिसतो.", "आधुनिक public administration शी तुलना करताना accountability आणि constitutional limits यांचा स्वतंत्र आधुनिक संदर्भ लक्षात घ्यावा."] }
    ],
    facts: ["Raj Dharma → duty-oriented conception of rule", "Arthashastra → administration, security, economy and justice"]
  },
  "g1-characteristics": {
    subtopics: [
      { title: "Good Governance चे 8 प्रमुख dimensions", points: ["Participation, consensus orientation, accountability, transparency.", "Responsiveness, effectiveness and efficiency, equity and inclusiveness, rule of law."] },
      { title: "परस्परसंबंध", points: ["Transparency मुळे informed participation शक्य होते; participation मुळे accountability मजबूत होते.", "Rule of law शिवाय efficiency देखील arbitrary administration मध्ये बदलू शकते."] },
      { title: "Mains framework", points: ["उत्तर लिहिताना principle → institutional mechanism → citizen outcome → challenge → reform असा क्रम वापरता येतो."] }
    ],
    facts: ["UNDP-associated framework: participation, rule of law, transparency, responsiveness, consensus, equity, effectiveness, accountability"]
  },
  "g2-framework-history": {
    subtopics: [
      { title: "औपनिवेशिक वारसा", points: ["Centralisation, hierarchy, district administration आणि revenue-oriented administration यांनी स्वतंत्र भारताच्या bureaucratic structure वर प्रभाव टाकला.", "स्वातंत्र्यानंतर त्याच administrative machinery ला democratic accountability आणि welfare objectives शी जोडण्यात आले."] },
      { title: "Continuity आणि change", points: ["Institutional continuity मुळे administrative capacity मिळाली; परंतु colonial command culture बदलण्यासाठी democratic participation आणि citizen orientation आवश्यक ठरली."] }
    ],
    facts: ["Colonial legacy included centralisation and hierarchy", "Post-independence governance added democracy, welfare and development objectives"]
  },
  "g2-constitution-governance": {
    subtopics: [
      { title: "Rights-based governance", points: ["Fundamental Rights राज्याच्या कृतीवर substantive आणि procedural constitutional limits आणतात.", "DPSP welfare, public health, education, livelihood आणि social justice-oriented policy direction देतात."] },
      { title: "Constitutional morality", points: ["Governance मध्ये majority preference पेक्षा constitutional values, equality, liberty, dignity आणि institutional limits यांना महत्त्व दिले जाते."] }
    ],
    facts: ["FR = enforceable rights; DPSP = non-justiciable but fundamental governance directions", "Constitutional morality supports institutional restraint and equal citizenship"]
  },
  "g2-judicial-governance": {
    subtopics: [
      { title: "Judicial Review", points: ["न्यायालये legislative आणि executive action ची constitutional validity तपासू शकतात.", "Judicial review हे constitutional supremacy आणि rights protection चे साधन आहे."] },
      { title: "Governance वर परिणाम", points: ["Public interest litigation, due process jurisprudence आणि institutional accountability यांमुळे प्रशासनिक निर्णयांचे न्यायालयीन परीक्षण वाढले.", "Judicial activism आणि separation of powers यांचा समतोल Mains मध्ये चर्चेसाठी महत्त्वाचा आहे."] }
    ],
    facts: ["Judicial review protects constitutional limits", "Governance requires balance between judicial oversight and institutional roles"]
  },
  "g2-executive-legislature": {
    subtopics: [
      { title: "Legislative oversight", points: ["Question Hour, discussions, motions, committees आणि budgetary control ही कार्यपालिकेवरील संसदीय उत्तरदायित्वाची साधने आहेत.", "Committee scrutiny प्रशासनिक तपशील आणि खर्चाचे परीक्षण करण्यास मदत करते."] },
      { title: "Policy cycle", points: ["Legislature policy framework आणि appropriation मंजूर करते; executive implementation करते; legislature आणि audit institutions नंतर oversight करतात.", "Effective governance मध्ये policy speed आणि democratic scrutiny यांचे संतुलन आवश्यक आहे."] }
    ],
    facts: ["Executive implements; legislature legislates and oversees", "Parliamentary committees are important instruments of detailed scrutiny"]
  },
  "g2-administration-structure": {
    subtopics: [
      { title: "Multi-level administration", points: ["Union, State, district आणि sub-district administration मध्ये कार्यविभाजन असते.", "District Collector/DM, line departments आणि local bodies यांच्या coordination वर service delivery मोठ्या प्रमाणात अवलंबून असते."] },
      { title: "Decentralisation", points: ["स्थानिक संस्थांना functions, funds आणि functionaries मिळाल्यास local accountability मजबूत होते.", "Centralisation coordination देऊ शकते; decentralisation local responsiveness वाढवू शकते."] }
    ],
    facts: ["District administration is a key field-level coordination layer", "3Fs = functions, funds, functionaries"]
  },
  "g3-institutions": {
    subtopics: [
      { title: "Institutional roles", points: ["Governance मध्ये regulatory, investigative, financial, security आणि disaster-management institutions वेगवेगळ्या प्रकारची accountability निर्माण करतात.", "Institutional mandates स्पष्ट असणे overlap आणि jurisdictional conflict कमी करण्यास मदत करते."] },
      { title: "Capacity and autonomy", points: ["स्वायत्तता, तांत्रिक क्षमता, संसाधने आणि parliamentary/judicial oversight यांचा संतुलित वापर संस्थात्मक परिणामकारकतेसाठी आवश्यक आहे."] }
    ],
    facts: ["Institutional design should combine mandate, capacity and accountability", "Autonomy does not eliminate the need for oversight"]
  },
  "g3-nia": {
    subtopics: [
      { title: "Mandate", points: ["NIA ही राष्ट्रीय पातळीवरील तपास संस्था असून केंद्र सरकारने निर्दिष्ट केलेल्या scheduled offences संदर्भात तपास करते.", "राष्ट्रीय सुरक्षेशी संबंधित गंभीर गुन्ह्यांच्या तपासात central coordination उपलब्ध करून देणे हा तिच्या चौकटीचा भाग आहे."] },
      { title: "Governance perspective", points: ["Security investigation मध्ये rule of law, due process, federal coordination आणि judicial oversight यांचा समतोल आवश्यक आहे."] }
    ],
    facts: ["NIA was created under the National Investigation Agency Act, 2008", "Security governance must operate within constitutional and statutory safeguards"]
  },
  "g3-ndma": {
    subtopics: [
      { title: "Disaster governance cycle", points: ["Prevention, mitigation, preparedness, response, recovery आणि reconstruction हे disaster management cycle चे प्रमुख भाग आहेत.", "NDMA national guidelines आणि policy direction देते; राज्य व जिल्हा संस्थांची implementation भूमिका महत्त्वाची आहे."] },
      { title: "Community-centred approach", points: ["Early warning, local capacity, resilient infrastructure आणि community participation मुळे disaster risk कमी होतो."] }
    ],
    facts: ["Disaster management is risk reduction, not only post-disaster relief", "NDMA operates under the Disaster Management Act, 2005"]
  },
  "g3-rbi": {
    subtopics: [
      { title: "RBI चे governance functions", points: ["Monetary policy, currency management, banking regulation, payment systems आणि financial stability ही RBI च्या व्यापक कार्यक्षेत्रातील महत्त्वाची क्षेत्रे आहेत.", "Regulation मध्ये depositor protection आणि systemic stability यांचा विचार केला जातो."] },
      { title: "Accountability", points: ["Central banking autonomy आणि statutory accountability यांचा समतोल macroeconomic governance साठी महत्त्वाचा आहे."] }
    ],
    facts: ["RBI is India's central bank", "Monetary policy and financial regulation are distinct but interconnected governance functions"]
  },
  "g4-civil-services-role": {
    subtopics: [
      { title: "लोकशाहीतील भूमिका", points: ["Civil services policy advice, implementation, continuity, regulation आणि public service delivery मध्ये भूमिका बजावतात.", "Political executive दिशा ठरवते; permanent executive संस्थात्मक continuity आणि technical-administrative capacity देते."] },
      { title: "Neutrality and responsiveness", points: ["Political neutrality, constitutional commitment, impartiality आणि responsiveness यांचा समतोल civil service ethics चा केंद्रबिंदू आहे."] }
    ],
    facts: ["Civil services provide continuity across elected governments", "Implementation quality strongly affects policy outcomes"]
  },
  "g4-reforms": {
    subtopics: [
      { title: "Reform priorities", points: ["Recruitment quality, domain expertise, training, performance management, lateral capacity and technology adoption हे सुधारणा क्षेत्र आहेत.", "Mission Karmayogi सारख्या initiatives मध्ये competency-based capacity building वर भर आहे."] },
      { title: "Administrative culture", points: ["Rule compliance सोबत problem-solving, innovation, teamwork आणि citizen orientation वाढवणे आवश्यक आहे."] }
    ],
    facts: ["Capacity building is a governance reform, not merely a training exercise", "Competency-based learning links skills to public outcomes"]
  },
  "g5-e-governance": {
    subtopics: [
      { title: "Models", points: ["G2C, G2B, G2G आणि G2E हे e-governance interactions समजण्यासाठी वापरले जाणारे सामान्य वर्गीकरण आहे.", "Digitisation of records आणि end-to-end digital service delivery यात फरक आहे."] },
      { title: "Benefits and risks", points: ["Benefits: speed, traceability, access, data-driven decisions. Risks: digital divide, privacy, cybersecurity, exclusion आणि algorithmic bias."] }
    ],
    facts: ["e-Governance = technology-enabled governance, not technology for its own sake", "Digital inclusion is necessary for equitable e-service delivery"]
  },
  "g5-digital-india": {
    subtopics: [
      { title: "Digital public infrastructure", points: ["Digital identity, digital payments, data exchange आणि public digital platforms service delivery च्या interoperability ला मदत करू शकतात.", "Connectivity आणि affordable access नसल्यास digital public services मध्ये exclusion होऊ शकते."] },
      { title: "Citizen-centric design", points: ["Multilingual interfaces, accessibility, assisted digital services आणि grievance support यांमुळे technology अधिक inclusive बनते."] }
    ],
    facts: ["DPI focuses on reusable public digital rails", "Digital transformation requires process reform alongside digitisation"]
  },
  "g5-data-privacy": {
    subtopics: [
      { title: "Data governance", points: ["Data collection, purpose limitation, accuracy, security, retention, sharing and accountability हे data governance चे महत्त्वाचे घटक आहेत.", "Public-sector data मध्ये privacy आणि legitimate public interest यांचा संतुलित विचार आवश्यक आहे."] },
      { title: "Emerging technologies", points: ["AI मध्ये bias, explainability, accountability आणि human oversight महत्त्वाचे आहेत; blockchain मध्ये immutability आणि governance trade-offs समजून घेणे आवश्यक आहे."] }
    ],
    facts: ["Privacy and data security are governance concerns, not only technical concerns", "AI governance requires transparency, accountability and human oversight"]
  },
  "g6-accountability": {
    subtopics: [
      { title: "Accountability चे प्रकार", points: ["Political, administrative, legal, financial, social आणि professional accountability असे विविध आयाम आहेत.", "Vertical accountability elections आणि hierarchy मधून; horizontal accountability institutions मधून; social accountability नागरिक/समुदायातून येते."] },
      { title: "Mechanisms", points: ["Audit, parliamentary committees, vigilance, courts, RTI, social audit आणि grievance redressal ही प्रमुख साधने आहेत."] }
    ],
    facts: ["Accountability = answerability + consequences", "Transparency supports accountability but is not identical to it"]
  },
  "g6-transparency": {
    subtopics: [
      { title: "RTI governance chain", points: ["Information disclosure → informed citizen → scrutiny → participation → accountability असा logical chain तयार होतो.", "RTI Act, 2005 ने public authorities कडील माहिती मिळवण्याचा वैधानिक framework दिला."] },
      { title: "Proactive disclosure", points: ["Section 4 अंतर्गत proactive disclosure चा उद्देश नागरिकांना प्रत्येक माहितीकरिता स्वतंत्र अर्ज करण्याची गरज कमी करणे हा आहे.", "Transparency मध्ये personal privacy, national security आणि legitimate exemptions यांचा कायदेशीर समतोलही आवश्यक आहे."] }
    ],
    facts: ["RTI Act, 2005", "Proactive disclosure is a core transparency principle", "Transparency must be reconciled with lawful exemptions and privacy"]
  },
  "g6-citizen-charter": {
    subtopics: [
      { title: "Citizen Charter चे घटक", points: ["Service standards, time limits, responsible officers, grievance mechanism आणि citizen expectations हे प्रमुख घटक आहेत.", "Charter हा service commitment document आहे; त्याची effectiveness measurable standards आणि monitoring वर अवलंबून असते."] },
      { title: "Sevottam", points: ["Citizen Charter, grievance redressal आणि service delivery capability या तीन व्यापक घटकांद्वारे service quality सुधारण्याचा दृष्टिकोन Sevottamशी जोडला जातो."] }
    ],
    facts: ["Citizen Charter → standards + time limits + grievance route", "Sevottam focuses on citizen-centric service excellence"]
  },
  "g6-social-audit": {
    subtopics: [
      { title: "Social Audit process", points: ["Records access → community verification → public hearing → findings → corrective action हा सामान्य social audit cycle आहे.", "Community members खर्च, beneficiaries आणि कामाच्या प्रत्यक्ष परिणामांची पडताळणी करू शकतात."] },
      { title: "Importance", points: ["Social audit state capacity ला replace करत नाही; ते public accountability आणि community verification वाढवते."] }
    ],
    facts: ["Social audit is participatory accountability", "MGNREGA is a major Indian example of statutory social audit architecture"]
  },
  "g6-grievance": {
    subtopics: [
      { title: "Effective grievance redressal", points: ["Accessible complaint registration, acknowledgement, time-bound processing, escalation and closure with feedback हे आवश्यक घटक आहेत.", "Grievance data policy सुधारण्यासाठी recurring service-delivery failures ओळखण्यास उपयोगी पडतो."] },
      { title: "CPGRAMS", points: ["CPGRAMS हे केंद्र शासनाशी संबंधित सार्वजनिक तक्रारींच्या नोंदणी व tracking साठी digital platform आहे.", "Technology-based tracking सोबत departmental ownership आणि timely resolution आवश्यक आहे."] }
    ],
    facts: ["Grievance redressal is both a citizen service and an administrative feedback loop", "CPGRAMS enables online registration and tracking of public grievances"]
  },
  "g7-citizen-participation": {
    subtopics: [
      { title: "Participation चे स्तर", points: ["Information, consultation, involvement, collaboration आणि citizen empowerment हे participation चे वाढते स्तर म्हणून समजता येतात.", "Participation meaningful होण्यासाठी timely information, accessibility आणि response to citizen input आवश्यक आहे."] },
      { title: "Indian mechanisms", points: ["Gram Sabha, public consultations, social audit, RTI, local planning आणि digital feedback platforms नागरिक सहभागाची साधने आहेत."] }
    ],
    facts: ["Participation without information is often ineffective", "Gram Sabha is a key constitutional institution of local democratic participation"]
  },
  "g7-ngos": {
    subtopics: [
      { title: "NGO roles", points: ["Service delivery, awareness, advocacy, capacity building, social mobilisation आणि independent monitoring ही NGOs ची सामान्य कार्ये आहेत.", "NGOs सरकारच्या सेवा पोहोचू न शकलेल्या क्षेत्रांत community interface देऊ शकतात."] },
      { title: "Governance concerns", points: ["Accountability, funding transparency, regulatory compliance आणि representativeness हे NGO governance मधील महत्त्वाचे प्रश्न आहेत."] }
    ],
    facts: ["NGOs can act as service providers, facilitators and accountability actors", "Partnership requires transparency and role clarity"]
  },
  "g7-shg": {
    subtopics: [
      { title: "SHG model", points: ["Small groups नियमित बचत, internal lending, collective decision-making आणि bank linkage यांवर आधारित असतात.", "SHGs आर्थिक सेवांबरोबर collective agency आणि local participation वाढवू शकतात."] },
      { title: "Women empowerment", points: ["Financial access, collective voice, livelihood activities आणि local institutions मधील participation यामुळे SHGs चे governance relevance वाढते."] }
    ],
    facts: ["SHG → savings + credit + collective action", "SHGs can strengthen financial inclusion and local participation"]
  },
  "g7-microfinance": {
    subtopics: [
      { title: "Financial inclusion", points: ["Microfinance मध्ये small-value credit, savings, insurance किंवा related financial services underserved households पर्यंत पोहोचवण्याचा प्रयत्न होतो.", "Responsible lending मध्ये affordability, transparency आणि borrower protection आवश्यक आहे."] },
      { title: "Governance relevance", points: ["Financial inclusion livelihood, women empowerment आणि local economic participation शी जोडली जाते; परंतु over-indebtedness चा धोका लक्षात घ्यावा."] }
    ],
    facts: ["Microfinance is one component of financial inclusion", "Responsible finance requires borrower protection and transparency"]
  },
  "g8-consensus": {
    subtopics: [
      { title: "Consensus building", points: ["Stakeholder mapping → dialogue → negotiation → accommodation → implementation support हा consensus-building चा practical framework आहे.", "Consensus म्हणजे unanimity नव्हे; legitimate disagreement असतानाही workable common ground शोधणे होय."] },
      { title: "Democratic value", points: ["Federal, linguistic, social आणि regional diversity असलेल्या समाजात consensus conflict management आणि policy legitimacy वाढवू शकतो."] }
    ],
    facts: ["Consensus ≠ unanimity", "Deliberation improves legitimacy when stakeholders have meaningful voice"]
  },
  "g9-inclusive-governance": {
    subtopics: [
      { title: "Inclusion dimensions", points: ["Representation, access, participation, capability and outcomes हे inclusion चे वेगवेगळे dimensions आहेत.", "Women, SC/ST, minorities, persons with disabilities, elderly and other vulnerable groups साठी barrier-sensitive governance आवश्यक आहे."] },
      { title: "From welfare to empowerment", points: ["Inclusive governance मध्ये beneficiaries ना passive recipients न मानता rights-holders आणि participants म्हणून पाहणे महत्त्वाचे आहे."] }
    ],
    facts: ["Inclusion = voice + access + capability + fair outcomes", "Universal design and targeted support can operate together"]
  },
  "g9-welfare": {
    subtopics: [
      { title: "Welfare delivery chain", points: ["Identification → eligibility → enrolment → benefit delivery → grievance redressal → outcome monitoring हा welfare delivery cycle आहे.", "Leakages, exclusion errors आणि inclusion errors कमी करणे delivery governance चे महत्त्वाचे उद्दिष्ट आहे."] },
      { title: "Digital welfare", points: ["Digital platforms tracking आणि portability वाढवू शकतात; परंतु authentication failure, connectivity आणि digital literacy यामुळे exclusion होऊ शकते."] }
    ],
    facts: ["Welfare governance must address both leakage and exclusion", "Outcome monitoring is more meaningful than beneficiary counts alone"]
  },
  "g10-environment": {
    subtopics: [
      { title: "Environmental governance principles", points: ["Sustainable development, precautionary approach, polluter pays, intergenerational equity आणि public participation हे महत्त्वाचे policy principles आहेत.", "Economic development आणि ecological limits यांचा समतोल environmental governance चा मूलभूत प्रश्न आहे."] },
      { title: "Institutions", points: ["Legislation, regulatory authorities, local bodies, courts, scientific institutions आणि communities एकत्रितपणे environmental governance मध्ये भूमिका बजावतात."] }
    ],
    facts: ["Environmental governance combines regulation, conservation and participation", "Intergenerational equity links present decisions with future welfare"]
  },
  "g10-participation": {
    subtopics: [
      { title: "Participation mechanisms", points: ["Environmental information, public consultation, monitoring, community conservation आणि grievance mechanisms नागरिक सहभागाचे मार्ग आहेत.", "Local ecological knowledge policy design मध्ये पूरक ठरू शकते."] },
      { title: "Accountability", points: ["Environmental impact, compliance monitoring आणि disclosure यामुळे regulators आणि project proponents वर accountability वाढते.", "Participation meaningful होण्यासाठी accessible information आणि reasoned response आवश्यक आहे."] }
    ],
    facts: ["Environmental accountability requires information + monitoring + participation", "Community participation can improve legitimacy and compliance"]
  },
  "g11-economic-governance": {
    subtopics: [
      { title: "Core dimensions", points: ["Fiscal management, public expenditure, regulation, taxation, resource allocation आणि macroeconomic coordination हे economic governance चे प्रमुख भाग आहेत.", "Efficiency सोबत equity आणि stability यांचाही विचार आवश्यक आहे."] },
      { title: "Public expenditure quality", points: ["Outcome budgeting, cost-benefit analysis, procurement controls, audit आणि expenditure tracking यामुळे public money चा परिणामकारक वापर सुधारता येतो."] }
    ],
    facts: ["Economic governance = allocation + stability + efficiency + accountability", "Public money requires both financial control and outcome orientation"]
  },
  "g11-regulation": {
    subtopics: [
      { title: "Good regulation", points: ["Clear objectives, evidence, proportionality, consultation, transparency, predictable enforcement आणि periodic review हे प्रभावी regulation चे गुण आहेत.", "Over-regulation compliance cost वाढवू शकते; under-regulation public harm वाढवू शकते."] },
      { title: "Regulatory governance", points: ["Regulators ना technical capacity आणि operational independence आवश्यक असू शकते; त्याच वेळी accountability आणि judicial review आवश्यक राहतात."] }
    ],
    facts: ["Good regulation balances public interest and compliance burden", "Regulatory quality depends on evidence, capacity and accountability"]
  },
  "g12-corruption": {
    subtopics: [
      { title: "Corruption चे प्रकार", points: ["Bribery, embezzlement, procurement manipulation, favouritism, nepotism आणि abuse of office हे विविध manifestations आहेत.", "Petty corruption आणि grand/systemic corruption यांची scale आणि institutional effects वेगवेगळी असू शकतात."] },
      { title: "Governance impact", points: ["Corruption public trust, fair competition, service delivery आणि resource allocation वर प्रतिकूल परिणाम करू शकतो.", "Prevention, detection, investigation, prosecution आणि institutional ethics यांची integrated strategy आवश्यक आहे."] }
    ],
    facts: ["Corruption is an abuse of entrusted power for improper benefit", "Anti-corruption policy needs prevention as well as enforcement"]
  },
  "g12-ethics": {
    subtopics: [
      { title: "Ethical decision-making", points: ["Public interest, legality, fairness, impartiality, transparency and proportionality हे administrative decisions तपासण्यासाठी उपयोगी ethical lenses आहेत.", "Conflict of interest ओळखणे, disclose करणे आणि आवश्यक असल्यास recuse होणे ही integrity-oriented practices आहेत."] },
      { title: "Ethics and efficiency", points: ["Ethics efficiency च्या विरोधात नाही; fair procedures आणि integrity मुळे institutional trust आणि long-term administrative effectiveness मजबूत होऊ शकते."] }
    ],
    facts: ["Ethical governance = public interest + integrity + fairness + accountability", "Conflict-of-interest management is central to public ethics"]
  },
  "g12-anti-corruption": {
    subtopics: [
      { title: "Legal and institutional framework", points: ["Prevention of Corruption Act, Lokpal and Lokayuktas framework, CVC, RTI and related financial investigation laws anti-corruption architecture चे वेगवेगळे भाग आहेत.", "वेगवेगळ्या संस्थांचे mandates वेगळे असतात; त्यांची तुलना करताना jurisdiction आणि statutory basis लक्षात घ्यावी."] },
      { title: "Whistleblowing and vigilance", points: ["Whistleblower protection, internal vigilance, procurement controls, audit trails आणि digital records corruption prevention ला मदत करू शकतात.", "Investigation agencies च्या effectiveness साठी autonomy, professional capacity आणि due process आवश्यक आहेत."] }
    ],
    facts: ["Prevention of Corruption Act, 1988 is a core anti-corruption statute", "Lokpal and Lokayuktas Act, 2013 created a statutory ombudsman framework", "CVC is a statutory vigilance institution at the Union level"]
  },
  "g12-civil-code": {
    subtopics: [
      { title: "Code of Conduct vs Code of Ethics", points: ["Code of Conduct सामान्यतः prescribed behavioural rules आणि prohibited conduct स्पष्ट करतो; Code of Ethics broader values आणि principles व्यक्त करतो.", "दोन्हींची प्रभावीता leadership example, training, disclosure आणि enforcement वर अवलंबून असते."] },
      { title: "Conflict of interest", points: ["Public office holder च्या private interest मुळे official duty प्रभावित होण्याची शक्यता conflict of interest निर्माण करते.", "Disclosure, recusal, asset declarations आणि institutional review हे management tools असू शकतात."] }
    ],
    facts: ["Conduct rules are enforceable standards; ethics provides broader value orientation", "Conflict of interest is not necessarily corruption, but unmanaged conflicts can create integrity risks"]
  },
  "g12-institutional-reforms": {
    subtopics: [
      { title: "Reform architecture", points: ["Structural reform, process simplification, capacity building, technology, performance management आणि citizen feedback यांचा एकत्रित वापर आवश्यक आहे.", "Institutional autonomy सोबत transparency आणि accountability safeguards ठेवणे आवश्यक आहे."] },
      { title: "Local governance capacity", points: ["Local bodies ना trained personnel, predictable finance, functional devolution आणि technical support दिल्यास implementation capacity वाढू शकते.", "Capacity building हा one-time training नसून continuous learning process असावा."] }
    ],
    facts: ["Institutional reform should address structure, incentives, skills and processes together", "Capacity without accountability can be ineffective; accountability without capacity can also fail"]
  },
  "g12-future-governance": {
    subtopics: [
      { title: "Future governance priorities", points: ["Citizen-centric digital services, evidence-based policy, interoperable systems, climate resilience, institutional capacity आणि participatory governance हे महत्त्वाचे directions आहेत.", "AI आणि automation वाढताना human oversight, privacy, accessibility आणि accountability कायम ठेवणे आवश्यक आहे."] },
      { title: "Mains conclusion framework", points: ["भारतासाठी सुशासनाचा मार्ग: constitutional values + capable institutions + empowered citizens + technology with safeguards + measurable outcomes.", "Reforms चे अंतिम मापन नागरिकांच्या अनुभवातील सुधारणा, service quality आणि public trust यावर करणे अधिक अर्थपूर्ण आहे."] }
    ],
    facts: ["Future-ready governance = constitutional + citizen-centric + technology-enabled + accountable", "Technology should strengthen institutions rather than replace public accountability"]
  }
};
