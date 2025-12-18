# Learning Mode - Comprehensive Implementation Plan

**Feature Owner:** Development Team
**Created:** 2025-12-18
**Status:** Planning Phase
**Target Quality:** Production-Grade

---

## Executive Summary

Learning Mode is an interactive educational feature that transforms the Avanza Stock Finder from a tool into a teacher. Users can toggle Learning Mode on/off in the UI, and when enabled, the app guides them step-by-step through:

1. **Graph Analysis** - How to read and interpret price charts, technical indicators, and patterns
2. **Investment Criteria** - Understanding fundamental metrics and what makes a good investment
3. **Scoring System** - How the 4-factor scoring works and why it matters
4. **Strategy Selection** - When to use which investment strategy
5. **Practical Application** - Hands-on exercises with real stock data

---

## Current Application Analysis

### Existing Architecture

**Frontend Stack:**
- React 18 + TypeScript
- Tailwind CSS (dark theme with glassmorphism)
- React Router v6
- Recharts for visualization
- Axios for API communication
- WatchlistContext for state management

**Backend Stack:**
- FastAPI (Python 3.11)
- SQLAlchemy + PostgreSQL/SQLite
- Multi-factor scoring engine
- Technical indicators (RSI, MAs, volume)

### Existing Educational Elements

The app already has some educational components that we can build upon:

| Element | Location | Current State |
|---------|----------|---------------|
| Welcome Banner | Home Page | Basic intro text |
| Strategy Descriptions | Screener | Metric criteria display |
| Score Breakdown | Stock Detail | AI reasoning + strengths/weaknesses |
| Phase Badges | Navigation | Feature maturity indicators |
| Empty State Messages | Various | Contextual guidance |

### Missing Educational Infrastructure

- No dedicated onboarding/tutorial system
- No interactive walkthroughs
- No metric glossary/tooltips
- No progressive learning curriculum
- No user progress tracking
- No quiz/validation system
- No contextual help popups

---

## Feature Requirements

### Core Functionality

1. **Global Learning Mode Toggle**
   - Persistent toggle in header/settings
   - Visual indicator when Learning Mode is active
   - Stored in localStorage for persistence

2. **Contextual Lessons**
   - Lessons appear relevant to current page/component
   - Non-intrusive but discoverable
   - Can be dismissed or expanded

3. **Progressive Curriculum**
   - Structured learning path with modules
   - Track completion progress
   - Unlock advanced topics as basics are completed

4. **Interactive Elements**
   - Tooltips on hover for metrics/components
   - Step-by-step guided tours
   - Practice exercises with feedback
   - Quizzes to validate understanding

5. **Graph Analysis Training**
   - Annotated charts with explanations
   - Pattern recognition exercises
   - Technical indicator tutorials
   - Real-time annotation overlay

### User Experience Goals

- **Non-disruptive**: Normal users can use app without friction
- **Discoverable**: Easy to find and enable Learning Mode
- **Progressive**: Start simple, advance to complex topics
- **Practical**: Use real app data, not just theory
- **Retainable**: Save progress, resume later
- **Measurable**: Track user understanding

---

## Technical Architecture

### State Management

```typescript
// LearningModeContext.tsx
interface LearningModeState {
  isEnabled: boolean;
  currentModule: string | null;
  currentLesson: number;
  completedLessons: Set<string>;
  completedModules: Set<string>;
  preferences: {
    showTooltips: boolean;
    showAnnotations: boolean;
    autoAdvance: boolean;
  };
}
```

### Component Architecture

```
LearningModeProvider (Context)
├── LearningModeToggle (Header component)
├── LearningOverlay (Full-screen for guided tours)
├── LessonSidebar (Module navigation)
├── TooltipEnhancer (HOC for adding learning tooltips)
├── ChartAnnotation (Overlay for chart explanations)
├── ProgressTracker (Progress bar/completion status)
├── QuizModal (Knowledge validation)
└── LessonCard (Individual lesson display)
```

### Data Models

```typescript
interface LearningModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessons: Lesson[];
  prerequisites: string[];  // module IDs
  estimatedTime: number;    // minutes
}

interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: 'theory' | 'interactive' | 'quiz' | 'exercise';
  content: LessonContent;
  targetPage?: string;      // which page this lesson is for
  targetComponent?: string; // which component to highlight
  order: number;
}

interface LessonContent {
  text: string;
  highlights?: HighlightArea[];
  annotations?: Annotation[];
  quiz?: QuizQuestion[];
  exercise?: ExerciseConfig;
}
```

---

## Learning Curriculum Structure

### Module 1: Introduction to Stock Analysis (Beginner)
**Duration:** 15-20 minutes

| Lesson | Type | Content |
|--------|------|---------|
| 1.1 | Theory | What is stock analysis? |
| 1.2 | Theory | Fundamental vs Technical analysis |
| 1.3 | Interactive | Tour of the app interface |
| 1.4 | Quiz | Basics validation |

### Module 2: Understanding the Dashboard (Beginner)
**Duration:** 10-15 minutes

| Lesson | Type | Content |
|--------|------|---------|
| 2.1 | Interactive | Navigating stock cards |
| 2.2 | Theory | What each metric means |
| 2.3 | Interactive | Using search and filters |
| 2.4 | Exercise | Find a stock meeting criteria |

### Module 3: Reading Price Charts (Intermediate)
**Duration:** 25-30 minutes

| Lesson | Type | Content |
|--------|------|---------|
| 3.1 | Theory | Candlestick basics |
| 3.2 | Interactive | Annotated price chart tour |
| 3.3 | Theory | Support and resistance |
| 3.4 | Theory | Moving averages explained |
| 3.5 | Interactive | 50-day vs 200-day MA analysis |
| 3.6 | Exercise | Identify trend direction |
| 3.7 | Quiz | Chart reading validation |

### Module 4: Technical Indicators (Intermediate)
**Duration:** 20-25 minutes

| Lesson | Type | Content |
|--------|------|---------|
| 4.1 | Theory | What is RSI? |
| 4.2 | Interactive | RSI chart annotation |
| 4.3 | Theory | Overbought vs Oversold |
| 4.4 | Theory | Volume analysis |
| 4.5 | Interactive | Volume chart annotation |
| 4.6 | Exercise | Spot divergences |
| 4.7 | Quiz | Indicators validation |

