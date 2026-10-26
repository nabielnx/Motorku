<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;

class MotorcyclePartClassifier
{
    public function guess(Product $product): string
    {
        $name = strtolower($product->name ?? '');
        $catName = strtolower($product->category?->name ?? '');

        // 1. Pelumas & Cairan
        if (str_contains($name, 'gardan') || str_contains($name, 'gear oil') || str_contains($name, 'oli gear')) {
            return 'oli_gardan';
        }
        if (str_contains($name, 'minyak rem') || str_contains($name, 'brake fluid')) {
            return 'minyak_rem';
        }
        if (str_contains($name, 'coolant') || str_contains($name, 'radiator')) {
            return 'coolant';
        }
        if ((str_contains($name, 'oli') && ! str_contains($name, 'filter')) || str_contains($catName, 'oli') || str_contains($catName, 'pelumas')) {
            return 'oli_mesin';
        }

        // 2. Pengereman
        if (str_contains($name, 'kampas rem depan') || str_contains($name, 'dispad') || str_contains($name, 'disc pad') || str_contains($name, 'brake pad')) {
            return 'kampas_rem_depan';
        }
        if (str_contains($name, 'kampas rem belakang') || str_contains($name, 'tromol') || str_contains($name, 'brake shoe')) {
            return 'kampas_rem_belakang';
        }
        if (str_contains($name, 'kampas rem')) {
            return 'kampas_rem_depan';
        }
        if (str_contains($name, 'piringan') || str_contains($name, 'cakram') || str_contains($name, 'disc brake') || str_contains($name, 'rotor')) {
            return 'piringan_cakram';
        }
        if (str_contains($name, 'master rem')) {
            return 'master_rem';
        }
        if (str_contains($name, 'kabel rem') || str_contains($name, 'selang rem')) {
            return 'kabel_rem';
        }

        // 3. Kaki-kaki & Roda
        if (str_contains($name, 'ban dalam')) {
            return str_contains($name, 'belakang') ? 'ban_dalam_belakang' : 'ban_dalam_depan';
        }
        if (str_contains($name, 'ban') || str_contains($catName, 'ban')) {
            return str_contains($name, 'belakang') ? 'ban_belakang' : 'ban_depan';
        }
        if (str_contains($name, 'bearing') || str_contains($name, 'laher')) {
            return 'bearing_roda';
        }
        if (str_contains($name, 'velg') || str_contains($name, 'pelek') || str_contains($name, 'rim')) {
            return 'velg';
        }
        if (str_contains($name, 'seal shock')) {
            return 'seal_shock';
        }
        if (str_contains($name, 'shock') || str_contains($name, 'suspensi')) {
            return str_contains($name, 'depan') ? 'shockbreaker_depan' : 'shockbreaker_belakang';
        }

        // 4. Penggerak & Transmisi
        if (str_contains($name, 'v-belt') || str_contains($name, 'vbelt') || str_contains($name, 'vanbelt') || str_contains($name, 'tali kipas')) {
            return 'v_belt';
        }
        if (str_contains($name, 'roller')) {
            return 'roller';
        }
        if (str_contains($name, 'per cvt')) {
            return 'per_cvt';
        }
        if (str_contains($name, 'kampas ganda')) {
            return 'kampas_ganda';
        }
        if (str_contains($name, 'gear set') || str_contains($name, 'gir set')) {
            return 'gear_set';
        }
        if (str_contains($name, 'rantai') && ! str_contains($name, 'keteng')) {
            return 'rantai';
        }
        if (str_contains($name, 'kampas kopling')) {
            return 'kampas_kopling';
        }
        if (str_contains($name, 'kabel kopling')) {
            return 'kabel_kopling';
        }

        // 5. Kelistrikan & Pengapian
        if (str_contains($name, 'aki') || str_contains($name, 'accu') || str_contains($name, 'battery')) {
            return 'aki';
        }
        if (str_contains($name, 'busi') || str_contains($name, 'spark plug')) {
            return 'busi';
        }
        if (str_contains($name, 'kiprok') || str_contains($name, 'regulator')) {
            return 'kiprok';
        }
        if (str_contains($name, 'cdi') || str_contains($name, 'ecu')) {
            return 'cdi_ecu';
        }
        if (str_contains($name, 'koil') || str_contains($name, 'coil')) {
            return 'koil';
        }
        if (str_contains($name, 'bendik') || str_contains($name, 'relay starter')) {
            return 'bendik_starter';
        }
        if (str_contains($name, 'starter') || str_contains($name, 'dinamo')) {
            return 'dinamo_starter';
        }

        // 6. Lampu & Saklar
        if (str_contains($name, 'sein') || str_contains($name, 'sign')) {
            return 'lampu_sein';
        }
        if (str_contains($name, 'lampu belakang') || str_contains($name, 'stop lamp')) {
            return 'lampu_belakang';
        }
        if (str_contains($name, 'lampu') || str_contains($name, 'bohlam') || str_contains($name, 'led')) {
            return 'lampu_depan';
        }
        if (str_contains($name, 'saklar') || str_contains($name, 'switch')) {
            return 'saklar';
        }
        if (str_contains($name, 'klakson') || str_contains($name, 'horn')) {
            return 'klakson';
        }

        // 7. Mesin & Filter
        if (str_contains($name, 'filter udara') || str_contains($name, 'saringan udara') || str_contains($name, 'air filter')) {
            return 'filter_udara';
        }
        if (str_contains($name, 'filter oli')) {
            return 'filter_oli';
        }
        if (str_contains($name, 'karburator')) {
            return 'karburator';
        }
        if (str_contains($name, 'injektor') || str_contains($name, 'injector')) {
            return 'injektor';
        }
        if (str_contains($name, 'piston') || str_contains($name, 'ring seher')) {
            return 'piston_kit';
        }
        if (str_contains($name, 'noken as') || str_contains($name, 'camshaft')) {
            return 'noken_as';
        }
        if (str_contains($name, 'klep') || str_contains($name, 'valve')) {
            return 'klep';
        }
        if (str_contains($name, 'rantai keteng') || str_contains($name, 'kamrat')) {
            return 'rantai_keteng';
        }
        if (str_contains($name, 'gasket') || str_contains($name, 'packing')) {
            return 'gasket_packing';
        }

        // 8. Bodi & Aksesoris
        if (str_contains($name, 'spion')) {
            return 'spion';
        }
        if (str_contains($name, 'handgrip') || str_contains($name, 'grip')) {
            return 'handgrip';
        }
        if (str_contains($name, 'handle rem') || str_contains($name, 'handle')) {
            return 'handle_rem';
        }
        if (str_contains($name, 'kabel gas')) {
            return 'kabel_gas';
        }
        if (str_contains($name, 'baut') || str_contains($name, 'mur') || str_contains($name, 'bolt') || str_contains($name, 'nut')) {
            return 'baut_mur';
        }

        return 'lainnya';
    }
}
