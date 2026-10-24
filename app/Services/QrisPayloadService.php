<?php

declare(strict_types=1);

namespace App\Services;

use InvalidArgumentException;

class QrisPayloadService
{
    public const MAX_AMOUNT = 10_000_000;

    public function details(string $payload): array
    {
        $fields = $this->staticFields($payload);

        return ['name' => $fields['59'], 'city' => $fields['60']];
    }

    public function withAmount(string $payload, float $amount): string
    {
        $fields = $this->staticFields($payload);
        if (! is_finite($amount) || $amount <= 0 || $amount > self::MAX_AMOUNT || abs(round($amount, 2) - $amount) > 0.000001) {
            throw new InvalidArgumentException('Nominal QRIS harus lebih dari 0 dan maksimal Rp10.000.000, dengan maksimal dua angka desimal.');
        }
        $fields['01'] = '12';
        unset($fields['63']);
        $fields['54'] = rtrim(rtrim(number_format($amount, 2, '.', ''), '0'), '.');
        $result = '';
        foreach ($fields as $id => $value) {
            $result .= sprintf('%02d%02d', $id, strlen($value)).$value;
        }
        $result .= '6304';

        return $result.$this->checksum($result);
    }

    private function staticFields(string $payload): array
    {
        if (strlen($payload) > 2048 || ! preg_match('/\A[\x20-\x7E]+\z/', $payload)) {
            $this->invalid();
        }
        $fields = $this->parse($payload);
        if (array_key_first($fields) !== '00' || array_key_last($fields) !== 63
            || ! preg_match('/\A[0-9A-F]{4}\z/', $fields['63'] ?? '')
            || ! hash_equals($this->checksum(substr($payload, 0, -4)), $fields['63'])) {
            $this->invalid();
        }
        if (($fields['00'] ?? null) !== '01' || ($fields['01'] ?? null) !== '11'
            || ($fields['53'] ?? null) !== '360' || ($fields['58'] ?? null) !== 'ID'
            || isset($fields['54']) || isset($fields['55']) || isset($fields['56']) || isset($fields['57'])
            || empty($fields['59']) || empty($fields['60'])) {
            $this->invalid();
        }
        $hasAccount = false;
        foreach ($fields as $id => $value) {
            if ((int) $id >= 26 && (int) $id <= 51) {
                $account = $this->parse($value);
                if (empty($account['00'])) {
                    $this->invalid();
                }
                $hasAccount = $hasAccount || (int) $id < 51;
            }
        }
        $national = isset($fields['51']) ? $this->parse($fields['51']) : [];
        if (! $hasAccount || ($national['00'] ?? null) !== 'ID.CO.QRIS.WWW') {
            $this->invalid();
        }

        return $fields;
    }

    private function parse(string $payload): array
    {
        $fields = [];
        for ($offset = 0, $size = strlen($payload); $offset < $size;) {
            $header = substr($payload, $offset, 4);
            if (strlen($header) !== 4 || ! ctype_digit($header)) {
                $this->invalid();
            }
            $id = substr($header, 0, 2);
            $length = (int) substr($header, 2, 2);
            if ($length === 0 || $offset + 4 + $length > $size || array_key_exists($id, $fields)) {
                $this->invalid();
            }
            $fields[$id] = substr($payload, $offset + 4, $length);
            $offset += 4 + $length;
        }

        return $fields;
    }

    private function checksum(string $payload): string
    {
        $crc = 0xFFFF;
        for ($index = 0, $length = strlen($payload); $index < $length; $index++) {
            $crc ^= ord($payload[$index]) << 8;
            for ($bit = 0; $bit < 8; $bit++) {
                $crc = ($crc & 0x8000) ? ($crc << 1) ^ 0x1021 : $crc << 1;
                $crc &= 0xFFFF;
            }
        }

        return sprintf('%04X', $crc);
    }

    private function invalid(): never
    {
        throw new InvalidArgumentException('Gunakan QRIS statis Indonesia yang valid, tanpa nominal tetap, biaya tambahan, atau tip.');
    }
}
