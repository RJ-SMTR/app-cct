# Project Context

## Agent monthly payments
- The monthly API returns orders with separate attempted and effective payment dates. A date outside the selected month alone does not prove stale UI data; preserve the response semantics.
- Grouped payment order IDs are not guaranteed to identify a unique displayed row. Repeated groups must remain independently renderable.
- Monthly dashboard requests must ignore obsolete completions when the selected agent/month changes.