### Module 5: The Scoring System (Intermediate)
**Duration:** 20-25 minutes

| Lesson | Type | Content |
|--------|------|---------|
| 5.1 | Theory | 4-factor scoring overview |
| 5.2 | Interactive | Value Score breakdown |
| 5.3 | Interactive | Quality Score breakdown |
| 5.4 | Interactive | Momentum Score breakdown |
| 5.5 | Interactive | Financial Health breakdown |
| 5.6 | Theory | Signal classification |
| 5.7 | Exercise | Analyze a stock's score |
| 5.8 | Quiz | Scoring validation |

### Module 6: Investment Strategies (Intermediate)
**Duration:** 25-30 minutes

| Lesson | Type | Content |
|--------|------|---------|
| 6.1 | Theory | Value investing philosophy |
| 6.2 | Interactive | Value Gems strategy tour |
| 6.3 | Theory | Quality compounding |
| 6.4 | Interactive | Quality Compounders tour |
| 6.5 | Theory | Dividend investing |
| 6.6 | Interactive | Dividend Kings tour |
| 6.7 | Theory | Growth vs Value |
| 6.8 | Exercise | Match stock to strategy |
| 6.9 | Quiz | Strategy validation |

### Module 7: Fundamental Analysis Deep Dive (Advanced)
**Duration:** 30-35 minutes

| Lesson | Type | Content |
|--------|------|---------|
| 7.1 | Theory | P/E Ratio explained |
| 7.2 | Theory | PEG Ratio (Peter Lynch) |
| 7.3 | Theory | ROIC (Buffett's favorite) |
| 7.4 | Theory | Debt/Equity analysis |
| 7.5 | Theory | Free Cash Flow |
| 7.6 | Interactive | Fundamentals tab tour |
| 7.7 | Exercise | Compare two stocks |
| 7.8 | Quiz | Fundamentals validation |

### Module 8: Building a Watchlist (Practical)
**Duration:** 15-20 minutes

| Lesson | Type | Content |
|--------|------|---------|
| 8.1 | Theory | Why use watchlists? |
| 8.2 | Interactive | Creating a watchlist |
| 8.3 | Theory | What to watch for |
| 8.4 | Exercise | Build a 5-stock watchlist |
| 8.5 | Theory | Score change tracking |

### Module 9: Making Investment Decisions (Advanced)
**Duration:** 25-30 minutes

| Lesson | Type | Content |
|--------|------|---------|
| 9.1 | Theory | The decision framework |
| 9.2 | Theory | Risk assessment |
| 9.3 | Theory | Position sizing basics |
| 9.4 | Theory | Entry and exit criteria |
| 9.5 | Exercise | Analyze a buy candidate |
| 9.6 | Quiz | Decision-making validation |

### Module 10: Putting It All Together (Mastery)
**Duration:** 20-25 minutes

| Lesson | Type | Content |
|--------|------|---------|
| 10.1 | Exercise | Full stock analysis |
| 10.2 | Exercise | Compare investment strategies |
| 10.3 | Exercise | Build and justify a portfolio |
| 10.4 | Quiz | Final assessment |
| 10.5 | Certificate | Completion badge |

---

## UI/UX Design Specifications

### Learning Mode Toggle

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]  Browse Stocks  │  Screener  │  Leaderboard  │  [🎓 OFF] │
└──────────────────────────────────────────────────────────────────┘

When enabled:
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]  Browse Stocks  │  Screener  │  Leaderboard  │  [🎓 ON ] │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 📚 Learning Mode Active - Module 3: Reading Price Charts   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Lesson Sidebar

```
┌─────────────────────────────────────────────┐
│  📚 LEARNING MODE                     [X]   │
├─────────────────────────────────────────────┤
│  Progress: ████████░░░░ 65%                 │
├─────────────────────────────────────────────┤
│  ✅ Module 1: Introduction                  │
│  ✅ Module 2: Dashboard                     │
│  ▶️ Module 3: Price Charts      ← CURRENT   │
│     • Lesson 3.1 ✓                          │
│     • Lesson 3.2 ✓                          │
│     • Lesson 3.3 ← Now                      │
│     • Lesson 3.4                            │
│  🔒 Module 4: Technical Indicators          │
│  🔒 Module 5: Scoring System                │
├─────────────────────────────────────────────┤
│  [← Previous]  [Continue →]                 │
└─────────────────────────────────────────────┘
```

### Chart Annotation Overlay

```
┌─────────────────────────────────────────────────────────────────┐
│  AAPL Price Chart                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │     ╭────────────────────────────╮                       │  │
│  │     │ 📍 This is the 50-day MA   │ ←─── Annotation      │  │
│  │     │    (Moving Average)        │      bubble           │  │
│  │     │                            │                       │  │
│  │     │ The price crossing above   │                       │  │
│  │     │ the 50-day MA is often a   │                       │  │
│  │     │ bullish signal.           │                       │  │
│  │     ╰─────────────┬──────────────╯                       │  │
│  │                   │                                       │  │
│  │  ~~~~~~~~~~~~~~~──┼───~~~~~~~~~~~~ orange line           │  │
│  │                   ▼                                       │  │
│  │  ╱╲  ╱╲    ╱╲  ╱╲    ╱╲╱╲                               │  │
│  │ ╱  ╲╱  ╲  ╱  ╲╱  ╲  ╱    ╲                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [← Previous]  [Got it! Continue →]                            │
└─────────────────────────────────────────────────────────────────┘
```

### Quiz Modal

```
┌─────────────────────────────────────────────────────────────────┐
│                     🧠 KNOWLEDGE CHECK                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Question 2 of 5                                                │
│                                                                 │
│  When the price crosses ABOVE the 200-day moving average,      │
│  what does this typically indicate?                             │
│                                                                 │
│  ○ A) The stock is overbought                                  │
│  ● B) A potential long-term uptrend is forming                 │
│  ○ C) The stock should be sold immediately                     │
│  ○ D) The company's fundamentals have improved                 │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ✅ Correct! When price crosses above the 200-day MA, it   │ │
│  │ suggests the longer-term trend may be shifting bullish.   │ │
│  │ This is often called a "golden cross" setup.              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│           Progress: ██████░░░░ 40%                              │
│                                                                 │
│                              [Continue →]                       │
└─────────────────────────────────────────────────────────────────┘
```

