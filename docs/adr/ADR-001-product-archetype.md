# ADR-001: Product Archetype — Pattern Recognition, Rules, and Implementation Guide

**Status:** Accepted
**Date:** 2026-03-03
**Context:** Universal domain pattern for any system that defines, offers, and delivers products or services.

---

## 1. How to Detect This Pattern in a Question

You are looking at a Product Archetype when the domain has **any combination** of these signals:

### Strong signals (2+ means apply the pattern)

| Signal | Example phrases |
|--------|----------------|
| **Type → Instance split** | "we define X, then customers get a concrete X" |
| **Catalog / Offer wrapper** | "we have offers / campaigns / packages for sale" |
| **Configurable features** | "products have color, size, RAM…" |
| **Bundles / Packages** | "a package contains multiple products" |
| **Tracking per unit** | "each item has a serial number / batch / VIN" |
| **Eligibility rules** | "product is available only for segment X, region Y" |
| **Lifecycle of a quote** | "customer gets a proposal → accepts/rejects → becomes a contract" |
| **Multi-provider routing** | "different providers/banks/vendors have different rules" |

### Domain-specific translations

| Domain | ProductType | CatalogEntry | ProductInstance |
|--------|------------|--------------|-----------------|
| Banking | Credit Tier (salary range + financial params) | Bank Offer (summer loan campaign) | Credit Agreement (signed contract) |
| Telecom | Tariff Plan (data/voice/SMS limits) | Commercial Offer (promo campaign) | Subscription (activated plan) |
| Insurance | Policy Template (coverage params) | Insurance Product (marketed offering) | Policy (issued policy) |
| Retail | SKU Definition (specs, features) | Store Listing (price, availability) | Sold Item (serial, warranty) |
| SaaS | Plan Tier (features, limits) | Pricing Page Entry | Subscription Instance |

### Key question to ask yourself

> "Does the system distinguish between **what something IS** (definition), **how it's offered** (commercial), and **what was delivered** (concrete instance)?"

If yes → Product Archetype applies.

---

## 2. The Three-Level Abstraction (Core Rule)

Every implementation MUST maintain these three levels:

```
Level 1: TYPE        — what the product IS (exists without customers)
Level 2: CATALOG     — how it's OFFERED (marketing, validity, pricing context)
Level 3: INSTANCE    — what was DELIVERED (concrete, per-customer, frozen params)
```

### Rules

1. **ProductType exists independently of any customer.** It defines the template.
2. **CatalogEntry wraps a ProductType** with commercial metadata (display name, validity period, categories). One ProductType can have many CatalogEntries (summer campaign, Black Friday, etc.).
3. **ProductInstance is created from a ProductType** when a customer receives/accepts/signs. Financial parameters are **frozen at creation** — changes to the ProductType do NOT affect existing instances.
4. **Never conflate levels.** A credit offer (quote) is NOT a product — it's an entity with lifecycle that REFERENCES a ProductType and MAY become a ProductInstance upon acceptance.

---

## 3. Pattern Structure — Reference Implementation

The TypeScript reference implementation lives in `src/product/`. Key files:

### Domain Core (Composite Pattern)

| Concept | File | Role |
|---------|------|------|
| Product interface | `src/product/domain/product.ts` | Root of the composite |
| ProductType | `src/product/domain/product-type.ts` | Leaf — single product definition |
| PackageType | `src/product/domain/package-type.ts` | Composite — bundle of products |
| Builder | `src/product/domain/product-builder.ts` | Fluent construction |

### Feature System (Configuration without subclassing)

| Concept | File | Role |
|---------|------|------|
| Feature definition | `src/product/features/product-feature-type.ts` | Name + constraint + mandatory/optional |
| Constraint types | `src/product/features/feature-value-constraint.ts` | AllowedValues, NumericRange, Regex, etc. |
| Feature instance | `src/product/features/product-feature-instance.ts` | Concrete value with typed accessors |

### Applicability Constraints (Specification Pattern)

| Concept | File | Role |
|---------|------|------|
| Constraint algebra | `src/product/constraints/applicability-constraint.ts` | equals, in, between, and, or, not — composable |

### Instances (Delivered items)

