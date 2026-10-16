<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_scripts_have_the_response_nonce_and_each_document_gets_a_new_nonce(): void
    {
        $first = $this->get('/login')->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
            ->assertHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
        $policy = $first->headers->get('Content-Security-Policy');
        preg_match("/'nonce-([^']+)'/", $policy, $match);
        $this->assertNotEmpty($match[1] ?? null);
        preg_match_all('/<script\b([^>]*)>/i', $first->getContent(), $scripts);
        $this->assertNotEmpty($scripts[1]);
        foreach ($scripts[1] as $attributes) {
            $this->assertStringContainsString('nonce="'.$match[1].'"', $attributes);
        }
        $this->assertStringNotContainsString('onload=', $first->getContent());
        $this->assertStringContainsString("object-src 'none'", $policy);
        $this->assertStringContainsString("media-src 'self' blob:", $policy);
        $second = $this->get('/login')->assertOk();
        $this->assertStringNotContainsString($match[1], $second->headers->get('Content-Security-Policy'));
    }

    public function test_authentication_validation_and_not_found_errors_retain_the_security_headers(): void
    {
        $this->getJson('/api/users')->assertUnauthorized()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->postJson('/api/customer/order', [])->assertUnprocessable()->assertHeader('Content-Security-Policy');
        $this->get('/not-a-route-for-security-test')->assertNotFound()->assertHeader('Referrer-Policy');
    }

    public function test_report_only_mode_and_https_staging_hsts_are_scoped(): void
    {
        config(['security.csp_enforce' => false]);
        $this->get('/login')->assertHeader('Content-Security-Policy-Report-Only')->assertHeaderMissing('Strict-Transport-Security');
        $this->app->detectEnvironment(fn () => 'staging');
        $response = $this->get('https://localhost/login')->assertOk();
        $response->assertHeader('Strict-Transport-Security', 'max-age=86400');
        $this->assertStringNotContainsString('includeSubDomains', $response->headers->get('Strict-Transport-Security'));
    }
}
