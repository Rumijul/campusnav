# GP-ESS: A User-Centered Approach to Accessible Navigation for PWDs, Parents, Guests, and New Learners in the Main Building of Elizabeth Seton School – South

A Research Study Presented to the Faculty of the Senior High School Division, Elizabeth Seton School – South, Anabu II-D, City of Imus, Cavite  
In Partial Fulfillment of the Requirements in Practical Research II

**Researchers:**  
Adriatico, Louis Julian T.  
Antonio, Jacob Gabriel M.  
Camaisa, Travis John David C.

**Date:** March 2026

---

## Plain-Language Summary (for Non-Technical Readers)

Getting around inside a school building can be hard, especially for people who are new to the campus or have mobility needs. This study focuses on **GP-ESS**, a web-based navigation system made for the Main Building of Elizabeth Seton School – South.

In simple terms, GP-ESS works like this:
- you pick where you are,
- you pick where you want to go,
- the system shows a route and step-by-step directions,
- it can also show an accessibility-friendly route.

This paper explains:
1. why the project matters,
2. what previous studies say,
3. how the system was built,
4. how to evaluate it fairly,
5. what schools can do next.

Important note: this version is a **full research manuscript with completed system build and technical validation**, but with **field-testing results still to be collected**. No fake participant results are reported.

---

## Abstract

Wayfinding in school buildings is often difficult for persons with disabilities (PWDs), parents, guests, and new learners. Traditional wayfinding (asking guards, reading printed maps, or following hallway signs) is helpful but can still cause delays, confusion, and dependence on other people.

This study presents **GP-ESS**, a user-centered and accessibility-aware campus navigation system developed for the Main Building of Elizabeth Seton School – South. The system provides interactive floor-map navigation, destination search, route computation, and step-by-step directions, with support for both standard and accessible routing.

The study uses a **developmental-comparative quantitative design**. First, it documents system development and technical validation. Second, it defines a complete field-evaluation protocol that compares GP-ESS with traditional wayfinding methods using measurable outcomes: completion time, route accuracy, usability, and perceived accessibility.

A technical validation audit was conducted using the project’s automated tests. After excluding mirrored `.gsd` paths from discovery, the corrected result is **5 passing test files and 72 passing tests**, covering core pathfinding logic, accessible routing behavior, direction generation, floor-aware instructions, and map viewport reliability.

The paper concludes that GP-ESS is a technically sound and context-appropriate intervention for inclusive school wayfinding, and it provides a ready-to-run methodology for formal participant testing.

**Keywords:** campus navigation, wayfinding, accessibility, inclusive design, PWD, user-centered design, school technology

---

## Chapter 1: The Problem and Its Background

### 1.1 Background of the Study

Inside a school, people often need to find offices, classrooms, service areas, and facilities quickly. This task is easy for regular users but not always easy for:
- persons with disabilities,
- first-time visitors,
- parents with time-bound transactions,
- new learners who are still adjusting.

In these situations, wayfinding problems are common:
- users ask several people before arriving,
- users take longer routes,
- users miss the correct entrance,
- users get anxious when they feel lost.

These issues are not only about convenience. For users with mobility constraints, navigation errors can become accessibility and safety concerns.

### 1.2 Local Context: Elizabeth Seton School – South Main Building

This study is focused on the **Main Building of Elizabeth Seton School – South**. The project repository snapshot used in this study (March 2026) currently maps:

- **1 building** (Main Building)
- **1 active floor map**
- **48 navigation nodes**
- **50 route edges**
- **42 accessibility-enabled edges** and **8 non-accessible edges**

These figures show that the system is already operating on real school map data, not synthetic demo data.

### 1.3 Why This Study Matters

Traditional wayfinding in schools usually depends on static signs, verbal instructions, and occasional printed layouts. These methods are useful, but they may fail when:
- signage is missed or unclear,
- people give conflicting directions,
- the user is unfamiliar with school landmarks,
- the route includes stairs and the user needs an accessible alternative.

A user-centered digital wayfinding tool can reduce those pain points and increase independence.

### 1.4 Policy and Legal Basis (Philippine Context)

This study aligns with Philippine accessibility policy:

- **Batas Pambansa Blg. 344 (Accessibility Law)** requires public-use and educational facilities to include structural features that improve mobility for disabled persons (Lawphil, 1983).
- **Republic Act No. 7277 (Magna Carta for Disabled Persons)** affirms disabled persons’ rights to social participation, equal opportunity, and barrier removal (Lawphil, 1992).

