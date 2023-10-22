import { S3ResourceSelectorProps } from '@cloudscape-design/components';

export const i18ns = {
  inContextBrowseButton: 'Browse S3',
  inContextViewButton: 'View',
  inContextInputPlaceholder: 's3://bucket/prefix/object',
  inContextInputClearAriaLabel: 'Clear',
  inContextSelectPlaceholder: 'Choose a version',
  inContextLoadingText: 'Loading resource',
  //  inContextUriLabel: 'S3 URI',
  inContextVersionSelectLabel: 'Object version',
  modalTitle: 'Choose simulation in S3',
  modalCancelButton: 'Cancel',
  modalSubmitButton: 'Choose',
  modalBreadcrumbRootItem: 'S3 buckets',
  selectionBuckets: 'Buckets',
  selectionObjects: 'Objects',
  selectionVersions: 'Versions',
  selectionBucketsSearchPlaceholder: 'Find bucket',
  selectionObjectsSearchPlaceholder: 'Find object by prefix',
  selectionVersionsSearchPlaceholder: 'Find version',
  selectionBucketsLoading: 'Loading buckets',
  selectionBucketsNoItems: 'No buckets',
  selectionObjectsLoading: 'Loading objects',
  selectionObjectsNoItems: 'No objects',
  selectionVersionsLoading: 'Loading versions',
  selectionVersionsNoItems: 'No versions',
  filteringCounterText: (count: number) =>
    `${count} ${count === 1 ? 'match' : 'matches'}`,
  filteringNoMatches: 'No matches',
  filteringCantFindMatch: "We can't find a match.",
  clearFilterButtonText: 'Clear filter',
  columnBucketName: 'Name',
  columnBucketCreationDate: 'Creation date',
  columnBucketRegion: 'Region',
  columnObjectKey: 'Key',
  columnObjectLastModified: 'Last modified',
  columnObjectSize: 'Size',
  columnVersionID: 'Version ID',
  columnVersionLastModified: 'Last modified',
  columnVersionSize: 'Size',
  validationPathMustBegin: 'The path must begin with s3://',
  validationBucketLowerCase:
    'The bucket name must start with a lowercase character or number.',
  validationBucketMustNotContain:
    'The bucket name must not contain uppercase characters.',
  validationBucketMustComplyDns:
    'The bucket name must comply with DNS naming conventions',
  validationBucketLength: 'The bucket name must be from 3 to 63 characters.',
  labelSortedDescending: (columnName: string) =>
    `${columnName}, sorted descending`,
  labelSortedAscending: (columnName: string) =>
    `${columnName}, sorted ascending`,
  labelNotSorted: (columnName: string) => `${columnName}, not sorted`,
  labelsPagination: {
    nextPageLabel: 'Next page',
    previousPageLabel: 'Previous page',
    pageLabel: (pageNumber: any) => `Page ${pageNumber} of all pages`,
  },
  labelsBucketsSelection: {
    itemSelectionLabel: (data: any, item: any) => `${item.Name}`,
    selectionGroupLabel: 'Buckets',
  },
  labelsObjectsSelection: {
    itemSelectionLabel: (data: any, item: any) => `${item.Key}`,
    selectionGroupLabel: 'Objects',
  },
  labelsVersionsSelection: {
    itemSelectionLabel: (data: any, item: any) => `${item.LastModified}`,
    selectionGroupLabel: 'Versions',
  },
  labelFiltering: (itemsType: any) => `Find ${itemsType}`,
} as S3ResourceSelectorProps.I18nStrings;
