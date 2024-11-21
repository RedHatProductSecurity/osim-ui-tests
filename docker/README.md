# OSIM UI + Kerberos Tests Container 

This is the container that is used to run the tests on the CI/CD pipeline. It is based on redhat's ubi9 image and has the necessary dependencies to run the tests.

## Building the container
Before building the container, you need to prepare some files.

1. Create a `krb5.keytab` file in the `docker` directory. This file is used to authenticate with kerberos.
```bash
$ ktutil
ktutil:  addent -password -p <principal> -k 1 -e aes256-cts-hmac-sha1-96 -f
ktutil:  wkt krb5.keytab
ktutil:  quit
```
2. Create a `crypto-policies` file in the `krb5.conf.d` directory. You should have this file in `/etc/krb5.conf.d/` or `/usr/bin/krb5-conf/` on your machine.


3. Provide the correct realm configuration in a file inside the `krb5.conf.d` directory. You should have this file in `/etc/krb5.conf` on your machine.


That should look like this:
```bash
|-- docker
|   |-- krb5.conf.d
|   |   |-- crypto-policies
|   |   |-- realm # name of the file is not important
|   |-- krb5.keytab
|   |-- krb5.conf
|   |-- Dockerfile
```

After preparing the files, you can build the container using the following command:

> [!IMPORTANT]
> Make sure to run the command from the root of the project.
> (outside of the docker folder)

```bash
podman build -t osim-ui-tests -f docker/Dockerfile --ignorefile docker/.dockerignore .
# to install RH certificates add --env RH_CERT_URL=<url> to the command
```

## Running the container
Make sure to provide the required [environment variables](/README.md#required-environment-variables) when running the container:

```bash
podman run --rm -it --env-file .env osim-ui-tests
```

## Running the tests

You need to authenticate with kerberos before running the tests. You can do this by running the script **inside the container**:

```bash
sh /auth.sh
```

After authenticating, you can run the tests using the following command:

```bash
yarn test
```
