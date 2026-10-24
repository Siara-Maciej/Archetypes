# OPL Agentic Engineering Platform — plan architektury dla GitHub Copilot

> **Wersja rozszerzona (v2):** [v2/00-INDEX.md](v2/00-INDEX.md): zasady per element, anatomia workflow, mapa pamięci, skrypty (ast-grep / Biome / tsc / Bun), fazy F0–F6, szablony.

> Status: **Proposed** · Data: 2026-10-24 · Zakres: workflow agentowy (implementacja, testy, review, analiza dokumentacji) dla dużego monorepo produktu Orange · Prefiks wszystkich agentów i skilli: **`opl-`**

---

## 0. TL;DR

1. **Sam Markdown nie wystarczy na poziom enterprise.** Markdown (agenci, skille, instrukcje) zostaje warstwą *rozumowania i procedur*. Wszystko, co jest *faktem* (graf zależności, moduły dotknięte zmianą, wzorce w kodzie, zgodność z regułami, poprawność formatu wyników, przejście bramek), liczą **deterministyczne skrypty**. Skrypty leżą w folderach skilli i w `tools/opl/`, a **hooki** wymuszają ich użycie. Zasada: **„LLM decyduje, skrypty mierzą, hooki pilnują”**.
2. **Architektura ma 7 warstw:** Canon wiedzy → Indeks wiedzy (generowany) → Agenci `opl-*` → Skille `opl-*` ze skryptami → Hooki → Pamięć 4-poziomowa → CI/Eval.
3. **Subagenci i praca równoległa działają jak map-reduce.** Koordynator nie czyta kodu. Rozsyła pracę do workerów w izolowanych kontekstach, równolegle wg *soczewki × shardu modułów*. Workerzy zapisują pełne wyniki na „tablicę” (`.opl/runs/<id>/`) i oddają tylko krótkie podsumowanie ze ścieżką do pliku.
4. **Trafność review zapewniają trzy fazy: Find → Verify → Judge.** Każde znalezisko musi mieć *dowód* (schemat JSON). Osobny weryfikator, w czystym kontekście i najlepiej na innym modelu, próbuje je *obalić*. Pierwszeństwo ma dowód wykonywalny (failing test, skrypt reachability). Jakość mierzymy precision/recall na złotym zbiorze PR-ów.
5. **„Nie od zera, tylko wzorce”:** katalog wzorców z kanonicznymi przykładami (`file:line`) i skrypt `opl-find-similar`. Planner **musi** wskazać źródło wzorca dla każdego kroku. Nowa abstrakcja wymaga ADR.
6. **Refactor = zachowanie zachowania:** najpierw testy charakteryzacyjne, potem diff publicznego API i diff grafu zależności jako bramki. Osobna soczewka review sprawdza równoważność semantyczną.
7. **Dokumentacja → reguły jako kod:** `opl-docs-curator` wyciąga twierdzenia z docs, weryfikuje je w kodzie (wykrywa drift) i zamienia na reguły z ID (`OPL-ARCH-001`). Gdzie się da, generuje z nich reguły lintera i dependency-cruisera. Reszta trafia do review LLM.

---

## 1. Ocena obecnego workflow (eq-*)

Twój bundle eq-* to dobra baza. Rozdział ról (SRP), bramki decyzyjne, równoległe analyzer+researcher, podział review na conventions+logic, autopilot z pętlą naprawczą i retrospektywa z rules-gen to rozwiązania, które warto zachować.

Luki, które blokują poziom enterprise:

| # | Luka | Skutek | Odpowiedź w OPL |
|---|------|--------|-----------------|
| 1 | Ścieżki absolutne `C:/Users/668459/...`, kanon poza repo | Nieprzenośne, niewersjonowane, działa tylko u jednej osoby | Wszystko w repo (`.github/`, `docs/`, `tools/opl/`), wersjonowane i review'owane jak kod |
| 2 | Wszystko to prompty, zero deterministycznych narzędzi | Analiza zależności i wybór wzorca zależą od „przeczytania” repo przez LLM, co w monorepo jest niemożliwe | Indeks wiedzy + skrypty (graf, affected, similar, rule-check) |
| 3 | Brak wymuszeń, bramki to tylko tekst w prompcie | Model może pominąć krok | Hooki `PreToolUse` / `PostToolUse` / `SubagentStop` / `Stop` + `state.json` |
| 4 | Wyniki agentów to wolny markdown | Nie da się ich walidować, deduplikować ani mierzyć | Schematy JSON (`finding`, `plan`, `analysis`) walidowane skryptem |
| 5 | Review jednoprzebiegowe, bez weryfikacji znalezisk | False positives, „halucynowane” bugi | Find → Verify (próba obalenia) → Judge |
| 6 | Brak pomiaru jakości agentów | Zmiana promptu może po cichu pogorszyć review | Eval harness: złoty zbiór PR-ów i bramka regresji w CI |
| 7 | Pamięć = rozmowa + handoff ręczny | Utrata kontekstu, przepełnienie okna | Tablica `.opl/runs/<id>/` + pamięć 4-poziomowa z cytowaniami |
| 8 | Lista 13 reguł/5 ADR na sztywno w promptach | Nie skaluje się na monorepo z wieloma domenami | Reguły z ID + `applyTo` + karty modułów, ładowane just-in-time |
| 9 | Zbyt wielu „agentów”, którzy są w praktyce procedurami | Koszt kontekstu, rozmyte granice | Agent = rola + izolacja + uprawnienia narzędzi; procedura = skill |

---

## 2. Research: co Copilot oferuje dziś (stan na X 2026)