Because finding one’s way is directly connected to mobility and participation, a navigation system such as GP-ESS is consistent with these policy directions.

### 1.5 Statement of the Problem

This study aims to design and evaluate GP-ESS as an accessible and user-friendly wayfinding system for the Main Building of Elizabeth Seton School – South.

Specifically, it seeks to answer:

1. How easy is it for users to locate destinations using GP-ESS?
2. How accurate are the routes generated by GP-ESS?
3. How usable is GP-ESS in terms of clarity, ease of use, and learnability?
4. How accessible is GP-ESS from the perspective of users with mobility and related navigation needs?
5. How does GP-ESS compare with traditional wayfinding methods?

### 1.6 Objectives of the Study

#### General Objective
To develop and evaluate GP-ESS as a user-centered, accessibility-aware campus navigation system.

#### Specific Objectives
1. Build a functional navigation prototype for the Main Building.
2. Provide standard and accessible route options.
3. Generate clear step-by-step directions.
4. Validate technical correctness through automated tests.
5. Prepare a complete field-testing protocol for participant-based comparison.

### 1.7 Hypotheses

**Null Hypothesis (H0):** There is no significant difference between GP-ESS and traditional wayfinding in terms of efficiency, route accuracy, usability, and accessibility.

**Alternative Hypothesis (Ha):** GP-ESS produces significant improvements over traditional wayfinding in one or more outcome measures.

### 1.8 Significance of the Study

- **For PWD users:** supports more independent movement and better route choices.
- **For parents and guests:** shortens time spent searching for locations.
- **For new learners:** improves confidence while adjusting to the campus.
- **For school administrators:** provides data-driven basis for inclusive campus initiatives.
- **For future researchers:** offers a reusable framework for school wayfinding studies.

### 1.9 Scope and Delimitations

#### Scope
- Main Building of Elizabeth Seton School – South
- Web-based wayfinding system (GP-ESS)
- User groups: PWDs, parents, guests, new learners
- Measures: navigation efficiency, route accuracy, usability, accessibility perception

#### Delimitations
- This paper does not claim final participant outcome data yet.
- The current map dataset in production is one active floor of the Main Building.
- Results may not automatically generalize to all other campus buildings without further mapping.

### 1.10 Definition of Key Terms (Plain-Language)

- **Wayfinding:** the process of finding your way from one point to another.
- **Accessible route:** a path that avoids barriers like stairs when needed.
- **Node:** a point on the map (room, entrance, junction, stairs, ramp, etc.).
- **Edge:** a connection between two map points.
- **Usability:** how easy and clear a system is to use.
- **GP-ESS:** the navigation system developed in this project.

---

## Chapter 2: Review of Related Literature and Conceptual Foundation

### 2.1 Indoor Wayfinding Is a Real Accessibility Issue

Studies consistently show that indoor spaces (schools, hospitals, campuses) are harder to navigate than outdoor spaces because GPS signals are weak or unreliable indoors. Users depend on interior landmarks, floor layout understanding, and clear directional instructions.

Prandi et al. (2021) emphasized inclusive design for university indoor wayfinding and showed that navigation systems should be built for varied users, not just “average” users.

### 2.2 Accessibility Must Cover Both Space and Interface

Prandi et al. (2022), in a systematic mapping study, highlighted two important points:
1. physical environments can contain barriers, and
2. digital navigation tools themselves can also be barriers if poorly designed.

In other words, an accessible navigation project must make both the **route** and the **interface** accessible.

### 2.3 Research on Users with Disabilities

Pilski et al. (2023) and Olaleye et al. (2024) provide evidence that disability-aware navigation systems can improve orientation and confidence when systems are intentionally designed for user needs, especially for mobility and visual support contexts.

### 2.4 Human-Centered and User-Centered Design Foundations

The study adopts human-centered design principles (ISO 9241-210, 2019):
- understand users before designing,
- involve users in evaluation,
- iterate based on feedback,
- optimize for real use contexts.

This is aligned with practical school use, where users differ in age, familiarity, urgency, and physical ability.

### 2.5 Technology Acceptance and Usability

The Technology Acceptance Model (Davis, 1989) explains that people adopt technology when they find it:
- useful, and
- easy to use.

To operationalize usability in a measurable way, this study uses the System Usability Scale (Brooke, 1996), interpreted using widely cited benchmarks (Bangor et al., 2008; 2009).

### 2.6 Synthesis of Literature and Research Gap

From literature and prior implementations, three key gaps remain:

