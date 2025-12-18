# Learning Mode Implementation Checklist

**Reference:** [LEARNING_MODE_PLAN.md](./LEARNING_MODE_PLAN.md)
**Created:** 2025-12-18
**Status:** Ready for Implementation

---

## Phase L1: Foundation
**Duration:** ~1 week | **Priority:** Critical

### 1.1 Context & State Management
- [ ] Create `/frontend/src/types/learning.ts` with TypeScript interfaces
  - [ ] `LearningModule` interface
  - [ ] `Lesson` interface
  - [ ] `LessonContent` interface
  - [ ] `QuizQuestion` interface
  - [ ] `LearningProgress` interface
  - [ ] `LearningPreferences` interface
- [ ] Create `/frontend/src/contexts/LearningModeContext.tsx`
  - [ ] Define `LearningModeState` interface
  - [ ] Implement `LearningModeProvider` component
  - [ ] Add localStorage persistence (key: `vibeapp_learning_progress`)
  - [ ] Implement `toggleLearningMode()` action
  - [ ] Implement `startModule()` action
  - [ ] Implement `completeLesson()` action
  - [ ] Implement `nextLesson()` / `previousLesson()` actions
  - [ ] Implement `resetProgress()` action
  - [ ] Export `useLearningMode()` hook
- [ ] Add `LearningModeProvider` to App.tsx (wrap existing providers)

### 1.2 Learning Mode Toggle
- [ ] Create `/frontend/src/components/learning/LearningModeToggle.tsx`
  - [ ] Design toggle button with graduation cap icon (🎓)
  - [ ] Show ON/OFF state visually
  - [ ] Animate state transition
  - [ ] Add tooltip explaining Learning Mode
- [ ] Add toggle to main navigation header
  - [ ] Position: right side of header
  - [ ] Responsive design (icon-only on mobile)
- [ ] Create learning mode indicator bar (shown when enabled)
  - [ ] Display current module/lesson
  - [ ] Quick access to progress

### 1.3 Lesson Sidebar
- [ ] Create `/frontend/src/components/learning/LessonSidebar.tsx`
  - [ ] Module list with expand/collapse
  - [ ] Lesson list within modules
  - [ ] Completion status icons (✓, ▶, 🔒)
  - [ ] Current position indicator
  - [ ] Navigation buttons (Previous/Next)
  - [ ] Close button
- [ ] Style sidebar
  - [ ] Slide-in from right animation
  - [ ] Dark theme consistent with app
  - [ ] Semi-transparent backdrop
  - [ ] Responsive (drawer on mobile)

### 1.4 Progress Tracker
- [ ] Create `/frontend/src/components/learning/ProgressTracker.tsx`
  - [ ] Overall progress percentage
  - [ ] Progress bar visualization
  - [ ] Module completion badges
  - [ ] Time spent tracking (optional)
- [ ] Integrate progress display in sidebar header

### 1.5 Content Data Structure
- [ ] Create `/frontend/src/data/learning/` directory
- [ ] Create `modules.json` with module definitions
  - [ ] Module 1: Introduction to Stock Analysis
  - [ ] Module 2: Understanding the Dashboard
  - [ ] (Placeholder entries for Modules 3-10)
- [ ] Create `lessons/module-1.json`
  - [ ] Lesson 1.1: What is stock analysis?
  - [ ] Lesson 1.2: Fundamental vs Technical analysis
  - [ ] Lesson 1.3: Tour of the app interface (interactive)
  - [ ] Lesson 1.4: Basics quiz
- [ ] Create `lessons/module-2.json`
  - [ ] Lesson 2.1: Navigating stock cards (interactive)
  - [ ] Lesson 2.2: What each metric means
  - [ ] Lesson 2.3: Using search and filters (interactive)
  - [ ] Lesson 2.4: Find a stock exercise
- [ ] Create `tooltips/metrics.json` with explanations for all metrics

### 1.6 Testing
- [ ] Unit tests for LearningModeContext
  - [ ] Test toggle functionality
  - [ ] Test progress persistence
  - [ ] Test module/lesson navigation
- [ ] Component tests for LearningModeToggle
- [ ] Component tests for LessonSidebar
- [ ] Integration test: enable learning mode flow

### 1.7 Phase L1 Validation
- [ ] Toggle appears in header and works
- [ ] Sidebar shows/hides correctly
- [ ] Progress persists across page refresh
- [ ] Module/lesson structure loads correctly

---

## Phase L2: Interactive Elements
**Duration:** ~1 week | **Priority:** High

### 2.1 Tooltip Enhancement System
- [ ] Create `/frontend/src/components/learning/TooltipEnhancer.tsx` (HOC)
  - [ ] Accept metric key as prop
  - [ ] Show info icon when Learning Mode enabled
  - [ ] Display tooltip on click/hover
  - [ ] Include: definition, interpretation, learn more link
- [ ] Create `/frontend/src/hooks/useTooltip.ts`
  - [ ] Load tooltip content from data files
  - [ ] Manage tooltip visibility state
- [ ] Add tooltips to existing components:
  - [ ] StockCard metrics
  - [ ] Stock Detail Overview metrics
  - [ ] Fundamentals tab metrics
  - [ ] Score Breakdown components

