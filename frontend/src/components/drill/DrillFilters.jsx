import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { AGE_RANGES, FOCUS_AREAS, SKILL_LEVELS } from "../../lib/constants.js";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";

export default function DrillFilters({ filters, onFiltersChange }) {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const debounceRef = useRef(null);

  // Sync external filter changes back to local search state
  useEffect(() => {
    if (filters.search !== searchValue) {
      setSearchValue(filters.search || "");
    }
  }, [filters.search]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearchValue(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value, page: 1 });
    }, 300);
  }

  function handleSelectChange(key, value) {
    onFiltersChange({ ...filters, [key]: value || undefined, page: 1 });
  }

  function clearFilters() {
    setSearchValue("");
    onFiltersChange({});
  }

  const hasActiveFilters =
    filters.search ||
    filters.age_range ||
    filters.skill_level ||
    filters.focus_area ||
    filters.sort_by;

  const selectClasses =
    "bg-surface2 border border-border-color text-sm text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search drills..."
          value={searchValue}
          onChange={handleSearchChange}
          icon={Search}
        />
      </div>

      {/* Age Range */}
      <select
        aria-label="Filter by age range"
        className={selectClasses}
        value={filters.age_range || ""}
        onChange={(e) => handleSelectChange("age_range", e.target.value)}
      >
        <option value="">All Ages</option>
        {AGE_RANGES.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>

      {/* Skill Level */}
      <select
        aria-label="Filter by skill level"
        className={selectClasses}
        value={filters.skill_level || ""}
        onChange={(e) => handleSelectChange("skill_level", e.target.value)}
      >
        <option value="">All Levels</option>
        {SKILL_LEVELS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Focus Area */}
      <select
        aria-label="Filter by focus area"
        className={selectClasses}
        value={filters.focus_area || ""}
        onChange={(e) => handleSelectChange("focus_area", e.target.value)}
      >
        <option value="">All Areas</option>
        {FOCUS_AREAS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        aria-label="Sort drills"
        className={selectClasses}
        value={filters.sort_by || "newest"}
        onChange={(e) =>
          handleSelectChange(
            "sort_by",
            e.target.value === "newest" ? undefined : e.target.value,
          )
        }
      >
        <option value="newest">Newest</option>
        <option value="most_liked">Most Liked</option>
      </select>

      {/* Clear button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="md"
          onClick={clearFilters}
          className="text-text-muted"
        >
          <X className="w-4 h-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
