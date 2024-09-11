import React, { useState, useEffect } from "react";
import "./Quizzes.css";
import 'semantic-ui-css/semantic.min.css'
import { Button, Item, Message, Divider, Menu, Modal } from "semantic-ui-react";
import shuffleArray from "../../utils/shuffleArray";
import getLetter from "../../utils/getLetter";
import checkResults from "../../utils/checkResults";
import QNA from "../QNA/QNA";
import QuizData from "../../classes/QuizData";

export default function Quizzes() {
  const [data, setData] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState([]);
  const [isFinishModalOpen, setFinishModalOpen] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState([]);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const loadingTexts = [
    "Connecting to Notion to retrieve data...",
    "Processing your request with AI...",
    "Compiling and organizing your quiz..."
  ];

  useEffect(() => {
    let isMounted = true; // Track if component is still mounted

    async function fetchQuizzes() {
      try {
        const response = await fetch('/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notion_token: ' ',
            top_page_ids: ['aaa8bb9510a14793aabd1c98d8fe8279', 'eb7b5acc92864c34a52bf602f52be333', '9a36fbf06f3c4019bc6bb3de86f1554a'],
            number_of_questions: 10
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (isMounted) { // Only update state if still mounted
          const quiz = data.quiz.map(
            q => new QuizData(q.question, q.answers, q.correct_answer)
          );
          const shuffledQuestions = shuffleArray(quiz);
          shuffledQuestions.forEach((question) => {
            question.answers = shuffleArray(question.answers);
          });

          setData(shuffledQuestions);
          setUserResponses(Array(shuffledQuestions.length).fill(null));
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      }
    }

    fetchQuizzes();

    return () => {
      isMounted = false; // Cleanup flag on unmount
    };
  }, []);

  function openFinishModal() {
    setFinishModalOpen(true);
  }

  function closeFinishModal() {
    setFinishModalOpen(false);
  }

  function handleItemClick(answer) {
    const updatedUserResponses = [...userResponses];
    updatedUserResponses[questionIndex] = answer;
    setUserResponses(updatedUserResponses);
  }

  function handleNext() {
    if (userResponses[questionIndex] !== null) {
      if (questionIndex < data.length - 1) {
        setQuestionIndex(questionIndex + 1);
      } else {
        openFinishModal();
      }
    }
  }

  function handleFinish() {
    const { score, results } = checkResults(userResponses, data);
    console.log("Quiz completed!");
    console.log(`Score: ${score}/${data.length}`);
    console.log("Results:", results);

    setQuizCompleted(true);
    setQuestionsAndAnswers(results);
  }

  function handlePrevious() {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    }
  }

  if (data.length === 0) {
    return (
      <div id="loading-container">
        <div id="spinner"></div>
        <div id="loading-text">{loadingTexts[loadingTextIndex]}</div>
      </div>
    );
  }

  return (
    <div className="quizzes-container">
      {quizCompleted ? (
        <QNA questionsAndAnswers={questionsAndAnswers} />
      ) : (
        <>
          <Item.Meta>
            <Message size="huge" floating>
              <b>{`${questionIndex + 1}/${data.length}`}. {data[questionIndex].question}</b>
            </Message>
            <br />
            <Item.Description>
              <h3>Please choose one of the following answers:</h3>
            </Item.Description>
            <Divider />
            <Menu vertical fluid size="massive">
              {data[questionIndex].answers.map((option, i) => {
                const letter = getLetter(i);

                return (
                  <Menu.Item
                    key={i}
                    active={userResponses[questionIndex] === option}
                    onClick={() => handleItemClick(option)}
                  >
                    <b style={{ marginRight: "8px" }}>{letter}</b>
                    {option}
                  </Menu.Item>
                );
              })}
            </Menu>
          </Item.Meta>
          <Divider />
          <Item.Extra>
            {questionIndex > 0 && (
              <Button
                primary
                content="Previous"
                onClick={handlePrevious}
                floated="left"
                size="big"
                icon="left chevron"
                labelPosition="left"
              />
            )}
            <Button
              primary
              content={questionIndex === data.length - 1 ? "Finish" : "Next"}
              onClick={
                questionIndex === data.length - 1 ? handleFinish : handleNext
              }
              floated="right"
              size="big"
              icon={
                questionIndex === data.length - 1 ? "check" : "right chevron"
              }
              labelPosition="right"
              disabled={userResponses[questionIndex] === null}
            />
          </Item.Extra>
        </>
      )}

      <Modal open={isFinishModalOpen} onClose={closeFinishModal}>
        <Modal.Header>Finish Quiz</Modal.Header>
        <Modal.Content>
          <p>Are you sure you want to finish the quiz?</p>
        </Modal.Content>
        <Modal.Actions>
          <Button secondary content="No" onClick={closeFinishModal} />
          <Button
            primary
            content="Yes"
            onClick={() => {
              closeFinishModal();
              handleFinish();
            }}
          />
        </Modal.Actions>
      </Modal>
    </div>
  );
}
