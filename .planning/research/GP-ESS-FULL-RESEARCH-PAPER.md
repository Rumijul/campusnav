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

Navigating a multi-floor school building can be difficult for first-time visitors and learners, and even more challenging for persons with disabilities (PWDs) who require barrier-free routes and clear wayfinding cues. This study presents **GP-ESS**, a user-centered digital campus navigation system developed for the Main Building of Elizabeth Seton School – South. GP-ESS provides interactive map-based navigation, step-by-step directions, floor-aware routing, and accessible-path options designed for four key user groups: PWDs, parents, guests, and new learners.

The study uses a **quantitative developmental-evaluation design** with comparative task performance (traditional wayfinding vs. GP-ESS), usability measurement (System Usability Scale-adapted items), and accessibility evaluation. The paper also reports technical validation of the software through automated test evidence from the implemented system. Initial system validation confirms robust route computation and reliability under tested scenarios, including accessible routing and multi-floor traversal logic. The proposed field evaluation framework is designed to quantify improvements in navigation efficiency, route accuracy, usability, and accessibility.

**Keywords:** campus navigation, wayfinding, accessibility, user-centered design, PWD, indoor routing, smart campus

---

## Chapter 1: The Problem and Its Background

### Background of the Study

Finding one’s destination inside a school building is often assumed to be straightforward. In practice, this is not always true—especially in multi-floor environments where users must interpret floor layouts, connector points, and room sequences. For **persons with disabilities (PWDs)**, **parents**, **guests**, and **new learners**, the challenge is amplified by unfamiliarity, mobility constraints, uncertainty, and inconsistent signage.

In many schools, wayfinding still depends on static printed maps, hallway signboards, or verbal instructions from staff. While these methods can help, they are typically non-personalized, not always available at the moment of need, and frequently inaccessible for users with mobility or visual limitations (Pilski et al., 2023; Olaleye et al., 2024).

This gap is especially relevant in school settings that receive a mix of daily users and periodic visitors. A digital system that provides clear, floor-aware, and accessibility-sensitive directions can reduce confusion, improve independence, and strengthen user confidence during campus movement.

In response, this study develops **GP-ESS**, a user-centered navigation system for the Main Building of Elizabeth Seton School – South. The system is intended to improve wayfinding outcomes by combining interactive visual navigation with accessible route options and straightforward user interaction.

### Review of Related Literature

#### Indoor wayfinding limitations of conventional GPS and static methods

Outdoor GPS-based tools are effective for open environments but less reliable in indoor spaces where structural obstructions and floor separation reduce positional precision (Pilski et al., 2023; Ma et al., 2024). For room-level guidance, users typically require an indoor-focused logic that models corridors, nodes, and inter-floor connectors.

Static maps and manual inquiries can support orientation, but they assume users can quickly interpret spatial diagrams or locate staff for assistance. This assumption is often invalid for first-time visitors and users under time pressure.

#### Accessibility in campus navigation

Inclusive navigation systems should support multiple accessibility needs through barrier-free route prioritization, clear instruction design, high-contrast interfaces, and multimodal guidance where feasible (Olaleye et al., 2024; Popa & Chircu, 2025). Accessibility in wayfinding is not only about mobility pathways; it also concerns cognitive load, confidence, and perceived safety while navigating unfamiliar environments.

#### Digital campus map platforms and smart navigation

Digital campus systems such as MapConnect and Concept3D demonstrate the value of interactive wayfinding for educational institutions (MapConnect, n.d.; Concept3D, 2025). Studies on smart campus navigation report improvements in orientation efficiency and user confidence when systems provide explicit, step-level guidance rather than passive map displays (Neelakantappa et al., 2025).

#### Local and Philippine context

Local efforts such as ISNIT and campus information kiosks show strong interest in school navigation digitization in the Philippines (Cenezan, 2025; Manares et al., 2019). However, many implementations remain fixed-location or limited in mobile interactivity and accessibility-specific route support.

### Synthesis and Research Gap

Literature consistently supports the value of digital wayfinding, but clear gaps remain:

1. Many systems are optimized for general student populations rather than diverse user groups (PWDs, parents, guests, and new learners).
2. Accessibility support is often partial (e.g., route display without explicit barrier-free alternatives).
3. Local school deployments are less documented in terms of quantitative outcomes on usability, accuracy, and accessibility.

This study addresses these gaps by developing and evaluating a focused, school-specific, user-centered system with explicit accessibility and comparative wayfinding assessment.

### Theoretical Framework

This study is anchored on three complementary perspectives:

