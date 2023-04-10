import { BreadcrumbGroup } from '@cloudscape-design/components';
import React from 'react';

type BreadCrumbType = {
  text: string;
  href: string;
};

interface ICustomBreadCrumbProps {
  breadcrumbItems: BreadCrumbType[];
}

const CustomBreadCrumb: React.FC<ICustomBreadCrumbProps> = (
  props: ICustomBreadCrumbProps
) => {
  const { breadcrumbItems } = props;
  return (
    <BreadcrumbGroup
      items={breadcrumbItems}
      expandAriaLabel="Show path"
      ariaLabel="Breadcrumbs"
    />
  );
};

export default CustomBreadCrumb;
