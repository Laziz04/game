import React, { useState, useEffect } from "react";
import { Box, Button, Tab, Tabs, Typography } from "@mui/material";
import Confetti from "react-confetti";
import { styled } from "@mui/system";
import { TabContext, TabPanel } from "@mui/lab";

type Cube = {
  revealed: boolean;
  number: number;
  disabled: boolean;
};

const generateGrid = (rows: number, cols: number): Cube[][] => {
  const numbers = Array(rows * cols)
    .fill(0)
    .map((_, i) => Math.floor(i / 2) + 1);
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
  gap: 8px;
`;

const Game: React.FC = () => {
  const [tabValue, setTabValue] = useState("6x6");
  const [grid, setGrid] = useState(generateGrid(6, 6));
  const [selected, setSelected] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300 seconds
  const [isGameActive, setIsGameActive] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }, 1000);
    }

    if (timeLeft === 0 && isGameActive) {
      alert("Time's up! You didn't find all pairs.");
      setIsGameActive(false);
      setTimeout(() => resetGame(), 120000); // 2 minutes cooldown
    }

    return () => clearInterval(timer);
  }, [timeLeft, isGameActive]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
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

    const newSelected = [...selected, newGrid[row][col].number];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      if (newSelected[0] === newSelected[1]) {
        const matchedNumber = newSelected[0];
        setMatched([...matched, matchedNumber]);
        const updatedGrid = newGrid.map((row) =>
          row.map((cube) =>
            cube.number === matchedNumber ? { ...cube, disabled: true } : cube
          )
        );
        setGrid(updatedGrid);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setTimeout(() => {
          const revertedGrid = newGrid.map((row) =>
            row.map((cube) => ({
              ...cube,
              revealed: matched.includes(cube.number) || cube.revealed,
            }))
          );
          setGrid(revertedGrid);
          alert("You lost! The numbers didn't match.");
          setIsGameActive(false);
          setTimeout(() => resetGame(tabValue), 120000); // 2 minutes cooldown
        }, 1000);
      }
      setSelected([]);
    }
  };

  const resetGame = (newValue: string = tabValue) => {
    const [rows, cols] = newValue.split("x").map(Number);
    setGrid(generateGrid(rows, cols));
    setSelected([]);
    setMatched([]);
    setShowConfetti(false);
    setTimeLeft(300);
    setIsGameActive(false);
  };

  const startGame = () => {
    setIsGameActive(true);
  };

  return (
    <Box className="p-4">
      {showConfetti && <Confetti />}
      <TabContext value={tabValue}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="game grid size"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="4 x 4" value="4x4" disabled={isGameActive} />
          <Tab label="6 x 6" value="6x6" disabled={isGameActive} />
          <Tab label="8 x 8" value="8x8" disabled={isGameActive} />
        </Tabs>
        <TabPanel value="4x4">
          <Grid grid={grid} onCubeClick={handleCubeClick} matched={matched} />
        </TabPanel>
        <TabPanel value="6x6">
          <Grid grid={grid} onCubeClick={handleCubeClick} matched={matched} />
        </TabPanel>
        <TabPanel value="8x8">
          <Grid grid={grid} onCubeClick={handleCubeClick} matched={matched} />
        </TabPanel>
      </TabContext>
      <Button
        onClick={startGame}
        disabled={isGameActive}
        variant="contained"
        className="mt-4"
      >
        Start
      </Button>
      <Typography className="mt-4">
        Time left: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? "0" : ""}
        {timeLeft % 60}
      </Typography>
    </Box>
  );
};

const Grid: React.FC<{
  grid: Cube[][];
  onCubeClick: (row: number, col: number) => void;
  matched: number[];
}> = ({ grid, onCubeClick, matched }) => {
  return (
    <StyledBox
      sx={{
        gridTemplateColumns: `repeat(${grid[0].length}, 50px)`,
      }}
      className="gap-2"
    >
      {grid.map((row, rowIndex) =>
        row.map((cube, colIndex) => (
          <Box
            key={`${rowIndex}-${colIndex}`}
            className={`w-12 h-12 flex items-center justify-center cursor-pointer border 
              ${cube.revealed ? "bg-blue-300" : "bg-gray-400"} 
              ${
                cube.disabled
                  ? "bg-green-300"
                  : matched.includes(cube.number)
                  ? "bg-green-300"
                  : "border-black"
              }`}
            onClick={() => onCubeClick(rowIndex, colIndex)}
          >
            {cube.revealed && <Typography>{cube.number}</Typography>}
          </Box>
        ))
      )}
    </StyledBox>
  );
};

export default Game;
