import React, { useState, useEffect } from "react";
import { Box, Button, Tab, Tabs, Typography } from "@mui/material";
import Confetti from "react-confetti";
import { styled } from "@mui/system";
import { TabContext, TabPanel } from "@mui/lab";
import "./sd.css"; // Ensure this file doesn't override Tailwind's styles

type Cube = {
  revealed: boolean;
  number: number;
  disabled: boolean;
};

type GridSize = "4x4" | "6x6" | "8x8";

const generateGrid = (rows: number, cols: number): Cube[][] => {
  const totalCubes = rows * cols;
  const numbers = Array(totalCubes / 2)
    .fill(0)
    .flatMap((_, i) => [i + 1, i + 1]);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  const grid: Cube[][] = [];
  let idx = 0;
  for (let i = 0; i < rows; i++) {
    const row: Cube[] = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        revealed: false,
        number: numbers[idx++],
        disabled: false,
      });
    }
    grid.push(row);
  }
  return grid;
};

const StyledBox = styled(Box)`
  display: grid;
  gap: 4px; /* Reduced spacing between cubes */
`;

const Game: React.FC = () => {
  const [tabValue, setTabValue] = useState<GridSize>("6x6");
  const [grid, setGrid] = useState(generateGrid(6, 6));
  const [selected, setSelected] = useState<{ row: number; col: number }[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // Default time is 3 minutes
  const [isGameActive, setIsGameActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [leaderboard, setLeaderboard] = useState<
    { name: string; time: number }[]
  >([]);

  useEffect(() => {
    const savedLeaderboard = localStorage.getItem("leaderboard");
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    if (timeLeft === 0 && isGameActive) {
      alert("Time's up! You didn't find all pairs.");
      endGame();
    }

    return () => clearInterval(timer);
  }, [timeLeft, isGameActive]);

  useEffect(() => {
    const totalPairs = (grid.length * grid[0].length) / 2;
    if (matched.length === totalPairs) {
      endGame();
    }
  }, [matched, grid]);

  const endGame = () => {
    setIsGameActive(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    // Save the elapsed time to local storage
    localStorage.setItem("elapsedTime", JSON.stringify(elapsedTime));

    // Save the score to leaderboard
    const playerName = prompt("Enter your name to save your score:");
    if (playerName) {
      const newLeaderboard = [
        ...leaderboard,
        { name: playerName, time: elapsedTime },
      ]
        .sort((a, b) => a.time - b.time)
        .slice(0, 10); // Keep only top 10 scores
      localStorage.setItem("leaderboard", JSON.stringify(newLeaderboard));
      setLeaderboard(newLeaderboard);
    }

    // Reset game state to default after a short delay
    setTimeout(() => {
      resetGame(tabValue); // Reset game with the current tab value
    }, 3000); // Match the duration of the confetti display
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: GridSize) => {
    if (!isGameActive) {
      setTabValue(newValue);
      resetGame(newValue);
    }
  };

  const handleCubeClick = (row: number, col: number) => {
    if (!isGameActive || grid[row][col].revealed || grid[row][col].disabled)
      return;

    const newGrid = [...grid];
    newGrid[row][col].revealed = true;
    setGrid(newGrid);

    const newSelected = [...selected, { row, col }];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      const firstCube = newGrid[first.row][first.col];
      const secondCube = newGrid[second.row][second.col];

      if (firstCube.number === secondCube.number) {
        const matchedNumber = firstCube.number;
        setMatched([...matched, matchedNumber]);
        const updatedGrid = newGrid.map((row) =>
          row.map((cube) =>
            cube.number === matchedNumber ? { ...cube, disabled: true } : cube
          )
        );
        setGrid(updatedGrid);
      } else {
        // Reset the cubes if they do not match
        setTimeout(() => {
          const resetGrid = newGrid.map((row) =>
            row.map((cube) =>
              cube.revealed && !cube.disabled
                ? { ...cube, revealed: false }
                : cube
            )
          );
          setGrid(resetGrid);
        }, 1000); // Delay to show the cubes briefly before hiding them
      }
      setSelected([]);
    }
  };

  const resetGame = (newValue: GridSize) => {
    const [rows, cols] = newValue.split("x").map(Number);
    setGrid(generateGrid(rows, cols));
    setSelected([]);
    setMatched([]);
    setShowConfetti(false);

    // Set timer based on grid size and difficulty
    const timeLimits: { [key in GridSize]: number } = {
      "4x4": 90, // 1 minute 30 seconds
      "6x6": 180, // 3 minutes
      "8x8": 300, // 5 minutes
    };
    const difficultyTimeModifiers: {
      [key in "easy" | "medium" | "hard"]: number;
    } = {
      easy: 30, // Add 30 seconds for easy
      medium: 0, // Default time for medium
      hard: -30, // Subtract 30 seconds for hard
    };
    setTimeLeft(timeLimits[newValue] + difficultyTimeModifiers[difficulty]);

    setElapsedTime(0);
    setIsGameActive(false);
  };

  const startGame = () => {
    setIsGameActive(true);
  };

  const handleDifficultyChange = (
    newDifficulty: "easy" | "medium" | "hard"
  ) => {
    setDifficulty(newDifficulty);
    resetGame(tabValue);
  };

  const handleEndGame = () => {
    setIsGameActive(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <Box className="flex flex-col items-center pt-3 text-center px-4 sm:px-8 lg:px-16">
      <Box
        sx={{
          padding: "10px",
          width: "100%",
          maxWidth: "600px",
          height: "auto",
          borderRadius: 8,
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
          marginBottom: 3,
        }}
      >
        <TabContext value={tabValue}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            TabIndicatorProps={{ style: { display: "none" } }}
          >
            <Tab
              label="4x4"
              value="4x4"
              className={`tab ${tabValue === "4x4" ? "selected-tab" : ""}`}
            />
            <Tab
              label="6x6"
              value="6x6"
              className={`tab ${tabValue === "6x6" ? "selected-tab" : ""}`}
            />
            <Tab
              label="8x8"
              value="8x8"
              className={`tab ${tabValue === "8x8" ? "selected-tab" : ""}`}
            />
          </Tabs>
          <TabPanel value="4x4">
            <StyledBox
              sx={{ gridTemplateColumns: "repeat(4, 1fr)" }}
              className="gap-2 sm:gap-4"
            >
              {grid.map((row, rowIndex) =>
                row.map((cube, colIndex) => (
                  <Button
                    key={`${rowIndex}-${colIndex}`}
                    variant="contained"
                    color="primary"
                    onClick={() => handleCubeClick(rowIndex, colIndex)}
                    disabled={cube.revealed || cube.disabled}
                    className={`cube ${
                      cube.revealed || cube.disabled ? "revealed" : ""
                    }`}
                    style={{
                      width: "100%",
                      paddingBottom: "100%",
                      position: "relative",
                    }}
                  >
                    <span
                      className="cube-content"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px", // Slightly smaller font size for 4x4
                      }}
                    >
                      {cube.revealed || cube.disabled ? cube.number : ""}
                    </span>
                  </Button>
                ))
              )}
            </StyledBox>
          </TabPanel>
          <TabPanel value="6x6">
            <StyledBox
              sx={{ gridTemplateColumns: "repeat(6, 1fr)" }}
              className="gap-2 sm:gap-4"
            >
              {grid.map((row, rowIndex) =>
                row.map((cube, colIndex) => (
                  <Button
                    key={`${rowIndex}-${colIndex}`}
                    variant="contained"
                    color="primary"
                    onClick={() => handleCubeClick(rowIndex, colIndex)}
                    disabled={cube.revealed || cube.disabled}
                    className={`cube ${
                      cube.revealed || cube.disabled ? "revealed" : ""
                    }`}
                    style={{
                      width: "100%",
                      paddingBottom: "100%",
                      position: "relative",
                    }}
                  >
                    <span
                      className="cube-content"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px", // Slightly larger font size for 6x6
                      }}
                    >
                      {cube.revealed || cube.disabled ? cube.number : ""}
                    </span>
                  </Button>
                ))
              )}
            </StyledBox>
          </TabPanel>
          <TabPanel value="8x8">
            <StyledBox
              sx={{ gridTemplateColumns: "repeat(8, 1fr)" }}
              className="gap-2 sm:gap-4"
            >
              {grid.map((row, rowIndex) =>
                row.map((cube, colIndex) => (
                  <Button
                    key={`${rowIndex}-${colIndex}`}
                    variant="contained"
                    color="primary"
                    onClick={() => handleCubeClick(rowIndex, colIndex)}
                    disabled={cube.revealed || cube.disabled}
                    className={`cube ${
                      cube.revealed || cube.disabled ? "revealed" : ""
                    }`}
                    style={{
                      width: "100%",
                      paddingBottom: "100%",
                      position: "relative",
                    }}
                  >
                    <span
                      className="cube-content"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                      }}
                    >
                      {cube.revealed || cube.disabled ? cube.number : ""}
                    </span>
                  </Button>
                ))
              )}
            </StyledBox>
          </TabPanel>
        </TabContext>
      </Box>

      <Box className="flex flex-wrap justify-center gap-2 sm:gap-4 my-4">
        <Button
          variant="contained"
          color={difficulty === "easy" ? "secondary" : "primary"}
          onClick={() => handleDifficultyChange("easy")}
          className="w-24"
        >
          Easy
        </Button>
        <Button
          variant="contained"
          color={difficulty === "medium" ? "secondary" : "primary"}
          onClick={() => handleDifficultyChange("medium")}
          className="w-24"
        >
          Medium
        </Button>
        <Button
          variant="contained"
          color={difficulty === "hard" ? "secondary" : "primary"}
          onClick={() => handleDifficultyChange("hard")}
          className="w-24"
        >
          Hard
        </Button>
      </Box>

      <Box className="flex flex-wrap justify-center gap-2 sm:gap-4 my-4">
        <Button
          variant="contained"
          color="success"
          onClick={startGame}
          className="w-24"
        >
          Start Game
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleEndGame}
          className="w-24"
        >
          End Game
        </Button>
      </Box>

      <Typography variant="h6" className="my-4">
        Time Left: {timeLeft} seconds
      </Typography>

      <Typography variant="h6" className="my-4">
        Elapsed Time: {elapsedTime} seconds
      </Typography>

      <Typography variant="h5" className="my-4">
        Leaderboard
      </Typography>
      <Box className="w-full max-w-lg bg-white p-4 rounded-lg shadow-md">
        {leaderboard.length === 0 ? (
          <Typography variant="body1">No scores yet.</Typography>
        ) : (
          <Box className="overflow-y-auto max-h-64">
            {leaderboard.map((entry, index) => (
              <Typography key={index} variant="body1" className="my-2">
                {index + 1}. {entry.name}: {entry.time} seconds
              </Typography>
            ))}
          </Box>
        )}
      </Box>

      {showConfetti && <Confetti />}
    </Box>
  );
};

export default Game;