### 2.2 Metric Tooltip Content
- [ ] Create comprehensive tooltip content for:
  - [ ] P/E Ratio
  - [ ] PEG Ratio
  - [ ] P/B Ratio
  - [ ] EV/EBITDA
  - [ ] P/S Ratio
  - [ ] ROIC
  - [ ] ROE
  - [ ] Gross Margin
  - [ ] Operating Margin
  - [ ] Net Margin
  - [ ] Debt/Equity
  - [ ] Current Ratio
  - [ ] Interest Coverage
  - [ ] FCF Yield
  - [ ] Dividend Yield
  - [ ] Payout Ratio
  - [ ] Revenue Growth
  - [ ] Market Cap
  - [ ] RSI
  - [ ] Moving Averages (50-day, 200-day)
  - [ ] Volume Trend

### 2.3 Learning Overlay for Tours
- [ ] Create `/frontend/src/components/learning/LearningOverlay.tsx`
  - [ ] Full-screen semi-transparent overlay
  - [ ] Spotlight/highlight target element
  - [ ] Tooltip positioned relative to target
  - [ ] Step indicator (1 of 5, etc.)
  - [ ] Navigation (Previous/Next/Skip)
  - [ ] Close button
- [ ] Create tour step system
  - [ ] Parse CSS selector for target
  - [ ] Calculate position dynamically
  - [ ] Handle scroll into view
  - [ ] Support different tooltip positions

### 2.4 Dashboard Tour (Module 2)
- [ ] Create tour configuration for home page
  - [ ] Step 1: Welcome to the dashboard
  - [ ] Step 2: Stock cards explained
  - [ ] Step 3: Score badge meaning
  - [ ] Step 4: Sector filtering
  - [ ] Step 5: Search functionality
  - [ ] Step 6: Pagination
  - [ ] Step 7: Click to view details
- [ ] Implement tour trigger (Lesson 2.1)
- [ ] Test tour flow end-to-end

### 2.5 Chart Annotation System
- [ ] Create `/frontend/src/components/learning/ChartAnnotation.tsx`
  - [ ] Overlay layer on chart component
  - [ ] Annotation markers (numbered circles)
  - [ ] Tooltip boxes with explanations
  - [ ] Lines connecting markers to chart points
  - [ ] Active annotation highlighting
- [ ] Create annotation data format
- [ ] Integrate with existing chart components:
  - [ ] PriceChart.tsx
  - [ ] RSIChart.tsx
  - [ ] VolumeChart.tsx

### 2.6 Testing
- [ ] Component tests for TooltipEnhancer
- [ ] Component tests for LearningOverlay
- [ ] Integration test: complete dashboard tour
- [ ] Visual regression tests for overlays

### 2.7 Phase L2 Validation
- [ ] Tooltips appear on all metrics when Learning Mode enabled
- [ ] Dashboard tour completes successfully
- [ ] Chart annotations display correctly
- [ ] No UI flickering or performance issues

---

## Phase L3: Chart Analysis Module
**Duration:** ~1 week | **Priority:** High

### 3.1 Module 3 Content: Reading Price Charts
- [ ] Create `lessons/module-3.json`
  - [ ] Lesson 3.1: Candlestick basics (theory)
  - [ ] Lesson 3.2: Annotated price chart tour (interactive)
  - [ ] Lesson 3.3: Support and resistance (theory)
  - [ ] Lesson 3.4: Moving averages explained (theory)
  - [ ] Lesson 3.5: 50-day vs 200-day MA analysis (interactive)
  - [ ] Lesson 3.6: Identify trend direction (exercise)
  - [ ] Lesson 3.7: Chart reading quiz

### 3.2 Price Chart Annotations
- [ ] Create annotation sets for price charts
  - [ ] Price line explanation
  - [ ] 50-day MA explanation
  - [ ] 200-day MA explanation
  - [ ] Golden cross identification
  - [ ] Death cross identification
  - [ ] Support level identification
  - [ ] Resistance level identification
  - [ ] Trend direction arrows
- [ ] Implement annotation toggle in StockDetail page
- [ ] Create annotation tour sequence

### 3.3 Module 4 Content: Technical Indicators
- [ ] Create `lessons/module-4.json`
  - [ ] Lesson 4.1: What is RSI? (theory)
  - [ ] Lesson 4.2: RSI chart annotation (interactive)
  - [ ] Lesson 4.3: Overbought vs Oversold (theory)
  - [ ] Lesson 4.4: Volume analysis (theory)
  - [ ] Lesson 4.5: Volume chart annotation (interactive)
  - [ ] Lesson 4.6: Spot divergences (exercise)
  - [ ] Lesson 4.7: Indicators quiz

### 3.4 RSI Chart Annotations
- [ ] Create annotation sets for RSI
  - [ ] RSI line explanation
  - [ ] Overbought zone (>70) highlight
  - [ ] Oversold zone (<30) highlight
  - [ ] Neutral zone explanation
  - [ ] Divergence identification (if detectable)

