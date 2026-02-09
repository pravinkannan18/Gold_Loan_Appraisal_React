# Purity Testing Diagrams

These diagrams describe the purity testing workflow and the tech stack used in this project.

## Purity Testing Workflow (End-to-End)

```mermaid
sequenceDiagram
    autonumber
    participant UI as Frontend (Web)
    participant API as FastAPI Backend
    participant RTC as WebRTC Manager
    participant VP as Video Processor
    participant INF as Inference Worker
    participant MM as Model Manager
    participant DB as PostgreSQL

    UI->>API: POST /api/webrtc/offer or /api/webrtc/session/create
    API->>RTC: create_session()
    RTC-->>UI: session_id + (answer if WebRTC)

    UI->>RTC: Video stream (WebRTC) or frames (WebSocket fallback)
    RTC->>VP: VideoTransformTrack(recv)
    VP->>INF: process_frame(frame, current_task)
    INF->>MM: predict(stone)
    INF->>MM: predict(gold)
    INF-->>VP: rubbing_detected + stage

    VP-->>RTC: queue task switch (rubbing -> acid)
    RTC-->>UI: status updates (data channel)

    VP->>INF: process_frame(frame, current_task=acid)
    INF->>MM: predict(acid)
    INF-->>VP: acid_detected + gold_purity + stage
    RTC-->>UI: status updates (data channel)

    UI->>API: POST /api/session/{id}/purity-test (results)
    API->>DB: INSERT purity_test_details
    DB-->>API: OK
    API-->>UI: Purity test saved
```

## Inference Pipeline (Rubbing -> Acid)

```mermaid
flowchart TD
    A["Frame In"] --> B{"Current Task"}
    B -->|rubbing| C["Stone Detection YOLO"]
    C --> D["Gold Detection YOLO (ROI)"]
    D --> E["Gold Mask Persistence"]
    E --> F["Rubbing Motion (distance fluctuation)"]
    F --> G{"Visual OK? (>=3)"}
    G -->|No| H["Stay in RUBBING"]
    G -->|Yes| I["Switch to ACID"]

    B -->|acid| J["Acid Detection YOLO"]
    J --> K{"Acid Found?"}
    K -->|Yes| L["Parse Purity (18K/22K/24K)"]
    K -->|No| M["Stay in ACID"]
    L --> N["Mark COMPLETED"]

    H --> B
    I --> B
    M --> B
```

## Tech Stack Overview

```mermaid
flowchart LR
    subgraph Frontend
        FE1[React 18]
        FE2[Vite]
        FE3[TypeScript]
        FE4[Tailwind + Radix UI]
        FE5[Axios + React Query]
    end

    subgraph Backend
        BE1[FastAPI]
        BE2[Uvicorn]
        BE3[WebRTC: aiortc/av]
        BE4[AI: Ultralytics YOLO]
        BE5[CV: OpenCV + NumPy]
        BE6[PyTorch]
    end

    subgraph Data
        DB1[PostgreSQL]
    end

    FE1 -->|HTTP/REST| BE1
    FE1 -->|WebRTC/WebSocket| BE3
    BE1 --> DB1
    BE4 --> BE6
    BE5 --> BE4
```

## Purity Data Persistence

```mermaid
flowchart TD
    S["Session: /api/session/{id}"] --> P["POST /api/session/{id}/purity-test"]
    P --> DB[("purity_test_details")]
    DB --> ST["overall_sessions.status = purity_completed"]
```
