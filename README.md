# Quiz Bot Web Application

This repository contains a web application that generates quizzes from Notion data using AI.

## Table of Contents

- [Introduction](#introduction)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Features](#features)
- [Running the Application](#running-the-application)
- [Demo Video](#demo-video)
- [License](#license)

## Introduction

The Quiz Bot Web Application is a full-stack project consisting of a React front-end and a Flask back-end. The back-end fetches data from Notion, uses AI to generate quiz questions, and the front-end displays these questions to the user in an interactive quiz format.

## Folder Structure

- `client/`: React front-end application.
- `flask_server/`: Flask back-end API.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (for the React app)
- [Python 3.9+](https://www.python.org/downloads/) (for the Flask API)
- [Git](https://git-scm.com/)

### Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### Client Setup (React App)

Navigate to the client folder and install dependencies:

```bash
cd client
npm install
```

### Server Setup (Flask API)

Navigate to the flask_server folder. First, create a virtual environment and activate it:

```bash
cd ../flask_server
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

## Configuration

### Notion Integration

To use the Notion integration, you need to insert your Notion integration token and top page IDs in the React component.

1. Open `client/src/components/Quizzes/Quizzes.js`.
2. Find the following section in the code:

    ```javascript
    body: JSON.stringify({
      notion_token: '',  // Insert your Notion integration token here
      top_page_ids: [    // Insert your Notion top page IDs here
        'aaa8bb9510a14793aabd1c98d8fe8279',
        'eb7b5acc92864c34a52bf602f52be333',
        '9a36fbf06f3c4019bc6bb3de86f1554a'
      ],
      number_of_questions: 10
    })
    ```

3. Replace the empty string `''` in `notion_token` with your actual Notion integration token.
4. Update the `top_page_ids` array with the IDs of the Notion pages you want to use for quiz generation.

### Running the Application

### Flask Back-end

To start the Flask API:

```bash
cd flask_server
source venv/bin/activate  # On Windows use: venv\Scripts\activate
python server.py
```

### React Front-end

To start the React development server:

```bash
cd client
npm start
```

### Running Both Front-end and Back-end

1. Start the Flask server first.
2. Start the React front-end.

## Features

- Generates quizzes based on data from Notion using AI.
- Interactive UI for answering quiz questions.
- Score tracking with detailed result display.

## Demo Video

Check out the following video to see the Quiz Bot Web Application in action:

<a href="https://www.youtube.com/watch?v=T5DJ435Chzg&ab_channel=MyProjects">
  <img src="https://img.youtube.com/vi/T5DJ435Chzg/hqdefault.jpg" alt="Watch Demo Video" width="100%"/>
</a>

## License

This project is licensed under the MIT License.
