export const PAGE_HEADER = {
  title: 'Practice investing without real money',
  subtitle:
    'Train with a live-data paper portfolio. The lab teaches plain-language investing decisions first, then introduces the market terms after you use them. No real money is at risk — mistakes here are how you learn.',
};

export const INTRO_STEPS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: '1. Pick a company',
    body: 'Choose something from the leaderboard you would like to learn about.',
  },
  {
    title: '2. Make a simple plan',
    body: 'Answer four short questions in plain language. The lab will suggest a safer practice size for you.',
  },
  {
    title: '3. Review what happened',
    body: 'When you sell, write down what you learned. The dashboard turns that into feedback you can use.',
  },
];

export const GUIDED_FLOW = {
  sectionTitle: 'Guided practice trade',
  sectionSubtitle:
    'Six short steps. Plain language first; the investing term is shown underneath so you learn it as you go.',
  steps: {
    pickCompany: {
      number: 1,
      title: 'Choose a company to practice with',
      hint: 'Use the leaderboard or any ticker you already follow.',
    },
    explainReason: {
      number: 2,
      title: 'Explain why it might become more valuable',
      term: 'Investors call this your investment thesis.',
      placeholder:
        'Example: Revenue is growing, debt is manageable, and the stock is cheaper than similar companies.',
    },
    wrongSignal: {
      number: 3,
      title: 'Decide what would prove the idea wrong',
      term: 'Investors call this an invalidation point.',
      placeholder:
        'Example: Price falls below my wrong-price level or the company reports weaker earnings.',
      wrongPriceLabel: 'Your "I was wrong" price',
      wrongPriceHint: 'Used for position sizing.',
    },
    practiceRisk: {
      number: 4,
      title: 'Choose a small practice risk',
      term: 'Investors call this risk per trade.',
      maxLossLabel: 'Max practice loss',
      maxLossHint: 'How much you accept losing if wrong.',
      lossTypeLabel: 'Loss type',
      lossTypeHint: 'Amount or portfolio percent.',
    },
    reviewWindow: {
      number: 5,
      title: 'Choose when to check back',
      term: 'Investors call this a review condition.',
      placeholder: 'Example: Review after 30 days or after the next earnings report.',
    },
    placeTrade: {
      number: 6,
      title: 'Place the paper trade',
      hint: 'You can buy when the steps above are filled in.',
    },
  },
};

export const POSITIONS = {
  sectionTitle: 'Positions you are practicing with',
  emptyMessage: 'No positions yet. Complete the six steps above to place your first paper trade.',
  unplannedMessage:
    'This is unplanned practice history from before the guided lab. Future trades should include a plan.',
  reviewButtonLabel: 'Review and sell',
  hints: {
    pastWrongPrice: 'Price is below your wrong-price. Time to review.',
    withinPlan: 'Keep watching. Review when your plan says to.',
  },
};

export const SELL_REVIEW = {
  panelTitle: 'Review and sell',
  panelSubtitle:
    'Selling records a review so the lab can teach from your decisions, not only from profit or loss.',
  outcomeLabel: 'Did your original idea work?',
  outcomeOptions: {
    worked: 'Worked',
    failed: 'Failed',
    unclear: 'Still unclear',
  },
  followedPlanLabel: 'Did you follow your plan?',
  mistakeLabel: 'Mistake type, if any',
  lessonLabel: 'What did you learn?',
  lessonPlaceholder:
    'Example: I bought before I understood the risk, or the plan worked but the position was too large.',
  cancelButtonLabel: 'Cancel',
  confirmSellButtonLabel: 'Record review and sell',
};

export const DASHBOARD = {
  sectionTitle: 'Learning Dashboard',
  cashLabel: 'Cash',
  portfolioValueLabel: 'Portfolio Value',
  totalPnlLabel: 'Total P/L',
  planFollowingTopLabel: 'Times you followed your plan',
  metrics: {
    completedPlans: 'Practice plans made',
    closedReviews: 'Trades reviewed',
    averageWin: 'Average win when you were right',
    averageLoss: 'Average loss when you were wrong',
    commonMistake: 'Mistake to watch for',
  },
  disclaimer: 'This is practice feedback, not financial advice or a promise of future returns.',
};

export const CHECKLIST = {
  sectionTitle: 'Your practice checklist',
  items: [
    'Pick one company you would like to learn about.',
    'Write a plain-language reason for buying.',
    'Write what would prove your idea wrong.',
    'Choose how much you would accept losing.',
    'Place one practice trade with a complete plan.',
    'After at least a week, review the trade and write down one lesson.',
  ] as const,
};

export const JOURNAL = {
  sectionTitle: 'Trading Journal',
  placeholder:
    'What pattern do you notice in your decisions? What will you do differently in the next practice trade?',
};

export const RECENT_TRADES = {
  sectionTitle: 'Recent Trades',
  emptyMessage: 'No trades logged yet.',
};