1. **User-Centered Design (UCD)** – emphasizes iterative design grounded in user needs, contexts, and feedback (ISO 9241-210).
2. **Universal Design Principles** – supports environments and systems usable by people with diverse abilities with minimal adaptation (Mace, 1998).
3. **Technology Acceptance Model (TAM)** – explains adoption through perceived usefulness and perceived ease of use (Davis, 1989).

Applied to GP-ESS, these frameworks imply that a navigation tool is more likely to be used and trusted when it is easy to understand, functionally helpful, and inclusive by design.

### Conceptual Framework (Input–Process–Output)

| Component | Description |
|---|---|
| **Input** | User profiles (PWDs, parents, guests, new learners), building map data, room/facility metadata, accessibility constraints, baseline wayfinding methods |
| **Process** | User-centered design, route graph modeling, accessible-path logic, interface development, pilot validation, comparative user testing |
| **Output** | GP-ESS web navigation system; measured effects on navigation efficiency, route accuracy, usability, and accessibility |

### Statement of the Problem

This study seeks to evaluate the design, development, and effectiveness of GP-ESS as a user-centered, inclusive campus navigation system for the Main Building of Elizabeth Seton School – South.

Specifically, it answers the following questions:

1. What is the level of ease in locating rooms and facilities in the Main Building when using GP-ESS?
2. What is the level of route accuracy of GP-ESS in guiding users to specific destinations?
3. What is the level of usability of GP-ESS in terms of ease of use, clarity of directions, and interface design?
4. What is the level of accessibility of GP-ESS for PWD users, particularly those with mobility and visual-related wayfinding needs?
5. How does GP-ESS compare with traditional wayfinding methods (printed maps and verbal directions) in effectiveness, usability, and accessibility?

### Hypotheses

**Null Hypothesis (H0):**  
GP-ESS does not produce a statistically significant improvement in navigation efficiency, route accuracy, usability, and accessibility for PWDs, parents, guests, and new learners in the Main Building of Elizabeth Seton School – South, compared with traditional wayfinding methods.

**Alternative Hypothesis (Ha):**  
GP-ESS produces a statistically significant improvement in navigation efficiency, route accuracy, usability, and accessibility for PWDs, parents, guests, and new learners in the Main Building of Elizabeth Seton School – South, compared with traditional wayfinding methods.

### Significance of the Study

- **PWDs:** Improves independent movement through clearer barrier-aware navigation.
- **Parents and Guests:** Reduces confusion and time spent locating offices, classrooms, and facilities.
- **New Learners:** Supports faster campus familiarization and confidence during adjustment.
- **School Administration:** Provides evidence for smart-campus and accessibility initiatives.
- **Future Researchers:** Offers a local reference model for inclusive campus wayfinding studies.

### Scope and Delimitation

#### Scope

This study covers the design and evaluation of GP-ESS for the **Main Building** of Elizabeth Seton School – South. It focuses on wayfinding support for PWDs, parents, guests, and new learners. Evaluation indicators include ease of location, route accuracy, usability, and accessibility.

#### Delimitation

- The system coverage is limited to the Main Building and selected entry points.
- The implementation is web-based (mobile-friendly) and does not rely on custom hardware.
- Real-time indoor positioning may be constrained by infrastructure and may use map-driven route guidance rather than precise continuous indoor geolocation.
- The study is limited to participants available during the data-gathering period.

### Definition of Terms

- **Accessible Route** – A computed path that prioritizes mobility-friendly connectors (e.g., ramp/elevator) and avoids inaccessible segments where possible.
- **Campus Wayfinding** – The process of navigating from a start point to a destination within school premises.
- **GP-ESS** – The proposed user-centered digital navigation system for Elizabeth Seton School – South.
- **Navigation Efficiency** – The speed and effort required to reach a destination.
- **Route Accuracy** – The extent to which provided directions lead correctly and directly to the intended destination.
- **Usability** – The degree to which users can effectively, efficiently, and satisfactorily use the system.

---

## Chapter 2: Methodology

### Research Design

This study uses a **quantitative developmental-comparative design**:

1. **Developmental phase:** design and implementation of GP-ESS using user-centered requirements.
2. **Evaluation phase:** quantitative comparison of GP-ESS-assisted navigation against traditional wayfinding methods.

A **within-subject comparative setup** is recommended, where each participant performs equivalent navigation tasks under two conditions:
- Condition A: traditional method (printed map/verbal inquiry)
- Condition B: GP-ESS

This design enables direct comparison of time, errors, and perceived usability.

### Research Locale

The study is conducted in the **Main Building of Elizabeth Seton School – South**, Anabu II-D, Imus City, Cavite.

### Participants and Sampling

Target participant groups:
- Persons with disabilities (PWDs)
- Parents
- Guests
- New learners

