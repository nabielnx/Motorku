<?php

declare(strict_types=1);

namespace Tests\Feature\Customer;

use App\Http\Middleware\EnsureCustomerAuthenticated;
use App\Models\CustomerAccount;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Notifications\CustomerResetPassword;
use App\Notifications\CustomerVerifyEmail;
use App\Services\BusinessContext;
use App\Services\BusinessOnboardingService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\User as GoogleUser;
use Mockery;
use Tests\TestCase;

final class CustomerAccountTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    private function customer(string $email = 'buyer@example.test'): CustomerAccount
    {
        return CustomerAccount::create(['name' => 'Pembeli', 'email' => $email, 'password' => 'Strong@1234']);
    }

    private function login(CustomerAccount $customer, string $shop = ''): void
    {
        $this->post('/customer/login'.$shop, ['email' => $customer->email, 'password' => 'Strong@1234'])->assertRedirect();
    }

    private function payload(Product $product): array
    {
        return ['request_id' => (string) Str::uuid(), 'customer_name' => 'Pembeli QA', 'customer_phone' => '08123456789',
            'items' => [['product_id' => $product->id, 'quantity' => 1]]];
    }

    public function test_registration_creates_a_customer_without_creating_a_business_or_admin(): void
    {
        $this->post('/customer/register', [
            'name' => 'Pelanggan', 'email' => 'BUYER@example.test', 'password' => 'Strong@1234', 'password_confirmation' => 'Strong@1234',
        ])->assertRedirect('/customer/account');
        $customer = CustomerAccount::sole();
        $this->assertSame('buyer@example.test', $customer->email);
        $this->assertAuthenticatedAs($customer, 'customer');
        $this->assertGuest('web');
        $this->assertDatabaseCount('businesses', 1);
        $this->assertDatabaseCount('users', 0);
        Notification::assertSentTo($customer, CustomerVerifyEmail::class);
        $this->get('/')->assertInertia(fn ($page) => $page->where('customer.id', $customer->id)->where('auth.user', null));
        $this->get('/dashboard')->assertRedirect('/login?expired=1');
        $this->getJson('/api/settings')->assertUnauthorized();
    }

    public function test_invalid_customer_login_is_rejected_and_rate_limited(): void
    {
        $customer = $this->customer();
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->post('/customer/login', ['email' => $customer->email, 'password' => 'wrong'])->assertSessionHasErrors('email');
        }
        $this->post('/customer/login', ['email' => $customer->email, 'password' => 'wrong'])->assertStatus(429);
        $this->assertGuest('customer');
    }

    public function test_guest_checkout_still_works_and_ignores_supplied_account_ids(): void
    {
        $product = Product::factory()->create(['stock' => 10]);
        $customer = $this->customer();
        $data = $this->postJson('/customer/checkout', [...$this->payload($product), 'customer_account_id' => $customer->id])->assertCreated()->json('data');
        $this->assertDatabaseHas('orders', ['id' => $data['id'], 'customer_account_id' => null]);
        $this->assertNotEmpty($data['customer_token']);
        $this->getJson('/api/customer/order/'.$data['id'].'/status', ['X-Customer-Token' => $data['customer_token']])->assertOk();
    }

    public function test_signed_in_checkout_saves_contact_and_history_without_giving_admin_access(): void
    {
        $product = Product::factory()->create(['stock' => 10]);
        $customer = $this->customer();
        $this->login($customer);
        $payload = $this->payload($product);
        $data = $this->postJson('/customer/checkout', $payload)->assertCreated()->json('data');
        $this->postJson('/customer/checkout', $payload)->assertCreated()->assertJsonPath('data.id', $data['id']);
        $this->assertDatabaseHas('orders', ['id' => $data['id'], 'customer_account_id' => $customer->id, 'cashier_id' => null, 'customer_phone' => '08123456789']);
        $this->assertDatabaseHas('customer_profiles', ['customer_account_id' => $customer->id, 'name' => 'Pembeli QA', 'phone' => '08123456789']);
        $this->getJson('/customer/orders')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $data['id'])->assertJsonMissingPath('data.0.customer_token');
        $this->getJson('/customer/orders/'.$data['id'])->assertOk()->assertJsonPath('data.customer_token', $data['customer_token']);
        $this->assertSame(9, $product->fresh()->stock);
        $this->post('/customer/logout')->assertRedirect('/');
        $this->getJson('/customer/orders')->assertUnauthorized();
        $this->login($customer); // Simulates another authenticated browser with no saved receipt.
        $this->getJson('/customer/orders/'.$data['id'])->assertOk();
    }

    public function test_history_never_uses_email_or_phone_to_claim_guest_or_other_customer_orders(): void
    {
        $customer = $this->customer();
        $other = $this->customer('other@example.test');
        $guest = Order::factory()->create(['customer_name' => $customer->name, 'customer_phone' => '08123456789']);
        $otherOrder = Order::factory()->create(['customer_account_id' => $other->id]);
        $this->login($customer);
        $this->getJson('/customer/orders')->assertOk()->assertJsonPath('total', 0);
        foreach ([$guest, $otherOrder] as $order) {
            $this->getJson('/customer/orders/'.$order->id)->assertNotFound();
        }
    }

    public function test_same_customer_has_separate_history_and_contact_profiles_in_each_store(): void
    {
        $this->seed(RoleSeeder::class);
        $ownerB = app(BusinessOnboardingService::class)->register([
            'name' => 'Owner B', 'email' => 'b@example.test', 'password' => 'Strong@1234', 'business_name' => 'Toko B', 'business_slug' => 'toko-customer-b',
        ], ['id' => 'owner-b', 'email' => 'b@example.test', 'trusted_email' => true]);
        $customer = $this->customer();
        $a = Order::factory()->create(['customer_account_id' => $customer->id]);
        $b = app(BusinessContext::class)->run($ownerB->business_id, fn () => Order::factory()->create(['customer_account_id' => $customer->id, 'cashier_id' => $ownerB->id]));
        $this->login($customer);
        $this->getJson('/customer/orders')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $a->id);
        $this->getJson('/customer/orders/'.$b->id)->assertNotFound();
        $this->getJson('/customer/orders?shop=toko-customer-b')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $b->id);
        $this->getJson('/customer/orders/'.$a->id.'?shop=toko-customer-b')->assertNotFound();
        $this->patch('/customer/account', ['name' => 'Nama A', 'phone' => '08111111111'])->assertSessionHasNoErrors();
        $this->patch('/customer/account?shop=toko-customer-b', ['name' => 'Nama B', 'phone' => '08222222222'])->assertSessionHasNoErrors();
        $this->get('/customer/account')->assertInertia(fn ($page) => $page->where('customer.name', 'Nama A')->where('customer.phone', '08111111111'));
        $this->get('/customer/account?shop=toko-customer-b')->assertInertia(fn ($page) => $page->where('customer.name', 'Nama B')->where('customer.phone', '08222222222'));
    }

    public function test_customer_can_share_an_email_with_owner_without_linking_their_accounts(): void
    {
        $this->seed(RoleSeeder::class);
        $owner = User::factory()->create(['email' => 'same@example.test']);
        $owner->assignRole('owner');
        $customer = $this->customer('same@example.test');
        $this->actingAs($owner);
        $this->login($customer);
        $this->assertAuthenticatedAs($owner, 'web');
        $this->post('/customer/logout')->assertRedirect('/');
        $this->assertGuest('customer');
        $this->assertAuthenticatedAs($owner, 'web');
    }

    public function test_history_filters_before_pagination_and_counts_only_owned_store_orders(): void
    {
        $customer = $this->customer();
        $staff = User::factory()->create();
        Order::factory()->count(21)->completed()->create(['cashier_id' => $staff->id, 'customer_account_id' => $customer->id]);
        $active = Order::factory()->create(['cashier_id' => $staff->id, 'customer_account_id' => $customer->id, 'created_at' => now()->subYear()]);
        $this->login($customer);
        $this->getJson('/customer/orders')->assertOk()->assertJsonPath('total', 22)->assertJsonCount(20, 'data')->assertJsonPath('last_page', 2);
        $this->getJson('/customer/orders?filter=active')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $active->id)
            ->assertJsonPath('counts.all', 22)->assertJsonPath('counts.active', 1)->assertJsonPath('counts.closed', 21);
    }

    public function test_checkout_is_csrf_protected_and_cannot_associate_an_order_from_a_cross_site_post(): void
    {
        $customer = $this->customer();
        $product = Product::factory()->create();
        $this->login($customer);
        app()->detectEnvironment(fn () => 'production');
        $this->postJson('/customer/checkout', $this->payload($product))->assertStatus(419);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_password_recovery_uses_customer_only_broker_and_revokes_existing_customer_sessions(): void
    {
        $customer = $this->customer();
        $token = Password::broker('customers')->createToken($customer);
        $this->login($customer);
        $this->post('/customer/reset-password', [
            'email' => $customer->email, 'token' => $token, 'password' => 'New@Strong123', 'password_confirmation' => 'New@Strong123',
        ])->assertRedirect('/customer/login');
        Auth::forgetGuards();
        $this->getJson('/customer/orders')->assertUnauthorized();
        $this->post('/customer/login', ['email' => $customer->email, 'password' => 'Strong@1234'])->assertSessionHasErrors('email');
        $this->post('/customer/login', ['email' => $customer->email, 'password' => 'New@Strong123'])->assertRedirect('/customer/account');
        $this->assertDatabaseCount('users', 0);
    }

    public function test_password_reset_and_verification_emails_use_customer_routes(): void
    {
        $customer = $this->customer();
        $this->post('/customer/forgot-password', ['email' => $customer->email])->assertSessionHas('success');
        Notification::assertSentTo($customer, CustomerResetPassword::class, fn ($notification) => str_contains($notification->toMail($customer)->actionUrl, '/customer/reset-password/'));
        $this->login($customer);
        $this->post('/customer/verification-notification')->assertRedirect();
        Notification::assertSentTo($customer, CustomerVerifyEmail::class, fn ($notification) => str_contains($notification->toMail($customer)->actionUrl, '/customer/verify-email/'));
        $url = URL::temporarySignedRoute('customer.verification.verify', now()->addMinutes(10), ['id' => $customer->id, 'hash' => sha1($customer->email)]);
        $this->get($url)->assertRedirect('/customer/account');
        $this->assertTrue($customer->fresh()->hasVerifiedEmail());
    }

    public function test_google_customer_signup_creates_no_business_and_preserves_store_and_checkout_return(): void
    {
        $this->googleIdentity();
        $this->withSession(['google_oauth' => ['kind' => 'customer', 'customer_id' => null, 'started_at' => time(), 'shop' => 'toko-utama', 'return' => '/payment']])
            ->get('/auth/google/callback')->assertRedirect('/payment?shop=toko-utama');
        $customer = CustomerAccount::sole();
        $this->assertAuthenticatedAs($customer, 'customer');
        $this->assertGuest('web');
        $this->assertDatabaseCount('businesses', 1);
        $this->assertDatabaseCount('users', 0);
        $this->assertTrue($customer->hasVerifiedEmail());
    }

    public function test_google_never_silently_links_an_existing_customer_email(): void
    {
        $this->customer('buyer@gmail.com');
        $this->googleIdentity();
        $this->withSession(['google_oauth' => ['kind' => 'customer', 'customer_id' => null, 'started_at' => time()]])
            ->get('/auth/google/callback')->assertRedirect('/customer/login')->assertSessionHasErrors('google');
        $this->assertGuest('customer');
        $this->assertNull(CustomerAccount::sole()->google_id);
    }

    public function test_google_link_requires_password_and_then_logs_in_to_the_same_customer(): void
    {
        config(['services.google.client_id' => 'test-client', 'services.google.client_secret' => 'test-secret']);
        $customer = $this->customer('buyer@gmail.com');
        $this->login($customer);
        $this->post('/customer/google/link', ['current_password' => 'wrong'])->assertSessionHasErrors('current_password');
        $this->googleIdentity();
        $this->withSession(['google_oauth' => ['kind' => 'customer', 'customer_id' => $customer->id, 'started_at' => time()]])
            ->get('/auth/google/callback')->assertRedirect('/customer/account');
        $this->assertSame('customer-google-123', $customer->fresh()->google_id);
        $this->assertDatabaseCount('customer_accounts', 1);
    }

    public function test_google_customer_redirect_uses_existing_callback_state_and_pkce(): void
    {
        config(['services.google.client_id' => 'test-client', 'services.google.client_secret' => 'test-secret']);
        $response = $this->get('/customer/google?shop=toko-utama')->assertRedirect();
        parse_str(parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
        $this->assertNotEmpty($query['state']);
        $this->assertSame('S256', $query['code_challenge_method']);
        $this->assertStringContainsString('/auth/google/callback', $query['redirect_uri']);
        $this->assertSame('customer', session('google_oauth.kind'));
        $this->assertSame('toko-utama', session('google_oauth.shop'));
    }

    public function test_customer_login_ignores_external_return_url(): void
    {
        $customer = $this->customer();
        $this->get('/customer/login?return=https://evil.example')->assertOk();
        $this->login($customer);
        $this->get('/customer/account')->assertOk();
        $this->assertContains(EnsureCustomerAuthenticated::class, app('router')->gatherRouteMiddleware(app('router')->getRoutes()->getByName('customer.orders')));
    }

    private function googleIdentity(): void
    {
        config(['services.google.client_id' => 'test-client', 'services.google.client_secret' => 'test-secret']);
        $user = (new GoogleUser)->setRaw(['email_verified' => true])->map(['id' => 'customer-google-123', 'email' => 'buyer@gmail.com', 'name' => 'Pembeli Google']);
        $provider = Mockery::mock(GoogleProvider::class);
        $provider->shouldReceive('enablePKCE')->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($user);
        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
        Socialite::shouldReceive('forgetDrivers')->andReturnSelf();
    }
}
