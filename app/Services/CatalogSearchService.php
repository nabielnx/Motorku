<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Normalizer;

/** Same vocabulary and matching contract as the client; no external search API or stale persistent index. */
class CatalogSearchService
{
    private array $rules = [];

    private array $units = [];

    private array $concepts = [];

    public function __construct()
    {
        foreach (config('catalog_search.units') as $unit) {
            [$scale, $base] = $unit;
            $names = implode('|', array_map(fn ($name) => preg_quote($name, '/'), array_slice($unit, 2)));
            $this->units[] = ['scale' => $scale, 'base' => $base, 'pattern' => '/(\d+(?:[.,]\d+)?)\s*(?:'.$names.')(?![\p{L}\p{N}])/u'];
        }
        foreach (config('catalog_search.aliases') as $canonical => $aliases) {
            foreach ([$canonical, ...$aliases] as $term) {
                foreach ($this->words($term) as $token) {
                    $this->concepts[$token] = true;
                }
            }
            foreach ($aliases as $alias) {
                $this->rules[] = ['alias' => $this->words($alias), 'canonical' => $this->words($canonical)];
            }
        }
        usort($this->rules, fn ($a, $b) => count($b['alias']) <=> count($a['alias']));
    }

    private function fold(mixed $text): string
    {
        $text = (string) ($text ?? '');
        $text = class_exists(Normalizer::class) ? Normalizer::normalize($text, Normalizer::FORM_KD) : Str::ascii($text);

        return mb_strtolower(preg_replace('/\p{M}/u', '', $text));
    }

    private function compact(mixed $text): string
    {
        return preg_replace('/[^\p{L}\p{N}]/u', '', $this->fold($text));
    }

    private function words(mixed $value): array
    {
        $text = preg_replace('/(\d+)\s*w\s*-\s*(\d+)/', '$1w$2', $this->fold($value));
        $text = preg_replace_callback('/(\d+)\s+(\d+)\/(\d+)/', fn ($m) => (int) $m[3] <= 16 && (int) $m[2] < (int) $m[3] ? (string) ((int) $m[1] + (int) $m[2] / (int) $m[3]) : $m[0], $text);
        foreach ($this->units as $unit) {
            $text = preg_replace_callback($unit['pattern'], fn ($m) => (string) round((float) str_replace(',', '.', $m[1]) * $unit['scale'], 6).$unit['base'], $text);
        }
        $text = preg_replace(['/(\d+)[.,](\d+)/', '/(\d+)\/(\d+)/'], ['$1p$2', '$1r$2'], $text);
        preg_match_all('/[\p{L}\p{N}]+/u', $text, $matches);

        return $matches[0];
    }

    private function forms(string $word): array
    {
        $forms = [$word];
        if (str_ends_with($word, 'nya') && strlen($word) >= 6) {
            $forms[] = substr($word, 0, -3);
        }
        if (str_ends_with($word, 's') && strlen($word) >= 4 && ! preg_match('/(ss|is|us)$/', $word)) {
            $forms[] = substr($word, 0, -1);
        }

        return $forms;
    }

    private function canonicalize(array $tokens): array
    {
        if (! $tokens) {
            return [];
        }
        $available = array_fill_keys(array_merge(...array_map($this->forms(...), $tokens)), true);
        foreach ($this->rules as $rule) {
            if (! isset($available[$rule['alias'][0]])) {
                continue;
            }
            $remaining = $tokens;
            foreach ($rule['alias'] as $token) {
                $found = false;
                foreach ($remaining as $key => $word) {
                    if (in_array($token, $this->forms($word), true)) {
                        unset($remaining[$key]);
                        $found = true;
                        break;
                    }
                }
                if (! $found) {
                    continue 2;
                }
            }
            $tokens = [...array_values($remaining), ...$rule['canonical']];
            $available = array_fill_keys(array_merge(...array_map($this->forms(...), $tokens)), true);
        }

        return array_values(array_unique($tokens));
    }

    private function prepare(string $raw): array
    {
        $raw = trim($raw);
        preg_match_all('/\b([a-z]+)\s*[-\/]\s*\d+\b/', $this->fold($raw), $codes);
        $stopwords = array_diff(config('catalog_search.stopwords'), $codes[1]);
        $tokens = array_values(array_diff($this->words($raw), $stopwords));

        return ['raw' => $raw, 'tokens' => $this->canonicalize($tokens), 'valid' => mb_strlen($raw) <= 160 && count($tokens) <= 24];
    }

    private function typo(string $a, string $b): bool
    {
        if (! preg_match('/^[a-z]+$/', $a.$b) || strlen($a) < 4 || max(strlen($a), strlen($b)) > 48) {
            return false;
        }
        $limit = strlen($a) >= 8 ? 2 : 1;
        if (abs(strlen($a) - strlen($b)) > $limit) {
            return false;
        }
        if (strlen($a) === strlen($b)) {
            $differences = [];
            for ($i = 0; $i < strlen($a); $i++) {
                if ($a[$i] !== $b[$i]) {
                    $differences[] = $i;
                }
            }
            if (count($differences) === 2 && $differences[1] === $differences[0] + 1 && $a[$differences[0]] === $b[$differences[1]] && $a[$differences[1]] === $b[$differences[0]]) {
                return true;
            }
        }

        return levenshtein($a, $b) <= $limit;
    }

    public function score(array $item, string $raw): float
    {
        return $this->scorePrepared($item, $this->prepare($raw));
    }

