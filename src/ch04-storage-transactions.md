# 4. Storage, Indexes, and Transactions

> **Tip:** Storage design is mostly about matching access patterns to the right shape of data.

```mermaid
flowchart TD
  Q[Query shape] --> P{Point lookup?}
  P -->|yes| H[Hash / KV]
  P -->|no| R{Range or sort?}
  R -->|yes| B[B-tree / LSM]
  R -->|no| C[Specialized store]
```

```mermaid
flowchart LR
  W[Write] --> WAL[Write-ahead log]
  WAL --> Mem[Memtable]
  Mem -->|flush| SST[SSTable]
  SST --> Comp[Compaction]
```

## Indexes

- **Hash index**: fast exact lookups, no range support.
- **B-tree**: ordered access and range queries. Good for mixed read/write workloads. Writes can cause page splits and random I/O — not write-optimized.
- **LSM tree**: write-optimized. Writes go to an in-memory memtable first, then flush to immutable SSTables on disk. Reads check memtable → SSTables (newest to oldest), aided by Bloom filters to skip irrelevant files. The WAL exists for crash recovery only — it is not in the normal read path.

```mermaid
flowchart LR
  R[Read] --> MEM[Memtable]
  MEM -->|miss| BF[Bloom filter check]
  BF -->|might exist| SST[SSTable scan]
  BF -->|definitely absent| SKIP[Skip file]
```

## Concurrency control: MVCC and 2PL

Two mechanisms underpin every isolation level:

**Multi-Version Concurrency Control (MVCC)**
- Each write creates a new version; old versions are kept for active readers.
- Readers never block writers; writers never block readers.
- Snapshot isolation is built on MVCC: a transaction sees the consistent snapshot from its start time.
- Used by PostgreSQL, MySQL InnoDB, Oracle.

**Two-Phase Locking (2PL)**
- Phase 1 (growing): acquire locks, never release.
- Phase 2 (shrinking): release locks, never acquire.
- Ensures serializability but can cause deadlocks and long lock contention.
- Strict 2PL (hold until commit) is the common variant.

```mermaid
sequenceDiagram
  participant T1 as Txn 1 MVCC
  participant T2 as Txn 2 MVCC
  participant DB
  T1->>DB: BEGIN, snapshot at T=100
  T2->>DB: UPDATE row (creates version T=101)
  T1->>DB: SELECT row - sees version T=100, not blocked
  T2->>DB: COMMIT
  T1->>DB: COMMIT
  Note over T1,DB: readers never blocked writers
```

| Mechanism | Readers block writers? | Writers block readers? | Used for |
|---|---|---|---|
| MVCC | no | no | snapshot isolation, read-heavy |
| 2PL | yes | yes | serializability, write-heavy |

## Row vs column

- Row stores are strong for transactional point reads and updates.
- Column stores are strong for scans and analytics.

## ACID

- **Atomicity**: all or nothing.
- **Consistency**: invariants still hold.
- **Isolation**: concurrent transactions do not step on each other.
- **Durability**: committed data survives failure.

## Isolation levels

| Level | Main property | Main risk |
|---|---|---|
| Read committed | no dirty reads | non-repeatable reads |
| Snapshot isolation | stable snapshot | write skew |
| Serializable | behaves like one-at-a-time | lower throughput |

> **Note:** A transaction is not correct because it "usually works." It is correct when the invariants survive the worst interleaving you can imagine.