### Metric Tooltip Enhancement

```
Current:
┌──────────────────┐
│  P/E Ratio       │
│  22.5            │
└──────────────────┘

With Learning Mode:
┌──────────────────┐
│  P/E Ratio  ⓘ   │  ←── Click/hover for explanation
│  22.5            │
└──────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│  📚 Price-to-Earnings Ratio                            │
│                                                        │
│  The P/E ratio shows how much investors are willing    │
│  to pay per dollar of earnings.                        │
│                                                        │
│  • Low P/E (<15): May be undervalued                   │
│  • Average P/E (15-25): Fair value                     │
│  • High P/E (>25): Growth expectations priced in       │
│                                                        │
│  This stock's P/E of 22.5 is within the average range. │
│                                                        │
│  [Learn more in Module 7] [Dismiss]                    │
└────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase L1: Foundation (Week 1)
**Goal:** Core infrastructure and toggle functionality

**Tasks:**
1. Create `LearningModeContext` with state management
2. Implement `LearningModeToggle` component in header
3. Add localStorage persistence for learning state
4. Create base `LessonSidebar` component
5. Implement `ProgressTracker` component
6. Set up learning content data structure
7. Create lesson JSON/data files for Module 1-2
8. Unit tests for context and state management

**Deliverables:**
- Functional toggle in header
- Progress tracking infrastructure
- Basic sidebar with module listing

### Phase L2: Interactive Elements (Week 2)
**Goal:** Guided tours and contextual tooltips

**Tasks:**
1. Implement `TooltipEnhancer` HOC
2. Add tooltips to all metric displays
3. Create `LearningOverlay` for guided tours
4. Implement spotlight/highlight functionality
5. Build step-by-step tour system
6. Add Module 1-2 interactive tours
7. Create `ChartAnnotation` component
8. Add annotations to price charts

**Deliverables:**
- Contextual tooltips on all metrics
- Working guided tour for dashboard
- Chart annotation system

### Phase L3: Chart Analysis Module (Week 3)
**Goal:** Complete Module 3-4 with chart education

**Tasks:**
1. Create Module 3 lesson content
2. Implement annotated chart overlays
3. Add MA explanation annotations
4. Create Module 4 lesson content
5. Implement RSI explanation annotations
6. Add volume chart annotations
7. Create practice exercises for pattern recognition
8. Build exercise validation system

**Deliverables:**
- Complete chart analysis curriculum
- Interactive chart annotations
- Pattern recognition exercises

### Phase L4: Scoring & Strategies (Week 4)
**Goal:** Complete Module 5-6 with scoring education

**Tasks:**
1. Create Module 5 lesson content
2. Implement ScoreBreakdown annotations
3. Add interactive score component explanations
4. Create Module 6 lesson content
5. Build strategy comparison exercises
6. Implement strategy-stock matching quiz
7. Add strengths/weaknesses explanation tooltips
8. Create signal explanation system

**Deliverables:**
- Complete scoring system curriculum
- Strategy education modules
- Interactive score breakdown tour

### Phase L5: Quiz & Validation System (Week 5)
**Goal:** Knowledge validation and certification

**Tasks:**
1. Create `QuizModal` component
2. Implement quiz question types (multiple choice, matching)
3. Build quiz scoring and feedback system
4. Create quiz content for all modules
5. Implement module unlock logic (prerequisites)
6. Add completion certificates/badges
7. Create achievement system
8. Build final assessment

**Deliverables:**
- Full quiz system with feedback
- Module unlock progression
- Completion certificates

### Phase L6: Advanced Modules (Week 6)
**Goal:** Complete Module 7-10 with advanced content

**Tasks:**
1. Create Module 7 (Fundamentals deep dive) content
2. Create Module 8 (Watchlist) interactive tour
3. Create Module 9 (Decision making) content
4. Create Module 10 (Final project) exercises
5. Implement comparative analysis exercise
6. Build portfolio justification exercise
7. Create final assessment with comprehensive questions
8. Add mastery badge/certificate

**Deliverables:**
- Complete advanced curriculum
- Full learning path from beginner to mastery
- Final assessment and certification

### Phase L7: Polish & Analytics (Week 7)
**Goal:** Production-ready with analytics

**Tasks:**
1. Add learning analytics tracking
2. Implement progress sync (optional: backend storage)
3. Add responsive design for all learning components
4. Performance optimization (lazy loading lessons)
5. Accessibility audit (WCAG compliance)
6. Add keyboard navigation for lessons
7. Implement lesson bookmarking
8. Add "continue where you left off" feature
9. Final QA testing across all modules
10. Documentation for content editors

**Deliverables:**
- Production-ready Learning Mode
- Analytics tracking
- Accessible and responsive design
- Complete documentation

---

## Backend Requirements (Optional Enhancement)

If we want to persist progress across devices:

### New API Endpoints

```
POST /api/learning/progress
  - Save user's learning progress
  - Body: { completedLessons: string[], currentModule: string }

GET /api/learning/progress
  - Retrieve user's learning progress

GET /api/learning/analytics
  - Admin endpoint for learning analytics
```

### Database Schema Addition

```sql
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY,
  user_id UUID,  -- nullable for anonymous users
  session_id VARCHAR(255),  -- for anonymous tracking
  completed_lessons JSONB,
  completed_modules JSONB,
  current_module VARCHAR(100),
  current_lesson INT,
  quiz_scores JSONB,
  total_time_spent INT,  -- seconds
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Note:** For MVP, localStorage is sufficient. Backend sync can be added later.

---

## Content Development Guidelines

### Lesson Writing Standards

1. **Clarity:** Use simple language, avoid jargon unless teaching it
2. **Brevity:** Each explanation should be 2-3 sentences max
3. **Examples:** Use real stocks from the database
4. **Visual:** Include annotations/highlights where possible
5. **Actionable:** Tell users what to do, not just what to know
6. **Progressive:** Build on previous lessons