A purposive-convenience sampling strategy may be used, ensuring representation from all four groups. A balanced target allocation (e.g., similar participant counts per group) is recommended for clearer comparative analysis.

### Research Instruments

#### 1) Navigation Task Performance Sheet
Captures objective wayfinding outcomes per task:
- Task completion time (seconds)
- Destination reached (Yes/No)
- Number of wrong turns
- Number of help requests

#### 2) Route Accuracy Checklist
Assesses whether selected path reaches correct destination using intended floor connectors and logical sequence.

#### 3) Usability Questionnaire (Likert 1–5)
Measures:
- Ease of use
- Clarity of directions
- Learnability
- Interface readability and visual structure
- Confidence while navigating

(Items may be aligned with SUS concepts and localized to school wayfinding context.)

#### 4) Accessibility Evaluation Scale
Measures perceived accessibility support, including:
- Route suitability for mobility constraints
- Ease of identifying accessible options
- Perceived safety and independence

### Instrument Validation and Reliability

- Content validation by at least three qualified evaluators (e.g., research adviser, ICT specialist, accessibility-aware reviewer).
- Pilot testing for clarity and administration flow.
- Internal consistency reliability may be estimated through Cronbach’s alpha for multi-item scales.

### Data Gathering Procedure

1. Secure school approval and participant consent.
2. Orient participants and explain task protocol.
3. Administer baseline wayfinding tasks using traditional methods.
4. Administer equivalent tasks using GP-ESS.
5. Record objective performance metrics for each task.
6. Administer usability and accessibility questionnaires.
7. Encode, clean, and analyze data.

### Ethical Considerations

- Informed consent and voluntary participation.
- Right to withdraw at any stage without penalty.
- Anonymized data handling and confidential reporting.
- Safety accommodations for PWD participants during navigation tasks.
- Non-disruptive scheduling to avoid interference with school operations.

### Statistical Treatment of Data

The following quantitative analyses are recommended:

1. **Frequency and Percentage** – participant profile and response distribution.
2. **Weighted Mean** – usability/accessibility perception levels.
3. **Standard Deviation** – response variability.
4. **Paired-Samples t-test** – compare navigation efficiency and accuracy between traditional and GP-ESS conditions (same participants).
5. **One-way ANOVA or subgroup comparison** – evaluate differences among user groups where appropriate.

**Decision rule:** reject H0 when *p* < 0.05.

---

## Chapter 3: System Design and Technical Validation

### System Overview

GP-ESS is implemented as a web-based wayfinding platform with:
- interactive floor-plan map rendering,
- searchable destinations,
- route generation between selected start and end points,
- parallel standard and accessible route logic,
- step-by-step direction output,
- admin-side map and graph editing support.

### Core Technical Design

The system models school navigation as a graph:
- **Nodes:** rooms, entrances, junctions, stairs, ramps, elevators, landmarks
- **Edges:** walkable links with dual weights (standard and accessible)

Pathfinding uses an A* search implementation with route mode switching:
- **Standard mode:** shortest practical walking path
- **Accessible mode:** excludes blocked/inaccessible links and uses accessible weights

### Accessibility-Oriented Functional Behavior

1. Dual-mode route generation (standard and accessible).
2. Connector-aware multi-floor routing (stairs/elevator/ramp logic).
3. Clear turn-by-turn directions and floor-sensitive guidance.
4. User interface designed for quick interpretation of route differences.

### Technical Validation Evidence (Implementation-Level)

Automated verification was executed using the project’s test suite:

- **Command:** `npm test -- --run`
- **Date executed:** 2026-03-24
- **Result:** 10 test files passed, 144 tests passed

Validated areas include:

| Validation Area | Evidence from Test Suite |
|---|---|
| Pathfinding correctness | Confirms route discovery, no-route behavior, same-node behavior, segment generation |
| Accessible routing logic | Confirms avoidance of inaccessible links and alternate connector usage |
| Cross-floor routing | Confirms floor connector traversal and route continuity across floors |
| Performance guardrail | Includes assertion for under-50ms route solve on 500-node grid scenario |
| Direction generation | Verifies instruction generation quality and route comparison behavior |
| Viewport interaction reliability | Verifies touch/gesture math behaviors in map interaction layer |

These technical results establish software correctness and readiness for user-facing quantitative evaluation.

### Field Evaluation Metrics (for Chapter 4 data collection)

| Metric | Operational Definition | Target Direction |
|---|---|---|
| Navigation Efficiency | Mean task completion time per destination | Lower is better |
| Route Accuracy | Successful arrival and path correctness rate | Higher is better |
| Usability Score | Mean Likert/SUS-aligned score | Higher is better |
| Accessibility Score | Mean accessibility-perception score | Higher is better |

### Threats to Validity and Mitigation