1. **Mixed-user gap:** many systems are tested mainly on regular student users.
2. **Practical accessibility gap:** some systems display maps but do not strongly guide accessibility-safe routing.
3. **Local school evidence gap:** fewer studies provide school-level, Philippine-context evidence with measurable comparative design.

GP-ESS directly addresses these gaps by targeting mixed school users and embedding accessibility in route logic.

### 2.7 Theoretical Framework

This study is anchored in:

1. **Human-Centered Design (ISO 9241-210)**
2. **Universal Design principles**
3. **Technology Acceptance Model (Davis, 1989)**

### 2.8 Conceptual Framework (Input–Process–Output)

| Component | Description |
|---|---|
| **Input** | User profiles, school map data, node/edge route data, accessibility constraints, baseline wayfinding method |
| **Process** | Requirement gathering, map modeling, route-engine development, interface design, technical tests, field-evaluation planning |
| **Output** | GP-ESS system + measurable outcomes (efficiency, accuracy, usability, accessibility) |

---

## Chapter 3: Methodology

### 3.1 Research Design

This research uses a **quantitative developmental-comparative design**.

- **Development phase:** design and build GP-ESS.
- **Evaluation phase:** compare GP-ESS against traditional wayfinding.

A **within-subject setup** is recommended for field testing, where each participant tries both methods. This helps reduce person-to-person variability.

### 3.2 Research Locale

Main Building, Elizabeth Seton School – South, Anabu II-D, Imus City, Cavite.

### 3.3 Participants and Sampling Plan

Target participant groups:
- PWDs
- Parents
- Guests
- New learners

Suggested initial target sample: **n = 40** (around 10 per group, where feasible), with allowance for attrition.

Sampling strategy: purposive-convenience, while ensuring each user group is represented.

### 3.4 Research Instruments

#### 3.4.1 Navigation Task Performance Sheet
For each route task:
- completion time,
- destination reached (yes/no),
- wrong turns,
- requests for help.

#### 3.4.2 Route Accuracy Checklist
Evaluator checks whether the user reached the correct destination and whether route instructions were followed correctly.

#### 3.4.3 System Usability Scale (SUS)
A standard 10-item usability instrument (Brooke, 1996).

#### 3.4.4 Accessibility Perception Scale (5-point Likert)
Suggested dimensions:
- ease of identifying safe routes,
- comfort and confidence,
- clarity of instructions,
- perceived independence.

### 3.5 Instrument Validation and Reliability

- Content validation by adviser and relevant reviewers
- Small pilot run to improve wording clarity
- Internal consistency check (Cronbach’s alpha target >= 0.70)

### 3.6 Data Gathering Procedure (Suggested Sequence)

1. Secure school approval and ethics clearance.
2. Explain study and gather informed consent.
3. Orient participant to both methods.
4. Run assigned route tasks using traditional method.
5. Run equivalent route tasks using GP-ESS.
6. Record objective metrics.
7. Collect usability and accessibility questionnaire responses.
8. Encode and verify data for analysis.

### 3.7 Ethical Considerations

- voluntary participation,
- right to withdraw,
- anonymized participant IDs,
- no public disclosure of personal data,
- safe route-task setup,
- non-disruptive schedule with school operations.

### 3.8 Statistical Treatment of Data (Readable Version)

To keep interpretation clear for non-technical readers:

- **Average (Mean):** to summarize typical performance
- **Percentage:** to summarize success rates
- **Paired comparison tests:** to check whether differences between methods are statistically meaningful

Recommended tests:
- Paired t-test or Wilcoxon signed-rank (for paired scores/time)
- McNemar test (for paired yes/no success)
- subgroup comparisons (ANOVA or Kruskal-Wallis, if needed)

Significance threshold: **p < .05**.

### 3.9 Research Question to Analysis Matrix

| Research Question | Indicator(s) | Data Type | Suggested Analysis |
|---|---|---|---|
| RQ1 Ease and speed | Completion time, wrong turns, help requests | Continuous/count | Paired t-test or Wilcoxon |
| RQ2 Route accuracy | Destination reached, route correctness | Binary/ordinal | McNemar + descriptive |
| RQ3 Usability | SUS total and item means | Continuous | Descriptive + benchmark interpretation |
| RQ4 Accessibility | Accessibility scale scores | Continuous | Descriptive + subgroup comparison |
| RQ5 Overall comparison | Combined indicators | Mixed | Comparative synthesis + effect sizes |

---

## Chapter 4: GP-ESS System Profile and Technical Validation

