declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JIRA_API_KEY: string;
      BUGZILLA_API_KEY: string;
      JIRA_USERNAME: string;
      OSIDB_URL: string;
      OSIM_URL: string;
    }
  }
}

export {};
