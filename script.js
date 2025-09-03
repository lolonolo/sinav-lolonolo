document.addEventListener('DOMContentLoaded', () => {
    // --- HAMBURGER & SIDE MENU LOGIC ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sideMenu = document.getElementById('side-menu');
    hamburgerBtn.addEventListener('click', () => {
        sideMenu.classList.toggle('is-open');
    });

    // --- TAB SWITCHING LOGIC ---
    const tabs = document.querySelectorAll('.tab-btn');
    const ganoContent = document.getElementById('gano-content');
    const passContent = document.getElementById('pass-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.dataset.tab;
            if (targetId === 'gano-content') {
                ganoContent.style.display = 'block';
                passContent.style.display = 'none';
            } else {
                ganoContent.style.display = 'none';
                passContent.style.display = 'block';
            }
        });
    });

    // --- GPA CALCULATOR LOGIC ---
    const ganoSystemSelect = document.getElementById('system-select');
    const coursesTbody = document.getElementById('courses-tbody');
    const addCourseBtn = document.getElementById('add-course-btn');
    const calculateGpaBtn = document.getElementById('calculate-gpa-btn');
    const gpaResultArea = document.getElementById('gpa-result-area');
    const gradePointValues = { 'AA': 4.0, 'AB': 3.7, 'BA': 3.3, 'BB': 3.0, 'BC': 2.7, 'CB': 2.3, 'CC': 2.0, 'CD': 1.7, 'DC': 1.3, 'DD': 1.0, 'FF': 0.0 };
    const universitySystems = {
        'auzef_acik':    { weights: { vize: 0.3, final: 0.7 }, rules: { minFinal: 0, minAverage: 35 }, gradeTable: 'auzef' },
        'auzef_uzaktan': { weights: { vize: 0.4, final: 0.6 }, rules: { minFinal: 0, minAverage: 35 }, gradeTable: 'auzef' },
        'anadolu_aof':   { weights: { vize: 0.3, final: 0.7 }, rules: { minFinal: 0, minAverage: 33 }, gradeTable: 'anadolu' },
        'ata_aof':       { weights: { vize: 0.3, final: 0.7 }, rules: { minFinal: 0, minAverage: 35 }, gradeTable: 'ata' }
    };

    const getLetterGradeBySystem = (score, system) => {
        switch (system) {
            case 'anadolu':
                if (score >= 84) return 'AA'; if (score >= 77) return 'AB'; if (score >= 71) return 'BA';
                if (score >= 66) return 'BB'; if (score >= 61) return 'BC'; if (score >= 56) return 'CB';
                if (score >= 50) return 'CC'; if (score >= 46) return 'CD'; if (score >= 40) return 'DC';
                if (score >= 33) return 'DD'; return 'FF';
            case 'ata':
            case 'auzef':
            default:
                if (score >= 88) return 'AA'; if (score >= 81) return 'BA'; if (score >= 74) return 'BB';
                if (score >= 67) return 'CB'; if (score >= 60) return 'CC'; if (score >= 53) return 'DC';
                if (score >= 35) return 'DD'; return 'FF';
        }
    };
    
    const getPassStatus = (successGrade, letterGrade, rules) => {
        if (successGrade < rules.minAverage) { return { text: 'Kaldı', className: 'status-failed' }; }
        if (letterGrade === 'FF') { return { text: 'Kaldı', className: 'status-failed' }; }
        if (['DD', 'DC', 'CD'].includes(letterGrade)) { return { text: 'Şartlı Geçti', className: 'status-conditional' }; }
        return { text: 'Geçti', className: 'status-passed' };
    };

    const addCourseRow = () => {
        const row = document.createElement('tr');
        row.innerHTML = `<td><input type="number" class="credit-input" placeholder="AKTS" min="1"></td><td><input type="number" class="vize-input" placeholder="Vize" min="0" max="100"></td><td><input type="number" class="final-input" placeholder="Final" min="0" max="100"></td><td class="result-cell success-grade">-</td><td class="result-cell letter-grade">-</td><td class="result-cell status">-</td><td><button class="delete-row-btn">X</button></td>`;
        coursesTbody.appendChild(row);
    };

    const calculateAndDisplayGpaResults = () => {
        const selectedSystemKey = ganoSystemSelect.value;
        const selectedSystem = universitySystems[selectedSystemKey];
        const rows = coursesTbody.querySelectorAll('tr');
        let totalCredits = 0, totalWeightedPoints = 0;
        rows.forEach(row => {
            const finalInput = row.querySelector('.final-input');
            finalInput.classList.remove('input-error');
            const credit = parseFloat(row.querySelector('.credit-input').value);
            const vize = parseFloat(row.querySelector('.vize-input').value);
            const final = parseFloat(row.querySelector('.final-input').value);
            const successGradeCell = row.querySelector('.success-grade');
            const letterGradeCell = row.querySelector('.letter-grade');
            const statusCell = row.querySelector('.status');
            statusCell.className = 'result-cell status';
            if (!isNaN(credit) && credit > 0 && !isNaN(vize) && !isNaN(final)) {
                const successGrade = (vize * selectedSystem.weights.vize) + (final * selectedSystem.weights.final);
                const letterGrade = getLetterGradeBySystem(successGrade, selectedSystem.gradeTable);
                const status = getPassStatus(successGrade, letterGrade, selectedSystem.rules);
                successGradeCell.textContent = successGrade.toFixed(2);
                letterGradeCell.textContent = letterGrade;
                statusCell.textContent = status.text;
                statusCell.classList.add(status.className);
                if (status.text === 'Kaldı' && (selectedSystem.rules.minFinal > 0 && final < selectedSystem.rules.minFinal)) {
                    finalInput.classList.add('input-error');
                }
                const gradePoint = gradePointValues[letterGrade];
                if (gradePoint !== undefined) { totalCredits += credit; totalWeightedPoints += credit * gradePoint; }
            } else {
                successGradeCell.textContent = '-'; letterGradeCell.textContent = '-'; statusCell.textContent = '-';
            }
        });
        if (totalCredits === 0) {
            gpaResultArea.innerHTML = 'Lütfen en az bir ders için geçerli bilgiler girin.';
            gpaResultArea.className = 'result-area status-failed';
        } else {
            const gpa = totalWeightedPoints / totalCredits;
            gpaResultArea.innerHTML = `<strong>Dönem Ortalamanız (GANO / AGNO):</strong> ${gpa.toFixed(2)}`;
            gpaResultArea.className = 'result-area status-passed';
        }
        gpaResultArea.style.display = 'block';
    };
    addCourseBtn.addEventListener('click', addCourseRow);
    calculateGpaBtn.addEventListener('click', calculateAndDisplayGpaResults);
    coursesTbody.addEventListener('click', (e) => { if (e.target.classList.contains('delete-row-btn')) { e.target.closest('tr').remove(); } });

    // --- PASS CALCULATOR LOGIC ---
    const passVizeInput = document.getElementById('pass-vize-input');
    const targetGradeSelect = document.getElementById('target-grade-select');
    const calculatePassBtn = document.getElementById('calculate-pass-btn');
    const passResultArea = document.getElementById('pass-result-area');
    const calculateRequiredFinal = () => {
        const selectedSystemKey = ganoSystemSelect.value;
        const system = universitySystems[selectedSystemKey];
        const vize = parseFloat(passVizeInput.value);
        const targetScore = parseFloat(targetGradeSelect.value);
        if (isNaN(vize) || vize < 0 || vize > 100) {
            passResultArea.innerHTML = 'Lütfen 0-100 arasında geçerli bir Vize notu girin.';
            passResultArea.className = 'result-area status-failed';
            passResultArea.style.display = 'block';
            return;
        }
        let requiredFinal = (targetScore - (vize * system.weights.vize)) / system.weights.final;
        const finalMinScore = system.rules.minFinal;
        let finalResult = (finalMinScore > 0) ? Math.max(requiredFinal, finalMinScore) : requiredFinal;
        if (finalResult > 100) {
            passResultArea.innerHTML = `Final'den <strong>100'den yüksek</strong> almanız gerekiyor. Maalesef mümkün değil.`;
            passResultArea.className = 'result-area status-failed';
        } else if (finalResult <= 0) {
             passResultArea.innerHTML = `Finalden <strong>${finalMinScore > 0 ? finalMinScore : 0}</strong> almanız yeterlidir.`;
            passResultArea.className = 'result-area status-passed';
        } else {
            passResultArea.innerHTML = `Final'den almanız gereken minimum not: <strong>${Math.ceil(finalResult)}</strong>`;
            passResultArea.className = 'result-area status-passed';
        }
        passResultArea.style.display = 'block';
    };
    calculatePassBtn.addEventListener('click', calculateRequiredFinal);
    
    // Initial setup
    for (let i = 0; i < 5; i++) { addCourseRow(); }
});