### 4.1 What GP-ESS Is

GP-ESS is a web-based navigation application for school wayfinding. It is designed so users can:
- find locations by search or map selection,
- view route options,
- read clear step-by-step directions,
- choose accessibility-aware navigation when needed.

### 4.2 System Features (From Project Audit)

#### Student/Public Side
- interactive floor map,
- searchable destinations,
- automatic route generation,
- standard route and accessible route modes,
- directions panel with step-by-step guidance.

#### Admin Side
- protected admin login,
- map-node editing,
- edge/connection editing with accessibility metadata,
- floor plan image management,
- graph data updates for navigation logic.

### 4.3 Current Dataset Snapshot (Main Building)

| Metric | Current Value |
|---|---:|
| Buildings mapped | 1 |
| Active floors mapped | 1 |
| Total nodes | 48 |
| Searchable nodes | 29 |
| Total edges | 50 |
| Accessible edges | 42 |
| Non-accessible edges | 8 |

### 4.4 How Routing Works (Simple Explanation)

Think of the map as a network of connected points.
- Points = places (rooms, entrances, hallways, connectors)
- Connections = possible paths between points

The route engine calculates the best path from origin to destination. For accessibility mode, it avoids connections marked as non-accessible.

This project uses the A* pathfinding approach, which is commonly used in navigation systems.

### 4.5 Direction Clarity and Floor-Aware Instructions

The direction generator produces readable instructions (e.g., continue straight, turn left, take the stairs/elevator/ramp). When floor transitions are present in the route graph, the system can produce connector-specific floor instructions.

### 4.6 Technical Validation (Automated Test Audit)

Command used:

```bash
npx vitest --run --exclude ".gsd/**"
```

Result:
- **5 test files passed**
- **72 tests passed**

Validated areas include:
- route correctness,
- accessible route filtering,
- edge cases (missing nodes, no route, same origin/destination),
- cross-floor connector logic (in test fixtures),
- direction-step generation,
- map viewport behavior.

### 4.7 Quality and Readability Design Choices

To make GP-ESS understandable for non-technical users:
- labels are human-readable,
- navigation is task-focused,
- instructions avoid technical jargon,
- route options are explicit,
- interface supports “find-and-go” behavior.

### 4.8 Limitations (Current Version)

- Full participant outcome data are still pending.
- Real-world effectiveness still needs controlled field testing.
- Current production mapping is concentrated on one active building-floor dataset.

---

## Chapter 5: Discussion, Conclusion, and Recommendations

### 5.1 Discussion

The project demonstrates that school navigation can be approached as an accessibility and usability problem, not only as a mapping problem. By combining map data, route logic, and clear instructions, GP-ESS offers a practical foundation for inclusive wayfinding.

A major strength of this work is that it does not stop at software implementation. It also provides a complete research framework to evaluate impact responsibly.

### 5.2 Conclusion

Based on development evidence and technical validation, GP-ESS is a promising user-centered navigation solution for Elizabeth Seton School – South’s Main Building.

At this stage, the correct conclusion is:
- the system is **technically validated and ready for field evaluation**,
- formal claims about user performance gains should be made only after participant testing is completed.

This protects research integrity and ensures trustworthy findings.

### 5.3 Recommendations

1. Conduct the full participant study as designed.
2. Prioritize PWD-inclusive testing and accommodations.
3. Add language and accessibility enhancements (e.g., larger text options, audio cues in future versions).
4. Expand mapping coverage to additional floors/buildings in later phases.
5. Integrate periodic usability and accessibility audits per school term.

### 5.4 Practical Implementation Plan for the School

| Phase | Timeline | Main Activity |
|---|---|---|
| Pilot | 2–4 weeks | Controlled route tasks with representative users |
| Evaluation | 1–2 weeks | Analyze metrics and summarize findings |
| Improvement | 2 weeks | Apply usability and accessibility revisions |
| Rollout | Next term | Soft launch with orientation materials |
| Sustainment | Ongoing | Data updates, map maintenance, user feedback |

---

## Chapter 6: Plain-Language Research Communication Guide

To keep findings understandable for non-technical audiences (students, parents, school staff):

1. Report outcomes using clear statements (e.g., “users reached rooms faster by X minutes”).
2. Pair each statistic with a practical meaning.
3. Avoid unexplained acronyms in presentations.
4. Use visuals (simple tables/charts) rather than dense statistical text.
5. Separate “what happened” from “what it means for daily school use.”

---

## References

