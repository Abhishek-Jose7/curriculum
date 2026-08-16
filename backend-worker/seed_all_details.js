const fs = require('fs');

let sql = `
-- Clean up old child records for courses 2, 3, 4
DELETE FROM course_outcomes WHERE course_id IN ('2', '3', '4');
DELETE FROM modules WHERE course_id IN ('2', '3', '4');
DELETE FROM experiments WHERE course_id IN ('2', '3', '4');
DELETE FROM assessment_schemes WHERE course_id IN ('2', '3', '4');
DELETE FROM reference_books WHERE course_id IN ('2', '3', '4');

-- Clean up test dummy courses
DELETE FROM courses WHERE id IN ('4152057d-8cb1-4b7c-baeb-d5ba65e45ba8', 'fc4c473d-18eb-4f83-9a28-bffd600978db', 'fa3e7a92-553b-43d1-8c6c-310dda347b92');
`;

// ==========================================
// COURSE 2: Computer Networks (25PCC13CE11)
// ==========================================
sql += `
UPDATE courses SET
  title = 'Computer Networks',
  course_type = 'THEORY',
  lecture_hours = 2,
  practical_hours = 2,
  credits = 3,
  internal_marks = 50,
  external_marks = 50,
  pre_requisites = 'PCC12CE09',
  objectives = 'Understand network topologies, communication models, routing protocols, transport mechanisms, and network socket programming.',
  syllabus_intro = 'Comprehensive study of computer networks covering OSI & TCP/IP models, Data Link, Network, Transport, and Application layers with packet tracing.'
WHERE id = '2';

INSERT INTO course_outcomes (course_id, code, description, bloom_level, sort_order) VALUES
('2', 'CO1', 'Interpret the basic network structure and analyze utilization of communication devices.', 'Understand', 1),
('2', 'CO2', 'Illustrate the impact of transmission media, multiplexing techniques and switching techniques in computer network.', 'Apply', 2),
('2', 'CO3', 'Use various functionalities of MAC & LLC sublayer.', 'Apply', 3),
('2', 'CO4', 'Classify Functionalities of static & dynamic routing protocol.', 'Analyze', 4),
('2', 'CO5', 'Analyze Transport layer protocols and its impact on quality of service.', 'Analyze', 5),
('2', 'CO6', 'Design network architecture using various network protocol in real time environment.', 'Create', 6);

INSERT INTO modules (course_id, number, title, contact_hours, content, "references") VALUES
('2', 1, 'Introduction to Computer Networks', 3, 'Definition of a Computer Network; Components of a computer network: Classification of networks, network types, Network topologies, networking devices (Hub, Switch, Routers, Firewall, Gateway, NIC, Repeater). Basic Communication System, Switching Techniques, Multiplexing. OSI Reference Model, Introduction to TCP/IP Protocol Suite, Comparison between OSI & TCP/IP Protocol Suite.', '1, 2, 3'),
('2', 2, 'Data Link Layer', 6, 'Introduction To Data Link Layer, Error Detection and Correction (Hamming Code, CRC, Checksum). Elementary Data Link Protocol, Sliding Window Protocol, MAC & LLC Sublayers. Channel Allocation, Multiple Access Protocol: Aloha, CSMA/CD, Collision Free Protocol, Ethernet Protocols, ARP, RARP, 802.X', '1, 2'),
('2', 3, 'Network Layer', 7, 'Introduction to Network Layer, Design issues of Network layer. Addressing: Physical Address, Logical Address, Port Address, And Application Specific Address. Introduction to Interface & Services, Introduction to IPV4 Address: Classful Address, Classless Addressing, Special Address, NAT: Address Translation & translation table. Routing Algorithm: Shortest Path Routing, Dijkstra Algorithm, Flooding, Link State Routing, Count to Infinity problem, Congestion Control Algorithm, Quality of Services: Leaky Bucket Algorithm, Token Bucket Algorithm.', '1, 2'),
('2', 4, 'Transport Layer', 5, 'Introduction of Transport layer Services: Relationship between transport layer & network layer, Multiplexing & Demultiplexing, Connectionless Transport. Transport layer protocol: Go-Back-N, Selective Repeat Protocol, Piggybacking. Connection-Oriented Transport, Principal of congestion control, TCP congestion control.', '1, 2'),
('2', 5, 'Application Layer', 5, 'Introduction of Application layer, principal of network application. Web & HTTP, FTP, SMTP, DHCP, DNS: The internet Directory Services. Peer to Peer Application, Socket programming with UDP & TCP.', '1, 2, 3, 4');

INSERT INTO experiments (course_id, number, title, description, hours) VALUES
('2', 1, 'Cabling and Hardware Study', 'Case Study-Classify various types of cabling used in networking', 2),
('2', 2, 'Networking Devices with Packet Tracer', 'Illustrate various networking devices using Packet Tracer', 2),
('2', 3, 'Error Detection & Correction', 'Use CRC/ Hamming code for error detection and correction', 2),
('2', 4, 'Network Troubleshooting Commands', 'Analyze various Networking Operations and Troubleshooting using command.', 2),
('2', 5, 'IP Addressing and Subnetting', 'Use IP addressing, Subnet and Subnet Mask for given problem statement', 2),
('2', 6, 'Static & Dynamic Routing', 'Create a local area network using Static & Dynamic Routing Protocols in network infrastructure.', 2),
('2', 7, 'Socket Programming & Telnet/SSH', 'Illustrate Socket programming using TCP and Remote Login using Telnet/SSH', 4),
('2', 8, 'VLAN Implementation', 'Illustrate VLAN in network infrastructure', 2),
('2', 9, 'DHCP Configuration', 'Build DHCP Functionality in network infrastructure', 4),
('2', 10, 'Remote Login via Telnet Server', 'Perform Remote login using Telnet server', 2);

INSERT INTO assessment_schemes (course_id, component, marks, description, sort_order) VALUES
('2', 'ISE-1 (Theory)', 20, 'Quiz and assignments', 1),
('2', 'ISE-2 (Theory)', 20, 'Article Discussion, Quiz, Assignments and Reflective Journal', 2),
('2', 'MSE (Theory)', 30, '90 minutes written examination based on 50% syllabus', 3),
('2', 'ESE (Theory)', 30, '90 minutes written examination based on remaining 50% syllabus after MSE', 4),
('2', 'ISE (Lab)', 50, 'Lab ISE-1 (20M) + Lab ISE-2 (20M rubrics + 10M Simulation/Mini Project)', 5);

INSERT INTO reference_books (course_id, title, authors, publisher, edition, year, is_textbook, sort_order) VALUES
('2', 'Computer Networks', 'A.S. Tanenbaum', 'Pearson Education', '5th Edition', '2011', 1, 1),
('2', 'Data Communications and Networking', 'B.A. Forouzan', 'McGraw Hill', '5th Edition', '2013', 1, 2),
('2', 'Computer Networking, A Top-Down Approach Featuring the Internet', 'James F. Kurose, Keith W. Ross', 'Addison Wesley', '6th Edition', '2012', 0, 3),
('2', 'TCP/IP Protocol Suite', 'B.A. Forouzan', 'McGraw Hill', '4th Edition', '2010', 0, 4);
`;