| Concept | File | Role |
|---------|------|------|
| ProductInstance | `src/product/instances/product-instance.ts` | Concrete instance of ProductType |
| PackageInstance | `src/product/instances/package-instance.ts` | Concrete instance of PackageType |
| Serial numbers | `src/product/instances/serial-number.ts` | Textual, IMEI (Luhn), VIN validation |
| Instance builder | `src/product/instances/instance-builder.ts` | Fluent construction |

### Catalog, Relationships, Repositories

| Concept | File | Role |
|---------|------|------|
| CatalogEntry | `src/product/catalog/catalog-entry.ts` | Commercial wrapper |
| Relationships | `src/product/relationships/product-relationship.ts` | UPGRADABLE_TO, SUBSTITUTED_BY, etc. |
| Repositories | `src/product/repositories/repositories.ts` | Interfaces + InMemory implementations |

### CQRS + Facades

| Concept | File | Role |
|---------|------|------|
| Commands | `src/product/cqrs/commands.ts` | DefineProductType, AddToOffer, Discontinue |
| Queries | `src/product/cqrs/queries.ts` | FindProductType, SearchCatalog |
| Views (DTOs) | `src/product/cqrs/views.ts` | ProductTypeView, CatalogEntryView |
| ProductFacade | `src/product/facades/product-facade.ts` | ProductType management |
| ProductCatalog | `src/product/facades/product-catalog.ts` | Catalog management |

### Shared

| Concept | File | Role |
|---------|------|------|
| Result\<E, T\> | `src/product/shared/result.ts` | Railway-oriented error handling |
| Preconditions | `src/product/shared/preconditions.ts` | Argument validation |

---

## 4. Design Patterns Used (and WHY)

| Pattern | Where | Why |
|---------|-------|-----|
| **Composite** | ProductType / PackageType | Products can contain other products recursively (bundles within bundles) |
| **Builder** | ProductBuilder, InstanceBuilder | Complex objects with many optional fields — prevents telescoping constructors |
| **Specification** | ApplicabilityConstraint, SelectionRule | Business rules as composable, testable objects — avoids if/else sprawl |
| **Repository** | All repositories | Decouples domain from persistence — swap InMemory for Postgres without touching domain |
| **Facade** | ProductFacade, ProductCatalog | Simplified entry point — hides internal complexity from API consumers |
| **CQRS** | Commands/Queries/Views | Separates write (commands) from read (queries) — different optimization paths |
| **Value Object** | ProductIdentifier, Validity, Quantity, Money | Immutable, self-validating — eliminates invalid state |
| **Discriminated Union** | ProductIdentifier, SerialNumber, Constraint | Type-safe polymorphism with exhaustive checking — no invalid variants |
| **Result Type** | Result\<E, T\> | Explicit error handling without exceptions — forces callers to handle both paths |

---

## 5. Implementation Rules

### MUST follow

1. **Value objects are immutable.** No setters. Create new instances for changes.
2. **Validate at construction.** ProductName rejects blank strings. Rate rejects values outside [0,1]. Money rejects negative amounts. Invalid objects cannot exist.
3. **Use Result\<E, T\> for operations that can fail.** Do not throw exceptions for business rule violations. Reserve exceptions for programming errors.
4. **Repository interfaces live in domain.** Implementations live in infrastructure. Domain never imports infrastructure.
5. **Commands return Result, never throw.** Queries return views (DTOs), never domain objects.
6. **Features define products — not subclasses.** "Color" is a feature, not a `ColoredProduct` subclass. This enables runtime configuration.
7. **Constraints are composable.** Use `and()`, `or()`, `not()` to build complex rules from simple primitives. Never hardcode eligibility logic.
8. **ProductInstance freezes parameters.** Once created, the instance's financial/operational parameters do not change even if the ProductType is updated.

### SHOULD follow

1. **Tracking strategy matches the domain.** Phones → INDIVIDUALLY_TRACKED. Milk → BATCH_TRACKED. Screws → IDENTICAL.
2. **One ProductType → many CatalogEntries.** Don't create separate ProductTypes for each marketing campaign.
3. **Use Validity on CatalogEntry** to control time-limited availability.
4. **Keep facades thin.** They orchestrate domain objects — business logic lives in domain entities and value objects.

