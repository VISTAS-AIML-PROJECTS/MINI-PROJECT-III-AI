import warnings
warnings.filterwarnings("ignore")

import os
import json
import shutil
import hashlib
import threading
from datetime import datetime
from urllib.parse import quote_plus

import torch
import easyocr
import ollama

from langchain_core.documents import Document

from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    UnstructuredPowerPointLoader,
)

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter
)

from langchain_huggingface import (
    HuggingFaceEmbeddings
)

from langchain_community.vectorstores import (
    Chroma
)


class RAGBackend:

    # =====================================================
    # INITIALIZATION
    # =====================================================

    def __init__(self):

        self.base_dir = os.path.dirname(
            os.path.abspath(__file__)
        )

        self.rag_root = os.path.join(
            self.base_dir,
            "rag_data"
        )

        os.makedirs(
            self.rag_root,
            exist_ok=True
        )

        self.subject_data = {}

        self.current_subject = None

        self.reader = None

        self.embeddings = None

        self.current_device = None

        self.lock = threading.Lock()

        self.status = {
            "state": "idle",
            "message": "Ready",
            "progress": 0
        }


    # =====================================================
    # PATH HELPERS
    # =====================================================

    def _safe_name(self, subject):

        value = "".join(
            c
            if c.isalnum() or c in " -_"
            else "_"
            for c in str(subject)
        )

        value = "_".join(
            value.strip().split()
        )

        return value or "Subject"


    def _subject_dir(self, subject):

        return os.path.join(
            self.rag_root,
            self._safe_name(subject)
        )


    def _documents_dir(self, subject):

        return os.path.join(
            self._subject_dir(subject),
            "documents"
        )


    def _chroma_dir(self, subject):

        return os.path.join(
            self._subject_dir(subject),
            "chroma"
        )


    def _tests_file(self, subject):

        return os.path.join(
            self._subject_dir(subject),
            "tests.json"
        )


    def _metadata_file(self, subject):

        return os.path.join(
            self._subject_dir(subject),
            "subject.json"
        )


    # =====================================================
    # JSON HELPERS
    # =====================================================

    def _write_json(
        self,
        path,
        data
    ):

        os.makedirs(
            os.path.dirname(path),
            exist_ok=True
        )

        temp_path = path + ".tmp"

        with open(
            temp_path,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                data,
                file,
                indent=4,
                ensure_ascii=False
            )

        os.replace(
            temp_path,
            path
        )


    def _read_json(
        self,
        path,
        default
    ):

        try:

            if os.path.exists(path):

                with open(
                    path,
                    "r",
                    encoding="utf-8"
                ) as file:

                    return json.load(file)

        except Exception as error:

            print(
                "[JSON ERROR]",
                error
            )

        return default


    # =====================================================
    # STATUS
    # =====================================================

    def _set_status(
        self,
        state,
        message,
        progress=0
    ):

        self.status = {

            "state":
                state,

            "message":
                message,

            "progress":
                max(
                    0,
                    min(
                        100,
                        int(progress)
                    )
                )

        }

        print(
            f"[RAG STATUS] {message}"
        )


    def get_status(self):

        return dict(
            self.status
        )


    # =====================================================
    # GPU
    # =====================================================

    def check_gpu(self):

        if torch.cuda.is_available():

            return {

                "available":
                    True,

                "name":
                    torch.cuda.get_device_name(0)

            }

        return {

            "available":
                False,

            "name":
                None

        }


    # =====================================================
    # SUBJECT INITIALIZATION
    # =====================================================

    def initialize_subject(
        self,
        subject
    ):

        if not subject:
            return


        documents_dir = (
            self._documents_dir(
                subject
            )
        )

        chroma_dir = (
            self._chroma_dir(
                subject
            )
        )

        os.makedirs(
            documents_dir,
            exist_ok=True
        )

        os.makedirs(
            chroma_dir,
            exist_ok=True
        )


        metadata_file = (
            self._metadata_file(
                subject
            )
        )

        tests_file = (
            self._tests_file(
                subject
            )
        )


        if not os.path.exists(
            metadata_file
        ):

            self._write_json(

                metadata_file,

                {

                    "subject":
                        subject,

                    "loaded_files":
                        [],

                    "topics":
                        [],

                    "created_at":
                        datetime.now()
                        .isoformat(
                            timespec="seconds"
                        )

                }

            )


        if not os.path.exists(
            tests_file
        ):

            self._write_json(
                tests_file,
                []
            )


        metadata = (
            self._read_json(
                metadata_file,
                {}
            )
        )


        if subject not in self.subject_data:

            self.subject_data[
                subject
            ] = {

                "documents":
                    [],

                "loaded_files":
                    metadata.get(
                        "loaded_files",
                        []
                    ),

                "topics":
                    metadata.get(
                        "topics",
                        []
                    ),

                "vector_db":
                    None,

                "retriever":
                    None

            }


    # =====================================================
    # SET SUBJECT
    # =====================================================

    def set_subject(
        self,
        subject
    ):

        if not subject:

            self.current_subject = None

            return {

                "success":
                    False,

                "message":
                    "No subject selected."

            }


        self.initialize_subject(
            subject
        )

        self.current_subject = subject


        return {

            "success":
                True,

            "subject":
                subject

        }


    # =====================================================
    # CURRENT SUBJECT
    # =====================================================

    def get_current_subject(self):

        return self.current_subject


    # =====================================================
    # EMBEDDINGS
    # =====================================================

    def initialize_embeddings(self):

        if self.embeddings is not None:
            return


        self._set_status(
            "processing",
            "Loading AI embedding model...",
            65
        )


        self.embeddings = (
            HuggingFaceEmbeddings(

                model_name=
                    "sentence-transformers/"
                    "all-MiniLM-L6-v2"

            )
        )


        print(
            "Embedding model ready."
        )


    # =====================================================
    # OCR
    # =====================================================

    def initialize_ocr(
        self,
        use_gpu=False
    ):

        device = (

            "cuda"

            if
            use_gpu
            and
            torch.cuda.is_available()

            else
            "cpu"

        )


        if (

            self.reader is not None

            and

            self.current_device
            ==
            device

        ):

            return


        self._set_status(
            "processing",
            (
                f"Initializing OCR "
                f"using {device.upper()}..."
            ),
            8
        )


        self.reader = easyocr.Reader(

            ["en"],

            gpu=(
                device == "cuda"
            )

        )


        self.current_device = device


    # =====================================================
    # LOAD PERSISTENT VECTOR DATABASE
    # =====================================================

    def _get_vector_db(
        self,
        subject
    ):

        self.initialize_subject(
            subject
        )


        data = (
            self.subject_data[
                subject
            ]
        )


        if data["vector_db"] is None:

            self.initialize_embeddings()


            db_dir = (
                self._chroma_dir(
                    subject
                )
            )


            data["vector_db"] = (
                Chroma(

                    collection_name=
                        "study_material",

                    embedding_function=
                        self.embeddings,

                    persist_directory=
                        db_dir

                )
            )


            data["retriever"] = (
                data["vector_db"]
                .as_retriever(

                    search_kwargs={
                        "k": 8
                    }

                )
            )


        return data[
            "vector_db"
        ]


    # =====================================================
    # LOAD FILE
    # =====================================================

    def _load_file(
        self,
        file_path,
        subject,
        use_gpu=False
    ):

        ext = (
            os.path.splitext(
                file_path
            )[1]
            .lower()
        )


        # -----------------------------------------
        # PDF
        # -----------------------------------------

        if ext == ".pdf":

            docs = (
                PyPDFLoader(
                    file_path
                ).load()
            )


            for doc in docs:

                doc.metadata[
                    "subject"
                ] = subject

                doc.metadata[
                    "source"
                ] = file_path


            return docs


        # -----------------------------------------
        # DOCX
        # -----------------------------------------

        if ext == ".docx":

            docs = (
                Docx2txtLoader(
                    file_path
                ).load()
            )


            for doc in docs:

                doc.metadata[
                    "subject"
                ] = subject

                doc.metadata[
                    "source"
                ] = file_path


            return docs


        # -----------------------------------------
        # PPTX
        # -----------------------------------------

        if ext == ".pptx":

            docs = (
                UnstructuredPowerPointLoader(
                    file_path
                ).load()
            )


            for doc in docs:

                doc.metadata[
                    "subject"
                ] = subject

                doc.metadata[
                    "source"
                ] = file_path


            return docs


        # -----------------------------------------
        # TEXT
        # -----------------------------------------

        if ext == ".txt":

            try:

                with open(
                    file_path,
                    "r",
                    encoding="utf-8",
                    errors="ignore"
                ) as file:

                    text = file.read().strip()

                if not text:
                    return []

                return [
                    Document(
                        page_content=text,
                        metadata={
                            "subject": subject,
                            "source": file_path
                        }
                    )
                ]

            except Exception as error:

                print(
                    "[TEXT FILE ERROR]",
                    error
                )

                return []


        # -----------------------------------------
        # IMAGE
        # -----------------------------------------

        if ext in [
            ".png",
            ".jpg",
            ".jpeg"
        ]:

            self.initialize_ocr(
                use_gpu
            )


            ocr_text = "\n".join(

                self.reader.readtext(
                    file_path,
                    detail=0
                )

            ).strip()


            vision_text = ""


            try:

                vision = ollama.chat(

                    model="llava",

                    messages=[

                        {

                            "role":
                                "user",

                            "content":
                                (
                                    "Analyze this educational "
                                    "image and describe all "
                                    "important text, diagrams, "
                                    "formulas, labels and "
                                    "concepts visible."
                                ),

                            "images":
                                [
                                    file_path
                                ]

                        }

                    ]

                )


                vision_text = (

                    vision
                    .get(
                        "message",
                        {}
                    )
                    .get(
                        "content",
                        ""
                    )
                    .strip()

                )

            except Exception as error:

                print(
                    "[VISION ERROR]",
                    error
                )


            combined_text = (

                "OCR TEXT:\n"
                +
                ocr_text
                +
                "\n\nVISION ANALYSIS:\n"
                +
                vision_text

            ).strip()


            if not combined_text:

                return []


            return [

                Document(

                    page_content=
                        combined_text,

                    metadata={

                        "subject":
                            subject,

                        "source":
                            file_path

                    }

                )

            ]


        return []


    # =====================================================
    # REBUILD SUBJECT DATABASE
    # =====================================================

    def _rebuild_subject_db(
        self,
        subject,
        use_gpu=False
    ):

        documents_dir = (
            self._documents_dir(
                subject
            )
        )


        files = [

            os.path.join(
                documents_dir,
                filename
            )

            for filename in
            os.listdir(
                documents_dir
            )

            if os.path.isfile(

                os.path.join(
                    documents_dir,
                    filename
                )

            )

        ]


        if not files:

            return (

                False,

                "No study materials found."

            )


        documents = []


        total = len(files)


        for index, file_path in enumerate(
            files,
            start=1
        ):

            self._set_status(

                "processing",

                (
                    f"Reading "
                    f"{os.path.basename(file_path)} "
                    f"({index}/{total})..."
                ),

                15
                +
                int(

                    (
                        (
                            index - 1
                        )
                        /
                        max(
                            1,
                            total
                        )
                    )
                    *
                    35

                )

            )


            try:

                loaded = (
                    self._load_file(

                        file_path,

                        subject,

                        use_gpu

                    )
                )


                documents.extend(
                    loaded
                )


            except Exception as error:

                print(
                    "[FILE ERROR]",
                    error
                )


        if not documents:

            return (

                False,

                "No readable study material was found."

            )


        # -----------------------------------------
        # CHUNK
        # -----------------------------------------

        self._set_status(

            "processing",

            "Splitting study materials into sections...",

            55

        )


        splitter = (
            RecursiveCharacterTextSplitter(

                chunk_size=
                    1000,

                chunk_overlap=
                    100

            )
        )


        chunks = (
            splitter.split_documents(
                documents
            )
        )


        if not chunks:

            return (

                False,

                "No text chunks could be created."

            )


        print(
            f"Chunks created: {len(chunks)}"
        )


        # -----------------------------------------
        # EMBEDDINGS
        # -----------------------------------------

        self.initialize_embeddings()


        self._set_status(

            "processing",

            (
                f"Building {subject} "
                "AI knowledge base..."
            ),

            80

        )


        db_dir = (
            self._chroma_dir(
                subject
            )
        )


        # -----------------------------------------
        # REMOVE OLD CHROMA
        # -----------------------------------------

        try:

            old_db = (
                Chroma(

                    collection_name=
                        "study_material",

                    embedding_function=
                        self.embeddings,

                    persist_directory=
                        db_dir

                )
            )


            try:

                old_db.delete_collection()

            except Exception:
                pass


        except Exception:
            pass


        # -----------------------------------------
        # CREATE NEW CHROMA
        # -----------------------------------------

        vector_db = (
            Chroma.from_documents(

                documents=
                    chunks,

                embedding=
                    self.embeddings,

                collection_name=
                    "study_material",

                persist_directory=
                    db_dir

            )
        )


        retriever = (
            vector_db
            .as_retriever(

                search_kwargs={
                    "k": 8
                }

            )
        )


        data = (
            self.subject_data[
                subject
            ]
        )


        data[
            "documents"
        ] = documents


        data[
            "vector_db"
        ] = vector_db


        data[
            "retriever"
        ] = retriever


        return (

            True,

            f"Indexed {len(chunks)} chunks."

        )


    # =====================================================
    # UPLOAD DOCUMENTS
    # =====================================================

    def load_documents(
        self,
        subject,
        file_paths,
        use_gpu=False
    ):

        with self.lock:

            try:

                if not subject:

                    return {

                        "success":
                            False,

                        "message":
                            "Please select a subject first."

                    }


                if not file_paths:

                    return {

                        "success":
                            False,

                        "message":
                            "No files selected."

                    }


                self.set_subject(
                    subject
                )


                if (

                    use_gpu
                    and
                    not torch.cuda.is_available()

                ):

                    use_gpu = False


                self._set_status(

                    "processing",

                    (
                        f"Preparing "
                        f"{subject} study materials..."
                    ),

                    5

                )


                documents_dir = (
                    self._documents_dir(
                        subject
                    )
                )


                copied_files = []


                allowed_extensions = {

                    ".pdf",
                    ".docx",
                    ".pptx",
                    ".txt",
                    ".png",
                    ".jpg",
                    ".jpeg"

                }


                for index, source in enumerate(
                    file_paths,
                    start=1
                ):

                    extension = (
                        os.path.splitext(
                            source
                        )[1]
                        .lower()
                    )


                    if extension not in (
                        allowed_extensions
                    ):

                        continue


                    if not os.path.isfile(
                        source
                    ):

                        continue


                    filename = (
                        os.path.basename(
                            source
                        )
                    )


                    destination = (
                        os.path.join(

                            documents_dir,

                            filename

                        )
                    )


                    if os.path.exists(
                        destination
                    ):

                        file_hash = (
                            hashlib.sha1(

                                source.encode(
                                    "utf-8"
                                )

                            )
                            .hexdigest()[
                                :8
                            ]
                        )


                        stem, suffix = (
                            os.path.splitext(
                                filename
                            )
                        )


                        destination = (
                            os.path.join(

                                documents_dir,

                                (
                                    f"{stem}_"
                                    f"{file_hash}"
                                    f"{suffix}"
                                )

                            )
                        )


                    shutil.copy2(

                        source,

                        destination

                    )


                    copied_files.append(

                        os.path.basename(
                            destination
                        )

                    )


                    self._set_status(

                        "processing",

                        (
                            f"Added "
                            f"{os.path.basename(destination)}..."
                        ),

                        10
                        +
                        int(

                            (
                                index
                                /
                                max(
                                    1,
                                    len(file_paths)
                                )
                            )
                            *
                            30

                        )

                    )


                if not copied_files:

                    return {

                        "success":
                            False,

                        "message":
                            "No supported files were selected."

                    }


                success, message = (
                    self._rebuild_subject_db(

                        subject,

                        use_gpu

                    )
                )


                if not success:

                    self._set_status(
                        "error",
                        message,
                        0
                    )


                    return {

                        "success":
                            False,

                        "message":
                            message

                    }


                loaded_files = sorted(

                    filename

                    for filename in
                    os.listdir(
                        documents_dir
                    )

                    if os.path.isfile(

                        os.path.join(
                            documents_dir,
                            filename
                        )

                    )

                )


                metadata = (
                    self._read_json(

                        self._metadata_file(
                            subject
                        ),

                        {}

                    )
                )


                metadata[
                    "loaded_files"
                ] = loaded_files


                self._write_json(

                    self._metadata_file(
                        subject
                    ),

                    metadata

                )


                self.subject_data[
                    subject
                ][
                    "loaded_files"
                ] = loaded_files


                self._set_status(

                    "ready",

                    (
                        f"{subject} study materials "
                        "loaded successfully."
                    ),

                    100

                )


                return {

                    "success":
                        True,

                    "message":
                        (
                            f"Successfully loaded "
                            f"{len(copied_files)} "
                            f"file(s) into {subject}."
                        ),

                    "files":
                        copied_files,

                    "subject":
                        subject,

                    "device":
                        (
                            "GPU"
                            if use_gpu
                            else
                            "CPU"
                        )

                }


            except Exception as error:

                self._set_status(

                    "error",

                    str(error),

                    0

                )


                print(
                    "[UPLOAD ERROR]",
                    error
                )


                return {

                    "success":
                        False,

                    "message":
                        str(error)

                }


    # =====================================================
    # ASK AI
    # =====================================================

    def ask_question(
        self,
        query,
        subject=None
    ):

        try:

            subject = (
                subject
                or
                self.current_subject
            )


            if not subject:

                return (
                    "Please select a subject first."
                )


            self.set_subject(
                subject
            )


            data = (
                self.subject_data[
                    subject
                ]
            )


            if data[
                "retriever"
            ] is None:

                self._get_vector_db(
                    subject
                )


            query = (
                query or ""
            ).strip()


            if not query:

                return (
                    "Please enter a question."
                )


            self._set_status(

                "thinking",

                (
                    f"Searching "
                    f"{subject} study materials..."
                ),

                30

            )


            results = (
                data[
                    "retriever"
                ].invoke(
                    query
                )
            )


            context = "\n\n".join(

                doc.page_content

                for doc in results

                if doc.page_content

            )


            self._set_status(

                "thinking",

                "Generating AI answer...",

                70

            )


            prompt = f"""
You are an AI study assistant.

The student is studying:

{subject}

Answer the question using ONLY the
uploaded study material below.

If the answer cannot be found, say:

"I couldn't find this information in your
uploaded study materials."

STUDY MATERIAL:

{context}

STUDENT QUESTION:

{query}
"""


            response = ollama.chat(

                model="llama3",

                messages=[

                    {

                        "role":
                            "user",

                        "content":
                            prompt

                    }

                ],

                options={

                    "num_gpu":
                        0,

                    "temperature":
                        0.2

                }

            )


            answer = (
                response
                .get(
                    "message",
                    {}
                )
                .get(
                    "content",
                    ""
                )
                .strip()
            )


            self._set_status(
                "ready",
                "Ready",
                100
            )


            return answer


        except Exception as error:

            self._set_status(

                "error",

                str(error),

                0

            )


            return (
                f"An error occurred: {error}"
            )


    # =====================================================
    # AI STUDY ZONE CHAT
    # =====================================================

    def _build_web_resources(
        self,
        subject,
        topic,
        question
    ):

        """
        Build safe, deterministic external study links.

        These are search links rather than AI-generated URLs,
        so the tutor never invents a fake website or video.
        """

        search_text = (
            f"{subject} {topic} {question}"
        ).strip()

        encoded = quote_plus(
            search_text
        )

        topic_encoded = quote_plus(
            f"{subject} {topic}"
        )

        return [

            {
                "title":
                    "YouTube videos",

                "description":
                    (
                        f"Video explanations for "
                        f"{topic}."
                    ),

                "url":
                    (
                        "https://www.youtube.com/results"
                        f"?search_query={topic_encoded}"
                    ),

                "type":
                    "youtube"
            },

            {
                "title":
                    "Web references",

                "description":
                    (
                        f"Web results for "
                        f"{topic} and the question."
                    ),

                "url":
                    (
                        "https://www.google.com/search"
                        f"?q={encoded}"
                    ),

                "type":
                    "web"
            },

            {
                "title":
                    "Wikipedia",

                "description":
                    (
                        f"Background reference for "
                        f"{topic}."
                    ),

                "url":
                    (
                        "https://en.wikipedia.org/w/index.php"
                        f"?search={topic_encoded}"
                    ),

                "type":
                    "wikipedia"
            }

        ]


    # =====================================================
    # AI STUDY ZONE CHAT
    # =====================================================

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


            question = str(
                question or ""
            ).strip()


            if not question:

                return {
                    "success":
                        False,

                    "message":
                        "Please enter a question."
                }


            self.set_subject(
                subject
            )


            self.initialize_subject(
                subject
            )


            data = (
                self.subject_data[
                    subject
                ]
            )


            if data[
                "retriever"
            ] is None:

                self._get_vector_db(
                    subject
                )


            self._set_status(

                "thinking",

                (
                    f"Finding information "
                    f"about {topic}..."
                ),

                20

            )


            search_query = f"""
Subject:
{subject}

Current Topic:
{topic}

Student Question:
{question}
"""


            results = (
                data[
                    "retriever"
                ].invoke(
                    search_query
                )
            )


            context_parts = []


            for document in results:

                content = (
                    getattr(
                        document,
                        "page_content",
                        ""
                    )
                )


                if content:

                    context_parts.append(
                        content
                    )


            context = (
                "\n\n".join(
                    context_parts
                )
            )


            # -----------------------------------------
            # TEMPORARY ATTACHMENT
            # -----------------------------------------

            attachment_context = ""

            attachment_name = ""


            if attachment_path:

                attachment_name = (
                    os.path.basename(
                        str(
                            attachment_path
                        )
                    )
                )


                self._set_status(

                    "thinking",

                    (
                        f"Reading attached "
                        f"file {attachment_name}..."
                    ),

                    35

                )


                try:

                    supported_extensions = {

                        ".pdf",
                        ".docx",
                        ".pptx",
                        ".txt",
                        ".png",
                        ".jpg",
                        ".jpeg"

                    }


                    attachment_ext = (
                        os.path.splitext(
                            str(
                                attachment_path
                            )
                        )[1]
                        .lower()
                    )


                    if attachment_ext not in (
                        supported_extensions
                    ):

                        return {

                            "success":
                                False,

                            "message":
                                (
                                    "This file type is "
                                    "not supported."
                                )

                        }


                    if not os.path.isfile(
                        attachment_path
                    ):

                        return {

                            "success":
                                False,

                            "message":
                                (
                                    "The attached file "
                                    "could not be found."
                                )

                        }


                    attached_documents = (
                        self._load_file(

                            attachment_path,

                            subject,

                            False

                        )
                    )


                    attachment_parts = []


                    for document in (
                        attached_documents
                    ):

                        content = (
                            getattr(
                                document,
                                "page_content",
                                ""
                            )
                        )


                        if content:

                            attachment_parts.append(
                                content
                            )


                    attachment_context = (
                        "\n\n".join(
                            attachment_parts
                        )
                    )


                except Exception as error:

                    print(
                        "[ATTACHMENT ERROR]",
                        error
                    )


                    return {

                        "success":
                            False,

                        "message":
                            (
                                "I could not read the "
                                f"attached file: {error}"
                            )

                    }


            if attachment_context.strip():

                context += (

                    "\n\n"
                    "STUDENT ATTACHED FILE:\n\n"
                    +
                    attachment_context

                )


            if not context.strip():

                return {

                    "success":
                        False,

                    "message":
                        (
                            "I couldn't find relevant "
                            "information in the uploaded "
                            "study material or attached file."
                        ),

                    "resources":
                        self._build_web_resources(
                            subject,
                            topic,
                            question
                        )

                }


            # -----------------------------------------
            # CHAT HISTORY
            # -----------------------------------------

            history_text = ""


            if chat_history:

                for message in (
                    chat_history[-8:]
                ):

                    if not isinstance(
                        message,
                        dict
                    ):

                        continue


                    role = str(
                        message.get(
                            "role",
                            "user"
                        )
                    )


                    content = str(
                        message.get(
                            "content",
                            ""
                        )
                    ).strip()


                    if content:

                        history_text += (

                            f"{role.upper()}: "
                            f"{content}\n"

                        )


            # -----------------------------------------
            # GENERATE ANSWER
            # -----------------------------------------

            self._set_status(

                "thinking",

                "Preparing your answer...",

                60

            )


            attachment_instruction = ""


            if attachment_context.strip():

                attachment_instruction = """

The student attached a file for this doubt.

Use the attached file when the question
refers to it. Treat it as temporary context
for this conversation only. Do not claim that
the file was part of the permanent study
material.

Attached file:
{attachment_name}
""".format(
                    attachment_name=
                        attachment_name
                )


            prompt = f"""
You are the personal AI tutor inside a
college study portal.

Subject:
{subject}

Current topic:
{topic}

Student question:
{question}

Previous conversation:
{history_text}

Use the uploaded study material below
as your primary source.

If an attached file is present, use it as
additional evidence for the student's doubt.

{attachment_instruction}

UPLOADED STUDY MATERIAL:

{context}

INSTRUCTIONS:

1. Answer the student's actual question.

2. Explain the concept clearly and simply.

3. Use examples when useful.

4. Stay focused on the current topic.

5. Do not invent information and claim
   that it came from the uploaded material.

6. If the material does not contain
   enough information, clearly say so.

7. Do not mention RAG, embeddings,
   vector databases, retrieval,
   chunks or prompts.

8. Use previous conversation when
   answering follow-up questions.

9. Respond like a helpful personal tutor.

10. Do not invent URLs or pretend that
    you visited websites.

11. External learning links are supplied
    separately by the application.
"""


            response = ollama.chat(

                model="llama3",

                messages=[

                    {
                        "role":
                            "user",

                        "content":
                            prompt
                    }

                ],

                options={

                    "num_gpu":
                        0,

                    "temperature":
                        0.2
                }

            )


            answer = (

                response
                .get(
                    "message",
                    {}
                )
                .get(
                    "content",
                    ""
                )
                .strip()

            )


            if not answer:

                return {

                    "success":
                        False,

                    "message":
                        "The AI returned an empty answer."

                }


            self._set_status(

                "ready",

                "Answer ready.",

                100

            )


            return {

                "success":
                    True,

                "subject":
                    subject,

                "topic":
                    topic,

                "question":
                    question,

                "answer":
                    answer,

                "attachment":
                    (
                        attachment_name
                        if attachment_context.strip()
                        else None
                    ),

                "resources":
                    self._build_web_resources(
                        subject,
                        topic,
                        question
                    )

            }


        except Exception as error:

            self._set_status(

                "error",

                str(error),

                0

            )


            print(
                "[STUDY CHAT ERROR]",
                error
            )


            return {

                "success":
                    False,

                "message":
                    str(error),

                "resources":
                    self._build_web_resources(
                        subject,
                        topic,
                        question
                    )

            }


    # =====================================================
    # DISCOVER TOPICS
    # =====================================================

    def _discover_topics(
        self,
        subject
    ):

        self.set_subject(
            subject
        )


        data = (
            self.subject_data[
                subject
            ]
        )


        if data[
            "vector_db"
        ] is None:

            self._get_vector_db(
                subject
            )


        self._set_status(

            "thinking",

            (
                f"Analyzing "
                f"{subject} topics..."
            ),

            15

        )


        results = (
            data[
                "vector_db"
            ].similarity_search(

                (
                    "important concepts "
                    "chapters topics "
                    "definitions formulas "
                    "principles methods "
                    "examples problems"
                ),

                k=20

            )
        )


        context = "\n\n".join(

            doc.page_content

            for doc in results

            if doc.page_content

        )


        if not context.strip():

            return []


        prompt = f"""
You are analyzing study material for:

{subject}

Identify the major academic topics that
a student should be assessed on.

Return ONLY valid JSON.

Use exactly:

{{
    "topics": [
        "Topic 1",
        "Topic 2",
        "Topic 3"
    ]
}}

Do not include:

- "General"
- "Diagnostic Questions"
- "AI Assistant"
- "Questions"
- "Study Material"

Only return real academic topics found
in the material.

STUDY MATERIAL:

{context}
"""


        try:

            response = ollama.chat(

                model="llama3",

                messages=[

                    {

                        "role":
                            "user",

                        "content":
                            prompt

                    }

                ],

                options={

                    "num_gpu":
                        0,

                    "temperature":
                        0.1

                },

                format="json"

            )


            raw = (
                response
                .get(
                    "message",
                    {}
                )
                .get(
                    "content",
                    ""
                )
                .strip()
            )


            parsed = json.loads(
                raw
            )


            topics = parsed.get(
                "topics",
                []
            )


            cleaned = []


            for topic in topics:

                topic = str(
                    topic
                ).strip()


                if not topic:
                    continue


                bad_terms = [

                    "general",

                    "diagnostic questions",

                    "diagnostic question",

                    "ai assistant",

                    "questions",

                    "study material",

                    "study materials"

                ]


                if any(

                    bad in topic.lower()

                    for bad in bad_terms

                ):

                    continue


                if topic not in cleaned:

                    cleaned.append(
                        topic
                    )


            return cleaned[:12]


        except Exception as error:

            print(
                "[TOPIC DISCOVERY ERROR]",
                error
            )

            return []


    # =====================================================
    # QUESTION ALLOCATION
    # =====================================================

    def _allocate_questions(
        self,
        topics,
        question_count
    ):

        if not topics:

            return {
                "General":
                    question_count
            }


        topic_count = len(
            topics
        )


        allocation = {}

        base = (
            question_count
            //
            topic_count
        )


        remainder = (
            question_count
            %
            topic_count
        )


        for index, topic in enumerate(
            topics
        ):

            allocation[
                topic
            ] = (

                base

                +

                (
                    1
                    if
                    index < remainder
                    else
                    0
                )

            )


        return allocation


    # =====================================================
    # GENERATE QUESTIONS FOR TOPIC
    # =====================================================

    def _generate_topic_questions(
        self,
        subject,
        topic,
        count
    ):

        if count <= 0:

            return []


        data = (
            self.subject_data[
                subject
            ]
        )


        results = (
            data[
                "vector_db"
            ].similarity_search(

                topic,

                k=max(
                    8,
                    count * 3
                )

            )
        )


        context = "\n\n".join(

            doc.page_content

            for doc in results

            if doc.page_content

        )


        if not context.strip():

            return []


        prompt = f"""
You are an educational assessment generator.

Subject:
{subject}

Topic:
{topic}

Generate exactly {count} multiple-choice
questions using ONLY the material below.

Each question must contain:

- question
- options
- answer
- topic

There must be exactly four options.

The answer must be A, B, C or D.

Questions should test understanding,
application and problem solving.

Return ONLY valid JSON.

Use exactly:

{{
    "questions": [
        {{
            "question": "Question text",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "answer": "B",
            "topic": "{topic}"
        }}
    ]
}}

Do not use markdown.

STUDY MATERIAL:

{context}
"""


        try:

            response = ollama.chat(

                model="llama3",

                messages=[

                    {

                        "role":
                            "user",

                        "content":
                            prompt

                    }

                ],

                options={

                    "num_gpu":
                        0,

                    "temperature":
                        0.2

                },

                format="json"

            )


            raw = (
                response
                .get(
                    "message",
                    {}
                )
                .get(
                    "content",
                    ""
                )
                .strip()
            )


            parsed = json.loads(
                raw
            )


            questions = parsed.get(
                "questions",
                []
            )


            if isinstance(
                questions,
                dict
            ):

                questions = [
                    questions
                ]


            valid = []


            for question in questions:

                if not isinstance(
                    question,
                    dict
                ):

                    continue


                text = str(

                    question.get(
                        "question",
                        ""
                    )

                ).strip()


                options = (
                    question.get(
                        "options",
                        []
                    )
                )


                answer = str(

                    question.get(
                        "answer",
                        ""
                    )

                ).strip().upper()


                if not text:
                    continue


                if not isinstance(
                    options,
                    list
                ):

                    continue


                options = [

                    str(
                        option
                    ).strip()

                    for option in options

                    if str(
                        option
                    ).strip()

                ]


                if len(options) != 4:
                    continue


                if answer not in [
                    "A",
                    "B",
                    "C",
                    "D"
                ]:

                    continue


                answer_index = (
                    ord(answer)
                    -
                    ord("A")
                )


                valid.append({

                    "question":
                        text,

                    "options":
                        options,

                    "answer":
                        options[
                            answer_index
                        ],

                    "topic":
                        topic

                })


            return valid


        except Exception as error:

            print(
                "[QUESTION GENERATION ERROR]",
                error
            )

            return []


    # =====================================================
    # GENERATE DIAGNOSTIC
    # =====================================================

    def generate_diagnostic(
        self,
        subject,
        question_count=25
    ):

        try:

            self.set_subject(
                subject
            )


            self.initialize_subject(
                subject
            )


            data = (
                self.subject_data[
                    subject
                ]
            )


            if not data[
                "loaded_files"
            ]:

                return {

                    "success":
                        False,

                    "message":
                        (
                            f"No study materials "
                            f"are loaded for {subject}."
                        )

                }


            if data[
                "vector_db"
            ] is None:

                self._get_vector_db(
                    subject
                )


            # -----------------------------------------
            # DISCOVER TOPICS
            # -----------------------------------------

            topics = (
                self._discover_topics(
                    subject
                )
            )


            if not topics:

                topics = [
                    "General"
                ]


            # -----------------------------------------
            # QUESTION COUNT
            # -----------------------------------------

            question_count = max(

                15,

                min(

                    int(
                        question_count
                    ),

                    30

                )

            )


            allocation = (
                self._allocate_questions(

                    topics,

                    question_count

                )
            )


            # -----------------------------------------
            # GENERATE
            # -----------------------------------------

            all_questions = []


            topic_count = len(
                allocation
            )


            for index, (
                topic,
                count
            ) in enumerate(

                allocation.items(),

                start=1

            ):

                progress = (

                    25

                    +

                    int(

                        (
                            (
                                index - 1
                            )
                            /
                            max(
                                1,
                                topic_count
                            )
                        )
                        *
                        65

                    )

                )


                self._set_status(

                    "thinking",

                    (
                        f"Generating "
                        f"{topic} questions "
                        f"({index}/{topic_count})..."
                    ),

                    progress

                )


                questions = (
                    self._generate_topic_questions(

                        subject,

                        topic,

                        count

                    )
                )


                all_questions.extend(
                    questions
                )


            # -----------------------------------------
            # CHECK
            # -----------------------------------------

            if len(
                all_questions
            ) < 10:

                return {

                    "success":
                        False,

                    "message":
                        (
                            "The AI could not generate "
                            "enough valid diagnostic "
                            "questions from the uploaded "
                            "material."
                        )

                }


            # -----------------------------------------
            # SHUFFLE
            # -----------------------------------------

            import random

            random.shuffle(
                all_questions
            )


            all_questions = (
                all_questions[
                    :question_count
                ]
            )


            self._set_status(

                "ready",

                (
                    f"Diagnostic generated "
                    f"with {len(all_questions)} "
                    f"questions."
                ),

                100

            )


            return {

                "success":
                    True,

                "subject":
                    subject,

                "topics":
                    topics,

                "allocation":
                    allocation,

                "questions":
                    all_questions,

                "question_count":
                    len(
                        all_questions
                    )

            }


        except Exception as error:

            self._set_status(

                "error",

                str(error),

                0

            )


            print(
                "[DIAGNOSTIC ERROR]",
                error
            )


            return {

                "success":
                    False,

                "message":
                    str(error)

            }


    # =====================================================
    # PERSONALIZED STUDY LESSON
    # =====================================================

    def generate_study_lesson(
        self,
        subject,
        topic,
        score=None
    ):

        try:

            self.set_subject(
                subject
            )


            self.initialize_subject(
                subject
            )


            data = (
                self.subject_data[
                    subject
                ]
            )


            if data[
                "vector_db"
            ] is None:

                self._get_vector_db(
                    subject
                )


            self._set_status(

                "thinking",

                (
                    f"Finding material "
                    f"for {topic}..."
                ),

                20

            )


            results = (
                data[
                    "vector_db"
                ].similarity_search(

                    topic,

                    k=8

                )
            )


            context = "\n\n".join(

                document.page_content

                for document in results

                if document.page_content

            )


            if not context.strip():

                return {

                    "success":
                        False,

                    "message":
                        (
                            f"No uploaded material "
                            f"was found for {topic}."
                        )

                }


            score_instruction = ""


            if score is not None:

                score_instruction = f"""

The student's diagnostic score for this
topic was {score}%.

If the score is below 50%, focus heavily
on fundamentals.

If the score is 50-69%, focus on
misconceptions, examples and application.

If the score is 70% or above, focus on
deeper understanding and reinforcement.
"""


            self._set_status(

                "thinking",

                (
                    f"Creating personalized "
                    f"lesson for {topic}..."
                ),

                60

            )


            prompt = f"""
You are the AI tutor inside a personalized
college study portal.

Subject:
{subject}

Weak Topic:
{topic}

{score_instruction}

Use ONLY the uploaded study material.

Create a clear study lesson using these
headings:

# Topic Overview

# Key Concepts

# Important Details

# Example

# Common Mistakes

# Quick Check

For Quick Check, provide 3 short questions.

Do not invent facts that are unsupported
by the uploaded material.

Do not mention RAG, embeddings, vector
databases, retrieval or chunks.

UPLOADED STUDY MATERIAL:

{context}
"""


            response = ollama.chat(

                model="llama3",

                messages=[

                    {

                        "role":
                            "user",

                        "content":
                            prompt

                    }

                ],

                options={

                    "num_gpu":
                        0,

                    "temperature":
                        0.2

                }

            )


            lesson = (

                response
                .get(
                    "message",
                    {}
                )
                .get(
                    "content",
                    ""
                )
                .strip()

            )


            if not lesson:

                return {

                    "success":
                        False,

                    "message":
                        "The AI returned an empty lesson."

                }


            self._set_status(

                "ready",

                (
                    f"Study lesson ready "
                    f"for {topic}."
                ),

                100

            )


            return {

                "success":
                    True,

                "subject":
                    subject,

                "topic":
                    topic,

                "score":
                    score,

                "lesson":
                    lesson

            }


        except Exception as error:

            self._set_status(

                "error",

                str(error),

                0

            )


            print(
                "[STUDY LESSON ERROR]",
                error
            )


            return {

                "success":
                    False,

                "message":
                    str(error)

            }


    # =====================================================
    # LOADED FILES
    # =====================================================

    def get_loaded_files(
        self,
        subject=None
    ):

        subject = (
            subject
            or
            self.current_subject
        )


        if not subject:

            return []


        self.initialize_subject(
            subject
        )


        documents_dir = (
            self._documents_dir(
                subject
            )
        )


        if not os.path.exists(
            documents_dir
        ):

            return []


        files = [

            filename

            for filename in
            os.listdir(
                documents_dir
            )

            if os.path.isfile(

                os.path.join(
                    documents_dir,
                    filename
                )

            )

        ]


        files = sorted(
            files
        )


        self.subject_data[
            subject
        ][
            "loaded_files"
        ] = files


        return files


    # =====================================================
    # TEST RESULTS
    # =====================================================

    def get_test_results(
        self,
        subject
    ):

        if not subject:

            return []


        self.initialize_subject(
            subject
        )


        return self._read_json(

            self._tests_file(
                subject
            ),

            []

        )


    # =====================================================
    # SAVE TEST RESULT
    # =====================================================

    def save_test_result(
        self,
        subject,
        result
    ):

        if not subject:

            return {

                "success":
                    False,

                "message":
                    "No subject selected."

            }


        self.initialize_subject(
            subject
        )


        tests = (
            self.get_test_results(
                subject
            )
        )


        if not isinstance(
            tests,
            list
        ):

            tests = []


        tests.append(
            result
        )


        self._write_json(

            self._tests_file(
                subject
            ),

            tests

        )


        return {

            "success":
                True,

            "tests":
                tests

        }


    # =====================================================
    # CLEAR DOCUMENTS
    # =====================================================

    def clear_documents(
        self,
        subject=None
    ):

        subject = (
            subject
            or
            self.current_subject
        )


        if not subject:

            return {

                "success":
                    False,

                "message":
                    "No subject selected."

            }


        shutil.rmtree(

            self._documents_dir(
                subject
            ),

            ignore_errors=True

        )


        shutil.rmtree(

            self._chroma_dir(
                subject
            ),

            ignore_errors=True

        )


        os.makedirs(

            self._documents_dir(
                subject
            ),

            exist_ok=True

        )


        os.makedirs(

            self._chroma_dir(
                subject
            ),

            exist_ok=True

        )


        self.subject_data[
            subject
        ] = {

            "documents":
                [],

            "loaded_files":
                [],

            "topics":
                [],

            "vector_db":
                None,

            "retriever":
                None

        }


        metadata = (
            self._read_json(

                self._metadata_file(
                    subject
                ),

                {}

            )
        )


        metadata[
            "loaded_files"
        ] = []


        metadata[
            "topics"
        ] = []


        self._write_json(

            self._metadata_file(
                subject
            ),

            metadata

        )


        return {

            "success":
                True,

            "message":
                (
                    f"All {subject} study "
                    "materials cleared."
                )

        }


    # =====================================================
    # DELETE SUBJECT
    # =====================================================

    def delete_subject(
        self,
        subject
    ):

        shutil.rmtree(

            self._subject_dir(
                subject
            ),

            ignore_errors=True

        )


        self.subject_data.pop(
            subject,
            None
        )


        if (
            self.current_subject
            ==
            subject
        ):

            self.current_subject = None


        return {

            "success":
                True,

            "message":
                (
                    f"{subject} deleted successfully."
                )

        }