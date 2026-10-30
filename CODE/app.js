// =====================================================
// STUDY PORTAL
// =====================================================


// =====================================================
// GLOBAL STATE
// =====================================================

let currentSubject = null;

let subjects = [];


// =====================================================
// DIAGNOSTIC STATE
// =====================================================

let diagnosticQuestions = [];

let diagnosticAnswers = [];

let currentQuestionIndex = 0;

let diagnosticSubject = null;


// =====================================================
// STUDY ZONE STATE
// =====================================================

let selectedStudyTopic = null;

let studyChatHistory = [];

let attachedStudyFile = null;


// =====================================================
// PROGRESS STATE
// =====================================================

let progressTimer = null;


// =====================================================
// WAIT FOR PYWEBVIEW
// =====================================================

window.addEventListener(
    "pywebviewready",
    async () => {

        console.log(
            "Python backend connected."
        );


        setupEventListeners();


        await loadSubjects();


        if (
            subjects.length > 0
        ) {

            await selectSubject(
                subjects[0]
            );

        } else {

            showNoSubject();

        }

    }
);


// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEventListeners() {

    // ==========================================
    // SUBJECT DROPDOWN
    // ==========================================

    const subjectSelect =
        document.getElementById(
            "subjectSelect"
        );


    const subjectList =
        document.getElementById(
            "subjectList"
        );


    if (
        subjectSelect &&
        subjectList
    ) {

        subjectSelect.addEventListener(
            "click",
            () => {

                subjectList.classList.toggle(
                    "show"
                );

            }
        );

    }


    // ==========================================
    // UPLOAD
    // ==========================================

    const uploadBtn =
        document.getElementById(
            "uploadBtn"
        );


    if (uploadBtn) {

        uploadBtn.addEventListener(
            "click",
            uploadStudyMaterials
        );

    }


    // ==========================================
    // DIAGNOSTIC
    // ==========================================

    const diagnosticBtn =
        document.getElementById(
            "diagnosticBtn"
        );


    if (diagnosticBtn) {

        diagnosticBtn.addEventListener(
            "click",
            takeDiagnostic
        );

    }


    // ==========================================
    // TABS
    // ==========================================

    document
        .querySelectorAll(".tab")
        .forEach(
            tab => {

                tab.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".tab"
                            )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        tab.classList.add(
                            "active"
                        );


                        if (
                            tab.dataset.tab
                            ===
                            "study"
                        ) {

                            showStudyZone();

                        } else {

                            showProgressTracker();

                        }

                    }
                );

            }
        );


    // ==========================================
    // DIAGNOSTIC NAVIGATION
    // ==========================================

    const previousBtn =
        document.getElementById(
            "previousQuestionBtn"
        );


    const nextBtn =
        document.getElementById(
            "nextQuestionBtn"
        );


    if (previousBtn) {

        previousBtn.addEventListener(
            "click",
            previousQuestion
        );

    }


    if (nextBtn) {

        nextBtn.addEventListener(
            "click",
            nextQuestion
        );

    }


    // ==========================================
    // RESULTS
    // ==========================================

    const backBtn =
        document.getElementById(
            "backToProgressBtn"
        );


    const newBtn =
        document.getElementById(
            "newDiagnosticBtn"
        );


    if (backBtn) {

        backBtn.addEventListener(
            "click",
            showProgressTracker
        );

    }


    if (newBtn) {

        newBtn.addEventListener(
            "click",
            takeDiagnostic
        );

    }

}


// =====================================================
// LOAD SUBJECTS
// =====================================================

async function loadSubjects() {

    try {

        subjects =
            await window
                .pywebview
                .api
                .list_subjects();


        if (
            !Array.isArray(subjects)
        ) {

            subjects = [];

        }


        renderSubjects();


    } catch (error) {

        console.error(
            "Could not load subjects:",
            error
        );

    }

}


// =====================================================
// RENDER SUBJECTS
// =====================================================

function renderSubjects() {

    const list =
        document.getElementById(
            "subjectList"
        );


    if (!list) return;


    list.innerHTML =
        "";


    subjects.forEach(
        subject => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "subject-item";


            const name =
                document.createElement(
                    "span"
                );


            name.textContent =
                subject;


            name.addEventListener(
                "click",
                async event => {

                    event.stopPropagation();


                    await selectSubject(
                        subject
                    );


                    list.classList.remove(
                        "show"
                    );

                }
            );


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.className =
                "delete-subject-btn";


            deleteButton.textContent =
                "×";


            deleteButton.title =
                "Delete subject";


            deleteButton.addEventListener(
                "click",
                async event => {

                    event.stopPropagation();


                    await deleteSubject(
                        subject
                    );

                }
            );


            item.appendChild(
                name
            );


            item.appendChild(
                deleteButton
            );


            list.appendChild(
                item
            );

        }
    );


    const addItem =
        document.createElement(
            "div"
        );


    addItem.className =
        "add-subject-item";


    addItem.textContent =
        "+ Add New Subject";


    addItem.addEventListener(
        "click",
        async event => {

            event.stopPropagation();


            await addSubject();

        }
    );


    list.appendChild(
        addItem
    );

}


// =====================================================
// ADD SUBJECT
// =====================================================

async function addSubject() {

    const name =
        prompt(
            "Enter the new subject name:"
        );


    if (!name) return;


    const subject =
        name.trim();


    if (!subject) {

        alert(
            "Subject name cannot be empty."
        );

        return;

    }


    try {

        const result =
            await window
                .pywebview
                .api
                .add_subject(
                    subject
                );


        if (
            !result.success
        ) {

            alert(
                result.message
            );

            return;

        }


        await loadSubjects();


        await selectSubject(
            subject
        );


        document
            .getElementById(
                "subjectList"
            )
            .classList
            .remove(
                "show"
            );


    } catch (error) {

        console.error(
            error
        );


        alert(
            "Could not add subject."
        );

    }

}