    private function scorePrepared(array $item, array $query): float
    {
        if (! $query['valid'] || ! $query['tokens']) {
            return 0;
        }
        if (isset($item['sku']) && (string) $item['sku'] !== '' && $this->compact($item['sku']) === $this->compact($query['raw'])) {
            return 1060;
        }
        $category = $item['category'] ?? null;
        $fields = [
            [$item['name'] ?? '', 100], [$item['sku'] ?? '', 110], [$item['barcode'] ?? '', 110], [$item['brand'] ?? '', 90],
            [is_array($category) ? ($category['name'] ?? '') : ($category ?: ($item['category_name'] ?? '')), 70],
            [is_array($category) ? ($category['parent']['name'] ?? $item['category_parent'] ?? '') : ($item['category_parent'] ?? ''), 65],
            [$item['description'] ?? '', 35], [$item['notes'] ?? '', 35], [$item['rack_location'] ?? '', 35],
            [$item['model'] ?? '', 90], [$item['unit'] ?? '', 40], [$item['engine_type'] ?? '', 60],
            [$item['engine_cc'] ?? '', 60], [$item['year_start'] ?? '', 50], [$item['year_end'] ?? '', 50],
            [implode(' ', array_map(fn ($m) => ($m['brand'] ?? '').' '.($m['model'] ?? '').' '.($m['engine_type'] ?? ''), $item['motorcycles'] ?? [])), 60],
        ];
        $tokens = [];
        $codes = [];
        $add = static function ($token, $weight) use (&$tokens): void {
            $tokens[$token] = max($tokens[$token] ?? 0, $weight);
        };
        foreach ($fields as [$text, $weight]) {
            if ($text === null || $text === '') {
                continue;
            }
            $raw = $this->words($text);
            foreach ($raw as $token) {
                foreach ($this->forms($token) as $form) {
                    $add($form, $form === $token ? $weight : $weight * 0.9);
                }
                preg_match_all('/\d+(?:[pr]\d+)?|[^\d]+/u', $token, $parts);
                foreach ($parts[0] as $part) {
                    $add($part, $weight * 0.9);
                }
            }
            foreach ($this->canonicalize($raw) as $token) {
                $add($token, $weight * 0.8);
            }
            // Join complete words rather than substring-match a code inside another code.
            foreach (array_keys($raw) as $start) {
                for ($length = 1; $length <= 4 && $start + $length <= count($raw); $length++) {
                    $code = implode('', array_slice($raw, $start, $length));
                    if (preg_match('/\d/', $code)) {
                        $codes[$code] = max($codes[$code] ?? 0, $weight * 0.85);
                    }
                }
            }
        }
        if (! empty($item['motorcycles']) || ! empty($item['model'])) {
            $add('motor', 50);
        }
        if (isset($tokens['aki'])) {
            $add('baterai', 55);
        }
        $sum = 0;
        foreach ($query['tokens'] as $token) {
            $score = $tokens[$token] ?? 0;
            foreach ($this->forms($token) as $form) {
                $score = max($score, ($tokens[$form] ?? 0) * 0.9);
            }
            if (! $score) {
                foreach ($tokens as $word => $weight) {
                    $word = (string) $word;
                    if (isset($this->concepts[$token], $this->concepts[$word])) {
                        continue;
                    }
                    if ($this->typo($token, $word)) {
                        $score = max($score, $weight * 0.45);
                    } elseif (! isset($this->concepts[$token]) && ! preg_match('/\d/', $token) && mb_strlen($token) >= 3 && str_starts_with($word, $token)) {
                        $score = max($score, $weight * 0.75);
                    }
                }
            }
            if (! $score && preg_match('/\d/', $token)) {
                $score = $codes[$token] ?? 0;
            }
            if (! $score) {
                return 0;
            }
            $sum += $score;
        }
        $score = $sum / count($query['tokens']);
        $raw = $this->fold($query['raw']);
        if ($this->fold($item['name'] ?? '') === $raw) {
            $score += 1000;
        } elseif (! empty($item['sku']) && $this->compact($item['sku']) === $this->compact($query['raw'])) {
            $score += 950;
        } elseif (str_contains($this->fold($item['name'] ?? ''), $raw)) {
            $score += 300;
        }

        return $score;
    }

    public function apply(Builder $query, string $search, bool $rank = true, bool $parts = false): void
    {
        $prepared = $this->prepare($search);
        if ($prepared['raw'] === '') {
            return;
        }
        $scores = [];
        // Read only searchable metadata, in bounded batches; keep authorization/category scopes intact.
        $candidates = clone $query;
        $candidates->reorder()->setEagerLoads([]);
        $fields = ['id', 'category_id', 'name', 'sku', 'barcode', 'brand', 'description', 'unit', 'rack_location'];
        if ($parts) {
            $candidates->select(['id', 'product_id', 'notes'])->with([
                'product' => fn ($product) => $product->select($fields),
                'product.category.parent', 'product.motorcycles:id,brand,model,engine_type',
            ]);
        } else {
            $candidates->select($fields)
                ->with(['category.parent', 'motorcycles:id,brand,model,engine_type']);
        }
        if ($prepared['valid'] && $prepared['tokens']) {
            $candidates->chunkById(250, function ($rows) use (&$scores, $prepared, $parts): void {
                foreach ($rows as $row) {
                    $item = $parts ? [...($row->product?->toArray() ?? []), 'notes' => $row->notes] : $row->toArray();
                    $score = $this->scorePrepared($item, $prepared);
                    if ($score > 0) {
                        $scores[$row->id] = $score;
                    }
                }
            });
        }
        $column = $query->getModel()->qualifyColumn('id');
        $query->whereIn($column, array_keys($scores));
        if ($rank && $scores) {
            $bindings = [];
            $clauses = [];
            foreach ($scores as $id => $score) {
                $clauses[] = 'WHEN ? THEN ?';
                array_push($bindings, $id, $score);
            }
            $query->orderByRaw('CASE '.$column.' '.implode(' ', $clauses).' ELSE 0 END DESC', $bindings);
        }
    }
}
