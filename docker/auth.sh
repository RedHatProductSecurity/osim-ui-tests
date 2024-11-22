#!/bin/sh

principal="$( klist -kt /krb5/krb5.keytab | grep -Eo -m1 '\w+@[A-Z.]+' )"

kinit -k -t /krb5/krb5.keytab $principal
klist -c /tmp/cache
