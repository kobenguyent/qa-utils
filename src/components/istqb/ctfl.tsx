import { useEffect, useState } from 'react';
import { Header } from "../Header.tsx";
import { Footer } from "../Footer.tsx";
import { Button, Container, Table, Dropdown } from 'react-bootstrap';
import { QuestionBanks } from './questionBanks.ts';

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
  const [results, setResults] = useState([]);
  const [timerInterval, setTimerInterval] = useState(null);

  useEffect(() => {
    const countdown = setInterval(() => {
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleOptionClick = (option) => {
    const updatedOptions = [...selectedOptionsByQuestion];
    const currentOptions = updatedOptions[currentQuestionIndex];

    if (currentOptions.includes(option)) {
      updatedOptions[currentQuestionIndex] = currentOptions.filter((o) => o !== option);
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

    const detailedResults = questions.map((question, index) => {
      const selectedOptions = selectedOptionsByQuestion[index];
      const isCorrect =
        selectedOptions.length === question.correctOptions.length &&
        selectedOptions.every((option) => question.correctOptions.includes(option));

      if (isCorrect) {
        setScore((prevScore) => prevScore + 1);
      }

      return {
        question: question.question,
        selectedOptions,
        isCorrect,
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

    const countdown = setInterval(() => {
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
      <Header />
      <div className="text-center">
        <h1>CTFL v4 Practice Exam - { selectedQuestionBank }</h1>
        <div>Time Remaining: {formatTime(timer)}</div>
        <Dropdown onSelect={(e) => setSelectedQuestionBank(e)}>
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
          <h3>Review Incorrect Answers:</h3>
          {results.map ((result, index) => (
            !result.isCorrect && (
              <div key={index}>
                <h4>Question {index + 1}: {result.question}</h4>
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
          <Table striped bordered hover>
            <tbody>
            {currentQuestion.options.map((option, index) => (
              <tr
                key={index}
                onClick={() => handleOptionClick(option.charAt(0))}
                className={selectedOptions.includes(option.charAt(0)) ? "table-primary" : ""}
                style={{ cursor: "pointer" }}
              >
                <td>{option}</td>
              </tr>
            ))}
            </tbody>
          </Table>
          <Button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
            Previous
          </Button>
          <Button
            onClick={currentQuestionIndex === questions.length - 1 ? handleSubmit : handleNextQuestion}
          >
            {currentQuestionIndex === questions.length - 1 ? "Submit" : "Next"}
          </Button>
        </div>
      )}
      <Footer />
    </Container>
  );
};
