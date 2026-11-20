<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Claim;
use App\Models\Item;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@campusfind.local'],
            [
                'name' => 'Campus Administrator',
                'student_id' => 'ADMIN001',
                'password' => Hash::make('Admin@12345'),
                'role' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $student = User::firstOrCreate(
            ['email' => 'student@campusfind.local'],
            [
                'name' => 'Anne Student',
                'student_id' => 'STU2024001',
                'password' => Hash::make('Student@123'),
                'role' => 'student',
                'is_active' => true,
                'email_verified_at' => now(),
                'phone' => '0910 123 4567',
            ]
        );

        $juan = User::firstOrCreate(
            ['email' => 'juan@campusfind.local'],
            [
                'name' => 'Juan Dela Cruz',
                'student_id' => 'STU2024002',
                'password' => Hash::make('Student@123'),
                'role' => 'student',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $categoryNames = [
            'Electronics' => 'Smartphones, laptops, tablets and accessories',
            'Books & Notes' => 'Textbooks, notebooks and study materials',
            'Clothing' => 'Jackets, shirts, uniforms and accessories',
            'Bags & Wallets' => 'Backpacks, handbags, purses and wallets',
            'Keys & Cards' => 'Keys, ID cards and access cards',
            'Others' => 'Anything that does not fit the categories above',
        ];

        $categories = [];
        foreach ($categoryNames as $name => $description) {
            $categories[$name] = Category::firstOrCreate(
                ['name' => $name],
                ['description' => $description, 'icon' => Str::lower(Str::slug($name)), 'is_active' => true]
            );
        }

        if (Item::count() === 0) {
            $definitions = [
                [$student, 'Electronics', 'Black Wireless Headphones', 'Black over-ear wireless headphones with a slight scratch on the left cup. Includes the original charging cable.', 'lost', 'Main Library, 2nd Floor', 'approved', 2, 'Last seen near the study tables beside the windows.'],
                [$juan, 'Bags & Wallets', 'Brown Leather Wallet', 'A brown leather wallet containing student ID and a few cards. No cash reported.', 'found', 'Cafeteria Entrance', 'approved', 1, 'Handed to the cafeteria staff desk.'],
                [$student, 'Books & Notes', 'Calculus Textbook', 'Calculus for Engineers, 5th edition. Name written on the inside cover.', 'lost', 'Engineering Building, Room 204', 'pending', 4, null],
                [$juan, 'Keys & Cards', 'Keychain with Blue Tag', 'A set of three keys with a blue campus dormitory tag.', 'found', 'Dormitory B Lobby', 'approved', 3, 'Found near the entrance door.'],
                [$student, 'Clothing', 'Cream Hoodie', 'Cream-colored hoodie with a small logo on the sleeve.', 'found', 'Gymnasium', 'returned', 6, 'Returned to its owner after verification.'],
                [$juan, 'Electronics', 'Silver Flash Drive', 'A 32GB silver USB flash drive with a keychain attachment.', 'lost', 'Computer Laboratory 3', 'pending', 1, null],
            ];

            foreach ($definitions as [$owner, $categoryName, $name, $description, $type, $location, $status, $daysAgo, $extra]) {
                Item::create([
                    'user_id' => $owner->id,
                    'category_id' => $categories[$categoryName]->id,
                    'item_name' => $name,
                    'description' => $description,
                    'item_type' => $type,
                    'location' => $location,
                    'lost_found_date' => now()->subDays($daysAgo),
                    'date_reported' => now()->subDays(max(0, $daysAgo - 1)),
                    'item_status' => $status,
                    'additional_information' => $extra,
                ]);
            }
        }

        $wallet = Item::where('item_name', 'Brown Leather Wallet')->first();
        if ($wallet && Claim::count() === 0) {
            Claim::create([
                'item_id' => $wallet->id,
                'claimant_id' => $student->id,
                'reason' => 'The wallet contains my student ID with the name Anne Student. I misplaced it near the cafeteria yesterday.',
                'status' => 'pending',
                'verification_code' => strtoupper(Str::random(6)),
            ]);
        }

        if (Notification::count() === 0) {
            Notification::create([
                'user_id' => $student->id,
                'type' => 'welcome',
                'title' => 'Welcome to CampusFind!',
                'message' => 'Start by reporting a lost item or browsing recently found items.',
            ]);
            Notification::create([
                'user_id' => $student->id,
                'type' => 'report_approved',
                'title' => 'Report approved',
                'message' => 'Your report for Black Wireless Headphones has been approved and is now visible to other students.',
                'is_read' => true,
            ]);
        }

        if (ActivityLog::count() === 0) {
            ActivityLog::create([
                'user_id' => $student->id,
                'action' => 'registered',
                'description' => 'Created a new student account.',
            ]);
            ActivityLog::create([
                'user_id' => $student->id,
                'action' => 'report_submitted',
                'description' => 'Submitted lost report: Black Wireless Headphones.',
            ]);
        }
    }
}
