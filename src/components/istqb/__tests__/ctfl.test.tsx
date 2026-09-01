import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { Ctfl } from '../ctfl.tsx';
import { parseQuestionMetadata, ISTQB_CHAPTERS } from '../ctfl.types.ts';
import { QuestionBanks } from '../questionBanks.ts';

describe('CTFL v4 Practice Exam Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders CTFL header and pre-exam start launchpad with Start button', () => {
    render(<Ctfl />);

    expect(screen.getByText(/ISTQB® CTFL v4 Practice Exam/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /⏱️ Exam Simulation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /💡 Study & Learn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🚀 Start Exam Simulation/i })).toBeInTheDocument();
    expect(screen.getByText(/60 Minutes Time Limit/i)).toBeInTheDocument();
    expect(screen.getByText(/65% Passing Mark/i)).toBeInTheDocument();
  });

  it('correctly parses question metadata from reference strings', () => {
    const q1 = QuestionBanks.sampleA[0];
    const meta1 = parseQuestionMetadata(q1);

    expect(meta1.chapterId).toBe(1);
    expect(meta1.chapter.title).toBe(ISTQB_CHAPTERS[1].title);
    expect(meta1.kLevel).toBe('K1');
    expect(meta1.learningObjective).toBe('FL-1.1.1');
    expect(meta1.isMultiSelect).toBe(false);
  });

  it('starts the exam and ticks down the countdown clock when started', () => {
    vi.useFakeTimers();
    const { container } = render(<Ctfl />);

    // Before start: start button is visible
    const startBtn = screen.getByRole('button', { name: /Start Exam Simulation/i });
    fireEvent.click(startBtn);

    expect(container.querySelector('.ctfl-q-counter')?.textContent).toContain('Question 1 of 40');
    expect(container.querySelector('.ctfl-timer-box')?.textContent).toContain('60:00');

    // Advance 3 seconds wrapped in act
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(container.querySelector('.ctfl-timer-box')?.textContent).toContain('59:57');
  });

  it('allows selecting and unselecting options during an active exam', () => {
    render(<Ctfl />);

    // Start exam
    fireEvent.click(screen.getByRole('button', { name: /Start Exam Simulation/i }));

    const optionCards = screen.getAllByRole('checkbox');
    expect(optionCards.length).toBeGreaterThanOrEqual(4);

    // Click option A
    fireEvent.click(optionCards[0]);
    expect(optionCards[0]).toHaveClass('selected');

    // Click option A again to toggle off
    fireEvent.click(optionCards[0]);
    expect(optionCards[0]).not.toHaveClass('selected');
  });

  it('renders clean full-width option cards without clutter', () => {
    render(<Ctfl />);

    // Start exam
    fireEvent.click(screen.getByRole('button', { name: /Start Exam Simulation/i }));

    const optionCards = screen.getAllByRole('checkbox');
    expect(optionCards.length).toBeGreaterThanOrEqual(4);

    // Verify option cards have letter and text
    expect(optionCards[0].textContent).toContain('A');
    expect(screen.queryByTitle(/Eliminate \/ Strike-through/i)).not.toBeInTheDocument();
  });

  it('toggles question flag status', () => {
    render(<Ctfl />);

    // Start exam
    fireEvent.click(screen.getByRole('button', { name: /Start Exam Simulation/i }));

    const flagBtn = screen.getByRole('button', { name: /Flag for Review/i });
    fireEvent.click(flagBtn);

    expect(screen.getByRole('button', { name: /Flagged for Review/i })).toBeInTheDocument();
  });

  it('navigates to the next and previous questions', () => {
    const { container } = render(<Ctfl />);

    // Start exam
    fireEvent.click(screen.getByRole('button', { name: /Start Exam Simulation/i }));

    const nextBtn = screen.getByRole('button', { name: /Next ➡️/i });
    fireEvent.click(nextBtn);

    expect(container.querySelector('.ctfl-q-counter')?.textContent).toContain('Question 2 of 40');

    const prevBtn = screen.getByRole('button', { name: /⬅️ Previous/i });
    fireEvent.click(prevBtn);

    expect(container.querySelector('.ctfl-q-counter')?.textContent).toContain('Question 1 of 40');
  });

  it('allows jumping to specific questions using the Question Navigator grid', () => {
    const { container } = render(<Ctfl />);

    // Start exam
    fireEvent.click(screen.getByRole('button', { name: /Start Exam Simulation/i }));

    const q5Btn = screen.getByTitle('Jump to Question 5');
    fireEvent.click(q5Btn);

    expect(container.querySelector('.ctfl-q-counter')?.textContent).toContain('Question 5 of 40');
  });

  it('switches to Study Mode, starts session, and reveals explanation on demand', () => {
    render(<Ctfl />);

    const studyModeBtn = screen.getByRole('button', { name: /Study & Learn/i });
    fireEvent.click(studyModeBtn);

    const startStudyBtn = screen.getByRole('button', { name: /Start Study Practice/i });
    expect(startStudyBtn).toBeInTheDocument();
    fireEvent.click(startStudyBtn);

    const revealBtn = screen.getByRole('button', { name: /Reveal Answer & Detailed Explanation/i });
    expect(revealBtn).toBeInTheDocument();

    fireEvent.click(revealBtn);
    expect(screen.getByText(/Correct Answer/i)).toBeInTheDocument();
  });

  it('activates the Finish & Score button with glowing success state when all questions are filled', () => {
    render(<Ctfl />);

    // Start exam
    fireEvent.click(screen.getByRole('button', { name: /Start Exam Simulation/i }));

    const finishBtn = screen.getByRole('button', { name: /Finish & Score/i });
    expect(finishBtn).toHaveClass('secondary');
    expect(finishBtn.textContent).toContain('(0/40)');

    // Select option on question 1
    const optionCards = screen.getAllByRole('checkbox');
    fireEvent.click(optionCards[0]);
    expect(finishBtn.textContent).toContain('(1/40)');
  });

  it('submits exam and renders the results dashboard with analytics', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Ctfl />);

    // Start exam
    fireEvent.click(screen.getByRole('button', { name: /Start Exam Simulation/i }));

    // Select option C for Question 1
    const optionCards = screen.getAllByRole('checkbox');
    fireEvent.click(optionCards[2]);

    // Submit exam
    const finishBtn = screen.getByRole('button', { name: /Finish & Score/i });
    fireEvent.click(finishBtn);

    // Verify Results view
    await waitFor(() => {
      expect(screen.getByText(/You scored/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retake Full Exam/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Question-by-Question Review/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Syllabus Chapter & K-Level Mastery/i })).toBeInTheDocument();
    });

    // Check Chapter mastery tab
    const chapterTabBtn = screen.getByRole('button', { name: /Syllabus Chapter & K-Level Mastery/i });
    fireEvent.click(chapterTabBtn);
    expect(screen.getByText(/ISTQB v4 Syllabus Chapter Mastery/i)).toBeInTheDocument();
    expect(screen.getByText(/Cognitive Level \(K-Level\) Breakdown/i)).toBeInTheDocument();
  });
});
