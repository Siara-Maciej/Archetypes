# 07. Uruchamianie workflow w Copilot

> **Decyzja na teraz:** używamy wyłącznie **trybu interaktywnego (user-interactive flow) w VS Code**.
> **Tryb auto** (Copilot CLI + skrypty `opl`) jest opisany w części B jako demonstracja i kierunek na F5. Nie wdrażamy go produkcyjnie.

---

# Część A: tryb interaktywny (VS Code), tryb docelowy

## A1. Przygotowanie (jednorazowo)

| Krok | Co | Uwagi |
|------|----|-------|
| 1 | `bun install` | `tools/opl` korzysta z zależności repo (`typescript`) |
| 2 | `bun run opl index build` | pierwsze zbudowanie indeksu (graf, symbole, API, wzorce) |
| 3 | VS Code + Copilot Chat w trybie **Agent** | wersja zgodna z ADR-OPL-000 (F0) |
| 4 | Włączone: custom agents (`.github/agents`), Agent Skills (`.github/skills`), prompt files (`.github/prompts`), hooki (`.github/hooks`) | dokładne nazwy ustawień i polityk org do potwierdzenia w F0 |
| 5 | **Nie** włączamy zagnieżdżania subagentów (`chat.subagents.allowInvocationsFromSubagents` zostaje wyłączone) | projektujemy głębokość ≤ 2 |
| 6 | Narzędzie „Run Subagent” (`agent`) dostępne dla koordynatorów | koordynatorzy mają je we frontmatterze `tools` |

Sprawdzenie: `bun run opl meta check-all` = zielono, a w czacie lista agentów pokazuje tylko koordynatorów `opl-*`.

## A2. Punkty wejścia

| Komenda w czacie | Koordynator | Workflow | Typowe użycie |
|------------------|-------------|----------|---------------|
| `/opl-feature <ADO\|issue\|opis>` | `opl-orchestrator` | W1 | nowa funkcjonalność |
| `/opl-bugfix <ADO\|opis>` | `opl-orchestrator` | W2 | naprawa z testem regresyjnym |
| `/opl-refactor <ścieżka> "<cel>"` | `opl-orchestrator` | W3 | refactor bez zmiany zachowania |
| `/opl-review <PR-URL>` | `opl-pr-review` | W4 / W5 | review cudzego PR albo self-review |
| `/opl-tests <pakiet>` | `opl-orchestrator` | W6 | wzmocnienie testów |
| `/opl-docs [zakres]` | `opl-docs-curator` | W7 | docs → reguły, wzorce, ADR |
| `/opl-investigate "<objaw>"` | `opl-investigator` | W8 / W9 | diagnoza, flaky, CVE |
| `/opl-retro [run-id]` | `opl-retro` | W11 | retrospektywa |
| `/opl-resume [run-id]` | ten z `state.json` | dowolny | wznowienie |
| `/opl-status` | – (tylko `opl run status`) | – | podgląd aktywnych runów |

Każdy prompt file jest cienki: przypina agenta i zbiera parametry.

```md
---
agent: opl-orchestrator
description: Implementacja zadania wg workflow opl-feature (interaktywnie)
argument-hint: "AB#12345 | URL issue | opis zadania"
---
Uruchom workflow `opl-feature` dla: ${input:task:ID ADO, URL issue albo opis}.
Autonomia: ${input:autonomy:L0}  (L0 = wszystkie bramki, L1 = bez akceptacji planu)
Najpierw: `bun run opl run init --workflow opl-feature --input "<task>" --autonomy <autonomy>`.
```

```md
---
agent: opl-orchestrator
description: Wznowienie przerwanego runu OPL
argument-hint: "[run-id], puste = ostatni aktywny"
---
Wykonaj `bun run opl run status ${input:run:}`. Przeczytaj stan i ostatnie wpisy log.md.
Podsumuj w ≤ 10 liniach, co zrobiono i co zostało, potem kontynuuj od bieżącego etapu.
Jeśli workflow należy do innego koordynatora, zaproponuj handoff.
```

## A3. Przebieg sesji krok po kroku (przykład W1)

