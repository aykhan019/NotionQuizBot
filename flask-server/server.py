from flask import Flask, request, jsonify
from g4f.client import Client as G4FClient
from notion_client import Client as NotionClient
import random
import asyncio
import time
import json
from notion_exporter import NotionExporter
import nest_asyncio

# Apply nest_asyncio to allow nested event loops
nest_asyncio.apply()

app = Flask(__name__)

class NotionDataFetcher:
    def __init__(self, notion_token, top_page_ids, number_of_random_pages=1):
        self.notion = NotionClient(auth=notion_token)
        self.exporter = NotionExporter(notion_token=notion_token, export_child_pages=False)
        self.top_page_ids = set(top_page_ids)
        self.number_of_random_pages = number_of_random_pages

    async def fetch_page_content(self, page_id):
        page_data = await self.exporter._async_export_pages({page_id}, set())
        page_content = page_data[0].get(page_id, "")
        return page_content

    def get_subpages(self, top_page_id):
        subpage_ids = []
        try:
            page_children = self.notion.blocks.children.list(block_id=top_page_id)
            for child in page_children['results']:
                if child['type'] == 'child_page':
                    subpage_ids.append(child['id'])
        except Exception as e:
            print(f"Error fetching subpages for top page {top_page_id}: {e}")
        return subpage_ids

    async def fetch_content(self):
        all_subpage_ids = []
        for top_page_id in self.top_page_ids:
            subpage_ids = self.get_subpages(top_page_id)
            all_subpage_ids.extend(subpage_ids)

        if not all_subpage_ids:
            return ""

        if len(all_subpage_ids) <= self.number_of_random_pages:
            selected_page_ids = all_subpage_ids
        else:
            selected_page_ids = random.sample(all_subpage_ids, self.number_of_random_pages)

        tasks = [self.fetch_page_content(page_id) for page_id in selected_page_ids]
        pages_content = await asyncio.gather(*tasks)
        content = "\n".join(pages_content)
        return content

class QuizGenerator:
    def __init__(self, notion_fetcher, number_of_questions, write_to_file=False):
        self.notion_fetcher = notion_fetcher
        self.number_of_questions = number_of_questions
        self.client = G4FClient()
        self.write_to_file = write_to_file
        self.prompt = None

    def create_prompt(self, text):
        err = 5
        self.prompt = f"""
        Generate a quiz in JSON format based on the following text. Include exactly {self.number_of_questions + err} questions. Each question should have a set of multiple-choice answers, with one correct answer. The JSON object should have a "quiz" key containing a list of question objects. Each question object should follow this structure:
        - "question": The question text.
        - "answers": A list of possible answers.
        - "correct_answer": The index of the correct answer from the list of possible answers.

        IMPORTANT: Return ONLY the JSON object. Do NOT include explanations, comments, or any other text before or after the JSON output.

        IMPORTANT: Use the entire provided text to generate a diverse set of questions. Ensure that the questions cover different types of knowledge, including definitions, concepts, applications, comparisons, and implications. The questions should vary in difficulty and should not focus solely on superficial details. Avoid questions that are too general or unrelated to the content.

        IMPORTANT: Do not ask anthing about modules!

        This quiz is for studying notion notes which are mainly about AI, ML, DL, NN.

        Everything in English.

        Text for the quiz:
        "{text}"

        Example output format:
        {{
            "quiz": [
                {{
                    "question": "What are the key components of [specific concept]?",
                    "answers": [
                        "Option 1",
                        "Option 2",
                        "Option 3",
                        "Option 4"
                    ],
                    "correct_answer": 0
                }},
                {{
                    "question": "How does [concept or technique] differ from [another concept]?",
                    "answers": [
                        "Option A",
                        "Option B",
                        "Option C",
                        "Option D"
                    ],
                    "correct_answer": 1
                }}
            ]
        }}

        Provide the output as a valid JSON string only, without any additional text.
        """

    async def fetch_quiz(self):
        while True:
            try:
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": self.prompt}]
                )
                
                response_content = response.choices[0].message.content
                if response_content.startswith('```json'):
                    response_content = response_content[7:].strip()
                if response_content.endswith('```'):
                    response_content = response_content[:-3].strip()

                response_json = json.loads(response_content)

                if "quiz" in response_json and isinstance(response_json["quiz"], list):
                    return response_json

            except json.JSONDecodeError:
                pass
            except Exception as e:
                print(f"An error occurred: {e}")
                pass

    async def generate_quiz(self):
        start_time = time.time()
        text = await self.notion_fetcher.fetch_content()
        self.create_prompt(text)
        quiz_data = await self.fetch_quiz()
        questions = quiz_data.get("quiz", [])
        limited_questions = questions[:self.number_of_questions]

        if self.write_to_file:
            with open('quiz_output.json', 'w') as file:
                json.dump({"quiz": limited_questions}, file, indent=2)

        end_time = time.time()
        elapsed_time = end_time - start_time
        print(f"Execution time: {elapsed_time:.2f} seconds")
        return limited_questions

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    try:
        print("Received request")
        data = request.json
        print(f"Request data: {data}")

        notion_token = data.get('notion_token')
        top_page_ids = data.get('top_page_ids')
        number_of_questions = data.get('number_of_questions')
        write_to_file = data.get('write_to_file', False)

        notion_fetcher = NotionDataFetcher(notion_token, top_page_ids)
        quiz_generator = QuizGenerator(notion_fetcher, number_of_questions, write_to_file)
        
        # Run async code using asyncio event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        questions = loop.run_until_complete(quiz_generator.generate_quiz())

        print(f"Generated quiz: {questions}")
        return jsonify({"quiz": questions})
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run()
