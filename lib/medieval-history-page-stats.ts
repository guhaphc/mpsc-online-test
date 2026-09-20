export type MedievalHistoryPageRange = {
  chapter: number;
  pdfStart: number;
  pdfEnd: number;
  printedStart: number;
  printedEnd: number;
};

export const medievalHistoryPageRanges: MedievalHistoryPageRange[] = [
  { chapter: 1, pdfStart: 2, pdfEnd: 13, printedStart: 1, printedEnd: 12 },
  { chapter: 2, pdfStart: 14, pdfEnd: 29, printedStart: 13, printedEnd: 28 },
  { chapter: 3, pdfStart: 30, pdfEnd: 51, printedStart: 29, printedEnd: 50 },
  { chapter: 4, pdfStart: 52, pdfEnd: 73, printedStart: 51, printedEnd: 72 },
  { chapter: 5, pdfStart: 74, pdfEnd: 90, printedStart: 73, printedEnd: 89 },
  { chapter: 6, pdfStart: 91, pdfEnd: 102, printedStart: 90, printedEnd: 101 },
  { chapter: 7, pdfStart: 103, pdfEnd: 134, printedStart: 102, printedEnd: 133 },
  { chapter: 8, pdfStart: 135, pdfEnd: 149, printedStart: 134, printedEnd: 148 },
  { chapter: 9, pdfStart: 150, pdfEnd: 163, printedStart: 149, printedEnd: 162 }
];

export const medievalHistoryProcessingStats = {
  pdfPages: 164,
  historicalContentPdfPages: 162,
  chapterCount: 9,
  sourceExtractedForProcessing: true,
  pageBoundariesPreserved: true,
  note: "This index records source coverage and page boundaries. It does not replace the source PDF or claim that every source sentence has been converted into a student-facing note."
} as const;
