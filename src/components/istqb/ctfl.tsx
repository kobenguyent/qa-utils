import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Dropdown, ProgressBar } from 'react-bootstrap';
import { QuestionBanks } from './questionBanks.ts';
import {
  Question,
  ISTQB_CHAPTERS,
  parseQuestionMetadata,
  DetailedQuestionResult,
  ExamAttemptRecord,
} from './ctfl.types.ts';
import './ctfl.css';

const PASSING_PERCENTAGE = 65; // ISTQB official passing mark
const DEFAULT_TIME_LIMIT_SECONDS = 60 * 60; // 60 minutes
const LOCAL_STORAGE_KEY_HISTORY = 'kobeanqautils_ctfl_history';

export const Ctfl: React.FC = () => {
  // ── Mode & Bank State ───────────────────────────────────────────────────
  const [selectedQuestionBank, setSelectedQuestionBank] = useState<string>('sampleA');
  const [mode, setMode] = useState<'exam' | 'study'>('exam');
  const [questions, setQuestions] = useState<Question[]>(QuestionBanks.sampleA || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isExamStarted, setIsExamStarted] = useState<boolean>(false);

  // ── User Selection & Flag State ─────────────────────────────────────────
  const [selectedOptionsByQuestion, setSelectedOptionsByQuestion] = useState<string[][]>(() =>
    Array(QuestionBanks.sampleA.length).fill([])
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<boolean[]>(() =>
    Array(QuestionBanks.sampleA.length).fill(false)
  );
  const [showInstantExplanation, setShowInstantExplanation] = useState<Record<number, boolean>>({});

  // ── Timing & Status ─────────────────────────────────────────────────────
  const [timerSeconds, setTimerSeconds] = useState<number>(DEFAULT_TIME_LIMIT_SECONDS);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);
  const [showResults, setShowResults] = useState<boolean>(false);

  // ── UI States ───────────────────────────────────────────────────────────
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [navigatorFilter, setNavigatorFilter] = useState<'all' | 'answered' | 'unanswered' | 'flagged'>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct' | 'flagged' | number>('all');
  const [journeyMode, setJourneyMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'review' | 'chapters' | 'history'>('review');
  const [history, setHistory] = useState<ExamAttemptRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ── Switch Question Bank / Initialize ───────────────────────────────────
  const initExamState = useCallback((bankKey: string, customQuestions?: Question[], autoStart = false) => {
    const qList = customQuestions || QuestionBanks[bankKey] || QuestionBanks.sampleA;
    setQuestions(qList);
    setSelectedOptionsByQuestion(Array(qList.length).fill([]));
    setFlaggedQuestions(Array(qList.length).fill(false));
    setShowInstantExplanation({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setIsExamStarted(autoStart);
    setTimerSeconds(DEFAULT_TIME_LIMIT_SECONDS);
    setIsTimerPaused(false);
    setTimeSpentSeconds(0);
    setReviewFilter('all');
  }, []);

  const handleBankChange = (bankKey: string) => {
    setSelectedQuestionBank(bankKey);
    initExamState(bankKey, undefined, false);
  };

  const handleStartExam = () => {
    setIsExamStarted(true);
    setTimerSeconds(DEFAULT_TIME_LIMIT_SECONDS);
    setTimeSpentSeconds(0);
  };

  // ── Countdown & Time Spent Timer ─────────────────────────────────────────
  useEffect(() => {
    if (!isExamStarted || showResults || isTimerPaused) return;

    const interval = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);

      if (mode === 'exam') {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isExamStarted, showResults, isTimerPaused, mode]);

  // ── Format Helpers ───────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBankName = (key: string) => {
    if (!key) return '';
    return key.replace(/^sample([a-zA-Z])$/i, 'SAMPLE $1');
  };

  // ── Option Toggle Handler ────────────────────────────────────────────────
  const handleOptionToggle = (optionChar: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const meta = parseQuestionMetadata(currentQuestion);
    const currentSelections = selectedOptionsByQuestion[currentQuestionIndex] || [];
    let updatedSelections: string[];

    if (meta.isMultiSelect) {
      if (currentSelections.includes(optionChar)) {
        updatedSelections = currentSelections.filter((char) => char !== optionChar);
      } else {
        if (currentSelections.length < meta.requiredCount) {
          updatedSelections = [...currentSelections, optionChar];
        } else {
          // Replace oldest if over max allowed
          updatedSelections = [...currentSelections.slice(1), optionChar];
        }
      }
    } else {
      // Single select toggle
      updatedSelections = currentSelections.includes(optionChar) ? [] : [optionChar];
    }

    const updated = [...selectedOptionsByQuestion];
    updated[currentQuestionIndex] = updatedSelections;
    setSelectedOptionsByQuestion(updated);
  };

  // ── Flag Toggle ─────────────────────────────────────────────────────────
  const handleFlagToggle = () => {
    const updated = [...flaggedQuestions];
    updated[currentQuestionIndex] = !updated[currentQuestionIndex];
    setFlaggedQuestions(updated);
  };

  // ── Question Navigation ──────────────────────────────────────────────────
  const handleNext = () => {
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrev = () => {
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  };

  // ── Compute Detailed Exam Results ────────────────────────────────────────
  const detailedResults: DetailedQuestionResult[] = useMemo(() => {
    return questions.map((question, index) => {
      const meta = parseQuestionMetadata(question);
      const userSelected = selectedOptionsByQuestion[index] || [];
      const correctOptions = question.correctOptions.map((c) => c.toLowerCase());
      const userSelectedNorm = userSelected.map((c) => c.toLowerCase());

      const correctMatches = userSelectedNorm.filter((c) => correctOptions.includes(c)).length;
      const incorrectMatches = userSelectedNorm.filter((c) => !correctOptions.includes(c)).length;

      let pointsEarned = 0;
      let isCorrect = false;
      let isPartiallyCorrect = false;

      if (meta.requiredCount === 1) {
        isCorrect = userSelectedNorm.length === 1 && correctMatches === 1;
        pointsEarned = isCorrect ? 1 : 0;
      } else {
        // Multi-select ISTQB scoring
        if (correctMatches === meta.requiredCount && incorrectMatches === 0) {
          isCorrect = true;
          pointsEarned = meta.requiredCount;
        } else if (correctMatches > 0 && incorrectMatches === 0) {
          isPartiallyCorrect = true;
          pointsEarned = correctMatches;
        } else {
          pointsEarned = Math.max(0, correctMatches - incorrectMatches);
        }
      }

      return {
        index,
        question,
        metadata: meta,
        selectedOptions: userSelected,
        isCorrect,
        isPartiallyCorrect,
        pointsEarned,
        maxPoints: meta.requiredCount,
        isFlagged: flaggedQuestions[index] || false,
      };
    });
  }, [questions, selectedOptionsByQuestion, flaggedQuestions]);

  // ── Total Score & Stats ──────────────────────────────────────────────────
  const totalEarnedPoints = useMemo(
    () => detailedResults.reduce((acc, r) => acc + r.pointsEarned, 0),
    [detailedResults]
  );
  const totalPossiblePoints = useMemo(
    () => detailedResults.reduce((acc, r) => acc + r.maxPoints, 0),
    [detailedResults]
  );
  const percentageScore = totalPossiblePoints > 0 ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100) : 0;
  const isPassed = percentageScore >= PASSING_PERCENTAGE;

  // ── Chapter Breakdown ────────────────────────────────────────────────────
  const chapterBreakdown = useMemo(() => {
    const chaptersData: Record<number, { correct: number; total: number; questions: DetailedQuestionResult[] }> = {
      1: { correct: 0, total: 0, questions: [] },
      2: { correct: 0, total: 0, questions: [] },
      3: { correct: 0, total: 0, questions: [] },
      4: { correct: 0, total: 0, questions: [] },
      5: { correct: 0, total: 0, questions: [] },
      6: { correct: 0, total: 0, questions: [] },
    };

    detailedResults.forEach((res) => {
      const chId = res.metadata.chapterId;
      if (chaptersData[chId]) {
        chaptersData[chId].total += res.maxPoints;
        chaptersData[chId].correct += res.pointsEarned;
        chaptersData[chId].questions.push(res);
      }
    });

    return chaptersData;
  }, [detailedResults]);

  // ── K-Level Breakdown ────────────────────────────────────────────────────
  const kLevelBreakdown = useMemo(() => {
    const kMap: Record<string, { correct: number; total: number }> = {
      K1: { correct: 0, total: 0 },
      K2: { correct: 0, total: 0 },
      K3: { correct: 0, total: 0 },
    };

    detailedResults.forEach((res) => {
      const k = res.metadata.kLevel in kMap ? res.metadata.kLevel : 'K2';
      kMap[k].total += res.maxPoints;
      kMap[k].correct += res.pointsEarned;
    });

    return kMap;
  }, [detailedResults]);

  // ── Submit Exam ─────────────────────────────────────────────────────────
  const handleSubmitExam = () => {
    setShowResults(true);

    // Build history record
    const chapterScores: Record<number, { correct: number; total: number }> = {};
    Object.entries(chapterBreakdown).forEach(([k, v]) => {
      chapterScores[Number(k)] = { correct: v.correct, total: v.total };
    });

    const newRecord: ExamAttemptRecord = {
      id: `${Date.now()}`,
      date: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      bankName: selectedQuestionBank,
      mode,
      score: totalEarnedPoints,
      totalQuestions: totalPossiblePoints,
      percentage: percentageScore,
      passed: isPassed,
      timeSpentSeconds,
      chapterScores,
    };

    try {
      const updatedHistory = [newRecord, ...history].slice(0, 20); // Keep last 20
      setHistory(updatedHistory);
      localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
    } catch {
      // Storage unavailable or quota exceeded
    }
  };

  // ── Retake / Restart Drill ───────────────────────────────────────────────
  const handleRetakeFull = () => {
    initExamState(selectedQuestionBank);
  };

  const handlePracticeIncorrectOnly = () => {
    const incorrectQs = detailedResults.filter((r) => !r.isCorrect).map((r) => r.question);
    if (incorrectQs.length === 0) return;
    setMode('study');
    initExamState(selectedQuestionBank, incorrectQs);
  };

  // ── Keyboard Shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'j') {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFlagToggle();
      } else if (['1', '2', '3', '4', 'a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const keyMap: Record<string, string> = {
          '1': 'a',
          '2': 'b',
          '3': 'c',
          '4': 'd',
          a: 'a',
          b: 'b',
          c: 'c',
          d: 'd',
        };
        const char = keyMap[e.key.toLowerCase()];
        if (char) {
          e.preventDefault();
          handleOptionToggle(char);
        }
      } else if (e.key === 'Escape') {
        setZoomImageUrl(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ── Current Question Details ─────────────────────────────────────────────
  const currentQuestion = questions[currentQuestionIndex] || questions[0];
  const currentMetadata = currentQuestion ? parseQuestionMetadata(currentQuestion) : null;
  const currentSelectedOptions = selectedOptionsByQuestion[currentQuestionIndex] || [];
  const isCurrentFlagged = flaggedQuestions[currentQuestionIndex] || false;

  const answeredCount = selectedOptionsByQuestion.filter((opts) => opts && opts.length > 0).length;
  const flaggedCount = flaggedQuestions.filter(Boolean).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const isAllAnswered = answeredCount === questions.length && questions.length > 0;

  const handleFinishAndScore = () => {
    if (!isAllAnswered) {
      const unanswered = questions.length - answeredCount;
      const confirmEarly = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions (${unanswered} unanswered).\n\nDo you want to submit and score the exam now?`
      );
      if (!confirmEarly) return;
    }
    handleSubmitExam();
  };

  // ── Review Filter Predicate ──────────────────────────────────────────────
  const filteredReviewResults = useMemo(() => {
    return detailedResults.filter((res) => {
      if (reviewFilter === 'all') return true;
      if (reviewFilter === 'incorrect') return !res.isCorrect;
      if (reviewFilter === 'correct') return res.isCorrect;
      if (reviewFilter === 'flagged') return res.isFlagged;
      if (typeof reviewFilter === 'number') return res.metadata.chapterId === reviewFilter;
      return true;
    });
  }, [detailedResults, reviewFilter]);

  return (
    <Container className="ctfl-container">
      {/* ── Top Hero Card ─────────────────────────────────────────────────── */}
      <div className="ctfl-hero-card">
        <div className="ctfl-header-row">
          <div className="ctfl-brand">
            <div className="ctfl-brand-icon">🎓</div>
            <div>
              <h1 className="ctfl-title">ISTQB® CTFL v4 Practice Exam</h1>
              <p className="ctfl-subtitle">
                Certified Tester Foundation Level (Syllabus v4.0) — Exam Simulation & Diagnostic Center
              </p>
            </div>
          </div>

          <div className="ctfl-controls-group">
            {/* Exam Mode Toggle */}
            <div className="ctfl-mode-switcher" role="radiogroup" aria-label="Exam Mode">
              <button
                type="button"
                className={`ctfl-mode-btn ${mode === 'exam' ? 'active' : ''}`}
                onClick={() => setMode('exam')}
                title="60-minute timed simulation matching actual ISTQB exam conditions"
              >
                <span>⏱️</span> Exam Simulation
              </button>
              <button
                type="button"
                className={`ctfl-mode-btn ${mode === 'study' ? 'active' : ''}`}
                onClick={() => setMode('study')}
                title="Self-paced practice with instant rationales and hints"
              >
                <span>💡</span> Study & Learn
              </button>
            </div>

            {/* Question Bank Selector */}
            <Dropdown onSelect={(key: any) => handleBankChange(key)}>
              <Dropdown.Toggle variant="outline-primary" id="bank-selector-dropdown" className="fw-semibold">
                📚 {formatBankName(selectedQuestionBank)} ({questions.length} Qs)
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.keys(QuestionBanks).map((key) => (
                  <Dropdown.Item key={key} eventKey={key} active={key === selectedQuestionBank}>
                    {formatBankName(key)} Practice Set ({QuestionBanks[key]?.length || 40} Questions)
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            {/* Journey Mode Toggle */}
            <button
              type="button"
              className={`ctfl-btn secondary ${journeyMode ? 'active' : ''}`}
              onClick={() => setJourneyMode((prev) => !prev)}
              title="Toggle Syllabus Journey Map"
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              🗺️ {journeyMode ? 'Hide Palace' : 'Syllabus Palace'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Journey Palace Map View ────────────────────────────────────────── */}
      {journeyMode && !showResults && (
        <div className="ctfl-palace-card ctfl-fade-in mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h3 className="h6 fw-bold mb-0 text-primary">🏛️ ISTQB v4 Syllabus Palace — Chapter Rooms</h3>
            <span className="small text-muted">Click any room to jump to its questions</span>
          </div>
          <div className="row g-2">
            {Object.values(ISTQB_CHAPTERS).map((ch) => {
              const chapterQuestions = questions.map((q, idx) => ({ q, idx })).filter(({ q }) => parseQuestionMetadata(q).chapterId === ch.id);
              const totalCh = chapterQuestions.length;
              const answeredCh = chapterQuestions.filter(({ idx }) => (selectedOptionsByQuestion[idx] || []).length > 0).length;
              const pct = totalCh > 0 ? Math.round((answeredCh / totalCh) * 100) : 0;
              const isCurrentChapter = currentMetadata?.chapterId === ch.id;

              return (
                <div key={ch.id} className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <div
                    className={`ctfl-chapter-card p-2 text-center h-100 ${isCurrentChapter ? 'border-primary' : ''}`}
                    style={{
                      cursor: 'pointer',
                      background: isCurrentChapter ? 'var(--glass-nav-active)' : 'var(--card-bg)',
                    }}
                    onClick={() => {
                      if (chapterQuestions.length > 0) {
                        setCurrentQuestionIndex(chapterQuestions[0].idx);
                      }
                    }}
                  >
                    <div style={{ fontSize: '1.4rem' }}>{ch.icon}</div>
                    <div className="small fw-bold text-truncate" title={ch.title}>
                      Ch {ch.id}: {ch.title}
                    </div>
                    <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
                      {answeredCh}/{totalCh} Answered
                    </div>
                    <ProgressBar
                      now={pct}
                      variant={pct === 100 ? 'success' : 'primary'}
                      style={{ height: '4px', marginTop: '6px' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main Exam View OR Results View ──────────────────────────────────── */}
      {!showResults ? (
        !isExamStarted ? (
          /* ── Pre-Exam Launchpad / Start Screen ───────────────────────────── */
          <div className="ctfl-start-card ctfl-fade-in">
            <div className="ctfl-start-icon">🎯</div>
            <h2 className="ctfl-start-title">
              {mode === 'exam' ? 'ISTQB® CTFL v4 Exam Simulation' : 'ISTQB® CTFL v4 Study & Practice'}
            </h2>
            <p className="ctfl-start-desc">
              You are ready to begin <strong>{formatBankName(selectedQuestionBank)}</strong> ({questions.length} questions).
              {mode === 'exam'
                ? ' This simulation runs with a strict 60-minute countdown and official scoring (65% pass threshold).'
                : ' In study mode, you can practice self-paced with instant rationale reveals and hint explanations.'}
            </p>

            {/* Key Guidelines Grid */}
            <div className="ctfl-guidelines-grid">
              <div className="ctfl-guideline-item">
                <div className="ctfl-guideline-icon">⏱️</div>
                <div className="ctfl-guideline-text">
                  <h4>60 Minutes Time Limit</h4>
                  <p>40 questions across all 6 ISTQB syllabus chapters (~1.5 min per question).</p>
                </div>
              </div>

              <div className="ctfl-guideline-item">
                <div className="ctfl-guideline-icon">🎯</div>
                <div className="ctfl-guideline-text">
                  <h4>65% Passing Mark</h4>
                  <p>Score at least 26 / 40 points to earn a passing evaluation.</p>
                </div>
              </div>

              <div className="ctfl-guideline-item">
                <div className="ctfl-guideline-icon">📋</div>
                <div className="ctfl-guideline-text">
                  <h4>Question Formats</h4>
                  <p>Single-choice (1 pt) and Multi-choice (2 pts). No negative marking for errors.</p>
                </div>
              </div>

              <div className="ctfl-guideline-item">
                <div className="ctfl-guideline-icon">🛠️</div>
                <div className="ctfl-guideline-text">
                  <h4>Test-Taking Tools</h4>
                  <p>Flag questions for review (🚩), navigate with shortcuts, and instant study feedback.</p>
                </div>
              </div>
            </div>

            {/* Syllabus Coverage Summary */}
            <div className="d-flex justify-content-center flex-wrap gap-2 mb-4">
              {Object.values(ISTQB_CHAPTERS).map((ch) => (
                <span key={ch.id} className="ctfl-badge chapter" style={{ padding: '6px 12px' }}>
                  {ch.icon} Ch {ch.id}: {ch.title}
                </span>
              ))}
            </div>

            {/* Big Start Exam Button */}
            <div>
              <button
                type="button"
                className="ctfl-big-start-btn"
                onClick={handleStartExam}
                id="start-exam-button"
              >
                <span>🚀</span> Start {mode === 'exam' ? 'Exam Simulation' : 'Study Practice'}
              </button>
            </div>

            {history.length > 0 && (
              <div className="mt-4 pt-3 border-top d-inline-block">
                <span className="small text-muted">
                  📊 Last Attempt: <strong>{history[0].percentage}%</strong> ({history[0].passed ? 'PASSED ✅' : 'FAILED ❌'}) on {history[0].date}
                </span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Sticky HUD Bar */}
            <div className="ctfl-hud-bar">
              <div className="ctfl-progress-overview">
                <div className="ctfl-q-counter">
                  Question <span>{currentQuestionIndex + 1}</span> of {questions.length}
                </div>
                <div className="ctfl-progress-track" title={`${answeredCount} of ${questions.length} answered`}>
                  <div className="ctfl-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <div className="ctfl-stats-chips">
                <div className="ctfl-stat-chip answered">
                  <span>✔</span> {answeredCount} Answered
                </div>
                {flaggedCount > 0 && (
                  <div className="ctfl-stat-chip flagged">
                    <span>🚩</span> {flaggedCount} Flagged
                  </div>
                )}
              </div>

              {/* Timer & Controls */}
              <div className="d-flex align-items-center gap-2">
                <div
                  className={`ctfl-timer-box ${
                    mode === 'exam' && timerSeconds < 300
                      ? 'danger'
                      : mode === 'exam' && timerSeconds < 600
                      ? 'warning'
                      : ''
                  }`}
                  title={mode === 'exam' ? 'Time Remaining' : 'Elapsed Time'}
                >
                  <span>{mode === 'exam' ? '⏱️' : '⏳'}</span>
                  <span>{mode === 'exam' ? formatTime(timerSeconds) : formatTime(timeSpentSeconds)}</span>
                </div>

                {mode === 'study' && (
                  <button
                    type="button"
                    className="ctfl-btn secondary"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    onClick={() => setIsTimerPaused((p) => !p)}
                    title={isTimerPaused ? 'Resume timer' : 'Pause timer'}
                  >
                    {isTimerPaused ? '▶️' : '⏸️'}
                  </button>
                )}

                <button
                  type="button"
                  className="ctfl-btn secondary"
                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  onClick={() => setIsExamStarted(false)}
                  title="Quit to exam start screen"
                >
                  🚪 Menu
                </button>
              </div>
            </div>

          {/* Main 2-Column Grid */}
          <div className="ctfl-main-grid">
            {/* Left: Active Question Card */}
            <div className="ctfl-card">
              {/* Metadata Badges */}
              <div className="ctfl-meta-bar">
                <div className="ctfl-badges-cluster">
                  <span className="ctfl-badge chapter">
                    {currentMetadata?.chapter.icon} Ch {currentMetadata?.chapterId}: {currentMetadata?.chapter.title}
                  </span>
                  <span className="ctfl-badge klevel">{currentMetadata?.kLevel} Level</span>
                  <span className="ctfl-badge klevel">{currentMetadata?.learningObjective}</span>
                  {currentMetadata?.isMultiSelect ? (
                    <span className="ctfl-badge multiselect">
                      ⚠️ Select {currentMetadata.requiredCount} Options
                    </span>
                  ) : (
                    <span className="ctfl-badge klevel">1 Choice</span>
                  )}
                </div>

                <button
                  type="button"
                  className={`ctfl-flag-btn ${isCurrentFlagged ? 'flagged' : ''}`}
                  onClick={handleFlagToggle}
                  title="Flag this question for review (Press 'F')"
                >
                  🚩 {isCurrentFlagged ? 'Flagged for Review' : 'Flag for Review'}
                </button>
              </div>

              {/* Question Text */}
              <div className="ctfl-question-text">{currentQuestion?.question}</div>

              {/* Optional Code Snippet */}
              {currentQuestion?.code && (
                <div className="ctfl-code-box">
                  <code>{currentQuestion.code}</code>
                </div>
              )}

              {/* Optional Diagram Image */}
              {currentQuestion?.image && (
                <div className="ctfl-diagram-box">
                  <img
                    src={currentQuestion.image}
                    alt="Question Diagram"
                    onClick={() => setZoomImageUrl(currentQuestion.image)}
                    title="Click to expand diagram"
                  />
                  <div className="small text-muted mt-1">🔍 Click image to enlarge</div>
                </div>
              )}

              {/* Options List */}
              <div className="ctfl-options-list" role="group" aria-label="Question Options">
                {currentQuestion?.options.map((optionText, optIndex) => {
                  const optionChar = optionText.trim().charAt(0).toLowerCase();
                  const isSelected = currentSelectedOptions.includes(optionChar);

                  return (
                    <div
                      key={optIndex}
                      className={`ctfl-option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleOptionToggle(optionChar)}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          handleOptionToggle(optionChar);
                        }
                      }}
                    >
                      <div className="ctfl-option-letter">{optionChar.toUpperCase()}</div>
                      <div className="ctfl-option-text">
                        {optionText.replace(/^[a-zA-Z]\)\s*/, '')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Study Mode Instant Feedback / Hint */}
              {mode === 'study' && (
                <div className="mb-4">
                  {!showInstantExplanation[currentQuestionIndex] ? (
                    <button
                      type="button"
                      className="ctfl-btn secondary w-100"
                      onClick={() =>
                        setShowInstantExplanation((prev) => ({
                          ...prev,
                          [currentQuestionIndex]: true,
                        }))
                      }
                    >
                      💡 Reveal Answer & Detailed Explanation
                    </button>
                  ) : (
                    <div className="ctfl-study-feedback ctfl-fade-in">
                      <div className="ctfl-study-feedback-header">
                        <span>🎯 Correct Answer(s):</span>{' '}
                        {currentQuestion.correctOptions.map((c) => c.toUpperCase()).join(', ')}
                      </div>
                      <div
                        className="ctfl-study-feedback-body"
                        dangerouslySetInnerHTML={{
                          __html: currentQuestion.explanation?.answer?.replace(/\n/g, '<br />') || '',
                        }}
                      />
                      <div className="small text-muted mt-2">
                        <strong>Reference:</strong> {currentQuestion.explanation?.ref}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="ctfl-action-footer">
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="ctfl-btn secondary"
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                  >
                    ⬅️ Previous
                  </button>
                  <button
                    type="button"
                    className="ctfl-btn secondary"
                    onClick={handleNext}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Next ➡️
                  </button>
                </div>

                <div className="d-flex gap-2">
                  {currentSelectedOptions.length > 0 && (
                    <button
                      type="button"
                      className="ctfl-btn secondary"
                      onClick={() => {
                        const updated = [...selectedOptionsByQuestion];
                        updated[currentQuestionIndex] = [];
                        setSelectedOptionsByQuestion(updated);
                      }}
                      title="Clear answer selection"
                    >
                      🗑️ Clear
                    </button>
                  )}
                  <button
                    type="button"
                    className={`ctfl-btn ${isAllAnswered ? 'success ctfl-finish-ready' : 'secondary'}`}
                    onClick={handleFinishAndScore}
                    title={
                      isAllAnswered
                        ? 'All 40 questions completed! Click to submit and score exam.'
                        : `Submit exam (${answeredCount}/${questions.length} answered)`
                    }
                  >
                    🏁 Finish & Score {isAllAnswered ? '🎉' : `(${answeredCount}/${questions.length})`}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Question Navigator Grid Sidebar */}
            <div className="ctfl-sidebar-card">
              <div className="ctfl-sidebar-header">
                <h3 className="ctfl-sidebar-title">📋 Question Navigator</h3>
                <span className="small text-muted">{answeredCount}/{questions.length} Done</span>
              </div>

              {/* Filter Tabs */}
              <div className="ctfl-grid-filters">
                <button
                  type="button"
                  className={`ctfl-grid-filter-btn ${navigatorFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setNavigatorFilter('all')}
                >
                  All ({questions.length})
                </button>
                <button
                  type="button"
                  className={`ctfl-grid-filter-btn ${navigatorFilter === 'answered' ? 'active' : ''}`}
                  onClick={() => setNavigatorFilter('answered')}
                >
                  Done ({answeredCount})
                </button>
                <button
                  type="button"
                  className={`ctfl-grid-filter-btn ${navigatorFilter === 'unanswered' ? 'active' : ''}`}
                  onClick={() => setNavigatorFilter('unanswered')}
                >
                  Left ({questions.length - answeredCount})
                </button>
                <button
                  type="button"
                  className={`ctfl-grid-filter-btn ${navigatorFilter === 'flagged' ? 'active' : ''}`}
                  onClick={() => setNavigatorFilter('flagged')}
                >
                  🚩 ({flaggedCount})
                </button>
              </div>

              {/* 40-Button Matrix */}
              <div className="ctfl-question-matrix">
                {questions.map((_, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = (selectedOptionsByQuestion[idx] || []).length > 0;
                  const isFlagged = flaggedQuestions[idx] || false;

                  // Filter visibility
                  if (navigatorFilter === 'answered' && !isAnswered) return null;
                  if (navigatorFilter === 'unanswered' && isAnswered) return null;
                  if (navigatorFilter === 'flagged' && !isFlagged) return null;

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`ctfl-matrix-node ${isCurrent ? 'current' : ''} ${
                        isAnswered ? 'answered' : ''
                      } ${isFlagged ? 'flagged' : ''}`}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      title={`Jump to Question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Matrix Legend */}
              <div className="ctfl-matrix-legend">
                <div className="ctfl-legend-item">
                  <div className="ctfl-legend-dot answered" />
                  <span>Answered</span>
                </div>
                <div className="ctfl-legend-item">
                  <div className="ctfl-legend-dot unanswered" />
                  <span>Unanswered</span>
                </div>
                <div className="ctfl-legend-item">
                  <div className="ctfl-legend-dot flagged" />
                  <span>Flagged</span>
                </div>
                <div className="ctfl-legend-item">
                  <div className="ctfl-legend-dot current" />
                  <span>Current</span>
                </div>
              </div>
            </div>
          </div>
        </>
        )
      ) : (
        /* ── Results & Analytics Dashboard ───────────────────────────────── */
        <div className="ctfl-fade-in">
          {/* Hero Result Banner */}
          <div className="ctfl-results-hero">
            {/* Score Circular Gauge */}
            <div className="ctfl-score-gauge">
              <svg viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--bg-secondary)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={isPassed ? 'var(--success)' : 'var(--danger)'}
                  strokeWidth="3"
                  strokeDasharray={`${percentageScore}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="ctfl-score-number">{percentageScore}%</div>
            </div>

            <div className={`ctfl-status-badge ${isPassed ? 'passed' : 'failed'}`}>
              <span>{isPassed ? '🎉 PASSED' : '⚠️ DID NOT PASS'}</span>
              <span>— {isPassed ? 'Congratulations!' : 'Keep practicing!'}</span>
            </div>

            <p className="text-muted mb-4">
              You scored <strong>{totalEarnedPoints}</strong> out of <strong>{totalPossiblePoints}</strong> points (
              {detailedResults.filter((r) => r.isCorrect).length}/{questions.length} questions fully correct).
              Passing standard is {PASSING_PERCENTAGE}% (26/40 points).
            </p>

            {/* Key Metrics Row */}
            <div className="ctfl-metrics-grid">
              <div className="ctfl-metric-card">
                <div className="ctfl-metric-val">{formatTime(timeSpentSeconds)}</div>
                <div className="ctfl-metric-lbl">⏱️ Time Spent</div>
              </div>
              <div className="ctfl-metric-card">
                <div className="ctfl-metric-val text-success">
                  {detailedResults.filter((r) => r.isCorrect).length}
                </div>
                <div className="ctfl-metric-lbl">✔ Correct</div>
              </div>
              <div className="ctfl-metric-card">
                <div className="ctfl-metric-val text-danger">
                  {detailedResults.filter((r) => !r.isCorrect).length}
                </div>
                <div className="ctfl-metric-lbl">✖ Incorrect</div>
              </div>
              <div className="ctfl-metric-card">
                <div className="ctfl-metric-val text-warning">{flaggedCount}</div>
                <div className="ctfl-metric-lbl">🚩 Flagged</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap">
              <button type="button" className="ctfl-btn primary" onClick={handleRetakeFull}>
                🔄 Retake Full Exam
              </button>
              {detailedResults.some((r) => !r.isCorrect) && (
                <button
                  type="button"
                  className="ctfl-btn secondary"
                  onClick={handlePracticeIncorrectOnly}
                  title="Create practice session with only missed questions"
                >
                  🔁 Drill Missed Questions ({detailedResults.filter((r) => !r.isCorrect).length})
                </button>
              )}
              <button
                type="button"
                className="ctfl-btn secondary"
                onClick={() => window.print()}
                title="Print or export score report"
              >
                🖨️ Print / Save Report
              </button>
            </div>
          </div>

          {/* Results Navigation Tabs */}
          <div className="d-flex gap-2 border-bottom pb-2 mb-4">
            <button
              type="button"
              className={`ctfl-btn ${activeTab === 'review' ? 'primary' : 'secondary'}`}
              onClick={() => setActiveTab('review')}
            >
              📝 Question-by-Question Review
            </button>
            <button
              type="button"
              className={`ctfl-btn ${activeTab === 'chapters' ? 'primary' : 'secondary'}`}
              onClick={() => setActiveTab('chapters')}
            >
              📊 Syllabus Chapter & K-Level Mastery
            </button>
            <button
              type="button"
              className={`ctfl-btn ${activeTab === 'history' ? 'primary' : 'secondary'}`}
              onClick={() => setActiveTab('history')}
            >
              📜 Exam History ({history.length})
            </button>
          </div>

          {/* TAB 1: Detailed Question Review */}
          {activeTab === 'review' && (
            <div>
              {/* Filter Pills */}
              <div className="ctfl-review-filters">
                <button
                  type="button"
                  className={`ctfl-mode-btn ${reviewFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setReviewFilter('all')}
                >
                  All ({questions.length})
                </button>
                <button
                  type="button"
                  className={`ctfl-mode-btn ${reviewFilter === 'incorrect' ? 'active' : ''}`}
                  onClick={() => setReviewFilter('incorrect')}
                >
                  ❌ Incorrect Only ({detailedResults.filter((r) => !r.isCorrect).length})
                </button>
                <button
                  type="button"
                  className={`ctfl-mode-btn ${reviewFilter === 'correct' ? 'active' : ''}`}
                  onClick={() => setReviewFilter('correct')}
                >
                  ✅ Correct Only ({detailedResults.filter((r) => r.isCorrect).length})
                </button>
                {flaggedCount > 0 && (
                  <button
                    type="button"
                    className={`ctfl-mode-btn ${reviewFilter === 'flagged' ? 'active' : ''}`}
                    onClick={() => setReviewFilter('flagged')}
                  >
                    🚩 Flagged ({flaggedCount})
                  </button>
                )}
              </div>

              {/* Filtered Question Cards */}
              {filteredReviewResults.map((res) => {
                const q = res.question;
                const userOpts = res.selectedOptions;
                const correctOpts = q.correctOptions.map((c) => c.toLowerCase());

                return (
                  <div
                    key={res.index}
                    className={`ctfl-review-card ${res.isCorrect ? 'correct-card' : 'incorrect-card'}`}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold">
                          {res.isCorrect ? '✅' : '❌'} Question {res.index + 1}
                        </span>
                        <span className="ctfl-badge chapter">
                          {res.metadata.chapter.icon} Ch {res.metadata.chapterId}
                        </span>
                        <span className="ctfl-badge klevel">{res.metadata.kLevel}</span>
                        {res.isFlagged && <span className="ctfl-badge multiselect">🚩 Flagged</span>}
                      </div>

                      <div className="small fw-semibold text-muted">
                        Score: {res.pointsEarned} / {res.maxPoints} pts
                      </div>
                    </div>

                    <div className="ctfl-question-text" style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                      {q.question}
                    </div>

                    {q.image && (
                      <div className="ctfl-diagram-box mb-3">
                        <img
                          src={q.image}
                          alt="Question Diagram"
                          onClick={() => setZoomImageUrl(q.image)}
                          style={{ maxHeight: '240px' }}
                        />
                      </div>
                    )}

                    {/* Options Review breakdown */}
                    <div className="mb-3">
                      {q.options.map((optText, oIdx) => {
                        const optChar = optText.trim().charAt(0).toLowerCase();
                        const isSelectedByUser = userOpts.includes(optChar);
                        const isCorrectOption = correctOpts.includes(optChar);

                        let rowClass = '';
                        let badge = null;

                        if (isCorrectOption) {
                          rowClass = 'is-correct-answer';
                          badge = <span className="badge bg-success">✔ Correct Answer</span>;
                        } else if (isSelectedByUser) {
                          rowClass = 'is-user-selected-wrong';
                          badge = <span className="badge bg-danger">✖ Your Selection</span>;
                        }

                        return (
                          <div key={oIdx} className={`ctfl-option-review-row ${rowClass}`}>
                            <span className="fw-bold text-uppercase">{optChar})</span>
                            <span className="flex-grow-1">{optText.replace(/^[a-zA-Z]\)\s*/, '')}</span>
                            {badge}
                          </div>
                        );
                      })}
                    </div>

                    {/* Full Explanation */}
                    <div className="ctfl-explanation-block">
                      <div className="fw-bold text-primary mb-1">📖 Official Explanation & Rationales:</div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: q.explanation?.answer?.replace(/\n/g, '<br />') || '',
                        }}
                      />
                      <div className="small text-muted mt-2">
                        <strong>Syllabus Reference:</strong> {q.explanation?.ref}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Chapter Breakdown & K-Level Diagnostics */}
          {activeTab === 'chapters' && (
            <div className="ctfl-card">
              <h2 className="h5 fw-bold mb-3">📊 ISTQB v4 Syllabus Chapter Mastery</h2>
              <p className="text-muted small">
                Evaluate your test competency across all 6 knowledge domains of the CTFL v4.0 syllabus.
              </p>

              <div className="ctfl-chapter-grid">
                {Object.entries(chapterBreakdown).map(([chIdStr, data]) => {
                  const chId = Number(chIdStr);
                  const chapter = ISTQB_CHAPTERS[chId];
                  const chPct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                  const mastery =
                    chPct >= 75 ? 'mastered' : chPct >= 65 ? 'proficient' : 'needs-review';
                  const masteryLabel =
                    chPct >= 75 ? '🟢 Mastered' : chPct >= 65 ? '🟡 Proficient' : '🔴 Needs Review';

                  return (
                    <div key={chId} className="ctfl-chapter-card">
                      <div className="ctfl-chapter-header">
                        <div className="ctfl-chapter-title">
                          <span>{chapter.icon}</span> Chapter {chId}: {chapter.title}
                        </div>
                        <span className={`ctfl-mastery-tag ${mastery}`}>{masteryLabel}</span>
                      </div>
                      <p className="small text-muted mb-2">{chapter.description}</p>
                      <div className="d-flex justify-content-between small fw-semibold mb-1">
                        <span>Score: {data.correct} / {data.total} pts</span>
                        <span>{chPct}%</span>
                      </div>
                      <ProgressBar
                        now={chPct}
                        variant={chPct >= 75 ? 'success' : chPct >= 65 ? 'warning' : 'danger'}
                        style={{ height: '6px' }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* K-Level Cognitive breakdown */}
              <h2 className="h5 fw-bold mt-4 mb-3">🧠 Cognitive Level (K-Level) Breakdown</h2>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <div className="ctfl-metric-card">
                    <div className="fw-bold">K1 — Remember</div>
                    <div className="small text-muted mb-2">Recall facts & definitions</div>
                    <div className="ctfl-metric-val">
                      {kLevelBreakdown.K1.total > 0
                        ? Math.round((kLevelBreakdown.K1.correct / kLevelBreakdown.K1.total) * 100)
                        : 0}
                      %
                    </div>
                    <div className="small text-muted">
                      {kLevelBreakdown.K1.correct} / {kLevelBreakdown.K1.total} pts
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="ctfl-metric-card">
                    <div className="fw-bold">K2 — Understand</div>
                    <div className="small text-muted mb-2">Explain & classify concepts</div>
                    <div className="ctfl-metric-val">
                      {kLevelBreakdown.K2.total > 0
                        ? Math.round((kLevelBreakdown.K2.correct / kLevelBreakdown.K2.total) * 100)
                        : 0}
                      %
                    </div>
                    <div className="small text-muted">
                      {kLevelBreakdown.K2.correct} / {kLevelBreakdown.K2.total} pts
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="ctfl-metric-card">
                    <div className="fw-bold">K3 — Apply</div>
                    <div className="small text-muted mb-2">Techniques & test design calculations</div>
                    <div className="ctfl-metric-val">
                      {kLevelBreakdown.K3.total > 0
                        ? Math.round((kLevelBreakdown.K3.correct / kLevelBreakdown.K3.total) * 100)
                        : 0}
                      %
                    </div>
                    <div className="small text-muted">
                      {kLevelBreakdown.K3.correct} / {kLevelBreakdown.K3.total} pts
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: History */}
          {activeTab === 'history' && (
            <div className="ctfl-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 fw-bold mb-0">📜 Exam History & Progress Tracker</h2>
                {history.length > 0 && (
                  <button
                    type="button"
                    className="ctfl-btn secondary"
                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    onClick={() => {
                      if (window.confirm('Clear all local exam attempt history?')) {
                        setHistory([]);
                        localStorage.removeItem(LOCAL_STORAGE_KEY_HISTORY);
                      }
                    }}
                  >
                    🗑️ Clear History
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <div style={{ fontSize: '2rem' }}>📭</div>
                  <p className="mt-2">No exam history recorded yet. Completed exams will appear here!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Exam Bank</th>
                        <th>Mode</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Result</th>
                        <th>Time Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((rec) => (
                        <tr key={rec.id}>
                          <td>{rec.date}</td>
                          <td className="fw-semibold">{formatBankName(rec.bankName)}</td>
                          <td>
                            <span className="badge bg-secondary">
                              {rec.mode === 'exam' ? '⏱️ Exam' : '💡 Study'}
                            </span>
                          </td>
                          <td>
                            {rec.score} / {rec.totalQuestions}
                          </td>
                          <td className="fw-bold">{rec.percentage}%</td>
                          <td>
                            <span className={`badge ${rec.passed ? 'bg-success' : 'bg-danger'}`}>
                              {rec.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </td>
                          <td>{formatTime(rec.timeSpentSeconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Diagram Lightbox Modal ────────────────────────────────────────── */}
      {zoomImageUrl && (
        <div className="ctfl-lightbox-backdrop" onClick={() => setZoomImageUrl(null)}>
          <img src={zoomImageUrl} alt="Expanded Diagram" className="ctfl-lightbox-content" />
        </div>
      )}
    </Container>
  );
};

export default Ctfl;
