import React, { useState, useEffect } from 'react';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import './style.scss';
import { AmplifyConfigType, AppSyncAuthType } from 'ts/types';
import { AMPLIFY_CONFIG_JSON } from 'ts/common';
import { User } from 'oidc-client-ts';
import { RouterEnum } from 'routers/routerEnum';

interface LayoutHeaderProps {
  user: any;
  signOut: any;
}

const LayoutHeader: React.FC<LayoutHeaderProps> = ({
  user,
  signOut,
}: LayoutHeaderProps) => {
  const [fullLogoutUrl, setFullLogoutUrl] = useState('');
  const [oidcStorageId, setOidcStorageId] = useState('');

  useEffect(() => {
    const configJSONObj: AmplifyConfigType = localStorage.getItem(
      AMPLIFY_CONFIG_JSON
    )
      ? JSON.parse(localStorage.getItem(AMPLIFY_CONFIG_JSON) || '')
      : {};

    if (configJSONObj.aws_authenticationType === AppSyncAuthType.OPEN_ID) {
      const idToken =
        process.env.REACT_APP_ENV === 'local' ||
        process.env.REACT_APP_ENV === 'development'
          ? ''
          : User.fromStorageString(
              localStorage.getItem(
                `oidc.user:${configJSONObj.aws_oidc_issuer}:${configJSONObj.aws_oidc_client_id}`
              ) || ''
            )?.id_token;
      setFullLogoutUrl(
        `${
          configJSONObj.aws_oidc_logout_endpoint
        }?id_token_hint=${idToken}&post_logout_redirect_uri=${
          configJSONObj.aws_oidc_customer_domain || configJSONObj.aws_alb_url
        }`
      );
      setOidcStorageId(
        `oidc.user:${configJSONObj.aws_oidc_issuer}:${configJSONObj.aws_oidc_client_id}`
      );
    }
  }, []);

  return (
    <TopNavigation
      className="top-navigation"
      identity={{
        href: RouterEnum.Home.path,
        title: 'Sensitive Data Protection Solution',
      }}
      utilities={[
        {
          type: 'menu-dropdown',
          text: user?.profile?.email,
          description: user?.profile?.email,
          iconName: 'user-profile',
          items: [
            {
              id: 'support-group',
              text: 'Support',
              items: [
                {
                  id: 'documentation',
                  text: 'Documentation',
                  href: 'https://github.com/awslabs/sensitive-data-protection-on-aws',
                  external: true,
                  externalIconAriaLabel: ' (opens in new tab)',
                },
                { id: 'support', text: 'Support' },
              ],
            },
            { id: 'signout', text: 'Sign out' },
          ],
          onItemClick: (item) => {
            if (item.detail.id === 'signout') {
              if (oidcStorageId && fullLogoutUrl) {
                localStorage.removeItem(oidcStorageId);
                window.location.href = fullLogoutUrl;
              }
            }
          },
        },
      ]}
      i18nStrings={{
        searchIconAriaLabel: 'Search',
        searchDismissIconAriaLabel: 'Close search',
        overflowMenuTriggerText: 'More',
        overflowMenuTitleText: 'All',
        overflowMenuBackIconAriaLabel: 'Back',
        overflowMenuDismissIconAriaLabel: 'Close menu',
      }}
    />
  );
};

export default LayoutHeader;