### 3.5 Volume Chart Annotations
- [ ] Create annotation sets for volume
  - [ ] Volume bar explanation
  - [ ] Average volume line explanation
  - [ ] High volume significance
  - [ ] Low volume significance
  - [ ] Volume trend identification

### 3.6 Exercise System Foundation
- [ ] Create `/frontend/src/components/learning/ExerciseValidator.tsx`
  - [ ] Display exercise instructions
  - [ ] Accept user input/selection
  - [ ] Validate against expected answer
  - [ ] Show feedback (correct/incorrect)
  - [ ] Provide hints on incorrect attempts
- [ ] Create exercise types:
  - [ ] Multiple choice selection
  - [ ] Click-on-chart selection
  - [ ] Stock selection from list
  - [ ] Value range identification

### 3.7 Pattern Recognition Exercise
- [ ] Create "Identify Trend Direction" exercise
  - [ ] Show a stock's price chart
  - [ ] Ask: "Is this stock in an uptrend, downtrend, or sideways?"
  - [ ] Validate answer
  - [ ] Explain reasoning

### 3.8 Testing
- [ ] Unit tests for ExerciseValidator
- [ ] Component tests for chart annotations
- [ ] Integration test: complete Module 3 flow
- [ ] Integration test: complete Module 4 flow

### 3.9 Phase L3 Validation
- [ ] All chart annotations display correctly
- [ ] RSI annotations work
- [ ] Volume annotations work
- [ ] Exercise validation works
- [ ] Module 3-4 lessons flow correctly

---

## Phase L4: Scoring & Strategies
**Duration:** ~1 week | **Priority:** High

### 4.1 Module 5 Content: The Scoring System
- [ ] Create `lessons/module-5.json`
  - [ ] Lesson 5.1: 4-factor scoring overview (theory)
  - [ ] Lesson 5.2: Value Score breakdown (interactive)
  - [ ] Lesson 5.3: Quality Score breakdown (interactive)
  - [ ] Lesson 5.4: Momentum Score breakdown (interactive)
  - [ ] Lesson 5.5: Financial Health breakdown (interactive)
  - [ ] Lesson 5.6: Signal classification (theory)
  - [ ] Lesson 5.7: Analyze a stock's score (exercise)
  - [ ] Lesson 5.8: Scoring quiz

### 4.2 Score Breakdown Annotations
- [ ] Add annotations to ScoreBreakdown component
  - [ ] Radar chart explanation
  - [ ] Value score components
  - [ ] Quality score components
  - [ ] Momentum score components
  - [ ] Health score components
  - [ ] Strengths list explanation
  - [ ] Weaknesses list explanation
  - [ ] AI reasoning explanation
- [ ] Create interactive tour for Score Analysis tab

### 4.3 Module 6 Content: Investment Strategies
- [ ] Create `lessons/module-6.json`
  - [ ] Lesson 6.1: Value investing philosophy (theory)
  - [ ] Lesson 6.2: Value Gems strategy tour (interactive)
  - [ ] Lesson 6.3: Quality compounding (theory)
  - [ ] Lesson 6.4: Quality Compounders tour (interactive)
  - [ ] Lesson 6.5: Dividend investing (theory)
  - [ ] Lesson 6.6: Dividend Kings tour (interactive)
  - [ ] Lesson 6.7: Growth vs Value (theory)
  - [ ] Lesson 6.8: Match stock to strategy (exercise)
  - [ ] Lesson 6.9: Strategy quiz

### 4.4 Screener Page Annotations
- [ ] Create annotations for StrategySelector
  - [ ] Strategy card explanations
  - [ ] Criteria breakdown
  - [ ] Target investor profile
- [ ] Create annotations for ScreenerResults
  - [ ] Match score explanation
  - [ ] Strengths/weaknesses columns
  - [ ] Sorting options

### 4.5 Strategy Tours
- [ ] Create guided tour for Value Gems strategy
- [ ] Create guided tour for Quality Compounders strategy
- [ ] Create guided tour for Dividend Kings strategy
- [ ] Create guided tour for Deep Value strategy
- [ ] Create guided tour for Explosive Growth strategy

### 4.6 Stock-to-Strategy Exercise
- [ ] Create "Match Stock to Strategy" exercise
  - [ ] Show 5 stocks with key metrics
  - [ ] Show 5 strategies
  - [ ] User matches each stock to best strategy
  - [ ] Validate answers with explanation

### 4.7 Testing
- [ ] Component tests for score annotations
- [ ] Component tests for strategy tours
- [ ] Integration test: complete Module 5 flow
- [ ] Integration test: complete Module 6 flow
- [ ] Exercise test: stock-to-strategy matching

### 4.8 Phase L4 Validation
- [ ] Score breakdown annotations work
- [ ] Strategy page annotations work
- [ ] All 5 strategy tours complete successfully
- [ ] Stock-strategy matching exercise works
- [ ] Modules 5-6 flow correctly

---

## Phase L5: Quiz & Validation System
**Duration:** ~1 week | **Priority:** High

### 5.1 Quiz Modal Component
- [ ] Create `/frontend/src/components/learning/QuizModal.tsx`
  - [ ] Full-screen modal with dark background
  - [ ] Question display with progress indicator
  - [ ] Answer options (A, B, C, D)
  - [ ] Submit button
  - [ ] Correct/incorrect feedback
  - [ ] Explanation display
  - [ ] Next question navigation
  - [ ] Final score display
  - [ ] Retry option
  - [ ] Return to lesson button