### Quiz Question Standards

1. **4 options** for multiple choice
2. **1 clearly correct answer**
3. **Feedback** for correct AND incorrect answers
4. **Explanation** of why the answer is correct
5. **Real-world context** when possible

### Exercise Standards

1. **Clear objective** stated upfront
2. **Specific criteria** for success
3. **Validation** that can be checked programmatically
4. **Hints** available if user gets stuck
5. **Feedback** on completion

---

## Success Metrics

### User Engagement
- % of users who enable Learning Mode
- Average time spent in Learning Mode
- Module completion rate
- Quiz pass rate (>70%)
- Return visits to continue learning

### Learning Effectiveness
- Pre/post quiz score improvement
- User confidence surveys
- Feature usage after completing modules
- Error rate in app usage

### Business Impact
- Increased time in app
- Increased watchlist creation
- Increased return visits
- User retention improvement

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Users find it intrusive | Toggle off by default, easy to dismiss |
| Content becomes outdated | Separate content from code, easy to update |
| Mobile experience poor | Design mobile-first, test on real devices |
| Performance impact | Lazy load lessons, optimize overlays |
| Accessibility issues | Follow WCAG 2.1 AA standards |
| Content too basic/advanced | Skill-based module unlocking |

---

## Enhanced Features (v2.0)

### Adaptive Learning System

The basic curriculum follows a linear path. Adaptive learning enhances this by personalizing the experience:

**Skill Pre-Assessment**
- Optional "What do you already know?" quiz at onboarding
- Auto-unlock appropriate modules based on score
- "Test out" option for each module to skip known content
- Estimated 40% faster completion for experienced users

**Dynamic Difficulty Adjustment**
```typescript
interface AdaptiveLearningState {
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  learningPath: 'full' | 'technical' | 'value' | 'quick';
  weakAreas: string[];  // Topics needing more practice
  strongAreas: string[];  // Topics user excels at
  recommendedNext: string[];  // AI-suggested lessons
}
```

**Behavior-Based Recommendations**
- Track which metrics users examine most
- Suggest relevant deep-dive lessons
- Offer remedial content when quiz scores drop
- Skip redundant content for advanced users

### Spaced Repetition System

Improve long-term retention with scientifically-proven spaced repetition:

**Review Scheduling**
```typescript
interface SpacedRepetitionState {
  dueReviews: string[];  // Lesson IDs due for review
  reviewSchedule: Record<string, Date>;  // lessonId -> nextReviewDate
  repetitionHistory: {
    lessonId: string;
    attempts: number;
    lastScore: number;
    interval: number;  // days until next review
  }[];
}
```

**Implementation**
- Initial review: 1 day after completion
- If correct: 3 days → 1 week → 2 weeks → 1 month
- If incorrect: Reset to 1 day, add to weak areas
- "Daily Review" feature: 3-5 quick questions from completed modules
- Notification system for due reviews

### Real-Time Market Integration

Make learning relevant with live market data:

**Live Examples**
- Use today's market movers as lesson examples
- "Golden cross happened today on STOCK - see it in action"
- Earnings season contextual lessons
- Volatility event explanations

**Market Event Triggers**
```typescript
interface MarketEventLesson {
  eventType: 'golden_cross' | 'death_cross' | 'rsi_oversold' | 'rsi_overbought' |
             'earnings_beat' | 'earnings_miss' | 'high_volume' | 'breakout';
  triggerCondition: string;  // When to show this lesson
  relatedLesson: string;  // Link to relevant curriculum lesson
  microContent: string;  // Quick 30-second explanation
}
```

**"What's Happening Now" Feed**
- Real-time learning opportunities from market events
- "3 stocks just hit oversold RSI - learn what this means"
- Connect abstract concepts to concrete, current examples

### Micro-Learning & Quick Tips

For users with limited time:

**Tip of the Day**
- 60-second concept explainers
- Shown on app open (dismissible)
- Rotates through key concepts
- Links to full lesson for deep dive

**Quick Reference Cards**
- Downloadable/shareable summary cards
- Key metrics cheat sheet
- Strategy comparison one-pager
- Technical indicator quick guide

**Bite-Sized Content**
| Format | Duration | Use Case |
|--------|----------|----------|
| Micro-tip | 30 sec | Daily engagement |
| Quick lesson | 2-5 min | Lunch break learning |
| Standard lesson | 10-15 min | Focused study |
| Deep dive | 25-35 min | Weekend learning |

### Contextual Learning Triggers

Proactive learning based on user behavior:

**Trigger Points**
```typescript
interface ContextualTrigger {
  action: string;  // User action that triggers
  condition: string;  // When to show
  lesson: string;  // Related lesson to offer
  message: string;  // Prompt to user
}

const triggers: ContextualTrigger[] = [
  {
    action: 'first_stock_view',
    condition: 'learningMode.enabled && !completedLessons.includes("2.1")',
    lesson: '2.1',
    message: 'First time here? Let me show you how to read this page.'
  },
  {
    action: 'hover_rsi',
    condition: 'learningMode.enabled && !tooltipDismissed.rsi',
    lesson: '4.1',
    message: 'Want to understand what RSI tells you?'
  },
  {
    action: 'add_to_watchlist',
    condition: 'watchlist.length === 1',
    lesson: '8.3',
    message: 'Great pick! Learn what to monitor in your watchlist.'
  },
  {
    action: 'view_low_score_stock',
    condition: 'stock.score < 40',
    lesson: '5.6',
    message: 'This stock scores low. Want to understand why?'
  }
];
```

### Gamification Enhancements

Beyond basic achievements:

**Learning Streaks**
```typescript
interface StreakState {
  currentStreak: number;  // Consecutive days
  longestStreak: number;
  lastActiveDate: string;
  streakRewards: {
    days: number;
    reward: 'badge' | 'unlock' | 'bonus_content';
    claimed: boolean;
  }[];
}
```

