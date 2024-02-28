#!/bin/sh

wrote=false

function write_domain_name(){
	# In the lambda environment, except for tmp, everything is read-only
	wrote=true
	csp="        add_header Content-Security-Policy \"default-src 'self' $1; img-src 'self' blob: data: ; style-src 'self' blob: data:; font-src 'self' blob: data:; script-src 'self';\";"
	echo $csp > /tmp/CustomDomainName.conf
}
if [ -n "$CustomDomainName" ]; then
	write_domain_name $CustomDomainName
else
	if [ -n "$OidcIssuer" ]; then
		# Due to the need to access external networks to obtain authorization_endpoint, the openid configuration is not parsed.
		domain_name=$(echo "$OidcIssuer" | sed -n 's/^\(.*\:\/\/\)\([^\/]*\).*/\2/p')
		build_in_domain_names="okta.com authing.cn amazoncognito.com amazonaws.com"
		IFS=' '
		exist=false
		for build_in_domain_name in $build_in_domain_names; do
			if [[ $domain_name == *"$build_in_domain_name"* ]]; then
				exist=true
				break
			fi
		done
		if [ "$exist" = false ]; then
			sub_domain_name=$(echo "$domain_name" | awk -F'.' '{print $(NF-1)"."$NF}')
			wildcard="*.$sub_domain_name"
			write_domain_name $wildcard
		fi
	fi
fi
if [ "$wrote" = false ]; then
	write_domain_name "*.okta.com *.authing.cn *.amazoncognito.com *.amazonaws.com"
fi
nginx -g "daemon off;"