```
Ty:      /opl-feature AB#12345
Agent:   ▸ G0  Branch: feat/AB#12345-rabaty (nowy z integrate) · index świeży · run 20261025-feature-ab12345
         ▸ G1  Zadanie (3 zdania) + AC z ADO. Niejasność: „rabat łączony”, czy sumuje się z promocją?
         Pytanie 1/1: Jak traktować rabat łączony?
           1. Sumuje się z promocją   2. Większy z dwóch   3. Inne (opisz)
Ty:      2
Agent:   ▸ G2  [równolegle] scout ✓  pattern-miner ✓  rule-curator ✓
               Moduły: billing, orders (krawędź orders→billing przez kontrakt) · wzorce: mapper, query-hook
         ▸ G3  Plan: 7 kroków (testy najpierw), każdy z exemplarem
         ▸ G4  plan lint ✓ · plan-critic: APPROVED (1 rekomendacja)
         ── Automated plan review: APPROVED ──
         [pełny plan z exemplarami, regułami, testami]
         Co dalej?
           1. Zatwierdź   2. Zmiany (opisz)   3. Autopilot (L1 do końca runu)
Ty:      1
Agent:   ▸ G5  RED: 5 testów failuje (oczekiwane) → GREEN: 5/5 ✓   [hook: biome+ast-grep po każdej edycji]
         ▸ G6  gates: biome ✓ tsc ✓ rules ✓ tests(affected 42) ✓ graph-diff ✓
         ▸ G7  review: find 6 soczewek×2 shardy → 4 znaleziska → verify: 1 confirmed (major), 3 refuted
               → judge: APPROVED (1 non-blocking)
         [raport review]
         ▸ G8  Opis PR gotowy. Co dalej?
           1. Push + utwórz PR   2. Zostaw lokalnie   3. Popraw non-blocking przed PR
Ty:      3
...
```

Co widzisz i kiedy decydujesz:
- **Status etapów** w krótkich liniach. Pełne raporty pokazują się tylko w bramkach z udziałem człowieka (HITL).
- **Bramki HITL:** pełny raport, potem numerowane opcje. Odpowiadasz cyfrą albo tekstem. Odpowiedź trafia do `log.md` i `state.json.approvals`.
- **Pytania doprecyzowujące** padają pojedynczo (skill `opl-grill`).
- **Blokady hooków** są widoczne jako komunikat, np. „Plik spoza plan-scope…”. Agent sam proponuje poprawkę planu.

## A4. Autonomia w trybie interaktywnym

| Poziom | Kiedy | Co pomija | Czego nigdy nie pomija |
|--------|-------|-----------|------------------------|
| **L0** (domyślny) | nowe obszary, ważne zmiany | nic | – |
| **L1** „autopilot” | rutynowe zadania, self-review (W5) | akceptację planu (G4b), pętle naprawcze bez pytania | push, komentarze na GitHubie, nowe ADR i abstrakcje, eskalację po wyczerpaniu pętli |

L1 włączasz przy starcie (`autonomy: L1`) albo opcją „Autopilot” w bramce planu. Zapis jest w `state.json`, a hook `pre-tool` i tak wymaga zgody na push.

## A5. Przerwanie, wznowienie, przekazanie

| Sytuacja | Co robisz | Co się dzieje |
|----------|-----------|---------------|
| Zamykasz VS Code w trakcie | nic | stan jest w `.opl/runs/<id>/`, `PreCompact` i `Stop` zapisały checkpoint |
| Wracasz | `/opl-resume` | `opl run status` → podsumowanie → kontynuacja od bieżącego etapu |
| Kontekst rozmowy jest długi | nowy czat + `/opl-resume` | świeże okno, zero strat (tablica, nie historia) |
| Przekazujesz koledze | `bun run opl run handoff` → dokument + push brancha | kolega: checkout + `/opl-resume <id>` |
| Chcesz porzucić run | „przerwij run” | `opl run close --aborted` + wpis w logu |

## A6. Handoffs między koordynatorami

- `opl-orchestrator` → przycisk **„Review zmian”** → `opl-pr-review` (tryb pipeline, ten sam run).
- `opl-pr-review` (Author flow, CHANGES REQUIRED) → przycisk **„Napraw blocking”** → `opl-orchestrator` z planem tylko dla blocking.
- `opl-docs-curator` → przycisk **„Szkic ADR”** → `opl-adr-author` (tylko Proposed).
- Każdy koordynator po zakończeniu → przycisk **„Retrospektywa”** → `opl-retro`.

## A7. Gdy coś nie działa