// ==================================================
// COURSE 3: Artificial Intelligence Lab (25PCC13CE17)
// ==================================================
sql += `
UPDATE courses SET
  title = 'Artificial Intelligence Lab',
  course_type = 'LAB',
  lecture_hours = 0,
  tutorial_hours = 0,
  practical_hours = 2,
  self_learning_hours = 0,
  credits = 1,
  internal_marks = 50,
  external_marks = 0,
  pre_requisites = 'BSE11CE02',
  objectives = 'Hands-on implementation of AI search algorithms, game theory, heuristics, logic programming, and expert systems.',
  syllabus_intro = 'Practical laboratory course focusing on Prolog programming, heuristic search strategies, knowledge representation, game playing, and AI applications.'
WHERE id = '3';

INSERT INTO course_outcomes (course_id, code, description, bloom_level, sort_order) VALUES
('3', 'CO1', 'Formulate a problem and build intelligent agents.', 'Understand', 1),
('3', 'CO2', 'Apply appropriate searching techniques to solve a real-world problem.', 'Apply', 2),
('3', 'CO3', 'Analyze the problem and infer new knowledge using suitable knowledge representation schemes.', 'Analyze', 3),
('3', 'CO4', 'Develop Expert System on real-world problems.', 'Create', 4);

INSERT INTO experiments (course_id, number, title, description, hours) VALUES
('3', 1, 'Prolog Classical Problems', 'To Solve classical problems for a given database of facts and rules using Prolog.', 2),
('3', 2, 'Water Jug Problem with DFS', 'Implement and Demonstrate Depth First Search Algorithm on Water Jug Problem.', 2),
('3', 3, 'Missionaries-Cannibals with BFS', 'Implement and Demonstrate Best First Search Algorithm on Missionaries-Cannibals Problems using Python/Prolog.', 2),
('3', 4, 'Monkey Banana Problem with A* Search', 'Implement A* Search algorithm on Monkey Banana Problem with state-action-goal representation.', 2),
('3', 5, 'Traveling Salesperson Problem (TSP)', 'Implementation of TSP using heuristic approach to find shortest path.', 2),
('3', 6, 'Forward and Backward Chaining', 'Implementation of problem-solving reasoning strategies using Forward or Backward Chaining.', 2),
('3', 7, 'Resolution Principle on FOPL', 'Implement resolution principle on First Order Predicate Logic related problems.', 2),
('3', 8, '8-Puzzle Problem', 'Implement 8-Puzzle problem using Python/Prolog with heuristic evaluation function f=g+h.', 2),
('3', 9, 'Game Playing Strategies', 'Implement any Game and demonstrate adversarial game playing strategies (Minimax / Alpha-Beta).', 2),
('3', 10, 'Medical Diagnosis Expert System', 'Write a Prolog program for medical diagnosis with explanation of inferences.', 2),
('3', 11, 'Bayesian Network Inference', 'Construct a Bayesian Network for a given dataset to draw probabilistic inferences.', 2),
('3', 12, 'Mini Project / Case Study', 'AI/ML application case study or mini project in retail, healthcare, autonomous systems, or NLP.', 4);

INSERT INTO assessment_schemes (course_id, component, marks, description, sort_order) VALUES
('3', 'ISE-1 (Lab Continuous)', 20, 'Continuous pre-defined rubrics-based evaluation of lab assignments', 1),
('3', 'ISE-2 (Lab Evaluation & Mini Project)', 30, 'Mini project demonstration, viva-voce and continuous evaluation', 2);

INSERT INTO reference_books (course_id, title, authors, publisher, edition, year, is_textbook, sort_order) VALUES
('3', 'Artificial Intelligence: A Modern Approach', 'Stuart Russell, Peter Norvig', 'Pearson', '4th Edition', '2020', 1, 1),
('3', 'Programming in PROLOG', 'W.F. Clocksin, C.S. Mellish', 'Springer', '5th Edition', '2003', 0, 2);
`;

