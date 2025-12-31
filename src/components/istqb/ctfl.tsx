import { useEffect, useState } from 'react';
import { Button, Container, Table, Dropdown, Image } from 'react-bootstrap';
import { QuestionBanks } from './questionBanks.ts';

interface QuizResult {
  question: string;
  image: string | null;
  selectedOptions: string[];
  isCorrect: boolean;
  explanation: string;
}

export const Ctfl = () => {
  const [selectedQuestionBank, setSelectedQuestionBank] = useState('sampleA');
  const [questions, setQuestions] = useState(QuestionBanks.sampleA);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionsByQuestion, setSelectedOptionsByQuestion] = useState(
    Array(questions.length).fill([])
  );
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [timer, setTimer] = useState(60 * 60); // 60 minutes in seconds
  const [results, setResults] = useState<QuizResult[]>([]);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const countdown: any = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          handleSubmit();
        }
        return prev - 1;
      });
    }, 1000);

    setTimerInterval(countdown);

    return () => clearInterval(countdown);
  }, []);

  useEffect(() => {
    setQuestions(QuestionBanks[selectedQuestionBank]);
    setSelectedOptionsByQuestion(Array(QuestionBanks[selectedQuestionBank].length).fill([]));
    setCurrentQuestionIndex(0);
    setShowScore(false);
    setScore(0);
    setResults([]);
    setTimer(60 * 60);
  }, [selectedQuestionBank]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleOptionClick = (option: any) => {
    const updatedOptions = [...selectedOptionsByQuestion];
    const currentOptions = updatedOptions[currentQuestionIndex];

    // Toggle the selected option
    if (currentOptions.includes(option)) {
      updatedOptions[currentQuestionIndex] = currentOptions.filter(
        (o: any) => o !== option
      );
    } else {
      updatedOptions[currentQuestionIndex] = [...currentOptions, option];
    }

    setSelectedOptionsByQuestion(updatedOptions);
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    const detailedResults = questions.map((question: any, index: number) => {
      const selectedOptions = selectedOptionsByQuestion[index];
      const correctOptions = question.correctOptions;

      // Check how many correct options were selected
      const correctSelected = selectedOptions.filter((option: any) =>
        correctOptions.includes(option)
      );

      const isPartiallyCorrect = correctSelected.length > 0;
      let isFullyCorrect =
        selectedOptions.length === correctOptions.length &&
        correctSelected.length === correctOptions.length;

      // Award score for partially correct answers if at least one correct option is selected
      if (isPartiallyCorrect) {
        setScore((prevScore) => prevScore + 1);
        isFullyCorrect = true;
      }

      return {
        question: question.question,
        image: question.image,
        selectedOptions,
        isCorrect: isFullyCorrect,
        explanation: question.explanation.answer,
      };
    });

    setResults(detailedResults);
    setShowScore(true);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptionsByQuestion(Array(questions.length).fill([]));
    setScore(0);
    setShowScore(false);
    setResults([]);
    setTimer(60 * 60);

    const countdown: any = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          handleSubmit();
        }
        return prev - 1;
      });
    }, 1000);

    setTimerInterval(countdown);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOptions = selectedOptionsByQuestion[currentQuestionIndex] || [];

  return (
    <Container>
      <div className="text-center">
        <h1>CTFL v4 Practice Exam - { selectedQuestionBank }</h1>
        <div>Time Remaining: {formatTime(timer)}</div>
        <Dropdown onSelect={(e: any) => setSelectedQuestionBank(e)}>
          <Dropdown.Toggle variant="success">{ selectedQuestionBank }</Dropdown.Toggle>
          <Dropdown.Menu>
            {Object.keys(QuestionBanks).map((key) => (
              <Dropdown.Item key={key} eventKey={key}>
                {key}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>
      {showScore ? (
        <div className="score-section">
          <h2>You scored {score} out of {questions.length}</h2>
          { (score / questions.length) * 100 >= 65 ? (<h3 style={ {'color': 'var(--success)'} }>You passed the exam</h3>) : (<h3 style={ {'color': 'var(--danger)'} }>Please practice more</h3>) }
          <h3>Review Incorrect Answers:</h3>
          {results.map ((result: any, index) => (
            !result.isCorrect && (
              <div key={index}>
                <h4>Question {index + 1}: {result.question}</h4>
                { result.image ? (<Image src={result.image} style={{ width: "95%", height: "95%" }}/>) : ''}
                <p>Your Answer: {result.selectedOptions.join (", ")}</p>
                <div>
                  <strong>Explanation:</strong>
                  <p dangerouslySetInnerHTML={{__html: result.explanation.replace (/\n/g, "<br />")}}></p>
                </div>
              </div>
            )
          ))}
          <Button onClick={handleRestart}>Restart Test</Button>
        </div>
      ) : (
        <div className="question-section">
          <div className="question-count">
            <span>Question {currentQuestionIndex + 1}</span>/{questions.length}
          </div>
          <p className="question">{currentQuestion.question}</p>
          { currentQuestion.image ? (<Image src={currentQuestion.image} style={{ width: "95%", height: "95%" }}/>) : ''}
          { currentQuestion?.code ? (<pre className="font-size-small">{currentQuestion.code}</pre>) : ''}
          <Table striped bordered hover>
            <tbody>
            {currentQuestion.options.map((option: any, index: any) => (
              <tr key={index}>
                <td>
                  <input
                    type="checkbox"
                    name={`question-${currentQuestionIndex}`}
                    value={option.charAt(0)}
                    checked={selectedOptions.includes(option.charAt(0))}
                    onChange={() => handleOptionClick(option.charAt(0))}
                    style={{ cursor: 'pointer' }}
                  />
                  <label style={{ marginLeft: "8px" }}>{option}</label>
                </td>
              </tr>
            ))}
            </tbody>
          </Table>
          <Button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
            Previous
          </Button>
          { currentQuestionIndex <= questions.length - 1 ? (<Button
            onClick={handleNextQuestion}
          >
            {"Next"}
          </Button>) : ''}
          <Button
            onClick={handleSubmit}
          >
            {"Submit"}
          </Button>
          <Button onClick={handleRestart}>Restart Test</Button>
        </div>
      )}
    </Container>
  );
};
