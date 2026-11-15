import { useState } from "react";
import { Search } from "lucide-react";
import type { CategoryDto } from "@whitemerce/shared/types";

interface ProductFilterBarProps {
  categories: CategoryDto[];
  initialQuery: string;
  initialCategory: string;
  initialSort: string;
}

export function ProductFilterBar({
  categories,
  initialQuery,
  initialCategory,
  initialSort,
}: ProductFilterBarProps) {
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);

  function applyFilters(nextQuery = q, nextCategory = category, nextSort = sort) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory) params.set("category", nextCategory);
    if (nextSort && nextSort !== "newest") params.set("sort", nextSort);
    const qs = params.toString();
    window.location.href = qs ? `/products?${qs}` : "/products";
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
        className="flex flex-1 items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search WhiteMerce catalog..."
            className="w-full rounded-xl border border-stone-300 bg-stone-50/70 py-2 pr-3.5 pl-10 text-sm outline-none focus:border-stone-950 focus:bg-white"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-stone-950 px-4 py-2 text-xs font-medium text-white hover:bg-stone-800"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(event) => {
            const nextCat = event.target.value;
            setCategory(nextCat);
            applyFilters(q, nextCat, sort);
          }}
          className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-800 outline-none focus:border-stone-950"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Sort products"
          value={sort}
          onChange={(event) => {
            const nextSort = event.target.value;
            setSort(nextSort);
            applyFilters(q, category, nextSort);
          }}
          className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-800 outline-none focus:border-stone-950"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
        </select>
      </div>
    </div>
  );
}
