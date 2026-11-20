<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'categories' => Category::where('is_active', true)->orderBy('name')->get()
                ->map(fn (Category $c) => api_category($c))->values(),
        ]);
    }

    public function adminIndex(): JsonResponse
    {
        return response()->json([
            'categories' => Category::orderBy('name')->get()
                ->map(fn (Category $c) => api_category($c))->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'icon' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $category = Category::create($data);
        log_activity('category_created', "Created category: {$category->name}.", 'category', $category->id);

        return response()->json(['message' => 'Category created successfully.', 'category' => api_category($category)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name,'.$id],
            'icon' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $category->update($data);
        log_activity('category_updated', "Updated category: {$category->name}.", 'category', $category->id);

        return response()->json(['message' => 'Category updated successfully.', 'category' => api_category($category)]);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $name = $category->name;
        $category->delete();

        log_activity('category_deleted', "Deleted category: {$name}.", 'category', $id);

        return response()->json(['message' => 'Category deleted successfully.']);
    }
}