**Streak Milestones**
| Days | Reward |
|------|--------|
| 3 | "Getting Started" badge |
| 7 | Unlock bonus "Market Psychology" lesson |
| 14 | "Dedicated Learner" badge |
| 30 | Unlock "Advanced Patterns" module |
| 60 | "Learning Champion" badge + certificate |

**XP System**
- Earn XP for all learning activities
- Lesson completion: 50 XP
- Quiz passed: 100 XP
- Perfect quiz: 150 XP
- Daily streak: 25 XP bonus
- Exercise completion: 75 XP
- Levels unlock cosmetic features and bonus content

**Daily Goals**
- "Complete 1 lesson today" with progress ring
- Weekly challenge: "Pass 3 quizzes this week"
- Monthly milestone tracking

### Practice Mode / Paper Trading Sandbox

Safe environment to apply learning:

**Virtual Portfolio**
```typescript
interface PaperTradingState {
  virtualCash: number;  // Starting: 100,000
  positions: {
    ticker: string;
    shares: number;
    buyPrice: number;
    buyDate: string;
    reasoning: string;  // User's investment thesis
  }[];
  tradeHistory: Trade[];
  performance: {
    totalReturn: number;
    vsMarket: number;  // Compared to index
    bestTrade: Trade;
    worstTrade: Trade;
  };
}
```

**Features**
- Start with virtual $100,000
- Buy/sell based on app's analysis
- Track performance vs market benchmark
- "Investment journal" - record reasoning for each trade
- Weekly performance review with learning suggestions
- No real money risk while learning

### AI-Powered Q&A

Leverage existing AI capabilities for learning:

**Contextual AI Assistant**
- "Ask a question" button in every lesson
- AI answers based on lesson context + stock data
- "Why does STOCK score low on quality?"
- "Explain this chart pattern to me"
- Natural language queries about concepts

**Implementation**
```typescript
interface LearningAIQuery {
  question: string;
  context: {
    currentLesson: string;
    currentStock?: string;
    recentTopics: string[];
  };
}

// Example queries:
// "What's the difference between P/E and PEG?"
// "Is this stock's RSI concerning?"
// "Should I be worried about this debt level?"
```

### Personalized Examples

Use user's own data for relevance:

**Watchlist Integration**
- Use stocks from user's watchlist in lessons
- "Let's analyze YOUR watchlist stock as an example"
- Personalized score explanations
- "Your watchlist average quality score is X - here's why"

**Learning from User's Interests**
- Track which sectors user views most
- Customize examples to preferred sectors
- "You seem interested in tech - here's how to analyze AAPL"

### Multiple Learning Paths

Cater to different user personas:

**Path Options**
```typescript
type LearningPath =
  | 'comprehensive'  // Full 10-module curriculum
  | 'quick_start'    // Essential 4 modules (1, 2, 5, 6)
  | 'technical'      // Focus on charts (1, 2, 3, 4)
  | 'fundamental'    // Focus on value (1, 2, 5, 7)
  | 'practical';     // Focus on action (1, 2, 8, 9)
```

**Path Descriptions**
| Path | Modules | Duration | Best For |
|------|---------|----------|----------|
| Comprehensive | 1-10 | 4-5 hours | Complete beginners |
| Quick Start | 1,2,5,6 | 1.5 hours | Busy professionals |
| Technical | 1,2,3,4 | 1.5 hours | Chart-focused traders |
| Fundamental | 1,2,5,7 | 2 hours | Value investors |
| Practical | 1,2,8,9 | 1.5 hours | Action-oriented users |

### Audio/Accessibility Mode

**Text-to-Speech**
- All lesson content available as audio
- "Listen while commuting" mode
- Adjustable playback speed
- Offline audio downloads

**Enhanced Accessibility**
- High contrast mode for lessons
- Larger text options
- Keyboard-only navigation
- Screen reader optimized content

### Mistake-Based Learning

Learn from user errors:

**Behavioral Triggers**
```typescript
interface MistakeBasedPrompt {
  behavior: string;
  suggestion: string;
  lesson: string;
}

const prompts: MistakeBasedPrompt[] = [
  {
    behavior: 'added_stock_with_score_below_30',
    suggestion: 'This stock has significant risks. Want to understand the warning signs?',
    lesson: '5.6'
  },
  {
    behavior: 'ignored_sell_signal',
    suggestion: 'This stock shows sell signals. Learn about exit criteria?',
    lesson: '9.4'
  },
  {
    behavior: 'browsed_10_stocks_no_action',
    suggestion: 'Having trouble deciding? Learn our decision framework.',
    lesson: '9.1'
  }
];
```

### Community & Social Features

**Progress Sharing**
- Share completion certificates to social media
- "I completed the Stock Analysis course on VibeApp!"
- Shareable achievement badges

**Anonymous Benchmarking**
- "You're in the top 20% of learners"
- "Average quiz score: 78% (You: 85%)"
- Optional leaderboard participation

**Future: Discussion Features**
- Q&A per lesson (requires backend)
- Community answers to common questions
- Mentor/mentee matching

---

## Money-Making Features (Revenue & User Success Focus)

This section addresses critical gaps that prevent users (and AI agents) from consistently making profitable trades with the app's analysis capabilities.

### Current Limitations Analysis

The app excels at **finding quality businesses** but lacks:
- Entry/exit timing signals
- Risk event detection
- Portfolio optimization
- Forward-looking metrics
- Backtesting validation
- AI-powered synthesis

### Feature Category 1: Actionable Trading Signals

**Problem:** The app tells you "this is a good stock" but not "buy NOW" vs "wait for pullback."

**1.1 Entry Signal System**
```typescript
interface EntrySignal {
  ticker: string;
  signalType: 'immediate' | 'wait_for_dip' | 'accumulate' | 'avoid';
  confidence: number;  // 0-100
  reasoning: string;
  triggers: {
    scoreThreshold: number;      // e.g., score improved to 75+
    technicalConfirmation: string;  // e.g., "RSI crossed above 30"
    priceCondition: string;      // e.g., "5% below 50-day MA"
  };
  suggestedEntry: {
    price: number;
    stopLoss: number;
    takeProfit: number;
    positionSize: string;  // "2% of portfolio"
  };
}
```

