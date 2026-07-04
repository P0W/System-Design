# 16. Competing Systems — Same Problem, Different Choices

> **Note:** Every "build X like Y" interview question is secretly asking: "do you understand why Y made the choices Y made?"
> Two products in the same space solve the same user need with different bets on scale, consistency, and latency.
> This chapter maps those bets.

```mermaid
flowchart TD
  Q[Same user need] --> A[Product A]
  Q --> B[Product B]
  A -->|Different scale bet| RA[Architecture A]
  B -->|Different consistency bet| RB[Architecture B]
  RA --> D[Same primitives\ndifferent trade-offs]
  RB --> D
```

---

## Group 1 — File Sync & Cloud Storage

> Google Drive vs OneDrive vs Dropbox

All three sync files across devices. The difference is who they're glued to.

```mermaid
flowchart LR
  subgraph Common Core
    Client[Desktop / mobile client]
    Client -->|delta sync| API[Sync API]
    API --> Chunk[Chunk + dedupe]
    Chunk --> Blob[(Object store)]
    API --> Meta[(Metadata store)]
    Blob --> CDN[CDN / edge]
  end
  subgraph Diverge
    Meta -->|G Workspace tight coupling| GDoc[Docs / Sheets / Slides]
    Meta -->|Office 365 integration| Office[Word / Excel / SharePoint]
    Meta -->|third-party neutral| Drop[Dropbox Paper / integrations]
  end
```

**How delta sync works**

```mermaid
sequenceDiagram
  participant Client
  participant API as Sync API
  participant Store as Object Store

  Client->>API: file changed, send block hashes
  API->>API: compute diff - which blocks are new?
  API-->>Client: upload only changed blocks
  Client->>Store: PUT changed blocks
  Store-->>API: confirm
  API->>API: update file version and metadata
  API-->>Client: sync complete
```

| Dimension | Google Drive | OneDrive | Dropbox |
|---|---|---|---|
| Primary storage | Google Cloud Storage | Azure Blob | S3 + own infra |
| Collaboration | Google Docs native | Office Online | Dropbox Paper (limited) |
| Metadata store | Spanner (global) | SQL + CosmosDB | PostgreSQL-based |
| Sync protocol | Drive API v3, delta tokens | MS Graph delta query | Longpoll delta API |
| Offline edit merge | Last write wins + OT for Docs | Office coauthoring | Last write wins |
| Max file size | 5 TB | 250 GB | 2 TB |

**Hard part:** Conflict resolution when two clients edit the same file offline. Drive punts and creates a conflict copy. Office uses OT for collaborative docs. Both are valid answers.

---

## Group 2 — Email at Scale

> Gmail vs Outlook (Exchange Online)

Both receive SMTP mail, filter spam, index for search, sync to clients. The divergence is the storage model and the protocol used for client sync.

```mermaid
flowchart LR
  Ext[External SMTP] --> MX[MX / ingest]
  MX --> Spam[Spam / abuse filter]
  Spam --> Store[(Mailbox store)]
  Store --> Index[Full-text index]
  Store --> Push[Push sync to clients]
  Push -->|IMAP / Gmail API| GmailApp[Gmail client]
  Push -->|Exchange ActiveSync / EWS| OutlookApp[Outlook client]
```

| Dimension | Gmail | Outlook / Exchange Online |
|---|---|---|
| Storage model | Conversation threads | Folder hierarchy |
| Primary index | Custom Bigtable-backed search | Exchange search + Lucene-based |
| Spam engine | ML + TensorFlow | SmartScreen + EOP |
| Sync protocol | Gmail API (REST) + IMAP | EAS, EWS, MAPI over HTTPS |
| Calendar integration | Google Calendar | Exchange Calendar (native) |
| Attachment storage | Google Drive link or inline | Azure Blob inline |
| Global replication | Spanner-backed user data | Exchange DAG (Database Availability Group) |

**Hard part:** Full-text search over billions of messages per user with low latency. Both use inverted indexes but with very different sharding strategies (Gmail: per-user shard; Exchange: per-database group).

