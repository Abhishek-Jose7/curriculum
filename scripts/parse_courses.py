import re

with open('scripts/extracted_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

pages = text.split('--- PAGE ')

course_spans = [
    ("25BSC12CE05", "Discrete Mathematics and Graph Theory", 3, "THEORY", "BSESC", "BSC", 2, 8, 9),
    ("25PCC12CE05", "Computer Organization and Architecture", 3, "THEORY_LAB", "PCPEC", "PCC", 3, 10, 12),
    ("25PCC12CE06", "Data Structures", 3, "THEORY_LAB", "PCPEC", "PCC", 4, 13, 15),
    ("25PCC12CE07", "Object Oriented Programming with Java", 3, "LAB", "PCPEC", "PCC", 1, 16, 19),
    ("25OE13CE11", "Law for Engineers", 3, "THEORY", "MDC", "OE", 2, 20, 21),
    ("25OE13CE12", "Financial Planning, Taxation and Investment", 3, "THEORY", "MDC", "OE", 2, 22, 23),
    ("25AEC12CE021", "Sanskrit for Beginners", 3, "THEORY", "HSSM", "AEC", 2, 24, 25),
    ("25AEC12CE022", "Tamil for Beginners", 3, "THEORY", "HSSM", "AEC", 2, 26, 27),
    ("25AEC12CE023", "Kannada for Beginners", 3, "THEORY", "HSSM", "AEC", 2, 28, 29),
    ("25AEC12CE024", "Telugu for Beginners", 3, "THEORY", "HSSM", "AEC", 2, 30, 31),
    ("25VEC12CE01", "Human Values and Professional Ethics", 3, "THEORY_LAB", "HSSM", "VEC", 2, 32, 33),
    ("25CEP12CE01", "Community Engagement Project", 3, "PROJECT", "EL", "CEFP", 2, 34, 36),
    ("25HMM11CE01", "Introduction to Emerging Technologies", 3, "THEORY", "DM", "DM", 2, 37, 38),
    ("25BSC12CE06", "Linear Algebra and Business Statistics", 4, "THEORY", "BSESC", "BSC", 2, 39, 40),
    ("25PCC12CE08", "Database Management Systems", 4, "THEORY_LAB", "PCPEC", "PCC", 3, 41, 43),
    ("25PCC12CE09", "Analysis of Algorithm", 4, "THEORY_LAB", "PCPEC", "PCC", 4, 44, 46),
    ("25PCC12CE010", "Operating Systems", 4, "THEORY_LAB", "PCPEC", "PCC", 3, 47, 49),
    ("25OE13CE21", "Emerging Technology and Law", 4, "THEORY", "MDC", "OE", 2, 50, 51),
    ("25OE13CE22", "Principles of Management", 4, "THEORY", "MDC", "OE", 2, 52, 54),
    ("25VSE12CE03", "Full Stack Development", 4, "LAB", "SC", "VSEC", 2, 55, 57),
    ("25EEM12CE02", "Technology Entrepreneurship", 4, "THEORY", "HSSM", "EEMC", 2, 58, 59),
    ("25VEC12CE02", "Technology Innovation for Sustainable Development", 4, "THEORY_LAB", "HSSM", "VEC", 2, 60, 61),
]

print(f"Total defined courses: {len(course_spans)}")
for c in course_spans:
    code, title, sem, ctype, vert, subvert, creds, pstart, pend = c
    combined_page_text = " ".join([pages[p] for p in range(pstart, pend + 1)])
    cos = re.findall(r'CO\d\s+([A-Z][^C]+?)(?=CO\d|Module|Total|$)', combined_page_text)
    print(f"{code} ({title}): Found {len(cos)} COs, pages {pstart}-{pend}")

