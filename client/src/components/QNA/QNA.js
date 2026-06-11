import PropTypes from "prop-types";
import { Table, Button, Statistic, Label, Header } from "semantic-ui-react";

// Review screen: score summary plus a per-question breakdown that includes the
// explanation and topic, so a wrong answer becomes something you learn from.
export default function QNA({ results, onRetryWrong, onRestart }) {
  const correct = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const wrong = total - correct;
  const percent = total ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="qna-container">
      <Header as="h2">Quiz results</Header>

      <Statistic.Group widths="three" size="small">
        <Statistic>
          <Statistic.Value>
            {correct}/{total}
          </Statistic.Value>
          <Statistic.Label>Correct</Statistic.Label>
        </Statistic>
        <Statistic color={percent >= 50 ? "green" : "red"}>
          <Statistic.Value>{percent}%</Statistic.Value>
          <Statistic.Label>Score</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{wrong}</Statistic.Value>
          <Statistic.Label>To review</Statistic.Label>
        </Statistic>
      </Statistic.Group>

      <Table celled striped size="large" style={{ marginTop: 24 }}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>#</Table.HeaderCell>
            <Table.HeaderCell>Question</Table.HeaderCell>
            <Table.HeaderCell>Your answer</Table.HeaderCell>
            <Table.HeaderCell>Correct answer</Table.HeaderCell>
            <Table.HeaderCell>Explanation</Table.HeaderCell>
            <Table.HeaderCell>Topic</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {results.map((item, i) => (
            <Table.Row key={i} positive={item.isCorrect} negative={!item.isCorrect}>
              <Table.Cell>{i + 1}</Table.Cell>
              <Table.Cell>{item.question}</Table.Cell>
              <Table.Cell style={{ color: item.isCorrect ? "green" : "red" }}>
                {item.userResponse}
              </Table.Cell>
              <Table.Cell>{item.correctAnswer}</Table.Cell>
              <Table.Cell>{item.explanation}</Table.Cell>
              <Table.Cell>
                {item.topic && <Label size="small">{item.topic}</Label>}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <div style={{ marginTop: 20 }}>
        {wrong > 0 && (
          <Button
            color="orange"
            icon="redo"
            content={`Retry ${wrong} wrong ${wrong === 1 ? "one" : "ones"}`}
            onClick={onRetryWrong}
          />
        )}
        <Button primary icon="home" content="New quiz" onClick={onRestart} />
      </div>
    </div>
  );
}

QNA.propTypes = {
  results: PropTypes.array.isRequired,
  onRetryWrong: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
};
