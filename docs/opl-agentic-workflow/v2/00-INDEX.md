# OPL Agentic Workflow v2: plan rozszerzony

> Status: **Proposed** · 2026-10-24 · Rozszerza [PLAN.md (v1)](../PLAN.md) · Prefiks: **`opl-`**
> Docelowe repo: monorepo produktu Orange, które ma już **wstępne ADR** i **minimalistyczny workflow z orchestratorami** do doszlifowania. Stack narzędzi: **Bun** (runtime, test runner, shell), **ast-grep**, **Biome**, **tsc**.

## Jak czytać

| Plik | Odpowiada na pytanie |
|------|----------------------|
| [01-ZASADY.md](01-ZASADY.md) | Jakie zasady obowiązują każdy element workflow (instrukcje, reguły, ADR, agenci, skille, hooki, skrypty, pamięć, bramki, evale) i co każdy z nich **musi zawierać** |
| [02-WORKFLOWY.md](02-WORKFLOWY.md) | Z czego składa się poprawny workflow (anatomia), jak go zapisać jako maszynę stanów, katalog 12 workflowów `opl-*`, audyt istniejących orchestratorów |
| [03-MAPA-PAMIECI.md](03-MAPA-PAMIECI.md) | Czym jest mapa pamięci, **jak ją zbudować krok po kroku**, budżety kontekstu, macierz agent × pamięć, cykl życia wiedzy |
| [04-SKRYPTY.md](04-SKRYPTY.md) | **Jakie skrypty dodać, po co**, na czym je oprzeć (ast-grep / Biome / tsc / Bun), kontrakt wyjścia, szkice kodu |
| [05-FAZY.md](05-FAZY.md) | Kolejne fazy wdrożenia F0–F6: zadania, produkty, kryteria wyjścia, ryzyka |
| [06-SZABLONY.md](06-SZABLONY.md) | Gotowe szablony: agent, skill, instrukcja, reguła, ADR, wzorzec, karta modułu, spec workflow, schematy JSON, hooki, prompt |
| [07-URUCHAMIANIE.md](07-URUCHAMIANIE.md) | Jak uruchamiać workflow: **tryb interaktywny w VS Code (docelowy teraz)** oraz demo trybu auto (Copilot CLI + `opl run drive`) |

## Teza w jednym akapicie

Workflow enterprise to **maszyna stanów z artefaktami i bramkami**, a nie lista skilli wołanych przez orchestrator. Każdy etap ma właściciela (agenta), kontrakt wejścia/wyjścia (schemat JSON), bramkę (deterministyczną, potem LLM, potem człowieka) i limit pętli. **LLM decyduje, skrypty mierzą, hooki pilnują, ludzie zatwierdzają.** Wiedza żyje w jednym miejscu (canon w repo) i jest ładowana just-in-time według mapy pamięci. Jakość agentów jest mierzona evalami jak jakość kodu testami.

## Najważniejsze decyzje

1. **Nie przepisujemy istniejącego workflow od zera.** F0 robi jego audyt względem anatomii z [02](02-WORKFLOWY.md#4-audyt-istniejących-orchestratorów). Zostawiamy to, co działa, i dokładamy brakujące warstwy: stan, schematy, skrypty, hooki, evale.
2. **Jeden CLI `opl`** (`bun tools/opl/cli.ts …`) jako jedyne wejście agentów i hooków do faktów. Oparty na narzędziach, które już macie: **tsc** (typy, API, rozwiązywanie modułów), **ast-grep** (wzorce, reguły strukturalne), **Biome** (lint/format, granice importów, cykle), **Bun** (testy, coverage, shell).
3. **Istniejące ADR stają się źródłem reguł z ID** (`OPL-<AREA>-NNN`). Każda reguła ma poziom egzekucji: E1 deterministycznie przez ast-grep/Biome, E2 przez review LLM, E3 doradczo.
4. **Mapa pamięci jest plikiem w repo** (`docs/opl/memory-map.yml`), sprawdzanym w CI. Nowy nośnik wiedzy spoza mapy = czerwony build.
5. **Workflowy są deklarowane** w `.github/opl/workflows/*.yml` jako maszyny stanów. `opl run advance` nie pozwala przeskoczyć bramki, a hook `Stop` nie pozwala skończyć bez artefaktu bramki.

## Założenia (do potwierdzenia w F0)

- Monorepo w **Bun workspaces** (`package.json#workspaces`), TypeScript z `tsconfig` per pakiet (ewentualnie project references).
- Copilot w VS Code (agent mode) jako główna powierzchnia, Copilot CLI w CI, opcjonalnie Copilot coding agent.
- Hooki i pamięć Copilota są w preview. Kształt I/O hooków jest weryfikowany w F0, a do tego czasu `opl guard` ma adapter tolerujący oba znane formaty.
- Dostęp do co najmniej dwóch rodzin modeli w licencji Orange (finder ≠ verifier).

## Otwarte pytania do Ciebie

1. Jak zorganizowane są dziś orchestratory: jeden globalny czy per obszar? Gdzie leżą (`.github/agents`, `.github/prompts`, inaczej)?
2. W jakim formacie są wstępne ADR (MADR, Nygard, własny) i ile ich jest?
3. Czy ast-grep ma już `sgconfig.yml` z regułami, czy jest używany ad hoc?
4. Czy jest backend poza TS (Java/Kotlin/.NET)? Jeśli tak, `opl graph` potrzebuje drugiego adaptera.
5. Czy polityka Orange pozwala włączyć hooki (preview) i MCP w VS Code?
