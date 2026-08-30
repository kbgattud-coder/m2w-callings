import React, { useState, useMemo } from 'react';
import { Calling } from '../types';
import { calculateTenure, formatDateForDisplay } from '../utils/tenure';
import { 
  Clock, 
  Search, 
  Filter, 
  ArrowUpRight, 
  UserCheck, 
  Sparkles,
  Calendar,
  Building2,
  ChevronRight,
  Info
} from 'lucide-react';

interface AnalyticsViewProps {
  callings: Calling[];
  onSelectCalling: (calling: Calling) => void;
  onProposeForCalling: (calling: Calling) => void;
}

type TenureBracket = 'all' | '0_6_months' | '6_24_months' | '2_3_years' | '3_plus_years';

interface MemberTenureItem {
  calling: Calling;
  tenure: ReturnType<typeof calculateTenure>;
  bracket: TenureBracket;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  callings,
  onSelectCalling,
  onProposeForCalling,
}) => {
  // Active selected tenure bracket (defaults to 3+ Years)
  const [selectedBracket, setSelectedBracket] = useState<TenureBracket>('3_plus_years');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('All');

  // Process all filled callings and calculate tenure
  const allTenureItems: MemberTenureItem[] = useMemo(() => {
    const items: MemberTenureItem[] = [];

    callings.forEach((calling) => {
      if (!calling.isVacant && calling.sustainedDate && calling.memberName) {
        const tenure = calculateTenure(calling.sustainedDate);
        let bracket: TenureBracket = '0_6_months';

        if (tenure.totalMonths < 6) {
          bracket = '0_6_months';
        } else if (tenure.totalMonths < 24) {
          bracket = '6_24_months';
        } else if (tenure.totalMonths < 36) {
          bracket = '2_3_years';
        } else {
          bracket = '3_plus_years';
        }

        items.push({
          calling,
          tenure,
          bracket,
        });
      }
    });

    // Sort by longest tenure first
    return items.sort((a, b) => b.tenure.totalMonths - a.tenure.totalMonths);
  }, [callings]);

  // Counts per bracket
  const counts = useMemo(() => {
    return {
      all: allTenureItems.length,
      '0_6_months': allTenureItems.filter((i) => i.bracket === '0_6_months').length,
      '6_24_months': allTenureItems.filter((i) => i.bracket === '6_24_months').length,
      '2_3_years': allTenureItems.filter((i) => i.bracket === '2_3_years').length,
      '3_plus_years': allTenureItems.filter((i) => i.bracket === '3_plus_years').length,
    };
  }, [allTenureItems]);

  // Unique organizations with filled callings
  const organizationsList = useMemo(() => {
    const set = new Set<string>();
    allTenureItems.forEach((item) => set.add(item.calling.organization));
    return ['All', ...Array.from(set).sort()];
  }, [allTenureItems]);

  // Filtered list based on selected bracket, search query, and org filter
  const displayedItems = useMemo(() => {
    return allTenureItems.filter((item) => {
      // Bracket filter
      if (selectedBracket !== 'all' && item.bracket !== selectedBracket) {
        return false;
      }

      // Organization filter
      if (selectedOrgFilter !== 'All' && item.calling.organization !== selectedOrgFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = item.calling.memberName?.toLowerCase().includes(query);
        const titleMatch = item.calling.title.toLowerCase().includes(query);
        const orgMatch = item.calling.organization.toLowerCase().includes(query);
        if (!nameMatch && !titleMatch && !orgMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allTenureItems, selectedBracket, selectedOrgFilter, searchQuery]);

  // Helper for bracket labels and styles
  const getBracketInfo = (bracket: TenureBracket) => {
    switch (bracket) {
      case '0_6_months':
        return {
          title: '0 – 6 Months',
          subtitle: 'Recently Called',
          description: 'Members called within the last 6 months.',
          color: 'emerald',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case '6_24_months':
        return {
          title: '6 – 24 Months',
          subtitle: 'Standard Serving Term',
          description: 'Members actively serving within typical ward tenure.',
          color: 'blue',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case '2_3_years':
        return {
          title: '2 – 3 Years',
          subtitle: '24 to 35 Months',
          description: 'Approaching long-term service period.',
          color: 'amber',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case '3_plus_years':
        return {
          title: '3+ Years',
          subtitle: '36+ Months (Extended)',
          description: 'Long-serving members recommended for bishopric review.',
          color: 'purple',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      default:
        return {
          title: 'All Serving Members',
          subtitle: 'Complete Ward Roster',
          description: 'All currently filled calling positions across the ward.',
          color: 'slate',
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  const currentInfo = getBracketInfo(selectedBracket);

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-700 dark:text-purple-300">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Length of Service &amp; Tenure Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Click on any tenure distribution card below to explore and review ward members serving within that timeframe.
          </p>
        </div>

        {/* Reset to All or Count Badge */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-filter-all-tenure"
            onClick={() => setSelectedBracket(selectedBracket === 'all' ? '3_plus_years' : 'all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              selectedBracket === 'all'
                ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {selectedBracket === 'all' ? '✓ Showing All' : `Show All (${counts.all})`}
          </button>
        </div>
      </div>

      {/* 4 Interactive Length of Service Distribution Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: 0 - 6 Months */}
        <button
          id="card-tenure-0-6mos"
          type="button"
          onClick={() => setSelectedBracket('0_6_months')}
          className={`text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden group cursor-pointer ${
            selectedBracket === '0_6_months'
              ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/80 px-2 py-0.5 rounded-md">
              0 – 6 Months
            </span>
            {selectedBracket === '0_6_months' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {counts['0_6_months']}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">members</span>
          </div>
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mt-1">Recently called</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">&lt; 6 months of service</p>
        </button>

        {/* Card 2: 6 - 24 Months */}
        <button
          id="card-tenure-6-24mos"
          type="button"
          onClick={() => setSelectedBracket('6_24_months')}
          className={`text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden group cursor-pointer ${
            selectedBracket === '6_24_months'
              ? 'bg-white dark:bg-slate-800 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/80 px-2 py-0.5 rounded-md">
              6 – 24 Months
            </span>
            {selectedBracket === '6_24_months' && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {counts['6_24_months']}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">members</span>
          </div>
          <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mt-1">Standard serving term</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">0.5 to 2 years</p>
        </button>

        {/* Card 3: 2 - 3 Years */}
        <button
          id="card-tenure-2-3yrs"
          type="button"
          onClick={() => setSelectedBracket('2_3_years')}
          className={`text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden group cursor-pointer ${
            selectedBracket === '2_3_years'
              ? 'bg-white dark:bg-slate-800 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/70 border border-amber-200/60 dark:border-amber-800/80 px-2 py-0.5 rounded-md">
              2 – 3 Years
            </span>
            {selectedBracket === '2_3_years' && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {counts['2_3_years']}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">members</span>
          </div>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mt-1">24 to 35 months</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Approaching 3 years</p>
        </button>

        {/* Card 4: 3+ Years */}
        <button
          id="card-tenure-3plus-yrs"
          type="button"
          onClick={() => setSelectedBracket('3_plus_years')}
          className={`text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden group cursor-pointer ${
            selectedBracket === '3_plus_years'
              ? 'bg-white dark:bg-slate-800 border-purple-500 ring-2 ring-purple-500/20 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/70 border border-purple-200/60 dark:border-purple-800/80 px-2 py-0.5 rounded-md">
              3+ Years
            </span>
            {selectedBracket === '3_plus_years' && (
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            )}
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {counts['3_plus_years']}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">members</span>
          </div>
          <p className="text-xs font-medium text-purple-800 dark:text-purple-300 mt-1">Extended service</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">36+ months (Review recommended)</p>
        </button>

      </div>

      {/* Members Section for Selected Bracket */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        
        {/* Section Header & Controls */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {currentInfo.title}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentInfo.badgeClass}`}>
                {displayedItems.length} {displayedItems.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentInfo.description}
            </p>
          </div>

          {/* Search & Org Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member or calling..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Org Dropdown Filter */}
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedOrgFilter}
                onChange={(e) => setSelectedOrgFilter(e.target.value)}
                className="text-xs bg-transparent border-none focus:outline-none font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {organizationsList.map((org) => (
                  <option key={org} value={org} className="dark:bg-slate-800">
                    {org === 'All' ? 'All Organizations' : org}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="p-5">
          {displayedItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedItems.map(({ calling, tenure }) => {
                // Determine tenure tag color
                let tenureColor = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
                if (tenure.totalMonths >= 36) {
                  tenureColor = 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/80';
                } else if (tenure.totalMonths >= 24) {
                  tenureColor = 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80';
                } else if (tenure.totalMonths >= 6) {
                  tenureColor = 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/80';
                } else {
                  tenureColor = 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80';
                }

                return (
                  <div
                    key={calling.id}
                    className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-all flex flex-col justify-between space-y-3 group shadow-2xs"
                  >
                    <div>
                      {/* Top Org & Tenure Pill */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                          {calling.organization}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${tenureColor}`}>
                          {tenure.displayText}
                        </span>
                      </div>

                      {/* Member Name & Calling Title */}
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {calling.memberName}
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                        {calling.title}
                      </p>
                      {calling.subOrg && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {calling.subOrg}
                        </p>
                      )}

                      {/* Sustained Date */}
                      <div className="mt-2.5 flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sustained: {formatDateForDisplay(calling.sustainedDate)}</span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectCalling(calling)}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        onClick={() => onProposeForCalling(calling)}
                        className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer"
                      >
                        <span>Propose</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Info className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">No members found</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedOrgFilter !== 'All'
                  ? 'No members in this tenure bracket match your search and filter criteria.'
                  : `There are currently no active members in the ${currentInfo.title} service bracket.`}
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
