# J-Forge V2 Multi-File Project & Developer Migration Guide

## Migrating a Multi-File Python Project to Maven Java

1. Open **Workspace -> Projects** (`FilesWorkspaceView`) or call `POST /api/v1/projects/migrate`.
2. Select active Python buffers or upload up to **15 files** (`.py` modules and optional `requirements.txt`).
3. Pick your target Java LTS runtime (`11`, `17`, or `21`).
4. Click **Migrate Project -> Maven** to inspect:
   - Detected entrypoints (`main.py` or `if __name__ == "__main__":`)
   - Cross-module `importGraph`
   - Compatibility status (`ready`, `requires_adaptation`, `has_unsupported`)
   - `manualInterventionRequired` warnings (e.g., `requirements.txt` coordinates or unsupported constructs such as `eval`/`yield`/`async`)
5. Click **Download Maven ZIP** to export a structured Maven archive containing:
   - `pom.xml` targeting your selected Java LTS version
   - `src/main/java/com/jforge/migrated/<ClassName>.java`

## Python Dependency to Java Ecosystem Mapping (`lib/compatibility.js`)

| Python Package | Suggested Java Ecosystem Equivalent | Notes |
|---|---|---|
| `requests` / `httpx` | `java.net.http.HttpClient` | Built into JDK 11+; synchronous & async `CompletableFuture` |
| `pytest` / `unittest` | JUnit 5 (`org.junit.jupiter`) | J-Forge generates JUnit 5 suites alongside Conversion Passports |
| `dataclasses` / `pydantic` | Java `record` (17/21) or Bean classes | Exported with validation annotations when Spring DTOs apply |
| `json` / `fastapi` / `flask` | Jackson (`ObjectMapper`) / Spring Boot Web | Spring Boot code requires local Maven/Gradle build (not remote Wandbox) |
| `re` / `math` / `datetime` | `java.util.regex`, `java.lang.Math`, `java.time` | Built into JDK standard library |
| Unknown external packages | Flagged as `Unknown` | Requires manual Maven/Gradle dependency lookup |