---

## Group 3 — Food Discovery vs Food Delivery

> Yelp ≈ Google Maps Places (discovery)
> Zomato / Swiggy / DoorDash (delivery logistics)

> Note: These are NOT the same system. Yelp is a read-heavy review platform. Swiggy is a real-time logistics system. Zomato does both. Putting them in one group is like comparing a library to a courier company.

### Discovery (Yelp / Google Maps Places)

```mermaid
flowchart LR
  User[User] -->|search: pizza near me| GeoIdx[Geo index]
  GeoIdx -->|PostGIS / Redis GEO| POI[(POI store)]
  POI --> Rank[Review score + distance rank]
  Rank --> Results[Restaurant cards]
  Results -->|click| Review[Reviews + photos]
```

### Delivery (Swiggy / DoorDash)

```mermaid
flowchart LR
  User[User orders] --> OMS[Order Management]
  OMS --> Menu[(Restaurant menus)]
  OMS --> Payment[Payment]
  Payment -->|confirmed| Dispatch[Dispatch engine]
  Dispatch -->|GEOSEARCH nearest idle rider| GEO[(Redis GEO riders)]
  GEO --> Rider[Assign rider]
  Rider -->|status updates WebSocket| User
  OMS --> ETA[ETA service]
```

| Dimension | Yelp / Places | Swiggy / DoorDash |
|---|---|---|
| Core load shape | read-heavy, search + reviews | realtime 3-party coordination |
| Hard problem | ranking relevance + geo search | driver dispatch + ETA accuracy |
| Key data store | inverted index + PostGIS | Redis GEO + order state machine |
| Consistency need | eventual (reviews, ratings) | strong (payment, order status) |
| Realtime | no (static listings) | yes (driver location, ETA) |
| Fanout | low | high (restaurant + rider + user all notified) |

---

## Group 4 — Ride Hailing

> Uber vs Lyft vs Ola (cars) vs Rapido (bikes only)

Rapido is architecturally simpler — bike-only, no ride types, lower price point. The core dispatch problem is identical; the vehicle type changes supply density math.

```mermaid
flowchart LR
  Rider[Rider request] -->|lat/lon| Match[Matching service]
  Driver[Driver ping] -->|GEOADD every 4s| GEO[(Redis GEO)]
  Match -->|GEOSEARCH nearest available| GEO
  GEO --> Candidates[Top-K drivers]
  Candidates --> Score[Score by distance and rating and surge]
  Score --> Offer[Send offer to best driver]
  Offer -->|accept/decline| OMS[Order state machine]
  OMS --> Payment[Payment]
  OMS --> WS[WebSocket push to rider]
```

**State machine for a ride**

```mermaid
stateDiagram-v2
  [*] --> Requested
  Requested --> DriverAssigned : driver accepts
  Requested --> Cancelled : timeout / rider cancels
  DriverAssigned --> DriverEnRoute : driver starts
  DriverEnRoute --> DriverArrived : geofence trigger
  DriverArrived --> InProgress : rider enters vehicle
  InProgress --> Completed : destination reached
  Completed --> [*]
```

| Dimension | Uber / Lyft | Ola | Rapido |
|---|---|---|---|
| Vehicle types | car, SUV, auto, bike | car, auto, bike | bike only |
| Dispatch radius | city-wide adaptive | city-wide | tighter (bike coverage) |
| Surge pricing | dynamic heat map | dynamic | flat peak surge |
| Payment | card + wallet | card + wallet + UPI | UPI-heavy |
| Hard problem | global ETA + dynamic pricing | same + Indian traffic patterns | supply density in dense corridors |

---

## Group 5 — Social Media Feed Styles

> X (Twitter) vs Threads — microblog / real-time
> Instagram vs TikTok — visual / algorithmic
> Reddit vs Discord — community / async vs real-time

These are NOT one system. Group them by **fanout model** and **content type**.

### Fanout: push vs pull vs hybrid

