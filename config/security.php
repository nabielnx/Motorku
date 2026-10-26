<?php

declare(strict_types=1);

return [
    // Set false to investigate compatibility in Report-Only mode; local Vite is always Report-Only.
    'csp_enforce' => env('CSP_ENFORCE', true),
];
