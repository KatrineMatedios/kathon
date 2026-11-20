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

        $other = User::firstOrCreate(
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
            $items = [
                [
                    'user_id' => $student->id,
                    'category_id' => $categories['Electronics']->id,
                    'item_name' => 'Black Wireless Headphones',
                    'description' => 'Black over-ear wireless headphones with a slight scratch on the left cup. Includes the original charging cable.',
                    'item_type' => 'lost',
                    'location' => 'Main Library, 2nd Floor',
                    'lost_found_date' => now()->subDays(2),
                    'item_status' => 'approved',
                    'additional_information' => 'Last seen near the study tables beside the windows.',
                ],
                [
                    'user_id' => $other->id,
                    'category_id' => $categories['Bags & Wallets']->id,
                    'item_name' => 'Brown Leather Wallet',
                    'description' => 'A brown leather wallet containing student ID and a few cards. No cash reported.',
                    'item_type' => 'found',
                    'location' => 'Cafeteria Entrance',
                    'lost_found_date' => now()->subDay(),
                    'item_status' => 'approved',
                    'additional_information' => 'Handed to the cafeteria staff desk.',
                ],
                [
                    'user_id' => $student->id,
                    'category_id' => $categories['Books & Notes']->id,
                    'item_name' => 'Calculus Textbook',
                    'description' => 'Calculus for Engineers, 5th edition. Name written on the inside cover.',
                    'item_type' => 'lost',
                    'location' => 'Engineering Building, Room 204',
                    'lost_found_date' => now()->subDays(4),
                    'item_status' => 'pending',
                    'additional_information' => null,
                ],
                [
                    'user_id' => $other->id,
                    'category_id' => $categories['Keys & Cards']->id,
                    'item_name' => 'Keychain with Blue Tag',
                    'description' => 'A set of three keys with a blue campus dormitory tag.',
                    'item_type' => 'found',
                    'location' => 'Dormitory B Lobby',
                    'lost_found_date' => now()->subDays(3),
                    'item_status' => 'approved',
                    'additional_information' => 'Found near the entrance door.',
                ],
                [
                    'user_id' => $student->id,
                    'category_id' => $categories['Clothing']->id,
                    'item_name' => 'Cream Hoodie',
                    'description' => 'Cream-colored hoodie with a small logo on the sleeve.',
                    'item_type' => 'found',
                    'location' => 'Gymnasium',
                    'lost_found_date' => now()->subDays(6),
                    'item_status' => 'returned',
                    'additional_information' => 'Returned to its owner after verification.',
                ],
                [
                    'user_id' => $other->id,
                    'category_id' => $categories['Electronics']->id,
                    'item_name' => 'Silver Flash Drive',
                    'description' => 'A 32GB silver USB flash drive with a keychain attachment.',
                    'item_type' => 'lost',
                    'location' => 'Computer Laboratory 3',
                    'lost_found_date' => now()->subDays(1),
                    'item_status' => 'pending',
                    'additional_information' => null,
                ],
            ];

            foreach ($items as $item) {
                $item['date_reported'] = now()->subDays(rand(0, 5));
                Item::create($item);
            }
        }

        $wallet = Item::where('item_name', 'Brown Leather Wallet')->first();

        if ($wallet && Claim::count() === 0) {
            Claim::create([
                'item_id' => $wallet->id,
                'claimant_id' => $student->id,
                'reason' => 'The wallet contains my student ID with the name Anne Student. I misplaced it near the cafeteria yesterday.',
                'status' => 'pending',
                'verification_code' => strtoupper(Str::random(10)),
            ]);
        }

        if (Notification::count() === 0) {
            Notification::create([
                'user_id' => $student->id,
                'type' => 'welcome',
                'title' => 'Welcome to CampusFind!',
                'message' => 'Start by reporting a lost item or browsing recently found items.',
                'is_read' => false,
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