### MUST NOT do

1. **Never put domain logic in controllers or facades.** Calculation, validation, and matching belong in domain services.
2. **Never expose domain entities through the API.** Use Views (DTOs) at boundaries.
3. **Never create a ProductInstance without a matching ProductType.** The type is the template — instances are derived.
4. **Never use inheritance to differentiate products.** Use features and constraints instead.

---

## 6. NestJS DDD+CQRS Implementation — Banking Credit System

The `credit-system/` directory demonstrates applying Product Archetype to a banking domain with multi-bank support.

### Domain Mapping

| Banking Concept | Archetype Concept | Why |
|----------------|-------------------|-----|
| **Tier** (salary range + financial params) | **ProductType** | Exists independently. Defines interest rate, term limits, fees. Is THE product. |
| **BankOffer** (summer campaign) | **CatalogEntry** | Commercial wrapper with validity, sectors, marketing text. |
| **Sector** (PRIVATE, GOVERNMENT) | **ApplicabilityConstraint** | Classification dimension. NOT a product — filters which Tiers apply. |
| **CreditOffer** (calculated quote) | **Entity with lifecycle** | NOT a product. A proposal: DRAFT→PRESENTED→ACCEPTED/REJECTED/EXPIRED/WITHDRAWN. |
| **CreditAgreement** (signed contract) | **ProductInstance** | The concrete credit. Parameters frozen at signing. |

### Bounded Contexts

```
src/
├── shared/domain/              # Money, Rate, Months, Result, BankCode
├── product-catalog/            # BC 1: Tier + BankOffer
│   ├── domain/model/           # Tier (ProductType), BankOffer (CatalogEntry)
│   ├── domain/value-objects/   # TierId, SalaryRange, Sector
│   ├── domain/repository/      # Interfaces
│   ├── application/commands/   # DefineTier, CreateBankOffer
│   ├── application/queries/    # FindTier, FindBankOffer
│   └── infrastructure/         # InMemory repos
├── credit-quoting/             # BC 2: Pipeline engine
│   ├── domain/model/           # CreditOffer (entity with lifecycle)
│   ├── domain/services/        # Step + Pipeline + Registry INTERFACES
│   ├── infrastructure/steps/   # Reusable matching + calculation steps
│   ├── infrastructure/banks/   # Bank-specific steps (one folder per bank)
│   ├── infrastructure/pipeline/  # DefaultTierMatchingPipeline, DefaultCalculationPipeline
│   └── infrastructure/registry/  # MapBankStrategyRegistry
├── credit-agreement/           # BC 3: CreditAgreement (ProductInstance)
└── presentation/               # REST API controller
```

### Pipeline Pattern (Multi-Bank Extensibility)

The key architectural decision for multi-provider systems:

**Problem:** Different banks have different matching/calculation logic. Adding a feature for one bank must NOT require changes in other banks.

**Solution:** Pipeline Pattern with composable steps.

```
┌─────────────────────────────────────────────────────┐
│                BankStrategyRegistry                  │
│  BankCode → { TierMatchingPipeline,                 │
│               CreditCalculationPipeline }            │
└─────────────────────────────────────────────────────┘
         ↓ resolve(bankCode)
┌─────────────────────────────────────────────────────┐
│            TierMatchingPipeline                      │
│  [SalaryFilter → SectorFilter → TermFilter → ...]   │
│  Each step: MatchingContext → MatchingContext         │
└─────────────────────────────────────────────────────┘
         ↓ matched tier
┌─────────────────────────────────────────────────────┐
│          CreditCalculationPipeline                   │
│  [AnnuityCalc → InsuranceFee → ProcessingFee → ...] │
│  Each step: CalculationContext → CalculationContext   │
└─────────────────────────────────────────────────────┘
```

**Each bank assembles its own pipeline from shared + bank-specific steps:**