### 5.2 Quiz Question Types
- [ ] Multiple choice (single answer)
- [ ] Multiple select (multiple answers)
- [ ] True/False
- [ ] Matching pairs (drag and drop or selection)
- [ ] Fill in the blank (optional)

### 5.3 Quiz Content Creation
- [ ] Create `quizzes/module-1-quiz.json`
  - [ ] 5 questions on stock analysis basics
- [ ] Create `quizzes/module-2-quiz.json`
  - [ ] 5 questions on dashboard navigation
- [ ] Create `quizzes/module-3-quiz.json`
  - [ ] 7 questions on chart reading
- [ ] Create `quizzes/module-4-quiz.json`
  - [ ] 6 questions on technical indicators
- [ ] Create `quizzes/module-5-quiz.json`
  - [ ] 8 questions on scoring system
- [ ] Create `quizzes/module-6-quiz.json`
  - [ ] 7 questions on investment strategies
- [ ] Create `quizzes/module-7-quiz.json`
  - [ ] 8 questions on fundamentals
- [ ] Create `quizzes/module-8-quiz.json`
  - [ ] 5 questions on watchlists
- [ ] Create `quizzes/module-9-quiz.json`
  - [ ] 6 questions on decision-making
- [ ] Create `quizzes/final-assessment.json`
  - [ ] 20 comprehensive questions

### 5.4 Module Unlock System
- [ ] Implement prerequisite checking in LearningModeContext
  - [ ] Module 1: No prerequisites (unlocked)
  - [ ] Module 2: Requires Module 1 completion
  - [ ] Modules 3-6: Require Module 2 completion
  - [ ] Modules 7-9: Require Module 5 completion
  - [ ] Module 10: Requires all previous modules
- [ ] Add visual lock indicator in sidebar
- [ ] Add "unlock" animation when prerequisites met
- [ ] Show required prerequisites for locked modules

### 5.5 Completion Badges
- [ ] Create `/frontend/src/components/learning/CompletionBadge.tsx`
  - [ ] Module completion badge
  - [ ] Quiz score badge (Bronze/Silver/Gold)
  - [ ] Overall completion certificate
- [ ] Design badge graphics
  - [ ] Module badges (10 unique designs)
  - [ ] Mastery badge
  - [ ] Certificate design
- [ ] Add badges to:
  - [ ] Sidebar module entries
  - [ ] Progress tracker
  - [ ] Completion screen

### 5.6 Achievement System
- [ ] Create achievements:
  - [ ] First Lesson - Complete first lesson
  - [ ] Quick Learner - Complete Module 1 in under 10 minutes
  - [ ] Chart Master - Complete Module 3 + 4
  - [ ] Score Expert - Complete Module 5
  - [ ] Strategy Guru - Complete Module 6
  - [ ] Quiz Champion - Score 100% on any quiz
  - [ ] Dedicated Student - Complete 5 lessons in a day
  - [ ] Graduate - Complete all modules
- [ ] Display achievements in progress section
- [ ] Add achievement notification popup

### 5.7 Testing
- [ ] Unit tests for QuizModal
- [ ] Unit tests for module unlock logic
- [ ] Component tests for CompletionBadge
- [ ] Integration test: complete quiz flow
- [ ] Integration test: module unlock flow

### 5.8 Phase L5 Validation
- [ ] Quiz modal works correctly
- [ ] All quiz types function properly
- [ ] Module unlock logic works
- [ ] Badges display correctly
- [ ] Achievements trigger properly

---

## Phase L6: Advanced Modules
**Duration:** ~1 week | **Priority:** Medium

