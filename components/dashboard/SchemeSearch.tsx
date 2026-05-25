'use client';

import { useEffect, useState } from 'react';
import { useSchemes } from '@/contexts/SchemesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SchemeSearch() {
  const {
    searchQuery,
    setSearchQuery,
    selectedFilters,
    setSelectedFilters,
    searchSchemes,
    isLoading,
    filterOptions,
  } = useSchemes();

  const [showFilters, setShowFilters] = useState(false);
  const activeFiltersCount =
    selectedFilters.category.length +
    selectedFilters.ministry.length +
    selectedFilters.state.length +
    selectedFilters.level.length +
    selectedFilters.type.length +
    (selectedFilters.minInvestment > 0 ? 1 : 0) +
    (selectedFilters.maxInvestment < 10000000 ? 1 : 0);

  // Initial load is handled by the dashboard page via loadSchemesForDashboard

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedFilters.category.includes(category)
      ? selectedFilters.category.filter((c) => c !== category)
      : [...selectedFilters.category, category];

    setSelectedFilters({ category: newCategories });
  };

  const handleMinistryToggle = (ministry: string) => {
    const newMinistries = selectedFilters.ministry.includes(ministry)
      ? selectedFilters.ministry.filter((m) => m !== ministry)
      : [...selectedFilters.ministry, ministry];

    setSelectedFilters({ ministry: newMinistries });
  };

  const handleStateToggle = (state: string) => {
    const newStates = selectedFilters.state.includes(state)
      ? selectedFilters.state.filter((s) => s !== state)
      : [...selectedFilters.state, state];

    setSelectedFilters({ state: newStates });
  };

  const handleLevelToggle = (level: string) => {
    const newLevels = selectedFilters.level.includes(level)
      ? selectedFilters.level.filter((l) => l !== level)
      : [...selectedFilters.level, level];

    setSelectedFilters({ level: newLevels });
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedFilters.type.includes(type)
      ? selectedFilters.type.filter((t) => t !== type)
      : [...selectedFilters.type, type];

    setSelectedFilters({ type: newTypes });
  };

  const handleClearFilters = () => {
    setSelectedFilters({
      category: [],
      ministry: [],
      state: [],
      level: [],
      type: [],
      minInvestment: 0,
      maxInvestment: 10000000,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search schemes by name or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground h-11"
          />
        </div>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters ? 'default' : 'outline'}
          className={`${
            showFilters
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'border-border text-foreground hover:bg-muted'
          }`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-accent text-accent-foreground px-2 py-0.5 rounded text-xs font-semibold">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-6 bg-card border-border space-y-6">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filterOptions.categories.map((category) => (
                <label
                  key={category}
                  className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedFilters.category.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ministries */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Ministries</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filterOptions.ministries.map((ministry) => (
                <label
                  key={ministry}
                  className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedFilters.ministry.includes(ministry)}
                    onChange={() => handleMinistryToggle(ministry)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground">{ministry}</span>
                </label>
              ))}
            </div>
          </div>

          {/* States */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">States</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filterOptions.states.map((state) => (
                <label
                  key={state}
                  className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedFilters.state.includes(state)}
                    onChange={() => handleStateToggle(state)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground">{state}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Scheme Level */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Scheme Level</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filterOptions.levels.map((level) => (
                <label
                  key={level}
                  className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedFilters.level.includes(level)}
                    onChange={() => handleLevelToggle(level)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Scheme Type */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Scheme Type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filterOptions.types.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedFilters.type.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Investment Range */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Investment Range</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Min Investment</label>
                <Input
                  type="number"
                  placeholder="₹0"
                  value={selectedFilters.minInvestment}
                  onChange={(e) =>
                    setSelectedFilters({ minInvestment: parseInt(e.target.value) || 0 })
                  }
                  className="bg-input border-border text-foreground text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Max Investment</label>
                <Input
                  type="number"
                  placeholder="₹10,000,000"
                  value={selectedFilters.maxInvestment}
                  onChange={(e) =>
                    setSelectedFilters({ maxInvestment: parseInt(e.target.value) || 10000000 })
                  }
                  className="bg-input border-border text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          {activeFiltersCount > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
