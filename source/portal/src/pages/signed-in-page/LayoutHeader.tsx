import React, { useState, useEffect } from 'react';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import './style.scss';
import { AmplifyConfigType } from 'ts/types';
import { AMPLIFY_CONFIG_JSON, buildDocLink, buildCommitLink, SDPS_DEBUG_MODE } from 'ts/common';
import { RouterEnum } from 'routers/routerEnum';
import { useTranslation } from 'react-i18next';

interface LayoutHeaderProps {
  user: any;
  signOut: any;
}

const ZH_TEXT = '简体中文';
const EN_TEXT = 'English(US)';
const ZH_LANGUAGE_LIST = ['zh', 'zh-cn', 'zh_CN', 'zh-CN'];
const EN_LANGUAGE_LIST = ['en', 'en-US', 'en_UK'];
const LANGUAGE_ITEMS = [
  { id: 'en', text: EN_TEXT },
  { id: 'zh', text: ZH_TEXT },
];

const LayoutHeader: React.FC<LayoutHeaderProps> = ({
  user,
  signOut,
}: LayoutHeaderProps) => {
  const { t, i18n } = useTranslation();
  const [fullLogoutUrl, setFullLogoutUrl] = useState('');
  const [oidcStorageId, setOidcStorageId] = useState('');
  const originConfig = localStorage.getItem(AMPLIFY_CONFIG_JSON);
  const configData: AmplifyConfigType = JSON.parse(originConfig || '{}');
  const [displayName, setDisplayName] = useState('');
  const [debugMode, setDebugMode] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  useEffect(() => {
    if (ZH_LANGUAGE_LIST.includes(i18n.language)) {
      changeLanguage('zh');
    }
    if (EN_LANGUAGE_LIST.includes(i18n.language)) {
      changeLanguage('en');
    }

    const configJSONObj: AmplifyConfigType = localStorage.getItem(
      AMPLIFY_CONFIG_JSON
    )
      ? JSON.parse(localStorage.getItem(AMPLIFY_CONFIG_JSON) || '')
      : {};
    if (configJSONObj.aws_oidc_logout) {
      const redirectUrl = configJSONObj.aws_oidc_customer_domain
        ? configJSONObj.aws_oidc_customer_domain.replace('/logincallback', '')
        : 'https://' + configData.aws_alb_url;
      const queryParams = new URLSearchParams({
        client_id: configJSONObj.aws_oidc_client_id,
        id_token_hint: user?.id_token,
        logout_uri: redirectUrl,
        redirect_uri: redirectUrl,
        response_type: 'code',
        post_logout_redirect_uri: redirectUrl,
      });
      const logoutUrl = new URL(configJSONObj.aws_oidc_logout);
      logoutUrl.search = queryParams.toString();
      setFullLogoutUrl(decodeURIComponent(logoutUrl.toString()));
      setOidcStorageId(
        `oidc.user:${configJSONObj.aws_oidc_issuer}:${configJSONObj.aws_oidc_client_id}`
      );
    }
  }, []);

  useEffect(() => {
    setDisplayName(
      user?.profile?.email ||
        user?.profile?.name ||
        user?.profile?.preferred_username ||
        user?.profile?.nickname ||
        user?.profile?.sub ||
        ''
    );
  }, [user]);

  return (
    <TopNavigation
      className="top-navigation"
      identity={{
        href: RouterEnum.Home.path,
        title: t('solution.name') || '',
      }}
      utilities={[
        {
          type: 'menu-dropdown',
          text: ZH_LANGUAGE_LIST.includes(i18n.language) ? ZH_TEXT : EN_TEXT,
          title: 'Language',
          ariaLabel: 'settings',
          onItemClick: (item) => {
            changeLanguage(item.detail.id);
          },
          items:
            i18n.language === 'zh' ? LANGUAGE_ITEMS.reverse() : LANGUAGE_ITEMS,
        },
        {
          type: 'menu-dropdown',
          text: displayName,
          description: displayName,
          iconName: 'user-profile',
          items: [
            {
              id: 'support-group',
              // text: t('header.support') || '',
              items: [
                {
                  id: 'documentation',
                  text: t('header.doc') || '',
                  href: buildDocLink(i18n.language),
                  external: true,
                },
                {
                  id: 'version',
                  text: t('header.version') + ' @TEMPLATE_BUILD_VERSION@',
                  href: buildCommitLink('@TEMPLATE_BUILD_VERSION@'),
                  // disabled: true,
                  // href: RouterEnum.TimeLine.path,
                },
                {
                  id: 'debug',
                  text: debugMode ? 'Mode : Debug' : 'Mode : Prod',
                },
              ],
            },
            { id: 'signout', text: t('header.signout') || '' },
          ],
          onItemClick: (item) => {
            if (item.detail.id === 'signout') {
              localStorage.removeItem(oidcStorageId);
              localStorage.removeItem(AMPLIFY_CONFIG_JSON);
              if (fullLogoutUrl) {
                signOut?.();
                window.location.href = fullLogoutUrl;
              } else {
                signOut?.();
              }
            }
            if (item.detail.id === 'debug') {
              setDebugMode(!debugMode);
              localStorage.setItem(SDPS_DEBUG_MODE, debugMode.toString());
            }
          },
        },
      ]}
      i18nStrings={{
        searchIconAriaLabel: t('menu.search') || '',
        searchDismissIconAriaLabel: t('menu.closeSearch') || '',
        overflowMenuTriggerText: t('menu.more') || '',
        overflowMenuTitleText: t('menu.all') || '',
        overflowMenuBackIconAriaLabel: t('menu.back') || '',
        overflowMenuDismissIconAriaLabel: t('menu.closeMenu') || '',
      }}
    />
  );
};

export default LayoutHeader;
