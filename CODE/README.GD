# NEXAM 

**Online Examination and Real-Time System for Assessment Management**

NEXAM  is a web platform for secure online exams. It joins exam management, identity verification and live proctoring in one system. Only students on a college-approved list can register, and the exam session is monitored and recorded for faculty review.

## Features

### Registration security
- Faculty add students to a class list by CSV upload or one by one (roll number, name, college email)
- Only listed students can register, and each email registers once
- A 6-digit code is sent to the college email (expires in 10 minutes, 5 wrong tries allowed)
- Name, roll number and class are filled from the list, not typed by the student

### Proctoring
- Face registration at sign-up, and face verification before the exam starts
- Continuous face matching every 3 seconds during the exam
- 6-second grace period: a violation must last 6 seconds in a row to count
- No face, face mismatch and suspicious speech each give a warning
- The 5th warning ends the exam automatically
- Tab switch or leaving fullscreen ends the exam immediately
- Live speech-to-text: 5 matching words from the current question or options give 1 warning (experimental)
- Full session video recording
- Camera snapshots every 3 seconds
- Terminated students are still marked on the answers they wrote, with no deduction

### Faculty tools
- Create exams with multiple-choice questions and assign them to classes
- Student list per exam in roll-number order, with status: Completed, Terminated or Not attempted
- Score, flag count and submission time (India time) for each student
- Watch the session recording, see the flag list, and jump to the moment of each flag
- Review snapshots, class-wise student reports, and reattempt requests

### Email automation (Gmail)
- Reminder email when an exam is posted
- Reminder 1 hour before the exam closes, sent only to students who have not attempted

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React, TypeScript, React Router |
| Backend | Node.js, Express |
| Database | SQLite (`node:sqlite`) |
| Face detection | face-api.js |
| Speech | Web Speech API (Chrome or Edge) |
| Recording | MediaRecorder API |
| Email | Nodemailer with Gmail |
| Security | bcryptjs password hashing |

## Project structure

```
nexam-ai/
├── frontend/            React app
│   └── src/
│       ├── pages/       Screens (Exam, Register, FacultyDashboard, ...)
│       └── hooks/       useSpeechDetection.ts
└── nexam-backend/       Express API
    ├── routes/          auth, exams, studentList
    ├── db.js            SQLite tables
    ├── mailer.js        Gmail sender
    ├── reminders.js     Exam reminder emails
    └── server.js
```

## Getting started

### Requirements
- Node.js 22 or newer
- Chrome or Edge (needed for speech detection)
- A Gmail account with 2-Step Verification and an app password

### 1. Backend

```bash
cd nexam-backend
npm install
```

Create a file named `.env` in `nexam-backend`:

```
PORT=5000
GMAIL_USER=yourname@gmail.com
GMAIL_APP_PASSWORD=your16letterapppassword
```

Start the server:

```bash
node server.js
```

The database is created automatically on the first run.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the address shown in the terminal.

### Default admin account
A starter admin is created on first run: `admin@nexam.ai`. Change its password before any real use.

## How to use

1. **Faculty** register, then open **Manage student list** and add the class students.
2. **Students** open the register page, enter their college email, enter the 6-digit code, set a password and capture their face.
3. **Faculty** create an exam and publish it. Students get a reminder email.
4. **Students** verify their face, accept the rules and take the exam in fullscreen.
5. **Faculty** open **View recordings** to see the student list, scores, flags and videos.

## Limitations

- Speech recognition works only in Chrome or Edge, needs internet, and can miss whispering.
- A web browser cannot see background apps or Bluetooth devices.
- Lighting and camera quality can cause false flags.
- Webcam and recording raise privacy and storage concerns.
- Reminder emails only go out while the backend is running.
- Large-scale concurrent testing has not been done.

## Roadmap

- Phone and second-monitor detection
- Risk score, evidence photos, and confirm or dismiss for flags
- Answer reports and PDF export
- Result emails
- Shuffled questions, live monitor, extra time for a student
- Auto-save of answers and a pre-exam system check
- Image questions and coding questions with test cases

## Security note

Never commit `.env`, `nexam.db` or the `recordings` folder. They are listed in `.gitignore`.
