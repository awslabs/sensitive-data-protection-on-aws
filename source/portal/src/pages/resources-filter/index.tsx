import React from 'react';
import PropertyFilter from '@cloudscape-design/components/property-filter';
import { deepClone } from 'tools/tools';
import { ResourcesFilterProps } from 'ts/resources-filter/types';
import { PROPERTY_FILTERING_I18N_CONSTANTS } from './config';
import { useDistributionsPropertyFiltering } from './hook';

const DEFAULT_FILTER = ['='];

/**
 * Data text filter
 * @returns
 */
const ResourcesFilter: React.FC<ResourcesFilterProps> = (
  props: ResourcesFilterProps
) => {
  const {
    totalCount,
    columnList,
    className,
    tableName,
    query,
    setQuery,
    filteringPlaceholder,
  } = props;

  const filterColumns = columnList?.map((item: { id: any; label: any }) => {
    return {
      key: item.id,
      operators: deepClone(DEFAULT_FILTER),
      propertyLabel: item.label,
      groupValuesLabel: `${item.label} values`,
    };
  });

  const {
    status: filteringStatus,
    filteringOptions,
    handleLoadItems,
  } = useDistributionsPropertyFiltering(tableName);

  const i18Info = PROPERTY_FILTERING_I18N_CONSTANTS;
  if (filteringPlaceholder) {
    i18Info.filteringPlaceholder = filteringPlaceholder;
  }

  return (
    <PropertyFilter
      className={className}
      onChange={({ detail }) => setQuery(detail)}
      query={query}
      i18nStrings={PROPERTY_FILTERING_I18N_CONSTANTS}
      countText={
        totalCount || totalCount === 0 ? `${totalCount} matches` : undefined
      }
      expandToViewport
      filteringOptions={filteringOptions} // 待筛选项
      filteringProperties={filterColumns as any}
      onLoadItems={handleLoadItems}
      filteringStatusType={filteringStatus as any}
    />
  );
};

export default ResourcesFilter;
