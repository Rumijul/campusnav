# GP-ESS: A User-Centered Approach to Accessible Navigation for PWDs, Parents, Guests, and New Learners in the Main Building of Elizabeth Seton School – South

A Research Study Presented to the Faculty of Senior High School Division, Elizabeth Seton School – South, Anabu II-D, City of Imus, Cavite  
In Partial Fulfillment of the Requirements in Practical Research II

**Researchers:**  
Adriatico, Louis Julian T.  
Antonio, Jacob Gabriel M.  
Camaisa, Travis John David C.

**Date:** March 2026

---

## Abstract

Wayfinding inside multi-floor school buildings can be difficult for first-time users and especially challenging for persons with disabilities (PWDs). This study presents **GP-ESS**, a user-centered digital campus navigation system developed for the Main Building of Elizabeth Seton School – South. GP-ESS combines interactive floor maps, route computation, floor-aware direction steps, and accessibility-sensitive routing.

The paper uses a quantitative developmental-evaluation approach. It first documents system development and technical validation, then defines the full field-evaluation protocol for comparing GP-ESS against traditional wayfinding methods (printed map and verbal directions). Core evaluation variables are navigation efficiency, route accuracy, usability, and accessibility.

Technical validation was performed through the project’s automated test suite and confirms stable route and direction-generation behavior under tested scenarios. A corrected test audit (excluding mirrored `.gsd` worktree duplicates) yielded **5 test files, 72 tests passed**. The study’s field phase is designed to test whether GP-ESS significantly improves wayfinding outcomes across four user groups: PWDs, parents, guests, and new learners.

**Keywords:** campus navigation, wayfinding, accessibility, user-centered design, PWD, indoor routing, smart campus

---

## Chapter 1: The Problem and Its Background

### 1.1 Background of the Study

Navigating a school campus appears simple until users encounter multi-floor layouts, unclear directional cues, and unfamiliar room distributions. In the Main Building of Elizabeth Seton School – South, wayfinding can be especially difficult for:

- persons with disabilities (PWDs),
- parents visiting for school transactions,
- guests unfamiliar with the building,
- new learners still adjusting to campus layout.

Most school wayfinding still relies on static maps, hallway signage, and verbal instructions. These supports can be inconsistent, unavailable at point-of-need, or inaccessible for users with mobility and visual constraints (Pilski et al., 2023; Olaleye et al., 2024).

Global and local literature supports digital campus navigation as a practical response to these limitations. However, many implementations focus primarily on general student populations and do not consistently operationalize accessibility as a first-class requirement.

### 1.2 Policy and Accessibility Context in the Philippines

This study is also grounded in Philippine disability-rights and accessibility policy:

- **Batas Pambansa Blg. 344 (Accessibility Law)** requires public-use facilities, including educational institutions, to provide architectural features that enhance mobility for disabled persons.
- **Republic Act No. 7277 (Magna Carta for Disabled Persons)** frames disabled persons’ rights to full social participation and barrier removal.

Because campus navigation is directly tied to practical mobility, GP-ESS aligns with this policy direction by supporting clearer, more independent movement inside school premises.

### 1.3 Review of Related Literature

#### 1.3.1 Indoor wayfinding constraints

Conventional outdoor GPS works well in open environments but degrades indoors due to signal obstruction and vertical complexity (Ma et al., 2024; Pilski et al., 2023). Indoor wayfinding therefore requires structured map logic and route models rather than simple geolocation overlays.

#### 1.3.2 Accessibility-centered navigation

Accessible wayfinding research emphasizes that routing systems should not only point to destinations but also encode mobility-appropriate paths, connector choices (ramps/elevators), and instruction clarity for users with varied capabilities (Olaleye et al., 2024; Popa & Chircu, 2025).

#### 1.3.3 Smart campus platforms and digital routing

Institutional platforms such as MapConnect and Concept3D illustrate adoption of interactive campus wayfinding technologies in education environments (MapConnect, n.d.; Concept3D, 2025). Research on smart campus navigation further indicates gains in orientation efficiency and confidence when users are given explicit route guidance (Neelakantappa et al., 2025).

#### 1.3.4 Philippine implementations

Philippine examples (e.g., Cenezan, 2025; Manares et al., 2019) show increasing local interest in campus navigation tools. Still, many implementations remain kiosk-based or static, with limited mobile and inclusive-routing scope.

### 1.4 Synthesis and Research Gap

