# Catalog search

Customer catalogue, POS, Motor Saya, admin products and motorcycle mapping use the
same vocabulary in `resources/data/catalog-search.json`. Matching is implemented
in `CatalogSearchService` (PHP) and `fuzzySearch` (JavaScript); both are checked
against `tests/fixtures/catalog-search.json`.

## Matching

- All meaningful query words must match. Their order does not matter.
- Case, accents, punctuation, Indonesian `-nya`, common English plurals and
  conversational words are normalized.
- Aliases cover automotive, bicycle, electronics and hardware terminology.
  Longer expressions take precedence: brake pads, brake shoes and brake discs
  remain distinct. A general `kampas rem` query may match both pad and shoe types.
- Explicit quantities are normalized: `0.8 L` / `800 ml`, `3 cm` / `30 mm`,
  decimal commas and mixed fractions. Tire ratios retain their order.
- Minor letter typos and partial words are allowed with lower scores. Numeric
  identifiers, model numbers and dimensions do not get edit-distance correction.
  Known different product terms do not become synonyms through typo correction.
- Name, SKU, barcode, brand, category/parent, description, fitment and mapping
  notes participate according to the metadata available on each screen. Rack
  location is searched on staff screens. Public payloads exclude purchase costs.
- Exact names/SKUs rank first; name/brand matches outweigh description matches.
  An explicitly selected price/name sort takes precedence over relevance.
- Queries are limited to 160 characters and 24 meaningful tokens. Symbol-only
  input matches nothing. Blank input preserves the existing filtered catalogue.

## Adding terminology

Add an expression to the appropriate canonical alias group and add positive and
negative cases to the shared fixture. Avoid merging related but different goods
(for example, charger and adapter). Run `npm test` and
`php artisan test --filter=CatalogSearchTest`.

This is vocabulary-based search, without an external AI service. It does not
infer every previously unseen synonym or arbitrary sentence meaning. New shop
terminology can be added to the vocabulary; names, brands and descriptions should
still identify the product correctly.

## Performance and freshness

The client keeps a weak document cache, invalidated when searchable fields change.
Server search reads searchable metadata in batches of 250 after existing scopes
and filters, then paginates matching IDs in the database. It does not maintain a
persistent search index that could become stale after an import or edit.

Server work grows with the number of candidate products. For much larger catalogues,
measure latency and move to a dedicated index while keeping the shared regression
contract. Numeric boundaries and existing authorization/filter scopes must remain.