Bangor, A., Kortum, P. T., & Miller, J. T. (2008). An empirical evaluation of the System Usability Scale. *International Journal of Human-Computer Interaction, 24*(6), 574–594. https://doi.org/10.1080/10447310802205776

Bangor, A., Kortum, P., & Miller, J. (2009). Determining what individual SUS scores mean: Adding an adjective rating scale. *Journal of Usability Studies, 4*(3), 114–123.

Brooke, J. (1996). SUS: A “quick and dirty” usability scale. In P. W. Jordan, B. Thomas, I. L. McClelland, & B. Weerdmeester (Eds.), *Usability Evaluation in Industry* (pp. 189–194). Taylor & Francis.

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly, 13*(3), 319–340.

International Organization for Standardization. (2019). *ISO 9241-210:2019 Ergonomics of human-system interaction—Part 210: Human-centred design for interactive systems*.

Lawphil. (1983). *Batas Pambansa Blg. 344: An Act to Enhance the Mobility of Disabled Persons*. https://lawphil.net/statutes/bataspam/bp1983/bp_344_1983.html

Lawphil. (1992). *Republic Act No. 7277: Magna Carta for Disabled Persons*. https://lawphil.net/statutes/repacts/ra1992/ra_7277_1992.html

Olaleye, S. B., Adebiyi, B. A., Abdulsalaam, A., Nwosu, F. C., Adeyanju, A. O., Ambi, H. M., & Omolayo, C. (2024). Evaluating the usability and effectiveness of a special education campus navigation system for students with visual impairment. *Journal of Intelligent Systems and Control, 3*(2), 84–92. https://doi.org/10.56578/jisc030202

Pilski, M., Mikułowski, D., & Terlikowski, G. (2023). An indoor campus navigation system for users with disabilities. *Studia Informatica. System and Information Technology, 29*(2), 81–93.

Prandi, C., Barricelli, B. R., Mirri, S., & Fogli, D. (2022). Accessible wayfinding and navigation: A systematic mapping study. *Universal Access in the Information Society, 22*(1), 185–212. https://doi.org/10.1007/s10209-021-00843-x

Prandi, C., Mirri, S., Burattini, C., Maitan, S., Salomoni, P., & Manaresi, N. (2021). On supporting university communities in indoor wayfinding: An inclusive design approach. *Sensors, 21*(9), 3134. https://doi.org/10.3390/s21093134

World Health Organization. (2023). *Disability and health*. https://www.who.int/news-room/fact-sheets/detail/disability-and-health

---

## Appendix A: Suggested Participant Task Set

1. Start at Main Entrance and navigate to Principal’s Office.  
2. Start at Main Lobby and navigate to Restroom.  
3. Start at CSS Entrance and navigate to Cafeteria/Activity Area South.  
4. Start at Service Area and navigate to Activity Area East.

For each task, collect:
- completion time,
- destination reached,
- number of wrong turns,
- number of help requests.

---

## Appendix B: Suggested Usability and Accessibility Questionnaire (5-Point Scale)

Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree):

1. The system was easy to use.
2. The instructions were easy to understand.
3. I could find my destination with less confusion.
4. The map labels were readable.
5. I felt more independent while navigating.
6. I needed less help from other people.
7. The suggested route matched my real movement.
8. The system felt appropriate for people with accessibility needs.
9. I would use this system again.
10. I would recommend this system to other school visitors.

---

## Appendix C: Result Tables (for Field Study Completion)

### Table C1. Completion Time by Method

| Participant ID | Traditional (sec) | GP-ESS (sec) | Difference |
|---|---:|---:|---:|
| P01 |  |  |  |
| ... |  |  |  |

### Table C2. Destination Success by Method

| Method | Success (n) | Failure (n) | Success Rate |
|---|---:|---:|---:|
| Traditional |  |  |  |
| GP-ESS |  |  |  |

### Table C3. Usability Summary (SUS)

| Metric | Value |
|---|---:|
| Mean SUS |  |
| Standard Deviation |  |
| Interpretation |  |

### Table C4. Accessibility Perception Summary

| Dimension | Mean | Interpretation |
|---|---:|---|
| Clarity of guidance |  |  |
| Confidence while navigating |  |  |
| Perceived independence |  |  |
| Route suitability |  |  |

---

## Appendix D: Integrity Note

This manuscript is intentionally transparent:
- it reports completed development and technical validation,
- it does **not** fabricate participant performance outcomes,
- it provides a complete evaluation framework for proper data collection.
