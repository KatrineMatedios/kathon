<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json([
            'categories' => Category::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80', 'unique:categories,name'],
            'icon' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $category = Category::create($data);
        log_activity('category_created', "Created category {$category->name}.", Auth::user(), Category::class, $category->id);

        return response()->json(['message' => 'Category created.', 'category' => $category], 201);
    }

    public function update(Request $request, int $id)
    {
        $category = Category::findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:80', 'unique:categories,name,'.$id],
            'icon' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $category->update($data);
        log_activity('category_updated', "Updated category {$category->name}.", Auth::user(), Category::class, $category->id);

        return response()->json(['message' => 'Category updated.', 'category' => $category]);
    }

    public function destroy(int $id)
    {
        $category = Category::findOrFail($id);
        $name = $category->name;
        $category->delete();

        log_activity('category_deleted', "Deleted category {$name}.", Auth::user(), Category::class, $id);

        return response()->json(['message' => 'Category deleted.']);
    }
}
