import re
import json

with open('scripts/extracted_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

pages = text.split('--- PAGE ')

course_definitions = [
    # Sem 3 courses
    {
        "id": "crs-ce25-bsc12ce05",
        "code": "25BSC12CE05",
        "title": "Discrete Mathematics and Graph Theory",
        "sem": 3,
        "type": "THEORY",
        "vertical": "BSESC",
        "sub_vertical": "BSC",
        "total_credits": 2,
        "pre_requisites": "BSC11CE01, BSC11CE03",
        "pstart": 8,
        "pend": 9,
        "components": [
            {"type": "TH", "hours": 2, "ise": 20, "mse": 30, "ise2": 20, "ese": 30, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-pcc12ce05",
        "code": "25PCC12CE05",
        "title": "Computer Organization and Architecture",
        "sem": 3,
        "type": "THEORY_LAB",
        "vertical": "PCPEC",
        "sub_vertical": "PCC",
        "total_credits": 3,
        "pre_requisites": "PCC11CE03",
        "pstart": 10,
        "pend": 12,
        "components": [
            {"type": "TH", "hours": 2, "ise": 20, "mse": 30, "ise2": 20, "ese": 30, "total": 100, "credits": 2},
            {"type": "PR", "hours": 2, "ise": 20, "mse": None, "ise2": 30, "ese": None, "total": 50, "credits": 1}
        ]
    },
    {
        "id": "crs-ce25-pcc12ce06",
        "code": "25PCC12CE06",
        "title": "Data Structures",
        "sem": 3,
        "type": "THEORY_LAB",
        "vertical": "PCPEC",
        "sub_vertical": "PCC",
        "total_credits": 4,
        "pre_requisites": "ESC11CE03",
        "pstart": 13,
        "pend": 15,
        "components": [
            {"type": "TH", "hours": 3, "ise": 20, "mse": 50, "ise2": 30, "ese": 50, "total": 150, "credits": 3},
            {"type": "PR", "hours": 2, "ise": 20, "mse": None, "ise2": 30, "ese": None, "total": 50, "credits": 1}
        ]
    },
    {
        "id": "crs-ce25-pcc12ce07",
        "code": "25PCC12CE07",
        "title": "Object Oriented Programming with JAVA",
        "sem": 3,
        "type": "LAB",
        "vertical": "PCPEC",
        "sub_vertical": "PCC",
        "total_credits": 1,
        "pre_requisites": "ESC11CE03",
        "pstart": 16,
        "pend": 19,
        "components": [
            {"type": "PR", "hours": 2, "ise": 20, "mse": None, "ise2": 30, "ese": None, "total": 50, "credits": 1}
        ]
    },
    {
        "id": "crs-ce25-oe13ce11",
        "code": "25OE13CE11",
        "title": "Law for Engineers",
        "sem": 3,
        "type": "THEORY",
        "vertical": "MDC",
        "sub_vertical": "OE",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 20,
        "pend": 21,
        "components": [
            {"type": "TH", "hours": 2, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-oe13ce12",
        "code": "25OE13CE12",
        "title": "Financial Planning, Taxation and Investment",
        "sem": 3,
        "type": "THEORY",
        "vertical": "MDC",
        "sub_vertical": "OE",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 22,
        "pend": 23,
        "components": [
            {"type": "TH", "hours": 2, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-mdmxx1",
        "code": "25MDMXX1",
        "title": "MDM Course - 1",
        "sem": 3,
        "type": "THEORY",
        "vertical": "MDC",
        "sub_vertical": "MDM",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 20,
        "pend": 20,
        "components": [
            {"type": "TH", "hours": 2, "ise": 20, "mse": 30, "ise2": 20, "ese": 30, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-mdmxx2",
        "code": "25MDMXX2",
        "title": "MDM Course - 2",
        "sem": 3,
        "type": "THEORY",
        "vertical": "MDC",
        "sub_vertical": "MDM",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 20,
        "pend": 20,
        "components": [
            {"type": "TH", "hours": 2, "ise": 20, "mse": 30, "ise2": 20, "ese": 30, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-aec12ce021",
        "code": "25AEC12CE021",
        "title": "Sanskrit for Beginners",
        "sem": 3,
        "type": "THEORY",
        "vertical": "HSSM",
        "sub_vertical": "AEC",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 24,
        "pend": 25,
        "components": [
            {"type": "TH", "hours": 2, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-aec12ce022",
        "code": "25AEC12CE022",
        "title": "Tamil for Beginners",
        "sem": 3,
        "type": "THEORY",
        "vertical": "HSSM",
        "sub_vertical": "AEC",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 26,
        "pend": 27,
        "components": [
            {"type": "TH", "hours": 2, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-aec12ce023",
        "code": "25AEC12CE023",
        "title": "Kannada for Beginners",
        "sem": 3,
        "type": "THEORY",
        "vertical": "HSSM",
        "sub_vertical": "AEC",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 28,
        "pend": 29,
        "components": [
            {"type": "TH", "hours": 2, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-aec12ce024",
        "code": "25AEC12CE024",
        "title": "Telugu for Beginners",
        "sem": 3,
        "type": "THEORY",
        "vertical": "HSSM",
        "sub_vertical": "AEC",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 30,
        "pend": 31,
        "components": [
            {"type": "TH", "hours": 2, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-vec12ce01",
        "code": "25VEC12CE01",
        "title": "Human Values and Professional Ethics",
        "sem": 3,
        "type": "THEORY_LAB",
        "vertical": "HSSM",
        "sub_vertical": "VEC",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 32,
        "pend": 33,
        "components": [
            {"type": "TH", "hours": 1, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 1},
            {"type": "PR", "hours": 2, "ise": None, "mse": None, "ise2": None, "ese": None, "total": None, "credits": 1}
        ]
    },
    {
        "id": "crs-ce25-cep12ce01",
        "code": "25CEP12CE01",
        "title": "Community Engagement Project",
        "sem": 3,
        "type": "PROJECT",
        "vertical": "EL",
        "sub_vertical": "CEFP",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 34,
        "pend": 36,
        "components": [
            {"type": "PRJ", "hours": 4, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-dmx1",
        "code": "25DMX1",
        "title": "Double Minor Course",
        "sem": 3,
        "type": "THEORY",
        "vertical": "DM",
        "sub_vertical": "DM",
        "total_credits": 4,
        "pre_requisites": "Nil",
        "pstart": 37,
        "pend": 38,
        "components": [
            {"type": "TH", "hours": 2, "ise": 20, "mse": 30, "ise2": 20, "ese": 30, "total": 100, "credits": 2},
            {"type": "TU", "hours": 2, "ise": 20, "mse": None, "ise2": 30, "ese": None, "total": 50, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-hr02",
        "code": "25HR02",
        "title": "Honors with Research",
        "sem": 3,
        "type": "LAB",
        "vertical": "HR",
        "sub_vertical": "HR",
        "total_credits": 4,
        "pre_requisites": "Nil",
        "pstart": 37,
        "pend": 37,
        "components": [
            {"type": "PR", "hours": 4, "ise": None, "mse": None, "ise2": None, "ese": None, "total": None, "credits": 4}
        ]
    },
    {
        "id": "crs-ce25-hmm11ce01",
        "code": "25HMM11CE01",
        "title": "Introduction to Emerging Technologies",
        "sem": 3,
        "type": "THEORY",
        "vertical": "DM/RM",
        "sub_vertical": "DM/RM",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 37,
        "pend": 38,
        "components": [
            {"type": "TH", "hours": 2, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    },

    # Sem 4 courses
    {
        "id": "crs-ce25-bsc12ce06",
        "code": "25BSC12CE06",
        "title": "Linear Algebra and Business Statistics",
        "sem": 4,
        "type": "THEORY",
        "vertical": "BSESC",
        "sub_vertical": "BSC",
        "total_credits": 2,
        "pre_requisites": "BSC11CE01, BSC11CE03",
        "pstart": 39,
        "pend": 40,
        "components": [
            {"type": "TH", "hours": 2, "ise": 20, "mse": 30, "ise2": 20, "ese": 30, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-pcc12ce08",
        "code": "25PCC12CE08",
        "title": "Database Management Systems",
        "sem": 4,
        "type": "THEORY_LAB",
        "vertical": "PCPEC",
        "sub_vertical": "PCC",
        "total_credits": 3,
        "pre_requisites": "PCC12CE06",
        "pstart": 41,
        "pend": 43,
        "components": [
            {"type": "TH", "hours": 2, "ise": 20, "mse": 30, "ise2": 20, "ese": 30, "total": 100, "credits": 2},
            {"type": "PR", "hours": 2, "ise": 20, "mse": None, "ise2": 30, "ese": None, "total": 50, "credits": 1}
        ]
    },
    {
        "id": "crs-ce25-pcc12ce09",
        "code": "25PCC12CE09",
        "title": "Analysis of Algorithm",
        "sem": 4,
        "type": "THEORY_LAB",
        "vertical": "PCPEC",
        "sub_vertical": "PCC",
        "total_credits": 4,
        "pre_requisites": "PCC12CE06",
        "pstart": 44,
        "pend": 46,
        "components": [
            {"type": "TH", "hours": 3, "ise": 20, "mse": 50, "ise2": 30, "ese": 50, "total": 150, "credits": 3},
            {"type": "PR", "hours": 2, "ise": 20, "mse": None, "ise2": 30, "ese": None, "total": 50, "credits": 1}
        ]
    },
    {
        "id": "crs-ce25-pcc12ce010",
        "code": "25PCC12CE010",
        "title": "Operating Systems",
        "sem": 4,
        "type": "THEORY_LAB",
        "vertical": "PCPEC",
        "sub_vertical": "PCC",
        "total_credits": 3,
        "pre_requisites": "PCC12CE05",
        "pstart": 47,
        "pend": 49,
        "components": [
            {"type": "TH", "hours": 2, "ise": 20, "mse": 30, "ise2": 20, "ese": 30, "total": 100, "credits": 2},
            {"type": "PR", "hours": 2, "ise": 20, "mse": None, "ise2": 30, "ese": None, "total": 50, "credits": 1}
        ]
    },
    {
        "id": "crs-ce25-oe13ce21",
        "code": "25OE13CE21",
        "title": "Emerging Technology and Law",
        "sem": 4,
        "type": "THEORY",
        "vertical": "MDC",
        "sub_vertical": "OE",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 50,
        "pend": 51,
        "components": [
            {"type": "TH", "hours": 2, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-oe13ce22",
        "code": "25OE13CE22",
        "title": "Principles of Management",
        "sem": 4,
        "type": "THEORY",
        "vertical": "MDC",
        "sub_vertical": "OE",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 52,
        "pend": 54,
        "components": [
            {"type": "TH", "hours": 2, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-mdmxx3",
        "code": "25MDMXX3",
        "title": "MDM Course - 3",
        "sem": 4,
        "type": "THEORY",
        "vertical": "MDC",
        "sub_vertical": "MDM",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 50,
        "pend": 50,
        "components": [
            {"type": "TH", "hours": 2, "ise": 20, "mse": 30, "ise2": 20, "ese": 30, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-vse12ce03",
        "code": "25VSE12CE03",
        "title": "Full Stack Development",
        "sem": 4,
        "type": "LAB",
        "vertical": "SC",
        "sub_vertical": "VSEC",
        "total_credits": 2,
        "pre_requisites": "PCC12CE07",
        "pstart": 55,
        "pend": 57,
        "components": [
            {"type": "PR", "hours": 4, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-eem12ce02",
        "code": "25EEM12CE02",
        "title": "Technology Entrepreneurship",
        "sem": 4,
        "type": "THEORY",
        "vertical": "HSSM",
        "sub_vertical": "EEMC",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 58,
        "pend": 59,
        "components": [
            {"type": "TH", "hours": 2, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-vec12ce02",
        "code": "25VEC12CE02",
        "title": "Technology Innovation for Sustainable Development",
        "sem": 4,
        "type": "THEORY_LAB",
        "vertical": "HSSM",
        "sub_vertical": "VEC",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 60,
        "pend": 61,
        "components": [
            {"type": "TH", "hours": 1, "ise": 40, "mse": None, "ise2": 60, "ese": None, "total": 100, "credits": 1},
            {"type": "PR", "hours": 2, "ise": None, "mse": None, "ise2": None, "ese": None, "total": None, "credits": 1}
        ]
    },
    {
        "id": "crs-ce25-dmx2",
        "code": "25DMX2",
        "title": "Double Minor Course",
        "sem": 4,
        "type": "THEORY",
        "vertical": "DM",
        "sub_vertical": "DM",
        "total_credits": 4,
        "pre_requisites": "Nil",
        "pstart": 58,
        "pend": 58,
        "components": [
            {"type": "TH", "hours": 2, "ise": 20, "mse": 30, "ise2": 20, "ese": 30, "total": 100, "credits": 2},
            {"type": "TU", "hours": 2, "ise": 20, "mse": None, "ise2": 30, "ese": None, "total": 50, "credits": 2}
        ]
    },
    {
        "id": "crs-ce25-hr03",
        "code": "25HR03",
        "title": "Honors with Research",
        "sem": 4,
        "type": "LAB",
        "vertical": "HR",
        "sub_vertical": "HR",
        "total_credits": 4,
        "pre_requisites": "Nil",
        "pstart": 58,
        "pend": 58,
        "components": [
            {"type": "PR", "hours": 4, "ise": None, "mse": None, "ise2": None, "ese": None, "total": None, "credits": 4}
        ]
    },
    {
        "id": "crs-ce25-bc",
        "code": "BC",
        "title": "MOOC",
        "sem": 4,
        "type": "THEORY",
        "vertical": "BC",
        "sub_vertical": "BC",
        "total_credits": 2,
        "pre_requisites": "Nil",
        "pstart": 58,
        "pend": 58,
        "components": [
            {"type": "TH", "hours": 2, "ise": 50, "mse": None, "ise2": 50, "ese": None, "total": 100, "credits": 2}
        ]
    }
]

print(f"Total courses configured: {len(course_definitions)}")