**Entry Signal Logic:**
| Score Change | Technical | Price Position | Signal |
|--------------|-----------|----------------|--------|
| Score ↑ 15+ pts | RSI < 40 | Below 50MA | IMMEDIATE BUY |
| Score > 80 | RSI 40-60 | At support | ACCUMULATE |
| Score > 70 | RSI > 70 | At resistance | WAIT FOR DIP |
| Score ↓ | RSI < 30 | Down 20%+ | AVOID (catching knife) |

**1.2 Exit Signal System**
```typescript
interface ExitSignal {
  ticker: string;
  signalType: 'take_profit' | 'stop_loss' | 'trailing_stop' | 'fundamental_deterioration';
  urgency: 'immediate' | 'end_of_day' | 'this_week';
  reasoning: string;
  currentPosition: {
    entryPrice: number;
    currentPrice: number;
    unrealizedPL: number;
    holdingPeriod: number;
  };
}
```

**Exit Triggers:**
- Score drops 15+ points → Fundamental deterioration alert
- Price hits 2x average true range stop → Technical stop loss
- RSI > 80 + at resistance → Take profit suggestion
- Sector rotation detected → Rebalance prompt

### Feature Category 2: AI-Powered Analysis (Claude/LLM Integration)

**Problem:** AI endpoints exist but are unimplemented. Users need synthesized insights, not just numbers.

**2.1 Deep Analysis Endpoint**
```python
# /api/ai/analyze/{ticker}
class AIStockAnalysis:
    summary: str  # 2-3 sentence executive summary
    bull_case: str  # Why this could 2x
    bear_case: str  # What could go wrong
    key_risks: List[str]  # Top 3 risks
    catalysts: List[str]  # Upcoming events that could move stock
    comparable_stocks: List[str]  # Similar companies
    fair_value_estimate: float  # DCF-based target
    recommendation: str  # Clear action item
```

**2.2 AI Comparison Endpoint**
```python
# /api/ai/compare
class AIComparison:
    stocks: List[str]
    winner: str
    reasoning: str
    comparison_matrix: Dict[str, Dict[str, Any]]
    trade_idea: str  # "Long AAPL, Short competitor" or "Equal weight both"
```

**2.3 Natural Language Screener**
```python
# /api/ai/screen
# Input: "Show me undervalued tech stocks with improving momentum and low debt"
# Output: Filtered stocks + explanation of why each matches
```

**2.4 Risk Narrative Generation**
```python
# For each STRONG_BUY stock, generate:
class RiskNarrative:
    what_could_go_wrong: str
    historical_drawdowns: str
    sector_headwinds: str
    management_concerns: str
    competitive_threats: str
```

### Feature Category 3: Portfolio Intelligence

**Problem:** Users can find good stocks but can't optimize a portfolio or understand correlations.

**3.1 Portfolio Analyzer**
```typescript
interface PortfolioAnalysis {
  totalValue: number;
  diversificationScore: number;  // 0-100
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  sectorAllocation: Record<string, number>;
  correlationRisk: {
    highlyCorrelated: [string, string][];  // Stock pairs moving together
    correlationMatrix: number[][];
  };
  suggestions: {
    overweight: string[];  // "Consider trimming AAPL"
    underweight: string[];  // "Add tech exposure"
    riskReduction: string[];  // "Portfolio is 80% correlated to SPY"
  };
}
```

**3.2 Position Sizer**
```typescript
interface PositionSizing {
  ticker: string;
  accountSize: number;
  riskPerTrade: number;  // Usually 1-2%
  stopLossDistance: number;

  calculation: {
    maxLoss: number;
    shareCount: number;
    positionValue: number;
    percentOfPortfolio: number;
  };

  warnings: string[];  // "This would be 15% of portfolio - consider reducing"
}
```

**3.3 Rebalancing Engine**
```typescript
interface RebalanceRecommendation {
  currentAllocation: Record<string, number>;
  targetAllocation: Record<string, number>;
  trades: {
    ticker: string;
    action: 'buy' | 'sell';
    shares: number;
    reason: string;
  }[];
  expectedImpact: {
    diversificationChange: number;
    riskChange: number;
    expectedReturnChange: number;
  };
}
```

### Feature Category 4: Forward-Looking Metrics

**Problem:** All scoring is backward-looking. Markets price in the future.

**4.1 Earnings Intelligence**
```typescript
interface EarningsIntelligence {
  ticker: string;
  nextEarningsDate: Date;

  analystEstimates: {
    epsEstimate: number;
    revenueEstimate: number;
    epsRevisions30d: number;  // +5% means analysts raising estimates
    surpriseHistory: number[];  // Last 4 quarters beat/miss %
  };

  signals: {
    estimatesRising: boolean;
    consistentBeats: boolean;  // Beat 4 quarters in a row
    guidanceRaised: boolean;
    insiderBuying: boolean;
  };

  riskLevel: 'low' | 'medium' | 'high';  // Volatility around earnings
}
```

**4.2 Growth Acceleration Detection**
```typescript
interface GrowthAcceleration {
  ticker: string;
  revenueGrowthTrend: number[];  // QoQ: [8%, 10%, 12%, 15%] = accelerating
  marginTrend: number[];  // Operating margin expanding?
  accelerationScore: number;  // 0-100

  insight: string;  // "Revenue growth accelerating 3 consecutive quarters"
}
```

### Feature Category 5: Risk Management

**Problem:** Health score only looks at debt. Real risk is multidimensional.

**5.1 Comprehensive Risk Score**
```typescript
interface RiskAssessment {
  ticker: string;

  riskFactors: {
    financial: number;  // Debt, liquidity (current health score)
    operational: number;  // Margin volatility, customer concentration
    market: number;  // Beta, correlation to market
    sector: number;  // Industry headwinds
    company: number;  // Management, governance, insider activity
  };

  aggregateRisk: number;  // Weighted average

  warnings: string[];  // Specific risk callouts
  hedgeSuggestions: string[];  // How to mitigate
}
```

