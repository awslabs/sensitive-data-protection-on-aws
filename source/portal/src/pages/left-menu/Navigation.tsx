import {
  SideNavigation,
  SideNavigationProps,
} from '@cloudscape-design/components';
import React from 'react';
import { RouterEnum } from 'routers/routerEnum';
import './style.scss';
import { useTranslation } from 'react-i18next';
import { buildDocLink } from 'ts/common';

interface INavigationProps {
  activeHref: string;
}

const Navigation: React.FC<INavigationProps> = (props: INavigationProps) => {
  const { activeHref } = props;
  const { t, i18n } = useTranslation();
  const navHeader = { text: t('solution.title'), href: RouterEnum.Home.path };
  const navItems: SideNavigationProps.Item[] = [
    { type: 'link', text: t('nav.summary'), href: RouterEnum.Home.path },
    {
      type: 'link',
      text: t('nav.connectDataSource'),
      href: RouterEnum.AccountManagement.path,
    },
    {
      type: 'link',
      text: t('nav.browserCatalog'),
      href: RouterEnum.Catalog.path,
    },
    {
      type: 'link',
      text: t('nav.runJob'),
      href: RouterEnum.Datajob.path,
    },
    {
      type: 'section',
      text: t('nav.classifiySetting'),
      items: [
        {
          type: 'link',
          text: t('nav.defineTemplate'),
          href: RouterEnum.Datatemplate.path,
        },
        {
          type: 'link',
          text: t('nav.manageIdentifier'),
          href: RouterEnum.TemplateIdentifiers.path,
        },
      ],
    },
    { type: 'divider' },
    {
      type: 'link',
      text: t('nav.doc'),
      href: buildDocLink(i18n.language),
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
