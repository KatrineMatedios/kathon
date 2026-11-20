<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('item_name');
            $table->text('description');
            $table->enum('item_type', ['lost', 'found']);
            $table->string('location');
            $table->date('lost_found_date');
            $table->dateTime('date_reported');
            $table->enum('item_status', ['pending', 'approved', 'rejected', 'returned', 'resolved'])->default('pending');
            $table->text('additional_information')->nullable();
            $table->timestamps();

            $table->index(['item_type', 'item_status']);
            $table->index('user_id');
            $table->index('category_id');
            $table->index('date_reported');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};