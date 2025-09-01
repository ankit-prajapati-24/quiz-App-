 // --- API Endpoints ---
        // TODO: Replace these with your actual backend URLs
        // const BASE_API_URL = 'http://localhost:4000/api/v1/quiz';
        // https://ai-agent-steel-ten.vercel.app/api/v1/quiz
        const BASE_API_URL = 'https://ai-agent-steel-ten.vercel.app/api/v1/quiz';
        const QUESTIONS_API_URL = `${BASE_API_URL}/questions/all`;
        const LEADERBOARD_API_URL = `${BASE_API_URL}/getAllScores`;
        const SAVE_SCORE_API_URL = `${BASE_API_URL}/saveScores`;

        // --- DOM Elements ---
        const landingPage = document.getElementById('landing-page');
        const leaderboardLoader = document.getElementById('leaderboard-loader');
        const userInfoFormContainer = document.getElementById('user-info-form-container');
        const quizPage = document.getElementById('quiz-page');
        const resultPage = document.getElementById('result-page');
        const startQuizBtn = document.getElementById('start-quiz-btn');
        const userInfoForm = document.getElementById('user-info-form');
        const nameInput = document.getElementById('name');
        const leaderboardTableBody = document.getElementById('leaderboard-table-body');
        const questionText = document.getElementById('question-text');
        const optionsContainer = document.getElementById('options-container');
        const questionCountSpan = document.getElementById('question-count');
        const totalQuestionsSpan = document.getElementById('total-questions');
        const finalScoreSpan = document.getElementById('final-score');
        const saveStatus = document.getElementById('save-status');
        const backToLeaderboardBtn = document.getElementById('back-to-leaderboard-btn');
        const messageModal = document.getElementById('message-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalText = document.getElementById('modal-text');
        const modalCloseBtn = document.getElementById('modal-close-btn');
        const nextBtn = document.getElementById('next-btn');

        // --- Global State ---
        let questions = [];
        let userAnswers = [];
        let currentQuestionIndex = 0;
        let currentUser = {};

        // --- API Calls ---
        async function fetchQuestions() {
            try {
                const response = await fetch(QUESTIONS_API_URL);
                if (!response.ok) {
                    throw new Error('Failed to fetch questions. Check your backend server.');
                }
                questions = await response.json();
                totalQuestionsSpan.textContent = questions.length;
            } catch (error) {
                console.error('Error fetching questions:', error);
                showModal('Error', 'Could not load quiz questions. Please try again later.');
            }
        }

        async function fetchLeaderboard() {
            leaderboardLoader.classList.remove('hidden');
            try {
                const response = await fetch(LEADERBOARD_API_URL);
                if (!response.ok) {
                    throw new Error('Failed to fetch leaderboard. Check your backend server.');
                }
                const leaderboard = await response.json();
                renderLeaderboardTable(leaderboard);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
                // Optionally show a message to the user
            } finally {
                leaderboardLoader.classList.add('hidden');
            }
        }

        async function saveScore(name, score) {
            try {
                const response = await fetch(SAVE_SCORE_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, score }),
                });

                if (!response.ok) {
                    throw new Error('Failed to save score. Check your backend server.');
                }
                saveStatus.textContent = "Score saved successfully!";
            } catch (error) {
                console.error('Error saving score:', error);
                saveStatus.textContent = "Error saving score. Please try again.";
            } finally {
                backToLeaderboardBtn.classList.remove('hidden');
            }
        }

        // --- UI Functions ---
        function showPage(pageId) {
            landingPage.classList.add('hidden');
            userInfoFormContainer.classList.add('hidden');
            quizPage.classList.add('hidden');
            resultPage.classList.add('hidden');
            document.getElementById(pageId).classList.remove('hidden');
        }

        function showModal(title, text) {
            modalTitle.textContent = title;
            modalText.textContent = text;
            messageModal.classList.remove('hidden');
        }

        function renderLeaderboardTable(leaderboard) {
            const sortedLeaderboard = leaderboard.sort((a, b) => b.score - a.score)
            leaderboardTableBody.innerHTML = '';
            if (sortedLeaderboard.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="3" class="text-center py-4 text-gray-500">No scores yet. Be the first to play!</td>`;
                leaderboardTableBody.appendChild(row);
                return;
            }
            sortedLeaderboard.forEach((entry, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${entry.name}</td>
                    <td>${entry.score}</td>
                `;
                leaderboardTableBody.appendChild(row);
            });
        }

        // --- Quiz Flow Functions ---
        function startQuiz() {
            currentQuestionIndex = 0;
            userAnswers = [];
            showPage('quiz-page');
            renderQuestion();
        }

        function renderQuestion() {
            nextBtn.classList.add('hidden');

            if (currentQuestionIndex >= questions.length) {
                finishQuiz();
                return;
            }

            const question = questions[currentQuestionIndex];
            questionCountSpan.textContent = currentQuestionIndex + 1;
            questionText.textContent = question.question;
            optionsContainer.innerHTML = '';

            question.options.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option;
                button.classList.add('question-option');
                button.dataset.answer = option;
                optionsContainer.appendChild(button);
            });

            if (currentQuestionIndex === questions.length - 1) {
                nextBtn.textContent = "Submit";
            } else {
                nextBtn.textContent = "Next";
            }
        }

        function handleAnswerClick(event) {
            const selectedOption = event.target;
            if (!selectedOption.dataset.answer) return;

            document.querySelectorAll('.question-option').forEach(btn => {
                btn.classList.remove('selected');
            });

            selectedOption.classList.add('selected');

            userAnswers[currentQuestionIndex] = selectedOption.dataset.answer;

            nextBtn.classList.remove('hidden');
        }

        function finishQuiz() {
            let score = 0;
            for (let i = 0; i < questions.length; i++) {
                if (userAnswers[i] === questions[i].answer) {
                    score++;
                }
            }

            showPage('result-page');
            finalScoreSpan.textContent = score;
            saveScore(currentUser.name, score);
        }

        // --- Event Listeners ---
        function setupEventListeners() {
            startQuizBtn.addEventListener('click', () => {
                if (questions.length === 0) {
                    showModal('No Questions', 'Please add questions to the database first.');
                } else {
                    showPage('user-info-form-container');
                }
            });

            userInfoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                currentUser.name = nameInput.value;
                startQuiz();
            });

            optionsContainer.addEventListener('click', handleAnswerClick);

            backToLeaderboardBtn.addEventListener('click', () => {
                showPage('landing-page');
                fetchLeaderboard(); // Refresh leaderboard on return
            });

            modalCloseBtn.addEventListener('click', () => messageModal.classList.add('hidden'));

            nextBtn.addEventListener('click', () => {
                const currentQuestion = questions[currentQuestionIndex];

                // document.querySelectorAll('.question-option').forEach(btn => {
                //     btn.disabled = true;
                //     if (btn.dataset.answer === currentQuestion.answer) {
                //         btn.classList.add('correct');
                //     } else if (btn.classList.contains('selected')) {
                //         btn.classList.add('wrong');
                //     }
                // });

                setTimeout(() => {
                    if (nextBtn.textContent === "Submit") {
                        finishQuiz();
                    } else {
                        currentQuestionIndex++;
                        renderQuestion();
                    }
                }, 1000);
            });
        }

        // --- Initialization ---
        document.addEventListener('DOMContentLoaded', async () => {
            await fetchQuestions();
            await fetchLeaderboard();
            setupEventListeners();
        });




        
// Disable certain key combinations
document.addEventListener("keydown", function (e) {
    // F12
    if (e.key === "F12") {
        e.preventDefault();
    }

    // Ctrl+Shift+I / J / C
    if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) {
        e.preventDefault();
    }

    // Ctrl+U
    if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
    }

    // Ctrl+S (Prevent Save Page)
    if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
    }
});

// Disable right click
document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
});