### 6.1 Module 7: Fundamental Analysis Deep Dive
- [ ] Create `lessons/module-7.json`
  - [ ] Lesson 7.1: P/E Ratio explained
  - [ ] Lesson 7.2: PEG Ratio (Peter Lynch)
  - [ ] Lesson 7.3: ROIC (Buffett's favorite)
  - [ ] Lesson 7.4: Debt/Equity analysis
  - [ ] Lesson 7.5: Free Cash Flow
  - [ ] Lesson 7.6: Fundamentals tab tour (interactive)
  - [ ] Lesson 7.7: Compare two stocks (exercise)
  - [ ] Lesson 7.8: Fundamentals quiz

### 6.2 Comparative Analysis Exercise
- [ ] Create stock comparison exercise
  - [ ] Select two stocks from database
  - [ ] Display side-by-side metrics
  - [ ] Ask user to identify better value/quality
  - [ ] Validate with explanation

### 6.3 Module 8: Building a Watchlist
- [ ] Create `lessons/module-8.json`
  - [ ] Lesson 8.1: Why use watchlists? (theory)
  - [ ] Lesson 8.2: Creating a watchlist (interactive)
  - [ ] Lesson 8.3: What to watch for (theory)
  - [ ] Lesson 8.4: Build a 5-stock watchlist (exercise)
  - [ ] Lesson 8.5: Score change tracking (theory)
- [ ] Create watchlist tour for Watchlist page

### 6.4 Watchlist Exercise
- [ ] Create "Build a watchlist" exercise
  - [ ] Criteria: Select 5 stocks from different sectors
  - [ ] Criteria: Average score must be above 60
  - [ ] Validate selections
  - [ ] Add to actual watchlist on success

### 6.5 Module 9: Making Investment Decisions
- [ ] Create `lessons/module-9.json`
  - [ ] Lesson 9.1: The decision framework (theory)
  - [ ] Lesson 9.2: Risk assessment (theory)
  - [ ] Lesson 9.3: Position sizing basics (theory)
  - [ ] Lesson 9.4: Entry and exit criteria (theory)
  - [ ] Lesson 9.5: Analyze a buy candidate (exercise)
  - [ ] Lesson 9.6: Decision-making quiz

### 6.6 Buy Candidate Exercise
- [ ] Create "Analyze buy candidate" exercise
  - [ ] Show a stock with STRONG_BUY signal
  - [ ] Walk through analysis checklist
  - [ ] Ask: Would you buy? Why/why not?
  - [ ] Compare user reasoning to AI reasoning

### 6.7 Module 10: Putting It All Together
- [ ] Create `lessons/module-10.json`
  - [ ] Lesson 10.1: Full stock analysis (exercise)
  - [ ] Lesson 10.2: Compare investment strategies (exercise)
  - [ ] Lesson 10.3: Build and justify a portfolio (exercise)
  - [ ] Lesson 10.4: Final assessment (quiz)
  - [ ] Lesson 10.5: Completion certificate

### 6.8 Final Assessment
- [ ] Create comprehensive final quiz (20 questions)
  - [ ] 3 questions per module
  - [ ] 2 synthesis questions
  - [ ] Passing score: 80%

### 6.9 Completion Certificate
- [ ] Design certificate component
  - [ ] User name (if available)
  - [ ] Completion date
  - [ ] Final score
  - [ ] Modules completed
  - [ ] Download as image option

### 6.10 Testing
- [ ] Integration test: Module 7 flow
- [ ] Integration test: Module 8 flow
- [ ] Integration test: Module 9 flow
- [ ] Integration test: Module 10 flow
- [ ] Integration test: Final assessment

### 6.11 Phase L6 Validation
- [ ] All advanced modules complete
- [ ] Exercises work correctly
- [ ] Final assessment works
- [ ] Certificate generates properly
- [ ] Full learning path is completable

---

## Phase L7: Polish & Analytics
**Duration:** ~1 week | **Priority:** Medium

### 7.1 Learning Analytics
- [ ] Track and store:
  - [ ] Time spent per lesson
  - [ ] Quiz attempts and scores
  - [ ] Exercise completion rates
  - [ ] Module completion times
  - [ ] Drop-off points
- [ ] Create analytics data structure in localStorage
- [ ] (Optional) Backend endpoint for analytics aggregation

### 7.2 Responsive Design
- [ ] Test and fix all learning components on:
  - [ ] Mobile (320px - 480px)
  - [ ] Tablet (768px - 1024px)
  - [ ] Desktop (1024px+)
- [ ] Ensure sidebar works as drawer on mobile
- [ ] Ensure overlays work on touch devices
- [ ] Test chart annotations on small screens

### 7.3 Performance Optimization
- [ ] Lazy load lesson content
- [ ] Code split learning module components
- [ ] Optimize animation performance
- [ ] Reduce bundle size impact
- [ ] Test on low-end devices

### 7.4 Accessibility (WCAG 2.1 AA)
- [ ] Keyboard navigation for all learning components
- [ ] Focus management in modals/overlays
- [ ] Screen reader announcements
- [ ] Color contrast verification
- [ ] Alternative text for visual elements
- [ ] ARIA labels for interactive elements

### 7.5 Additional Features
- [ ] "Continue where you left off" prompt on return
- [ ] Lesson bookmarking
- [ ] Notes feature (optional)
- [ ] Share progress (optional)
- [ ] Feedback mechanism per lesson

### 7.6 Final QA
- [ ] Test complete learning path (all 10 modules)
- [ ] Test all quiz flows
- [ ] Test all exercises
- [ ] Test progress persistence
- [ ] Test cross-browser (Chrome, Firefox, Safari)
- [ ] Test mobile browsers
- [ ] Performance testing

### 7.7 Documentation
- [ ] Update README with Learning Mode section
- [ ] Document content editing process
- [ ] Document lesson JSON format
- [ ] Document quiz JSON format
- [ ] Create content contribution guide

### 7.8 Phase L7 Validation
- [ ] All responsive breakpoints work
- [ ] No accessibility violations
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Feature is production-ready

---

## Post-Implementation Tasks

### Monitoring & Iteration
- [ ] Monitor user engagement with Learning Mode
- [ ] Collect feedback on lesson clarity
- [ ] Track quiz pass/fail rates
- [ ] Identify confusing lessons for improvement
- [ ] A/B test different lesson formats

### Content Updates
- [ ] Schedule quarterly content reviews
- [ ] Update for market changes
- [ ] Add new modules based on feedback
- [ ] Refine quizzes based on performance data

### Future Enhancements (Not in MVP)
- [ ] Swedish language localization
- [ ] Video content integration
- [ ] Live market examples
- [ ] Social learning features
- [ ] Personalized learning paths
- [ ] Backend progress sync across devices
- [ ] Mobile app support

---

## Phase L8: Enhanced Learning Features (v2.0)
**Duration:** ~2 weeks | **Priority:** Medium (Post-MVP)

### 8.1 Adaptive Learning System
- [ ] Create skill pre-assessment quiz (15 questions)
  - [ ] Questions covering basics, charts, fundamentals, strategies
  - [ ] Scoring algorithm to determine skill level
  - [ ] Module unlock recommendations based on score
- [ ] Implement "Test Out" feature for each module
  - [ ] Condensed quiz (5 questions) to skip module
  - [ ] 80% pass rate required
- [ ] Add adaptive difficulty tracking
  - [ ] Track weak areas from quiz failures
  - [ ] Recommend remedial lessons
  - [ ] Adjust example complexity based on performance
- [ ] Create `/frontend/src/types/adaptive.ts`
  - [ ] `AdaptiveLearningState` interface
  - [ ] `SkillAssessment` interface
  - [ ] `LearningRecommendation` interface

### 8.2 Spaced Repetition System
- [ ] Implement review scheduling algorithm
  - [ ] Calculate next review date based on performance
  - [ ] Intervals: 1 day → 3 days → 1 week → 2 weeks → 1 month
- [ ] Create "Daily Review" feature
  - [ ] 3-5 questions from completed modules
  - [ ] Prioritize items due for review
  - [ ] Track retention rates
- [ ] Add review notifications
  - [ ] "You have 3 concepts due for review"
  - [ ] Badge indicator in Learning Mode toggle
- [ ] Create `/frontend/src/components/learning/DailyReview.tsx`
- [ ] Update localStorage schema for repetition history

### 8.3 Real-Time Market Integration
- [ ] Create market event detection system
  - [ ] Golden/death cross detection
  - [ ] RSI overbought/oversold alerts
  - [ ] Unusual volume detection
  - [ ] Breakout identification
- [ ] Implement "What's Happening Now" feed
  - [ ] Real-time learning opportunities
  - [ ] Link events to relevant lessons
- [ ] Create market event micro-lessons
  - [ ] 30-second explanations for each event type
  - [ ] "See it in action" with live stock
- [ ] Create `/frontend/src/components/learning/MarketEventFeed.tsx`
- [ ] Create `/frontend/src/data/learning/market-events.json`

### 8.4 Micro-Learning & Quick Tips
- [ ] Create "Tip of the Day" system
  - [ ] 50+ rotating tips
  - [ ] Show on app open (dismissible)
  - [ ] Link to full lesson
- [ ] Create quick reference cards
  - [ ] Metrics cheat sheet (downloadable)
  - [ ] Strategy comparison card
  - [ ] Technical indicators guide
  - [ ] Decision framework card
- [ ] Create `/frontend/src/components/learning/TipOfTheDay.tsx`
- [ ] Create `/frontend/src/components/learning/ReferenceCard.tsx`
- [ ] Create `/frontend/src/data/learning/tips.json`

### 8.5 Contextual Learning Triggers
- [ ] Implement trigger system
  - [ ] First stock view trigger
  - [ ] Metric hover trigger
  - [ ] Watchlist add trigger
  - [ ] Low score view trigger
- [ ] Create non-intrusive prompt component
  - [ ] Slide-in notification style
  - [ ] "Learn more" CTA
  - [ ] Dismiss permanently option
- [ ] Create `/frontend/src/components/learning/ContextualPrompt.tsx`
- [ ] Create `/frontend/src/hooks/useContextualLearning.ts`

### 8.6 Enhanced Gamification
- [ ] Implement streak system
  - [ ] Track consecutive days
  - [ ] Streak rewards at milestones (3, 7, 14, 30, 60 days)
  - [ ] Streak recovery (1 freeze per week)
- [ ] Create XP system
  - [ ] XP for all learning activities
  - [ ] Level progression (1-50)
  - [ ] Level-up notifications
- [ ] Create daily/weekly goals
  - [ ] Configurable daily lesson goal
  - [ ] Weekly quiz challenge
  - [ ] Monthly completion milestones
- [ ] Create `/frontend/src/components/learning/StreakDisplay.tsx`
- [ ] Create `/frontend/src/components/learning/XPBar.tsx`
- [ ] Create `/frontend/src/components/learning/DailyGoals.tsx`

### 8.7 Paper Trading Sandbox
- [ ] Create virtual portfolio system
  - [ ] $100,000 starting balance
  - [ ] Buy/sell mechanics
  - [ ] Position tracking
- [ ] Implement performance tracking
  - [ ] Total return calculation
  - [ ] Comparison vs market index
  - [ ] Best/worst trade tracking
- [ ] Create investment journal
  - [ ] Record reasoning for each trade
  - [ ] Review past decisions
  - [ ] AI feedback on reasoning
- [ ] Create `/frontend/src/components/learning/PaperTrading.tsx`
- [ ] Create `/frontend/src/components/learning/VirtualPortfolio.tsx`
- [ ] Create `/frontend/src/components/learning/TradeJournal.tsx`
- [ ] Create `/frontend/src/contexts/PaperTradingContext.tsx`

### 8.8 AI-Powered Learning Q&A
- [ ] Create contextual AI assistant
  - [ ] "Ask a question" button in lessons
  - [ ] Context-aware responses
  - [ ] Stock-specific explanations
- [ ] Implement question types
  - [ ] Concept explanations
  - [ ] Stock analysis questions
  - [ ] "Why" questions about scores
- [ ] Create `/frontend/src/components/learning/LearningAI.tsx`
- [ ] Create `/frontend/src/services/learningAI.ts`

### 8.9 Personalized Examples
- [ ] Implement watchlist integration for lessons
  - [ ] Use user's stocks as examples
  - [ ] Personalized score breakdowns
  - [ ] Sector-specific content
- [ ] Track user interests
  - [ ] Most viewed sectors
  - [ ] Preferred analysis types
  - [ ] Customize lesson examples
- [ ] Create `/frontend/src/hooks/usePersonalizedLearning.ts`

### 8.10 Multiple Learning Paths
- [ ] Create path selection UI
  - [ ] Path descriptions and time estimates
  - [ ] Recommended path based on assessment
- [ ] Implement path configurations
  - [ ] Comprehensive (all modules)
  - [ ] Quick Start (essential modules)
  - [ ] Technical (chart-focused)
  - [ ] Fundamental (value-focused)
  - [ ] Practical (action-oriented)
- [ ] Create `/frontend/src/components/learning/PathSelector.tsx`
- [ ] Create `/frontend/src/data/learning/paths.json`

### 8.11 Phase L8 Validation
- [ ] Adaptive learning adjusts to user performance
- [ ] Spaced repetition schedules reviews correctly
- [ ] Market events trigger relevant lessons
- [ ] Tips display and rotate correctly
- [ ] Contextual prompts appear appropriately
- [ ] Streaks and XP track correctly
- [ ] Paper trading works end-to-end
- [ ] AI Q&A provides relevant answers
- [ ] Personalized examples use user data
- [ ] Learning paths filter content correctly

---

## Phase L9: Money-Making Features
**Duration:** ~2 weeks | **Priority:** High (Revenue Impact)

### 9.1 AI Trading Assistant
- [ ] Create AI analysis mode
  - [ ] Autonomous stock screening
  - [ ] Daily opportunity alerts
  - [ ] Risk-adjusted recommendations
- [ ] Implement trade suggestion system
  - [ ] Entry point suggestions
  - [ ] Position size calculator
  - [ ] Stop-loss recommendations
  - [ ] Take-profit targets
- [ ] Create confidence scoring
  - [ ] AI confidence level (1-100)
  - [ ] Historical accuracy tracking
  - [ ] Backtest results display
- [ ] Create `/frontend/src/components/ai/TradingAssistant.tsx`
- [ ] Create `/frontend/src/services/aiTrading.ts`

### 9.2 Portfolio Optimization
- [ ] Implement portfolio analyzer
  - [ ] Current allocation analysis
  - [ ] Diversification score
  - [ ] Risk assessment
  - [ ] Correlation matrix
- [ ] Create rebalancing suggestions
  - [ ] Overweight/underweight alerts
  - [ ] Sector concentration warnings
  - [ ] Specific trade recommendations
- [ ] Implement portfolio simulation
  - [ ] "What if" scenarios
  - [ ] Historical performance projection
  - [ ] Monte Carlo simulation (optional)
- [ ] Create `/frontend/src/components/portfolio/PortfolioAnalyzer.tsx`
- [ ] Create `/frontend/src/components/portfolio/RebalanceSuggestions.tsx`

### 9.3 Alert & Notification System
- [ ] Create price alerts
  - [ ] Target price notifications
  - [ ] Percentage change alerts
  - [ ] Support/resistance breach alerts
- [ ] Implement score change alerts
  - [ ] Signal upgrade/downgrade notifications
  - [ ] Score threshold alerts
  - [ ] Watchlist score changes
- [ ] Create technical alerts
  - [ ] Golden/death cross alerts
  - [ ] RSI extreme alerts
  - [ ] Volume spike alerts
  - [ ] Moving average crossovers
- [ ] Create `/frontend/src/components/alerts/AlertManager.tsx`
- [ ] Create `/frontend/src/contexts/AlertContext.tsx`
- [ ] Backend: Create alert processing service

### 9.4 Opportunity Scanner
- [ ] Create daily opportunity dashboard
  - [ ] Top scoring stocks today
  - [ ] Biggest score improvements
  - [ ] Upcoming catalysts
  - [ ] Sector rotation signals
- [ ] Implement screening presets
  - [ ] "Best value today"
  - [ ] "Momentum breakouts"
  - [ ] "Oversold bounces"
  - [ ] "Dividend opportunities"
- [ ] Create opportunity scoring
  - [ ] Time-sensitive opportunity rating
  - [ ] Risk/reward ratio calculation
  - [ ] Confidence level display
- [ ] Create `/frontend/src/components/scanner/OpportunityScanner.tsx`
- [ ] Create `/frontend/src/pages/DailyOpportunities.tsx`

### 9.5 Performance Tracking
- [ ] Create portfolio performance dashboard
  - [ ] Real-time P&L tracking
  - [ ] Performance vs benchmarks
  - [ ] Win rate statistics
  - [ ] Average return per trade
- [ ] Implement trade journal
  - [ ] Automatic trade logging
  - [ ] Reasoning documentation
  - [ ] Outcome analysis
  - [ ] Learning from mistakes
- [ ] Create performance analytics
  - [ ] Best/worst performing strategies
  - [ ] Sector performance breakdown
  - [ ] Time-based analysis (best days/months)
- [ ] Create `/frontend/src/components/performance/PerformanceDashboard.tsx`
- [ ] Create `/frontend/src/components/performance/TradeJournal.tsx`

### 9.6 Risk Management Tools
- [ ] Create position size calculator
  - [ ] Risk-based sizing
  - [ ] Kelly criterion option
  - [ ] Max portfolio allocation limits
- [ ] Implement portfolio risk metrics
  - [ ] Portfolio beta
  - [ ] Value at Risk (VaR)
  - [ ] Maximum drawdown tracking
- [ ] Create risk alerts
  - [ ] Concentration warnings
  - [ ] Correlation alerts
  - [ ] Volatility warnings
- [ ] Create `/frontend/src/components/risk/PositionSizer.tsx`
- [ ] Create `/frontend/src/components/risk/RiskDashboard.tsx`

### 9.7 Backtesting System
- [ ] Create strategy backtester
  - [ ] Historical performance testing
  - [ ] Multiple timeframe analysis
  - [ ] Transaction cost modeling
- [ ] Implement backtest visualization
  - [ ] Equity curve display
  - [ ] Drawdown chart
  - [ ] Trade distribution histogram
- [ ] Create strategy comparison
  - [ ] Side-by-side strategy results
  - [ ] Risk-adjusted returns (Sharpe, Sortino)
  - [ ] Win rate and profit factor
- [ ] Create `/frontend/src/components/backtest/Backtester.tsx`
- [ ] Create `/frontend/src/services/backtesting.ts`
- [ ] Backend: Create backtesting API endpoints

### 9.8 AI Mode for Autonomous Operation
- [ ] Create AI agent interface
  - [ ] Structured data export for AI consumption
  - [ ] Action API for AI agents
  - [ ] Context summary generation
- [ ] Implement decision explanation system
  - [ ] Clear reasoning for each recommendation
  - [ ] Confidence intervals
  - [ ] Alternative considerations
- [ ] Create AI-friendly API endpoints
  - [ ] `/api/ai/analyze/{ticker}`
  - [ ] `/api/ai/opportunities`
  - [ ] `/api/ai/portfolio-suggest`
  - [ ] `/api/ai/execute-screen`
- [ ] Add AI operation logging
  - [ ] Track AI decisions
  - [ ] Performance attribution
  - [ ] Learning from outcomes
- [ ] Create `/frontend/src/services/aiAgent.ts`
- [ ] Backend: Create AI-specific API routes

### 9.9 Phase L9 Validation
- [ ] AI trading assistant provides actionable suggestions
- [ ] Portfolio optimizer identifies improvements
- [ ] Alerts trigger correctly
- [ ] Opportunity scanner finds relevant stocks
- [ ] Performance tracking is accurate
- [ ] Risk tools calculate correctly
- [ ] Backtester produces valid results
- [ ] AI mode API is functional

---

## Summary Statistics

| Phase | Tasks | Duration | Priority |
|-------|-------|----------|----------|
| L1: Foundation | 25 | 1 week | Critical |
| L2: Interactive | 26 | 1 week | High |
| L3: Charts | 28 | 1 week | High |
| L4: Scoring | 26 | 1 week | High |
| L5: Quiz | 28 | 1 week | High |
| L6: Advanced | 30 | 1 week | Medium |
| L7: Polish | 25 | 1 week | Medium |
| **MVP Total** | **188** | **7 weeks** | - |
| L8: Enhanced Learning | 45 | 2 weeks | Medium |
| L9: Money-Making | 40 | 2 weeks | High |
| **Full Total** | **273** | **11 weeks** | - |

---

**Ready to begin implementation!**

---

## Quick Reference: Priority Implementation Order

For maximum user value, consider this implementation order:

### Immediate Impact (Week 1-7)
1. **L1-L7**: Complete MVP Learning Mode

### High Revenue Impact (Week 8-9)
2. **L9.3**: Alert & Notification System - Users need timely information
3. **L9.4**: Opportunity Scanner - Daily actionable insights
4. **L9.1**: AI Trading Assistant - Core value proposition

### User Retention (Week 10-11)
5. **L8.6**: Enhanced Gamification - Streaks and daily goals
6. **L8.2**: Spaced Repetition - Knowledge retention
7. **L8.7**: Paper Trading - Safe practice environment

### Advanced Features (Post-Launch)
8. **L9.7**: Backtesting System
9. **L9.8**: AI Mode for autonomous operation
10. **L8.1**: Adaptive Learning
