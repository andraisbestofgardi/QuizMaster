// Quiz Application
const app = {
    currentScreen: 'home',
    quizzes: [],
    currentQuiz: null,
    currentQuestionIndex: 0,
    score: 0,
    questionCount: 1,
    timer: null,
    timeLeft: 15,
    currentUser: null,

    init() {
        this.checkAuth();
        this.loadQuizzes();
        this.createParticles();
    },

    // ============================================
    // AUTHENTICATION
    // ============================================
    checkAuth() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.updateUserInfo();
            this.showHome();
        } else {
            this.showLogin();
        }
    },

    updateUserInfo() {
        if (this.currentUser) {
            document.getElementById('userName').textContent = this.currentUser.name;
            document.getElementById('userUsername').textContent = '@' + this.currentUser.username;
            
            // Update avatar
            const avatarIcon = document.getElementById('userAvatarIcon');
            const avatarImg = document.getElementById('userAvatarImg');
            
            if (this.currentUser.photo) {
                avatarImg.src = this.currentUser.photo;
                avatarImg.style.display = 'block';
                avatarIcon.style.display = 'none';
            } else {
                avatarImg.style.display = 'none';
                avatarIcon.style.display = 'block';
            }
        }
    },

    showLogin() {
        this.showScreen('loginScreen');
    },

    showSignup() {
        this.showScreen('signupScreen');
    },

    handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Find user
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            this.currentUser = {
                name: user.name,
                username: user.username,
                email: user.email,
                photo: user.photo || null
            };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.updateUserInfo();
            this.showNotification('✅ Login berhasil! Selamat datang ' + user.name, 'success');
            this.showHome();
            
            // Reset form
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
        } else {
            this.showNotification('❌ Username atau password salah!', 'error');
        }
    },

    handleSignup(event) {
        event.preventDefault();
        
        const name = document.getElementById('signupName').value.trim();
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        
        // Get photo
        const photoImg = document.getElementById('signupPhotoImg');
        const photo = photoImg.style.display === 'block' ? photoImg.src : null;

        // Validation
        if (password !== confirmPassword) {
            this.showNotification('❌ Password tidak cocok!', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('❌ Password minimal 6 karakter!', 'error');
            return;
        }

        // Check username format (only alphanumeric and underscore)
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            this.showNotification('❌ Username hanya boleh huruf, angka, dan underscore!', 'error');
            return;
        }

        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        // Check if username already exists
        if (users.some(u => u.username === username)) {
            this.showNotification('❌ Username @' + username + ' sudah digunakan!', 'error');
            return;
        }

        // Check if email already exists
        if (users.some(u => u.email === email)) {
            this.showNotification('❌ Email sudah terdaftar!', 'error');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name: name,
            username: username,
            email: email,
            password: password,
            photo: photo,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        this.showNotification('✅ Akun berhasil dibuat! Silakan login.', 'success');
        
        // Reset form
        document.getElementById('signupName').value = '';
        document.getElementById('signupUsername').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
        document.getElementById('signupConfirmPassword').value = '';
        this.removePhoto('signup');
        
        // Go to login
        setTimeout(() => {
            this.showLogin();
        }, 1500);
    },

    logout() {
        if (confirm('Apakah kamu yakin ingin keluar?')) {
            localStorage.removeItem('currentUser');
            this.currentUser = null;
            this.showNotification('👋 Berhasil logout!', 'success');
            setTimeout(() => {
                this.showLogin();
            }, 1000);
        }
    },

    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const button = input.nextElementSibling;
        
        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = '🙈';
        } else {
            input.type = 'password';
            button.textContent = '👁️';
        }
    },

    // ============================================
    // PROFILE PHOTO MANAGEMENT
    // ============================================
    handlePhotoSelect(event, context) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('❌ File harus berupa gambar!', 'error');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.showNotification('❌ Ukuran file maksimal 2MB!', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            if (context === 'signup') {
                document.getElementById('signupPhotoImg').src = imageData;
                document.getElementById('signupPhotoImg').style.display = 'block';
                document.getElementById('signupPhotoPreview').querySelector('.default-avatar').style.display = 'none';
                document.getElementById('signupRemovePhoto').style.display = 'flex';
            } else if (context === 'edit') {
                document.getElementById('editPhotoImg').src = imageData;
                document.getElementById('editPhotoImg').style.display = 'block';
                document.getElementById('editAvatarIcon').style.display = 'none';
                document.getElementById('editRemovePhoto').style.display = 'flex';
            }
        };
        reader.readAsDataURL(file);
    },

    removePhoto(context) {
        if (context === 'signup') {
            document.getElementById('signupPhoto').value = '';
            document.getElementById('signupPhotoImg').style.display = 'none';
            document.getElementById('signupPhotoPreview').querySelector('.default-avatar').style.display = 'block';
            document.getElementById('signupRemovePhoto').style.display = 'none';
        } else if (context === 'edit') {
            document.getElementById('editPhoto').value = '';
            document.getElementById('editPhotoImg').style.display = 'none';
            document.getElementById('editAvatarIcon').style.display = 'block';
            document.getElementById('editRemovePhoto').style.display = 'none';
        }
    },

    showEditProfile() {
        // Load current user data
        if (!this.currentUser) return;

        document.getElementById('editName').value = this.currentUser.name;
        
        // Load profile photo
        if (this.currentUser.photo) {
            document.getElementById('editPhotoImg').src = this.currentUser.photo;
            document.getElementById('editPhotoImg').style.display = 'block';
            document.getElementById('editAvatarIcon').style.display = 'none';
            document.getElementById('editRemovePhoto').style.display = 'flex';
        } else {
            document.getElementById('editPhotoImg').style.display = 'none';
            document.getElementById('editAvatarIcon').style.display = 'block';
            document.getElementById('editRemovePhoto').style.display = 'none';
        }

        document.getElementById('editProfileModal').classList.add('active');
    },

    closeEditProfile() {
        document.getElementById('editProfileModal').classList.remove('active');
        document.getElementById('editPhoto').value = '';
    },

    saveProfile() {
        const newName = document.getElementById('editName').value.trim();
        
        if (!newName) {
            this.showNotification('❌ Nama tidak boleh kosong!', 'error');
            return;
        }

        // Get photo
        const photoImg = document.getElementById('editPhotoImg');
        const photo = photoImg.style.display === 'block' ? photoImg.src : null;

        // Update current user
        this.currentUser.name = newName;
        this.currentUser.photo = photo;

        // Update in users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.username === this.currentUser.username);
        if (userIndex !== -1) {
            users[userIndex].name = newName;
            users[userIndex].photo = photo;
            localStorage.setItem('users', JSON.stringify(users));
        }

        // Update current user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        // Update UI
        this.updateUserInfo();
        this.closeEditProfile();
        this.showNotification('✅ Profil berhasil diperbarui!', 'success');
    },

    // Create animated particles background
    createParticles() {
        const container = document.getElementById('particles');
        const particleCount = 40;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 80 + 20;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (Math.random() * 20 + 15) + 's';
            
            // Random colors
            const colors = ['#FF6B9D', '#FFA07A', '#667EEA', '#C44569'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            container.appendChild(particle);
        }
    },

    // Navigation with animations
    showScreen(screenId) {
        const currentScreen = document.querySelector('.screen.active');
        
        if (currentScreen) {
            currentScreen.classList.remove('active');
        }
        
        setTimeout(() => {
            document.getElementById(screenId).classList.add('active');
        }, 100);
        
        this.currentScreen = screenId;
    },

    showHome() {
        if (!this.currentUser) {
            this.showLogin();
            return;
        }
        this.showScreen('homeScreen');
    },

    showCreateQuiz() {
        if (!this.currentUser) {
            this.showLogin();
            return;
        }
        this.questionCount = 1;
        this.resetCreateQuizForm();
        this.showScreen('createQuizScreen');
    },

    showJoinQuiz() {
        if (!this.currentUser) {
            this.showLogin();
            return;
        }
        this.loadPublicQuizzes();
        this.showScreen('joinQuizScreen');
    },

    showMyQuizzes() {
        if (!this.currentUser) {
            this.showLogin();
            return;
        }
        this.loadMyQuizzes();
        this.showScreen('myQuizzesScreen');
    },

    // Create Quiz Functions
    resetCreateQuizForm() {
        document.getElementById('quizTitle').value = '';
        document.getElementById('quizDescription').value = '';
        const container = document.getElementById('questionsContainer');
        container.innerHTML = this.createQuestionHTML(0);
    },

    createQuestionHTML(index) {
        return `
            <div class="question-card" data-index="${index}">
                <div class="question-header">
                    <h3>
                        <span class="question-number">${index + 1}</span>
                        Pertanyaan ${index + 1}
                    </h3>
                    <button class="delete-btn" onclick="app.deleteQuestion(${index})" style="display: ${index === 0 ? 'none' : 'block'};">
                        <span>🗑️</span>
                    </button>
                </div>
                <div class="form-group">
                    <input type="text" class="question-input input-animated" placeholder="Tulis pertanyaan di sini...">
                </div>
                <div class="answers-container">
                    <div class="answer-item">
                        <input type="radio" name="correct${index}" value="0" id="ans${index}_0" checked>
                        <label for="ans${index}_0" class="radio-label">A</label>
                        <input type="text" class="answer-input input-animated" placeholder="Jawaban A">
                        <span class="correct-badge">✓ Benar</span>
                    </div>
                    <div class="answer-item">
                        <input type="radio" name="correct${index}" value="1" id="ans${index}_1">
                        <label for="ans${index}_1" class="radio-label">B</label>
                        <input type="text" class="answer-input input-animated" placeholder="Jawaban B">
                        <span class="correct-badge">✓ Benar</span>
                    </div>
                    <div class="answer-item">
                        <input type="radio" name="correct${index}" value="2" id="ans${index}_2">
                        <label for="ans${index}_2" class="radio-label">C</label>
                        <input type="text" class="answer-input input-animated" placeholder="Jawaban C">
                        <span class="correct-badge">✓ Benar</span>
                    </div>
                    <div class="answer-item">
                        <input type="radio" name="correct${index}" value="3" id="ans${index}_3">
                        <label for="ans${index}_3" class="radio-label">D</label>
                        <input type="text" class="answer-input input-animated" placeholder="Jawaban D">
                        <span class="correct-badge">✓ Benar</span>
                    </div>
                </div>
            </div>
        `;
    },

    addQuestion() {
        const container = document.getElementById('questionsContainer');
        const questionCard = document.createElement('div');
        questionCard.innerHTML = this.createQuestionHTML(this.questionCount);
        container.appendChild(questionCard.firstElementChild);
        this.questionCount++;
        
        // Scroll to new question
        setTimeout(() => {
            questionCard.firstElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        this.updateDeleteButtons();
    },

    deleteQuestion(index) {
        const container = document.getElementById('questionsContainer');
        const cards = container.querySelectorAll('.question-card');
        
        if (cards.length > 1) {
            cards[index].style.animation = 'cardSlideOut 0.4s ease';
            
            setTimeout(() => {
                cards[index].remove();
                this.questionCount--;
                this.renumberQuestions();
                this.updateDeleteButtons();
            }, 400);
        }
    },

    renumberQuestions() {
        const container = document.getElementById('questionsContainer');
        const cards = container.querySelectorAll('.question-card');
        
        cards.forEach((card, i) => {
            card.setAttribute('data-index', i);
            card.querySelector('.question-number').textContent = i + 1;
            card.querySelector('h3').childNodes[2].textContent = ` Pertanyaan ${i + 1}`;
            
            const deleteBtn = card.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.setAttribute('onclick', `app.deleteQuestion(${i})`);
            }
            
            // Update radio buttons
            const radios = card.querySelectorAll('input[type="radio"]');
            radios.forEach((radio, j) => {
                radio.name = `correct${i}`;
                radio.id = `ans${i}_${j}`;
                const label = card.querySelectorAll('.radio-label')[j];
                if (label) {
                    label.setAttribute('for', `ans${i}_${j}`);
                }
            });
        });
    },

    updateDeleteButtons() {
        const container = document.getElementById('questionsContainer');
        const cards = container.querySelectorAll('.question-card');
        const deleteButtons = container.querySelectorAll('.delete-btn');
        
        deleteButtons.forEach((btn, i) => {
            btn.style.display = cards.length > 1 ? 'block' : 'none';
        });
    },

    saveQuiz() {
        const title = document.getElementById('quizTitle').value.trim();
        const description = document.getElementById('quizDescription').value.trim();
        
        if (!title) {
            this.showNotification('❌ Judul kuis tidak boleh kosong!', 'error');
            return;
        }

        const questionCards = document.querySelectorAll('.question-card');
        const questions = [];

        for (let i = 0; i < questionCards.length; i++) {
            const card = questionCards[i];
            const questionText = card.querySelector('.question-input').value.trim();
            const answerInputs = card.querySelectorAll('.answer-input');
            const correctRadio = card.querySelector('input[type="radio"]:checked');
            
            if (!questionText) {
                this.showNotification(`❌ Pertanyaan ${i + 1} tidak boleh kosong!`, 'error');
                return;
            }

            const answers = [];
            let hasEmptyAnswer = false;

            answerInputs.forEach(input => {
                const value = input.value.trim();
                if (!value) {
                    hasEmptyAnswer = true;
                }
                answers.push(value);
            });

            if (hasEmptyAnswer) {
                this.showNotification(`❌ Semua jawaban pada pertanyaan ${i + 1} harus diisi!`, 'error');
                return;
            }

            questions.push({
                question: questionText,
                answers: answers,
                correctAnswer: parseInt(correctRadio.value)
            });
        }

        const quiz = {
            id: Date.now().toString(),
            code: this.generateQuizCode(),
            title: title,
            description: description,
            questions: questions,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser.username,
            createdByName: this.currentUser.name
        };

        this.quizzes.push(quiz);
        this.saveQuizzes();
        this.showShareModal(quiz.code);
        this.showNotification('✅ Kuis berhasil dibuat!', 'success');
    },

    generateQuizCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const exists = this.quizzes.some(q => q.code === code);
        if (exists) {
            return this.generateQuizCode();
        }
        
        return code;
    },

    showShareModal(code) {
        document.getElementById('shareCode').textContent = code;
        document.getElementById('shareModal').classList.add('active');
    },

    closeShareModal() {
        document.getElementById('shareModal').classList.remove('active');
        this.showHome();
    },

    copyCode() {
        const code = document.getElementById('shareCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            this.showNotification('✅ Kode berhasil disalin!', 'success');
        }).catch(() => {
            this.showNotification('❌ Gagal menyalin kode', 'error');
        });
    },

    // Notification system
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#FF6B6B' : type === 'success' ? '#6BCF7F' : '#667EEA'};
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            font-weight: 700;
            z-index: 10000;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.4s ease, slideOutRight 0.4s ease 2.6s;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    // Load and Save Quizzes
    loadQuizzes() {
        const saved = localStorage.getItem('quizzes');
        if (saved) {
            this.quizzes = JSON.parse(saved);
        } else {
            // Sample quiz
            this.quizzes = [
                {
                    id: 'sample1',
                    code: 'DEMO01',
                    title: 'Pengetahuan Umum Indonesia',
                    description: 'Tes pengetahuanmu tentang Indonesia!',
                    createdBy: 'quizmaster',
                    createdByName: 'Quiz Master',
                    questions: [
                        {
                            question: 'Siapa proklamator kemerdekaan Indonesia?',
                            answers: ['Soekarno & Hatta', 'Soeharto', 'Habibie', 'Megawati'],
                            correctAnswer: 0
                        },
                        {
                            question: 'Ibukota Indonesia adalah?',
                            answers: ['Bandung', 'Surabaya', 'Jakarta', 'Medan'],
                            correctAnswer: 2
                        },
                        {
                            question: 'Berapa jumlah provinsi di Indonesia saat ini?',
                            answers: ['34', '35', '37', '38'],
                            correctAnswer: 3
                        },
                        {
                            question: 'Pulau terbesar di Indonesia adalah?',
                            answers: ['Jawa', 'Sumatra', 'Kalimantan', 'Papua'],
                            correctAnswer: 2
                        },
                        {
                            question: 'Lagu kebangsaan Indonesia adalah?',
                            answers: ['Garuda Pancasila', 'Indonesia Raya', 'Maju Tak Gentar', 'Berkibarlah Benderaku'],
                            correctAnswer: 1
                        }
                    ],
                    createdAt: new Date().toISOString()
                }
            ];
            this.saveQuizzes();
        }
    },

    saveQuizzes() {
        localStorage.setItem('quizzes', JSON.stringify(this.quizzes));
    },

    loadPublicQuizzes() {
        const container = document.getElementById('publicQuizzesList');
        
        if (this.quizzes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>Belum ada kuis tersedia. Buat kuis pertamamu!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        this.quizzes.forEach((quiz, index) => {
            const item = document.createElement('div');
            item.className = 'quiz-item';
            item.style.animationDelay = `${index * 0.1}s`;
            item.innerHTML = `
                <div class="quiz-item-header">
                    <div>
                        <div class="quiz-item-title">${quiz.title}</div>
                        <div class="quiz-item-description">${quiz.description}</div>
                    </div>
                    <div class="quiz-item-code">${quiz.code}</div>
                </div>
                <div class="quiz-item-info">
                    <span>📝 ${quiz.questions.length} pertanyaan</span>
                    ${quiz.createdBy ? `<span>👤 @${quiz.createdBy}</span>` : ''}
                </div>
            `;
            item.onclick = () => this.startQuiz(quiz);
            container.appendChild(item);
        });
    },

    loadMyQuizzes() {
        const container = document.getElementById('myQuizzesList');
        
        if (this.quizzes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <p>Kamu belum membuat kuis. Yuk buat kuis pertamamu!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        this.quizzes.forEach((quiz, index) => {
            const item = document.createElement('div');
            item.className = 'quiz-item';
            item.style.animationDelay = `${index * 0.1}s`;
            item.innerHTML = `
                <div class="quiz-item-header">
                    <div>
                        <div class="quiz-item-title">${quiz.title}</div>
                        <div class="quiz-item-description">${quiz.description}</div>
                    </div>
                    <div class="quiz-item-code">${quiz.code}</div>
                </div>
                <div class="quiz-item-info">
                    <span>📝 ${quiz.questions.length} pertanyaan</span>
                    <span>📅 ${new Date(quiz.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <div class="quiz-item-buttons">
                    <button class="play-btn" onclick="event.stopPropagation(); app.startQuiz(app.quizzes.find(q => q.id === '${quiz.id}'))">
                        🎮 Main
                    </button>
                    <button class="share-btn" onclick="event.stopPropagation(); app.shareQuiz('${quiz.code}')">
                        📤 Bagikan
                    </button>
                    <button class="delete-quiz-btn" onclick="event.stopPropagation(); app.deleteQuiz('${quiz.id}')">
                        🗑️ Hapus
                    </button>
                </div>
            `;
            container.appendChild(item);
        });
    },

    loadQuizByCode() {
        const code = document.getElementById('quizCode').value.trim().toUpperCase();
        
        if (!code) {
            this.showNotification('❌ Masukkan kode kuis!', 'error');
            return;
        }

        const quiz = this.quizzes.find(q => q.code === code);
        
        if (!quiz) {
            this.showNotification('❌ Kode kuis tidak ditemukan!', 'error');
            return;
        }

        this.startQuiz(quiz);
    },

    shareQuiz(code) {
        const quiz = this.quizzes.find(q => q.code === code);
        if (quiz) {
            this.showShareModal(code);
        }
    },

    deleteQuiz(id) {
        if (confirm('Apakah kamu yakin ingin menghapus kuis ini?')) {
            this.quizzes = this.quizzes.filter(q => q.id !== id);
            this.saveQuizzes();
            this.loadMyQuizzes();
            this.showNotification('✅ Kuis berhasil dihapus!', 'success');
        }
    },

    // Play Quiz Functions
    startQuiz(quiz) {
        this.currentQuiz = quiz;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.showScreen('playQuizScreen');
        this.loadQuestion();
    },

    loadQuestion() {
        if (this.currentQuestionIndex >= this.currentQuiz.questions.length) {
            this.showResults();
            return;
        }

        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        
        document.getElementById('currentQuestion').textContent = this.currentQuestionIndex + 1;
        document.getElementById('totalQuestions').textContent = this.currentQuiz.questions.length;
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('questionText').textContent = question.question;

        const answersContainer = document.getElementById('answersContainer');
        answersContainer.innerHTML = '';

        question.answers.forEach((answer, index) => {
            const answerBtn = document.createElement('div');
            answerBtn.className = 'answer-option';
            answerBtn.textContent = answer;
            answerBtn.onclick = () => this.checkAnswer(index);
            answersContainer.appendChild(answerBtn);
        });

        this.startTimer();
    },

    startTimer() {
        this.timeLeft = 15;
        this.updateTimerBar();
        
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerBar();
            document.getElementById('timerText').textContent = this.timeLeft + 's';

            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.checkAnswer(-1);
            }
        }, 1000);
    },

    updateTimerBar() {
        const percentage = (this.timeLeft / 15) * 100;
        document.getElementById('timerBar').style.width = percentage + '%';
    },

    checkAnswer(selectedIndex) {
        if (this.timer) {
            clearInterval(this.timer);
        }

        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const answerOptions = document.querySelectorAll('.answer-option');
        
        answerOptions.forEach(option => {
            option.style.pointerEvents = 'none';
        });

        if (selectedIndex === question.correctAnswer) {
            answerOptions[selectedIndex].classList.add('correct');
            this.score++;
            document.getElementById('currentScore').textContent = this.score;
            this.showNotification('✅ Benar!', 'success');
        } else {
            if (selectedIndex !== -1) {
                answerOptions[selectedIndex].classList.add('wrong');
                this.showNotification('❌ Salah!', 'error');
            } else {
                this.showNotification('⏰ Waktu habis!', 'error');
            }
            answerOptions[question.correctAnswer].classList.add('correct');
        }

        setTimeout(() => {
            this.currentQuestionIndex++;
            this.loadQuestion();
        }, 2000);
    },

    showResults() {
        this.showScreen('resultsScreen');
        
        const maxScore = this.currentQuiz.questions.length;
        const percentage = Math.round((this.score / maxScore) * 100);
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('maxScore').textContent = maxScore;
        document.getElementById('resultsPercentage').textContent = percentage + '%';

        let icon = '🏆';
        let message = '';

        if (percentage === 100) {
            icon = '🏆';
            message = 'Sempurna! Kamu luar biasa!';
            this.createConfetti();
        } else if (percentage >= 80) {
            icon = '🌟';
            message = 'Hebat! Kamu sangat pintar!';
            this.createConfetti();
        } else if (percentage >= 60) {
            icon = '👍';
            message = 'Bagus! Terus tingkatkan!';
        } else if (percentage >= 40) {
            icon = '📚';
            message = 'Lumayan! Belajar lagi ya!';
        } else {
            icon = '💪';
            message = 'Jangan menyerah! Coba lagi!';
        }

        document.getElementById('resultsIcon').textContent = icon;
        document.getElementById('resultsMessage').textContent = message;
    },

    createConfetti() {
        const confettiContainer = document.getElementById('confetti');
        confettiContainer.innerHTML = '';
        
        const colors = ['#FF6B9D', '#FFA07A', '#6BCF7F', '#FFD93D', '#667EEA'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confettiContainer.appendChild(confetti);
        }
    },

    restartQuiz() {
        if (this.currentQuiz) {
            this.startQuiz(this.currentQuiz);
        }
    }
};

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes cardSlideOut {
        from {
            opacity: 1;
            transform: translateX(0) scale(1);
        }
        to {
            opacity: 0;
            transform: translateX(-100px) scale(0.8);
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