// =====================================================
// DELETE SUBJECT
// =====================================================

async function deleteSubject(
    subject
) {

    const confirmed =
        confirm(
            `Are you sure you want to delete "${subject}" and ALL of its data?\n\n` +
            "This will delete:\n" +
            "• Study materials\n" +
            "• Diagnostic history\n" +
            "• Topic performance\n" +
            "• Subject vector database\n" +
            "• All other subject data"
        );


    if (!confirmed) {

        return;

    }


    try {

        const result =
            await window
                .pywebview
                .api
                .delete_subject(
                    subject
                );


        if (
            !result ||
            !result.success
        ) {

            alert(
                result?.message ||
                "Could not delete subject."
            );

            return;

        }


        // ==========================================
        // CLEAR ALL FRONTEND DATA FOR THIS SUBJECT
        // ==========================================

        if (
            currentSubject ===
            subject
        ) {

            currentSubject =
                null;


            selectedStudyTopic =
                null;


            studyChatHistory =
                [];


            attachedStudyFile =
                null;


            diagnosticQuestions =
                [];


            diagnosticAnswers =
                [];


            currentQuestionIndex =
                0;


            diagnosticSubject =
                null;

        }


        // ==========================================
        // RELOAD SUBJECT LIST
        // ==========================================

        await loadSubjects();


        // ==========================================
        // SELECT ANOTHER SUBJECT
        // ==========================================

        if (
            subjects.length > 0
        ) {

            await selectSubject(
                subjects[0]
            );

        } else {

            showNoSubject();

        }


    } catch (error) {

        console.error(
            "Delete subject error:",
            error
        );


        alert(
            "Could not delete subject.\n\n" +
            error
        );

    }

}


// =====================================================
// SELECT SUBJECT
// =====================================================

async function selectSubject(
    subject
) {

    currentSubject =
        subject;


    // Reset Study Zone
    selectedStudyTopic =
        null;


    studyChatHistory =
        [];


    attachedStudyFile =
        null;


    const current =
        document.getElementById(
            "currentSubject"
        );


    if (current) {

        current.textContent =
            subject;

    }


    const heading =
        document.getElementById(
            "subjectHeading"
        );


    if (heading) {

        heading.textContent =
            `${subject.toUpperCase()}: SKILL LEVELS`;

    }


    try {

        await window
            .pywebview
            .api
            .set_subject(
                subject
            );

    } catch (error) {

        console.error(
            "Could not set subject:",
            error
        );

    }


    try {

        const files =
            await window
                .pywebview
                .api
                .get_loaded_files(
                    subject
                );


        const status =
            document.getElementById(
                "materialStatus"
            );


        if (status) {

            if (
                files &&
                files.length > 0
            ) {

                status.textContent =
                    `${files.length} study material(s) loaded.`;

            } else {

                status.textContent =
                    "No study materials uploaded.";

            }

        }

    } catch (error) {

        console.error(
            "Could not get loaded files:",
            error
        );

    }


    await loadDashboard(
        subject
    );

}


// =====================================================
// NO SUBJECT
// =====================================================

function showNoSubject() {

    currentSubject =
        null;


    selectedStudyTopic =
        null;


    studyChatHistory =
        [];


    attachedStudyFile =
        null;


    diagnosticQuestions =
        [];


    diagnosticAnswers =
        [];


    currentQuestionIndex =
        0;


    diagnosticSubject =
        null;


    const current =
        document.getElementById(
            "currentSubject"
        );


    if (current) {

        current.textContent =
            "No Subject Selected";

    }


    const heading =
        document.getElementById(
            "subjectHeading"
        );


    if (heading) {

        heading.textContent =
            "NO SUBJECT SELECTED";

    }


    const ringGrid =
        document.getElementById(
            "ringGrid"
        );


    const barGrid =
        document.getElementById(
            "barGrid"
        );


    if (ringGrid) {

        ringGrid.innerHTML =
            "";

    }


    if (barGrid) {

        barGrid.innerHTML =
            "";

    }


    // ==========================================
    // CLEAR PREVIOUS TEST HISTORY
    // ==========================================

    const testList =
        document.getElementById(
            "testList"
        );


    if (testList) {

        testList.innerHTML = `

            <div class="no-tests">
                No tests taken yet.
            </div>

        `;

    }


    // ==========================================
    // CLEAR MATERIAL STATUS
    // ==========================================

    const materialStatus =
        document.getElementById(
            "materialStatus"
        );


    if (materialStatus) {

        materialStatus.textContent =
            "No study materials uploaded.";

    }


    // ==========================================
    // CLEAR TREND
    // ==========================================

    clearTrend();


    // ==========================================
    // CLEAR STUDY ZONE
    // ==========================================

    const studyContent =
        document.getElementById(
            "studyContent"
        );


    if (studyContent) {

        studyContent.innerHTML =
            "";

    }

}


// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard(
    subject
) {

    try {

        const data =
            await window
                .pywebview
                .api
                .get_dashboard_data(
                    subject
                );


        renderRings(
            data.rings || []
        );


        renderTopics(
            data.topics || []
        );


        renderTests(
            data.tests || []
        );


        renderTrend(
            data.trend || []
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


// =====================================================
// RINGS
// =====================================================

function renderRings(
    rings
) {

    const grid =
        document.getElementById(
            "ringGrid"
        );


    if (!grid) return;


    grid.innerHTML =
        "";


    rings.forEach(
        ring => {

            const cell =
                document.createElement(
                    "div"
                );


            cell.className =
                "ring-cell";


            const label =
                document.createElement(
                    "div"
                );


            label.className =
                "ring-label";


            label.textContent =
                ring.label;


            const ringElement =
                document.createElement(
                    "div"
                );


            ringElement.className =
                "ring";


            ringElement.style.background =
                `conic-gradient(
                    ${ring.color || "var(--teal-light)"}
                    ${ring.value * 3.6}deg,
                    #e9eeee 0deg
                )`;


            const value =
                document.createElement(
                    "div"
                );


            value.className =
                "ring-value";


            value.textContent =
                `${ring.value}%`;


            ringElement.appendChild(
                value
            );


            const caption =
                document.createElement(
                    "div"
                );


            caption.className =
                "ring-caption";


            caption.textContent =
                ring.caption || "";


            cell.appendChild(
                label
            );


            cell.appendChild(
                ringElement
            );


            cell.appendChild(
                caption
            );


            grid.appendChild(
                cell
            );

        }
    );

}


// =====================================================
// INVALID TOPIC FILTER
// =====================================================

function isInvalidStudyTopic(
    topic
) {

    if (!topic) {

        return true;

    }


    const text =
        String(
            topic
        )
            .trim()
            .toLowerCase();


    const invalidTopics = [

        "diagnostic questions for ai assistant",

        "diagnostic questions",

        "ai assistant",

        "general questions",

        "general"

    ];


    return invalidTopics.includes(
        text
    );

}


// =====================================================
// TOPICS
// =====================================================

function renderTopics(
    topics
) {

    const grid =
        document.getElementById(
            "barGrid"
        );


    if (!grid) return;


    grid.innerHTML =
        "";


    const validTopics =
        (topics || [])
            .filter(
                topic =>
                    !isInvalidStudyTopic(
                        topic.name
                    )
            );


    if (
        validTopics.length === 0
    ) {

        grid.innerHTML = `

            <div class="no-tests">
                No diagnostic topic data yet.
            </div>

        `;

        return;

    }


    validTopics.forEach(
        topic => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "bar-row";


            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "bar-name";


            name.textContent =
                topic.name;


            const track =
                document.createElement(
                    "div"
                );


            track.className =
                "bar-track";


            const fill =
                document.createElement(
                    "div"
                );


            fill.className =
                "bar-fill";


            fill.style.width =
                `${topic.pct}%`;


            fill.style.background =
                "var(--teal-light)";


            track.appendChild(
                fill
            );


            const percentage =
                document.createElement(
                    "div"
                );


            percentage.className =
                "bar-pct";


            percentage.textContent =
                `${topic.pct}%`;


            row.appendChild(
                name
            );


            row.appendChild(
                track
            );


            row.appendChild(
                percentage
            );


            grid.appendChild(
                row
            );

        }
    );

}


// =====================================================
// TEST LIST
// =====================================================

function renderTests(
    tests
) {

    const list =
        document.getElementById(
            "testList"
        );


    if (!list) return;


    list.innerHTML =
        "";


    if (
        !tests ||
        tests.length === 0
    ) {

        list.innerHTML = `

            <div class="no-tests">
                No tests taken yet.
            </div>

        `;

        return;

    }


    tests.forEach(
        test => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "test-card";


            let dateText =
                "";


            if (test.date) {

                try {

                    dateText =
                        new Date(
                            test.date
                        )
                            .toLocaleDateString();

                } catch {

                    dateText =
                        "";

                }

            }


            card.innerHTML = `

                <div class="test-icon">
                    ✓
                </div>

                <div class="test-meta">

                    <div class="test-name">
                        ${escapeHtml(
                            test.name ||
                            "Diagnostic Test"
                        )}
                    </div>

                    <div class="test-score">
                        ${test.score || 0}%${
                            dateText
                                ? ` · ${dateText}`
                                : ""
                        }
                    </div>

                </div>

            `;


            list.appendChild(
                card
            );

        }
    );

}


// =====================================================
// TREND
// =====================================================

function renderTrend(
    values
) {

    const svg =
        document.getElementById(
            "trendSvg"
        );


    if (!svg) return;


    svg.innerHTML =
        "";


    if (
        !values ||
        values.length === 0
    ) {

        return;

    }


    const width =
        760;


    const height =
        220;


    const padding =
        35;


    const points =
        values.map(
            (value, index) => {

                const x =
                    padding
                    +
                    index *
                    (
                        (
                            width
                            -
                            padding * 2
                        )
                        /
                        Math.max(
                            values.length - 1,
                            1
                        )
                    );


                const y =
                    height
                    -
                    padding
                    -
                    (
                        value / 100
                    )
                    *
                    (
                        height
                        -
                        padding * 2
                    );


                return {
                    x,
                    y,
                    value
                };

            }
        );


    let path =
        "";


    points.forEach(
        (point, index) => {

            if (
                index === 0
            ) {

                path +=
                    `M ${point.x} ${point.y}`;

            } else {

                path +=
                    ` L ${point.x} ${point.y}`;

            }

        }
    );


    svg.innerHTML += `

        <path
            d="${path}"
            fill="none"
            stroke="#2f9c96"
            stroke-width="3"
        />

    `;


    points.forEach(
        point => {

            svg.innerHTML += `

                <circle
                    cx="${point.x}"
                    cy="${point.y}"
                    r="5"
                    fill="white"
                    stroke="#2f9c96"
                    stroke-width="3"
                />

            `;

        }
    );

}


// =====================================================
// CLEAR TREND
// =====================================================

function clearTrend() {

    const svg =
        document.getElementById(
            "trendSvg"
        );


    if (svg) {

        svg.innerHTML =
            "";

    }

}


// =====================================================
// PROCESSING OVERLAY
// =====================================================

function showProcessing(
    title
) {

    const overlay =
        document.getElementById(
            "processingOverlay"
        );


    const titleElement =
        document.getElementById(
            "processingTitle"
        );


    const message =
        document.getElementById(
            "processingMessage"
        );


    const fill =
        document.getElementById(
            "processingBarFill"
        );


    const percent =
        document.getElementById(
            "processingPercent"
        );


    if (!overlay) return;


    if (titleElement) {

        titleElement.textContent =
            title;

    }


    if (message) {

        message.textContent =
            "Preparing...";

    }


    if (fill) {

        fill.style.width =
            "0%";

    }


    if (percent) {

        percent.textContent =
            "0%";

    }


    overlay.classList.add(
        "show"
    );


    startProgressPolling();

}


// =====================================================
// HIDE PROCESSING
// =====================================================

function hideProcessing() {

    const overlay =
        document.getElementById(
            "processingOverlay"
        );


    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }


    if (progressTimer) {

        clearInterval(
            progressTimer
        );


        progressTimer =
            null;

    }

}


