export default class QuizData {
  constructor(question, options, correctAnswer, explanation, topic) {
    this.question = question;
    this.answers = options; // kept as `answers` for the quiz UI
    this.correctAnswer = correctAnswer;
    this.explanation = explanation;
    this.topic = topic;
  }
}