```mermaid
flowchart TD
  Post[User posts content]
  Post -->|push fan-out| Celebrity[Celebrity - write to 50M feeds = 50M writes]
  Post -->|pull fan-out| SmallUser[Small account - readers pull on open]
  Post -->|hybrid| Hybrid[Twitter/X hybrid - push small, pull mega-celebs]
```

### X / Threads — microblog

```mermaid
flowchart LR
  Tweet[Tweet created] --> FO[Fanout service]
  FO -->|push to home timelines| Cache[(Timeline cache\nRedis per user)]
  FO -->|skip for >1M followers| Skip[Pull on read instead]
  Cache --> Feed[Home feed API]
  Feed --> Client[Client]
```

### Instagram / TikTok — visual + algorithmic

```mermaid
flowchart LR
  Upload[Video/photo upload] --> Trans[Transcode / compress]
  Trans --> CDN[CDN]
  Upload --> Embed[ML embedding service]
  Embed --> Rank[Ranking / recommendation engine]
  Rank --> Feed[Personalized feed]
  Feed --> Client[Client]
```

### Reddit / Discord — community

```mermaid
flowchart LR
  Post[Post in community] --> Sub[(Subreddit / channel store)]
  Sub --> Vote[Vote aggregation]
  Vote --> Rank[Hot / new / top ranking]
  Rank --> Feed[Community feed]
  Discord[Discord message] --> CH[Channel fanout]
  CH -->|WebSocket push| Members[Online members]
  CH -->|store for offline| Inbox[Message inbox]
```

| System | Feed model | Hard problem | Content type | Real-time? |
|---|---|---|---|---|
| X / Threads | push + pull hybrid | celebrity fanout | text + links | yes |
| Instagram | pull + ML rank | recommendation freshness | photos + short video | partial |
| TikTok | pure ML rank, no social graph | cold start + engagement loop | short video | partial |
| Reddit | community vote sort | hot score decay + spam | links + text + media | no |
| Discord | WebSocket push per channel | presence at scale + voice | text + voice + media | yes |

---

## Group 6 — Video Platforms

> YouTube (UGC + ads) vs TikTok (algorithmic UGC) vs Netflix (licensed VOD)

Netflix does NOT take uploads from random people. That alone splits the architecture in half.

### YouTube / TikTok — upload pipeline

```mermaid
flowchart LR
  Creator[Creator uploads] --> Ingest[Ingest service]
  Ingest --> Validate[Validate / virus scan]
  Validate --> Trans[Transcode pipeline\n360p / 720p / 1080p / 4K]
  Trans --> Blob[(Object store)]
  Blob --> CDN[Edge CDN]
  Trans --> Embed[ML tagging, thumbnails, captions]
  Embed --> Rank[Recommendation engine]
```

### Netflix — licensed content pipeline

```mermaid
flowchart LR
  Studio[Studio delivers master file] --> Ingest[Ingest + QC]
  Ingest --> Trans[Transcode 1200+ bitrate profiles]
  Trans --> Blob[(Netflix Open Connect / CDN origin)]
  Blob --> OC[Open Connect Appliances\nat ISP level]
  OC --> Client[Client ABR player]
  Client -->|manifest request| API[Streaming API]
  API --> Rec[Recommendation service]
```

| Dimension | YouTube | TikTok | Netflix |
|---|---|---|---|
| Content source | user upload (UGC) | user upload (UGC) | licensed / studio |
| Recommendation | social graph + engagement | pure ML, no follow required | watch history + ML |
| CDN strategy | Google CDN global PoPs | Bytedance CDN | Open Connect (ISP-embedded appliances) |
| Transcode profiles | adaptive ladder ~5–8 | adaptive ladder | 1200+ bitrate+codec combos |
| Hard problem | UGC moderation at scale | cold-start recommendation | licensing DRM + global peering |
| Live streaming | yes | yes | no (mostly) |
| Offline | limited | limited | yes (download to device) |

---

## Group 7 — Messaging & Chat

> WhatsApp / iMessage / Telegram (consumer) vs Slack / Teams / Discord (enterprise/community)

The difference is **group size ceiling** and **delivery guarantee**.

