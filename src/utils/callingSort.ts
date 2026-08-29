import { Calling } from '../types';

/**
 * Organizations canonical order matching Church leadership structure
 */
export const ORGANIZATIONS_ORDER = [
  'Bishopric',
  'Elders Quorum',
  'Relief Society',
  'Aaronic Priesthood',
  'Young Women',
  'Sunday School',
  'Primary',
  'Ward Missionaries',
  'Temple & Family History',
  'Young Single Adult',
  'Other Callings'
];

/**
 * Returns organizational sort index (0 for Bishopric, 1 for EQ, etc.)
 */
export function getOrganizationRank(orgName: string): number {
  const index = ORGANIZATIONS_ORDER.indexOf(orgName);
  return index !== -1 ? index : 999;
}

/**
 * Returns sub-organization hierarchy priority
 */
export function getSubOrgRank(subOrg: string, organization?: string): number {
  const s = subOrg.toLowerCase();

  // Presidency always comes first
  if (s.includes('presidency') || s === 'bishopric') return 1;
  if (s.includes('secretar') || s.includes('clerk')) return 2;

  // Aaronic Priesthood subOrgs
  if (s.includes('priest')) return 10;
  if (s.includes('teacher') && organization === 'Aaronic Priesthood') return 11;
  if (s.includes('deacon')) return 12;

  // Young Women subOrgs
  if (s.includes('gatherers of light')) return 20;
  if (s.includes('messengers of hope')) return 21;
  if (s.includes('builders of faith')) return 22;

  // Sunday School subOrgs
  if (s.includes('adult sunday school')) return 30;
  if (s.includes('course 17')) return 31;
  if (s.includes('course 16')) return 32;
  if (s.includes('course 15')) return 33;
  if (s.includes('course 14')) return 34;
  if (s.includes('course 13')) return 35;
  if (s.includes('course 12')) return 36;
  if (s.includes('course 11')) return 37;

  // Primary subOrgs
  if (s.includes('music')) return 40;
  if (s.includes('valiant 10')) return 41;
  if (s.includes('valiant 9')) return 42;
  if (s.includes('valiant 8')) return 43;
  if (s.includes('valiant 7')) return 44;
  if (s.includes('ctr 6')) return 45;
  if (s.includes('ctr 5')) return 46;
  if (s.includes('ctr 4')) return 47;
  if (s.includes('sunbeam')) return 48;
  if (s.includes('nursery')) return 49;

  // General subOrgs
  if (s.includes('ministering')) return 50;
  if (s.includes('activit')) return 51;
  if (s.includes('service')) return 52;
  if (s.includes('welfare') || s.includes('self-reliance')) return 53;
  if (s.includes('temple preparation')) return 54;
  if (s.includes('resource center')) return 55;
  if (s.includes('facilities')) return 56;
  if (s.includes('additional')) return 70;

  return 60;
}

/**
 * Returns Calling Role Hierarchy Weight
 * 1. President / Bishop / Ward Leader (Rank 1 - 19)
 * 2. Counselors / Assistants (Rank 20 - 29)
 * 3. Secretaries & Clerks (Rank 30 - 39)
 * 4. Advisers / Advisors (Rank 40 - 49)
 * 5. Specialists / Coordinators / Directors / Leaders (Rank 50 - 59)
 * 6. Teachers / Instructors / Nursery (Rank 60 - 69)
 * 7. Other callings / Committee Members / Missionaries / Workers (Rank 70+)
 */