The literature indicates strong value in digital wayfinding, but gaps remain:

1. **Target-user gap:** many systems are optimized for regular students/staff rather than mixed school populations.
2. **Accessibility gap:** systems often include map visualization but weakly encode barrier-aware routing behavior.
3. **Local evidence gap:** fewer Philippine school studies report rigorous quantitative comparison versus traditional methods.

This study addresses these gaps by designing and evaluating GP-ESS as a school-specific, user-centered, and accessibility-aware wayfinding system for four distinct user groups.

### 1.5 Theoretical Framework

The study is anchored on three frameworks:

1. **Human-Centered Design (ISO 9241-210):** design decisions should be based on user context, needs, and iterative validation.
2. **Universal Design principles:** systems should be usable by diverse users with minimal adaptation.
3. **Technology Acceptance Model (Davis, 1989):** adoption is shaped by perceived usefulness and perceived ease of use.

Together, these frameworks justify evaluating GP-ESS not only on algorithmic correctness but also on practical usability and accessibility outcomes.

### 1.6 Conceptual Framework (Input–Process–Output)

| Component | Description |
|---|---|
| **Input** | User profiles (PWDs, parents, guests, new learners), floor-map data, room metadata, accessibility constraints, baseline wayfinding method |
| **Process** | User-centered requirement analysis, route-graph modeling, accessible-routing logic, interface development, technical validation, field testing |
| **Output** | GP-ESS navigation system and measured changes in efficiency, accuracy, usability, and accessibility |

### 1.7 Statement of the Problem

This study evaluates the design, development, and effectiveness of GP-ESS as a user-centered inclusive navigation system for the Main Building of Elizabeth Seton School – South.

Specifically, it answers:

1. What is the level of ease in locating rooms and facilities when using GP-ESS?
2. What is the level of route accuracy of GP-ESS in guiding users to destinations?
3. What is the level of usability of GP-ESS in terms of ease of use, instruction clarity, and interface quality?
4. What is the level of accessibility of GP-ESS for PWD users, especially for mobility and visual wayfinding needs?
5. How does GP-ESS compare with traditional wayfinding methods in effectiveness, usability, and accessibility?

### 1.8 Hypotheses

**Null Hypothesis (H0):**  
GP-ESS does not produce a statistically significant improvement in navigation efficiency, route accuracy, usability, and accessibility compared with traditional methods.

**Alternative Hypothesis (Ha):**  
GP-ESS produces a statistically significant improvement in navigation efficiency, route accuracy, usability, and accessibility compared with traditional methods.

### 1.9 Significance of the Study

- **PWDs:** supports safer and more independent movement.
- **Parents and Guests:** reduces time and confusion in locating destinations.
- **New Learners:** improves confidence during campus familiarization.
- **School Administration:** provides evidence for smart-campus and accessibility initiatives.
- **Future Researchers:** contributes a local, replicable framework for inclusive wayfinding studies.

### 1.10 Scope and Delimitation

#### Scope

The study covers GP-ESS development and evaluation for the Main Building of Elizabeth Seton School – South. It focuses on indoor wayfinding support for PWDs, parents, guests, and new learners.

#### Delimitation

- Geographic/operational scope is limited to the Main Building and designated entry points.
- The solution is a web-based system, not a custom hardware deployment.
- Indoor live geolocation may be constrained by infrastructure; route guidance is map-graph driven.
- Findings are limited to participant profiles included in the study period.

### 1.11 Definition of Terms

- **Accessible Route** – route option that avoids inaccessible segments and prioritizes mobility-compatible connectors.
- **Campus Wayfinding** – process of navigating from origin to destination within campus structures.
- **GP-ESS** – the proposed digital wayfinding system for Elizabeth Seton School – South.
- **Navigation Efficiency** – time and effort required to complete a route task.
- **Route Accuracy** – correctness of system guidance in reaching the intended destination.
- **Usability** – degree of effectiveness, efficiency, and satisfaction in system use.

---

## Chapter 2: Methodology

### 2.1 Research Design

This study uses a **quantitative developmental-comparative design**:

1. **Development phase:** build GP-ESS using user-centered and accessibility-driven requirements.
2. **Evaluation phase:** compare GP-ESS against traditional wayfinding for the same participants.

A **within-subject design** is used so each participant performs equivalent tasks under:

- **Condition A:** traditional method (printed map/verbal assistance),
- **Condition B:** GP-ESS.

