import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  familySearchDefaults,
  validateSavedSearchConfig,
  type SavedSearchConfig
} from './search-config.js';

describe('SavedSearchConfig validation', () => {
  it('accepts the initial family search defaults', () => {
    const result = validateSavedSearchConfig(familySearchDefaults);

    assert.deepEqual(result, { valid: true, issues: [] });
  });

  it('reports invalid ranges and score-weight totals', () => {
    const invalid: SavedSearchConfig = {
      ...familySearchDefaults,
      geography: {
        ...familySearchDefaults.geography,
        radiusMiles: 0
      },
      budgets: {
        cashTarget: 15000,
        stretchTarget: 10000
      },
      filters: {
        ...familySearchDefaults.filters,
        minYear: 2022,
        maxYear: 2020
      },
      scoring: {
        ...familySearchDefaults.scoring,
        vehicleWeights: {
          ...familySearchDefaults.scoring.vehicleWeights,
          trimUsefulFeatures: 10
        }
      }
    };

    const result = validateSavedSearchConfig(invalid);

    assert.equal(result.valid, false);
    assert.match(
      result.issues.map((issue) => issue.path).join('\n'),
      /geography\.radiusMiles/
    );
    assert.match(
      result.issues.map((issue) => issue.path).join('\n'),
      /budgets\.cashTarget/
    );
    assert.match(
      result.issues.map((issue) => issue.path).join('\n'),
      /filters\.minYear/
    );
    assert.match(
      result.issues.map((issue) => issue.path).join('\n'),
      /scoring\.vehicleWeights/
    );
  });
});