**5.2 Volatility Metrics**
```typescript
interface VolatilityMetrics {
  ticker: string;

  historical: {
    beta: number;  // vs SPY
    standardDeviation: number;  // Annual
    averageTrueRange: number;  // Daily
    maxDrawdown: number;  // Worst peak-to-trough
  };

  implied: {
    ivPercentile: number;  // Options implied volatility rank
    expectedMove: number;  // Expected range next 30 days
  };

  interpretation: string;  // "High volatility - size positions smaller"
}
```

### Feature Category 6: Backtesting & Validation

**Problem:** Strategies are theoretically sound but unvalidated with historical data.

**6.1 Strategy Backtester**
```typescript
interface BacktestResult {
  strategy: string;
  period: { start: Date; end: Date };

  performance: {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
  };

  comparison: {
    vsSPY: number;  // Alpha
    vsStrategy: Record<string, number>;  // vs other strategies
  };

  trades: {
    total: number;
    winners: number;
    losers: number;
    averageWin: number;
    averageLoss: number;
    averageHoldingPeriod: number;
  };

  insights: string[];  // "Strategy underperforms in bear markets"
}
```

**6.2 Walk-Forward Testing**
```typescript
interface WalkForwardTest {
  inSamplePeriod: { start: Date; end: Date };
  outOfSamplePeriod: { start: Date; end: Date };

  inSamplePerformance: BacktestResult;
  outOfSamplePerformance: BacktestResult;

  robustness: number;  // How well did it hold up out-of-sample?
  overfitRisk: 'low' | 'medium' | 'high';
}
```

### Feature Category 7: AI Agent Mode (Autonomous Operation)

**Problem:** The app is built for humans. AI agents need structured APIs and decision frameworks.

**7.1 AI Agent API**
```python
# Endpoints optimized for AI consumption

# GET /api/ai-agent/context
# Returns complete market context for AI decision-making
class AIAgentContext:
    timestamp: datetime
    market_regime: str  # "bull", "bear", "choppy", "rotation"
    sector_momentum: Dict[str, float]  # Which sectors leading/lagging
    top_opportunities: List[StockOpportunity]  # Pre-filtered best ideas
    risk_events: List[str]  # Upcoming earnings, FOMC, etc.
    portfolio_status: PortfolioSummary  # Current holdings if any

# POST /api/ai-agent/action
# Execute an action (with approval workflow)
class AIAgentAction:
    action_type: str  # "analyze", "screen", "alert", "trade_signal"
    parameters: Dict[str, Any]
    reasoning: str  # AI must explain why
    confidence: float
    approval_required: bool  # Human-in-the-loop for trades

# GET /api/ai-agent/decision-tree/{ticker}
# Structured decision framework for AI
class DecisionTree:
    ticker: str
    current_score: float
    fundamental_check: bool  # Passes quality filter?
    technical_check: bool  # Passes momentum filter?
    risk_check: bool  # Acceptable risk level?
    portfolio_fit: bool  # Fits current portfolio?
    action_recommendation: str
    confidence: float
    next_review_date: datetime
```

**7.2 AI Logging & Learning**
```python
# Track AI decisions for performance attribution
class AIDecisionLog:
    decision_id: str
    timestamp: datetime
    ticker: str
    action: str
    reasoning: str
    confidence: float

    # Outcome tracking
    outcome_tracked: bool
    outcome_date: datetime
    outcome_result: str  # "correct", "incorrect", "partial"
    actual_return: float

    # Learning
    lessons_learned: str
    model_adjustment: str
```

**7.3 AI Explanation System**
```python
# Every recommendation must have clear reasoning
class AIExplanation:
    recommendation: str
    confidence: float

    supporting_factors: List[str]  # Why buy
    risk_factors: List[str]  # Why not
    alternatives_considered: List[str]  # What else was evaluated

    # Confidence breakdown
    fundamental_confidence: float
    technical_confidence: float
    macro_confidence: float

    # What would change the recommendation
    invalidation_triggers: List[str]
```

### Feature Category 8: Real-Time Opportunity Detection

**Problem:** Users check the app periodically but miss time-sensitive opportunities.

**8.1 Opportunity Scanner**
```typescript
interface DailyOpportunities {
  date: Date;

  categories: {
    scoreImprovements: Stock[];  // Score jumped 15+ pts
    oversoldBounces: Stock[];  // RSI < 30 + score > 70
    breakouts: Stock[];  // Price broke resistance + high score
    earningsPlays: Stock[];  // Earnings this week + positive setup
    sectorRotation: Stock[];  // Sector turning + leaders identified
  };

  topPick: {
    ticker: string;
    reasoning: string;
    entryZone: { low: number; high: number };
    stopLoss: number;
    target: number;
    timeframe: string;
  };
}
```

**8.2 Alert System**
```typescript
interface AlertConfiguration {
  userId: string;

  alerts: {
    scoreChanges: {
      enabled: boolean;
      threshold: number;  // Alert if score changes more than X pts
    };
    signalChanges: {
      enabled: boolean;
      watchlist: string[];  // Only for these tickers
    };
    priceAlerts: {
      enabled: boolean;
      targets: { ticker: string; price: number; direction: 'above' | 'below' }[];
    };
    technicalAlerts: {
      enabled: boolean;
      patterns: string[];  // "golden_cross", "rsi_oversold", etc.
    };
    riskAlerts: {
      enabled: boolean;
      portfolioDrawdown: number;  // Alert if portfolio down X%
    };
  };

  deliveryMethod: 'email' | 'push' | 'in_app';
}
```

### Implementation Priority Matrix

| Feature | User Impact | Revenue Impact | Effort | Priority |
|---------|-------------|----------------|--------|----------|
| Entry/Exit Signals | High | High | Medium | **P0** |
| AI Deep Analysis | High | High | High | **P0** |
| Portfolio Analyzer | High | Medium | Medium | **P1** |
| Alert System | High | High | Medium | **P1** |
| Opportunity Scanner | Medium | High | Medium | **P1** |
| Backtesting | Medium | Medium | High | **P2** |
| AI Agent Mode | Low (niche) | Medium | High | **P2** |
| Risk Scoring | Medium | Medium | Medium | **P2** |
| Forward Metrics | Medium | Low | Medium | **P3** |

### Success Metrics for Money-Making Features

**User Success:**
- % of users who beat SPY over 1 year
- Average win rate on signal-based trades
- Portfolio Sharpe ratio improvement
- Reduction in maximum drawdown