// =====================================================
// PROGRESS POLLING
// =====================================================

function startProgressPolling() {

    if (progressTimer) {

        clearInterval(
            progressTimer
        );

    }


    progressTimer =
        setInterval(
            async () => {

                try {

                    const status =
                        await window
                            .pywebview
                            .api
                            .get_status();


                    updateProcessing(
                        status
                    );


                } catch (error) {

                    console.error(
                        "Progress error:",
                        error
                    );

                }

            },
            250
        );

}


// =====================================================
// UPDATE PROGRESS
// =====================================================

function updateProcessing(
    status
) {

    if (!status) return;


    const message =
        document.getElementById(
            "processingMessage"
        );


    const fill =
        document.getElementById(
            "processingBarFill"
        );


    const percent =
        document.getElementById(
            "processingPercent"
        );


    let progress =
        Number(
            status.progress || 0
        );


    progress =
        Math.max(
            0,
            Math.min(
                100,
                progress
            )
        );


    if (message) {

        message.textContent =
            status.message ||
            "Processing...";

    }


    if (fill) {

        fill.style.width =
            `${progress}%`;

    }


    if (percent) {

        percent.textContent =
            `${progress}%`;

    }

}


// =====================================================
// UPLOAD STUDY MATERIALS
// =====================================================

async function uploadStudyMaterials() {

    if (!currentSubject) {

        alert(
            "Please add and select a subject first."
        );

        return;

    }


    try {

        const files =
            await window
                .pywebview
                .api
                .select_documents();


        if (
            !files ||
            files.length === 0
        ) {

            return;

        }


        const gpuChoice =
            confirm(

                "Use GPU for processing?\n\n" +
                "Press OK for GPU.\n" +
                "Press Cancel for CPU."

            );


        showProcessing(
            "Uploading Study Materials"
        );


        const result =
            await window
                .pywebview
                .api
                .load_documents(

                    currentSubject,

                    files,

                    gpuChoice

                );


        hideProcessing();


        console.log(
            "Upload result:",
            result
        );


        if (
            result &&
            result.success
        ) {

            const status =
                document.getElementById(
                    "materialStatus"
                );


            if (status) {

                status.textContent =
                    `${result.files.length} study material(s) loaded.`;

            }


            alert(
                result.message ||
                "Study materials uploaded successfully."
            );


            await loadDashboard(
                currentSubject
            );


        } else {

            alert(
                result?.message ||
                "Could not upload study materials."
            );

        }


    } catch (error) {

        hideProcessing();


        console.error(
            "Upload error:",
            error
        );


        alert(
            "Could not upload study materials.\n\n" +
            error
        );

    }

}


// =====================================================
// TAKE DIAGNOSTIC
// =====================================================

async function takeDiagnostic() {

    if (!currentSubject) {

        alert(
            "Please add and select a subject first."
        );

        return;

    }


    try {

        showProcessing(
            "Generating Diagnostic Test"
        );


        const result =
            await window
                .pywebview
                .api
                .take_new_diagnostic(
                    currentSubject
                );


        hideProcessing();


        console.log(
            "Diagnostic result:",
            result
        );


        if (
            !result ||
            !result.success
        ) {

            alert(
                result?.message ||
                "Could not generate diagnostic."
            );


            return;

        }


        if (
            !result.questions ||
            result.questions.length === 0
        ) {

            alert(
                "The AI did not generate any usable questions."
            );


            return;

        }


        diagnosticSubject =
            currentSubject;


        diagnosticQuestions =
            result.questions;


        diagnosticAnswers =
            new Array(
                diagnosticQuestions.length
            )
                .fill(
                    null
                );


        currentQuestionIndex =
            0;


        showDiagnostic();


    } catch (error) {

        hideProcessing();


        console.error(
            "Diagnostic error:",
            error
        );


        alert(
            "Could not generate diagnostic.\n\n" +
            error
        );

    }

}


// =====================================================
// SHOW DIAGNOSTIC
// =====================================================

function showDiagnostic() {

    const progress =
        document.getElementById(
            "progressContent"
        );


    const diagnostic =
        document.getElementById(
            "diagnosticContent"
        );


    const result =
        document.getElementById(
            "resultContent"
        );


    const study =
        document.getElementById(
            "studyContent"
        );


    if (progress) {

        progress.style.display =
            "none";

    }


    if (result) {

        result.style.display =
            "none";

    }


    if (study) {

        study.style.display =
            "none";

    }


    if (diagnostic) {

        diagnostic.style.display =
            "block";

    }


    const title =
        document.getElementById(
            "diagnosticTitle"
        );


    if (title) {

        title.textContent =
            `${diagnosticSubject.toUpperCase()} DIAGNOSTIC`;

    }


    renderCurrentQuestion();

}


// =====================================================
// RENDER QUESTION
// =====================================================

