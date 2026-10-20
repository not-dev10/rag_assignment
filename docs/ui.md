# UI Specification --- Next.js

## 1. Design direction

Create a polished, responsive document Q&A interface using Next.js App
Router, TypeScript, and Tailwind CSS. Keep the visual design clean and
readable. The central product promise is that answers are grounded in
uploaded documents, with visible evidence and honest fallback behavior.

## 2. Page layout

### Header

-   Product name: `DocuMind` (placeholder).
-   Subtitle: `Ask questions grounded in your documents`.
-   Knowledge-base status and count of indexed documents.
-   Health indicator for API availability, without exposing internal
    service URLs.

### Main chat area

-   Empty state with a short explanation and example questions.
-   User messages clearly distinguished from assistant messages.
-   Assistant answers rendered as Markdown with safe rendering.
-   A `Sources` area under each answer.
-   Each source shows filename, page/section/chunk metadata, and a short
    excerpt.
-   Fallback responses are visually distinct from evidence-backed
    answers.

### Composer

-   Multiline textarea with placeholder:
    `Ask something about your documents…`
-   Send button.
-   Disable submit when the input is empty or a request is in progress.
-   Enter submits and Shift+Enter inserts a newline, if this behavior is
    implemented accessibly.
-   Show loading state while waiting for Node API.
-   Display retry-friendly errors.

### Documents panel

-   Upload `.pdf`, `.md`, and `.txt`.
-   List filename, status, and chunk count.
-   Show indexing progress/status and clear errors.
-   Confirm before deleting an indexed document.
-   If upload/deletion is not implemented, do not show inert controls.

## 3. Source display example

**Answer:** Annual leave requests should be submitted through the
employee portal.

**Sources** - `employee_handbook.pdf` · Page 12 · Leave Requests -
Excerpt: "Employees should submit annual leave requests through the
employee portal..."

Only display a page, heading, or excerpt if it came from retrieved
metadata/text.

## 4. UI states

  -----------------------------------------------------------------------
  State                               UI behavior
  ----------------------------------- -----------------------------------
  Initial                             Explain the feature and show
                                      example prompts

  Loading                             Show progress and disable duplicate
                                      submission

  Answered                            Render answer and per-answer
                                      citations

  Insufficient evidence               Show clear fallback and suggest
                                      adding/rephrasing documents

  No documents                        Explain that documents must be
                                      indexed first

  Empty question                      Inline validation; do not call API

  Uploading/indexing                  Show per-file status

  Upload failure                      Explain supported formats and
                                      recovery

  Node API unavailable                Show retry-friendly service error

  AI service/provider failure         Show safe message without stack
                                      trace

  Retrieval failure                   Do not display a fabricated answer
  -----------------------------------------------------------------------

## 5. Frontend/backend boundary

-   The browser calls the Node API only.
-   Store `NODE_API_BASE_URL` in the Next.js server-side environment
    when requests are made from server routes/components.
-   Never expose model API keys via `NEXT_PUBLIC_*`.
-   If the browser calls the Node API directly, configure CORS
    explicitly and keep secrets out of frontend code.
-   Validate file type and size in the UI for user experience, but
    repeat validation in the backend for security.

## 6. Accessibility and responsive behavior

-   Use semantic headings and labelled inputs.
-   Support keyboard navigation and visible focus.
-   Announce loading/error/result status to assistive technologies.
-   Do not rely on color alone to indicate status.
-   Desktop: document panel plus centered chat.
-   Mobile: single-column layout with expandable documents panel.
-   Ensure citations wrap naturally without horizontal overflow.

## 7. Visual acceptance checklist

-   [ ] New users understand that answers are based on uploaded
    documents.
-   [ ] Sources are visible and inspectable.
-   [ ] Fallback is clear and does not imply certainty.
-   [ ] Empty, loading, upload, and service-error states work.
-   [ ] All controls are functional.
-   [ ] Responsive layout works on mobile and desktop.
