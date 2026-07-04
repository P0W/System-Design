# Google Product Systems: First Principles

A concept-first system design book for product architecture reviews.

The style is intentionally visual and concise, inspired by the structural clarity of Alex Xu’s system design books and the diagram-first style popularized by ByteByteGo. The goal is to teach the mental model first, then the implementation details.

The focus is Google products: Gmail, YouTube, Calendar, Payments, News, Docs, Drive, and the supporting platform primitives.
The deeper scenario notes already in `customer_facing/` and `distributed_services/` remain the practice lab.

The default stack is **local/open-source first**. When cloud services are mentioned, the book maps them across GCP, AWS, and Azure so the reader can swap names without changing the architecture.

## What is inside

| Chapter | Concepts covered |
|---|---|
| 1 | A reusable template for solving any system design problem |
| 2 | Scale, latency, throughput, availability, consistency, CAP |
| 3 | DNS, CDN, load balancers, API gateways, rate limiting |
| 4 | Indexes, storage engines, transactions, ACID, isolation |
| 5 | Replication, partitioning, quorums, consensus, coordination |
| 6 | PostgreSQL, MySQL, Spanner, DynamoDB, Cassandra, Redis |
| 7 | Message brokers, queues, pub/sub, Kafka, event-driven design |
| 8 | Batch, stream processing, search, analytics, specialized stores |
| 9 | Realtime systems, collaboration, notifications, distributed locks |
| 10 | Reliability, security, observability, deployment, Kubernetes |
| 11 | etcd, HAProxy, PostgreSQL, PgBouncer, and production open-source stacks |
| 12 | Google product archetypes: Gmail, YouTube, Calendar, Payments, News, Docs, Drive |
| 13 | Bloom filters, WAL, leases, heartbeats, gossip, split brain, fencing, vector clocks, repair |
| 14 | Local-first tools and cloud equivalents across GCP, AWS, and Azure |

## Start here

1. Read `src/preface.md`.
2. Use `src/ch01-playbook.md` as the design script.
3. Read the remaining chapters in order once.
4. Re-read the diagrams and tables before memorizing prose.

## Flavor

- Inspired by Alex Xu, ByteByteGo, and standard system design writing
- Anchored in trade-offs, bottlenecks, and failure modes
- Kept short enough to be read, remembered, and reused
