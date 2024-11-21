FROM registry.redhat.io/ubi9/ubi:9.5 as base

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV KRB5CCNAME=/tmp/cache

COPY docker/krb5.conf /etc/krb5.conf
COPY docker/install-certs.sh /install-certs.sh
COPY docker/auth.sh /auth.sh

RUN ./install-certs.sh $RH_CERT_URL \
    && yum update -y \
    && yum install -y wget git krb5-workstation \
    # Playwright dependencies
    libxcb libXdamage libXcursor libXext libXcomposite libXrandr \
    libXi pango cairo cairo-gobject libXrender gtk3 atk gdk-pixbuf2 \
    # NodeJS
    && yum module install -y nodejs:20/common \
    && yum clean all \
    && npm install -g yarn \
    && mkdir -p /krb5 \
    && chmod 755 /krb5 \
    && mkdir -p /var/lib/sss/pubconf/krb5.include.d \
    && chmod 755 /etc/krb5.conf.d \
    && chown -R 1001:0 /etc/krb5.conf.d \
    && chown 1001:0 /etc/krb5.conf \
    && chown -R 1001:0 /krb5 

FROM base as build

WORKDIR /app
ENV PLAYWRIGHT_BROWSERS_PATH=0

COPY --chown=1001 package.json /app/package.json
COPY --chown=1001 yarn.lock /app/yarn.lock
COPY --chown=1001 playwright.config.ts /app/playwright.config.ts
COPY --chown=1001 tsconfig.json /app/tsconfig.json
COPY --chown=1001 docker/krb5.conf.d /etc/krb5.conf.d
COPY --chown=1001 docker/krb5.keytab /krb5/krb5.keytab

RUN yarn install --frozen-lockfile \
    && yarn playwright install chromium firefox

COPY --chown=1001 . /app

USER 1001

CMD ["/bin/sh"]