| Objaw | Przyczyna | Działanie |
|-------|-----------|-----------|
| Agent odpowiada sam, nie deleguje | brak narzędzia `agent` albo worker nie jest na liście `agents:` | `opl meta agents-lint`, sprawdź `tools`/`agents` |
| Worker oddaje markdown zamiast JSON | brak walidacji | `opl findings validate` / `run advance` zwraca błąd, a koordynator ponawia z komunikatem |
| Hook nie blokuje | hooki wyłączone polityką albo inny format I/O | ADR-OPL-000, fallback: bramki w `run advance` + `opl-gatekeeper` |
| `STALE_INDEX` | zmiany od ostatniego builda | `bun run opl index build` |
| Subagenci idą sekwencyjnie | zachowanie danej wersji VS Code | działa poprawnie, tylko wolniej. Odnotuj w ADR-OPL-000. |

---

# Część B: tryb auto (Copilot CLI + skrypty), demonstracja

> Cel: pokazać, że **ta sama specyfikacja workflow** i **ci sami agenci** mogą działać bez człowieka, a etapy prowadzi deterministycznie skrypt, nie LLM. Wdrożenie produkcyjne dopiero w F5. Flagi Copilot CLI są do potwierdzenia w F0.

## B1. Idea: skrypt jest orchestratorem

```
           .github/opl/workflows/opl-pr-review.yml   (ta sama spec co w trybie interaktywnym)
                              │
                    bun run opl run drive
                              │  dla każdego etapu:
     ┌────────────────────────┼─────────────────────────────┐
     │ etap skryptowy         │ etap agentowy               │ etap HITL
     │ (opl gate, graph …)    │ copilot -p … --agent <w>    │ L2: stop "awaiting-approval"
     │ uruchom bezpośrednio   │ (równolegle: N procesów)    │     albo pomiń, jeśli spec pozwala
     └───────────┬────────────┴──────────────┬──────────────┘
                 ▼                           ▼
        artefakt + schemat  ──►  opl run advance  ──►  następny etap / pętla / eskalacja
```

Różnica względem trybu interaktywnego: **LLM nie decyduje o kolejności etapów**. Każdy worker dostaje jedno zadanie w świeżym procesie (pełna izolacja kontekstu), a skrypt waliduje wynik i prowadzi maszynę stanów.

## B2. Wywołanie workera przez Copilot CLI

```bash
copilot -p "$(cat .opl/runs/$RUN/prompts/G7-find-logic-billing.md)" \
  --agent opl-review-logic \
  --no-ask-user -s \
  --allow-tool 'shell(bun run opl:*)' \
  --deny-tool 'shell(git push:*)' --deny-tool 'write' \
  --share=.opl/runs/$RUN/transcripts/G7-find-logic-billing.md
```

- `--agent`: ten sam plik `.github/agents/opl-review-logic.agent.md` co w VS Code.
- `--no-ask-user`: brak pytań. Jeśli worker potrzebuje decyzji, zwraca `status: blocked`.
- `--allow-tool` / `--deny-tool`: najmniejsze uprawnienia na poziomie procesu, niezależnie od hooków.
- `--share`: transkrypt do audytu.

## B3. Szkic `opl run drive`

```ts
// tools/opl/run/drive.ts (szkic demonstracyjny)
import { loadSpec, loadState, advance, renderPrompt } from "./state";
import { validateArtifacts } from "../core/schemas";

const LIMIT = 4;                                       // równoległe procesy copilot

async function runAgent(run: string, stage: string, agent: string, task: string) {
  const prompt = await renderPrompt(run, stage, agent, task);   // cel + ścieżki + schemat + limit podsumowania
  const proc = Bun.spawn([
    "copilot", "-p", prompt, "--agent", agent, "--no-ask-user", "-s",
    "--allow-tool", "shell(bun run opl:*)", "--deny-tool", "shell(git push:*)",
    `--share=.opl/runs/${run}/transcripts/${stage}-${agent}-${task}.md`,
  ], { stdout: "pipe", stderr: "pipe", timeout: 15 * 60_000 });
  return { agent, task, code: await proc.exited };
}

async function pool<T>(jobs: (() => Promise<T>)[], limit = LIMIT) {
  const out: T[] = []; let i = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (i < jobs.length) out.push(await jobs[i++]());
  }));
  return out;
}

export async function drive(run: string) {
  const spec = await loadSpec(run);
  for (let state = await loadState(run); !state.terminal; state = await loadState(run)) {
    const stage = spec.stage(state.stage);

    if (stage.hitl?.required && !stage.hitl.skip_if_autonomy?.includes(state.autonomy)) {
      await advance(run, stage.id, { result: "awaiting-approval" });   // auto nie podejmuje decyzji ludzi
      return;                                                           // człowiek: /opl-resume w VS Code
    }
    if (stage.script) {
      const r = await Bun.$`bun run opl ${{ raw: stage.script }}`.nothrow().quiet();
      await advance(run, stage.id, { result: r.exitCode === 0 ? "pass" : "fail" });
      continue;
    }
    const tasks = stage.expand(state);                 // np. lens × shard albo jeden worker
    const results = await pool(tasks.map((t) => () => runAgent(run, stage.id, t.agent, t.id)));
    const valid = await validateArtifacts(run, stage.produces);
    await advance(run, stage.id, {
      result: valid.ok && results.every((r) => r.code === 0) ? "pass" : "fail",
      details: valid.errors,
    });                                                // advance pilnuje pętli, limitów i eskalacji
  }
}
```

