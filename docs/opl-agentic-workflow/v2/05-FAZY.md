# 05. Fazy wdrożenia F0–F6

Zasada prowadzenia: **każda faza kończy się mierzalnym kryterium wyjścia** i zostawia repo w stanie używalnym. Zmiany w agentach od F3 przechodzą przez evale (W12).

```
F0 Audyt i spike ─► F1 Fundament (CLI, indeks, stan) ─► F2 Wiedza (reguły, wzorce, mapa pamięci)
      ─► F3 Review (Find/Verify/Judge + evale) ─► F4 Build (orchestrator, hooki, refactor)
      ─► F5 Automatyzacja (CI, nightly, coding agent) ─► F6 Uczenie się i skalowanie
```

Orientacyjnie: F0 1 tydz., F1 2 tyg., F2 2–3 tyg., F3 2–3 tyg., F4 3 tyg., F5 2 tyg., F6 ciągle. F2 i F3 mogą częściowo iść równolegle po F1.

---

## F0: Audyt istniejącego workflow i spike platformy (1 tydzień)

**Cel:** wiedzieć, co macie, co działa w Waszej wersji Copilota, i mieć baseline.

**Zadania**
- [ ] Inwentarz: agenci, prompty, skille, instrukcje, ADR (ręcznie albo pierwsza wersja `opl meta audit` + `opl memory inventory`).
- [ ] Karta zgodności dla każdego orchestratora ([02 §4](02-WORKFLOWY.md#4-audyt-istniejących-orchestratorów)).
- [ ] Graf wywołań agent → agent/skill. Szukamy cykli, martwych elementów i zagnieżdżeń > 2.
- [ ] **Spike platformy** na wersji VS Code i CLI używanej w Orange, z wynikami zapisanymi w ADR-OPL-000:
  - [ ] frontmatter: `agents`, `user-invocable`, `disable-model-invocation`, `model` (lista), `handoffs`, nazwy tooli,
  - [ ] subagenci: czy idą równolegle, limit, czy dostają `AGENTS.md` i instrukcje `applyTo`,
  - [ ] hooki: nagranie realnych payloadów stdin dla `PreToolUse`, `PostToolUse`, `SubagentStop`, `Stop`, `PreCompact`. Który format decyzji działa (`hookSpecificOutput.permissionDecision` vs inne), zachowanie exit code,
  - [ ] skille ze skryptami: VS Code, Copilot CLI (`--agent`), coding agent,
  - [ ] polityki org: hooki (preview), MCP allowlist, dostępne modele (≥ 2 rodziny).
- [ ] Baseline: 3–5 realnych zadań i 10 PR-ów zrobionych obecnym workflow. Mierzymy czas, liczbę poprawek człowieka, błędy znalezione później i oceny trafności komentarzy review.

**Produkty:** `docs/opl/audit/AUDIT-<data>.md`, `docs/adr/ADR-OPL-000-platforma-copilot.md`, nagrane payloady hooków w `tools/opl/fixtures/hooks/`, baseline metryk.

**Kryterium wyjścia:** lista luk z priorytetami zaakceptowana. Wiadomo, które mechanizmy platformy są dostępne (jeśli hooki są niedostępne, fallback: bramki przez `opl-gatekeeper` + `opl run advance`).

**Ryzyka:** hooki wyłączone polityką → fallback opisany wyżej. Brak drugiej rodziny modeli → verifier na tym samym modelu, ale z innym promptem i *wyłącznie* dowodami wykonywalnymi dla blocking.

---

## F1: Fundament: CLI `opl`, indeks, stan runu (2 tygodnie)

**Cel:** warstwa faktów i maszyna stanów, na których stoją kolejne fazy.

**Zadania**
- [ ] Szkielet `tools/opl` (envelope, workspace, git, cache, budget) + `bun test` na fixture'ze mini-monorepo.
- [ ] P0 z indeksu: `index build`, `graph deps|affected|callers|diff`, `symbols find`, `api snapshot|diff`.
- [ ] `sgconfig.yml` (jeśli go nie ma) z `ruleDirs` i `testConfigs`. Przeniesienie istniejących skryptów ast-grep do reguł z testami.
- [ ] `run init|advance|status|approve`, schematy `state`, `analysis`, `research`, `plan`, `finding`, `verdict`, `gates`.
- [ ] `meta agents-lint|skills-lint|check-all`. **Rename istniejących agentów i skilli na `opl-*`** (z aliasami w opisie na okres przejściowy).
- [ ] Spec YAML dla istniejących orchestratorów (wydzielenie z promptów). `workflow lint` w wersji podstawowej.
- [ ] CI: job `opl-check` (`meta check-all`, `ast-grep test`, `bun test tools/opl`).

**Produkty:** działające `bun run opl …`, `.github/opl/workflows/*.yml`, zielony job CI.

**Kryterium wyjścia:** `graph affected` zgodny z ręczną weryfikacją na 10 PR-ach (≥ 95% plików). `run advance` blokuje przeskok etapu w teście. Wszyscy agenci przechodzą `agents-lint`.

---

## F2: Wiedza: reguły z ADR, wzorce, karty, mapa pamięci (2–3 tygodnie)

**Cel:** canon w jednym miejscu, reguły z ID, wzorce z exemplarami, pamięć pod kontrolą.

**Zadania**
- [ ] `docs/opl/memory-map.yml` v1 wg procedury z [03 §4](03-MAPA-PAMIECI.md#4-jak-zbudować-mapę-pamięci-procedura-krok-po-kroku). Narzędzia: `memory inventory|budget|dupes|validate|check`.
- [ ] Odchudzenie T0: `copilot-instructions.md` ≤ 4000 znaków, `AGENTS.md` per pakiet.
- [ ] **W7 na istniejących ADR i docs** (`opl-docs-curator`): twierdzenia → weryfikacja w kodzie → reguły `OPL-*` → HITL → canon.
- [ ] Sekcja „Implikacje dla kodu” w każdym ADR `Accepted`. `adr lint`.
- [ ] Reguły E1: każda możliwa reguła jako ast-grep (z testem) lub Biome (`noRestrictedImports`, GritQL z `includes`). Cel ≥ 40% reguł jako E1.
- [ ] `rules pack|check|lint|adapters`, wygenerowane `.github/instructions/opl-*.instructions.md`.
- [ ] Katalog wzorców: 10–15 wzorców z regułami wykrywania (`docs/opl/patterns/sg`), `patterns scan`, `similar`.
- [ ] Karty modułów: `cards build` (część generowana), uzupełnienie kuratorowanej dla pakietów pilota.

**Kryterium wyjścia:** `memory check` zielony, 0 duplikatów reguł poza canon, 100% reguł z ID i źródłem, ≥ 40% E1, każdy wzorzec ma exemplar i ≥ 2 wystąpienia, karty dla 100% pakietów pilota.

---

## F3: Review: Find, Verify, Judge + evale (2–3 tygodnie)

**Cel:** review, któremu można ufać, z mierzoną trafnością.

**Zadania**
- [ ] Agenci: `opl-pr-review`, `opl-review-{logic,contracts,conventions,tests,security}`, `opl-verifier`, `opl-judge` (przeniesienie checklist z eq-logic-reviewer do skilla `opl-review-rubric`).
- [ ] Subflow `opl-review-core` + `review shard`, `findings validate|check-quote|merge|to-github`.
- [ ] Hook `SubagentStop` → `guard subagent-output` (jeśli dostępny), inaczej walidacja w `run advance`.
- [ ] **Złoty zbiór v1:** ≥ 50 PR-ów: z prawdziwymi bugami (z hotfixów i revertów), z zasianymi bugami (mutacje w kopii PR-a) i czyste (kontrola FP). Format w `docs/opl/evals/golden/`.
- [ ] `eval run|score|compare` (headless: `copilot -p … --agent opl-pr-review --no-ask-user -s`).
- [ ] Zachowanie trybów eq: Author/Reviewer flow, format naturalny/etykietowany, autopilot (W4/W5).

**Kryterium wyjścia (na złotym zbiorze, 3 powtórzenia):** precision confirmed-blocking ≥ 85%, recall zasianych bugów ≥ 60%, wariancja decyzji ≤ 10%, koszt/PR w uzgodnionym budżecie. Wynik lepszy niż baseline z F0.

---

## F4: Build: orchestrator, hooki, TDD, refactor (3 tygodnie)

**Cel:** doszlifowany orchestrator jako maszyna stanów z twardymi bramkami.

**Zadania**
- [ ] `opl-orchestrator` wg spec W1/W2/W3. Prompt skrócony do zasad delegacji (≤ 200 linii).
- [ ] Workerzy: `opl-scout`, `opl-pattern-miner`, `opl-rule-curator`, `opl-planner`, `opl-plan-critic`, `opl-test-author`, `opl-implementer`, `opl-refactorer`, `opl-gatekeeper`, `opl-pr-author`.
- [ ] `plan lint|scope` (pattern_source, TDD order, kolejność wg grafu, shardy).
- [ ] Hooki: `pre-tool` (scope, approvals, sekrety, rola), `post-edit` (biome + ast-grep), `stop`, `precompact`, `session-start`.
- [ ] Gate: `gate quick|all`, `test affected`, `coverage diff`, `graph diff`, `api diff`.
- [ ] Refactor: skill `opl-characterization-tests`, `equivalence.md`, soczewka `opl-review-equivalence`.
- [ ] Skille `opl-create-*` (z eq-create-*) z exemplarami z indeksu zamiast szablonów na sztywno.

**Kryterium wyjścia (10 realnych zadań pilota):** ≥ 90% kroków `create` z `pattern_source`, 0 naruszeń granic po G6, 0 edycji poza scope (log hooka), ≥ 1 refactor z zerowym api diff i coverage ≥ baseline, czas zadania ≤ baseline albo mniej poprawek człowieka.

---

## F5: Automatyzacja: CI, nightly, coding agent (2 tygodnie)

**Zadania**
- [ ] `.github/workflows/opl-pr-review.yml`: review headless L2 na PR-ach pilota (tylko komentarze `confirmed blocking`, reszta w podsumowaniu).
- [ ] `.github/workflows/opl-nightly.yml`: W10 knowledge refresh (PR z częścią generowaną + issue z driftem).
- [ ] `.github/workflows/opl-eval.yml`: W12 dla zmian w agentach.
- [ ] `copilot-setup-steps.yml` dla coding agenta (`bun install`, `opl index build`).
- [ ] Natywny Copilot code review: lekkie instrukcje. Ciężkie mają `excludeAgent: code-review`, żeby nie dublować opl-pr-review.
- [ ] Telemetria: agregacja `telemetry.jsonl` i reakcji na komentarze (resolved/dismissed) → dashboard.

**Kryterium wyjścia:** review w CI na 100% PR-ów pilota przez 2 tygodnie, odsetek dismissed ≤ 15%, nightly zielony.

---

## F6: Uczenie się i skalowanie (ciągle)

**Zadania**
- [ ] W11 `opl-retro` po każdym większym runie. Lessons z cytatami, awans lekcji do reguł (i do E1).
- [ ] Polityka Copilot Memory (co wolno, przegląd konfliktów z canon).
- [ ] Rozszerzenie na kolejne domeny monorepo: karty, wzorce, reguły per domena, złoty zbiór per domena.
- [ ] Opcjonalnie: MCP `opl-knowledge` (indeks dostępny dla wielu repo i powierzchni), StrykerJS (mutation score jako bramka), Semgrep (soczewka security).
- [ ] Kwartalny przegląd: evale, progi, budżety, martwe reguły (`rules coverage`), nieużywane lessons.

**KPI programu:** precision i recall review (eval + produkcja), dismissed rate, % reguł E1, naruszenia architektury wykryte po merge (→ 0), lead time zadania, poprawki człowieka na zadanie, koszt tokenów na zadanie/PR, liczba eskalacji na run.

---

## Role i odpowiedzialności

| Rola | Odpowiada za |
|------|--------------|
| **AI Platform owner** (CODEOWNERS na `.github/agents|skills|hooks`, `tools/opl`) | agenci, skille, CLI, evale, progi |
| **Architekci domen** | ADR, akceptacja reguł i wzorców, karty modułów (część kuratorowana) |
| **Tech leadzi zespołów** | pilotaż, złoty zbiór z ich domeny, feedback z retro |
| **Security** | soczewka security, polityka MCP i sekretów, przegląd hooków |
| **Deweloperzy** | używanie workflow, reakcje na komentarze (dane do evali), propozycje lessons |

## Mapowanie na Twój obecny stan

| Masz | Co z tym robimy | Faza |
|------|-----------------|------|
| Wstępne ADR | W7: weryfikacja w kodzie, sekcja „Implikacje”, wyciągnięcie reguł `OPL-*` | F2 |
| Minimalistyczne orchestratory | audyt → spec YAML → `opl run` → hooki → podział review | F0 → F1 → F4 |
| Skrypty ast-grep | przeniesienie do `sgconfig.yml` jako reguły z testami + wykrywanie wzorców | F1–F2 |
| Biome | bramki (`gate`), `post-edit`, `noRestrictedImports` + GritQL dla reguł E1 | F2–F4 |
| tsc | graf (TS API), API snapshot/diff, bramka typów | F1 |
| Bun | runtime CLI, `bun test` (projekt i `tools/opl`), coverage lcov, `--rerun-each` | F1+ |
