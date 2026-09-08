# Edge Case Hunter — Path Tracer

Review the diff in `review-diff-e2eeca06.md` (commit `e2eeca06`) plus read the project as needed. Walk every branching path and boundary condition reachable from changed lines and report ONLY unhandled edge cases.

Also consider: admin role scoping (`resort_manager` via `admin_user_lots`), `lotId` PostgREST inner-join filter behavior, and impersonation context (`admin_impersonate` cookie).

Output ONLY a valid JSON array: `[{"location":"...","trigger_condition":"...","guard_snippet":"...","potential_consequence":"..."}]`
