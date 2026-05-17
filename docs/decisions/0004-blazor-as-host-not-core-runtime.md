# Decision 0004: Blazor as Host, Not Core Runtime

- Status: Accepted
- Decision: Keep Blazor as the primary host surface without making it the owner of runtime internals.
- Consequences: The browser runtime remains a first-class subsystem with stable integration boundaries.
