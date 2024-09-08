import React, { useState } from "react";
import PropTypes from "prop-types";
import { Table, Button } from "semantic-ui-react";

export default function QNA({ questionsAndAnswers }) {
  // Calculate the count of correct answers and total questions
  const correctAnswerCount = questionsAndAnswers.filter(
    (item) => item.isCorrect
  ).length;
  const totalQuestions = questionsAndAnswers.length;

  // Function to handle going back to the quiz page
  const handleStartAgain = () => {
    window.location.reload();
  };

  return <div>
  <h2>Quiz Results</h2>
  <Table celled striped selectable size="large">
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>No.</Table.HeaderCell>
        <Table.HeaderCell>Questions</Table.HeaderCell>
        <Table.HeaderCell>Your Answers</Table.HeaderCell>
        <Table.HeaderCell>Correct Answers</Table.HeaderCell>
        <Table.HeaderCell>Points</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {questionsAndAnswers.map((item, i) => (
        <Table.Row key={i + 1}>
          <Table.Cell>{i + 1}</Table.Cell>
          <Table.Cell>{item.question}</Table.Cell>
          <Table.Cell style={{ color: item.isCorrect ? "green" : "red" }}>
            {item.userResponse}
          </Table.Cell>
          <Table.Cell>{item.correctAnswer}</Table.Cell>
          <Table.Cell>{item.point}</Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table>

  {/* Display additional statistics */}
  <div style={{ marginTop: "20px" }}>
    <h3>Quiz Statistics</h3>
    <p>Total Questions: {totalQuestions}</p>
    <p>Correct Answers: {correctAnswerCount}</p>
    <p>Incorrect Answers: {totalQuestions - correctAnswerCount}</p>
    <p>
      Percentage Correct: {((correctAnswerCount / totalQuestions) * 100).toFixed(2)}%
    </p>
  </div>

  {/* Start Again button */}
  <Button
    primary
    onClick={handleStartAgain}
    style={{ marginTop: "20px" }}
  >
    Start Again
  </Button>
</div>;
}

QNA.propTypes = {
  questionsAndAnswers: PropTypes.array.isRequired,
};
