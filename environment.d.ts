declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JIRA_API_KEY: string;
      BUGZILLA_API_KEY: string;
      JIRA_USERNAME: string;
      OSIDB_URL: string;
      OSIM_URL: string;
      // Optional: for credentials auth (alternative to Kerberos)
      OSIM_USERNAME?: string;
      OSIM_PASSWORD?: string;
    }
  }
}

export {};