// =========================================================
// COURSE 4: Electronic Devices & Applications (25PCC12EC05)
// =========================================================
sql += `
UPDATE courses SET
  title = 'Electronic Devices & Applications',
  course_type = 'THEORY',
  lecture_hours = 2,
  tutorial_hours = 0,
  practical_hours = 2,
  self_learning_hours = 2,
  credits = 3,
  internal_marks = 50,
  external_marks = 50,
  pre_requisites = 'Basic Electrical and Electronics Engineering, Fundamentals of Electromagnetics & Semiconductor Devices',
  objectives = 'Understand working of semiconductor diodes, BJT amplifiers, FETs, and MOS devices with practical laboratory implementations.',
  syllabus_intro = 'Covers semiconductor diode rectifier circuits, Bipolar Junction Transistors, BJT amplifiers, Field Effect Transistors, and MOS Transistor modeling.'
WHERE id = '4';

INSERT INTO course_outcomes (course_id, code, description, bloom_level, sort_order) VALUES
('4', 'CO1', 'Demonstrate the working of different semiconductor devices.', 'Understand', 1),
('4', 'CO2', 'Interpret the characteristics of semiconductor devices.', 'Understand', 2),
('4', 'CO3', 'Implement and verify different applications of semiconductor devices.', 'Apply', 3),
('4', 'CO4', 'Analyze different amplifier parameters.', 'Analyze', 4),
('4', 'CO5', 'Compare the performance of different devices as an application.', 'Evaluate', 5);

INSERT INTO modules (course_id, number, title, contact_hours, content, "references") VALUES
('4', 1, 'Diode Circuits', 5, 'Diode full-wave rectifiers– center-tapped transformer & bridge type with circuit diagram, operation & working, derivation of average output voltage, RMS voltage & ripple factor. Filter circuits (C, L, L-C, C-L-C pi-filter). Diode clipper circuits & clamper circuits.', '1, 2'),
('4', 2, 'Bipolar Junction Transistors', 6, 'Structure, symbol, construction & working of NPN & PNP BJT, basic configurations (CB, CC, CE). Input & output characteristics of NPN BJT in CE configuration, regions of operation, leakage current & thermal stability. DC load line & Q point, biasing circuits (fixed base, modified fixed base, voltage divider).', '1, 3'),
('4', 3, 'Basic BJT Amplifiers', 6, 'Mathematical modelling & small-signal representation of BJT by hybrid parameter (h-parameter) model and high frequency pi-model. Small signal amplifiers using BJT in CE configuration: Ri, Ro, Ai, Av calculation.', '1, 3'),
('4', 4, 'Field Effect Transistors', 4, 'JFET construction, working and V-I characteristics. Enhancement MOSFET: MOS capacitor, threshold voltage, C-V characteristics, I-V characteristics, AC Equivalent circuit for MOSFET.', '1, 2, 3'),
('4', 5, 'MOS Transistor', 5, 'MOS Transistor biasing circuits: Self, voltage divider, feedback bias. Introduction to secondary effects. SPICE Models for MOS Transistor, Technology Scaling.', '1, 2');

INSERT INTO experiments (course_id, number, title, description, hours) VALUES
('4', 1, 'Full-Wave Rectifier Circuits', 'Implementation of center-tapped full-wave rectifier & bridge type diode full-wave rectifier (FWR)', 2),
('4', 2, 'Diode Clipper Circuits', 'Implementation of various diode clipper circuits', 2),
('4', 3, 'Diode Clamper Circuits', 'Implementation of various diode clamper circuits', 2),
('4', 4, 'Rectifier Smoothing Filters', 'Implementation of rectifier output smoothing filters', 2),
('4', 5, 'CE-BJT Characteristics', 'Input & output characteristics of CE-BJT configuration', 2),
('4', 6, 'BJT h-parameters Determination', 'Graphical determination of hybrid parameters (h-parameters) from BJT characteristics', 2),
('4', 7, 'BJT DC Biasing Analysis', 'Analysis of DC biasing circuits for BJT', 2),
('4', 8, 'CE BJT Small Signal Amplifier', 'Implementation of common emitter (CE) BJT small signal amplifier', 2),
('4', 9, 'JFET V-I & Transfer Characteristics', 'JFET V-I characteristics & transfer characteristics', 2),
('4', 10, 'JFET DC Biasing', 'Analysis of DC biasing circuits for JFET', 2),
('4', 11, 'MOSFET Characteristics Simulation', 'Simulation of MOSFET Transfer & Output Characteristics', 2),
('4', 12, 'Channel Length Modulation Simulation', 'Simulation of Channel Length Modulation for MOSFET (Secondary Effects)', 2);

INSERT INTO assessment_schemes (course_id, component, marks, description, sort_order) VALUES
('4', 'ISE (Theory)', 20, 'ISE activities conducted throughout semester', 1),
('4', 'MSE (Theory)', 30, '90 minutes written examination based on 50% syllabus', 2),
('4', 'ESE (Theory)', 50, '120 minutes summative examination based on complete syllabus', 3),
('4', 'ISE (Lab Performance & Viva)', 50, '25 marks experiment performance/submission + 25 marks oral/practical evaluation', 4);

INSERT INTO reference_books (course_id, title, authors, publisher, edition, year, is_textbook, sort_order) VALUES
('4', 'Electronic Circuits: Analysis and Design', 'Donald A. Neamen', 'Tata McGraw Hill', '3rd Edition', '2007', 1, 1),
('4', 'Electronic Devices and Circuit Theory', 'Robert L. Boylestad, Louis Nashelsky', 'Pearson', '10th Edition', '2009', 1, 2),
('4', 'Semiconductor Physics and Devices: Basic Principles', 'Donald A. Neamen', 'McGraw Hill Higher Education', '4th Edition', '2011', 0, 3),
('4', 'Power Electronics: Circuits, Devices & Applications', 'M.H. Rashid', 'Pearson India', '4th Edition', '2017', 0, 4);
`;

fs.writeFileSync('seed_all_details.sql', sql);
console.log('Successfully generated seed_all_details.sql');
