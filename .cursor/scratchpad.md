Background and Motivation

- Fix visual bug where the top navigation content appeared cut off at the bottom on some viewports.
- Simplify the header according to request: remove all top nav links and CTA, keep only light/dark mode toggle (and brand).

Key Challenges and Analysis

- Cut-off likely due to tight fixed height on the header combined with icon/text vertical alignment. Solution: use min height and add vertical padding to guarantee adequate line-height.
- Keep ThemeToggle accessible on desktop and mobile without the hamburger menu.

High-level Task Breakdown

1) Adjust header sizing to prevent clipping
   - Success: Navbar has sufficient vertical space; no text/icon cropping at any scale.
2) Remove all top nav links and CTA while keeping ThemeToggle and brand
   - Success: Only logo + theme toggle are present; no menu links; sticky glass bar preserved.
3) Verify live on dev server
   - Success: Home page renders, header looks correct, server healthy on port 49761.

Project Status Board

- [x] Fix header clipping (min-h-16 + py-2)
- [x] Remove nav links + CTA, keep ThemeToggle
- [x] Verify on localhost:49761
- [ ] Await product decision: keep brand in header or remove header entirely and float ThemeToggle elsewhere

Current Status / Progress Tracking

- Implemented `src/components/ui/navbar.tsx` edits to remove links and CTA, retained logo + `ThemeToggle`. Increased header vertical space with `min-h-16 py-2`.
- Verified locally: server running at http://localhost:49761, HTML shows only theme toggle in header and no clipping.

Executor's Feedback or Assistance Requests

- Do you want to keep the ATP logo/brand in the header, or remove the entire bar and place the ThemeToggle elsewhere (e.g., floating button in the corner)? I can implement either.

Lessons

- Avoid fixed header heights when containing mixed-size iconography and text; prefer min-height + padding to prevent clipping across fonts and device pixel ratios.

