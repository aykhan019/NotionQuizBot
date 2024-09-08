function checkResults(userResponses, data) {
  let score = 0;
  const results = [];

  userResponses.forEach((userResponse, index) => {
    const question = data[index];
    const correctAnswerIndex = question.correctAnswer;
    const correctAnswer = question.answers[correctAnswerIndex];

    const isCorrect = userResponse === correctAnswer;

    results.push({
      question: question.question,
      userResponse: userResponse,
      correctAnswer: correctAnswer,
      isCorrect,
      point: isCorrect ? 1 : 0,
    });

    if (isCorrect) {
      score++;
    }
  });

  return { score, results };
}

export default checkResults;