**Engagement:**
- Daily active users checking opportunities
- Alert click-through rate
- Time from signal to action
- AI analysis usage

**Revenue:**
- Premium feature conversion
- User retention 90-day
- Net Promoter Score for recommendations

### API Endpoints to Implement

```
# Entry/Exit Signals
POST /api/signals/entry/{ticker}
POST /api/signals/exit/{ticker}
GET /api/signals/today  # All active signals

# AI Analysis
POST /api/ai/analyze/{ticker}
POST /api/ai/compare
POST /api/ai/screen
POST /api/ai/risk-narrative/{ticker}

# Portfolio
POST /api/portfolio/analyze
POST /api/portfolio/rebalance
POST /api/portfolio/position-size

# Opportunities
GET /api/opportunities/daily
GET /api/opportunities/category/{category}
GET /api/opportunities/top-pick

# Alerts
POST /api/alerts/configure
GET /api/alerts/active
POST /api/alerts/trigger  # Internal use

# AI Agent
GET /api/ai-agent/context
POST /api/ai-agent/action
GET /api/ai-agent/decision-tree/{ticker}
GET /api/ai-agent/performance  # Track AI accuracy

# Backtesting
POST /api/backtest/strategy
GET /api/backtest/results/{strategy}
POST /api/backtest/walk-forward
```

---

## Appendix A: Component Specifications

### LearningModeContext

```typescript
interface LearningModeContextType {
  // State
  isEnabled: boolean;
  currentModule: LearningModule | null;
  currentLesson: Lesson | null;
  progress: LearningProgress;

  // Actions
  toggleLearningMode: () => void;
  startModule: (moduleId: string) => void;
  completeLesson: (lessonId: string) => void;
  nextLesson: () => void;
  previousLesson: () => void;
  skipToModule: (moduleId: string) => void;
  resetProgress: () => void;

  // Preferences
  preferences: LearningPreferences;
  updatePreferences: (prefs: Partial<LearningPreferences>) => void;
}
```

### LearningOverlay Props

```typescript
interface LearningOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  steps: TourStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
}

interface TourStep {
  targetSelector: string;  // CSS selector to highlight
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'scroll';
}
```

### ChartAnnotation Props

```typescript
interface ChartAnnotationProps {
  chartRef: RefObject<HTMLDivElement>;
  annotations: Annotation[];
  activeAnnotation: number;
  onAnnotationClick: (index: number) => void;
}

interface Annotation {
  x: number | 'auto';  // chart coordinate or auto-position
  y: number | 'auto';
  label: string;
  description: string;
  lineColor: string;
  pointerDirection: 'up' | 'down' | 'left' | 'right';
}
```

---

## Appendix B: Sample Lesson Content

### Lesson 3.3: Support and Resistance

```json
{
  "id": "lesson-3-3",
  "moduleId": "module-3",
  "title": "Support and Resistance",
  "type": "theory",
  "content": {
    "text": "Support and resistance are key price levels where buying or selling pressure tends to emerge.\n\n**Support** is a price level where buying interest is strong enough to stop the price from falling further. Think of it as a floor.\n\n**Resistance** is a price level where selling pressure is strong enough to stop the price from rising further. Think of it as a ceiling.\n\nWhen price breaks through support or resistance with strong volume, it often signals a significant trend change.",
    "highlights": [
      {
        "term": "Support",
        "definition": "A price level where buying pressure tends to prevent further price declines"
      },
      {
        "term": "Resistance",
        "definition": "A price level where selling pressure tends to prevent further price increases"
      }
    ],
    "targetPage": "/stock/:ticker",
    "targetComponent": "PriceChart",
    "annotations": [
      {
        "x": "auto",
        "y": "support_level",
        "label": "Support Level",
        "description": "Notice how the price bounced off this level multiple times",
        "lineColor": "#22c55e"
      },
      {
        "x": "auto",
        "y": "resistance_level",
        "label": "Resistance Level",
        "description": "The price struggled to break above this level",
        "lineColor": "#ef4444"
      }
    ]
  },
  "order": 3
}
```

---

## Appendix C: File Structure

```
frontend/
├── src/
│   ├── contexts/
│   │   ├── WatchlistContext.tsx
│   │   └── LearningModeContext.tsx  [NEW]
│   │
│   ├── components/
│   │   ├── learning/  [NEW DIRECTORY]
│   │   │   ├── LearningModeToggle.tsx
│   │   │   ├── LessonSidebar.tsx
│   │   │   ├── LearningOverlay.tsx
│   │   │   ├── ChartAnnotation.tsx
│   │   │   ├── TooltipEnhancer.tsx
│   │   │   ├── QuizModal.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   ├── LessonCard.tsx
│   │   │   ├── ExerciseValidator.tsx
│   │   │   └── CompletionBadge.tsx
│   │   └── ...existing components
│   │
│   ├── data/  [NEW DIRECTORY]
│   │   └── learning/
│   │       ├── modules.json
│   │       ├── lessons/
│   │       │   ├── module-1.json
│   │       │   ├── module-2.json
│   │       │   └── ...
│   │       ├── quizzes/
│   │       │   ├── module-1-quiz.json
│   │       │   └── ...
│   │       └── tooltips/
│   │           ├── metrics.json
│   │           └── components.json
│   │
│   ├── hooks/  [NEW DIRECTORY]
│   │   ├── useLearningMode.ts
│   │   ├── useLesson.ts
│   │   └── useTooltip.ts
│   │
│   └── types/
│       ├── stock.ts
│       └── learning.ts  [NEW]
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-18 | Development Team | Initial plan |

---

**Next Steps:**
1. Review and approve this plan
2. Create detailed tasks in project tracker
3. Begin Phase L1 implementation
4. Weekly progress reviews

---

**Questions to Resolve:**
1. Should Learning Mode be on by default for new users?
2. Do we need backend storage for progress, or is localStorage sufficient for MVP?
3. Should we gate any app features behind Learning Mode completion?
4. Do we want to add gamification (points, streaks, leaderboards)?
5. Should lessons be available in Swedish as well as English?