Zasady trybu auto:
1. **Decyzje ludzi nie są automatyzowane.** Etapy HITL kończą drive statusem `awaiting-approval`. Człowiek dokańcza w VS Code przez `/opl-resume`, bo stan jest wspólny.
2. **Osobny worktree** (`git worktree add .opl/wt/<run>`), więc auto nie dotyka Twojego working tree.
3. **Budżet:** limit czasu na proces, limit procesów, limit pętli ze spec, a opcjonalnie limit kosztu (`--max-runs`).
4. **Twarde zakazy na poziomie procesu** (`--deny-tool`) plus hooki plus `run advance`, czyli trzy warstwy.

## B4. Demo w 3 scenariuszach

```bash
# 1) Auto-review lokalnego brancha (L2: tylko raport, bez komentarzy na GitHubie)
bun run opl run init --workflow opl-pr-review --input "local:HEAD" --autonomy L2
bun run opl run drive --run latest
cat .opl/runs/latest/verdict.json          # albo raport: .opl/runs/latest/review.md

# 2) Self-review z pętlą naprawczą w osobnym worktree (W5, L1, max 3 rundy)
bun run opl run init --workflow opl-self-review --input "local:HEAD" --autonomy L1 --worktree
bun run opl run drive --run latest
#   → kończy się APPROVED albo eskalacją; push NIE następuje

# 3) Feature do bramki planu, dalej interaktywnie
bun run opl run init --workflow opl-feature --input "AB#12345" --autonomy L0
bun run opl run drive --run latest        # G0–G4 automatycznie, stop na G4b (awaiting-approval)
#   VS Code: /opl-resume → przegląd planu → 1. Zatwierdź → dalej interaktywnie
```

Scenariusz 3 pokazuje **tryb hybrydowy**: auto robi żmudny kontekst i plan, a człowiek wchodzi w bramce i kończy interaktywnie. To naturalny pierwszy krok od trybu interaktywnego w stronę automatyzacji.

## B5. Interaktywny czy auto?

| | Interaktywny (VS Code) | Auto (CLI + `opl run drive`) |
|--|------------------------|------------------------------|
| Kto prowadzi etapy | koordynator LLM pilnowany przez `run advance` i hooki | skrypt (deterministycznie) |
| Izolacja kontekstu | subagenci w jednej sesji | osobny proces na zadanie |
| Równoległość | subagenci (zależnie od wersji VS Code) | pula procesów (`LIMIT`) |
| Decyzje HITL | w czacie, numerowane opcje | stop `awaiting-approval` → `/opl-resume` |
| Audyt | `log.md` + `state.json` | to samo + transkrypty `--share` |
| Najlepsze do | codzienna praca, nowe obszary | review w tle, self-review, przygotowanie planu, CI (F5) |

## B6. Droga od demo do produkcji (F5)

1. F0: potwierdzenie flag CLI i nagranie zachowania `--agent` z hookami.
2. Demo lokalnie (scenariusze 1–3) na pilotażowej domenie, porównanie wyników z trybem interaktywnym.
3. Evale (W12) uruchamiane tym samym `opl run drive`, czyli eval harness dostaje się prawie za darmo.
4. Dopiero potem GitHub Actions: `opl run drive` z L2 na PR-ach pilota.