function renderCurrentQuestion() {

    if (
        diagnosticQuestions.length === 0
    ) {

        return;

    }


    const question =
        diagnosticQuestions[
            currentQuestionIndex
        ];


    const total =
        diagnosticQuestions.length;


    const number =
        currentQuestionIndex + 1;


    const counter =
        document.getElementById(
            "questionCounter"
        );


    if (counter) {

        counter.textContent =
            `Question ${number} of ${total}`;

    }


    const progress =
        document.getElementById(
            "questionProgressFill"
        );


    if (progress) {

        progress.style.width =
            `${(number / total) * 100}%`;

    }


    const topic =
        document.getElementById(
            "questionTopic"
        );


    if (topic) {

        topic.textContent =
            isInvalidStudyTopic(
                question.topic
            )
                ? "General"
                : (
                    question.topic ||
                    "General"
                );

    }


    const text =
        document.getElementById(
            "questionText"
        );


    if (text) {

        text.textContent =
            question.question;

    }


    const options =
        document.getElementById(
            "optionsContainer"
        );


    if (!options) return;


    options.innerHTML =
        "";


    if (
        !Array.isArray(
            question.options
        )
    ) {

        return;

    }


    question.options.forEach(
        (option, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "option-btn";


            button.textContent =
                `${String.fromCharCode(65 + index)}. ${option}`;


            if (
                diagnosticAnswers[
                    currentQuestionIndex
                ]
                ===
                option
            ) {

                button.classList.add(
                    "selected"
                );

            }


            button.addEventListener(
                "click",
                () => {

                    selectAnswer(
                        option
                    );

                }
            );


            options.appendChild(
                button
            );

        }
    );


    const previous =
        document.getElementById(
            "previousQuestionBtn"
        );


    if (previous) {

        previous.disabled =
            currentQuestionIndex === 0;

    }


    const next =
        document.getElementById(
            "nextQuestionBtn"
        );


    if (next) {

        next.textContent =
            currentQuestionIndex
            ===
            total - 1

                ? "Submit Test"

                : "Next";


        next.disabled =
            !diagnosticAnswers[
                currentQuestionIndex
            ];

    }

}


// =====================================================
// SELECT ANSWER
// =====================================================

function selectAnswer(
    answer
) {

    diagnosticAnswers[
        currentQuestionIndex
    ] = answer;


    renderCurrentQuestion();

}


// =====================================================
// PREVIOUS QUESTION
// =====================================================

function previousQuestion() {

    if (
        currentQuestionIndex <= 0
    ) {

        return;

    }


    currentQuestionIndex--;


    renderCurrentQuestion();

}


// =====================================================
// NEXT QUESTION
// =====================================================

function nextQuestion() {

    const total =
        diagnosticQuestions.length;


    if (
        !diagnosticAnswers[
            currentQuestionIndex
        ]
    ) {

        alert(
            "Please select an answer first."
        );

        return;

    }


    if (
        currentQuestionIndex
        <
        total - 1
    ) {

        currentQuestionIndex++;


        renderCurrentQuestion();


        return;

    }


    finishDiagnostic();

}


// =====================================================
// FINISH DIAGNOSTIC
// =====================================================

async function finishDiagnostic() {

    let correct =
        0;


    const topicStats =
        {};


    diagnosticQuestions.forEach(
        (question, index) => {

            const userAnswer =
                diagnosticAnswers[
                    index
                ];


            const isCorrect =
                userAnswer
                ===
                question.answer;


            if (isCorrect) {

                correct++;

            }


            let topic =
                question.topic
                ||
                "General";


            if (
                isInvalidStudyTopic(
                    topic
                )
            ) {

                topic =
                    "General";

            }


            if (
                !topicStats[topic]
            ) {

                topicStats[topic] = {

                    correct:
                        0,

                    total:
                        0

                };

            }


            topicStats[
                topic
            ].total++;


            if (isCorrect) {

                topicStats[
                    topic
                ].correct++;

            }

        }
    );


    const total =
        diagnosticQuestions.length;


    const score =
        Math.round(

            (
                correct
                /
                total
            )
            *
            100

        );


    const resultData = {

        name:
            "Diagnostic Test",

        subject:
            diagnosticSubject,

        date:
            new Date().toISOString(),

        score:
            score,

        correct:
            correct,

        total:
            total,

        topicStats:
            topicStats

    };


    try {

        const saveResult =
            await window
                .pywebview
                .api
                .save_diagnostic_result(

                    diagnosticSubject,

                    resultData

                );


        console.log(
            "Diagnostic save result:",
            saveResult
        );


        if (
            !saveResult ||
            !saveResult.success
        ) {

            console.error(
                "Could not save diagnostic:",
                saveResult
            );


            alert(
                "The test was completed, but the result could not be saved."
            );

        }


    } catch (error) {

        console.error(
            "Diagnostic save error:",
            error
        );


        alert(
            "The test was completed, but the result could not be saved."
        );

    }


    showResults(
        score,
        correct,
        total,
        topicStats
    );


    await loadDashboard(
        diagnosticSubject
    );

}


// =====================================================
// SHOW RESULTS
// =====================================================

