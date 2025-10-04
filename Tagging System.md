# 🏷️ Tagging Service — Scalable User-Generated Tag Management

A highly available and scalable system for handling **millions of user-created tags**, powering tag-based categorization, search, and recommendations across multiple entity types (posts, documents, products, etc.).

---

## 1. 🧩 Functional Requirements (FRs)
- CRUD operations for tags (`Create`, `Read`, `Update`, `Delete`).
- Bulk tag creation and assignment to entities.
- Search, suggest, and autocomplete for tags.
- Merge, rename, and archive tags.
- Manage tag metadata (creator, timestamp, description).
- Track tag popularity and usage stats.
- Support multilingual and case-insensitive search.

---

## 2. ⚙️ Non-Functional Requirements (NFRs)
- **Consistency:** Strong consistency for tag creation, eventual for reads.
- **Availability:** ≥ 99.99%, achieved through replication and failover.
- **Partition Tolerance:** Critical, as data spans multiple regions.
- **Latency Targets:**
  - Reads: < 50 ms (P95)
  - Writes: < 200 ms (P95)
- **Traffic Estimates:**
  - DAU: ~20 million
  - QPS: ~5 K reads / 1 K writes.
- **Load Profile:** Read-heavy (80:20) to support frequent autocomplete/search.
- **Database Architecture:** Optimized for high read throughput, distributed indexing.

---

## 3. 📋 Assumptions
- Tags can be associated with multiple entity types via polymorphic references.
- API traffic is global, requiring multi-region deployment (US, EU, APAC).
- Each entity supports up to 50 tags.
- Services communicate via gRPC/REST through an API Gateway.
- Stack uses **.NET**, **Kubernetes**, **Kafka**, **Elasticsearch**, **PostgreSQL**, and **Redis**.

---

## 4. 🧱 Core Entities
| Entity               | Description                              | Example Fields                                                      |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| **Tag**              | Master record for a user-generated label | `tag_id`, `name`, `slug`, `created_by`, `created_at`, `usage_count` |
| **EntityTagMapping** | Links tags to posts/products/etc.        | `entity_id`, `tag_id`, `entity_type`, `created_at`                  |
| **User**             | Tag creator or consumer                  | `user_id`, `username`, `reputation_score`                           |

---

## 5. 🌐 API Endpoints

| Method   | Endpoint                 | Description           | Request Body              | Response / Codes               |
| -------- | ------------------------ | --------------------- | ------------------------- | ------------------------------ |
| `POST`   | `/tags`                  | Create new tag        | `{ name, description }`   | `201 Created`, JSON { tag_id } |
| `GET`    | `/tags/{id}`             | Retrieve tag info     | —                         | `200 OK`, `{ tag }`            |
| `PUT`    | `/tags/{id}`             | Update tag            | `{ name?, description? }` | `200 OK`, `404 Not Found`      |
| `DELETE` | `/tags/{id}`             | Delete tag            | —                         | `204 No Content`               |
| `GET`    | `/tags/search?q={query}` | Autocomplete & search | —                         | `200 OK`, list of tags         |
| `POST`   | `/entities/{id}/tags`    | Attach tags to entity | `{ tags: [string] }`      | `200 OK`, updated entity       |

---

## 6. 🧩 Microservices Overview

| Service                 | Role                                                        |
| ----------------------- | ----------------------------------------------------------- |
| **TagService**          | Manages tag CRUD, metadata, and normalization.              |
| **TagSearchService**    | Handles search, autocomplete, and indexing (Elasticsearch). |
| **EntityTagService**    | Manages tag associations and entity relations.              |
| **TagAnalyticsService** | Tracks tag usage frequency, trend analytics.                |
| **AuthService**         | OAuth2/JWT-based user authentication & authorization.       |
| **IngestionWorker**     | Async worker to sync tags into search index & cache.        |

---

## 7. 🏗️ High-Level Design (HLD)

**🧾 Flow Overview**

![[tagging_system.png]]


***Database Schema Snippets***

```sql
CREATE TABLE tags (
tag_id BIGSERIAL PRIMARY KEY,
name VARCHAR(100) UNIQUE NOT NULL,
slug VARCHAR(120) NOT NULL,
created_by UUID NOT NULL,
created_at TIMESTAMP,
usage_count INT DEFAULT 0
);

CREATE INDEX idx_tags_name_trgm ON tags USING GIN (name gin_trgm_ops);
```

**Partitioning Strategy**
- **PostgreSQL Sharding** by hash(tag_id) → multiple shards per region.
- **Elasticsearch Index Partitioning** based on tag name prefixes.
- **Redis LRU Caching** for top N most frequently used tags.

---

## 8. 🔒 Security Considerations
- Auth via **OAuth2 / JWT tokens**.
- Fine-grained **RBAC** for tag editing/deletion.
- All communication over **TLS 1.3**.
- Sensitive data (user IDs) encrypted at rest via AES-256.
- API throttling to prevent abuse (rate limits per user/IP).

---

## 9. 🧠 Monitoring & Observability
- **Metrics:** Prometheus + Grafana dashboards (latency, QPS, cache hit ratio).
- **Logging:** Centralized via ELK stack.
- **Tracing:** OpenTelemetry + Jaeger for distributed tracing.
- **Alerts:** PagerDuty integration for SLA breach or latency spikes.

---

## 10. ⚡ Scalability & Reliability
- **Kubernetes HPA** for autoscaling stateless services.
- **Multi-region replication** for PostgreSQL and Elasticsearch.
- **Async writes** for analytics pipelines.
- **Blue/Green deployments** for zero-downtime updates.
- **Redis cluster replication** with sentinel failover.

---

## 11. 🔍 Deep Dive (Autocomplete Logic)
**Approach:**
1. Maintain a **Trigram or Prefix Index** on tag names.
2. Use Redis for top-N popular tags (e.g., prefix "art" → return top tags).
3. Fallback to Elasticsearch for partial matches or fuzzy queries.

**Pseudocode Example:**

```python
def search_tags(query):
	cached_results = redis.get(query_prefix(query))
	if cached_results:
	return cached_results
	results = elastic.search({"prefix": {"name": query.lower()}})
	redis.setex(query, results, ttl=300)
	return results
```


---

## 12. ⚖️ Trade-offs
- **Relational DB (PostgreSQL)** for ACID and strong schema guarantees vs. **NoSQL** for horizontal scale — chose PostgreSQL + sharding for balance.
- **Eventual consistency** between Tag DB and Search Index for performance.
- **ElasticSearch** adds maintenance overhead but enables high-performance search.
- **Redis** for caching increases complexity but drastically reduces DB reads.

---

## 13. 🔭 Closing Thoughts
This tagging system demonstrates scalable design for **millions of user-generated elements** through:
- Layered microservices,
- Distributed database + indexing architecture,
- Robust search and caching mechanisms,
- Strong observability and fault tolerance.

Ideal for applications requiring **semantic organization, fast lookup, and high availability** across large user populations.
