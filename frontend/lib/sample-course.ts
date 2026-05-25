import type { CourseDraft } from "@/types/curriculum";

export const sampleCourse: CourseDraft = {
  id: 1,
  code: "CS301",
  title: "Data Structures and Algorithms",
  course_type: "THEORY",
  status: "DRAFT",
  faculty_name: "Dr. Meera Sharma",
  last_modified: "2026-05-13 18:40",
  objectives: "Introduce algorithmic thinking, abstract data types, implementation trade-offs, and complexity-aware problem solving.",
  pre_requisites: "Programming fundamentals, discrete mathematics, and basic problem solving.",
  syllabus_intro: "The course develops practical and analytical fluency in linear and non-linear data structures used in engineering software systems.",
  lecture_hours: 3,
  tutorial_hours: 1,
  practical_hours: 0,
  credits: 4,
  internal_marks: 40,
  external_marks: 60,
  duration_hours: 3,
  outcomes: [
    { code: "CO1", description: "Apply linear and non-linear data structures to solve computational problems.", bloom_level: "Apply", order: 1 },
    { code: "CO2", description: "Analyze time and space complexity for operations on core data structures.", bloom_level: "Analyze", order: 2 },
    { code: "CO3", description: "Design efficient algorithms using trees, graphs, hashing, and priority queues.", bloom_level: "Create", order: 3 }
  ],
  modules: [
    {
      number: 1,
      title: "Linear Data Structures",
      contact_hours: 10,
      content: "Arrays, linked lists, stacks, queues, circular queues, priority queues, applications and implementation analysis.",
      topics: [
        { title: "Stacks", description: "ADT operations, infix-postfix conversion, expression evaluation." },
        { title: "Queues", description: "Linear, circular, deque, and priority queue implementations." }
      ]
    },
    {
      number: 2,
      title: "Trees and Graphs",
      contact_hours: 12,
      content: "Binary trees, traversal methods, search trees, balanced tree overview, graph representation, BFS, DFS, shortest paths.",
      topics: [
        { title: "Binary Search Trees", description: "Insertion, deletion, searching, traversal complexity." },
        { title: "Graph Traversal", description: "Breadth-first and depth-first traversal strategies." }
      ]
    }
  ],
  experiments: [
    { number: 1, title: "Stack and Queue ADTs", description: "Implement stack and queue operations with array and linked representations.", hours: 2 },
    { number: 2, title: "Graph Traversal", description: "Implement BFS and DFS for adjacency matrix and adjacency list representations.", hours: 2 }
  ],
  assessments: [
    { component: "Continuous Assessment", marks: 20, description: "Assignments, quizzes, and classroom participation." },
    { component: "Internal Test", marks: 20, description: "Two internal written examinations." },
    { component: "End Semester Examination", marks: 60, description: "University theory examination." }
  ],
  reference_books: [
    { title: "Data Structures and Algorithm Analysis", authors: "Mark Allen Weiss", publisher: "Pearson", edition: "3rd", year: "2012", is_textbook: true },
    { title: "Introduction to Algorithms", authors: "Cormen, Leiserson, Rivest, Stein", publisher: "MIT Press", edition: "4th", year: "2022", is_textbook: false }
  ],
  comments: [
    { id: 1, section_key: "modules.2", section_label: "Module 2", body: "Add AVL tree rotations or clarify that balanced trees are overview only.", reviewer_name: "Prof. Anand Rao", is_resolved: false },
    { id: 2, section_key: "outcomes", section_label: "Course Outcomes", body: "CO3 should map to a measurable assessment component.", reviewer_name: "Prof. Anand Rao", is_resolved: false }
  ],
  online_resources: ["https://visualgo.net/en", "https://ocw.mit.edu"]
};