function showResults(
    score,
    correct,
    total,
    topicStats
) {

    const diagnostic =
        document.getElementById(
            "diagnosticContent"
        );


    const result =
        document.getElementById(
            "resultContent"
        );


    if (diagnostic) {

        diagnostic.style.display =
            "none";

    }


    if (result) {

        result.style.display =
            "block";

    }


    const scoreElement =
        document.getElementById(
            "resultScore"
        );


    const fraction =
        document.getElementById(
            "resultFraction"
        );


    if (scoreElement) {

        scoreElement.textContent =
            `${score}%`;

    }


    if (fraction) {

        fraction.textContent =
            `${correct} / ${total} correct`;

    }


    const strong =
        document.getElementById(
            "strongAreas"
        );


    const weak =
        document.getElementById(
            "weakAreas"
        );


    const strongTopics =
        [];


    const weakTopics =
        [];


    Object.entries(
        topicStats
    ).forEach(
        ([topic, stats]) => {

            if (
                isInvalidStudyTopic(
                    topic
                )
            ) {

                return;

            }


            const percentage =
                Math.round(

                    (
                        stats.correct
                        /
                        stats.total
                    )
                    *
                    100

                );


            if (
                percentage >= 70
            ) {

                strongTopics.push({

                    topic,
                    percentage

                });

            } else {

                weakTopics.push({

                    topic,
                    percentage

                });

            }

        }
    );


    if (strong) {

        if (
            strongTopics.length === 0
        ) {

            strong.textContent =
                "No strong areas identified yet.";

        } else {

            strong.innerHTML =
                strongTopics
                    .map(
                        item => `

                            <div class="result-topic">

                                <span>
                                    ${escapeHtml(
                                        item.topic
                                    )}
                                </span>

                                <strong>
                                    ${item.percentage}%
                                </strong>

                            </div>

                        `
                    )
                    .join("");

        }

    }


    if (weak) {

        if (
            weakTopics.length === 0
        ) {

            weak.textContent =
                "No major weak areas identified.";

        } else {

            weak.innerHTML =
                weakTopics
                    .map(
                        item => `

                            <div class="result-topic">

                                <span>
                                    ${escapeHtml(
                                        item.topic
                                    )}
                                </span>

                                <strong>
                                    ${item.percentage}%
                                </strong>

                            </div>

                        `
                    )
                    .join("");

        }

    }

}


// =====================================================
// AI STUDY ZONE
// =====================================================

async function showStudyZone() {

    const progress =
        document.getElementById(
            "progressContent"
        );


    const diagnostic =
        document.getElementById(
            "diagnosticContent"
        );


    const result =
        document.getElementById(
            "resultContent"
        );


    const study =
        document.getElementById(
            "studyContent"
        );


    if (progress) {

        progress.style.display =
            "none";

    }


    if (diagnostic) {

        diagnostic.style.display =
            "none";

    }


    if (result) {

        result.style.display =
            "none";

    }


    if (!study) {

        console.error(
            "studyContent element not found."
        );

        return;

    }


    study.style.display =
        "block";


    if (!currentSubject) {

        renderStudyMessage(
            "Please select a subject first."
        );

        return;

    }


    try {

        const data =
            await window
                .pywebview
                .api
                .get_study_zone(
                    currentSubject
                );


        if (
            !data ||
            !data.success
        ) {

            renderStudyMessage(
                data?.message ||
                "Could not load the AI Study Zone."
            );

            return;

        }


        renderStudyZone(
            data
        );


    } catch (error) {

        console.error(
            "Study Zone error:",
            error
        );


        renderStudyMessage(
            "Could not load the AI Study Zone."
        );

    }

}


// =====================================================
// STUDY ZONE MESSAGE
// =====================================================

function renderStudyMessage(
    message
) {

    const study =
        document.getElementById(
            "studyContent"
        );


    if (!study) return;


    study.innerHTML = `

        <div class="card">

            <div class="card-heading">
                AI Study Zone
            </div>

            <div class="study-empty">
                ${escapeHtml(message)}
            </div>

        </div>

    `;

}


// =====================================================
// RENDER STUDY ZONE
// =====================================================

function renderStudyZone(
    data
) {

    const study =
        document.getElementById(
            "studyContent"
        );


    if (!study) return;


    const rawTopics =
        data.topics || [];


    const topics =
        rawTopics.filter(
            topic =>
                !isInvalidStudyTopic(
                    topic.name
                )
        );


    study.innerHTML = `

        <div class="card study-zone-header">

            <div class="card-heading">
                AI Study Zone
            </div>

            <div class="study-zone-subtitle">

                Personalized help based on
                your diagnostic performance.

            </div>

        </div>


        <div class="card">

            <div class="card-heading">
                Recommended Focus
            </div>

            <div
                id="studyTopics"
                class="study-topics"
            ></div>

        </div>


        <div
            id="studyLesson"
            class="study-lesson"
        >

            <div class="card">

                <div class="study-empty">

                    Select a topic above to begin
                    your personalized lesson.

                </div>

            </div>

        </div>

    `;


    const topicsContainer =
        document.getElementById(
            "studyTopics"
        );


    if (!topicsContainer) return;


    if (
        topics.length === 0
    ) {

        topicsContainer.innerHTML = `

            <div class="study-empty">

                No weak topics have been identified
                yet. Take another diagnostic to
                update your recommendations.

            </div>

        `;

        return;

    }


    topics.forEach(
        topic => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "study-topic-btn";


            button.innerHTML = `

                <div class="study-topic-row">

                    <span class="study-topic-name">

                        ${escapeHtml(
                            topic.name
                        )}

                    </span>

                    <strong>

                        ${topic.pct}%

                    </strong>

                </div>

                <div class="study-topic-description">

                    ${
                        topic.pct < 40
                            ? "Needs immediate attention"
                            : "Needs improvement"
                    }

                </div>

            `;


            button.addEventListener(
                "click",
                () => {

                    loadStudyLesson(
                        topic.name,
                        topic.pct
                    );

                }
            );


            topicsContainer.appendChild(
                button
            );

        }
    );

}


// =====================================================
// LOAD STUDY LESSON
// =====================================================