This design reduces between-participant variance and strengthens direct comparison.

### 2.2 Research Locale

Main Building, Elizabeth Seton School – South, Anabu II-D, Imus City, Cavite.

### 2.3 Participants and Sampling

Target groups:

- PWDs,
- parents,
- guests,
- new learners.

Sampling approach: purposive-convenience with representation across all groups.

#### Sample size plan

For paired-condition testing, a minimum sample in the mid-30s is typically recommended for moderate effects at alpha = .05 and power ≈ .80 (Faul et al., 2009, G*Power guidance). This study targets **n = 40** total participants (10 per group when feasible) to absorb attrition and preserve inferential strength.

### 2.4 Research Instruments

#### 2.4.1 Navigation Task Performance Sheet

For each task:
- completion time (seconds),
- destination reached (1/0),
- wrong turns (count),
- help requests (count).

#### 2.4.2 Route Accuracy Checklist

Rubric-based scoring of whether the route output and actual traversal correctly reach the destination using appropriate floor/connector transitions.

#### 2.4.3 Usability Instrument (SUS)

The **System Usability Scale (SUS)** 10-item questionnaire is used for perceived usability (Brooke, 1996).

SUS scoring:

\[
SUS = \left(\sum (Q_{odd}-1) + \sum (5-Q_{even})\right) \times 2.5
\]

Interpretation uses established benchmarks (Bangor et al., 2008; Bangor et al., 2009), where ~68 is commonly treated as an average reference point.

#### 2.4.4 Accessibility Perception Scale (Custom, Likert 1–5)

Proposed dimensions:
- ease of identifying accessible paths,
- perceived safety,
- independence while navigating,
- clarity of connector guidance for barrier-aware movement.

### 2.5 Instrument Validation and Reliability

- **Content validation:** expert panel (research adviser, ICT specialist, accessibility-aware reviewer).
- **Pilot testing:** limited dry run for wording and administration clarity.
- **Reliability:** Cronbach’s alpha target >= 0.70 for multi-item scales.

### 2.6 Data Gathering Procedure

1. Secure approvals and informed consent.
2. Conduct participant orientation and trial instruction.
3. Run assigned route tasks using traditional method.
4. Run equivalent route tasks using GP-ESS.
5. Record objective performance metrics.
6. Administer SUS and accessibility questionnaires.
7. Encode, clean, and analyze data.

### 2.7 Ethical Considerations

- voluntary participation and withdrawal rights,
- informed consent,
- anonymized participant identifiers,
- secure data handling and restricted access,
- accommodations and safety support for PWD participants,
- non-disruptive scheduling with school operations.

### 2.8 Statistical Treatment of Data

#### Descriptive statistics
- frequency and percentage,
- weighted mean,
- standard deviation.

#### Inferential statistics
- **Paired t-test** for completion-time and continuous paired outcomes,
- **Wilcoxon signed-rank test** if normality assumptions are violated,
- **McNemar test** for paired binary success outcomes (destination reached),
- **One-way ANOVA / Kruskal-Wallis** for subgroup differences,
- significance threshold: **p < .05**.

### 2.9 Research Question to Analysis Matrix

| Research Question | Variable(s) | Data Type | Primary Test |
|---|---|---|---|
| RQ1 Ease/Efficiency | completion time, wrong turns, help requests | continuous/count | Paired t-test / Wilcoxon |
| RQ2 Accuracy | destination reached, path correctness | binary/ordinal | McNemar / Wilcoxon |
| RQ3 Usability | SUS score, item means | continuous | one-sample vs benchmark + descriptive |
| RQ4 Accessibility | accessibility-scale score | continuous | descriptive + subgroup comparison |
| RQ5 Overall comparison | combined performance indicators | mixed | effect size + comparative synthesis |

---

## Chapter 3: System Design and Technical Validation

### 3.1 System Overview

GP-ESS is a web-based wayfinding platform that provides:

- interactive floor-plan visualization,
- destination selection,
- route generation between start and destination,
- standard and accessible route options,
- turn-by-turn directions,
- admin-side graph/map maintenance support.

### 3.2 Core Technical Design

Navigation is represented as a weighted graph:

- **Nodes:** rooms, entrances, junctions, stairs, ramps, elevators, landmarks.
- **Edges:** links with dual costs (standard and accessible weights).

Pathfinding uses A* with mode-aware constraints:

- **Standard mode:** shortest practical walk path.
- **Accessible mode:** excludes blocked/inaccessible edges and follows accessible-weight logic.