| Mechanizm | Gdzie | Do czego w OPL | Uwagi |
|-----------|-------|----------------|-------|
| **Custom agents** `*.agent.md` | `.github/agents/` | Role `opl-*` | Frontmatter: `name`, `description`, `tools`, `model`, `agents` (allowlista subagentów), `handoffs`, `user-invocable`, `disable-model-invocation` (zastępuje przestarzałe `infer`) |
| **Subagenci** | narzędzie `agent` / `runSubagent` | Izolacja kontekstu, fan-out | Zagnieżdżanie jest domyślnie wyłączone (`chat.subagents.allowInvocationsFromSubagents`). **Projektujemy głębokość ≤ 2.** |
| **Agent Skills** `SKILL.md` | `.github/skills/<name>/` (też `.claude/skills`, `.agents/skills`) | Procedury + **skrypty** + zasoby | Ładowane progresywnie: najpierw `name`/`description`, pełna treść gdy potrzebna. Otwarty standard, działa w VS Code, CLI i cloud agent. |
| **Instrukcje** | `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md` (`applyTo`, `excludeAgent`), `AGENTS.md` | Reguły kodowania z ID | Copilot code review czyta instrukcje; `excludeAgent: code-review` pozwala trzymać ciężkie reguły z dala od natywnego review |
| **Prompt files** `*.prompt.md` | `.github/prompts/` | Komendy wejściowe (`/opl-feature`, `/opl-review`) | Lekkie punkty wejścia przypięte do agenta |
| **Hooki** (preview) | `.github/hooks/*.json`, też we frontmatterze agenta | Twarde bramki, auto-lint, walidacja wyników | Zdarzenia: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PreCompact`, `SubagentStart`, `SubagentStop`, `Stop`. `PreToolUse` może zwrócić `deny`. |
| **Pamięć VS Code** (preview) | `/memories/` (user), `/memories/repo/`, `/memories/session/` | Notatki robocze | Repo-memory można przełączyć na Copilot Memory |
| **Copilot Memory** (public preview) | GitHub-hosted, per repo | Wiedza między powierzchniami | Wpisy z **cytowaniami walidowanymi przed użyciem**, wygasają po 28 dniach nieużycia. Wzorzec, który kopiujemy lokalnie. |
| **Copilot CLI headless** | `copilot -p ... --agent opl-pr-review --no-ask-user -s` | Review/analiza w GitHub Actions | `ask` w hookach jest tam traktowane jak `deny` |
| **Copilot coding agent (cloud)** | Issue → PR, `copilot-setup-steps.yml` | Autonomiczne zadania z tymi samymi agentami i skillami | |
| **MCP** | `.vscode/mcp.json`, frontmatter agenta | Azure DevOps, GitHub, opcjonalnie własny `opl-knowledge` MCP | W Orange wymaga allowlisty MCP na poziomie organizacji |

**Ryzyka platformowe, które plan uwzględnia:**

- Hooki i pamięć są w *preview*. Kształt outputu `PreToolUse` różni się w źródłach (`permissionDecision` top-level vs `hookSpecificOutput`), więc trzeba go zweryfikować na wersji VS Code używanej w Orange (ADR-OPL-000 w fazie 0).
- Frontmatter nie zachowuje się identycznie we wszystkich powierzchniach. Według źródeł wtórnych CLI nie respektuje allowlisty `agents`.
- Otwarty bug: subagenci w niektórych harnessach nie dostają `AGENTS.md` (`include-custom-instructions`). **Krytyczne reguły nie mogą więc polegać na dziedziczeniu instrukcji.** Agent ładuje je jawnie przez skill albo „rule pack” na tablicy.
- Kolejności i limitu współbieżności subagentów nie opisuje oficjalna dokumentacja. Fan-out ograniczamy sami (np. maks. 6 naraz) i nie zakładamy, że workerzy się widzą.

---

## 3. Kluczowa decyzja: Markdown czy skrypty?

**Rekomendacja: hybryda z wyraźnym podziałem odpowiedzialności.**

| Pytanie | Markdown (agent/skill) | Skrypt / narzędzie | Hook |
|---------|------------------------|--------------------|------|
| Które moduły dotyka zmiana? | interpretacja | **`opl-graph affected`** (nx/turbo/pnpm graph, dependency-cruiser) | — |
| Czy import łamie warstwy? | wyjaśnienie | **dependency-cruiser / ESLint boundaries** | `PostToolUse` uruchamia na edytowanym pliku |
| Jaki istniejący wzorzec użyć? | wybór i uzasadnienie | **`opl-find-similar`** (ast-grep / ts-morph, top-k exemplars) | — |
| Czy plan cytuje wzorce i mieści się w zakresie? | krytyka planu | **`opl-plan-lint`** (schemat + reguły) | `SubagentStop` dla planera |
| Czy agent edytuje tylko pliki z planu? | — | `plan-scope.json` | **`PreToolUse` deny** |
| Czy znalezisko review ma dowód? | rozumowanie | **`opl-findings validate`** (JSON Schema) | `SubagentStop` |
| Czy publiczne API się nie zmieniło (refactor)? | ocena | **api-extractor / `opl-api-diff`** | bramka w `Stop` |
| Czy testy są wartościowe? | review | **Stryker (mutation score)**, coverage diff | — |
| Push / komentarz na GitHubie | decyzja użytkownika | — | **`PreToolUse` deny bez `approval` w `state.json`** |

**Co pisać samemu, a co wziąć gotowe:**

- **Nie wymyślaj narzędzi analizy.** Opakuj istniejące: nx/turborepo graph albo `pnpm -r list --json`, dependency-cruiser, ESLint (custom rules), ast-grep, ts-morph, api-extractor, Stryker, Semgrep (security).
- **Własne skrypty** (TypeScript, `tools/opl/`, uruchamiane przez `pnpm opl <cmd>`) to cienkie adaptery, które zwracają **zwięzły JSON** zoptymalizowany pod kontekst LLM (top-k, bez dumpów).
- **Własny MCP server `opl-knowledge`** pojawia się dopiero w fazie 3, gdy indeks jest stabilny i chcemy go współdzielić między repo i powierzchniami (VS Code, CLI, cloud agent). Do tego czasu wystarczą skrypty CLI wołane przez skille, bo są prostsze w utrzymaniu, audycie i bezpieczeństwie.

---

## 4. Architektura warstwowa

```
┌──────────────────────────────────────────────────────────────────────────┐
│ L6  CI / Eval        GitHub Actions: copilot -p --agent …, eval harness,   │
│                      nightly index rebuild, docs drift report             │
├──────────────────────────────────────────────────────────────────────────┤
│ L5  Pamięć           T1 Canon │ T2 Indeks │ T3 Tablica run │ T4 Lessons    │
├──────────────────────────────────────────────────────────────────────────┤
│ L4  Hooki            scope guard · auto-lint · schema gate · approval gate │
├──────────────────────────────────────────────────────────────────────────┤
│ L3  Narzędzia        tools/opl/* (graph, similar, rules, findings, api…)  │
├──────────────────────────────────────────────────────────────────────────┤
│ L2  Skille opl-*     procedury + scripts/ + templates/ + references/       │
├──────────────────────────────────────────────────────────────────────────┤
│ L1  Agenci opl-*     koordynatorzy (user-invocable) + workerzy (ukryci)    │
├──────────────────────────────────────────────────────────────────────────┤
│ L0  Canon wiedzy     docs/adr, docs/opl/rules, docs/opl/patterns,          │
│                      module cards, glossary  →  .github/instructions/*     │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Struktura repo

```
.github/
  copilot-instructions.md            # ≤ ~4k znaków: misja, mapa, link do reguł (czyta też natywny code review)
  instructions/
    opl-arch.instructions.md         # applyTo: "packages/**"  (adapter → docs/opl/rules/arch.md)
    opl-ts.instructions.md           # applyTo: "**/*.ts,**/*.tsx"
    opl-tests.instructions.md        # applyTo: "**/*.test.ts"
    opl-review-deep.instructions.md  # excludeAgent: code-review (ciężkie reguły tylko dla opl)
  agents/        opl-*.agent.md
  skills/        opl-*/SKILL.md (+ scripts/, templates/, references/)
  prompts/       opl-feature.prompt.md, opl-review.prompt.md, opl-refactor.prompt.md, opl-docs.prompt.md
  hooks/         opl-guards.json
  workflows/     opl-pr-review.yml, opl-index.yml, opl-eval.yml, copilot-setup-steps.yml