async function loadStudyLesson(
    topic,
    score
) {

    selectedStudyTopic =
        topic;


    studyChatHistory =
        [];


    attachedStudyFile =
        null;


    const lesson =
        document.getElementById(
            "studyLesson"
        );


    if (!lesson) return;


    lesson.innerHTML = `

        <div class="card">

            <div class="study-loading">

                Preparing your personalized
                lesson for
                <strong>
                    ${escapeHtml(topic)}
                </strong>...

            </div>

        </div>

    `;


    try {

        showProcessing(
            `Preparing ${topic}`
        );


        const result =
            await window
                .pywebview
                .api
                .get_study_lesson(

                    currentSubject,

                    topic,

                    score

                );


        hideProcessing();


        if (
            !result ||
            !result.success
        ) {

            lesson.innerHTML = `

                <div class="card">

                    <div class="study-error">

                        ${
                            escapeHtml(
                                result?.message ||
                                "Could not generate the lesson."
                            )
                        }

                    </div>

                </div>

            `;

            return;

        }


        renderStudyLesson(
            result
        );


    } catch (error) {

        hideProcessing();


        console.error(
            "Study lesson error:",
            error
        );


        lesson.innerHTML = `

            <div class="card">

                <div class="study-error">

                    Could not generate the lesson.

                </div>

            </div>

        `;

    }

}


// =====================================================
// RENDER LESSON
// =====================================================

function renderStudyLesson(
    result
) {

    const lesson =
        document.getElementById(
            "studyLesson"
        );


    if (!lesson) return;


    lesson.innerHTML = `

        <div class="card">

            <div class="lesson-header">

                <div class="study-label">
                    PERSONALIZED LESSON
                </div>

                <h2>
                    ${escapeHtml(
                        result.topic ||
                        selectedStudyTopic
                    )}
                </h2>

                <div class="lesson-score">

                    Diagnostic performance:
                    ${result.score ?? ""}%

                </div>

            </div>


            <div class="lesson-body">

                ${formatLessonText(
                    result.lesson ||
                    ""
                )}

            </div>

        </div>


        <div class="card">

            <div class="card-heading">
                Ask AI
            </div>

            <div class="study-chat-subtitle">

                Ask questions about
                ${escapeHtml(
                    selectedStudyTopic
                )}
                using your uploaded study material.

            </div>


            <div
                id="studyChatMessages"
                class="study-chat-messages"
            >

                <div class="ai-message">

                    I'm ready to help.
                    Ask me anything about this topic.

                </div>

            </div>


            <div class="study-chat-box">

                <textarea
                    id="studyChatInput"
                    class="study-chat-input"
                    rows="7"
                    style="min-height:180px;"
                    placeholder="Ask a doubt about this topic..."
                ></textarea>


                <div
                    id="studyAttachedFile"
                    class="study-attached-file"
                ></div>


                <div class="study-chat-actions">

                    <button
                        id="studyAttachButton"
                        class="secondary-btn"
                        type="button"
                    >
                        Attach file
                    </button>


                    <button
                        id="studyChatButton"
                        class="primary-btn"
                        type="button"
                    >
                        Send
                    </button>

                </div>


                <input
                    type="file"
                    id="studyFileInput"
                    hidden
                    accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg"
                />

            </div>

        </div>

    `;


    setupStudyChat();

}


// =====================================================
// STUDY CHAT SETUP
// =====================================================

function setupStudyChat() {

    const input =
        document.getElementById(
            "studyChatInput"
        );


    const sendButton =
        document.getElementById(
            "studyChatButton"
        );


    const attachButton =
        document.getElementById(
            "studyAttachButton"
        );


    const fileInput =
        document.getElementById(
            "studyFileInput"
        );


    if (sendButton) {

        sendButton.addEventListener(
            "click",
            askStudyAI
        );

    }


    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                    &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    askStudyAI();

                }

            }
        );

    }


    if (attachButton) {

        attachButton.addEventListener(
            "click",
            () => {

                if (fileInput) {

                    fileInput.click();

                }

            }
        );

    }


    if (fileInput) {

        fileInput.addEventListener(
            "change",
            handleStudyFile
        );

    }

}


// =====================================================
// HANDLE STUDY FILE
// =====================================================

async function handleStudyFile() {

    try {

        const filePath =
            await window
                .pywebview
                .api
                .select_study_attachment();


        if (!filePath) {

            return;

        }


        attachedStudyFile =
            filePath;


        const fileName =
            String(
                filePath
            ).split(
                /[\\\/]/
            ).pop();


        const display =
            document.getElementById(
                "studyAttachedFile"
            );


        if (!display) return;


        display.innerHTML = `

            <div class="attached-file">

                <span>
                    ${escapeHtml(
                        fileName
                    )}
                </span>

                <button
                    type="button"
                    class="remove-file-btn"
                    onclick="removeStudyFile()"
                >
                    Remove
                </button>

            </div>

        `;

    } catch (error) {

        console.error(
            "Study attachment error:",
            error
        );


        alert(
            "Could not attach the file.\n\n" +
            error
        );

    }

}


// =====================================================
// REMOVE STUDY FILE
// =====================================================

function removeStudyFile() {

    attachedStudyFile =
        null;


    const input =
        document.getElementById(
            "studyFileInput"
        );


    const display =
        document.getElementById(
            "studyAttachedFile"
        );


    if (input) {

        input.value =
            "";

    }


    if (display) {

        display.innerHTML =
            "";

    }

}


// =====================================================
// ASK STUDY AI
// =====================================================