### 3.3 Accessibility-Oriented Functional Behavior

1. parallel standard and accessible route computation,
2. connector-aware multi-floor traversal,
3. floor-aware direction rendering,
4. instruction output that supports non-expert users.

### 3.4 Technical Validation Audit (Corrected)

A two-step technical audit was performed:

- **Initial run:** `npm test -- --run`  
  Result: 10 files / 144 tests passed.
- **Audit finding:** duplicated discovery from mirrored `.gsd/worktrees` paths inflated counts.
- **Corrected run:** `npx vitest --run --exclude ".gsd/**"`  
  Result: **5 files / 72 tests passed**.

This corrected result is used as the technical evidence baseline for this paper.

### 3.5 Validated Functional Areas

| Area | Evidence from Test Suite |
|---|---|
| Pathfinding correctness | route-found, no-route, same-node, segment construction |
| Accessible routing | avoids non-accessible edges, computes alternative paths |
| Cross-floor logic | verifies connector traversal and floor transitions |
| Directions generation | verifies instruction and route comparison behavior |
| Viewport gesture reliability | verifies touch math behavior in map viewport logic |
| Performance guardrail | includes under-50ms route assertion on 500-node test graph |

### 3.6 Field Evaluation Metrics

| Metric | Operational Definition | Desired Direction |
|---|---|---|
| Navigation Efficiency | mean completion time per task | lower |
| Route Accuracy | successful arrival and route correctness rate | higher |
| Usability | SUS score and item means | higher |
| Accessibility | accessibility-scale score | higher |

### 3.7 Threats to Validity and Mitigation

- **Learning effect:** randomize order of condition exposure.
- **Task familiarity:** use equivalent but not identical route sets.
- **Device variability:** standardize test device/browser where possible.
- **Connectivity variance:** use stable campus network during tests.
- **Observer bias:** use predefined scoring rubrics and dual-check encoding.

---

## Chapter 4: Results Status, Interpretation Plan, and Recommendations

### 4.1 Current Study Status

At this revision stage, the project has:

- completed development and technical validation,
- finalized quantitative field-evaluation protocol,
- **not yet included final human-subject outcome data**.

To preserve research integrity, no empirical performance gains are fabricated in this paper version.

### 4.2 Planned Result Presentation Format

When data collection is completed, report results in this order:

1. participant profile,
2. condition-wise objective performance,
3. usability (SUS) summary and interpretation,
4. accessibility score analysis,
5. inferential comparison with effect sizes.

### 4.3 Interpretation Rules

- Reject H0 when p < .05 in pre-specified tests.
- Report effect size alongside significance (e.g., Cohen’s d, rank-biserial, or equivalent).
- Distinguish statistical significance from practical significance.

### 4.4 Provisional Conclusion (Based on Literature + Technical Validation)

Existing literature and implementation evidence indicate GP-ESS is a technically sound and context-relevant approach for inclusive school wayfinding. The architecture and validated routing behavior justify progression to full field testing.

### 4.5 Recommendations

1. Execute full participant testing with balanced subgroup representation.
2. Prioritize PWD-inclusive trial protocols and safety accommodations.
3. Add multilingual and audio-guided variants after baseline study.
4. Extend map coverage to additional school buildings after pilot success.
5. Institutionalize periodic usability/accessibility reassessment each term.

---

## References

Bangor, A., Kortum, P. T., & Miller, J. T. (2008). An empirical evaluation of the System Usability Scale. *International Journal of Human-Computer Interaction, 24*(6), 574–594. https://doi.org/10.1080/10447310802205776

Bangor, A., Kortum, P., & Miller, J. (2009). Determining what individual SUS scores mean: Adding an adjective rating scale. *Journal of Usability Studies, 4*(3), 114–123.

Brooke, J. (1996). SUS: A quick and dirty usability scale. In P. W. Jordan, B. Thomas, I. L. McClelland, & B. Weerdmeester (Eds.), *Usability Evaluation in Industry* (pp. 189–194). Taylor & Francis.

Cenezan, J. F. (2025). ISNIT: Immersive school navigation through interactive tour of Ilocos Sur Polytechnic State College – Main campus. In J. Handhika et al. (Eds.), *Proceedings of the 5th International Conference on Education and Technology (ICETECH 2024)* (Vol. 959). Atlantis Press. https://doi.org/10.2991/978-2-38476-493-8_16

