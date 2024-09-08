import "./App.css";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import Quizzes from "./components/Quizzes/Quizzes";

function App() {
  return (
    <div className="app-container">
      <Header></Header>
      <Quizzes></Quizzes>
      <Footer></Footer>
    </div>
  );
}

export default App;
