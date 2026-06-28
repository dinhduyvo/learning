// English B2 Work Booster - Core JS Logic

// 50 High-quality Professional Business and Tech B1->B2 Vocabulary terms
        let defaultVocabulary = [];

        // State storage
        let vocabularies = [];
        let filteredVocab = [];
        let currentCardIndex = 0;
        let isFlipped = false;
        let currentCategory = 'all';
        let currentViewMode = 'flashcard'; // 'flashcard' or 'quiz'
        let isAutoSpeakEnabled = false;

        // Quiz specific state
        let currentQuizIndex = 0;
        let quizQuestions = [];
        let scoreCorrect = 0;
        let scoreIncorrect = 0;
        let hasAnsweredCurrentQuiz = false;

        // Initialize App on Window Load
        window.onload = async function() {
            await initDatabase();
            initAutoSpeak();
            applyCategoryFilter();
            renderStats();
            setupKeyboardShortcuts();
            setupTouchGestures();
        };

        // Load data from localStorage or fallback to default JSON file fetch
        async function initDatabase() {
            // Always fetch default vocabulary to use as pool/fallback
            try {
                const response = await fetch('vocabulary.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                defaultVocabulary = await response.json();
            } catch (error) {
                console.error('Error fetching vocabulary.json:', error);
                showToast("Lỗi tải dữ liệu! Vui lòng chạy ứng dụng qua Local Server (Live Server) hoặc deploy lên GitHub Pages.", 5000);
            }

            const storedVocab = localStorage.getItem('b2_booster_vocab_v2');
            if (storedVocab) {
                const parsedVocab = JSON.parse(storedVocab);
                // Merge new default items from JSON database that don't exist in localStorage
                const storedIds = new Set(parsedVocab.map(item => item.id));
                const newItems = defaultVocabulary.filter(item => !storedIds.has(item.id)).map(item => ({
                    ...item,
                    status: 'new'
                }));
                
                if (newItems.length > 0) {
                    vocabularies = [...parsedVocab, ...newItems];
                    saveToLocalStorage();
                } else {
                    vocabularies = parsedVocab;
                }
            } else if (defaultVocabulary.length > 0) {
                vocabularies = defaultVocabulary.map(item => ({
                    ...item,
                    status: 'new' // 'new', 'review', 'mastered'
                }));
                saveToLocalStorage();
            } else {
                vocabularies = [];
            }
        }

        function saveToLocalStorage() {
            localStorage.setItem('b2_booster_vocab_v2', JSON.stringify(vocabularies));
        }

        // Set visual filter & trigger rerender
        function setCategory(category) {
            currentCategory = category;
            
            // Adjust styling of vertical menu items
            const tabs = ['all', 'management', 'tech', 'greeting', 'meeting', 'custom'];
            tabs.forEach(t => {
                const btn = document.getElementById(`tab-${t}`);
                if (t === category) {
                    btn.classList.add('bg-indigo-600', 'text-white');
                    btn.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-800/50');
                } else {
                    btn.classList.remove('bg-indigo-600', 'text-white');
                    btn.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800/50');
                }
            });

            currentCardIndex = 0;
            applyCategoryFilter();
            
            if (currentViewMode === 'quiz') {
                startQuizMode();
            }
            
            closeMobileDrawer();
        }

        function setViewMode(mode) {
            currentViewMode = mode;
            const cardBtn = document.getElementById('mode-flashcard');
            const quizBtn = document.getElementById('mode-quiz');
            const flashSection = document.getElementById('flashcard-section');
            const quizSection = document.getElementById('quiz-section');

            if (mode === 'flashcard') {
                // Active flashcard button
                cardBtn.classList.add('bg-indigo-500', 'text-white');
                cardBtn.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-800/30');
                // Inactive quiz button
                quizBtn.classList.remove('bg-indigo-500', 'text-white');
                quizBtn.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800/30');

                flashSection.classList.remove('hidden');
                quizSection.classList.add('hidden');
                renderCurrentCard();
            } else {
                // Active quiz button
                quizBtn.classList.add('bg-indigo-500', 'text-white');
                quizBtn.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-800/30');
                // Inactive flashcard button
                cardBtn.classList.remove('bg-indigo-500', 'text-white');
                cardBtn.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800/30');

                flashSection.classList.add('hidden');
                quizSection.classList.remove('hidden');
                startQuizMode();
            }
            
            closeMobileDrawer();
        }

        function applyCategoryFilter() {
            if (currentCategory === 'all') {
                filteredVocab = vocabularies;
            } else if (currentCategory === 'custom') {
                filteredVocab = vocabularies.filter(item => item.id.startsWith('custom-'));
            } else {
                filteredVocab = vocabularies.filter(item => item.category === currentCategory);
            }

            // Update custom badge count
            const customCount = vocabularies.filter(item => item.id.startsWith('custom-')).length;
            const badge = document.getElementById('custom-badge');
            if (customCount > 0) {
                badge.textContent = customCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }

            // Fallback for empty filter
            if (filteredVocab.length === 0) {
                currentCardIndex = 0;
            }

            renderCurrentCard();
            updateCardCounter();
        }

        function renderCurrentCard() {
            const cardEl = document.getElementById('flashcard');
            // reset flip state
            isFlipped = false;
            cardEl.style.transform = "none";

            const frontTerm = document.getElementById('card-front-term');
            const frontIpa = document.getElementById('card-front-ipa');
            const frontTag = document.getElementById('card-front-tag');

            const backDef = document.getElementById('card-back-definition');
            const backContext = document.getElementById('card-back-context');
            const backExEn = document.getElementById('card-back-example-en');
            const backExVi = document.getElementById('card-back-example-vi');

            if (filteredVocab.length === 0) {
                // Empty state card
                frontTerm.textContent = "Chưa có từ vựng";
                frontIpa.textContent = "Vui lòng chọn danh mục khác hoặc tự thêm từ mới.";
                frontTag.textContent = "DANH SÁCH TRỐNG";
                
                backDef.textContent = "Không có dữ liệu";
                backContext.textContent = "";
                backExEn.textContent = "Nhấn nút 'Thêm từ mới' ở thanh tiêu đề để bắt đầu.";
                backExVi.textContent = "";
                return;
            }

            const activeWord = filteredVocab[currentCardIndex];

            // Render Front Side
            frontTerm.textContent = activeWord.term;
            frontIpa.textContent = activeWord.ipa || "";
            
            let categoryLabel = 'DANH MỤC KHÁC';
            if (activeWord.category === 'management') categoryLabel = 'QUẢN LÝ DỰ ÁN (B2)';
            else if (activeWord.category === 'tech') categoryLabel = 'CÔNG NGHỆ & SẢN PHẨM (B2)';
            else if (activeWord.category === 'greeting') categoryLabel = 'CHÀO HỎI & GIAO TIẾP (B2)';
            else if (activeWord.category === 'meeting') categoryLabel = 'HỌP HÀNH & THẢO LUẬN (B2)';
            
            frontTag.textContent = categoryLabel;
            
            // Adjust size dynamically if term is long
            if (activeWord.term.length > 20) {
                frontTerm.classList.remove('text-3xl', 'sm:text-4xl');
                frontTerm.classList.add('text-2xl', 'sm:text-3xl');
            } else {
                frontTerm.classList.remove('text-2xl', 'sm:text-3xl');
                frontTerm.classList.add('text-3xl', 'sm:text-4xl');
            }

            // Render Back Side
            backDef.textContent = activeWord.definition;
            backContext.textContent = activeWord.context || "";
            backExEn.textContent = `"${activeWord.example_en}"`;
            backExVi.textContent = `(${activeWord.example_vi})`;

            if (isAutoSpeakEnabled && filteredVocab.length > 0) {
                window.speechSynthesis.cancel();
                speakCurrentWord();
            }
        }

        function flipCard() {
            if (filteredVocab.length === 0) return;
            const cardEl = document.getElementById('flashcard');
            isFlipped = !isFlipped;
            if (isFlipped) {
                cardEl.style.transform = "rotateY(180deg)";
            } else {
                cardEl.style.transform = "rotateY(0deg)";
            }
        }

        function prevCard() {
            if (filteredVocab.length <= 1) return;
            animateCardTransition('prev');
        }

        function nextCard() {
            if (filteredVocab.length <= 1) return;
            animateCardTransition('next');
        }

        function animateCardTransition(direction) {
            const cardEl = document.getElementById('flashcard');
            if (!cardEl) return;

            // 1. Add fade-out and slide-out styles
            cardEl.style.transition = 'transform 0.15s ease-in, opacity 0.15s ease-in';
            cardEl.style.opacity = '0';
            
            if (direction === 'next') {
                cardEl.style.transform = isFlipped ? 'rotateY(180deg) translateX(-80px) scale(0.95)' : 'translateX(-80px) scale(0.95)';
            } else {
                cardEl.style.transform = isFlipped ? 'rotateY(180deg) translateX(80px) scale(0.95)' : 'translateX(80px) scale(0.95)';
            }

            // 2. After slide-out, change data and prepare slide-in
            setTimeout(() => {
                // Apply data change
                if (direction === 'next') {
                    currentCardIndex = (currentCardIndex + 1) % filteredVocab.length;
                } else {
                    currentCardIndex = (currentCardIndex - 1 + filteredVocab.length) % filteredVocab.length;
                }
                
                isFlipped = false; // Reset flip state so it starts face-up
                renderCurrentCard();
                updateCardCounter();

                // Instantly place it at the opposite slide-in position
                cardEl.style.transition = 'none';
                cardEl.style.opacity = '0';
                if (direction === 'next') {
                    cardEl.style.transform = 'translateX(80px) scale(0.95)';
                } else {
                    cardEl.style.transform = 'translateX(-80px) scale(0.95)';
                }

                // Force layout reflow
                cardEl.offsetHeight;

                // 3. Smooth slide-in to center
                cardEl.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out';
                cardEl.style.opacity = '1';
                cardEl.style.transform = 'none';
            }, 150);
        }

        function updateCardCounter() {
            const indexLabel = document.getElementById('current-card-index');
            const countLabel = document.getElementById('total-cards-count');
            
            if (filteredVocab.length === 0) {
                indexLabel.textContent = "Thẻ 0";
                countLabel.textContent = "0";
            } else {
                indexLabel.textContent = `Thẻ ${currentCardIndex + 1}`;
                countLabel.textContent = filteredVocab.length;
            }
        }

        // Web Speech synthesis for pronunciation
        function speakCurrentWord(event) {
            if (event) event.stopPropagation(); // Avoid flipping the card when clicking the audio icon
            const currentItem = filteredVocab[currentCardIndex];
            if (!currentItem) return;

            const utterance = new SpeechSynthesisUtterance(currentItem.term);
            utterance.lang = 'en-US';
            utterance.rate = 0.85; // slightly slower for learning clarity
            window.speechSynthesis.speak(utterance);
        }

        function speakCurrentExample(event) {
            if (event) event.stopPropagation();
            const currentItem = filteredVocab[currentCardIndex];
            if (!currentItem) return;

            const utterance = new SpeechSynthesisUtterance(currentItem.example_en);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }

        // Status tracking & persistence
        function markCardStatus(status) {
            if (filteredVocab.length === 0) return;
            const currentItem = filteredVocab[currentCardIndex];
            
            // Find in master list & update status
            const foundIndex = vocabularies.findIndex(item => item.id === currentItem.id);
            if (foundIndex !== -1) {
                vocabularies[foundIndex].status = status;
                saveToLocalStorage();
                renderStats();
                showToast(status === 'mastered' ? 'Đã lưu: Thành thạo 🎉' : 'Đã lưu: Cần ôn tập ⏳');
                
                // Automatically progress to next card after a small delay
                setTimeout(() => {
                    nextCard();
                }, 400);
            }
        }

        function renderStats() {
            const total = vocabularies.length;
            const mastered = vocabularies.filter(item => item.status === 'mastered').length;
            const review = vocabularies.filter(item => item.status === 'review').length;

            document.getElementById('mastered-count').textContent = mastered;
            document.getElementById('review-count').textContent = review;

            const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;
            document.getElementById('overall-progress-bar').style.width = `${percentage}%`;
            document.getElementById('progress-percentage').textContent = `Hoàn thành: ${percentage}%`;
            document.getElementById('progress-numeric').textContent = `${mastered} / ${total} từ`;
        }

        function setupKeyboardShortcuts() {
            document.addEventListener('keydown', function(event) {
                if (currentViewMode !== 'flashcard') return; // Only active in flashcard mode
                
                // Exclude shortcut triggers inside input/textarea fields
                if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
                    return;
                }

                if (event.code === 'Space') {
                    event.preventDefault(); // prevent scrolling page down
                    flipCard();
                } else if (event.code === 'ArrowRight') {
                    nextCard();
                } else if (event.code === 'ArrowLeft') {
                    prevCard();
                }
            });
        }

        // Custom word modal control
        function openCustomWordModal() {
            const modal = document.getElementById('custom-word-modal');
            const container = document.getElementById('modal-container');
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                container.classList.remove('scale-95');
            }, 10);
        }

        function closeCustomWordModal() {
            const modal = document.getElementById('custom-word-modal');
            const container = document.getElementById('modal-container');
            modal.classList.add('opacity-0');
            container.classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
            document.getElementById('custom-word-form').reset();
        }

        function handleFormSubmit(event) {
            event.preventDefault();

            const term = document.getElementById('form-term').value.trim();
            const ipa = document.getElementById('form-ipa').value.trim();
            const category = document.getElementById('form-category').value;
            const definition = document.getElementById('form-definition').value.trim();
            const example_en = document.getElementById('form-example-en').value.trim();
            const example_vi = document.getElementById('form-example-vi').value.trim();

            const newWord = {
                id: `custom-${Date.now()}`,
                term,
                ipa,
                category,
                definition,
                context: "Tự định nghĩa theo môi trường công sở cá nhân.",
                example_en,
                example_vi,
                status: 'new'
            };

            vocabularies.push(newWord);
            saveToLocalStorage();
            renderStats();
            applyCategoryFilter();
            closeCustomWordModal();
            showToast("Đã lưu thẻ tự thiết kế thành công!");
        }

        // Quiz System Integration
        function startQuizMode() {
            scoreCorrect = 0;
            scoreIncorrect = 0;
            currentQuizIndex = 0;
            updateQuizScore();

            if (filteredVocab.length < 4) {
                // Must have at least 4 items for options
                document.getElementById('quiz-options-container').innerHTML = `
                    <div class="text-center py-6 text-slate-400">
                        <p class="font-medium">Chưa đủ dữ liệu làm bài!</p>
                        <p class="text-xs mt-1">Cần tối thiểu ít nhất 4 từ trong danh mục này để tạo đề kiểm tra.</p>
                    </div>
                `;
                document.getElementById('quiz-question-title').textContent = "Không thể tạo câu hỏi";
                document.getElementById('quiz-next-btn').classList.add('hidden');
                document.getElementById('quiz-question-index').textContent = "LỖI";
                return;
            }

            // Shuffle cards subset to generate random question queue (5 Questions round)
            quizQuestions = [...filteredVocab].sort(() => 0.5 - Math.random()).slice(0, 5); 
            generateQuizQuestion();
        }

        function generateQuizQuestion() {
            hasAnsweredCurrentQuiz = false;
            document.getElementById('quiz-feedback').innerHTML = "";
            document.getElementById('quiz-next-btn').classList.add('hidden');

            const currentQuestion = quizQuestions[currentQuizIndex];
            document.getElementById('quiz-question-index').textContent = `CÂU HỎI ${currentQuizIndex + 1}/${quizQuestions.length}`;
            
            // Randomly decide format: 1 (Provide Vn definition -> Choose En term) or 2 (Provide En Example with blank -> Choose En term)
            const isDefinitionPrompt = Math.random() > 0.4;
            
            if (isDefinitionPrompt) {
                document.getElementById('quiz-prompt-helper').textContent = "Chọn cụm từ tiếng Anh thích hợp cho nghĩa:";
                document.getElementById('quiz-question-title').textContent = `"${currentQuestion.definition}"`;
            } else {
                document.getElementById('quiz-prompt-helper').textContent = "Chọn cụm từ thích hợp nhất để điền vào chỗ trống:";
                // Replace term with blanks, case insensitive
                const escapedTerm = currentQuestion.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const blankedSentence = currentQuestion.example_en.replace(new RegExp(escapedTerm, 'gi'), "________");
                document.getElementById('quiz-question-title').textContent = `"${blankedSentence}"`;
            }

            // Prepare incorrect options from the same category
            let pool = vocabularies.filter(item => item.id !== currentQuestion.id);
            if (pool.length < 3) {
                pool = defaultVocabulary.filter(item => item.term !== currentQuestion.term);
            }
            const incorrectOptions = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
            
            // Mix options together
            const allOptions = [currentQuestion, ...incorrectOptions].sort(() => 0.5 - Math.random());

            // Render options
            const optionsContainer = document.getElementById('quiz-options-container');
            optionsContainer.innerHTML = "";

            allOptions.forEach((option, idx) => {
                const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
                const button = document.createElement('button');
                button.className = "w-full text-left p-4 rounded-xl bg-slate-800 hover:bg-slate-755 border border-slate-700/60 transition-all duration-150 text-slate-200 hover:text-white text-sm font-medium flex items-center justify-between";
                button.innerHTML = `
                    <span><b>${optionLabel}.</b> ${option.term}</span>
                    <div class="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-xs"></div>
                `;
                button.onclick = () => selectQuizOption(button, option.id === currentQuestion.id, currentQuestion.term);
                optionsContainer.appendChild(button);
            });
        }

        function selectQuizOption(selectedButton, isCorrect, correctTerm) {
            if (hasAnsweredCurrentQuiz) return;
            hasAnsweredCurrentQuiz = true;

            const optionsContainer = document.getElementById('quiz-options-container');
            const buttons = optionsContainer.getElementsByTagName('button');

            // Apply visual feedback colors
            for (let btn of buttons) {
                btn.disabled = true; // prevent multi clicks
                
                // Extract if it's correct
                const text = btn.innerText;
                const matchesCorrect = text.includes(correctTerm);

                if (matchesCorrect) {
                    btn.className = "w-full text-left p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-sm font-medium flex items-center justify-between";
                    btn.querySelector('div').className = "w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center text-xs font-bold";
                    btn.querySelector('div').innerHTML = "✓";
                } else if (btn === selectedButton && !isCorrect) {
                    btn.className = "w-full text-left p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-400 text-sm font-medium flex items-center justify-between";
                    btn.querySelector('div').className = "w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500 flex items-center justify-center text-xs font-bold";
                    btn.querySelector('div').innerHTML = "✗";
                }
            }

            const feedbackEl = document.getElementById('quiz-feedback');
            if (isCorrect) {
                scoreCorrect++;
                feedbackEl.innerHTML = `<span class="text-emerald-400">Chính xác! Làm tốt lắm. 👍</span>`;
                try { speakTextFeedback("Correct"); } catch(e){}
            } else {
                scoreIncorrect++;
                feedbackEl.innerHTML = `<span class="text-rose-400">Chưa chính xác. Ôn kỹ nhé!</span>`;
            }

            updateQuizScore();
            document.getElementById('quiz-next-btn').classList.remove('hidden');
        }

        function speakTextFeedback(text) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.volume = 0.3;
            window.speechSynthesis.speak(utterance);
        }

        function generateNextQuizQuestion() {
            currentQuizIndex++;
            if (currentQuizIndex < quizQuestions.length) {
                generateQuizQuestion();
            } else {
                // End of quiz round
                const scorePercent = Math.round((scoreCorrect / quizQuestions.length) * 100);
                document.getElementById('quiz-question-index').textContent = "KẾT QUẢ CUỐI CÙNG";
                document.getElementById('quiz-question-title').innerHTML = `
                    <div class="text-center py-4">
                        <span class="text-4xl">🏆</span>
                        <h4 class="text-2xl font-extrabold text-white mt-2">Hoàn Thành Quiz!</h4>
                        <p class="text-slate-400 mt-1 text-sm">Điểm số chính xác của bạn là:</p>
                        <p class="text-3xl font-black text-indigo-400 mt-2">${scorePercent}% (${scoreCorrect}/${quizQuestions.length})</p>
                    </div>
                `;
                document.getElementById('quiz-options-container').innerHTML = "";
                document.getElementById('quiz-feedback').innerHTML = "";
                
                // Show retry button instead of next button
                const nextBtn = document.getElementById('quiz-next-btn');
                nextBtn.textContent = "Làm vòng mới";
                nextBtn.onclick = () => {
                    nextBtn.textContent = "Tiếp theo";
                    nextBtn.onclick = generateNextQuizQuestion;
                    startQuizMode();
                };
            }
        }

        function updateQuizScore() {
            document.getElementById('quiz-score').textContent = `Đúng: ${scoreCorrect} | Sai: ${scoreIncorrect}`;
        }

        // Utility Toast notification
        function showToast(message, duration = 3000) {
            const toast = document.getElementById('toast-message');
            document.getElementById('toast-text').textContent = message;
            
            toast.classList.remove('translate-y-24', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
            
            setTimeout(() => {
                toast.classList.add('translate-y-24', 'opacity-0');
                toast.classList.remove('translate-y-0', 'opacity-100');
            }, duration);
        }
        // Mobile Drawer Controller
        let isDrawerOpen = false;

        function toggleMobileDrawer() {
            const sidebar = document.getElementById('sidebar-drawer');
            const backdrop = document.getElementById('sidebar-backdrop');
            
            isDrawerOpen = !isDrawerOpen;
            if (isDrawerOpen) {
                sidebar.classList.remove('-translate-x-full');
                backdrop.classList.remove('hidden');
                setTimeout(() => {
                    backdrop.classList.add('opacity-100');
                }, 10);
                document.body.classList.add('overflow-hidden', 'lg:overflow-auto');
            } else {
                sidebar.classList.add('-translate-x-full');
                backdrop.classList.remove('opacity-100');
                setTimeout(() => {
                    if (!isDrawerOpen) backdrop.classList.add('hidden');
                }, 300);
                document.body.classList.remove('overflow-hidden', 'lg:overflow-auto');
            }
        }

        function closeMobileDrawer() {
            if (isDrawerOpen) {
                toggleMobileDrawer();
            }
        }

        // Auto-speak configuration controller
        function initAutoSpeak() {
            const stored = localStorage.getItem('b2_booster_autospeak');
            if (stored !== null) {
                isAutoSpeakEnabled = JSON.parse(stored);
            } else {
                isAutoSpeakEnabled = false; // default to disabled/off
            }
            const checkbox = document.getElementById('toggle-autospeak');
            if (checkbox) {
                checkbox.checked = isAutoSpeakEnabled;
            }
        }

        function toggleAutoSpeak(enabled) {
            isAutoSpeakEnabled = enabled;
            localStorage.setItem('b2_booster_autospeak', JSON.stringify(enabled));
            showToast(enabled ? "Đã bật tự động phát âm 🔊" : "Đã tắt tự động phát âm 🔇");
        }

        // Setup Touch Swipe Gestures for Mobile
        function setupTouchGestures() {
            const container = document.getElementById('flashcard-container');
            if (!container) return;

            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;
            let swipeOccurred = false;

            container.addEventListener('touchstart', function(e) {
                touchStartX = e.changedTouches[0].clientX;
                touchStartY = e.changedTouches[0].clientY;
                swipeOccurred = false;
            }, { passive: true });

            container.addEventListener('touchend', function(e) {
                touchEndX = e.changedTouches[0].clientX;
                touchEndY = e.changedTouches[0].clientY;
                
                const diffX = touchEndX - touchStartX;
                const diffY = touchEndY - touchStartY;
                
                // Horizontal swipe check
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                    swipeOccurred = true;
                    if (diffX < 0) {
                        // Swipe Left -> Next card
                        nextCard();
                    } else {
                        // Swipe Right -> Prev card
                        prevCard();
                    }
                }
            }, { passive: true });

            // Override click behavior to check if a swipe occurred
            container.onclick = function(e) {
                if (swipeOccurred) {
                    swipeOccurred = false;
                    return;
                }
                flipCard();
            };
        }