AGENTS.md                            # krótki, wskazuje na canon; per-pakiet AGENTS.md w monorepo
docs/
  adr/                               # ADR projektu (istniejące + nowe)
  opl/
    rules/        arch.md, ts.md, testing.md, security.md …   # reguły z ID OPL-<AREA>-NNN
    patterns/     <pattern>.md        # intencja, kiedy, exemplar file:line, anty-wzorzec
    modules/      <package>.card.md   # karta modułu (generowana + kuratorowana)
    glossary.md                       # język domeny Orange
    lessons/                          # zatwierdzone wnioski z retrospektyw
    evals/        golden/*.json       # złoty zbiór review
tools/opl/        src/{graph,similar,rules,findings,plan,api-diff,memory,index}.ts
.opl/                                 # gitignored (poza index/ opcjonalnie cache w CI)
  index/          graph.json, symbols.json, patterns.json, owners.json
  runs/<run-id>/  state.json, task.md, analysis.json, research.json, rulepack.md,
                  plan.json, plan-scope.json, findings/*.json, verdict.json, log.md
```

**Zasada „canon + adapter”** (rozwija Twoją opcję C): treść reguły żyje raz w `docs/opl/rules/*.md`. Plik `.github/instructions/*.instructions.md` to cienki adapter z `applyTo`, który zawiera tylko reguły (krótko, z ID) i link. Zapobiega to rozjechaniu się Cursor/Copilot/docs.

---

## 5. Pamięć i zarządzanie kontekstem (best practices)

### 5.1 Cztery poziomy pamięci

| Poziom | Co | Trwałość | Kto pisze | Jak agent czyta |
|--------|----|----------|-----------|-----------------|
| **T1 Canon** | ADR, reguły z ID, wzorce, glossary, karty modułów | git, review PR | człowiek + `opl-docs-curator` (z approval) | just-in-time: `applyTo` + skill `opl-rulepack` buduje pakiet tylko dla dotkniętych ścieżek |
| **T2 Indeks** | graf modułów, symbole publiczne, rejestr wzorców, ownership | regenerowany (nightly + on-demand) | **tylko skrypty** | zapytania przez `pnpm opl …` → top-k JSON |
| **T3 Tablica runu** | stan pipeline, analiza, plan, znaleziska, decyzje | czas trwania zadania (+ archiwum) | agenci przez zapis plików | ścieżki przekazywane między agentami |
| **T4 Lessons** | wnioski z retrospektyw, preferencje zespołu | git (`docs/opl/lessons/`) + Copilot Memory | `opl-retro` → approval człowieka | jak T1. Każdy wpis ma **cytowanie** i jest walidowany |

### 5.2 Reguły zarządzania kontekstem

1. **Koordynator nie czyta kodu.** Czyta tylko `state.json` i podsumowania workerów (≤ 15 linii każde). Pełne wyniki zostają w plikach.
2. **Przekazuj ścieżki, nie treść.** Prompt delegacji = cel + ścieżki wejściowe + ścieżka wyjściowa + schemat. Tak działa izolacja kontekstu subagentów.
3. **Rule pack zamiast „przeczytaj 13 reguł”.** Skrypt `opl rules pack --paths <affected>` zwraca tylko reguły pasujące do dotkniętych plików (po `applyTo`), z ID i jednolinijkowym brzmieniem.
4. **Karty modułów zamiast eksploracji.** Każdy pakiet ma `<package>.card.md` (≤ 60 linii): odpowiedzialność, publiczne API, zależności dozwolone/zakazane, wzorce, pułapki, właściciel. Agent czyta kartę, zanim otworzy kod.
5. **Cytowania i walidacja pamięci.** Każdy fakt w T4/Copilot Memory ma `file:line` albo PR. Skrypt `opl memory validate` sprawdza, czy cytowania istnieją i treść się zgadza, a nieaktualne wpisy oznacza do korekty. To ten sam mechanizm, którego używa GitHub.
6. **`PreCompact` hook** zapisuje `state.json` + `log.md` przed kompakcją, więc wznowienie po kompakcji czy w nowej sesji zaczyna się od tablicy, nie od pamięci rozmowy. Zastępuje to ręczny `eq-handoff`.
7. **Pamięć sesyjna VS Code (`/memories/session/`)** służy tylko jako notatnik. Źródłem prawdy dla runu jest `.opl/runs/`, bo jest jawne, przeglądalne i działa w CLI/CI.

---

## 6. Katalog agentów `opl-*`

Kryterium: **agent** istnieje tylko wtedy, gdy potrzebuje *własnej roli, izolowanego kontekstu albo innego zestawu uprawnień/modelu*. Procedura bez tych potrzeb to **skill**.

### 6.1 Koordynatorzy (`user-invocable: true`)

| Agent | Rola | Subagenci (`agents:`) |
|-------|------|-----------------------|
| `opl-orchestrator` | Pipeline feature/bugfix/refactor: G0–G8 | scout, pattern-miner, rule-curator, planner, plan-critic, test-author, implementer, refactorer, gatekeeper, review-* , verifier, judge, pr-author |
| `opl-pr-review` | Review PR (interaktywne / autopilot-reviewer / self-fix loop) | scout, rule-curator, review-*, verifier, judge (+ planner, implementer w trybie self-fix) |
| `opl-docs-curator` | Analiza dokumentacji, ekstrakcja reguł/wzorców, drift docs↔kod | docs-extractor, claim-verifier, pattern-miner, rule-curator, adr-author |
| `opl-investigator` | Diagnoza bugów, flaky, security issues (Dependabot/CVE) | scout, diagnostician, verifier |
| `opl-retro` | Retrospektywa → propozycje zmian w canon | conversation-analyst, rule-curator |

### 6.2 Workerzy (`user-invocable: false`)

| Agent | Faza | Narzędzia (min. uprawnienia) | Model* | Wyjście |
|-------|------|------------------------------|--------|---------|
| `opl-scout` | kontekst | read, search, `opl graph/affected` | szybki | `analysis.json` (moduły, krawędzie, ryzyka, właściciele, ADR) |
| `opl-pattern-miner` | kontekst | read, search, `opl similar/patterns` | reasoning | `research.json` (exemplary top-3 z `file:line`, legacy do unikania) |
| `opl-rule-curator` | kontekst | read, `opl rules pack` | szybki | `rulepack.md` |
| `opl-planner` | plan | read, write (tylko `.opl/runs`) | reasoning | `plan.json` + `plan-scope.json` |
| `opl-plan-critic` | plan | read, `opl plan lint` | reasoning, **inny niż planner** | `plan-review.json` |
| `opl-test-author` | build (RED) | edit (tylko testy z planu), test runner | standard | testy czerwone + log |
| `opl-implementer` | build (GREEN) | edit (tylko `plan-scope`), lint, test | standard | kod + log |
| `opl-refactorer` | build | edit, `opl api-diff`, `opl graph diff`, test | reasoning | kod + `equivalence.md` |
| `opl-gatekeeper` | weryfikacja deterministyczna | terminal (lint, tsc, test, depcruise, api-diff, mutation) | szybki | `gates.json` |
| `opl-review-logic` | review/find | read, search, `opl graph callers` | reasoning | `findings/logic.json` |
| `opl-review-contracts` | review/find | read, `opl graph` | reasoning | `findings/contracts.json` (granice modułów, DTO, API publiczne) |
| `opl-review-conventions` | review/find | read, `opl rules check` | standard | `findings/conventions.json` (tylko reguły z ID) |
| `opl-review-tests` | review/find | read, coverage/mutation report | standard | `findings/tests.json` |
| `opl-review-security` | review/find | read, Semgrep | reasoning | `findings/security.json` |
| `opl-review-equivalence` | review/find (tylko refactor) | read, api-diff | reasoning | `findings/equivalence.json` |
| `opl-verifier` | review/verify | read, test runner (repro), `opl graph callers` | **inna rodzina modelu niż finderzy** | `findings/*.verified.json` |
| `opl-judge` | review/judge | read, `opl findings merge` | reasoning | `verdict.json` + raport |
| `opl-docs-extractor` | docs | read | standard | `claims.json` |
| `opl-claim-verifier` | docs | read, search, `opl similar` | reasoning | `claims.verified.json` (zgodne / drift / brak dowodu) |
| `opl-adr-author` | docs | read, write (`docs/adr` po approval) | reasoning | szkic ADR (Proposed) |
| `opl-diagnostician` | investigate | terminal, read | reasoning | pętla feedbacku + hipotezy |
| `opl-pr-author` | delivery | git, GitHub MCP (push zablokowany hookiem bez approval) | szybki | opis PR |
| `opl-conversation-analyst` | retro | read | standard | `retro.json` |

\* Konkretne modele ustalane w fazie 0 wg tego, co Orange ma włączone w Copilot Business/Enterprise. `model:` we frontmatterze przyjmuje listę z fallbackiem.

### 6.3 Skille `opl-*` (procedury + skrypty)

`opl-rulepack`, `opl-module-card`, `opl-find-patterns`, `opl-plan-format`, `opl-tdd`, `opl-characterization-tests`, `opl-create-{module,dto,mapper,api,query,component,test}` (Twoje create-* z uogólnieniem na stack Orange), `opl-finding-schema`, `opl-review-rubric`, `opl-verify-finding`, `opl-gh-review-submit` (format naturalny/etykietowany), `opl-adr`, `opl-diagnose`, `opl-flaky`, `opl-cherry-pick`, `opl-security-advisory`, `opl-grill`, `opl-zoom-out`, `opl-branch-setup`, `opl-handoff` (awaryjny, generowany z tablicy).

---

## 7. Pipeline `opl-orchestrator` (bramki i równoległość)

```
G0 SETUP      opl-branch-setup (skill) → .opl/runs/<id>/state.json
G1 INTAKE     ADO/GH issue → task.md;  niejasne? → opl-grill (pytania 1-po-1)  ⟵ HITL jeśli brak AC
G2 CONTEXT    ┌ opl-scout ───────────┐
   (równolegle)├ opl-pattern-miner ───┤→ analysis.json, research.json, rulepack.md
              └ opl-rule-curator ────┘
G3 PLAN       opl-planner → plan.json (każdy krok: plik, akcja, skill, EXEMPLAR file:line, reguły, testy)
G4 PLAN GATE  opl plan lint (deterministycznie) + opl-plan-critic  → max 2 iteracje
G4b HUMAN     Approve / Changes / Autopilot                        ⟵ HITL (pomijalne w L1)
G5 BUILD      opl-test-author (RED, potwierdzony fail) → opl-implementer (GREEN)
              • równolegle per niezależny shard planu (różne moduły, brak krawędzi w grafie)
              • hook PreToolUse: edycja poza plan-scope.json → deny
              • hook PostToolUse: lint+format edytowanego pliku
G6 GATES      opl-gatekeeper: lint, tsc, testy affected, depcruise, api-diff, mutation(affected)
              fail → implementer z logiem (max 2) → opl-diagnose
G7 REVIEW     Find (równolegle: lens × shard) → Verify (równolegle per finding) → Judge
              blocking → planner (tylko blocking) → G5 (max 3 pętle) → eskalacja
G8 DELIVERY   opl-pr-author: commit, opis PR z linkami do ADR/reguł; push tylko po approval  ⟵ HITL
G9 LEARN      opl-retro (opcjonalnie) → propozycje do canon (approval)
```

**Poziomy autonomii** (zapisane w `state.json`, egzekwowane hookami):

- **L0 Interactive**: wszystkie bramki HITL.
- **L1 Autopilot local**: pomija G4b, pętla naprawcza bez pytań. Push i komentarze na GitHubie dalej wymagają zgody.
- **L2 Headless CI**: tylko odczyt + komentarze review. Edycje zablokowane, chyba że tryb `self-fix` na własnym branchu bota.

---

## 8. Review: architektura „nieomylności”

Nieomylności nie da się zagwarantować. Da się natomiast **systematycznie maksymalizować precyzję i mierzyć recall**. Projekt:

### 8.1 Find (wysoki recall)

- **Sharding:** diff → `opl graph affected` → grupy plików wg modułu. Duży diff dzielimy na shardy ≤ ~800 linii zmian. Każdy shard dostaje kartę modułu i rule pack.
- **Soczewki (lens) zamiast jednego „reviewera od wszystkiego”:** logic, contracts (granice modułów, DTO↔domain, publiczne API, kompatybilność), conventions (tylko reguły z ID), tests (jakość + mutation), security, equivalence (refactor). Fan-out = lens × shard, z limitem współbieżności.
- Każdy finder czyta **callery i callee** zmienionych symboli przez `opl graph callers`, nie zgaduje.
- Checklisty z Twojego `eq-logic-reviewer` (8 kategorii) przechodzą do skilla `opl-review-rubric` i są parametryzowane stackiem modułu.

### 8.2 Kontrakt znaleziska (schemat JSON, walidowany hookiem `SubagentStop`)

```json
{
  "id": "LOGIC-007",
  "lens": "logic",
  "severity": "blocking|major|minor|nit",
  "confidence": 0.0,
  "rule_id": "OPL-ARCH-003 | null",
  "location": { "file": "packages/billing/src/x.ts", "line": 42, "symbol": "calcInvoice" },
  "quote": "dokładny fragment kodu",
  "claim": "co jest źle",
  "trigger": "konkretne wejście/stan, które wywołuje błąd",
  "expected": "…", "actual": "…",
  "reachability": "ścieżka od realnego callera (z opl graph callers)",
  "evidence": { "type": "test|trace|rule|doc", "ref": "…" },
  "fix_hint": "krótko; preferuj istniejący wzorzec (exemplar file:line)"
}
```

Bez `quote` zgodnego z plikiem, `trigger` i `reachability` znalezisko **nie może** mieć severity `blocking`. Pilnuje tego skrypt `opl findings validate`.

### 8.3 Verify (wysoka precyzja)

- `opl-verifier` dostaje **jedno znalezisko + czysty kontekst + kod**, bez rozumowania findera. Jego zadanie to **obalić** znalezisko: sprawdzić cytat, prześledzić reachability i poszukać guardów wyżej w stosie.
- Kolejność dowodów: (1) **wykonywalny repro**, czyli tymczasowy failing test w sandboxie, (2) deterministyczny skrypt/reguła (lint, depcruise, semgrep), (3) ślad wywołań, (4) argument tekstowy, który maksymalnie daje `major`.
- Weryfikator działa na **innej rodzinie modelu** niż finder. Ten sam model ma te same uprzedzenia, które wygenerowały false positive.
- Wynik: `confirmed | refuted | unproven`. Status `unproven` nigdy nie blokuje, trafia do „Do rozważenia”.

### 8.4 Judge

Deduplikacja (ta sama przyczyna z różnych soczewek), kalibracja severity wg rubryki, sekcja **Verified Correct** (z eq, zostaje), decyzja `APPROVED / CHANGES REQUIRED`, mapowanie na komentarze GitHub (Twoje formaty naturalny/etykietowany). Raport ma linki do reguł i ADR.

### 8.5 Pomiar (eval harness, bez niego to nie jest enterprise)

- **Złoty zbiór:** 50–150 historycznych PR-ów monorepo z oznaczonymi prawdziwymi bugami (z hotfixów, revertów, komentarzy ludzi) + **zasiane bugi** (mutacje) + czyste PR-y (kontrola false positives).
- **Metryki per soczewka i całości:** precision, recall, % blocking potwierdzonych przez człowieka, koszt (tokeny/czas), stabilność (3 przebiegi).
- **Bramka regresji w CI:** każda zmiana w `.github/agents|skills|instructions` uruchamia `opl-eval.yml`. Spadek precision lub recall ponad próg = PR czerwony. Prompty traktujemy jak kod.
- **Telemetria produkcyjna:** reakcje na komentarze (resolved/dismissed) zasilają złoty zbiór co sprint.

---

## 9. Wzorce zamiast rozwiązywania od zera

1. **Katalog wzorców** `docs/opl/patterns/<name>.md`: intencja, kiedy stosować i kiedy nie, **kanoniczny exemplar `file:line`**, wariant legacy (nie kopiować), powiązane reguły i ADR, skill tworzący.
2. **Indeks wzorców** (`.opl/index/patterns.json`) jest budowany skryptem: ast-grep reguły wykrywające wystąpienia wzorca + licznik użyć per moduł. Exemplar to najczęstsza *nowa* (nie-legacy) implementacja.
3. **`opl similar <opis|plik|symbol>`** zwraca top-k podobnych implementacji (strukturalnie + po nazwach), z oznaczeniem legacy/aktualny.
4. **Reuse check:** przed utworzeniem funkcji lub typu implementer odpala `opl symbols find`. Jeśli istnieje odpowiednik, musi go użyć albo uzasadnić w `log.md`.
5. **Bramka planu:** każdy krok `create` w `plan.json` ma `pattern_source` (exemplar) albo `new_pattern_adr`. `opl plan lint` odrzuca kroki bez tego. Nowa abstrakcja współdzielona = szkic ADR przez `opl-adr-author` + HITL.
6. **Zależności między modułami:** planner dostaje z `opl graph` dozwolone krawędzie (z kart modułów i reguł depcruise). `opl graph diff` w G6 blokuje nowe krawędzie łamiące architekturę.

---

## 10. Refactor: jawnie zachowana logika, lepszy kod

Kontrakt `opl-refactorer` (tryb `refactor` orchestratora):

1. **Zamrożenie zachowania:** `opl-characterization-tests` dopisuje testy charakteryzacyjne (golden master) dla publicznego API dotkniętych modułów, zanim cokolwiek się zmieni. Muszą przejść na starym kodzie.
2. **Inwentarz zachowań:** `equivalence.md` wymienia per funkcję wejścia, wyjścia, efekty uboczne, wyjątki i kolejność wywołań. To jest „jawnie zachowana logika”.
3. **Małe kroki:** po każdym kroku testy zielone, `opl api-diff` bez zmian (o ile plan nie mówi inaczej), `opl graph diff` bez nowych zakazanych krawędzi.
4. **Docelowa forma wg reguł z docs:** każda zmiana stylu lub struktury cytuje regułę `OPL-*` albo wzorzec. Zmiana bez podstawy w canon nie wchodzi.
5. **Bramki końcowe:** mutation score na dotkniętych plikach ≥ baseline, coverage ≥ baseline, soczewka `opl-review-equivalence` porównuje semantykę przed/po i jej znaleziska przechodzą przez verifier.

---

## 11. Analiza dokumentacji → reguły (`opl-docs-curator`)

```
D1 INVENTORY   skrypt: lista docs (md, adr, confluence export, README pakietów) + data/właściciel
D2 EXTRACT     opl-docs-extractor (równolegle per dokument) → claims.json
               typy: rule | pattern | decision | glossary | fact-about-code
D3 VERIFY      opl-claim-verifier (równolegle per claim) → zgodne / DRIFT / brak dowodu
               dowód = file:line, wynik opl similar / opl graph
D4 CLASSIFY    → reguła (ID, applyTo, poziom egzekucji), wzorzec (exemplar), ADR (Proposed), glossary
D5 ENFORCE     poziom egzekucji reguły:
                 E1 deterministyczna → wygeneruj regułę ESLint/depcruise/ast-grep (+ test reguły)
                 E2 LLM-review       → opl-review-conventions (cytuje ID)
                 E3 doradcza         → tylko w instrukcjach
D6 PUBLISH     propozycja zmian (tabela jak w eq-rules-gen) → HITL → canon + adaptery
D7 DRIFT CI    nightly: opl docs drift → raport/issue z twierdzeniami, które przestały być prawdziwe
```

Format reguły (`docs/opl/rules/arch.md`):

```md
### OPL-ARCH-003 — Moduł domenowy nie importuje z innego modułu domenowego
- applyTo: packages/*/src/**
- enforcement: E1 (dependency-cruiser: no-cross-domain)
- rationale: ADR-004 · source: docs/architecture.md#L120 (verified 2026-10-20)
- do: komunikacja przez kontrakt w packages/contracts (exemplar: packages/orders/src/ports/billing.port.ts:12)
- don't: import '@orange/billing/src/...'
```

---

## 12. Wymuszenia: hooki (szkic)

`.github/hooks/opl-guards.json` (kształt do weryfikacji na wersji VS Code Orange w fazie 0):

```json
{
  "hooks": {
    "SessionStart":  [{ "type": "command", "command": "pnpm -s opl session start" }],
    "PreToolUse":    [{ "type": "command", "command": "pnpm -s opl guard pre-tool", "timeout": 10 }],
    "PostToolUse":   [{ "type": "command", "command": "pnpm -s opl guard post-edit", "timeout": 60 }],
    "SubagentStop":  [{ "type": "command", "command": "pnpm -s opl guard subagent-output" }],
    "PreCompact":    [{ "type": "command", "command": "pnpm -s opl run checkpoint" }],
    "Stop":          [{ "type": "command", "command": "pnpm -s opl guard stop" }]
  }
}
```

| Guard | Logika |
|-------|--------|
| `pre-tool` | edycja pliku spoza `plan-scope.json` → deny · `git push`/komentarz GH bez `approval` w `state.json` → deny · komendy destrukcyjne → deny |
| `post-edit` | eslint --fix + prettier na pliku · szybki depcruise na pliku → wynik jako kontekst zwrotny |
| `subagent-output` | walidacja JSON Schema artefaktu workera. Błąd = komunikat do koordynatora, żeby ponowił. |
| `stop` | blokuje zakończenie, jeśli `state.json` deklaruje etap, którego bramka nie ma wyniku (np. G6 bez `gates.json`) |

Hooki to **jedyny** mechanizm, którego model nie może zignorować. Dlatego wszystkie „MUST” z promptów, które da się sprawdzić maszynowo, przenosimy tutaj.

---

## 13. Przykładowe pliki (wzorce do implementacji)

### 13.1 Koordynator

```md
---
name: opl-orchestrator
description: Koordynator pipeline'u feature/bugfix/refactor dla monorepo Orange. Deleguje do workerów opl-*, egzekwuje bramki G0–G9. Nigdy nie implementuje ani nie czyta kodu bezpośrednio.
tools: ['agent', 'read', 'search', 'runCommands', 'todos']
agents: ['opl-scout','opl-pattern-miner','opl-rule-curator','opl-planner','opl-plan-critic',
         'opl-test-author','opl-implementer','opl-refactorer','opl-gatekeeper',
         'opl-review-logic','opl-review-contracts','opl-review-conventions','opl-review-tests',
         'opl-review-security','opl-review-equivalence','opl-verifier','opl-judge','opl-pr-author']
model: ['<reasoning-model>', '<fallback>']
handoffs:
  - label: Review tego brancha
    agent: opl-pr-review
    prompt: Zrób review bieżących zmian w trybie pipeline.
---
# Rola
Prowadzisz run zapisany w `.opl/runs/<id>/state.json`. Źródłem prawdy jest tablica, nie rozmowa.

# Zasady
- Delegując, przekazujesz: cel, ścieżki wejść, ścieżkę wyjścia, nazwę schematu. Nie wklejasz treści plików.
- Od workera przyjmujesz tylko podsumowanie ≤ 15 linii + ścieżkę artefaktu.
- G2 i G7(Find/Verify) uruchamiasz równolegle; maks. 6 subagentów naraz.
- Po każdej bramce aktualizujesz `state.json` (`pnpm opl run advance <gate>`).
- Niejasność wymagań → STOP i pytanie (skill opl-grill).
…(procedura G0–G9 jak w sekcji 7)
```

### 13.2 Worker

```md
---
name: opl-verifier
description: Próbuje obalić pojedyncze znalezisko review na podstawie kodu i dowodów wykonywalnych. Używany wyłącznie przez opl-pr-review i opl-orchestrator.
user-invocable: false
tools: ['read', 'search', 'runCommands']
model: ['<model-innej-rodziny-niż-finderzy>']
---
Dostajesz ścieżkę do JEDNEGO znaleziska. Nie znasz rozumowania autora. Twoim celem jest je OBALIĆ.
1. Sprawdź, że `quote` istnieje dokładnie w `location` (pnpm opl findings check-quote).
2. Prześledź `reachability` (pnpm opl graph callers <symbol>) i szukaj guardów wyżej.
3. Jeśli to możliwe, napisz tymczasowy test repro w `.opl/runs/<id>/repro/` i uruchom go.
4. Zapisz wynik: confirmed | refuted | unproven + dowód. Bez dowodu wykonywalnego maks. severity = major.
```

### 13.3 Skill ze skryptem

```
.github/skills/opl-find-patterns/
  SKILL.md                # kiedy, jak interpretować wyniki, jak wybrać exemplar, legacy
  scripts/similar.sh      # → pnpm -s opl similar "$@" --top 3 --json
  references/legacy.md    # lista wzorców legacy do NIEkopiowania
```

---

## 14. Powierzchnie i automatyzacja (CI)

| Scenariusz | Powierzchnia | Wywołanie |
|------------|--------------|-----------|
| Developer buduje feature | VS Code agent mode | `/opl-feature AB#12345` → `opl-orchestrator` |
| Review cudzego PR, interaktywnie | VS Code | `/opl-review <PR>` |
| Automatyczny review każdego PR | GitHub Actions + Copilot CLI | `copilot -p "Review PR #$N" --agent opl-pr-review --no-ask-user -s --share=review.md` (tryb L2, tylko komentarze) |
| Zadania z backlogu | Copilot coding agent | Issue przypisane do Copilota. `copilot-setup-steps.yml` instaluje `pnpm` i buduje `.opl/index`. |
| Natywny Copilot code review | GitHub | czyta `copilot-instructions.md` + lekkie instrukcje. Ciężkie mają `excludeAgent: code-review`. |
| Nightly | Actions | `opl index build`, `opl docs drift`, `opl memory validate` |
| Zmiana promptów/agentów | Actions | `opl-eval.yml` (bramka regresji jakości) |

---

## 15. Governance i bezpieczeństwo (Orange enterprise)

- **CODEOWNERS** na `.github/agents|skills|hooks|instructions`, `docs/opl/**`, `tools/opl/**`. Zmiany w agentach mają owner team „AI Platform” i przechodzą eval.
- **Najmniejsze uprawnienia:** każdy worker ma minimalny zestaw `tools`. Finderzy review są read-only. Tylko implementer/refactorer/test-author edytują, ograniczeni hookiem do `plan-scope`.
- **MCP allowlist** na poziomie organizacji (ADO, GitHub, opcjonalnie `opl-knowledge`). Żadnych zewnętrznych skilli bez przeglądu, bo `allowed-tools` w skillu z zewnątrz to wektor ataku.
- **Prompt injection:** treść PR, issue i komentarzy traktujemy jako dane. Agent PR review nie wykonuje instrukcji z diffu ani opisu. Zapisane w regułach i w promptach finderów.
- **Sekrety:** `pre-tool` guard blokuje odczyt `.env*` i keystore. CI redaguje tokeny (`GITHUB_TOKEN`, `COPILOT_GITHUB_TOKEN`).
- **Audyt:** `.opl/runs/<id>/log.md` + `--share` transcript w CI jako artefakt builda (z retencją zgodną z polityką Orange).
- **Preview features** (hooki, pamięć) włączane świadomie przez politykę org. Fallback: bez hooków te same skrypty wołane w `opl-gatekeeper` jako krok obowiązkowy.

---

## 16. Roadmapa wdrożenia

| Faza | Czas | Zakres | Kryterium wyjścia |
|------|------|--------|-------------------|
| **0. Fundament** | 1–2 tyg. | Spike na wersji VS Code/CLI Orange: frontmatter, `agents`, równoległość, hooki (kształt `PreToolUse`), skille ze skryptami w VS Code + CLI + cloud agent. ADR-OPL-000 (decyzje platformowe). Szkielet `tools/opl` (graph, rules pack, findings validate). | Udokumentowane, co działa na każdej powierzchni |
| **1. Wiedza** | 2–3 tyg. | `opl-docs-curator` na pilotażowej domenie: reguły z ID, 10–15 wzorców z exemplarami, karty modułów pilota, `copilot-instructions` + adaptery. Indeks T2. | Reguły zatwierdzone przez architektów, ≥ 50% E1 (deterministyczne) |
| **2. Review** | 2–3 tyg. | `opl-pr-review`: Find/Verify/Judge, schemat findings, hooki `SubagentStop`. Złoty zbiór v1 (≥ 50 PR). `opl-eval.yml`. | Precision blocking ≥ 85%, recall na zasianych bugach ≥ 60%, stabilność 3/3 |
| **3. Build** | 3–4 tyg. | `opl-orchestrator` G0–G9, test-author/implementer/refactorer, `plan lint`, guards `pre-tool`/`post-edit`, tryb refactor z api-diff + charakteryzacją. | 10 realnych zadań na pilocie, ≥ 90% kroków planu z exemplarem, 0 naruszeń granic po G6 |
| **4. Automatyzacja** | 2 tyg. | Actions: review headless L2, nightly index/drift/memory, coding agent z setup-steps. Ewentualnie MCP `opl-knowledge`. | Review w CI na wszystkich PR pilota, koszt/PR w budżecie |
| **5. Skalowanie** | ciągle | Kolejne domeny monorepo, retro → lessons, kwartalny przegląd eval i rubryk. | KPI poniżej |

**KPI programu:** precision/recall review (eval + produkcja), % komentarzy agenta „resolved” vs „dismissed”, rework rate po review człowieka, lead time zadania, naruszenia architektury wykryte po merge (cel: → 0), koszt tokenów na zadanie/PR, % reguł egzekwowanych deterministycznie.

---

## 17. Mapowanie eq-* → opl-*

| eq-* | opl-* | Zmiana |
|------|-------|--------|
| eq-orchestrator | `opl-orchestrator` (agent) | tablica `.opl/runs`, hooki, poziomy autonomii, równoległy build per shard |
| eq-analyzer + eq-zoom-out | `opl-scout` (agent) + `opl-zoom-out` (skill) | oparte na `opl graph`, nie na czytaniu repo |
| eq-researcher + eq-codebase-research | `opl-pattern-miner` + `opl-find-patterns` | indeks wzorców, exemplary `file:line` |
| eq-planner | `opl-planner` | `plan.json` + `plan-scope.json`, obowiązkowy `pattern_source` |
| eq-plan-reviewer | `opl-plan-critic` + `opl plan lint` | część deterministyczna w skrypcie, inny model niż planner |
| eq-implementer | `opl-test-author` + `opl-implementer` | rozdzielony RED/GREEN, scope guard |
| eq-sanity-checker | `opl-gatekeeper` | czysto deterministyczny, plus api-diff i mutation |
| eq-code-reviewer | `opl-pr-review` + `opl-judge` | Find/Verify/Judge, tryby A–D zachowane |
| eq-logic-reviewer | `opl-review-logic` (+ contracts, security, tests) | podział na soczewki, schemat findings |
| eq-conventions-reviewer + eq-implementation-review | `opl-review-conventions` + `opl rules check` | tylko reguły z ID, część E1 w linterze |
| eq-adr-author + eq-create-adr | `opl-adr-author` + skill `opl-adr` | bez zmian koncepcyjnych |
| eq-conversation-analyzer + eq-rules-gen + eq-retrospective | `opl-retro` + `opl-conversation-analyst` + `opl-rule-curator` | wnioski z cytowaniami → `docs/opl/lessons`, walidowane |
| eq-handoff | `opl-handoff` (generowany z tablicy) | tablica + `PreCompact` czynią go niemal zbędnym |
| eq-diagnose, eq-check-flaky, eq-analize-github-issue | `opl-investigator` + skille `opl-diagnose`, `opl-flaky`, `opl-security-advisory` | |
| eq-create-* | skille `opl-create-*` | uogólnione na stack Orange, każdy z exemplarem z indeksu |
| eq-cherry-pick, eq-pr-agent, eq-workspace-switch, eq-grill | skille `opl-cherry-pick`, `opl-pr-author` (agent), `opl-branch-setup`, `opl-grill` | |
| eq-conversation-critical-analisis | poza zakresem (spotkania), opcjonalny skill | |

---

## 18. Decyzje do podjęcia przez Ciebie / zespół Orange

1. **Stack monorepo:** narzędzie grafu (nx / turborepo / pnpm workspaces / Gradle-Maven, jeśli jest backend JVM). Od tego zależy implementacja `opl graph`.
2. **Modele dostępne w licencji Orange**, bo potrzebna jest co najmniej jedna para różnych rodzin dla finder/verifier.
3. **Domena pilotażowa** na fazy 1–3.
4. **Czy hooki (preview) mogą być włączone politykami org?** Jeśli nie, uruchamiamy fallback przez `opl-gatekeeper`.
5. **Gdzie żyje canon:** w samym monorepo (rekomendacja) czy we wspólnym repo „ai-platform” konsumowanym przez wiele repo (wtedy skille i agenci jako org-level / pakiet).

---

## Źródła

- [Custom agents in VS Code](https://code.visualstudio.com/docs/agent-customization/custom-agents) · [Custom agent file reference](https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference) · [Use subagents in VS Code](https://code.visualstudio.com/docs/agents/run/subagents) · [vscode-docs: subagents.md](https://github.com/microsoft/vscode-docs/blob/main/docs/copilot/agents/subagents.md) · [GitHub Docs: Using subagents in your IDE](https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/use-copilot-agents/use-subagents?tool=vscode)
- [Awesome Copilot: Agents and Subagents](https://awesome-copilot.github.com/learning-hub/agents-and-subagents/) · [Custom Agent Developer Guide](https://copilot-academy.github.io/workshops/copilot-customization/custom_agent_developer_guide) · [Issue #343696: include-custom-instructions dropped for subagents](https://github.com/microsoft/vscode/issues/343696) · [Community: orchestrating multiple agents/skills](https://github.com/orgs/community/discussions/192232)
- [GitHub Docs: Adding agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills) · [Visual Studio: Agent Skills](https://learn.microsoft.com/en-us/visualstudio/ide/copilot-agent-skills?view=visualstudio) · [Instructions vs Prompts vs Agents vs Skills](https://dev.to/pwd9000/github-copilot-instructions-vs-prompts-vs-custom-agents-vs-skills-vs-x-vs-why-339l)
- [Configure agent hooks in VS Code](https://code.visualstudio.com/docs/agent-customization/hooks) · [GitHub Copilot hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference) · [Awesome Copilot: Automating with Hooks](https://awesome-copilot.github.com/learning-hub/automating-with-hooks/)
- [Memory in VS Code agents](https://code.visualstudio.com/docs/agents/memory) · [GitHub Docs: Copilot Memory](https://docs.github.com/en/copilot/concepts/agents/copilot-memory) · [Building an agentic memory system for GitHub Copilot](https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/) · [Changelog: agentic memory public preview](https://github.blog/changelog/2026-01-15-agentic-memory-for-github-copilot-is-in-public-preview/)
- [Copilot CLI programmatic reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference) · [Running Copilot CLI programmatically](https://docs.github.com/en/copilot/how-tos/copilot-cli/automate-copilot-cli/run-cli-programmatically) · [Custom agents in Copilot CLI](https://github.blog/ai-and-ml/github-copilot/from-one-off-prompts-to-workflows-how-to-use-custom-agents-in-github-copilot-cli/)
- [Repository custom instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions-in-your-ide/add-repository-instructions-in-your-ide) · [Changelog: agent-specific instructions (excludeAgent)](https://github.blog/changelog/2025-11-12-copilot-code-review-and-coding-agent-now-support-agent-specific-instructions/)
- [Adversarial code review](https://www.augmentcode.com/guides/adversarial-code-review) · [AI code review accuracy](https://www.augmentcode.com/guides/ai-code-review-accuracy) · [Weak verifiers paper (arXiv 2607.20852)](https://huggingface.co/papers/2607.20852)

> Uwaga metodologiczna: oficjalne strony VS Code/GitHub Docs były niedostępne bezpośrednio z mojego środowiska, więc fakty zebrałem przez wyszukiwarkę (streszczenia stron). Elementy oznaczone jako preview lub z rozbieżnościami między źródłami (kształt outputu hooków, `agents` w CLI, nazwy ustawień pamięci) weryfikujemy w fazie 0.
