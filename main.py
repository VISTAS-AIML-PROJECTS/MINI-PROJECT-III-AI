import os
import json
import webview

from RAG import RAGBackend


class Api:

    # ==========================================
    # INITIALIZATION
    # ==========================================

    def __init__(self):

        self.rag = RAGBackend()

        self.data_file = os.path.join(
            os.path.dirname(
                os.path.abspath(__file__)
            ),
            "subjects.json"
        )

        self.subjects = []

        self.load_subjects()

        for subject in self.subjects:

            self.rag.initialize_subject(
                subject
            )




    # ==========================================
    # STUDY ZONE ATTACHMENT
    # ==========================================

    def select_study_attachment(self):

        from tkinter import Tk
        from tkinter.filedialog import askopenfilename

        root = Tk()
        root.withdraw()

        root.attributes(
            "-topmost",
            True
        )

        root.update()

        file_path = askopenfilename(

            parent=root,

            title="Attach File to AI Tutor",

            filetypes=[

                (
                    "Supported Files",
                    "*.pdf *.docx *.pptx *.txt *.png *.jpg *.jpeg"
                ),

                (
                    "All Files",
                    "*.*"
                )

            ]

        )

        root.destroy()

        return file_path or ""


    # ==========================================
    # AI STUDY ZONE CHAT
    # ==========================================

    def ask_study_zone(
        self,
        subject,
        topic,
        question,
        chat_history=None,
        attachment_path=None
    ):

        try:

            if not subject:

                return {
                    "success":
                        False,

                    "message":
                        "Please select a subject."
                }


            if not topic:

                return {
                    "success":
                        False,

                    "message":
                        "Please select a study topic."
                }


            if not question or not question.strip():

                return {
                    "success":
                        False,

                    "message":
                        "Please enter a question."
                }


            return self.rag.ask_study_zone(

                subject=subject,

                topic=topic,

                question=question,

                chat_history=chat_history or [],

                attachment_path=attachment_path

            )


        except Exception as error:

            print(
                "[STUDY ZONE CHAT ERROR]",
                error
            )


            return {

                "success":
                    False,

                "message":
                    str(error)

            }


    # ==========================================
    # GPU
    # ==========================================

    def check_gpu(self):

        return self.rag.check_gpu()


    # ==========================================
    # SUBJECTS
    # ==========================================

    def load_subjects(self):

        if not os.path.exists(
            self.data_file
        ):

            self.subjects = []

            return


        try:

            with open(
                self.data_file,
                "r",
                encoding="utf-8"
            ) as file:

                data = json.load(file)


            self.subjects = data.get(
                "subjects",
                []
            )


        except Exception as error:

            print(
                "Error loading subjects:",
                error
            )

            self.subjects = []


    def save_subjects(self):

        with open(
            self.data_file,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(

                {
                    "subjects":
                        self.subjects
                },

                file,

                indent=4,

                ensure_ascii=False

            )


    def list_subjects(self):

        return self.subjects


    # ==========================================
    # ADD SUBJECT
    # ==========================================

    def add_subject(
        self,
        subject
    ):

        subject = (
            subject or ""
        ).strip()


        if not subject:

            return {

                "success":
                    False,

                "message":
                    "Subject name cannot be empty."

            }


        if subject in self.subjects:

            return {

                "success":
                    False,

                "message":
                    "This subject already exists."

            }


        self.subjects.append(
            subject
        )


        self.rag.initialize_subject(
            subject
        )


        self.save_subjects()


        print(
            f"[SUBJECT] Created: {subject}"
        )


        return {

            "success":
                True,

            "message":
                f"{subject} added successfully.",

            "subjects":
                self.subjects

        }


    # ==========================================
    # DELETE SUBJECT
    # ==========================================

    def delete_subject(
        self,
        subject
    ):

        if subject not in self.subjects:

            return {

                "success":
                    False,

                "message":
                    "Subject not found."

            }


        self.subjects.remove(
            subject
        )


        self.rag.delete_subject(
            subject
        )


        self.save_subjects()


        return {

            "success":
                True,

            "message":
                f"{subject} deleted successfully.",

            "subjects":
                self.subjects

        }


    # ==========================================
    # SELECT FILES
    # ==========================================

    def select_documents(self):

        from tkinter import Tk

        from tkinter.filedialog import (
            askopenfilenames
        )


        root = Tk()

        root.withdraw()

        root.attributes(
            "-topmost",
            True
        )

        root.update()


        files = askopenfilenames(

            parent=root,

            title=
                "Select Study Materials",

            filetypes=[

                (
                    "Supported Files",
                    "*.pdf *.docx *.pptx *.png *.jpg *.jpeg"
                ),

                (
                    "All Files",
                    "*.*"
                )

            ]

        )


        root.destroy()


        return list(files)


    # ==========================================
    # UPLOAD
    # ==========================================

    def load_documents(
        self,
        subject,
        file_paths,
        use_gpu=False
    ):

        return self.rag.load_documents(

            subject,

            file_paths,

            use_gpu

        )


    # ==========================================
    # SET SUBJECT
    # ==========================================

    def set_subject(
        self,
        subject
    ):

        if subject not in self.subjects:

            return {

                "success":
                    False,

                "message":
                    "Subject not found."

            }


        return self.rag.set_subject(
            subject
        )


    # ==========================================
    # LOADED FILES
    # ==========================================

    def get_loaded_files(
        self,
        subject=None
    ):

        return self.rag.get_loaded_files(
            subject
        )


    # ==========================================
    # ASK AI
    # ==========================================

    def ask_ai(
        self,
        question,
        subject=None
    ):

        return self.rag.ask_question(

            question,

            subject

        )
    # =====================================================
    # AI STUDY ZONE CHAT
    # =====================================================

    # ==========================================
    # CLEAR DOCUMENTS
    # ==========================================

    def clear_documents(
        self,
        subject=None
    ):

        return self.rag.clear_documents(
            subject
        )


    # ==========================================
    # DIAGNOSTIC
    # ==========================================

    def take_new_diagnostic(
        self,
        subject
    ):

        if not subject:

            return {

                "success":
                    False,

                "message":
                    "Please select a subject first."

            }


        if subject not in self.subjects:

            return {

                "success":
                    False,

                "message":
                    "Subject not found."

            }


        loaded_files = (
            self.rag.get_loaded_files(
                subject
            )
        )


        if not loaded_files:

            return {

                "success":
                    False,

                "message":
                    (
                        f"No study materials are "
                        f"loaded for {subject}. "
                        f"Please upload material first."
                    )

            }


        return self.rag.generate_diagnostic(

            subject,

            25

        )


    # ==========================================
    # SAVE DIAGNOSTIC RESULT
    # ==========================================

    def save_diagnostic_result(
        self,
        subject,
        result
    ):

        if subject not in self.subjects:

            return {

                "success":
                    False,

                "message":
                    "Subject not found."

            }


        return self.rag.save_test_result(

            subject,

            result

        )


    # ==========================================
    # GET TEST RESULTS
    # ==========================================

    def get_test_results(
        self,
        subject
    ):

        return self.rag.get_test_results(
            subject
        )


    # ==========================================
    # AI STUDY ZONE
    # ==========================================

    def get_study_zone(
        self,
        subject
    ):

        if not subject:

            return {

                "success":
                    False,

                "message":
                    "Please select a subject."

            }


        if subject not in self.subjects:

            return {

                "success":
                    False,

                "message":
                    "Subject not found."

            }


        tests = (
            self.rag.get_test_results(
                subject
            )
        )


        if not tests:

            return {

                "success":
                    True,

                "has_test":
                    False,

                "topics":
                    []

            }


        latest_test = tests[-1]


        topic_stats = (
            latest_test.get(
                "topicStats",
                {}
            )
        )


        topics = []


        for topic, stats in (
            topic_stats.items()
        ):

            total = int(
                stats.get(
                    "total",
                    0
                )
            )


            correct = int(
                stats.get(
                    "correct",
                    0
                )
            )


            if total <= 0:

                continue


            percentage = round(

                (
                    correct
                    /
                    total
                )
                *
                100

            )


            if percentage < 70:

                priority = (
                    "High"
                    if percentage < 50
                    else
                    "Medium"
                )


                topics.append({

                    "name":
                        topic,

                    "pct":
                        percentage,

                    "correct":
                        correct,

                    "total":
                        total,

                    "priority":
                        priority

                })


        topics.sort(
            key=lambda item:
                item["pct"]
        )


        return {

            "success":
                True,

            "has_test":
                True,

            "subject":
                subject,

            "score":
                latest_test.get(
                    "score",
                    0
                ),

            "topics":
                topics

        }


    # ==========================================
    # AI STUDY LESSON
    # ==========================================

    def get_study_lesson(
        self,
        subject,
        topic,
        score=None
    ):

        if not subject:

            return {

                "success":
                    False,

                "message":
                    "Please select a subject."

            }


        if subject not in self.subjects:

            return {

                "success":
                    False,

                "message":
                    "Subject not found."

            }


        if not topic:

            return {

                "success":
                    False,

                "message":
                    "Please select a topic."

            }


        return self.rag.generate_study_lesson(

            subject,

            topic,

            score

        )


    # ==========================================
    # DASHBOARD
    # ==========================================

    def get_dashboard_data(
        self,
        subject
    ):

        tests = (
            self.rag.get_test_results(
                subject
            )
        )


        if not tests:

            return {

                "rings": [],

                "topics": [],

                "tests": [],

                "trend": []

            }


        trend = [

            int(
                test.get(
                    "score",
                    0
                )
            )

            for test in tests

        ]


        topic_totals = {}


        for test in tests:

            for topic, stats in (
                test.get(
                    "topicStats",
                    {}
                ).items()
            ):

                if topic not in topic_totals:

                    topic_totals[
                        topic
                    ] = {

                        "correct":
                            0,

                        "total":
                            0

                    }


                topic_totals[
                    topic
                ][
                    "correct"
                ] += int(

                    stats.get(
                        "correct",
                        0
                    )

                )


                topic_totals[
                    topic
                ][
                    "total"
                ] += int(

                    stats.get(
                        "total",
                        0
                    )

                )


        topics = []


        for topic, stats in (
            topic_totals.items()
        ):

            percentage = (

                round(

                    (
                        stats["correct"]
                        /
                        stats["total"]
                    )
                    *
                    100

                )

                if stats["total"]

                else 0

            )


            topics.append({

                "name":
                    topic,

                "pct":
                    percentage

            })


        overall = round(

            sum(trend)
            /
            len(trend)

        )


        latest = trend[-1]


        rings = [

            {

                "label":
                    "Overall",

                "value":
                    overall,

                "caption":
                    "Average diagnostic performance"

            },

            {

                "label":
                    "Latest Test",

                "value":
                    latest,

                "caption":
                    "Most recent diagnostic score"

            },

            {

                "label":
                    "Tests Taken",

                "value":
                    min(
                        len(tests) * 10,
                        100
                    ),

                "caption":
                    f"{len(tests)} diagnostic(s) completed"

            }

        ]


        test_cards = [

            {

                "name":
                    test.get(
                        "name",
                        "Diagnostic Test"
                    ),

                "score":
                    int(
                        test.get(
                            "score",
                            0
                        )
                    ),

                "date":
                    test.get(
                        "date",
                        ""
                    )

            }

            for test in reversed(
                tests[-10:]
            )

        ]


        return {

            "rings":
                rings,

            "topics":
                topics,

            "tests":
                test_cards,

            "trend":
                trend

        }


    # ==========================================
    # STATUS
    # ==========================================

    def get_status(self):

        return self.rag.get_status()


# ==============================================
# START
# ==============================================

def main():

    base_path = os.path.dirname(
        os.path.abspath(__file__)
    )


    frontend_path = os.path.join(
        base_path,
        "index.html"
    )


    api = Api()


    webview.create_window(

        "Study Portal",

        frontend_path,

        js_api=api,

        width=1180,

        height=760,

        min_size=(
            900,
            600
        )

    )


    webview.start(
        debug=False
    )


if __name__ == "__main__":

    main()