export function getCallingRoleRank(title: string): number {
  const t = title.toLowerCase().trim();

  // 1. PRESIDING LEADERS / PRESIDENTS
  if (t === 'bishop') return 1;
  if (
    t.includes('president') && 
    !t.includes('counselor') && 
    !t.includes('assistant') && 
    !t.includes('adviser') && 
    !t.includes('advisor')
  ) {
    if (
      t.startsWith('elders quorum president') ||
      t.startsWith('relief society president') ||
      t.startsWith('young women president') ||
      t.startsWith('primary president') ||
      t.startsWith('sunday school president')
    ) {
      return 2;
    }
    return 3; // Quorum or Class President (Teachers Quorum President, Deacons Quorum President, Class President)
  }
  if (t.includes('ward mission leader') && !t.includes('assistant')) return 4;
  if (t.includes('temple and family history leader') || t.includes('temple & family history leader')) return 5;
  if (t.includes('young single adult committee chair')) return 6;

  // 2. COUNSELORS / ASSISTANTS TO THE PRESIDENCY
  if (t.includes('first counselor') || t.includes('1st counselor') || t.includes('first assistant') || t.includes('1st assistant')) return 20;
  if (t.includes('second counselor') || t.includes('2nd counselor') || t.includes('second assistant') || t.includes('2nd assistant')) return 21;
  if (t.includes('assistant ward mission leader')) return 22;
  if (t.includes('counselor') || t.includes('assistant to the president')) return 23;

  // 3. SECRETARIES & CLERKS
  if (t.includes('executive secretary') && !t.includes('assistant')) return 30;
  if (t === 'ward clerk' || (t.includes('clerk') && !t.includes('assistant'))) return 31;
  if (t.includes('assistant executive secretary')) return 32;
  if (t.includes('assistant clerk--finance') || t.includes('assistant clerk - finance') || t.includes('finance clerk')) return 33;
  if (t.includes('assistant clerk')) return 34;
  if (t.includes('secretary') && !t.includes('assistant') && !t.includes('ministering') && !t.includes('adviser') && !t.includes('advisor')) return 35;
  if (t.includes('assistant secretary')) return 36;
  if (t.includes('ministering secretary')) return 37;

  // 4. ADVISERS / ADVISORS (Explicitly requested order: President -> Counselors -> Advisers -> Teachers & others)
  if (t.includes('adviser') || t.includes('advisor')) return 40;

  // 5. SPECIALISTS, COORDINATORS, DIRECTORS & MUSIC
  if (t.includes('coordinator') && !t.includes('assistant')) return 50;
  if (t.includes('assistant coordinator') || t.includes('assistant activity coordinator') || t.includes('assistant service coordinator')) return 51;
  if (t.includes('director') && !t.includes('assistant')) return 52;
  if (t.includes('assistant director') || t.includes('assistant camp director')) return 53;
  if (t.includes('music leader') || t.includes('pianist') || t.includes('organist') || t.includes('music coordinator') || t.includes('choir')) return 54;
  if (t.includes('activities leader') || t.includes('activity leader')) return 55;
  if (t.includes('young single adult leader') || t.includes('ysa leader')) return 56;
  if (t.includes('specialist')) return 57;
  if (t.includes('consultant')) return 58;
  if (t.includes('building representative') || t.includes('facilities manager')) return 59;
  if (t.includes('leader') && !t.includes('nursery') && !t.includes('mission') && !t.includes('music')) return 60;

  // 6. TEACHERS & INSTRUCTORS & NURSERY
  if (t.includes('teacher') || t.includes('instructor')) return 65;
  if (t.includes('nursery leader')) return 66;

  // 7. OTHER CALLINGS / COMMITTEE MEMBERS / MISSIONARIES / WORKERS
  if (t.includes('ward missionary') || t.includes('missionary')) return 70;
  if (t.includes('committee member')) return 71;
  if (t.includes('worker') || t.includes('indexing')) return 72;

  // Default catch-all
  return 80;
}

/**
 * Sort an array of callings based on:
 * 1. Organization Order (if comparing across different orgs)
 * 2. Sub-Organization Group Order
 * 3. Calling Role Rank (President -> Counselors -> Secretaries -> Advisers -> Specialists/Coordinators -> Teachers -> Other Callings)
 * 4. Title Alphabetical
 */
export function sortCallings(callings: Calling[]): Calling[] {
  return [...callings].sort((a, b) => {
    // 1. Organization
    const orgRankA = getOrganizationRank(a.organization);
    const orgRankB = getOrganizationRank(b.organization);
    if (orgRankA !== orgRankB) {
      return orgRankA - orgRankB;
    }

    // 2. Sub-Organization
    const subOrgRankA = getSubOrgRank(a.subOrg || '', a.organization);
    const subOrgRankB = getSubOrgRank(b.subOrg || '', b.organization);
    if (subOrgRankA !== subOrgRankB) {
      return subOrgRankA - subOrgRankB;
    }

    // 3. Calling Role Rank (President -> Counselors -> Secretaries -> Advisers -> Specialists -> Teachers -> Others)
    const roleRankA = getCallingRoleRank(a.title);
    const roleRankB = getCallingRoleRank(b.title);
    if (roleRankA !== roleRankB) {
      return roleRankA - roleRankB;
    }

    // 4. Alphabetical by Title
    const titleCompare = a.title.localeCompare(b.title);
    if (titleCompare !== 0) return titleCompare;

    // 5. Stable fallback by ID
    return a.id.localeCompare(b.id);
  });
}
