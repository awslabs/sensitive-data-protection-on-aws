import {
  SideNavigation,
  SideNavigationProps,
} from '@cloudscape-design/components';
import React from 'react';
import { RouterEnum } from 'routers/routerEnum';
import './style.scss';

interface INavigationProps {
  activeHref: string;
}

const Navigation: React.FC<INavigationProps> = (props: INavigationProps) => {
  const { activeHref } = props;
  const navHeader = { text: 'AWS Solution', href: RouterEnum.Home.path };
  const navItems: SideNavigationProps.Item[] = [
    { type: 'link', text: 'Summary', href: RouterEnum.Home.path },
    {
      type: 'link',
      text: 'Connect to data source',
      href: RouterEnum.AccountManagement.path,
    },
    {
      type: 'link',
      text: 'Browse data catalogs',
      href: RouterEnum.Catalog.path,
    },
    {
      type: 'link',
      text: 'Run sensitive data discovery jobs',
      href: RouterEnum.Datajob.path,
    },
    {
      type: 'section',
      text: '     Classification settings',
      items: [
        {
          type: 'link',
          text: 'Define classification template',
          href: RouterEnum.Datatemplate.path,
        },
        {
          type: 'link',
          text: 'Manage data identifiers',
          href: RouterEnum.TemplateIdentifiers.path,
        },
      ],
    },
    { type: 'divider' },
    {
      type: 'link',
      text: 'Documentation',
      href: 'https://github.com/awslabs/sensitive-data-protection-on-aws',
      external: true,
    },
  ];
  return (
    <>
      <SideNavigation
        header={navHeader}
        items={navItems}
        activeHref={activeHref}
        className="side-nav"
      />
    </>
  );
};

export default Navigation;