async function askStudyAI() {

    const input =
        document.getElementById(
            "studyChatInput"
        );


    const messages =
        document.getElementById(
            "studyChatMessages"
        );


    if (!input || !messages) {

        return;

    }


    const question =
        input.value.trim();


    if (!question) {

        return;

    }


    if (!currentSubject) {

        return;

    }


    if (!selectedStudyTopic) {

        alert(
            "Please select a study topic first."
        );

        return;

    }


    const userMessage = {

        role:
            "user",

        content:
            question

    };


    studyChatHistory.push(
        userMessage
    );


    appendChatMessage(
        "user",
        question
    );


    input.value =
        "";


    input.disabled =
        true;


    const sendButton =
        document.getElementById(
            "studyChatButton"
        );


    const attachButton =
        document.getElementById(
            "studyAttachButton"
        );


    if (sendButton) {

        sendButton.disabled =
            true;

    }


    if (attachButton) {

        attachButton.disabled =
            true;

    }


    const loading =
        appendChatMessage(
            "ai",
            attachedStudyFile
                ? "Reading your file and thinking..."
                : "Thinking..."
        );


    try {

        const result =
            await window
                .pywebview
                .api
                .ask_study_zone(

                    currentSubject,

                    selectedStudyTopic,

                    question,

                    studyChatHistory,

                    attachedStudyFile || ""

                );


        if (loading) {

            loading.remove();

        }


        if (
            !result ||
            !result.success
        ) {

            appendChatMessage(

                "ai",

                result?.message ||
                "I couldn't answer that question."

            );


            if (
                result &&
                Array.isArray(
                    result.resources
                )
            ) {

                renderStudyResources(
                    result.resources
                );

            }


            return;

        }


        const answer =
            result.answer ||
            "";


        studyChatHistory.push({

            role:
                "assistant",

            content:
                answer

        });


        appendChatMessage(
            "ai",
            answer
        );


        if (
            Array.isArray(
                result.resources
            )
        ) {

            renderStudyResources(
                result.resources
            );

        }


        removeStudyFile();


    } catch (error) {

        console.error(
            "Study AI error:",
            error
        );


        if (loading) {

            loading.remove();

        }


        appendChatMessage(

            "ai",

            "Something went wrong while contacting the AI."

        );

    } finally {

        input.disabled =
            false;


        if (sendButton) {

            sendButton.disabled =
                false;

        }


        if (attachButton) {

            attachButton.disabled =
                false;

        }


        input.focus();

    }

}


// =====================================================
// STUDY RESOURCES
// =====================================================

function renderStudyResources(
    resources
) {

    const messages =
        document.getElementById(
            "studyChatMessages"
        );


    if (!messages) return;


    if (
        !Array.isArray(resources) ||
        resources.length === 0
    ) {

        return;

    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "study-resources";


    const heading =
        document.createElement(
            "div"
        );


    heading.className =
        "study-resources-heading";


    heading.textContent =
        "Useful resources";


    wrapper.appendChild(
        heading
    );


    resources.forEach(
        resource => {

            if (
                !resource ||
                !resource.url
            ) {

                return;

            }


            const link =
                document.createElement(
                    "a"
                );


            link.className =
                "study-resource-link";


            link.href =
                resource.url;


            link.target =
                "_blank";


            link.rel =
                "noopener noreferrer";


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                resource.title ||
                "Open resource";


            const description =
                document.createElement(
                    "span"
                );


            description.textContent =
                resource.description ||
                "";


            link.appendChild(
                title
            );


            link.appendChild(
                description
            );


            wrapper.appendChild(
                link
            );

        }
    );


    messages.appendChild(
        wrapper
    );


    messages.scrollTop =
        messages.scrollHeight;

}


// =====================================================
// APPEND CHAT MESSAGE
// =====================================================

function appendChatMessage(
    role,
    message
) {

    const messages =
        document.getElementById(
            "studyChatMessages"
        );


    if (!messages) {

        return null;

    }


    const element =
        document.createElement(
            "div"
        );


    element.className =
        role === "user"
            ? "user-message"
            : "ai-message";


    if (
        role === "ai"
    ) {

        element.innerHTML =
            formatChatText(
                message
            );

    } else {

        element.textContent =
            message;

    }


    messages.appendChild(
        element
    );


    messages.scrollTop =
        messages.scrollHeight;


    return element;

}


// =====================================================
// FORMAT CHAT
// =====================================================

function formatChatText(
    text
) {

    if (!text) {

        return "";

    }


    let output =
        escapeHtml(
            text
        );


    output =
        output.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    output =
        output.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );


    output =
        output.replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        );


    output =
        output.replace(
            /^# (.*)$/gm,
            "<h2>$1</h2>"
        );


    output =
        output.replace(
            /\n/g,
            "<br>"
        );


    return output;

}


// =====================================================
// FORMAT LESSON
// =====================================================

function formatLessonText(
    text
) {

    if (!text) {

        return "";

    }


    let output =
        escapeHtml(
            text
        );


    output =
        output.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );


    output =
        output.replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        );


    output =
        output.replace(
            /^# (.*)$/gm,
            "<h2>$1</h2>"
        );


    output =
        output.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    output =
        output.replace(
            /^\- (.*)$/gm,
            "<li>$1</li>"
        );


    output =
        output.replace(
            /\n\n/g,
            "</p><p>"
        );


    output =
        `<p>${output}</p>`;


    return output;

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
    text
) {

    return String(
        text ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// PROGRESS TRACKER
// =====================================================

function showProgressTracker() {

    const progress =
        document.getElementById(
            "progressContent"
        );


    const diagnostic =
        document.getElementById(
            "diagnosticContent"
        );


    const result =
        document.getElementById(
            "resultContent"
        );


    const study =
        document.getElementById(
            "studyContent"
        );


    if (diagnostic) {

        diagnostic.style.display =
            "none";

    }


    if (result) {

        result.style.display =
            "none";

    }


    if (study) {

        study.style.display =
            "none";

    }


    if (progress) {

        progress.style.display =
            "block";

    }


    if (currentSubject) {

        loadDashboard(
            currentSubject
        );

    }

}