| Bank | Matching Pipeline | Calculation Pipeline |
|------|------------------|---------------------|
| Santander | Salary → Sector → Term → DownPayment → **CreditScoring** → BestRate | Annuity → Insurance → ProcessingFee |
| PKO BP | Salary → Sector → Term → DownPayment → CreditHistory → **ManualOverride** → BestRate | DecliningBalance → ProcessingFee |
| mBank | Salary → Sector → Term → DownPayment → **MLScoring** → BestRate | Annuity → **PromotionalDiscount** → Insurance → ProcessingFee |

**Bold** = bank-specific step (exists only in that bank's folder).

### Extension Scenarios (Open/Closed Principle)

| Scenario | What to do | Files changed |
|----------|-----------|---------------|
| Add new bank | Create new folder under `banks/`, add bank-specific steps, wire in module | 0 existing files modified |
| Add feature to one bank | Create new step file in that bank's folder, add to pipeline wiring | 1 file modified (module wiring) |
| Add reusable step | Create step in `steps/matching/` or `steps/calculation/` | 0 existing files modified |
| New shared filter | Create step file, add to desired bank pipelines | N files modified (N = banks that want it) |

### Step Interface Contract

```typescript
// Matching step: filters or selects from remaining tiers
interface TierMatchingStep {
  execute(context: MatchingContext): MatchingContext;
}

interface MatchingContext {
  request: CreditRequest;
  remainingTiers: Tier[];       // filter steps reduce this
  matchedTier: Tier | null;     // selection steps set this
  metadata: Record<string, unknown>;
}

// Calculation step: computes financial parameters
interface CreditCalculationStep {
  execute(context: CalculationContext): CalculationContext;
}

interface CalculationContext {
  tier: Tier;
  request: CreditRequest;
  loanAmount: Money;
  monthlyPayment: Money | null;   // set by annuity/declining step
  totalRepayment: Money | null;
  totalInterest: Money | null;
  extras: Record<string, Money>;  // insurance, fees, discounts
}
```

### CreditOffer Lifecycle

```
DRAFT → PRESENTED → ACCEPTED → [CreditAgreement created]
                  → REJECTED
     → EXPIRED
     → WITHDRAWN
```

- `DRAFT`: Just calculated, not shown to customer yet.
- `PRESENTED`: Shown to customer.
- `ACCEPTED`: Customer agreed. Can create CreditAgreement (ProductInstance).
- `REJECTED`: Customer declined.
- `EXPIRED`: Time limit exceeded while DRAFT or PRESENTED.
- `WITHDRAWN`: Bank withdrew the offer.

---

## 7. When to Use Which Implementation Style

| Scenario | Style | Why |
|----------|-------|-----|
| Library / SDK | Pure TypeScript (as in `src/product/`) | No framework dependency. Reusable across NestJS, Express, etc. |
| NestJS application | DDD + CQRS (as in `credit-system/`) | NestJS provides DI, module system, CQRS bus. Bounded contexts map to modules. |
| Multi-provider/bank | Pipeline Pattern | Each provider gets independent step composition. ISP compliance. |
| Simple single-provider | Strategy Pattern | Simpler than pipelines when there's no per-provider extensibility need. |

---

## 8. Checklist for Implementing Product Archetype

When instructed to implement a system where this pattern applies:

- [ ] Identify what the **ProductType** is (the thing that exists independently of customers)
- [ ] Identify what the **CatalogEntry** is (how it's offered commercially)
- [ ] Identify what the **ProductInstance** is (the concrete delivered/signed/activated thing)
- [ ] Identify entities that are NOT products (quotes, proposals, carts — these are entities with lifecycle)
- [ ] Define **value objects** for domain-specific quantities (Money, Rate, Months, SalaryRange)
- [ ] Define **features** as data, not subclasses
- [ ] Define **constraints** using composable specification pattern
- [ ] If multi-provider: use **Pipeline Pattern** with per-provider step composition
- [ ] If single-provider: use simpler **Strategy** or direct implementation
- [ ] Separate **domain** (entities, value objects, repository interfaces) from **infrastructure** (implementations)
- [ ] Use **CQRS** at the application boundary (commands for writes, queries for reads, views for DTOs)
- [ ] Freeze parameters in ProductInstance — no retroactive changes
- [ ] Write tests for: domain models, pipelines/steps, full flow (type → offer → accept → instance)
