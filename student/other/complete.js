=> Math.random() - 0.5);
            const optionsContainer = document.getElementById('quizOptions');
            optionsContainer.innerHTML = '';

            options.forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.textContent = option;
                btn.onclick = function() { checkAnswer(this, option); };
                optionsContainer.appendChild(btn);
            });
        }

        function checkAnswer(button, selectedAnswer) {
            const options = document.querySelectorAll('.quiz-option');
            
            options.forEach(opt => {
                opt.disabled = true;
                if (parseInt(opt.textContent) === currentAnswer) {
                    opt.classList.add('correct');
                }
            });

            if (selectedAnswer === currentAnswer) {
                button.classList.add('correct');
                quizScore++;
                document.getElementById('quizScore').textContent = quizScore;
            } else {
                button.classList.add('wrong');
            }

            setTimeout(generateQuiz, 1500);
        }

        generateQuiz();

        let isPlaying = false;
        let currentTime = 0;
        let duration = 180;
        let musicInterval = null;

        function updateMusicProgress() {
            if (isPlaying && currentTime < duration) {
                currentTime++;
                const progress = (currentTime / duration) * 100;
                document.getElementById('musicProgressBar').style.width = progress + '%';
            } else if (currentTime >= duration) {
                isPlaying = false;
                currentTime = 0;
                document.getElementById('playBtn').textContent = '▶️';
                clearInterval(musicInterval);
            }
        }

        document.getElementById('playBtn').addEventListener('click', function() {
            if (isPlaying) {
                isPlaying = false;
                this.textContent = '▶️';
                clearInterval(musicInterval);
            } else {
                isPlaying = true;
                this.textContent = '⏸️';
                musicInterval = setInterval(updateMusicProgress, 1000);
            }
        });

        document.getElementById('prevBtn').addEventListener('click', function() {
            currentTime = 0;
            document.getElementById('musicProgressBar').style.width = '0%';
        });

        document.getElementById('nextBtn').addEventListener('click', function() {
            currentTime = 0;
            document.getElementById('musicProgressBar').style.width = '0%';
            if (!isPlaying) {
                document.getElementById('playBtn').click();
            }
        });

        document.getElementById('musicProgress').addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const progress = clickX / rect.width;
            currentTime = Math.floor(progress * duration);
            document.getElementById('musicProgressBar').style.width = (progress * 100) + '%';
        });

        document.addEventListener('keydown', function(e) {
            if (snakeGameRunning) {
                switch(e.key) {
                    case 'ArrowUp':
                        changeSnakeDirection('up');
                        e.preventDefault();
                        break;
                    case 'ArrowDown':
                        changeSnakeDirection('down');
                        e.preventDefault();
                        break;
                    case 'ArrowLeft':
                        changeSnakeDirection('left');
                        e.preventDefault();
                        break;
                    case 'ArrowRight':
                        changeSnakeDirection('right');
                        e.preventDefault();
                        break;
                }
            }
        });
    </script>
</body>
</html>