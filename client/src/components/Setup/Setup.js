import { useState } from "react";
import {
  Button,
  Form,
  Header,
  Segment,
  Tab,
  TextArea,
  Dropdown,
  Input,
  Message,
} from "semantic-ui-react";
import "./Setup.css";

const DIFFICULTY_OPTIONS = [
  { key: "easy", text: "Easy", value: "easy" },
  { key: "medium", text: "Medium", value: "medium" },
  { key: "hard", text: "Hard", value: "hard" },
];

// Course material in, practice questions out. Three ways to provide the material.
export default function Setup({ onGenerate }) {
  const [activeTab, setActiveTab] = useState(0); // 0 text, 1 pdf, 2 notion
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [notionIds, setNotionIds] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(10);
  const [localError, setLocalError] = useState("");

  function submit() {
    setLocalError("");
    const numberOfQuestions = Math.max(1, Math.min(Number(count) || 1, 20));

    if (activeTab === 0) {
      if (text.trim().length < 40) {
        setLocalError("Paste a bit more material (at least a paragraph).");
        return;
      }
      onGenerate({ source: "text", content: text, numberOfQuestions, difficulty });
    } else if (activeTab === 1) {
      if (!file) {
        setLocalError("Choose a PDF file first.");
        return;
      }
      onGenerate({ source: "pdf", file, numberOfQuestions, difficulty });
    } else {
      const ids = notionIds
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length === 0) {
        setLocalError("Enter at least one Notion page ID.");
        return;
      }
      onGenerate({ source: "notion", notionPageIds: ids, numberOfQuestions, difficulty });
    }
  }

  const panes = [
    {
      menuItem: { key: "text", icon: "edit outline", content: "Paste text" },
      render: () => (
        <Tab.Pane>
          <Form>
            <TextArea
              placeholder="Paste your lecture notes or course material here..."
              style={{ minHeight: 180 }}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Form>
        </Tab.Pane>
      ),
    },
    {
      menuItem: { key: "pdf", icon: "file pdf outline", content: "Upload PDF" },
      render: () => (
        <Tab.Pane>
          <p>Upload a lecture PDF — we extract the text and build questions from it.</p>
          <Button as="label" htmlFor="pdf-upload" icon="upload" content="Choose PDF" />
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
          {file && <span style={{ marginLeft: 12 }}>{file.name}</span>}
        </Tab.Pane>
      ),
    },
    {
      menuItem: { key: "notion", icon: "sticky note outline", content: "Notion" },
      render: () => (
        <Tab.Pane>
          <p>
            Paste one or more Notion page IDs (space- or comma-separated). The
            integration token is configured on the server, never here.
          </p>
          <Form>
            <Input
              fluid
              placeholder="aaa8bb9510a14793aabd1c98d8fe8279, eb7b5acc..."
              value={notionIds}
              onChange={(e) => setNotionIds(e.target.value)}
            />
          </Form>
        </Tab.Pane>
      ),
    },
  ];

  return (
    <Segment padded="very" className="setup-segment">
      <Header as="h2">
        Turn course material into a practice quiz
        <Header.Subheader>
          Paste text, upload a PDF, or pull from Notion. Every question comes with
          an explanation and a topic tag.
        </Header.Subheader>
      </Header>

      <Tab
        panes={panes}
        activeIndex={activeTab}
        onTabChange={(_, { activeIndex }) => setActiveTab(activeIndex)}
        menu={{ secondary: true, pointing: true }}
      />

      <Form className="setup-controls">
        <Form.Group widths="equal">
          <Form.Field>
            <label>Difficulty</label>
            <Dropdown
              selection
              options={DIFFICULTY_OPTIONS}
              value={difficulty}
              onChange={(_, { value }) => setDifficulty(value)}
            />
          </Form.Field>
          <Form.Field>
            <label>Number of questions (1–20)</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </Form.Field>
        </Form.Group>
      </Form>

      {localError && <Message negative size="small" content={localError} />}

      <Button primary size="big" icon="magic" content="Generate quiz" onClick={submit} />
    </Segment>
  );
}
