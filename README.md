# System Design: First Principles

A concept-first system design book for product and platform architecture reviews.

The style is intentionally visual and concise: learn the mental model first, then map it to concrete technologies. The book favors activity diagrams, decision flows, and trade-off tables so each chapter is easy to scan and reuse.

The default stack is **local/open-source first**. When managed cloud services are useful, the book maps them across major providers so readers can swap names without changing the architecture.

## What is inside

| Chapter | Concepts covered |
|---|---|
| 1 | A reusable template for solving system design problems |
| 2 | Scale, latency, throughput, availability, consistency, CAP |
| 3 | DNS, CDN, load balancers, API gateways, rate limiting, request activity flow |
| 4 | Indexes, storage engines, transactions, ACID, isolation, safe write activity flow |
| 5 | Replication, partitioning, quorums, consensus, coordination, Raft commit flow |
| 6 | Bloom filters, WAL, leases, heartbeats, gossip, split brain, fencing, vector clocks, repair |
| 7 | PostgreSQL, MySQL, Spanner, DynamoDB, Cassandra, Redis |
| 8 | Message brokers, queues, pub/sub, Kafka, event-driven design, robust consumer flow |
| 9 | Batch, stream processing, search, analytics, specialized stores |
| 10 | Realtime systems, collaboration, notifications, distributed locks |
| 11 | Reliability, security, observability, deployment, incident response flow |
| 12 | etcd, HAProxy, PostgreSQL, PgBouncer, and production open-source stacks |
| 13 | Production topologies for resilient services and data layers |
| 14 | Local-first tools and cloud equivalents across major providers |
| 15 | Product archetypes for mail, video, calendar, payments, news, documents, storage, and maps |
| 16 | Competing systems and why different products choose different trade-offs |
| 17 | A compact cheat sheet for quick review |

## How to use the diagrams

- Start with the activity diagram in each chapter to understand the lifecycle.
- Use decision diamonds as checkpoints: each branch should map to a real operational choice.
- Read sequence diagrams for timing, retries, acknowledgement points, and failure boundaries.
- Revisit tables after the diagrams to compare trade-offs without losing the flow.

## Start here

1. Read `src/preface.md`.
2. Use `src/ch01-playbook.md` as the design script.
3. Read the remaining chapters in order once.
4. Re-read the diagrams and tables before memorizing prose.

## Flavor

- Diagram-first explanations
- Anchored in trade-offs, bottlenecks, and failure modes
- Short enough to be read, remembered, and reused