### Consumer messaging (WhatsApp / Telegram)

```mermaid
sequenceDiagram
  participant A as User A
  participant S as Message Service
  participant B as User B

  A->>S: send message (E2E encrypted payload)
  S->>S: store if B offline
  S->>B: push notification (FCM / APNs)
  B->>S: fetch message
  S-->>B: deliver message
  B-->>S: delivery receipt
  S-->>A: delivered (double-tick)
```

### Enterprise / community chat (Slack / Discord)

```mermaid
flowchart LR
  Msg[Message sent] --> CH[Channel service]
  CH -->|WebSocket push| Online[Online members]
  CH -->|store| Inbox[(Message store)]
  Inbox -->|pull on connect| Offline[Offline members]
  CH --> Search[Indexed for search]
  CH --> Thread[Thread aggregation]
```

| Dimension | WhatsApp | Telegram | Slack | Discord |
|---|---|---|---|---|
| Encryption | E2E (Signal protocol) | optional (secret chats) | in-transit only | in-transit only |
| Group size limit | 1024 | unlimited channels | workspace-wide | server with 250K members |
| Message store | client-side primary | cloud by default | cloud (searchable) | cloud |
| Protocol | custom binary protocol over persistent TCP (not XMPP since 2011) | MTProto | HTTPS + WebSocket | HTTPS + WebSocket + WebRTC |
| Hard problem | E2E key exchange at scale | broadcast channel fan-out | search across org history | voice/video + text at scale |

---

## Group 8 — Payments

> Stripe / PayPal (global) vs UPI / PhonePe / GPay (India real-time)

Stripe is a developer-first payments API. UPI is an interbank real-time rail. Very different layers.

```mermaid
flowchart LR
  subgraph Stripe
    Merchant --> SAPI[Stripe API]
    SAPI --> Vault[Card vault / tokenize]
    Vault --> Network[Visa / Mastercard network]
    Network --> Bank[Issuing bank]
  end
  subgraph UPI
    Payer[Payer app\nGPay/PhonePe] --> NPCI[NPCI UPI switch]
    NPCI --> PayerBank[Payer bank]
    NPCI --> PayeeBank[Payee bank]
  end
```

| Dimension | Stripe / PayPal | UPI / PhonePe |
|---|---|---|
| Settlement | T+1 or T+2 batch | near real-time (seconds) |
| Infrastructure | card network rails | interbank NPCI rail |
| Auth model | API key + webhook | VPA + device binding + PIN |
| Idempotency | idempotency key header | transaction ref ID |
| Hard problem | card fraud at global scale | 10B+ transactions/month, sub-second |

---

## The universal comparison template

When asked to compare two systems, answer these five questions:

```mermaid
flowchart TD
  Q1[Same user need?] -->|No| Split[Different categories - say so]
  Q1 -->|Yes| Q2[Load shape - read-heavy vs write-heavy vs realtime?]
  Q2 --> Q3[Consistency need - strong vs eventual?]
  Q3 --> Q4[Scale - users, writes per sec, data size?]
  Q4 --> Q5[Hard problem - the ONE thing that differentiates them]
  Q5 --> Answer[Architecture diverges exactly here]
```

| System pair | The real difference |
|---|---|
| Drive vs OneDrive | Office integration vs G-Suite integration; same sync core |
| Gmail vs Outlook | Thread vs folder model; same ingest/spam/search core |
| Yelp vs Swiggy | Read/reviews vs realtime logistics; completely different backends |
| Uber vs Rapido | Same dispatch; Rapido = simpler vehicle type + tighter radius |
| YouTube vs Netflix | UGC upload pipeline vs licensed content; recommendation strategy |
| Slack vs WhatsApp | Enterprise search + threads vs E2E encrypted consumer messaging |
| Stripe vs UPI | Card network rail vs interbank real-time rail |

> **Tip:** The fastest way to answer a "compare X and Y" question is to first establish that both systems have an identical core (they always do), then precisely identify the one architectural decision where they diverge — and explain why that decision was forced by their business model, not just technology preference.
