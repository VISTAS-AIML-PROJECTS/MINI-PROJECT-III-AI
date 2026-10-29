# NEXAM: Online Examination and Real-Time System for Assessment Management

**NEXAM** is a web-based examination platform that integrates online assessments, identity verification, AI-assisted proctoring, automated evaluation, and faculty monitoring into one affordable system built using open web technologies.

## Authors

- **B. Soniya Mary** — Undergraduate Scholar
- **G. Poojitha** — Undergraduate Scholar
- **A. Sharmila** — Undergraduate Scholar
- **Ms. Mohana Priya** — Associate Professor

**Department:** Artificial Intelligence and Machine Learning  
**Institution:** Vels Institute of Science, Technology & Advanced Studies (VISTAS)  
**Location:** Chennai, Tamil Nadu, India

## Abstract

Online examinations are widely used in educational institutions, but existing systems may be expensive, rely on inadequate monitoring, or unfairly penalize students due to false alerts. NEXAM addresses these challenges through an integrated, affordable online examination and real-time assessment management platform.

Registration is restricted to students on faculty-uploaded college lists and verified through official college email addresses, helping prevent unauthorized and duplicate accounts. Face descriptors captured during registration are compared with live webcam frames before and throughout examinations.

Computer vision and object detection identify suspicious conditions, including absent faces, additional persons, mobile phones, and extra monitors. Live speech-to-text analysis helps identify potentially suspicious vocal activity.

NEXAM emphasizes fair proctoring through a tiered system of flags, warnings, and examination termination, supported by a grace period to reduce false alarms. Each flag is associated with a timestamp in the session recording and an evidence photograph. A risk score helps faculty prioritize reviews, while faculty members can confirm or dismiss flags before they count toward malpractice decisions. Students terminated for suspected malpractice are still graded on the answers they submitted.

The platform supports text, image, and coding questions with test-case-based evaluation, per-student question shuffling, individualized extra time, live faculty monitoring, automated email reminders and results, detailed student answer reports, and roll-number-wise PDF report exports.

NEXAM also recognizes limitations involving privacy, bandwidth, lighting, network quality, background application detection, Bluetooth device detection, and large-scale concurrent examinations. These limitations guide future development.

## Keywords

Online Examination, Face Recognition, Proctoring System, Object Detection, Academic Integrity, Speech Detection, Automated Evaluation.

## Key Features

### 1. Secure Student Registration
- Faculty-uploaded student eligibility lists.
- Verification through official college email.
- Prevention of unauthorized and duplicate registrations.

### 2. AI-Assisted Examination Proctoring
- Face verification before and during examinations.
- Detection of absent faces and additional persons.
- Identification of mobile phones and extra monitors.
- Speech-to-text analysis for potentially suspicious vocal activity.

### 3. Fair Malpractice Detection
- Tiered flags, warnings, and termination policies.
- Grace periods to reduce false alarms.
- Timestamp-linked evidence photographs and session recordings.
- Risk-based prioritization of faculty reviews.
- Faculty confirmation or dismissal of flagged incidents.

### 4. Flexible Online Assessments
- Text-based, image-based, and coding questions.
- Automated coding evaluation using test cases.
- Per-student question shuffling.
- Individualized extra examination time.

### 5. Faculty Dashboard and Reporting
- Live examination monitoring.
- Student activity and risk review.
- Automated email reminders and result notifications.
- Detailed student answer reports.
- Roll-number-wise PDF report exports.

### 6. Student Results and Feedback
- Automated evaluation where supported.
- Detailed reports of submitted answers.
- Fair grading of answers submitted before examination termination.

## System Workflow

1. Faculty uploads the eligible student list and creates an examination.
2. Students register using their official college email addresses.
3. The system verifies student identity and captures face descriptors.
4. Students complete identity verification before starting the examination.
5. The examination system presents questions and monitors activity during the session.
6. Potentially suspicious events are flagged and linked to supporting evidence.
7. Faculty reviews the flags and confirms or dismisses them.
8. Answers are evaluated, results are generated, and reports are made available.

## Technology Overview

NEXAM is designed around open web technologies and integrates examination management with computer vision, identity verification, object detection, speech analysis, and automated evaluation.

Specific frameworks, libraries, models, and database technologies should be documented according to the actual implementation.

## Limitations

- Webcam and microphone usage introduces privacy considerations.
- Video processing and continuous monitoring may require substantial bandwidth.
- Detection accuracy can vary with lighting and network conditions.
- Standard browser-based monitoring cannot reliably detect all background applications or Bluetooth devices.
- Large-scale concurrent examination performance requires further testing.

## Future Enhancements

- Improved detection accuracy and reduced false positives.
- Stronger privacy controls and secure evidence management.
- Performance optimization for large-scale concurrent examinations.
- Improved accessibility and support for diverse student needs.
- Further evaluation of proctoring reliability under different examination conditions.

## Conclusion

NEXAM aims to make online examinations more accessible, secure, and fair by combining identity verification, real-time proctoring, automated assessment, and faculty supervision in a unified platform. Its emphasis on evidence-based review and human oversight helps balance academic integrity with fairness to students.

## Institution

**Vels Institute of Science, Technology & Advanced Studies (VISTAS)**  
Department of Artificial Intelligence and Machine Learning  
Chennai, Tamil Nadu, India.
