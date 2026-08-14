export interface FaqItem {
  questionKey: string;
  answerKey?: string;
}

export const HOME_FAQ_PREVIEW_ITEMS: FaqItem[] = [
  {
    questionKey: 'home.faq.items.applyConnection.question',
    answerKey: 'home.faq.items.applyConnection.answer',
  },
  {
    questionKey: 'home.faq.items.requestDuration.question',
    answerKey: 'home.faq.items.requestDuration.answer',
  },
  {
    questionKey: 'home.faq.items.submitComplaint.question',
    answerKey: 'home.faq.items.submitComplaint.answer',
  },
  {
    questionKey: 'home.faq.items.serviceDisruption.question',
    answerKey: 'home.faq.items.serviceDisruption.answer',
  },
];

export const FAQ_PAGE_ITEMS: FaqItem[] = [
  ...HOME_FAQ_PREVIEW_ITEMS,
  {
    questionKey: 'faqPage.items.customerServiceHours.question',
    answerKey: 'faqPage.items.customerServiceHours.answer',
  },
  {
    questionKey: 'faqPage.items.trackRequestStatus.question',
    answerKey: 'faqPage.items.trackRequestStatus.answer',
  },
];
