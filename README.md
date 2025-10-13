# @aikotools/placeholder

A powerful placeholder template engine with generate and compare modes for E2E testing scenarios.

[![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=flat&logo=github&logoColor=white)](https://github.com/aikotools/placeholder)
[![npm version](https://badge.fury.io/js/@aikotools%2Fplaceholder.svg)](https://www.npmjs.com/package/@aikotools/placeholder)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [Plugins](#plugins)
- [Transforms](#transforms)
- [API Reference](#api-reference)
- [Examples](#examples)

---
Bei End-to-End-Tests müssen häufig dynamische Testdaten erzeugt und verglichen werden. Typische Herausforderungen sind:

- **Zeitabhängige Daten**: Timestamps, die relativ zu einem Teststart berechnet werden

- **Generierte IDs**: UUIDs, Zugnummern, die konsistent bleiben müssen

- **Type-Preservation**: JSON-Werte müssen die korrekten Typen behalten (Zahlen, nicht Strings)

- **Verschachtelte Platzhalter**: `{{compare:startsWith:{{time:calc:0:dd.MM.yyyy}}}}`

- **Multi-Phase-Processing**: Erst generieren, dann vergleichen

| Feature                 | Beschreibung                                                                |
|-------------------------|-----------------------------------------------------------------------------|
| **Unified Syntax**      | Einheitliche `{{…​}}` Syntax für alle Platzhalter                            |
| **Type Preservation**   | Automatische Typ-Erhaltung in JSON (numbers bleiben numbers, nicht strings) |
| **Nested Placeholders** | Beliebig verschachtelte Platzhalter: `{{outer:{{inner:value}}}}`            |
| **Plugin System**       | Erweiterbar durch eigene Plugins (Time, Generator, Custom)                  |
| **Transform Pipeline**  | Werte transformieren: `{{gen:string:42|toNumber}}`                          |
| **Multi-Mode**          | Generate-Mode (Werte erzeugen) und Compare-Mode (Matcher erzeugen)          |
| **AST-Based JSON**      | Intelligente JSON-Verarbeitung mit Type-Preservation                        |
| **Multi-Phase**         | Selektive Plugin-Ausführung (Gen → Time → Compare)                          |
``` highlight
┌─────────────────────────────────────────────────────┐
│              PlaceholderEngine                      │
│  (Orchestriert den gesamten Verarbeitungsprozess)  │
└─────────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  ┌─────────┐    ┌──────────┐   ┌──────────┐
  │  JSON   │    │   Text   │   │  Custom  │
  │Processor│    │Processor │   │Processor │
  └─────────┘    └──────────┘   └──────────┘
        │              │              │
        └──────────────┼──────────────┘
                       ▼
        ┌────────────────────────────────┐
        │     PlaceholderParser          │
        │  (Parst {{module:action:args}})│
        └────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  ┌──────────┐  ┌───────────┐  ┌──────────┐
  │   Time   │  │ Generator │  │  Custom  │
  │  Plugin  │  │  Plugin   │  │  Plugin  │
  └──────────┘  └───────────┘  └──────────┘
        │              │              │
        └──────────────┼──────────────┘
                       ▼
        ┌────────────────────────────────┐
        │        Transforms              │
        │  (toNumber, toString, etc.)    │
        └────────────────────────────────┘
```

Erzeuge konsistente Testdaten mit vorhersagbaren Werten:
``` highlight
{
  "testId": "{{gen:uuid:test-12345}}",
  "zugnummer": "{{gen:zugnummer:4837}}",
  "timestamp": "{{time:calc:0:seconds}}"
}
```
Ergebnis:
``` highlight
{
  "testId": "test-12345",
  "zugnummer": 4837,
  "timestamp": 1710508545
}
```

Berechne Timestamps relativ zum Teststart:
``` highlight
{
  "startTime": "{{time:calc:0:seconds}}",
  "endTime": "{{time:calc:300:seconds}}",
  "date": "{{time:calc:0:dd.MM.yyyy}}"
}
```

Kombiniere multiple Platzhalter in Strings:
``` highlight
{
  "filename": "{{gen:zugnummer:4837}}_RGE_{{time:calc:0:dd.MM.yyyy}}_Start"
}
```
Ergebnis: `"4837_RGE_15.03.2025_Start"`

- **TypeScript**: Typ-sichere Entwicklung

- **Luxon**: Robuste DateTime-Operationen mit Timezone-Support

- **Vite**: Schneller Build und Development Server

- **Vitest**: Modernes Testing Framework

``` highlight
npm install @aikotools/placeholder
```
oder mit Yarn:
``` highlight
yarn add @aikotools/placeholder
```
``` highlight
import { PlaceholderEngine, TimePlugin, GeneratorPlugin } from '@aikotools/placeholder';

const engine = new PlaceholderEngine();

// Plugins registrieren
engine.registerPlugin(new TimePlugin());
engine.registerPlugin(new GeneratorPlugin());

// Standard-Transforms sind bereits registriert
// (toNumber, toString, toBoolean)
```
``` highlight
const template = JSON.stringify({
  id: '{{gen:uuid:test-123}}',
  zugnummer: '{{gen:zugnummer:4837}}',
  timestamp: '{{time:calc:300:seconds}}',
  date: '{{time:calc:0:dd.MM.yyyy}}'
});

const result = await engine.processGenerate(template, {
  format: 'json',
  mode: 'generate',
  context: {
    startTimeTest: Date.now()
  }
});

const data = JSON.parse(result);
console.log(data);
// {
//   id: "test-123",
//   zugnummer: 4837,           // Number!
//   timestamp: 1710508545,      // Number!
//   date: "15.03.2025"         // String
// }
```
``` highlight
const text = 'Train {{gen:zugnummer:4837}} departs at {{time:calc:0:HH:mm}}';

const result = await engine.processGenerate(text, {
  format: 'text',
  mode: 'generate',
  context: {
    startTimeTest: Date.now()
  }
});

console.log(result);
// "Train 4837 departs at 12:00"
```
Alle Platzhalter folgen dem Schema:
``` highlight
{{module:action:arg1:arg2:...|transform}}
```
- **module**: Name des Plugins (z.B. `gen`, `time`)

- **action**: Aktion des Plugins (z.B. `uuid`, `calc`)

- **args**: Argumente, getrennt durch `:`

- **transform**: Optional, Transformation (z.B. `toNumber`)

Beispiele:
``` highlight
{{gen:uuid:abc123}}
{{gen:zugnummer:4837}}
{{time:calc:300:seconds}}
{{time:calc:0:dd.MM.yyyy}}
{{gen:string:42|toNumber}}
```

Der Context enthält Laufzeit-Informationen:
``` highlight
const context = {
  // Basis-Zeit für time:calc (bevorzugt)
  startTimeTest: Date.now(),

  // Alternative Basis-Zeit
  startTimeScript: Date.now(),

  // Custom-Felder
  testcaseId: 'TC-001',
  environment: 'test'
};
```
``` highlight
interface ProcessOptions {
  // Format des Templates
  format: 'json' | 'text';

  // Modus (generate oder compare)
  mode: 'generate' | 'compare';

  // Kontext für die Verarbeitung
  context?: Record<string, any>;

  // Nur bestimmte Plugins verwenden
  includePlugins?: string[];

  // Bestimmte Plugins ausschließen
  excludePlugins?: string[];
}
```

``` highlight
my-e2e-tests/
├── src/
│   ├── templates/
│   │   ├── train-expected.json
│   │   └── train-actual.json
│   └── tests/
│       └── train.test.ts
├── package.json
└── tsconfig.json
```
templates/train-expected.json

``` highlight
{
  "testId": "{{gen:uuid:test-train-001}}",
  "train": {
    "number": "{{gen:zugnummer:4837}}",
    "type": "RGE"
  },
  "timing": {
    "startTime": "{{time:calc:0:seconds}}",
    "endTime": "{{time:calc:300:seconds}}",
    "date": "{{time:calc:0:dd.MM.yyyy}}"
  }
}
```
tests/train.test.ts

``` highlight
import { describe, it, expect } from 'vitest';
import { PlaceholderEngine, TimePlugin, GeneratorPlugin } from '@aikotools/placeholder';
import * as fs from 'fs/promises';

describe('Train E2E Test', () => {
  let engine: PlaceholderEngine;

  beforeEach(() => {
    engine = new PlaceholderEngine();
    engine.registerPlugin(new TimePlugin());
    engine.registerPlugin(new GeneratorPlugin());
  });

  it('should generate expected train data', async () => {
    const template = await fs.readFile('templates/train-expected.json', 'utf-8');

    const result = await engine.processGenerate(template, {
      format: 'json',
      mode: 'generate',
      context: {
        startTimeTest: new Date('2025-03-15T12:00:00Z').getTime()
      }
    });

    const data = JSON.parse(result);

    expect(data.testId).toBe('test-train-001');
    expect(data.train.number).toBe(4837);
    expect(typeof data.train.number).toBe('number');
    expect(data.timing.date).toBe('15.03.2025');
  });
});
```
- Lesen Sie die [Kernkonzepte](core-concepts.adoc), um das System besser zu verstehen

- Erkunden Sie die verfügbaren [Plugins](plugins.adoc)

- Lernen Sie [Transforms](transforms.adoc) kennen

- Schauen Sie sich weitere [Beispiele](examples.adoc) an
Eines der wichtigsten Features ist die automatische Typ-Erhaltung in JSON.

Bei herkömmlichen Template-Systemen werden alle Werte zu Strings:
``` highlight
// Template
{
  "zugnummer": "{{gen:zugnummer:4837}}"
}

// Falsches Ergebnis (alle Strings!)
{
  "zugnummer": "4837"  // ❌ String statt Number
}
```

@aikotools/placeholder nutzt AST-basierte JSON-Verarbeitung:
``` highlight
// Template
{
  "zugnummer": "{{gen:zugnummer:4837}}"
}

// Korrektes Ergebnis
{
  "zugnummer": 4837  // ✅ Number
}
```
| Template                       | Ergebnis       | Typ                    |
|--------------------------------|----------------|------------------------|
| `"{{gen:number:42}}"`          | `42`           | number                 |
| `"{{gen:string:hello}}"`       | `"hello"`      | string                 |
| `"{{gen:boolean:true}}"`       | `true`         | boolean                |
| `"{{time:calc:0:seconds}}"`    | `1710508545`   | number                 |
| `"{{time:calc:0:dd.MM.yyyy}}"` | `"15.03.2025"` | string                 |
| `"Value: {{gen:number:42}}"`   | `"Value: 42"`  | string (Interpolation) |
| `"{{gen:string:42|toNumber}}"` | `42`           | number (Transform)     |
**Wichtig**: Wenn ein Platzhalter **alleine** in einem String steht, wird der Typ des Plugin-Ergebnisses übernommen. Bei String-Interpolation (mehrere Werte im String) bleibt das Ergebnis immer ein String.

Platzhalter können ineinander verschachtelt werden:
``` highlight
{{outer:{{inner:value}}}}
```
Das System löst verschachtelte Platzhalter von innen nach außen auf:
``` highlight
// Template
"{{time:format:{{gen:number:1710508545}}:dd.MM.yyyy}}"

// Schritt 1: Innerster Platzhalter
"{{time:format:1710508545:dd.MM.yyyy}}"

// Schritt 2: Äußerer Platzhalter
"15.03.2024"
```
``` highlight
{
  "filename": "train_{{gen:zugnummer:4837}}_{{time:calc:0:yyyy-MM-dd}}.json"
}
```
Ergebnis:
``` highlight
{
  "filename": "train_4837_2025-03-15.json"
}
```
Verarbeite Templates in mehreren Phasen mit selektiver Plugin-Ausführung.

In E2E-Tests gibt es oft verschiedene Phasen:

1.  **Gen-Phase**: Generiere Testdaten (UUIDs, IDs)

2.  **Time-Phase**: Berechne Zeitwerte

3.  **Compare-Phase**: Erstelle Matcher für Vergleiche

``` highlight
const template = JSON.stringify({
  id: '{{gen:uuid:test-123}}',
  timestamp: '{{time:calc:0:seconds}}',
  data: 'static'
});

// Phase 1: Nur Gen-Plugins
const afterGen = await engine.processGenerate(template, {
  format: 'json',
  mode: 'generate',
  includePlugins: ['gen']
});
// Result: { id: "test-123", timestamp: "{{time:calc:0:seconds}}", data: "static" }

// Phase 2: Nur Time-Plugins
const afterTime = await engine.processGenerate(afterGen, {
  format: 'json',
  mode: 'generate',
  includePlugins: ['time'],
  context: { startTimeTest: Date.now() }
});
// Result: { id: "test-123", timestamp: 1710508545, data: "static" }
```
``` highlight
// Nur bestimmte Plugins verwenden
{
  includePlugins: ['gen', 'time']
}

// Alle außer bestimmte Plugins verwenden
{
  excludePlugins: ['compare']
}
```
Das System unterstützt zwei Modi:

Erzeugt konkrete Werte:
``` highlight
await engine.processGenerate(template, {
  mode: 'generate',
  // ...
});

// Ergebnis: Konkrete Werte
{ zugnummer: 4837, timestamp: 1710508545 }
```

Erzeugt Matcher für Vergleiche (in späteren Phasen):
``` highlight
await engine.processCompare(actual, expected, {
  mode: 'compare',
  // ...
});

// Ergebnis: MatchResult mit success/errors
```
<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<tbody>
<tr class="odd">
Note
<td class="content">Compare-Mode ist aktuell in Entwicklung (Phase 6-8 des Projekts).</td>
</tr>
</tbody>
</table>

Der Context ist zentral für zeitabhängige Tests.
``` highlight
interface ProcessContext {
  // Primäre Basis-Zeit (wird bevorzugt)
  startTimeTest?: number | string;

  // Alternative Basis-Zeit
  startTimeScript?: number | string;

  // Custom-Felder für eigene Plugins
  [key: string]: any;
}
```

TimePlugin nutzt Zeitwerte in dieser Reihenfolge:

1.  `context.startTimeTest` (höchste Priorität)

2.  `context.startTimeScript`

3.  Aktuelle Zeit (`DateTime.utc()`)
``` highlight
const result = await engine.processGenerate(template, {
  format: 'json',
  mode: 'generate',
  context: {
    startTimeTest: new Date('2025-03-15T12:00:00Z').getTime()
  }
});
```

Context-Zeitwerte können verschiedene Formate haben:
``` highlight
// Unix Timestamp (Millisekunden)
{ startTimeTest: 1710504000000 }

// Unix Timestamp (Sekunden, < 10 Milliarden)
{ startTimeTest: 1710504000 }

// ISO String
{ startTimeTest: '2025-03-15T12:00:00Z' }

// Timestamp als String
{ startTimeTest: '1710504000000' }
```
Das System nutzt einen AST (Abstract Syntax Tree) für JSON.
``` highlight
1. JSON parsen → AST
2. AST traversieren (rekursiv)
3. Bei jedem Node:
   - Ist es ein String?
   - Enthält er Platzhalter?
   - Ist es ein "Pure Placeholder" oder "String Interpolation"?
4. Platzhalter ersetzen
5. Typ anpassen wenn nötig
6. AST → JSON
```

Der gesamte String ist ein einzelner Platzhalter:
``` highlight
{
  "value": "{{gen:number:42}}"
}
```
→ Node-Typ wird geändert zu Number:
``` highlight
{
  "value": 42
}
```

Der String enthält Text + Platzhalter:
``` highlight
{
  "value": "Count: {{gen:number:42}}"
}
```
→ Bleibt ein String:
``` highlight
{
  "value": "Count: 42"
}
```
Transformiere Werte nach der Placeholder-Auflösung.
``` highlight
{{module:action:args|transform}}
```
| Transform   | Beschreibung          | Beispiel                                 |
|-------------|-----------------------|------------------------------------------|
| `toNumber`  | Wandelt in Number um  | `{{gen:string:42|toNumber}}` → `42`      |
| `toString`  | Wandelt in String um  | `{{gen:number:42|toString}}` → `"42"`    |
| `toBoolean` | Wandelt in Boolean um | `{{gen:string:true|toBoolean}}` → `true` |
``` highlight
// String zu Number
{
  "count": "{{gen:string:42|toNumber}}"
}
// Result: { count: 42 }

// Number zu String
{
  "id": "{{gen:number:12345|toString}}"
}
// Result: { id: "12345" }

// String zu Boolean
{
  "active": "{{gen:string:true|toBoolean}}"
}
// Result: { active: true }
```

Sie können eigene Transforms registrieren:
``` highlight
import { Transform } from '@aikotools/placeholder';

class ToUpperTransform implements Transform {
  readonly name = 'toUpper';

  transform(value: any): any {
    return String(value).toUpperCase();
  }
}

engine.registerTransforms([new ToUpperTransform()]);

// Verwendung
"{{gen:string:hello|toUpper}}" → "HELLO"
```
Plugins erweitern das System um spezifische Funktionalität. Jedes Plugin hat einen Namen (module) und bietet verschiedene Actions.
Das TimePlugin bietet Funktionen für Zeit-Berechnungen und -Formatierung.

`time`
Berechnet einen Zeitpunkt relativ zu einer Basis-Zeit.

**Syntax:**
``` highlight
{{time:calc:offset:unit|format}}
```
**Parameter:**

- `offset`: Zeitverschiebung (z.B. `300`, `-60`, `0`)

- `unit|format`: Entweder Zeiteinheit ODER Datums-Format

**Zeiteinheiten:**

- `milliseconds`

- `seconds`

- `minutes`

- `hours`

- `days`

- `weeks`

- `months`

- `years`

**Beispiele mit Zeiteinheiten:**
``` highlight
{{time:calc:300:seconds}}        → 1710508845 (Unix timestamp in seconds)
{{time:calc:-60:seconds}}         → 1710508485 (60 Sekunden vor Basis-Zeit)
{{time:calc:5:minutes}}           → 1710508845000 (Unix timestamp in milliseconds)
{{time:calc:2:hours}}             → 1710515745000
{{time:calc:7:days}}              → 1711113145000
```
**Beispiele mit Datum-Formatierung:**
``` highlight
{{time:calc:0:dd.MM.yyyy}}        → "15.03.2025"
{{time:calc:3600:dd.MM.yyyy HH}}  → "15.03.2025 13" (1 Stunde später)
{{time:calc:-86400:yyyy-MM-dd}}   → "2025-03-14" (1 Tag früher)
{{time:calc:0:HH}}                → "12"
```
**Datums-Formate:**

Das Plugin nutzt Luxon’s `toFormat()`. Häufige Format-Tokens:
| Token  | Beschreibung            | Beispiel |
|--------|-------------------------|----------|
| `yyyy` | 4-stelliges Jahr        | 2025     |
| `yy`   | 2-stelliges Jahr        | 25       |
| `MM`   | Monat (2-stellig)       | 03       |
| `M`    | Monat                   | 3        |
| `dd`   | Tag (2-stellig)         | 15       |
| `d`    | Tag                     | 15       |
| `HH`   | Stunde (24h, 2-stellig) | 14       |
| `H`    | Stunde (24h)            | 14       |
| `mm`   | Minute (2-stellig)      | 30       |
| `m`    | Minute                  | 30       |
| `ss`   | Sekunde (2-stellig)     | 45       |
| `s`    | Sekunde                 | 45       |
**Wichtig**: Format-Strings mit `:` funktionieren nicht, da `:` als Argument-Trenner genutzt wird. Nutzen Sie Leerzeichen statt `:`:
``` highlight
// ❌ Funktioniert NICHT
{{time:calc:0:HH:mm:ss}}

// ✅ Funktioniert
{{time:calc:0:HH mm ss}}
```

Formatiert einen Unix-Timestamp.

**Syntax:**
``` highlight
{{time:format:timestamp:format}}
```
**Parameter:**

- `timestamp`: Unix-Timestamp (Sekunden \< 10 Mrd., sonst Millisekunden)

- `format`: Datums-Format-String

**Beispiele:**
``` highlight
{{time:format:1710508245:dd.MM.yyyy}}           → "15.03.2024"
{{time:format:1710508245000:dd.MM.yyyy HH}}     → "15.03.2024 13"
{{time:format:1710508245:yyyy-MM-dd}}           → "2024-03-15"
```
TimePlugin nutzt eine Basis-Zeit für `calc` aus dem Context (Priorität):

1.  `context.startTimeTest` (höchste)

2.  `context.startTimeScript`

3.  Aktuelle Zeit UTC

**Beispiel:**
``` highlight
const result = await engine.processGenerate(template, {
  format: 'json',
  mode: 'generate',
  context: {
    startTimeTest: new Date('2025-03-15T12:00:00Z').getTime()
  }
});
```

WICHTIG: Alle Zeit-Operationen erfolgen in UTC, um konsistente Ergebnisse in verschiedenen Umgebungen zu garantieren.

| Action + Params                  | Rückgabe-Typ               |
|----------------------------------|----------------------------|
| `calc` mit Zeiteinheit `seconds` | Number (Unix seconds)      |
| `calc` mit Zeiteinheit (andere)  | Number (Unix milliseconds) |
| `calc` mit Datums-Format         | String                     |
| `format`                         | String                     |
Das GeneratorPlugin erzeugt Testdaten - entweder mit vorgegebenen Werten (vorhersagbar) oder zufällig.

`gen`
Erzeugt oder nutzt eine UUID/ID.

**Syntax:**
``` highlight
{{gen:uuid}}              // Zufällige UUID
{{gen:uuid:my-id-123}}    // Feste ID
```
**Beispiele:**
``` highlight
{{gen:uuid}}                                    → "a3f2e1d4-..." (zufällig)
{{gen:uuid:test-123}}                          → "test-123"
{{gen:uuid:12345678-1234-1234-1234-123456789012}} → "12345678-1234-1234-1234-123456789012"
```
**Wichtig**: Das Plugin validiert NICHT das UUID-Format. Sie können beliebige Strings als IDs verwenden, was für Testdaten sehr praktisch ist.

**Rückgabe-Typ**: String
Erzeugt oder nutzt eine Zahl. `zugnummer` ist ein Alias für `number`.

**Syntax:**
``` highlight
{{gen:number}}            // Zufällige Zahl (0-9999)
{{gen:number:42}}         // Feste Zahl
{{gen:zugnummer:4837}}    // Alias für number
```
**Beispiele:**
``` highlight
{{gen:number}}          → 7342 (zufällig)
{{gen:number:42}}       → 42
{{gen:zugnummer:4837}}  → 4837
{{gen:number:-100}}     → -100
{{gen:number:3.14}}     → 3.14
```
**Rückgabe-Typ**: Number
Erzeugt oder nutzt einen String.

**Syntax:**
``` highlight
{{gen:string}}            // Zufälliger String (8 Zeichen)
{{gen:string:hello}}      // Fester String
```
**Beispiele:**
``` highlight
{{gen:string}}          → "aB3xY9pQ" (zufällig)
{{gen:string:hello}}    → "hello"
{{gen:string:test123}}  → "test123"
```
**Rückgabe-Typ**: String
Erzeugt oder nutzt einen Boolean.

**Syntax:**
``` highlight
{{gen:boolean}}           // Zufälliger Boolean
{{gen:boolean:true}}      // Fester Boolean
```
**Akzeptierte Werte für true:**

- `true`, `1`, `yes`

**Akzeptierte Werte für false:**

- `false`, `0`, `no`

**Beispiele:**
``` highlight
{{gen:boolean}}           → true (zufällig)
{{gen:boolean:true}}      → true
{{gen:boolean:false}}     → false
{{gen:boolean:1}}         → true
{{gen:boolean:0}}         → false
{{gen:boolean:yes}}       → true
```
**Rückgabe-Typ**: Boolean
Sie können eigene Plugins erstellen, indem Sie das `PlaceholderPlugin` Interface implementieren.
``` highlight
interface PlaceholderPlugin {
  // Name des Plugins (module)
  readonly name: string;

  // Hauptmethode: Placeholder auflösen
  resolve(request: PluginResolveRequest): PlaceholderResult;

  // Optional: Matcher für Compare-Mode erstellen
  createMatcher?(request: PluginMatcherRequest): Matcher;
}
```
``` highlight
import { PlaceholderPlugin, PluginResolveRequest, PlaceholderResult } from '@aikotools/placeholder';

export class MathPlugin implements PlaceholderPlugin {
  readonly name = 'math';

  resolve(request: PluginResolveRequest): PlaceholderResult {
    const { action, args } = request.placeholder;

    switch (action) {
      case 'add':
        return this.handleAdd(args);

      case 'multiply':
        return this.handleMultiply(args);

      default:
        throw new Error(`Math plugin: unknown action '${action}'`);
    }
  }

  private handleAdd(args: string[]): PlaceholderResult {
    if (args.length < 2) {
      throw new Error('Math add: requires 2 arguments');
    }

    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);

    if (isNaN(a) || isNaN(b)) {
      throw new Error('Math add: invalid numbers');
    }

    return {
      value: a + b,
      type: 'number'
    };
  }

  private handleMultiply(args: string[]): PlaceholderResult {
    if (args.length < 2) {
      throw new Error('Math multiply: requires 2 arguments');
    }

    const a = parseFloat(args[0]);
    const b = parseFloat(args[1]);

    if (isNaN(a) || isNaN(b)) {
      throw new Error('Math multiply: invalid numbers');
    }

    return {
      value: a * b,
      type: 'number'
    };
  }
}
```
``` highlight
import { PlaceholderEngine } from '@aikotools/placeholder';
import { MathPlugin } from './MathPlugin';

const engine = new PlaceholderEngine();
engine.registerPlugin(new MathPlugin());

// Verwendung
"{{math:add:5:3}}"       → 8
"{{math:multiply:4:7}}"  → 28
```

Jedes Plugin muss ein `PlaceholderResult` zurückgeben:
``` highlight
interface PlaceholderResult {
  // Der Wert
  value: any;

  // Der Typ (für Type Preservation)
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
}
```
**Wichtig**: Der `type` wird für Type Preservation in JSON genutzt.
Ihr Plugin kann auf den Context zugreifen:
``` highlight
resolve(request: PluginResolveRequest): PlaceholderResult {
  const { action, args } = request.placeholder;
  const { context } = request;

  // Context-Werte nutzen
  const env = context.environment || 'test';
  const baseUrl = context.baseUrl || 'http://localhost';

  // ...
}
```
Transforms ermöglichen es, Werte nach der Placeholder-Auflösung zu transformieren. Sie werden mit dem Pipe-Symbol `|` an Platzhalter angehängt.
Wandelt einen Wert in eine Zahl um.

**Syntax:**
``` highlight
{{...|toNumber}}
```
**Beispiele:**
``` highlight
{{gen:string:42|toNumber}}              → 42
{{gen:string:3.14|toNumber}}            → 3.14
{{gen:string:-100|toNumber}}            → -100
```
**JSON mit Type Preservation:**
``` highlight
{
  "count": "{{gen:string:42|toNumber}}"
}
```
Ergebnis:
``` highlight
{
  "count": 42
}
```
**Fehlerbehandlung:**

Wenn der Wert nicht in eine Zahl konvertiert werden kann, wird `NaN` zurückgegeben.
Wandelt einen Wert in einen String um.

**Syntax:**
``` highlight
{{...|toString}}
```
**Beispiele:**
``` highlight
{{gen:number:42|toString}}              → "42"
{{gen:boolean:true|toString}}           → "true"
```
**JSON mit Type Preservation:**
``` highlight
{
  "id": "{{gen:number:12345|toString}}"
}
```
Ergebnis:
``` highlight
{
  "id": "12345"
}
```

Wandelt einen Wert in einen Boolean um.

**Syntax:**
``` highlight
{{...|toBoolean}}
```
**True-Werte:**

- String: `"true"`, `"1"`, `"yes"` (case-insensitive)

- Number: `1`

- Boolean: `true`

**False-Werte:**

- String: `"false"`, `"0"`, `"no"` (case-insensitive)

- Number: `0`

- Boolean: `false`

**Alle anderen Werte:**

Werden als "truthy" (true) oder "falsy" (false) interpretiert nach JavaScript-Regeln.

**Beispiele:**
``` highlight
{{gen:string:true|toBoolean}}           → true
{{gen:string:false|toBoolean}}          → false
{{gen:string:yes|toBoolean}}            → true
{{gen:string:no|toBoolean}}             → false
{{gen:number:1|toBoolean}}              → true
{{gen:number:0|toBoolean}}              → false
{{gen:string:hello|toBoolean}}          → true (truthy)
```
**JSON mit Type Preservation:**
``` highlight
{
  "active": "{{gen:string:true|toBoolean}}"
}
```
Ergebnis:
``` highlight
{
  "active": true
}
```
Transforms werden in der Reihenfolge angewendet, in der sie angegeben sind:
``` highlight
{{gen:string:42|toNumber|toString}}
```
1.  Plugin-Auflösung: `"42"` (String)

2.  `toNumber`: `42` (Number)

3.  `toString`: `"42"` (String)
Sie können eigene Transforms erstellen, indem Sie das `Transform` Interface implementieren.
``` highlight
interface Transform {
  // Name des Transforms
  readonly name: string;

  // Transformations-Funktion
  transform(value: any): any;
}
```
``` highlight
import { Transform } from '@aikotools/placeholder';

export class ToUpperTransform implements Transform {
  readonly name = 'toUpper';

  transform(value: any): any {
    // Wandle Wert in String und dann in Uppercase
    return String(value).toUpperCase();
  }
}
```
``` highlight
import { Transform } from '@aikotools/placeholder';

export class RoundTransform implements Transform {
  readonly name = 'round';

  transform(value: any): any {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error(`Round transform: invalid number '${value}'`);
    }
    return Math.round(num);
  }
}
```
``` highlight
import { PlaceholderEngine } from '@aikotools/placeholder';
import { ToUpperTransform, RoundTransform } from './transforms';

const engine = new PlaceholderEngine();

// Einzeln registrieren
engine.registerTransforms([
  new ToUpperTransform(),
  new RoundTransform()
]);

// Verwendung
"{{gen:string:hello|toUpper}}"    → "HELLO"
"{{gen:number:3.7|round}}"         → 4
```
Aktuell unterstützen Transforms keine direkten Parameter. Wenn Sie parametrisierbare Transformationen benötigen, sollten Sie stattdessen ein Plugin erstellen.

**Beispiel:**

Anstatt `{{value|round:2}}` (funktioniert nicht), nutzen Sie:
``` highlight
// Ein Math-Plugin mit round-Action
{{math:round:3.14159:2}}  → 3.14
```

Nutzen Sie Transforms sparsam. Oft ist es besser, die Logik im Plugin zu haben:
``` highlight
// ❌ Nicht optimal
{{gen:string:42|toNumber}}

// ✅ Besser
{{gen:number:42}}
```

Transforms ändern den Typ des Ergebnisses:
``` highlight
// Original (ohne Transform): Number
{
  "count": "{{gen:number:42}}"
}

// Mit Transform: String
{
  "count": "{{gen:number:42|toString}}"
}
```

Ihre Transforms sollten robuste Fehlerbehandlung haben:
``` highlight
transform(value: any): any {
  if (value === null || value === undefined) {
    throw new Error('Transform: value is null or undefined');
  }

  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error(`Transform: invalid number '${value}'`);
  }

  return num;
}
```

Transforms sollten idempotent sein (mehrfache Anwendung = einmalige Anwendung):
``` highlight
// ✅ Idempotent
toUpper("hello")  → "HELLO"
toUpper("HELLO")  → "HELLO"

// ❌ Nicht idempotent (problematisch)
increment(5)  → 6
increment(6)  → 7
```
Bei Transform-Fehlern erhalten Sie detaillierte Fehlermeldungen:
``` highlight
Error: Transform 'toNumber' failed for value 'abc': invalid number
  at ToNumberTransform.transform (transforms/ToNumberTransform.ts:12)
  at PlaceholderEngine.applyTransforms (core/PlaceholderEngine.ts:145)
```
Sie können Transforms auch isoliert testen:
``` highlight
import { ToNumberTransform } from '@aikotools/placeholder';

const transform = new ToNumberTransform();

console.log(transform.transform('42'));    // 42
console.log(transform.transform('3.14'));  // 3.14
console.log(transform.transform('abc'));   // NaN
```

Die Haupt-Engine-Klasse, die alle Operationen orchestriert.
``` highlight
constructor()
```
Erstellt eine neue PlaceholderEngine-Instanz mit:

- Standard-Transforms (toNumber, toString, toBoolean)

- Leerer Plugin-Registry

**Beispiel:**
``` highlight
import { PlaceholderEngine } from '@aikotools/placeholder';

const engine = new PlaceholderEngine();
```

Registriert ein Plugin.
``` highlight
registerPlugin(plugin: PlaceholderPlugin): void
```
**Parameter:**

- `plugin`: Das zu registrierende Plugin

**Beispiel:**
``` highlight
import { TimePlugin, GeneratorPlugin } from '@aikotools/placeholder';

engine.registerPlugin(new TimePlugin());
engine.registerPlugin(new GeneratorPlugin());
```

Registriert mehrere Plugins auf einmal.
``` highlight
registerPlugins(plugins: PlaceholderPlugin[]): void
```
**Parameter:**

- `plugins`: Array von Plugins

**Beispiel:**
``` highlight
engine.registerPlugins([
  new TimePlugin(),
  new GeneratorPlugin(),
  new CustomPlugin()
]);
```

Registriert Transforms.
``` highlight
registerTransforms(transforms: Transform[]): void
```
**Parameter:**

- `transforms`: Array von Transforms

**Beispiel:**
``` highlight
import { ToUpperTransform } from './transforms';

engine.registerTransforms([
  new ToUpperTransform()
]);
```

Verarbeitet ein Template im Generate-Mode.
``` highlight
async processGenerate(
  input: string,
  options: ProcessOptions
): Promise<string>
```
**Parameter:**

- `input`: Template-String (JSON oder Text)

- `options`: Verarbeitungs-Optionen

**Rückgabe:**

- Promise mit verarbeitetem String

**Beispiel:**
``` highlight
const result = await engine.processGenerate(
  JSON.stringify({ id: '{{gen:uuid:test-123}}' }),
  {
    format: 'json',
    mode: 'generate',
    context: {
      startTimeTest: Date.now()
    }
  }
);

console.log(JSON.parse(result));
// { id: "test-123" }
```

Verarbeitet Templates im Compare-Mode (in Entwicklung).
``` highlight
async processCompare(
  actual: any,
  expected: any,
  options: CompareOptions
): Promise<CompareResult>
```
<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<tbody>
<tr class="odd">
Note
<td class="content">Diese Methode ist aktuell in Entwicklung (Phase 6-8).</td>
</tr>
</tbody>
</table>

Optionen für die Template-Verarbeitung.
``` highlight
interface ProcessOptions {
  // Format des Templates
  format: 'json' | 'text';

  // Verarbeitungs-Modus
  mode: 'generate' | 'compare';

  // Kontext mit Laufzeit-Daten
  context?: Record<string, any>;

  // Nur diese Plugins verwenden
  includePlugins?: string[];

  // Diese Plugins ausschließen
  excludePlugins?: string[];
}
```
Das Format des Template-Strings.

- `'json'`: JSON-Template mit AST-basierter Verarbeitung

- `'text'`: Einfacher Text-Template
Der Verarbeitungs-Modus.

- `'generate'`: Erzeugt konkrete Werte

- `'compare'`: Erzeugt Matcher (in Entwicklung)
Kontext-Objekt mit Laufzeit-Daten.

**Standard-Felder:**

- `startTimeTest`: Basis-Zeit für TimePlugin (bevorzugt)

- `startTimeScript`: Alternative Basis-Zeit

**Custom-Felder:**

Sie können beliebige Felder hinzufügen, die Ihre Plugins nutzen können.

**Beispiel:**
``` highlight
{
  context: {
    startTimeTest: Date.now(),
    environment: 'test',
    baseUrl: 'http://localhost:3000',
    testcaseId: 'TC-001'
  }
}
```

Array von Plugin-Namen, die verwendet werden sollen. Alle anderen werden ignoriert.

**Beispiel:**
``` highlight
{
  includePlugins: ['gen', 'time']
}
```

Array von Plugin-Namen, die ausgeschlossen werden sollen.

**Beispiel:**
``` highlight
{
  excludePlugins: ['compare']
}
```
Interface für Plugins.
``` highlight
interface PlaceholderPlugin {
  readonly name: string;
  resolve(request: PluginResolveRequest): PlaceholderResult;
  createMatcher?(request: PluginMatcherRequest): Matcher;
}
```
Der Name des Plugins (module-Name in Platzhaltern).

**Typ:** `string`
Löst einen Platzhalter auf und erzeugt einen Wert.
``` highlight
resolve(request: PluginResolveRequest): PlaceholderResult
```
**Parameter:**

- `request`: Request-Objekt mit Placeholder und Context

**Rückgabe:**

- `PlaceholderResult` mit value und type
Erzeugt einen Matcher für Compare-Mode (in Entwicklung).
``` highlight
createMatcher?(request: PluginMatcherRequest): Matcher
```
Request-Objekt für Plugin.resolve().
``` highlight
interface PluginResolveRequest {
  placeholder: ParsedPlaceholder;
  context: Record<string, any>;
  registry: PluginRegistry | null;
}
```
Das geparste Platzhalter-Objekt.
``` highlight
interface ParsedPlaceholder {
  module: string;        // Plugin-Name (z.B. "gen")
  action: string;        // Action-Name (z.B. "uuid")
  args: string[];        // Argumente
  transforms: string[];  // Transform-Namen
  raw: string;          // Original-String
}
```

Kontext-Objekt mit Laufzeit-Daten (siehe ProcessOptions.context).
Plugin-Registry (für fortgeschrittene Use Cases).

Rückgabe-Objekt von Plugin.resolve().
``` highlight
interface PlaceholderResult {
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
}
```
Der erzeugte Wert.

**Typ:** `any`
Der Typ des Werts (für Type Preservation).

**Typ:** `'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'`

**Wichtig:** Dieser Typ wird für Type Preservation in JSON genutzt.

Interface für Transforms.
``` highlight
interface Transform {
  readonly name: string;
  transform(value: any): any;
}
```
Der Name des Transforms.

**Typ:** `string`
Transformiert einen Wert.
``` highlight
transform(value: any): any
```
**Parameter:**

- `value`: Der zu transformierende Wert

**Rückgabe:**

- Der transformierte Wert

Parser für Platzhalter-Strings.
``` highlight
class PlaceholderParser {
  parse(input: string): ParsedPlaceholder
  findPlaceholders(input: string): string[]
}
```
Parst einen einzelnen Platzhalter.
``` highlight
parse(input: string): ParsedPlaceholder
```
**Parameter:**

- `input`: Platzhalter-String (z.B. `"{{gen:uuid:test}}"`)

**Rückgabe:**

- `ParsedPlaceholder`-Objekt

**Beispiel:**
``` highlight
import { PlaceholderParser } from '@aikotools/placeholder';

const parser = new PlaceholderParser();
const parsed = parser.parse('{{gen:uuid:test-123|toUpper}}');

console.log(parsed);
// {
//   module: 'gen',
//   action: 'uuid',
//   args: ['test-123'],
//   transforms: ['toUpper'],
//   raw: '{{gen:uuid:test-123|toUpper}}'
// }
```

Findet alle Platzhalter in einem String.
``` highlight
findPlaceholders(input: string): string[]
```
**Parameter:**

- `input`: String mit potentiellen Platzhaltern

**Rückgabe:**

- Array von Platzhalter-Strings

**Beispiel:**
``` highlight
const parser = new PlaceholderParser();
const placeholders = parser.findPlaceholders(
  'ID: {{gen:uuid:test}} at {{time:calc:0:HH:mm}}'
);

console.log(placeholders);
// ['{{gen:uuid:test}}', '{{time:calc:0:HH:mm}}']
```
Registry für Plugins (normalerweise nicht direkt verwendet).
``` highlight
class PluginRegistry {
  register(plugin: PlaceholderPlugin): void
  get(name: string): PlaceholderPlugin | undefined
  has(name: string): boolean
  getAll(): PlaceholderPlugin[]
}
```

Verarbeitet JSON-Templates mit Type Preservation.
``` highlight
class JsonProcessor {
  process(
    input: string,
    options: ProcessOptions,
    resolveFn: (placeholder: string) => Promise<any>
  ): Promise<string>
}
```
<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<tbody>
<tr class="odd">
Note
<td class="content">Wird normalerweise intern von PlaceholderEngine verwendet.</td>
</tr>
</tbody>
</table>
Verarbeitet Text-Templates.
``` highlight
class TextProcessor {
  process(
    input: string,
    options: ProcessOptions,
    resolveFn: (placeholder: string) => Promise<any>
  ): Promise<string>
}
```
<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<tbody>
<tr class="odd">
Note
<td class="content">Wird normalerweise intern von PlaceholderEngine verwendet.</td>
</tr>
</tbody>
</table>
``` highlight
// Haupt-Engine
export { PlaceholderEngine } from './core/PlaceholderEngine';

// Plugins
export { TimePlugin } from './plugins/TimePlugin';
export { GeneratorPlugin } from './plugins/GeneratorPlugin';

// Transforms
export {
  ToNumberTransform,
  ToStringTransform,
  ToBooleanTransform,
  createStandardTransforms
} from './transforms';

// Core
export { PlaceholderParser } from './core/PlaceholderParser';
export { PluginRegistry } from './core/PluginRegistry';

// Processors
export { JsonProcessor } from './formats/JsonProcessor';
export { TextProcessor } from './formats/TextProcessor';

// Types
export type {
  PlaceholderPlugin,
  Transform,
  Matcher,
  PlaceholderResult,
  ParsedPlaceholder,
  ProcessOptions,
  // ... weitere Types
} from './core/types';
```
``` highlight
const template = JSON.stringify({
  id: '{{gen:uuid:test-001}}',
  correlationId: '{{gen:uuid:corr-123}}'
});

const result = await engine.processGenerate(template, {
  format: 'json',
  mode: 'generate'
});

console.log(JSON.parse(result));
// {
//   id: "test-001",
//   correlationId: "corr-123"
// }
```
``` highlight
import { DateTime } from 'luxon';

const baseTime = DateTime.fromISO('2025-03-15T12:00:00Z');

const template = JSON.stringify({
  startTime: '{{time:calc:0:seconds}}',
  endTime: '{{time:calc:300:seconds}}',
  checkTime: '{{time:calc:150:seconds}}'
});

const result = await engine.processGenerate(template, {
  format: 'json',
  mode: 'generate',
  context: {
    startTimeTest: baseTime.toMillis()
  }
});

console.log(JSON.parse(result));
// {
//   startTime: 1710504000,
//   endTime: 1710504300,
//   checkTime: 1710504150
// }
```
``` highlight
const template = JSON.stringify({
  date: '{{time:calc:0:dd.MM.yyyy}}',
  time: '{{time:calc:0:HH}}',
  datetime: '{{time:calc:0:yyyy-MM-dd HH}}'
});

const result = await engine.processGenerate(template, {
  format: 'json',
  mode: 'generate',
  context: {
    startTimeTest: new Date('2025-03-15T14:30:00Z').getTime()
  }
});

console.log(JSON.parse(result));
// {
//   date: "15.03.2025",
//   time: "14",
//   datetime: "2025-03-15 14"
// }
```

``` highlight
import { PlaceholderEngine, TimePlugin, GeneratorPlugin } from '@aikotools/placeholder';
import { DateTime } from 'luxon';

// Setup
const engine = new PlaceholderEngine();
engine.registerPlugins([
  new TimePlugin(),
  new GeneratorPlugin()
]);

// Test-Basis-Zeit: 15.03.2025 12:00 UTC
const testStartTime = DateTime.fromISO('2025-03-15T12:00:00Z');

// Expected-Template für Zug-Abfahrt
const expected = JSON.stringify({
  testId: '{{gen:uuid:test-train-departure-001}}',
  train: {
    number: '{{gen:zugnummer:4837}}',
    type: 'RGE',
    operator: 'DB'
  },
  departure: {
    station: 'Berlin Hbf',
    platform: '7',
    scheduledTime: '{{time:calc:0:seconds}}',
    actualTime: '{{time:calc:120:seconds}}',  // 2 Min Verspätung
    date: '{{time:calc:0:dd.MM.yyyy}}'
  },
  destination: {
    station: 'Hamburg Hbf',
    arrivalTime: '{{time:calc:5400:seconds}}'  // 90 Min Fahrt
  },
  metadata: {
    created: '{{time:calc:0:yyyy-MM-dd HH}}',
    version: '{{gen:number:1}}'
  }
});

// Verarbeiten
const result = await engine.processGenerate(expected, {
  format: 'json',
  mode: 'generate',
  context: {
    startTimeTest: testStartTime.toMillis()
  }
});

const data = JSON.parse(result);

console.log(data);
// {
//   testId: "test-train-departure-001",
//   train: {
//     number: 4837,
//     type: "RGE",
//     operator: "DB"
//   },
//   departure: {
//     station: "Berlin Hbf",
//     platform: "7",
//     scheduledTime: 1710504000,
//     actualTime: 1710504120,
//     date: "15.03.2025"
//   },
//   destination: {
//     station: "Hamburg Hbf",
//     arrivalTime: 1710509400
//   },
//   metadata: {
//     created: "2025-03-15 12",
//     version: 1
//   }
// }

// Typ-Überprüfungen
console.assert(typeof data.train.number === 'number');
console.assert(typeof data.departure.scheduledTime === 'number');
console.assert(typeof data.metadata.version === 'number');
console.assert(typeof data.departure.date === 'string');
```
``` highlight
const template = JSON.stringify({
  filename: '{{gen:zugnummer:4837}}_RGE_{{time:calc:0:dd.MM.yyyy}}_{{gen:uuid:run123}}_Start'
});

const result = await engine.processGenerate(template, {
  format: 'json',
  mode: 'generate',
  context: {
    startTimeTest: new Date('2025-03-15T12:00:00Z').getTime()
  }
});

console.log(JSON.parse(result));
// {
//   filename: "4837_RGE_15.03.2025_run123_Start"
// }
```
``` highlight
const template = JSON.stringify({
  id: '{{gen:uuid:test-123}}',
  zugnummer: '{{gen:zugnummer:4837}}',
  timestamp: '{{time:calc:0:seconds}}',
  static: 'unchanged'
});

// Phase 1: Nur Gen-Plugins
const afterGen = await engine.processGenerate(template, {
  format: 'json',
  mode: 'generate',
  includePlugins: ['gen']
});

console.log('After Gen:', JSON.parse(afterGen));
// {
//   id: "test-123",
//   zugnummer: 4837,
//   timestamp: "{{time:calc:0:seconds}}",
//   static: "unchanged"
// }

// Phase 2: Nur Time-Plugins
const afterTime = await engine.processGenerate(afterGen, {
  format: 'json',
  mode: 'generate',
  includePlugins: ['time'],
  context: {
    startTimeTest: Date.now()
  }
});

console.log('After Time:', JSON.parse(afterTime));
// {
//   id: "test-123",
//   zugnummer: 4837,
//   timestamp: 1710504000,
//   static: "unchanged"
// }
```
``` highlight
const template = JSON.stringify({
  journey: {
    id: '{{gen:uuid:journey-001}}',
    train: {
      number: '{{gen:zugnummer:4837}}',
      type: 'RGE',
      sections: [
        {
          from: 'Berlin Hbf',
          to: 'Hamburg Hbf',
          departure: '{{time:calc:0:seconds}}',
          arrival: '{{time:calc:5400:seconds}}'
        },
        {
          from: 'Hamburg Hbf',
          to: 'Bremen Hbf',
          departure: '{{time:calc:5700:seconds}}',
          arrival: '{{time:calc:8100:seconds}}'
        }
      ]
    },
    passengers: {
      count: '{{gen:number:42}}',
      manifest: [
        { id: '{{gen:uuid:p1}}', seat: '{{gen:number:15}}' },
        { id: '{{gen:uuid:p2}}', seat: '{{gen:number:16}}' }
      ]
    }
  }
});

const result = await engine.processGenerate(template, {
  format: 'json',
  mode: 'generate',
  context: {
    startTimeTest: new Date('2025-03-15T12:00:00Z').getTime()
  }
});

const data = JSON.parse(result);
console.log(data);
// Vollständig verschachtelte Struktur mit Type Preservation
```
``` highlight
const template = JSON.stringify({
  timestamps: [
    '{{time:calc:0:seconds}}',
    '{{time:calc:60:seconds}}',
    '{{time:calc:120:seconds}}'
  ],
  ids: [
    '{{gen:number:1}}',
    '{{gen:number:2}}',
    '{{gen:number:3}}'
  ],
  status: [
    '{{gen:boolean:true}}',
    '{{gen:boolean:false}}',
    '{{gen:boolean:true}}'
  ]
});

const result = await engine.processGenerate(template, {
  format: 'json',
  mode: 'generate',
  context: {
    startTimeTest: Date.now()
  }
});

const data = JSON.parse(result);

// Alle Timestamps sind Numbers
console.assert(data.timestamps.every(t => typeof t === 'number'));

// Alle IDs sind Numbers
console.assert(data.ids.every(id => typeof id === 'number'));

// Alle Status sind Booleans
console.assert(data.status.every(s => typeof s === 'boolean'));
```

``` highlight
const template = JSON.stringify({
  // String → Number
  count: '{{gen:string:42|toNumber}}',

  // Number → String
  id: '{{gen:number:12345|toString}}',

  // String → Boolean
  active: '{{gen:string:true|toBoolean}}',

  // Verschachtelt mit Transform
  timestamp: '{{gen:string:1710504000|toNumber}}'
});

const result = await engine.processGenerate(template, {
  format: 'json',
  mode: 'generate'
});

console.log(JSON.parse(result));
// {
//   count: 42,
//   id: "12345",
//   active: true,
//   timestamp: 1710504000
// }
```

``` highlight
const template = 'Train {{gen:zugnummer:4837}} departs at {{time:calc:0:HH}} from platform 7';

const result = await engine.processGenerate(template, {
  format: 'text',
  mode: 'generate',
  context: {
    startTimeTest: new Date('2025-03-15T14:30:00Z').getTime()
  }
});

console.log(result);
// "Train 4837 departs at 14 from platform 7"
```
``` highlight
const template = `
Test Report
===========
Test ID: {{gen:uuid:test-001}}
Train: {{gen:zugnummer:4837}}
Date: {{time:calc:0:dd.MM.yyyy}}
Time: {{time:calc:0:HH}}
Status: PASSED
`.trim();

const result = await engine.processGenerate(template, {
  format: 'text',
  mode: 'generate',
  context: {
    startTimeTest: new Date('2025-03-15T12:00:00Z').getTime()
  }
});

console.log(result);
// Test Report
// ===========
// Test ID: test-001
// Train: 4837
// Date: 15.03.2025
// Time: 12
// Status: PASSED
```

``` highlight
import { PlaceholderEngine, TimePlugin, GeneratorPlugin } from '@aikotools/placeholder';
import * as fs from 'fs/promises';

class TemplateHelper {
  private engine: PlaceholderEngine;

  constructor() {
    this.engine = new PlaceholderEngine();
    this.engine.registerPlugins([
      new TimePlugin(),
      new GeneratorPlugin()
    ]);
  }

  async loadAndProcess(
    templatePath: string,
    context: Record<string, any>
  ): Promise<any> {
    const template = await fs.readFile(templatePath, 'utf-8');

    const result = await this.engine.processGenerate(template, {
      format: 'json',
      mode: 'generate',
      context
    });

    return JSON.parse(result);
  }

  async createExpectedData(
    testId: string,
    zugnummer: number,
    testStartTime: number
  ): Promise<any> {
    const template = JSON.stringify({
      testId: `{{gen:uuid:${testId}}}`,
      zugnummer: `{{gen:zugnummer:${zugnummer}}}`,
      startTime: '{{time:calc:0:seconds}}',
      endTime: '{{time:calc:300:seconds}}',
      date: '{{time:calc:0:dd.MM.yyyy}}'
    });

    const result = await this.engine.processGenerate(template, {
      format: 'json',
      mode: 'generate',
      context: {
        startTimeTest: testStartTime
      }
    });

    return JSON.parse(result);
  }
}

// Verwendung
const helper = new TemplateHelper();

const expected = await helper.createExpectedData(
  'test-001',
  4837,
  Date.now()
);

console.log(expected);
```
``` highlight
import { describe, it, expect, beforeEach } from 'vitest';
import { PlaceholderEngine, TimePlugin, GeneratorPlugin } from '@aikotools/placeholder';
import { DateTime } from 'luxon';

describe('Train Journey Tests', () => {
  let engine: PlaceholderEngine;
  let testStartTime: DateTime;

  beforeEach(() => {
    engine = new PlaceholderEngine();
    engine.registerPlugins([
      new TimePlugin(),
      new GeneratorPlugin()
    ]);

    testStartTime = DateTime.fromISO('2025-03-15T12:00:00Z');
  });

  it('should generate expected train departure data', async () => {
    const template = JSON.stringify({
      testId: '{{gen:uuid:test-departure}}',
      train: {
        number: '{{gen:zugnummer:4837}}',
        type: 'RGE'
      },
      departure: {
        time: '{{time:calc:0:seconds}}',
        date: '{{time:calc:0:dd.MM.yyyy}}'
      }
    });

    const result = await engine.processGenerate(template, {
      format: 'json',
      mode: 'generate',
      context: {
        startTimeTest: testStartTime.toMillis()
      }
    });

    const data = JSON.parse(result);

    expect(data.testId).toBe('test-departure');
    expect(data.train.number).toBe(4837);
    expect(typeof data.train.number).toBe('number');
    expect(data.departure.time).toBe(testStartTime.toSeconds());
    expect(data.departure.date).toBe('15.03.2025');
  });

  it('should handle multi-phase processing', async () => {
    const template = JSON.stringify({
      id: '{{gen:uuid:test-123}}',
      timestamp: '{{time:calc:0:seconds}}'
    });

    // Phase 1: Gen
    const afterGen = await engine.processGenerate(template, {
      format: 'json',
      mode: 'generate',
      includePlugins: ['gen']
    });

    const genData = JSON.parse(afterGen);
    expect(genData.id).toBe('test-123');
    expect(genData.timestamp).toBe('{{time:calc:0:seconds}}');

    // Phase 2: Time
    const afterTime = await engine.processGenerate(afterGen, {
      format: 'json',
      mode: 'generate',
      includePlugins: ['time'],
      context: {
        startTimeTest: testStartTime.toMillis()
      }
    });

    const timeData = JSON.parse(afterTime);
    expect(timeData.id).toBe('test-123');
    expect(timeData.timestamp).toBe(testStartTime.toSeconds());
  });
});
```

``` highlight
const template = JSON.stringify({
  value: '{{unknown:action:arg}}'
});

try {
  await engine.processGenerate(template, {
    format: 'json',
    mode: 'generate'
  });
} catch (error) {
  console.error(error.message);
  // "Plugin 'unknown' not found. Available plugins: gen, time"
}
```
``` highlight
const template = JSON.stringify({
  value: '{{gen:invalid:arg}}'
});

try {
  await engine.processGenerate(template, {
    format: 'json',
    mode: 'generate'
  });
} catch (error) {
  console.error(error.message);
  // "Generator plugin: unknown action 'invalid'. Available: uuid, number, zugnummer, string, boolean"
}
```
``` highlight
const template = JSON.stringify({
  value: '{{time:calc:300}}'
});

try {
  await engine.processGenerate(template, {
    format: 'json',
    mode: 'generate'
  });
} catch (error) {
  console.error(error.message);
  // "Time plugin calc: requires 2 arguments (offset, unit/format)"
}
```

---

## License

MIT - See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or feature requests, please use the [GitHub Issues](https://github.com/aikotools/placeholder/issues) page.

