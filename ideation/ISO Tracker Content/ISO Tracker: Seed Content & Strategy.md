# ISO Tracker: Seed Content & Strategy

## 1. Executive Summary

To establish ISO Tracker as the definitive platform for interstellar object analysis, we must launch with rich, engaging, and scientifically-grounded seed content for the three known ISOs: 1I/‘Oumuamua, 2I/Borisov, and 3I/ATLAS. This document outlines a structured content plan centered around the **Loeb Scale**, transforming the platform from a passive information source into an interactive, debate-driven community.

This strategy directly addresses the user's request to incorporate Avi Loeb's assessment criteria, providing a fun, scientific, and highly engaging core for the platform. The content is designed to be objective, evidence-based, and structured to fuel community debate and long-term user retention.

## 2. Recommended Content Structure

We will implement a hierarchical content structure that is easy to navigate and encourages deep exploration.

**Site Navigation:**

- `/objects` (Main landing page for all ISOs)
  - `/objects/1i-oumuamua` (Profile page for 1I/‘Oumuamua)
  - `/objects/2i-borisov` (Profile page for 2I/Borisov)
  - `/objects/3i-atlas` (Profile page for 3I/ATLAS)

### 2.1. Object Profile Page Template

Each object's profile page will be the heart of the platform and must contain the following sections in this order:

1.  **Hero Section:**
    *   Object Name & Designation
    *   High-quality artist's impression or real image.
    *   **Live Loeb Scale Score:** A prominent visual gauge (0-10) showing the current official assessment. This is the most critical element.
    *   A one-sentence summary (e.g., "The first interstellar visitor, exhibiting anomalous acceleration without a visible coma.")

2.  **Live Tracker (Future MVP Feature):**
    *   A placeholder for the future 2D/AR live tracker.
    *   For now, a static image of its trajectory through the solar system.

3.  **Loeb Scale Assessment Dashboard (Interactive):**
    *   This is the core interactive feature. It will be a checklist of the key Loeb Scale criteria.
    *   For each criterion, display:
        *   **Criterion Name:** (e.g., "Non-Gravitational Acceleration")
        *   **Status:** (Met / Not Met / Uncertain / Not Applicable)
        *   **Evidence Summary:** A one-sentence summary of the finding.
        *   **Link:** A link to the detailed "Evidence Card" below.

4.  **Evidence Locker (Detailed Breakdown):**
    *   A collection of "Evidence Cards," one for each significant piece of data.
    *   This section provides the "real reasons to believe" as per Marketing Physics.

5.  **Community Verdict:**
    *   Display the community's average Loeb Scale assessment, contrasted with the official score.
    *   Show voting distributions for key debates.

6.  **Discovery & History:**
    *   A narrative summary of the object's discovery, observation campaign, and key milestones.

## 3. The "Evidence Card" Component

This is the atomic unit of our content. Each card must be structured for clarity and to encourage debate.

**Evidence Card Template:**

*   **Claim:** A clear, concise statement of the finding. (e.g., "3I/ATLAS has an unusually high Nickel-to-Iron ratio.")
*   **Source:** The primary scientific paper or data source (e.g., "Hibberd et al., arXiv:2510.11779"). Must be a clickable link.
*   **The Data:** A simple summary of the quantitative data. (e.g., "The Ni/Fe ratio is orders of magnitude higher than all known comets.")
*   **The Debate:**
    *   **Natural Interpretation:** How can this be explained by natural cometary processes? (e.g., "The object may have formed in a nickel-rich region of its parent star system.")
    *   **Anomalous Interpretation:** Why is this unusual or suggestive of technology? (e.g., "This ratio is consistent with some industrially-produced nickel alloys and has never been seen in a natural object.")
*   **Community Vote (Analyst Tier Feature):** Buttons for users to vote: "Natural," "Anomalous," or "Uncertain."

## 4. Seed Content Action Plan

I have already researched and structured the necessary seed content based on the best available scientific literature. The following files contain the raw data and analysis to populate the initial Evidence Cards for each object.

-   **`iso_evidence_research.md`**: Contains the detailed findings for all three objects, including sources.
-   **`loeb_scale_analysis.md`**: Provides the comparative analysis and summary table, which can be used for the main `/objects` page.

**Immediate Task:**

Your development team or you, with AI assistance, should now take the structured content from these files and build out the profile pages and evidence cards within your platform's content management system.

**Example: Creating the first Evidence Card for 1I/‘Oumuamua:**

1.  **Claim:** 1I/‘Oumuamua exhibited significant non-gravitational acceleration.
2.  **Source:** [Micheli et al., Nature 559, 223–226 (2018)](https://www.nature.com/articles/s41586-018-0254-4)
3.  **The Data:** A deviation from a purely gravity-driven path was detected at 30σ significance.
4.  **The Debate:**
    *   **Natural:** Could be outgassing of invisible material like hydrogen ice.
    *   **Anomalous:** Could be a thin object propelled by solar radiation pressure (a light sail).

## 5. Recommendation Summary

By adopting this content strategy, you will:

*   **Launch with a content-rich platform** that immediately establishes credibility.
*   **Center the user experience around the Loeb Scale**, your key differentiator.
*   **Provide immense value** to all three user tiers (Spectators, Debaters, and Observers).
*   **Create a powerful engine for community engagement** and long-term retention.

This plan provides a clear path to transforming your platform's architecture and product description into a tangible, engaging user experience. It is the crucial bridge between your technical foundation and your strategic vision.
