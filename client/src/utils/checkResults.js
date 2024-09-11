function checkResults(userResponses, data) {
  if (!Array.isArray(userResponses) || !Array.isArray(data)) {
    throw new Error('Both userResponses and data must be arrays.');
  }

  if (userResponses.length !== data.length) {
    throw new Error('The length of userResponses must match the length of data.');
  }

  let score = 0;
  const results = [];

  userResponses.forEach((userResponse, index) => {
    const question = data[index];
    
    if (!question || !Array.isArray(question.answers) || typeof question.correctAnswer !== 'string') {
      throw new Error('Invalid question data at index ' + index);
    }

    const correctAnswer = question.correctAnswer;
    if (!question.answers.includes(correctAnswer)) {
      throw new Error('Correct answer not found in answers at question index ' + index);
    }

    const isCorrect = userResponse === correctAnswer;

    results.push({
      question: question.question,
      userResponse: userResponse,
      correctAnswer: correctAnswer,
      isCorrect: isCorrect,
      point: isCorrect ? 1 : 0,
    });

    if (isCorrect) {
      score++;
    }
  });

  return { score, results };
}

export default checkResults;
