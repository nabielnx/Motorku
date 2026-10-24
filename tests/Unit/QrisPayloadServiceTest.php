<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\QrisPayloadService;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class QrisPayloadServiceTest extends TestCase
{
    public static function sample(array $overrides = []): string
    {
        $fields = array_replace([
            '00' => '01', '01' => '11',
            '26' => '0014COM.GO-JEK.WWW01189360091430000000000210G0000000000303UMI',
            '51' => '0014ID.CO.QRIS.WWW0215ID12345678901230303UMI',
            '52' => '5399', '53' => '360', '58' => 'ID',
            '59' => 'TOKO UJI', '60' => 'DEMAK', '61' => '59583', '62' => '0703A01',
        ], $overrides);
        $payload = '';
        foreach ($fields as $tag => $value) {
            if ($value !== null) {
                $payload .= sprintf('%02d%02d', $tag, strlen($value)).$value;
            }
        }
        $payload .= '6304';

        // Independent reference CRC-16/CCITT-FALSE vector, polynomial 0x1021.
        $crc = 0xFFFF;
        foreach (unpack('C*', $payload) as $byte) {
            $crc ^= $byte << 8;
            for ($bit = 0; $bit < 8; $bit++) {
                $crc = (($crc << 1) ^ (($crc & 0x8000) ? 0x1021 : 0)) & 0xFFFF;
            }
        }

        return $payload.sprintf('%04X', $crc);
    }

    public function test_static_details_identify_the_merchant_and_currency(): void
    {
        $this->assertSame(['name' => 'TOKO UJI', 'city' => 'DEMAK'], (new QrisPayloadService)->details(self::sample()));
    }

    public function test_amount_is_embedded_with_a_valid_crc_and_merchant_fields_preserved(): void
    {
        $service = new QrisPayloadService;
        $source = self::sample();
        foreach ([1000, 262000, 1234.5, 10000000] as $amount) {
            $result = $service->withAmount($source, $amount);
            $this->assertStringStartsWith('000201010212', $result);
            $this->assertStringContainsString('5908TOKO UJI6005DEMAK', $result);
            $expected = self::sample(['01' => '12', '54' => rtrim(rtrim(number_format($amount, 2, '.', ''), '0'), '.')]);
            $this->assertSame($expected, $result);
        }
    }

    #[DataProvider('invalidPayloads')]
    public function test_unsupported_or_corrupt_payload_is_rejected(string $payload): void
    {
        $this->expectException(InvalidArgumentException::class);
        (new QrisPayloadService)->details($payload);
    }

    public static function invalidPayloads(): array
    {
        $sample = self::sample();

        return [
            'bad checksum' => [substr($sample, 0, -4).'0000'],
            'truncated' => [substr($sample, 0, -8)],
            'already dynamic' => [self::sample(['01' => '12'])],
            'fixed amount' => [self::sample(['54' => '1000'])],
            'wrong currency' => [self::sample(['53' => '840'])],
            'not Indonesian' => [self::sample(['58' => 'SG'])],
            'not QRIS' => [self::sample(['51' => null])],
            'fees' => [self::sample(['55' => '02', '56' => '1000'])],
            'invalid nested fields' => [self::sample(['26' => '0109short'])],
            'not a QR payload' => ['https://example.test'],
            'duplicate fields' => [str_replace('5303360', '53033605303360', $sample)],
        ];
    }

    #[DataProvider('invalidAmounts')]
    public function test_invalid_amount_is_rejected(float $amount): void
    {
        $this->expectException(InvalidArgumentException::class);
        (new QrisPayloadService)->withAmount(self::sample(), $amount);
    }

    public static function invalidAmounts(): array
    {
        return [[0], [-1], [10000000.01], [NAN], [INF], [1.234]];
    }
}
