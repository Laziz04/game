import React, { useState, useEffect } from "react";
import {
  Button,
  Box,
  Typography,
  TextField,
  LinearProgress,
} from "@mui/material";

const MathQuiz: React.FC = () => {
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [timer, setTimer] = useState<number>(10);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const [gameEnded, setGameEnded] = useState<boolean>(false);

  useEffect(() => {
    if (gameStarted && timer > 0 && questionCount < 10) {
      const timerId = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timer === 0 && gameStarted && questionCount < 10) {
      setWrongCount(wrongCount + 1);
      nextQuestion();
    }
  }, [timer, gameStarted, questionCount]);

  const generateQuestion = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const correct = num1 * num2;
    setQuestion(`${num1} × ${num2} = ?`);
    setCorrectAnswer(correct);
    const incorrectOptions = [
      correct + Math.floor(Math.random() * 10) + 1,
      correct - Math.floor(Math.random() * 10) - 1,
      correct + Math.floor(Math.random() * 5) + 1,
    ];
    setOptions([correct, ...incorrectOptions].sort(() => 0.5 - Math.random()));
  };

  const handleAnswer = (option: number) => {
    if (option === correctAnswer) {
      setScore(score + 10);
      setCorrectCount(correctCount + 1);
    } else {
      setWrongCount(wrongCount + 1);
    }
    nextQuestion();
  };

  const nextQuestion = () => {
    if (questionCount < 9) {
      setQuestionCount(questionCount + 1);
      setTimer(10);
      generateQuestion();
    } else {
      setGameStarted(false);
      setGameEnded(true);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setTimer(10);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setQuestionCount(0);
    setGameEnded(false);
    generateQuestion();
  };

  const handleUserNameSubmit = () => {
    const userStats = {
      name: userName,
      correct: correctCount,
      wrong: wrongCount,
      score: score,
      time: 10 * (questionCount + 1) - timer,
    };
    localStorage.setItem("userStats", JSON.stringify(userStats));
    setGameEnded(false);
  };

  return (
    <Box className="flex h-screen bg-gray-100">
      <Box className="flex flex-col items-center justify-center flex-1 bg-white p-6 rounded shadow-lg m-4">
        {gameStarted ? (
          <>
            <Box className="w-full mb-4">
              <LinearProgress
                variant="determinate"
                value={(timer / 10) * 100}
                className="h-2 bg-green-500"
              />
            </Box>
            <Typography variant="h4" className="mb-4">
              Ball: {score}
            </Typography>
            <Typography variant="h4" className="mb-4">
              To'g'ri: {correctCount}
            </Typography>
            <Typography variant="h4" className="mb-4">
              Xato: {wrongCount}
            </Typography>
            {questionCount < 10 ? (
              <>
                <Typography variant="h5" className="mb-4">
                  {question}
                </Typography>
                <Box className="grid grid-cols-2 gap-4">
                  {options.map((option, index) => (
                    <Button
                      key={index}
                      variant="contained"
                      color="primary"
                      className="transition-transform transform hover:scale-105"
                      onClick={() => handleAnswer(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </Box>
              </>
            ) : null}
          </>
        ) : gameEnded ? (
          correctCount > wrongCount ? (
            <>
              <Typography variant="h4" className="mb-4">
                Tabriklaymiz! Siz yutdingiz!
              </Typography>
              <TextField
                label="Ismingizni kiriting"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mb-4"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleUserNameSubmit}
              >
                Submit
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h4" className="mb-4">
                Siz yutqazdingiz!
              </Typography>
              <Button variant="contained" color="primary" onClick={startGame}>
                Start
              </Button>
            </>
          )
        ) : (
          <Button variant="contained" color="primary" onClick={startGame}>
            Start
          </Button>
        )}
      </Box>
      <Box className="flex-1 p-4 bg-gray-200 rounded shadow-lg m-4">
        <Typography variant="h5" className="mb-4">
          Menu
        </Typography>
        <Typography variant="body1" className="mb-2">
          Savollar soni: {questionCount}
        </Typography>
        <Typography variant="body1" className="mb-2">
          To'g'ri: {correctCount}
        </Typography>
        <Typography variant="body1" className="mb-2">
          Xato: {wrongCount}
        </Typography>
        <Typography variant="body1" className="mb-2">
          Ball: {score}
        </Typography>
        {localStorage.getItem("userStats") && (
          <>
            <Typography variant="h6" className="mt-4 mb-2">
              Oxirgi o'yin statistikasi
            </Typography>
            {Object.entries(JSON.parse(localStorage.getItem("userStats")!)).map(
              ([key, value]) => (
                <Typography
                  key={key}
                  variant="body1"
                >{`${key}: ${value}`}</Typography>
              )
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default MathQuiz;
