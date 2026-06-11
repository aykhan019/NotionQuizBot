import { useState } from "react";
import "./Quizzes.css";
import { Button, Item, Message, Divider, Menu, Label } from "semantic-ui-react";
import getLetter from "../../utils/getLetter";
import checkResults from "../../utils/checkResults";

// Runs through the questions one at a time, revealing whether each answer was
// right (with its explanation) immediately after it's picked.
export default function Quizzes({ questions, onComplete }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState(
    Array(questions.length).fill(null)
  );

  const current = questions[questionIndex];
  const selected = userResponses[questionIndex];
  const revealed = selected !== null; // feedback shows once an answer is chosen
  const isLast = questionIndex === questions.length - 1;

  function selectAnswer(answer) {
    if (revealed) return; // lock the choice once made
    const updated = [...userResponses];
    updated[questionIndex] = answer;
    setUserResponses(updated);
  }

  function next() {
    if (isLast) {
      const { results } = checkResults(userResponses, questions);
      onComplete(results);
    } else {
      setQuestionIndex(questionIndex + 1);
    }
  }

  function optionColor(option) {
    if (!revealed) return undefined;
    if (option === current.correctAnswer) return "green";
    if (option === selected) return "red";
    return undefined;
  }

  return (
    <div className="quizzes-container">
      <Item.Meta>
        <Message size="huge" floating>
          <b>
            {questionIndex + 1}/{questions.length}. {current.question}
          </b>
        </Message>
        <Item.Description>
          <h3>Choose one answer:</h3>
        </Item.Description>
        <Divider />
        <Menu vertical fluid size="massive">
          {current.answers.map((option, i) => {
            const color = optionColor(option);
            return (
              <Menu.Item
                key={i}
                active={selected === option}
                color={color}
                onClick={() => selectAnswer(option)}
                style={revealed ? { cursor: "default" } : undefined}
              >
                <b style={{ marginRight: "8px" }}>{getLetter(i)}</b>
                {option}
              </Menu.Item>
            );
          })}
        </Menu>
      </Item.Meta>

      {revealed && (
        <Message
          positive={selected === current.correctAnswer}
          negative={selected !== current.correctAnswer}
        >
          <Message.Header>
            {selected === current.correctAnswer ? "Correct!" : "Not quite."}
            {current.topic && (
              <Label size="small" style={{ marginLeft: 10 }}>
                {current.topic}
              </Label>
            )}
          </Message.Header>
          {selected !== current.correctAnswer && (
            <p>
              Correct answer: <b>{current.correctAnswer}</b>
            </p>
          )}
          {current.explanation && <p>{current.explanation}</p>}
        </Message>
      )}

      <Divider />
      <Item.Extra>
        <Button
          primary
          content={isLast ? "See results" : "Next"}
          icon={isLast ? "check" : "right chevron"}
          labelPosition="right"
          floated="right"
          size="big"
          onClick={next}
          disabled={!revealed}
        />
      </Item.Extra>
    </div>
  );
}