Concept3D. (2025). *Concept3D vs Google Maps for higher education*. https://concept3d.com/concept3d-vs-google-maps/

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly, 13*(3), 319–340.

Faul, F., Erdfelder, E., Buchner, A., & Lang, A.-G. (2009). Statistical power analyses using G*Power 3.1: Tests for correlation and regression analyses. *Behavior Research Methods, 41*(4), 1149–1160. https://doi.org/10.3758/BRM.41.4.1149

Filippidis, P., et al. (2021). On supporting university communities in indoor wayfinding. https://pmc.ncbi.nlm.nih.gov/articles/PMC8124871/

International Organization for Standardization. (2019). *ISO 9241-210:2019 Ergonomics of human-system interaction—Part 210: Human-centred design for interactive systems*.

Lawphil. (1983). *Batas Pambansa Blg. 344: An Act to Enhance the Mobility of Disabled Persons*. https://lawphil.net/statutes/bataspam/bp1983/bp_344_1983.html

Lawphil. (1992). *Republic Act No. 7277: Magna Carta for Disabled Persons*. https://lawphil.net/statutes/repacts/ra1992/ra_7277_1992.html

Ma, L., et al. (2024). Augmented reality for campus wayfinding. https://eprints.whiterose.ac.uk/id/eprint/236973/1/VL-59-3-Ma-8857.pdf

Manares, P. L., Buñag, J. E., Occeña, F. L. I., & Villaluna, J. C. P. (2019). *Central Philippine University smart touch information kiosk with campus navigation* (Unpublished special paper). Central Philippine University. https://hdl.handle.net/20.500.12852/2344

MapConnect. (n.d.). *MapConnect – The Google Maps of schools*. https://mapconnect.org

Neelakantappa, B. B., Madhura, S., Meghana, C. L., & Mandara, H. P. (2025). Smart campus navigation system. *International Journal for Multidisciplinary Research, 7*(1). https://www.ijfmr.com/papers/2025/1/34970.pdf

Olaleye, S. B., Adebiyi, B. A., Abdulsalaam, A., Nwosu, F. C., Adeyanju, A. O., Ambi, H. M., & Omolayo, C. (2024). Evaluating the usability and effectiveness of a special education campus navigation system for students with visual impairment. *Journal of Intelligent Systems and Control, 3*(2), 84–92. https://doi.org/10.56578/jisc030202

Pilski, M., Mikułowski, D., & Terlikowski, G. (2023). An indoor campus navigation system for users with disabilities. *Studia Informatica. System and Information Technology, 29*(2), 81–93. https://doi.org/10.34739/si.2023.29.06

Popa, A., & Chircu, S. (2025). Navigating the campus: Accessibility challenges for students with disabilities. https://sserr.ro/wp-content/uploads/2025/07/sserr-12-1-160-170.pdf

World Health Organization. (2023). *Disability and health* (Fact sheet). https://www.who.int/news-room/fact-sheets/detail/disability-and-health

---

## Appendix A: Suggested Quantitative Questionnaire Items (5-point Likert)

1. GP-ESS helped me find my destination faster than my usual method.
2. The route instructions were clear and easy to follow.
3. I could easily identify where to go when changing floors.
4. The map and labels were readable on my device.
5. I felt confident navigating the building using GP-ESS.
6. GP-ESS reduced my need to ask others for directions.
7. The route suggested by GP-ESS was accurate.
8. The system was easy to learn on first use.
9. GP-ESS gave me suitable route options for accessibility needs.
10. I would use GP-ESS again for campus navigation.

## Appendix B: Suggested Result Tables (to fill after data collection)

### Table B1. Task Completion Time by Method

| Participant ID | Traditional (sec) | GP-ESS (sec) | Difference |
|---|---:|---:|---:|
| P01 |  |  |  |
| ... |  |  |  |

### Table B2. Destination Success Rate by Method

| Method | Success (n) | Failure (n) | Success % |
|---|---:|---:|---:|
| Traditional |  |  |  |
| GP-ESS |  |  |  |

### Table B3. SUS Summary

| Metric | Value |
|---|---:|
| Mean SUS |  |
| SD |  |
| Interpretation band |  |

### Table B4. Accessibility Scale Summary

| Dimension | Mean | SD |
|---|---:|---:|
| Route suitability |  |  |
| Instruction clarity |  |  |
| Perceived independence |  |  |
| Perceived safety |  |  |
