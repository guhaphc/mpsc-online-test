export type MedievalHistorySourceChapter = {
  chapter: number;
  title: string;
  pdfPages: string;
  printedPages: string;
  coverage: string[];
};

export const medievalHistorySource = {
  file: "MEDIEVAL HISTORY.pdf",
  sourceVersion: "uploaded 2026-09-20",
  pdfPages: 164,
  printedContentPages: "1–162",
  contentsPage: 1,
  blankFinalPage: 164,
  totalExtractedWords: 104017,
  totalExtractedCharacters: 951822,
  chapters: [
    {
      chapter: 1,
      title: "The Early Medieval India",
      pdfPages: "2–13",
      printedPages: "1–12",
      coverage: ["regional kingdoms","Gurjara-Pratiharas","Palas","Rashtrakutas","Eastern Gangas","society and economy","culture","religion","education","trade","architectural traditions"]
    },
    {
      chapter: 2,
      title: "Southern India (c. 850–1200 CE)",
      pdfPages: "14–29",
      printedPages: "13–28",
      coverage: ["Cholas","Chola rulers","administration","village assemblies","revenue","society","economy","maritime contacts","South-East Asia","Hoysalas","Pandyas","architecture","literature"]
    },
    {
      chapter: 3,
      title: "Northern India (c. 1000–1200 CE)",
      pdfPages: "30–51",
      printedPages: "29–50",
      coverage: ["Rajput states","Chauhans","Chandellas","Paramaras","Solankis","Tomaras","Gahadavalas","Karkotas","Kashmir","Hindu Shahis","Kalachuris","Eastern Gangas","Western Chalukyas","society","science","technology","philosophy"]
    },
    {
      chapter: 4,
      title: "The Delhi Sultanate",
      pdfPages: "52–73",
      printedPages: "51–72",
      coverage: ["Ghaznavids","Ghurids","Slave dynasty","Iltutmish","Razia","Balban","Khaljis","Alauddin Khalji","Tughlaqs","Muhammad bin Tughlaq","Firoz Shah Tughlaq","Sayyids","Lodhis","administration","iqta","coinage","technology","art and architecture"]
    },
    {
      chapter: 5,
      title: "Vijayanagar Empire and Bahamani Kingdoms",
      pdfPages: "74–90",
      printedPages: "73–89",
      coverage: ["Vijayanagar","Sangama","Saluva","Tuluva","administration","economy","coinage","society","culture","architecture","Bahamani Sultanate","Deccan successor states"]
    },
    {
      chapter: 6,
      title: "Provincial Kingdoms of Medieval India",
      pdfPages: "91–102",
      printedPages: "90–101",
      coverage: ["Gujarat","Malwa","Jaunpur","Bengal","Kashmir","other provincial states","administration","architecture","regional political developments"]
    },
    {
      chapter: 7,
      title: "The Mughal Rule and Later Mughals (c. 1526–1857)",
      pdfPages: "103–134",
      printedPages: "102–133",
      coverage: ["Babur","Humayun","Sher Shah","Akbar","Jahangir","Shah Jahan","Aurangzeb","later Mughals","Mughal administration","mansabdari","jagirdari","revenue","society","economy","trade","European travellers","art","architecture","literature","music","decline"]
    },
    {
      chapter: 8,
      title: "The Marathas and Other Provincial Kingdoms",
      pdfPages: "135–149",
      printedPages: "134–148",
      coverage: ["Shivaji","Maratha administration","Ashtapradhan","revenue","military organisation","Mughal-Maratha conflict","Rajaram","Tarabai","Shahu","Balaji Vishwanath","Bajirao I","Panipat","Maratha confederacy","Bengal","Awadh","Hyderabad","Punjab","Mysore","Travancore"]
    },
    {
      chapter: 9,
      title: "Bhakti and Sufi Movements",
      pdfPages: "150–163",
      printedPages: "149–162",
      coverage: ["Alvars","Nayanars","Shankaracharya","Ramanuja","North Indian Bhakti","Kabir","Guru Nanak","Chaitanya","Maharashtra Bhakti","Dnyaneshwar","Namdev","Eknath","Tukaram","women saints","Sufi traditions","Chishti","Suhrawardi","Qadiri","Naqshbandi","comparative study"]
    }
  ] as MedievalHistorySourceChapter[],
  policy: "The uploaded PDF is the source basis. Existing structured notes should not be treated as a substitute for source coverage; additions must preserve source-supported information and clearly distinguish later verification or expansion."
} as const;