- **Learning effect:** randomize task order between methods.
- **Task familiarity bias:** use equivalent, not identical, destination sets.
- **Device variability:** standardize test devices where possible.
- **Connectivity effects:** ensure stable school Wi-Fi during trials.

---

## Chapter 4: Conclusion and Recommendations

### Conclusion

The literature and system development evidence support the feasibility and relevance of GP-ESS as an inclusive wayfinding solution for school environments. Existing campus navigation approaches often under-serve mixed user groups, especially PWDs and first-time visitors. GP-ESS directly addresses this by combining graph-based indoor routing, accessibility-aware path logic, and user-centered interaction design.

At the implementation level, automated technical validation confirms that critical route and direction functions are operating reliably. The next and essential step is full user-based quantitative deployment to empirically test improvements in efficiency, accuracy, usability, and accessibility against traditional methods.

### Recommendations

1. Conduct formal field trials with balanced participant representation across all target groups.
2. Institutionalize GP-ESS for high-traffic events (enrollment, parent conferences, orientation days).
3. Expand accessibility support (audio guidance, multilingual labels, larger-text mode).
4. Extend coverage beyond the Main Building after initial validation.
5. Use periodic analytics and user feedback cycles to continuously improve route clarity and accessibility behavior.

---

## References

Blink Signs. (2023). *Wayfinding accessibility: Inclusive navigation guide*. https://blinksigns.com/wayfinding-accessibility-inclusive-navigation-guide/

Brooke, J. (1996). SUS: A quick and dirty usability scale. In P. W. Jordan, B. Thomas, I. L. McClelland, & B. Weerdmeester (Eds.), *Usability Evaluation in Industry* (pp. 189–194). Taylor & Francis.

Cenezan, J. F. (2025). ISNIT: Immersive school navigation through interactive tour of Ilocos Sur Polytechnic State College – Main campus. In J. Handhika et al. (Eds.), *Proceedings of the 5th International Conference on Education and Technology (ICETECH 2024)* (Vol. 959). Atlantis Press. https://doi.org/10.2991/978-2-38476-493-8_16

Concept3D. (2025). *Concept3D vs Google Maps for higher education*. https://concept3d.com/concept3d-vs-google-maps/

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly, 13*(3), 319–340.

Filippidis, P., et al. (2021). On supporting university communities in indoor wayfinding. https://pmc.ncbi.nlm.nih.gov/articles/PMC8124871/

ISO 9241-210. (2019). *Ergonomics of human-system interaction — Part 210: Human-centred design for interactive systems*.

Ma, L., et al. (2024). Augmented reality for campus wayfinding. https://eprints.whiterose.ac.uk/id/eprint/236973/1/VL-59-3-Ma-8857.pdf

Mace, R. (1998). *Universal design in housing*. Center for Universal Design, North Carolina State University.

Manares, P. L., Buñag, J. E., Occeña, F. L. I., & Villaluna, J. C. P. (2019). *Central Philippine University smart touch information kiosk with campus navigation* (Unpublished special paper). Central Philippine University. https://hdl.handle.net/20.500.12852/2344

MapConnect. (n.d.). *MapConnect – The Google Maps of schools*. https://mapconnect.org

NDA Ireland. (2024). *Improving the accessibility of school buildings*. https://nda.ie/uploads/publications/Improving-the-Accessibility-of-Schools-Report-pdf.pdf

Neelakantappa, B. B., Madhura, S., Meghana, C. L., & Mandara, H. P. (2025). Smart campus navigation system. *International Journal for Multidisciplinary Research, 7*(1). https://www.ijfmr.com/papers/2025/1/34970.pdf

Olaleye, S. B., Adebiyi, B. A., Abdulsalaam, A., Nwosu, F. C., Adeyanju, A. O., Ambi, H. M., & Omolayo, C. (2024). Evaluating the usability and effectiveness of a special education campus navigation system for students with visual impairment. *Journal of Intelligent Systems and Control, 3*(2), 84–92. https://doi.org/10.56578/jisc030202

Pilski, M., Mikułowski, D., & Terlikowski, G. (2023). An indoor campus navigation system for users with disabilities. *Studia Informatica. System and Information Technology, 29*(2), 81–93. https://doi.org/10.34739/si.2023.29.06

Popa, A., & Chircu, S. (2025). Navigating the campus: Accessibility challenges for students with disabilities. https://sserr.ro/wp-content/uploads/2025/07/sserr-12-1-160-170.pdf

Scribd Research. (2023). *Digital locator app's impact on school navigation*. https://www.scribd.com/document/835188174/Research-Paper

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
9. The system’s accessibility support was adequate for my needs.
10. I would use GP-ESS again for campus navigation.
